namespace Portal.Api.Domain;

// Conta de login central do ecossistema — mesmo padrão de segurança do
// SIGA (SenhaHash nunca guarda a senha em texto puro, ver Services/SenhaHasher.cs).
public class Usuario
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string NomeUsuario { get; set; } = string.Empty;

    public string SenhaHash { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    // Caminho relativo do arquivo em disco (ver Services/ArmazenamentoArquivos.cs)
    // — nunca o nome enviado no upload, sempre um GUID novo, então não há
    // risco de path traversal. Sem foto, fica null.
    public string? FotoPath { get; set; }

    // Mesmo mecanismo do SIGA: true logo após criar a conta ou redefinir a
    // senha; o middleware em Program.cs bloqueia tudo além de alterar-senha
    // enquanto for true.
    public bool TrocaSenhaObrigatoria { get; set; }

    // Papel de administração do Portal em si (gerenciar usuários e o
    // catálogo de sistemas) — não confundir com SistemaPapeis abaixo.
    public ICollection<Papel> Papeis { get; set; } = new List<Papel>();

    // Acesso a sistemas do ecossistema, com o papel dentro de cada um —
    // dá pra ter, por exemplo, Administrador no SIGA e Consulta em outro
    // sistema ao mesmo tempo. Ter algum SistemaPapel de um sistema X é o
    // que significa "pode abrir o sistema X" (não existe mais uma lista
    // separada de sistemas liberados).
    public ICollection<SistemaPapel> SistemaPapeis { get; set; } = new List<SistemaPapel>();
}
