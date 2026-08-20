namespace Portal.Api.Domain;

// Só o papel Administrador existe por enquanto: quem gerencia o catálogo
// de sistemas e concede acesso a outros usuários. Acesso a um sistema em
// si é modelado por Sistema/UsuarioSistema, não por papel — o portal só
// decide "pode abrir ou não", quem manda dentro de cada sistema é o
// RBAC daquele próprio sistema (ex.: Administrador/Consulta do SIGA).
public class Papel
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
