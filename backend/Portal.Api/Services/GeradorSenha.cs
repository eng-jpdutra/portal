using System.Security.Cryptography;

namespace Portal.Api.Services;

// Senha temporária gerada ao criar um usuário ou redefinir a senha dele.
// Alfabeto sem caracteres ambíguos (0/O, 1/l/I) pra facilitar digitar a
// senha impressa/lida.
public static class GeradorSenha
{
    private const string Alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private const int Tamanho = 10;

    public static string Gerar()
    {
        Span<char> senha = stackalloc char[Tamanho];
        for (var i = 0; i < Tamanho; i++)
            senha[i] = Alfabeto[RandomNumberGenerator.GetInt32(Alfabeto.Length)];

        return new string(senha);
    }
}
