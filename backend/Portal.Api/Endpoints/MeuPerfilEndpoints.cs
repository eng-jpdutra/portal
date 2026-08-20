using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Portal.Api.Data;
using Portal.Api.Services;

namespace Portal.Api.Endpoints;

public static class MeuPerfilEndpoints
{
    private const string Subpasta = "fotos-perfil";

    // Sempre a foto de quem está logado — nunca recebe um id de usuário na
    // rota, então não precisa de checagem extra de permissão além do login.
    public static void MapMeuPerfilEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/meu-perfil").RequireAuthorization();

        grupo.MapPost("/foto", AlterarFotoAsync).DisableAntiforgery();
        grupo.MapGet("/foto", ObterFotoAsync);
        grupo.MapDelete("/foto", RemoverFotoAsync);
    }

    private static async Task<Results<Ok<FotoPerfilResponse>, ValidationProblem, UnauthorizedHttpResult>> AlterarFotoAsync(
        PortalDbContext db, ArmazenamentoArquivos armazenamento, HttpContext http, IFormFile arquivo)
    {
        var usuario = await UsuarioLogadoAsync(db, http);
        if (usuario is null) return TypedResults.Unauthorized();

        if (!armazenamento.ImagemValida(arquivo, out var erro))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]> { ["arquivo"] = [erro!] });
        }

        armazenamento.Remover(usuario.FotoPath);
        usuario.FotoPath = await armazenamento.SalvarAsync(arquivo, Subpasta);
        await db.SaveChangesAsync();

        return TypedResults.Ok(new FotoPerfilResponse(true));
    }

    private static async Task<Results<PhysicalFileHttpResult, NotFound, UnauthorizedHttpResult>> ObterFotoAsync(
        PortalDbContext db, ArmazenamentoArquivos armazenamento, HttpContext http)
    {
        var usuario = await UsuarioLogadoAsync(db, http);
        if (usuario is null) return TypedResults.Unauthorized();

        if (usuario.FotoPath is null || !armazenamento.Existe(usuario.FotoPath))
            return TypedResults.NotFound();

        var caminhoCompleto = armazenamento.ObterCaminhoCompleto(usuario.FotoPath);
        var provider = new FileExtensionContentTypeProvider();
        var contentType = provider.TryGetContentType(caminhoCompleto, out var tipo) ? tipo : "application/octet-stream";

        return TypedResults.PhysicalFile(caminhoCompleto, contentType);
    }

    private static async Task<Results<NoContent, UnauthorizedHttpResult>> RemoverFotoAsync(
        PortalDbContext db, ArmazenamentoArquivos armazenamento, HttpContext http)
    {
        var usuario = await UsuarioLogadoAsync(db, http);
        if (usuario is null) return TypedResults.Unauthorized();

        armazenamento.Remover(usuario.FotoPath);
        usuario.FotoPath = null;
        await db.SaveChangesAsync();

        return TypedResults.NoContent();
    }

    private static async Task<Domain.Usuario?> UsuarioLogadoAsync(PortalDbContext db, HttpContext http)
    {
        var sub = http.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? http.User.FindFirstValue("sub");
        if (!int.TryParse(sub, out var id)) return null;

        return await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
    }
}

public record FotoPerfilResponse(bool TemFoto);
