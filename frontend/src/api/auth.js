import { apiFetch } from "./client";

export function login(nomeUsuario, senha) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ nomeUsuario, senha }),
    skipAuthRedirect: true,
  });
}

export function alterarSenha(senhaAtual, novaSenha) {
  return apiFetch("/api/auth/alterar-senha", {
    method: "POST",
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}
