namespace Portal.Api.DTOs;

public record UsuarioResponse(
    int Id,
    string Nome,
    string NomeUsuario,
    bool Ativo,
    string[] Papeis,
    int[] SistemaPapeisIds
);

public record UsuarioCreateRequest(
    string Nome,
    string NomeUsuario,
    int[] PapeisIds,
    int[] SistemaPapeisIds
);

public record UsuarioUpdateRequest(
    string Nome,
    string NomeUsuario,
    int[] PapeisIds,
    int[] SistemaPapeisIds
);

// A senha nunca vem da requisição: é sempre gerada aleatoriamente pelo
// servidor e devolvida uma única vez aqui — mesmo padrão do SIGA.
public record UsuarioCriadoResponse(UsuarioResponse Usuario, string SenhaGerada);

public record RedefinirSenhaResponse(string SenhaGerada);

public record PapelResponse(int Id, string Nome);
