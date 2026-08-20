using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Portal.Api.Domain;

namespace Portal.Api.Services;

public class TokenService(IOptions<JwtOptions> jwtOptions)
{
    public const string ClaimTrocaSenhaObrigatoria = "trocaSenhaObrigatoria";

    // Um claim por (sistema, papel) que o usuário tem — formato
    // "NomeDoSistema:NomeDoPapel" (ex.: "SIGA:Administrador"). É assim
    // que um sistema do ecossistema vai poder um dia conferir, só lendo
    // o token, se esse usuário tem acesso e com qual papel — sem precisar
    // manter seu próprio cadastro de usuário/papel.
    public const string ClaimSistemaPapel = "sistemaPapel";

    private readonly JwtOptions _options = jwtOptions.Value;

    public (string Token, DateTime ExpiraEm) GerarToken(Usuario usuario)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, usuario.NomeUsuario),
            new(ClaimTypes.Name, usuario.Nome),
        };
        claims.AddRange(usuario.Papeis.Select(p => new Claim(ClaimTypes.Role, p.Nome)));
        claims.AddRange(usuario.SistemaPapeis
            .Where(sp => sp.Sistema.Ativo)
            .Select(sp => new Claim(ClaimSistemaPapel, $"{sp.Sistema.Nome}:{sp.Nome}")));

        if (usuario.TrocaSenhaObrigatoria)
            claims.Add(new Claim(ClaimTrocaSenhaObrigatoria, "true"));

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);
        var expiraEm = DateTime.UtcNow.AddMinutes(_options.ExpiracaoMinutos);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiraEm,
            signingCredentials: credenciais);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEm);
    }
}
