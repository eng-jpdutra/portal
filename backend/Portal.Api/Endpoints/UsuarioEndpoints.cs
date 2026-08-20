using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Portal.Api.Data;
using Portal.Api.Domain;
using Portal.Api.DTOs;
using Portal.Api.Services;

namespace Portal.Api.Endpoints;

public static class UsuarioEndpoints
{
    public static void MapUsuarioEndpoints(this IEndpointRouteBuilder app)
    {
        // Gerenciar contas e acesso a sistemas é sensível — só Administrador.
        var grupo = app.MapGroup("/api/usuarios").RequireAuthorization("SomenteAdministrador");

        grupo.MapGet("/", ListarAsync);
        grupo.MapPost("/", CriarAsync);
        grupo.MapPut("/{id:int}", AtualizarAsync);
        grupo.MapPost("/{id:int}/desativar", DesativarAsync);
        grupo.MapPost("/{id:int}/ativar", AtivarAsync);
        grupo.MapPost("/{id:int}/redefinir-senha", RedefinirSenhaAsync);

        app.MapGet("/api/papeis", async (PortalDbContext db) =>
        {
            var papeis = await db.Papeis.AsNoTracking().OrderBy(p => p.Nome).ToListAsync();
            return TypedResults.Ok(papeis.Select(p => new PapelResponse(p.Id, p.Nome)).ToArray());
        }).RequireAuthorization("SomenteAdministrador");
    }

    private static async Task<Ok<UsuarioResponse[]>> ListarAsync(PortalDbContext db)
    {
        var usuarios = await db.Usuarios.AsNoTracking()
            .Include(u => u.Papeis)
            .Include(u => u.SistemaPapeis)
            .OrderBy(u => u.Nome)
            .ToListAsync();

        return TypedResults.Ok(usuarios.Select(ParaResponse).ToArray());
    }

    private static async Task<Results<Created<UsuarioCriadoResponse>, ValidationProblem>> CriarAsync(
        PortalDbContext db, UsuarioCreateRequest request)
    {
        var erros = await ValidarAsync(db, request.Nome, request.NomeUsuario, request.PapeisIds, request.SistemaPapeisIds);
        if (erros.Count > 0) return TypedResults.ValidationProblem(erros);

        var papeis = await db.Papeis.Where(p => request.PapeisIds.Contains(p.Id)).ToListAsync();
        var sistemaPapeis = await db.SistemaPapeis.Where(sp => request.SistemaPapeisIds.Contains(sp.Id)).ToListAsync();

        var senhaGerada = GeradorSenha.Gerar();

        var usuario = new Usuario
        {
            Nome = request.Nome.Trim(),
            NomeUsuario = request.NomeUsuario.Trim(),
            SenhaHash = SenhaHasher.Hash(senhaGerada),
            Ativo = true,
            TrocaSenhaObrigatoria = true,
            Papeis = papeis,
            SistemaPapeis = sistemaPapeis,
        };
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/usuarios/{usuario.Id}", new UsuarioCriadoResponse(ParaResponse(usuario), senhaGerada));
    }

    private static async Task<Results<Ok<UsuarioResponse>, NotFound, ValidationProblem>> AtualizarAsync(
        PortalDbContext db, int id, UsuarioUpdateRequest request)
    {
        var usuario = await db.Usuarios.Include(u => u.Papeis).Include(u => u.SistemaPapeis)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return TypedResults.NotFound();

        var erros = await ValidarAsync(db, request.Nome, request.NomeUsuario, request.PapeisIds, request.SistemaPapeisIds, ignorarId: id);
        if (erros.Count > 0) return TypedResults.ValidationProblem(erros);

        var papeis = await db.Papeis.Where(p => request.PapeisIds.Contains(p.Id)).ToListAsync();
        var sistemaPapeis = await db.SistemaPapeis.Where(sp => request.SistemaPapeisIds.Contains(sp.Id)).ToListAsync();

        usuario.Nome = request.Nome.Trim();
        usuario.NomeUsuario = request.NomeUsuario.Trim();
        usuario.Papeis = papeis;
        usuario.SistemaPapeis = sistemaPapeis;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ParaResponse(usuario));
    }

    private static Task<Results<Ok<UsuarioResponse>, NotFound>> DesativarAsync(PortalDbContext db, int id) =>
        MudarStatusAsync(db, id, ativo: false);

    private static Task<Results<Ok<UsuarioResponse>, NotFound>> AtivarAsync(PortalDbContext db, int id) =>
        MudarStatusAsync(db, id, ativo: true);

    private static async Task<Results<Ok<UsuarioResponse>, NotFound>> MudarStatusAsync(PortalDbContext db, int id, bool ativo)
    {
        var usuario = await db.Usuarios.Include(u => u.Papeis).Include(u => u.SistemaPapeis)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return TypedResults.NotFound();

        usuario.Ativo = ativo;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ParaResponse(usuario));
    }

    private static async Task<Results<Ok<RedefinirSenhaResponse>, NotFound>> RedefinirSenhaAsync(PortalDbContext db, int id)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return TypedResults.NotFound();

        var senhaGerada = GeradorSenha.Gerar();
        usuario.SenhaHash = SenhaHasher.Hash(senhaGerada);
        usuario.TrocaSenhaObrigatoria = true;
        await db.SaveChangesAsync();

        return TypedResults.Ok(new RedefinirSenhaResponse(senhaGerada));
    }

    private static async Task<Dictionary<string, string[]>> ValidarAsync(
        PortalDbContext db, string nome, string nomeUsuario, int[] papeisIds, int[] sistemaPapeisIds, int? ignorarId = null)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(nome))
            erros["nome"] = ["Informe o nome."];

        if (string.IsNullOrWhiteSpace(nomeUsuario))
        {
            erros["nomeUsuario"] = ["Informe o nome de usuário."];
        }
        else
        {
            var normalizado = nomeUsuario.Trim().ToLower();
            var emUso = await db.Usuarios.AnyAsync(u =>
                u.NomeUsuario.ToLower() == normalizado && (ignorarId == null || u.Id != ignorarId));
            if (emUso) erros["nomeUsuario"] = ["Esse nome de usuário já está em uso."];
        }

        if (papeisIds is not null && papeisIds.Length > 0)
        {
            var existentes = await db.Papeis.CountAsync(p => papeisIds.Contains(p.Id));
            if (existentes != papeisIds.Distinct().Count())
                erros["papeisIds"] = ["Um ou mais papéis informados não existem."];
        }

        if (sistemaPapeisIds is not null && sistemaPapeisIds.Length > 0)
        {
            var selecionados = await db.SistemaPapeis
                .Where(sp => sistemaPapeisIds.Contains(sp.Id))
                .Select(sp => new { sp.Id, sp.SistemaId })
                .ToListAsync();

            if (selecionados.Count != sistemaPapeisIds.Distinct().Count())
                erros["sistemaPapeisIds"] = ["Um ou mais papéis de sistema informados não existem."];
            else if (selecionados.GroupBy(sp => sp.SistemaId).Any(g => g.Count() > 1))
                erros["sistemaPapeisIds"] = ["Escolha só um papel por sistema."];
        }

        return erros;
    }

    private static UsuarioResponse ParaResponse(Usuario u) => new(
        u.Id,
        u.Nome,
        u.NomeUsuario,
        u.Ativo,
        u.Papeis.Select(p => p.Nome).OrderBy(n => n).ToArray(),
        u.SistemaPapeis.Select(sp => sp.Id).ToArray()
    );
}
