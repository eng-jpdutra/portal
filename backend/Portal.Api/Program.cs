using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Portal.Api.Data;
using Portal.Api.Endpoints;
using Portal.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Origens liberadas vêm da configuração — nunca fixas no código. Sem
// nenhuma origem configurada, nada é liberado (CORS restritivo por padrão).
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origensPermitidas = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origensPermitidas.Length > 0)
        {
            policy.WithOrigins(origensPermitidas).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

builder.Services.AddDbContext<PortalDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (builder.Environment.IsDevelopment())
    {
        options.UseSqlite(connectionString ?? "Data Source=portal.db");
    }
    else
    {
        options.UseNpgsql(connectionString);
    }
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<TokenService>();

// Foto de perfil fica em disco (pasta configurável via Uploads:Diretorio)
// — o banco só guarda o caminho relativo (`FotoPath`), mesmo padrão do SIGA.
builder.Services.AddSingleton<ArmazenamentoArquivos>();

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
    ?? throw new InvalidOperationException("Configuração 'Jwt' ausente.");

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException(
        "Jwt:Key não configurada. Em dev, rode: dotnet user-secrets set \"Jwt:Key\" \"<chave-aleatoria-de-32+-caracteres>\".");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SomenteAdministrador", p => p.RequireRole("Administrador"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Mesmo mecanismo do SIGA: enquanto o claim de troca de senha obrigatória
// estiver no token, barra qualquer rota autenticada além de alterar-senha.
app.Use(async (context, next) =>
{
    var trocaObrigatoria = context.User.Identity?.IsAuthenticated == true
        && context.User.HasClaim(c => c.Type == TokenService.ClaimTrocaSenhaObrigatoria && c.Value == "true");

    if (trocaObrigatoria && !context.Request.Path.StartsWithSegments("/api/auth/alterar-senha"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { title = "Troque sua senha antes de continuar." });
        return;
    }

    await next();
});

app.MapAuthEndpoints();
app.MapSistemaEndpoints();
app.MapUsuarioEndpoints();
app.MapMeuPerfilEndpoints();

using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<PortalDbContext>();
    await SeedInicial.ExecutarAsync(db, criarAdminPadrao: app.Environment.IsDevelopment());
}

app.Run();
