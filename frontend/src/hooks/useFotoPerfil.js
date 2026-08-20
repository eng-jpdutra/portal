import { useEffect, useState } from "react";
import { obterToken } from "../api/client";

const BASE_URL = import.meta.env.VITE_API_URL;

// A foto exige o token de autenticação (não dá pra usar <img src> puro,
// que não manda header nenhum) — busca o binário via fetch e transforma
// num blob URL local. `versao` força buscar de novo depois de trocar/
// remover a foto (o navegador não sabe que o conteúdo mudou sozinho).
export function useFotoPerfil(temFoto, versao = 0) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!temFoto) {
      setUrl(null);
      return;
    }

    let blobUrlAtual = null;
    let cancelado = false;

    async function buscar() {
      const token = obterToken();
      const response = await fetch(`${BASE_URL}/api/meu-perfil/foto`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok || cancelado) return;

      const blob = await response.blob();
      blobUrlAtual = window.URL.createObjectURL(blob);
      if (!cancelado) setUrl(blobUrlAtual);
    }

    buscar();

    return () => {
      cancelado = true;
      if (blobUrlAtual) window.URL.revokeObjectURL(blobUrlAtual);
    };
  }, [temFoto, versao]);

  return url;
}
