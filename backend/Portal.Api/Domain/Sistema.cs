namespace Portal.Api.Domain;

// Um sistema cadastrado no ecossistema (SIGA, e futuramente outros). O
// portal só guarda o suficiente pra mostrar um card e levar o usuário
// pra lá — nenhum dado do sistema em si mora aqui.
public class Sistema
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public string UrlBase { get; set; } = string.Empty;

    // Soft delete: sistema fora do ar/descontinuado some da lista, sem
    // apagar o cadastro (mesma regra do resto do ecossistema).
    public bool Ativo { get; set; } = true;

    // Papéis que esse sistema declara (ex.: Administrador/Consulta no
    // SIGA) — cada sistema tem o seu vocabulário, o Portal não presume nada.
    public ICollection<SistemaPapel> Papeis { get; set; } = new List<SistemaPapel>();
}
