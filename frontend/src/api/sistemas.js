import { apiFetch } from "./client";

export function listarSistemas() {
  return apiFetch("/api/sistemas");
}

export function criarSistema(dados) {
  return apiFetch("/api/sistemas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarSistema(id, dados) {
  return apiFetch(`/api/sistemas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function desativarSistema(id) {
  return apiFetch(`/api/sistemas/${id}/desativar`, { method: "POST" });
}

export function ativarSistema(id) {
  return apiFetch(`/api/sistemas/${id}/ativar`, { method: "POST" });
}

export function criarPapelSistema(sistemaId, nome) {
  return apiFetch(`/api/sistemas/${sistemaId}/papeis`, {
    method: "POST",
    body: JSON.stringify({ nome }),
  });
}

export function removerPapelSistema(sistemaId, papelId) {
  return apiFetch(`/api/sistemas/${sistemaId}/papeis/${papelId}`, { method: "DELETE" });
}
