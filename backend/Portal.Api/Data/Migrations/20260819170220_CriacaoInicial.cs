using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoInicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "papel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_papel", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sistema",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    UrlBase = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistema", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "usuario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    NomeUsuario = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    SenhaHash = table.Column<string>(type: "TEXT", nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false),
                    TrocaSenhaObrigatoria = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuario", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sistema_papel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SistemaId = table.Column<int>(type: "INTEGER", nullable: false),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistema_papel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sistema_papel_sistema_SistemaId",
                        column: x => x.SistemaId,
                        principalTable: "sistema",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usuario_papel",
                columns: table => new
                {
                    PapeisId = table.Column<int>(type: "INTEGER", nullable: false),
                    UsuariosId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuario_papel", x => new { x.PapeisId, x.UsuariosId });
                    table.ForeignKey(
                        name: "FK_usuario_papel_papel_PapeisId",
                        column: x => x.PapeisId,
                        principalTable: "papel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_usuario_papel_usuario_UsuariosId",
                        column: x => x.UsuariosId,
                        principalTable: "usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usuario_sistema_papel",
                columns: table => new
                {
                    SistemaPapeisId = table.Column<int>(type: "INTEGER", nullable: false),
                    UsuariosId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuario_sistema_papel", x => new { x.SistemaPapeisId, x.UsuariosId });
                    table.ForeignKey(
                        name: "FK_usuario_sistema_papel_sistema_papel_SistemaPapeisId",
                        column: x => x.SistemaPapeisId,
                        principalTable: "sistema_papel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_usuario_sistema_papel_usuario_UsuariosId",
                        column: x => x.UsuariosId,
                        principalTable: "usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_papel_Nome",
                table: "papel",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistema_Nome",
                table: "sistema",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistema_papel_SistemaId_Nome",
                table: "sistema_papel",
                columns: new[] { "SistemaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuario_NomeUsuario",
                table: "usuario",
                column: "NomeUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuario_papel_UsuariosId",
                table: "usuario_papel",
                column: "UsuariosId");

            migrationBuilder.CreateIndex(
                name: "IX_usuario_sistema_papel_UsuariosId",
                table: "usuario_sistema_papel",
                column: "UsuariosId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "usuario_papel");

            migrationBuilder.DropTable(
                name: "usuario_sistema_papel");

            migrationBuilder.DropTable(
                name: "papel");

            migrationBuilder.DropTable(
                name: "sistema_papel");

            migrationBuilder.DropTable(
                name: "usuario");

            migrationBuilder.DropTable(
                name: "sistema");
        }
    }
}
