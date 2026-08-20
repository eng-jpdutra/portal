namespace Portal.Api.DTOs;

public record LoginRequest(string NomeUsuario, string Senha);

// Um item por sistema que o usuário pode abrir, já com o papel que ele
// tem lá dentro (ex.: "Administrador" no SIGA) — é o que monta os cards
// do dashboard.
public record SistemaAcessoResponse(int SistemaId, string Nome, string? Descricao, string UrlBase, string Papel);

public record LoginResponse(
    string Token,
    DateTime ExpiraEm,
    string Nome,
    string NomeUsuario,
    string[] Papeis,
    bool TrocaSenhaObrigatoria,
    SistemaAcessoResponse[] Sistemas,
    bool TemFoto
);

public record AlterarSenhaRequest(string SenhaAtual, string NovaSenha);
