namespace Portal.Api.Services;

// Guarda a foto de perfil em disco, fora do controle de versão (pasta
// "uploads/", já no .gitignore) — o banco só grava o caminho relativo
// (`FotoPath`). Mesmo serviço/padrão do SIGA (ver SIGA/CLAUDE.md).
public class ArmazenamentoArquivos
{
    private static readonly HashSet<string> ExtensoesImagem =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png" };

    private const long TamanhoMaximoImagemBytes = 5 * 1024 * 1024; // 5 MB

    private readonly string _raiz;

    public ArmazenamentoArquivos(IConfiguration configuration, IWebHostEnvironment ambiente)
    {
        var diretorio = configuration["Uploads:Diretorio"] ?? "uploads";
        _raiz = Path.IsPathRooted(diretorio) ? diretorio : Path.Combine(ambiente.ContentRootPath, diretorio);
    }

    public bool ImagemValida(IFormFile arquivo, out string? erro)
    {
        var extensao = Path.GetExtension(arquivo.FileName);
        if (!ExtensoesImagem.Contains(extensao))
        {
            erro = "Formato não permitido. Envie JPG ou PNG.";
            return false;
        }

        if (arquivo.Length > TamanhoMaximoImagemBytes)
        {
            erro = $"O arquivo não pode passar de {TamanhoMaximoImagemBytes / (1024 * 1024)} MB.";
            return false;
        }

        erro = null;
        return true;
    }

    // Nome do arquivo em disco é sempre um GUID gerado aqui — nunca o nome
    // que veio do upload — então não há risco de path traversal.
    public async Task<string> SalvarAsync(IFormFile arquivo, string subpasta)
    {
        var pastaCompleta = Path.Combine(_raiz, subpasta);
        Directory.CreateDirectory(pastaCompleta);

        var extensao = Path.GetExtension(arquivo.FileName);
        var nomeArquivo = $"{Guid.NewGuid():N}{extensao}";
        var caminhoCompleto = Path.Combine(pastaCompleta, nomeArquivo);

        await using var stream = File.Create(caminhoCompleto);
        await arquivo.CopyToAsync(stream);

        return Path.Combine(subpasta, nomeArquivo).Replace('\\', '/');
    }

    public void Remover(string? caminhoRelativo)
    {
        if (string.IsNullOrWhiteSpace(caminhoRelativo)) return;

        var caminhoCompleto = ObterCaminhoCompleto(caminhoRelativo);
        if (File.Exists(caminhoCompleto)) File.Delete(caminhoCompleto);
    }

    public string ObterCaminhoCompleto(string caminhoRelativo) => Path.Combine(_raiz, caminhoRelativo);

    public bool Existe(string? caminhoRelativo) =>
        !string.IsNullOrWhiteSpace(caminhoRelativo) && File.Exists(ObterCaminhoCompleto(caminhoRelativo));
}
