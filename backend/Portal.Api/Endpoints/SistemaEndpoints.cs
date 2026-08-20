using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Portal.Api.Data;
using Portal.Api.Domain;
using Portal.Api.DTOs;

namespace Portal.Api.Endpoints;

public static class SistemaEndpoints
{
    public static void MapSistemaEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/sistemas").RequireAuthorization();

        // Ler o catálogo é permitido pra qualquer usuário logado (é o que
        // alimenta o dashboard e o formulário de usuários); mexer nele —
        // inclusive nos papéis de cada sistema — é só do Administrador.
        grupo.MapGet("/", ListarAsync);
        grupo.MapPost("/", CriarAsync).RequireAuthorization("SomenteAdministrador");
        grupo.MapPut("/{id:int}", AtualizarAsync).RequireAuthorization("SomenteAdministrador");
        grupo.MapPost("/{id:int}/desativar", DesativarAsync).RequireAuthorization("SomenteAdministrador");
        grupo.MapPost("/{id:int}/ativar", AtivarAsync).RequireAuthorization("SomenteAdministrador");

        grupo.MapPost("/{id:int}/papeis", CriarPapelAsync).RequireAuthorization("SomenteAdministrador");
        grupo.MapDelete("/{id:int}/papeis/{papelId:int}", RemoverPapelAsync).RequireAuthorization("SomenteAdministrador");
    }

    private static async Task<Ok<SistemaResponse[]>> ListarAsync(PortalDbContext db)
    {
        var sistemas = await db.Sistemas.AsNoTracking()
            .Include(s => s.Papeis)
            .OrderBy(s => s.Nome)
            .ToListAsync();
        return TypedResults.Ok(sistemas.Select(ParaResponse).ToArray());
    }

    private static async Task<Results<Created<SistemaResponse>, ValidationProblem>> CriarAsync(
        PortalDbContext db, SistemaCreateRequest request)
    {
        var erros = await ValidarAsync(db, request.Nome, request.UrlBase);
        if (erros.Count > 0) return TypedResults.ValidationProblem(erros);

        var sistema = new Sistema
        {
            Nome = request.Nome.Trim(),
            Descricao = request.Descricao,
            UrlBase = request.UrlBase.Trim(),
            Ativo = true,
        };
        db.Sistemas.Add(sistema);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/sistemas/{sistema.Id}", ParaResponse(sistema));
    }

    private static async Task<Results<Ok<SistemaResponse>, NotFound, ValidationProblem>> AtualizarAsync(
        PortalDbContext db, int id, SistemaUpdateRequest request)
    {
        var sistema = await db.Sistemas.Include(s => s.Papeis).FirstOrDefaultAsync(s => s.Id == id);
        if (sistema is null) return TypedResults.NotFound();

        var erros = await ValidarAsync(db, request.Nome, request.UrlBase, ignorarId: id);
        if (erros.Count > 0) return TypedResults.ValidationProblem(erros);

        sistema.Nome = request.Nome.Trim();
        sistema.Descricao = request.Descricao;
        sistema.UrlBase = request.UrlBase.Trim();
        await db.SaveChangesAsync();

        return TypedResults.Ok(ParaResponse(sistema));
    }

    private static Task<Results<Ok<SistemaResponse>, NotFound>> DesativarAsync(PortalDbContext db, int id) =>
        MudarStatusAsync(db, id, ativo: false);

    private static Task<Results<Ok<SistemaResponse>, NotFound>> AtivarAsync(PortalDbContext db, int id) =>
        MudarStatusAsync(db, id, ativo: true);

    private static async Task<Results<Ok<SistemaResponse>, NotFound>> MudarStatusAsync(PortalDbContext db, int id, bool ativo)
    {
        var sistema = await db.Sistemas.Include(s => s.Papeis).FirstOrDefaultAsync(s => s.Id == id);
        if (sistema is null) return TypedResults.NotFound();

        sistema.Ativo = ativo;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ParaResponse(sistema));
    }

    private static async Task<Results<Created<SistemaPapelResponse>, NotFound, ValidationProblem>> CriarPapelAsync(
        PortalDbContext db, int id, SistemaPapelCreateRequest request)
    {
        var sistema = await db.Sistemas.FirstOrDefaultAsync(s => s.Id == id);
        if (sistema is null) return TypedResults.NotFound();

        if (string.IsNullOrWhiteSpace(request.Nome))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["nome"] = ["Informe o nome do papel."],
            });
        }

        var normalizado = request.Nome.Trim().ToLower();
        var emUso = await db.SistemaPapeis.AnyAsync(sp => sp.SistemaId == id && sp.Nome.ToLower() == normalizado);
        if (emUso)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["nome"] = ["Esse sistema já tem um papel com esse nome."],
            });
        }

        var papel = new SistemaPapel { SistemaId = id, Nome = request.Nome.Trim() };
        db.SistemaPapeis.Add(papel);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/sistemas/{id}/papeis/{papel.Id}", new SistemaPapelResponse(papel.Id, papel.Nome));
    }

    private static async Task<Results<NoContent, NotFound>> RemoverPapelAsync(PortalDbContext db, int id, int papelId)
    {
        var papel = await db.SistemaPapeis.FirstOrDefaultAsync(sp => sp.Id == papelId && sp.SistemaId == id);
        if (papel is null) return TypedResults.NotFound();

        db.SistemaPapeis.Remove(papel);
        await db.SaveChangesAsync();

        return TypedResults.NoContent();
    }

    private static async Task<Dictionary<string, string[]>> ValidarAsync(
        PortalDbContext db, string nome, string urlBase, int? ignorarId = null)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(nome))
        {
            erros["nome"] = ["Informe o nome."];
        }
        else
        {
            var normalizado = nome.Trim().ToLower();
            var emUso = await db.Sistemas.AnyAsync(s =>
                s.Nome.ToLower() == normalizado && (ignorarId == null || s.Id != ignorarId));
            if (emUso) erros["nome"] = ["Já existe um sistema com esse nome."];
        }

        if (string.IsNullOrWhiteSpace(urlBase))
            erros["urlBase"] = ["Informe a URL do sistema."];

        return erros;
    }

    private static SistemaResponse ParaResponse(Sistema s) => new(
        s.Id, s.Nome, s.Descricao, s.UrlBase, s.Ativo,
        s.Papeis.Select(p => new SistemaPapelResponse(p.Id, p.Nome)).OrderBy(p => p.Nome).ToArray()
    );
}
