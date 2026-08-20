import { apiFetch } from "./client";

export function alterarFotoPerfil(arquivo) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  return apiFetch("/api/meu-perfil/foto", {
    method: "POST",
    body: formData,
  });
}

export function removerFotoPerfil() {
  return apiFetch("/api/meu-perfil/foto", { method: "DELETE" });
}
