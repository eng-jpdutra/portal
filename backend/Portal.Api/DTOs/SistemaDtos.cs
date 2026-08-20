namespace Portal.Api.DTOs;

public record SistemaPapelResponse(int Id, string Nome);

public record SistemaResponse(int Id, string Nome, string? Descricao, string UrlBase, bool Ativo, SistemaPapelResponse[] Papeis);

public record SistemaCreateRequest(string Nome, string? Descricao, string UrlBase);

public record SistemaUpdateRequest(string Nome, string? Descricao, string UrlBase);

public record SistemaPapelCreateRequest(string Nome);
