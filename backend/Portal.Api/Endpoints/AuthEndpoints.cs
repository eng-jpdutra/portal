using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Portal.Api.Data;
using Portal.Api.Domain;
using Portal.Api.DTOs;
using Portal.Api.Services;

namespace Portal.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/auth");

        grupo.MapPost("/login", LoginAsync);
        grupo.MapPost("/alterar-senha", AlterarSenhaAsync).RequireAuthorization();
    }

    private static async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult>> LoginAsync(
        PortalDbContext db, TokenService tokenService, LoginRequest request)
    {
        var usuarioNormalizado = request.NomeUsuario.Trim().ToLower();

        var usuario = await db.Usuarios
            .Include(u => u.Papeis)
            .Include(u => u.SistemaPapeis).ThenInclude(sp => sp.Sistema)
            .FirstOrDefaultAsync(u => u.NomeUsuario.ToLower() == usuarioNormalizado && u.Ativo);

        // Mensagem genérica de propósito: não dá pra um invasor descobrir se
        // o usuário existe ou só a senha errou.
        if (usuario is null || !SenhaHasher.Confere(request.Senha, usuario.SenhaHash))
            return TypedResults.Unauthorized();

        var (token, expiraEm) = tokenService.GerarToken(usuario);
        return TypedResults.Ok(MontarResposta(usuario, token, expiraEm));
    }

    private static async Task<Results<Ok<LoginResponse>, ValidationProblem, UnauthorizedHttpResult>> AlterarSenhaAsync(
        PortalDbContext db, HttpContext http, TokenService tokenService, AlterarSenhaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NovaSenha) || request.NovaSenha.Length < 8)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["novaSenha"] = ["A senha precisa ter pelo menos 8 caracteres."],
            });
        }

        var usuarioId = UsuarioIdLogado(http);
        if (usuarioId is null) return TypedResults.Unauthorized();

        var usuario = await db.Usuarios
            .Include(u => u.Papeis)
            .Include(u => u.SistemaPapeis).ThenInclude(sp => sp.Sistema)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);
        if (usuario is null || !SenhaHasher.Confere(request.SenhaAtual, usuario.SenhaHash))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["senhaAtual"] = ["Senha atual incorreta."],
            });
        }

        usuario.SenhaHash = SenhaHasher.Hash(request.NovaSenha);
        usuario.TrocaSenhaObrigatoria = false;
        await db.SaveChangesAsync();

        var (token, expiraEm) = tokenService.GerarToken(usuario);
        return TypedResults.Ok(MontarResposta(usuario, token, expiraEm));
    }

    private static LoginResponse MontarResposta(Usuario usuario, string token, DateTime expiraEm)
    {
        var papeis = usuario.Papeis.Select(p => p.Nome).ToArray();

        // Um card por sistema; se por algum motivo a pessoa tiver mais de
        // um papel no mesmo sistema, mostra o primeiro (a tela de edição
        // não deixa configurar isso, mas o banco tecnicamente permitiria).
        var sistemas = usuario.SistemaPapeis
            .Where(sp => sp.Sistema.Ativo)
            .GroupBy(sp => sp.Sistema)
            .Select(g => new SistemaAcessoResponse(g.Key.Id, g.Key.Nome, g.Key.Descricao, g.Key.UrlBase, g.First().Nome))
            .ToArray();

        return new LoginResponse(
            token, expiraEm, usuario.Nome, usuario.NomeUsuario, papeis,
            usuario.TrocaSenhaObrigatoria, sistemas, usuario.FotoPath is not null);
    }

    private static int? UsuarioIdLogado(HttpContext http)
    {
        var sub = http.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? http.User.FindFirstValue("sub");
        return int.TryParse(sub, out var id) ? id : null;
    }
}
