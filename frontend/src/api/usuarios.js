import { apiFetch } from "./client";

export function listarUsuarios() {
  return apiFetch("/api/usuarios");
}

export function criarUsuario(dados) {
  return apiFetch("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarUsuario(id, dados) {
  return apiFetch(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function desativarUsuario(id) {
  return apiFetch(`/api/usuarios/${id}/desativar`, { method: "POST" });
}

export function ativarUsuario(id) {
  return apiFetch(`/api/usuarios/${id}/ativar`, { method: "POST" });
}

export function redefinirSenha(id) {
  return apiFetch(`/api/usuarios/${id}/redefinir-senha`, { method: "POST" });
}
