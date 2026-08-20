import { createContext, useContext, useState } from "react";
import { login as loginApi } from "../api/auth";
import { salvarToken, limparToken, obterToken } from "../api/client";

const CHAVE_USUARIO = "portal_usuario";

const AuthContext = createContext(null);

function usuarioSalvo() {
  const bruto = localStorage.getItem(CHAVE_USUARIO);
  return bruto ? JSON.parse(bruto) : null;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioSalvo);

  // Compartilhado entre login e troca de senha obrigatória — as duas
  // rotas devolvem o mesmo formato (token novo + dados do usuário).
  function salvarSessao(resposta) {
    const dadosUsuario = {
      nome: resposta.nome,
      nomeUsuario: resposta.nomeUsuario,
      papeis: resposta.papeis,
      trocaSenhaObrigatoria: resposta.trocaSenhaObrigatoria,
      sistemas: resposta.sistemas,
      temFoto: resposta.temFoto,
    };

    salvarToken(resposta.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dadosUsuario));
    setUsuario(dadosUsuario);
  }

  // Chamado depois de trocar/remover a foto — não gera token novo (a foto
  // não vai no JWT), só atualiza a sessão local pro cabeçalho/perfil
  // refletirem na hora.
  function atualizarTemFoto(temFoto) {
    setUsuario((atual) => {
      if (!atual) return atual;
      const atualizado = { ...atual, temFoto };
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(atualizado));
      return atualizado;
    });
  }

  async function entrar(nomeUsuario, senha) {
    salvarSessao(await loginApi(nomeUsuario, senha));
  }

  function sair() {
    limparToken();
    localStorage.removeItem(CHAVE_USUARIO);
    setUsuario(null);
  }

  const autenticado = !!usuario && !!obterToken();

  return (
    <AuthContext.Provider value={{ usuario, autenticado, entrar, sair, salvarSessao, atualizarTemFoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de um AuthProvider.");
  return contexto;
}

export function usePodeEscrever() {
  const { usuario } = useAuth();
  return !!usuario?.papeis?.includes("Administrador");
}
