namespace Portal.Api.Services;

// Ligado à seção "Jwt" da configuração. `Key` é segredo — nunca no
// appsettings versionado, só em user-secrets (dev) ou variável de
// ambiente (produção). Issuer/Audience/ExpiracaoMinutos não são segredo.
//
// IMPORTANTE: essa mesma chave (`Jwt:Key`) precisa ser compartilhada com
// os demais sistemas do ecossistema (SIGA incluso) — é o que permite um
// sistema confiar no token emitido pelo Portal sem chamar o Portal a
// cada requisição (ver docs/adr sobre login único, quando existir).
public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiracaoMinutos { get; set; } = 60;
}
