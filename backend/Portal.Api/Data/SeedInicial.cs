using Microsoft.EntityFrameworkCore;
using Portal.Api.Domain;
using Portal.Api.Services;

namespace Portal.Api.Data;

// Garante que o papel Administrador (do Portal) e o sistema SIGA (com os
// papéis que ele já tem hoje) já apareçam cadastrados; usuário
// administrador padrão só em desenvolvimento — mesma regra do SIGA
// (bootstrap de produção fica pra quando existir o processo de deploy).
public static class SeedInicial
{
    public const string UsuarioAdminPadrao = "admin";
    public const string SenhaAdminPadrao = "Trocar@123";

    public static async Task ExecutarAsync(PortalDbContext db, bool criarAdminPadrao)
    {
        if (!await db.Papeis.AnyAsync(p => p.Nome == "Administrador"))
            db.Papeis.Add(new Papel { Nome = "Administrador" });
        await db.SaveChangesAsync();

        // SIGA:5173 é a porta padrão do Vite em dev — ajustar quando
        // houver uma URL de produção de verdade. Os papéis espelham o
        // RBAC que o SIGA já tem hoje (ver SIGA/CLAUDE.md) — quando a
        // integração de verdade acontecer, o SIGA passa a ler esse papel
        // do token em vez de manter o próprio.
        var siga = await db.Sistemas.Include(s => s.Papeis).FirstOrDefaultAsync(s => s.Nome == "SIGA");
        if (siga is null)
        {
            siga = new Sistema
            {
                Nome = "SIGA",
                Descricao = "Sistema Integrado de Gestão de Ativos da Câmara Municipal",
                UrlBase = "http://localhost:5173",
                Ativo = true,
                Papeis =
                [
                    new SistemaPapel { Nome = "Administrador" },
                    new SistemaPapel { Nome = "Consulta" },
                ],
            };
            db.Sistemas.Add(siga);
            await db.SaveChangesAsync();
        }

        if (criarAdminPadrao && !await db.Usuarios.AnyAsync())
        {
            var papelAdmin = await db.Papeis.FirstAsync(p => p.Nome == "Administrador");
            var papelAdminSiga = siga.Papeis.First(p => p.Nome == "Administrador");

            db.Usuarios.Add(new Usuario
            {
                Nome = "Administrador",
                NomeUsuario = UsuarioAdminPadrao,
                SenhaHash = SenhaHasher.Hash(SenhaAdminPadrao),
                Ativo = true,
                Papeis = [papelAdmin],
                SistemaPapeis = [papelAdminSiga],
            });
            await db.SaveChangesAsync();
        }
    }
}
