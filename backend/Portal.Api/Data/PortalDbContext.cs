using Microsoft.EntityFrameworkCore;
using Portal.Api.Domain;

namespace Portal.Api.Data;

public class PortalDbContext : DbContext
{
    public PortalDbContext(DbContextOptions<PortalDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Papel> Papeis => Set<Papel>();
    public DbSet<Sistema> Sistemas => Set<Sistema>();
    public DbSet<SistemaPapel> SistemaPapeis => Set<SistemaPapel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuario");

            entity.Property(u => u.Nome).HasMaxLength(120).IsRequired();
            entity.Property(u => u.NomeUsuario).HasMaxLength(60).IsRequired();
            entity.Property(u => u.SenhaHash).IsRequired();
            entity.Property(u => u.FotoPath).HasMaxLength(255);

            entity.HasIndex(u => u.NomeUsuario).IsUnique();

            entity.HasMany(u => u.Papeis)
                .WithMany(p => p.Usuarios)
                .UsingEntity(j => j.ToTable("usuario_papel"));

            // Acesso a sistemas + papel dentro de cada um — ver comentário
            // em Domain/Usuario.cs.
            entity.HasMany(u => u.SistemaPapeis)
                .WithMany(sp => sp.Usuarios)
                .UsingEntity(j => j.ToTable("usuario_sistema_papel"));
        });

        modelBuilder.Entity<Papel>(entity =>
        {
            entity.ToTable("papel");
            entity.Property(p => p.Nome).HasMaxLength(50).IsRequired();
            entity.HasIndex(p => p.Nome).IsUnique();
        });

        modelBuilder.Entity<Sistema>(entity =>
        {
            entity.ToTable("sistema");
            entity.Property(s => s.Nome).HasMaxLength(100).IsRequired();
            entity.Property(s => s.Descricao).HasMaxLength(255);
            entity.Property(s => s.UrlBase).HasMaxLength(255).IsRequired();

            entity.HasIndex(s => s.Nome).IsUnique();
        });

        modelBuilder.Entity<SistemaPapel>(entity =>
        {
            entity.ToTable("sistema_papel");
            entity.Property(sp => sp.Nome).HasMaxLength(50).IsRequired();

            // Nome de papel único por sistema (dois sistemas podem os dois
            // ter um papel chamado "Administrador", sem conflito).
            entity.HasIndex(sp => new { sp.SistemaId, sp.Nome }).IsUnique();

            entity.HasOne(sp => sp.Sistema)
                .WithMany(s => s.Papeis)
                .HasForeignKey(sp => sp.SistemaId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
