namespace Portal.Api.Domain;

// Papel dentro de um sistema específico (ex.: "Administrador" e "Consulta"
// no SIGA) — não confundir com Papel, que é o papel de administração do
// próprio Portal. Cada sistema declara os seus; o Portal não presume um
// vocabulário fixo, porque sistemas diferentes podem ter papéis diferentes.
public class SistemaPapel
{
    public int Id { get; set; }

    public int SistemaId { get; set; }

    public Sistema Sistema { get; set; } = null!;

    public string Nome { get; set; } = string.Empty;

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
