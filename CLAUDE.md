# PORTAL — login único do ecossistema da Câmara

Sistema central de autenticação: um usuário faz login aqui e vê só os sistemas do
ecossistema (SIGA hoje, outros no futuro) que ele tem permissão de abrir. O Portal
não guarda dado de negócio de nenhum sistema — só identidade, catálogo de sistemas e
quem pode acessar o quê.

O responsável está começando na programação e mantém o projeto sozinho, junto com o
SIGA (ver `c:\Users\João Pedro\Documents\SIGA\CLAUDE.md`). **Explique as decisões** e
**prefira o caminho mais claro e sustentável** — sem abrir mão da segurança.

## Relação com o SIGA
- Mesma stack, mesmos padrões (ver seção Stack abaixo) — propositalmente, pra reduzir
  o que precisa ser aprendido de novo.
- **Integração de login implementada.** `Jwt:Key`/`Issuer`/`Audience` deste projeto
  são os **mesmos** do SIGA (e de qualquer sistema novo que entrar no ecossistema) —
  é isso que permite o SIGA validar um token emitido aqui sem nunca chamar o Portal.
  O SIGA não tem mais login/senha/foto próprios; ele só lê o claim `sistemaPapel`
  (`"SIGA:Administrador"`) do token pra saber quem é e com qual papel — ver
  `SIGA.Api/Services/SistemaPapelClaimsTransformation.cs`.
- **Como o handoff funciona:** o card de cada sistema no dashboard (`DashboardPage.jsx`)
  monta o link como `{urlBase}/sso?token={token}` — o token é o mesmo JWT que o login
  do Portal já emitiu, só repassado na URL. Cada sistema do ecossistema precisa ter
  uma rota `/sso` que lê esse `token` da query string e guarda como se fosse a
  própria sessão (ver `SIGA/frontend/src/pages/SsoPage.jsx` como referência de
  implementação pra sistemas novos).
- O portal não é dono de nenhuma tabela de negócio do SIGA (equipamento, local etc.)
  — só sabe que o sistema "SIGA" existe e quem pode abri-lo.

## Idioma
- Interface, mensagens ao usuário e comentários de código em **português do Brasil**.

---

## Stack
Igual ao SIGA — ver `SIGA/CLAUDE.md` pras razões de cada escolha. Resumo:
- **Frontend:** React + Vite, Material UI, React Router DOM, TanStack Query.
- **Backend:** C# .NET 8, Minimal APIs, DTOs explícitos, `Program.cs` enxuto com
  rotas em métodos de extensão por domínio (`Endpoints/*.cs`).
- **Persistência:** EF Core 8, Code First + Migrations. SQLite em dev, PostgreSQL em
  produção. Código agnóstico de provedor (sem SQL bruto, sem tipo específico de
  banco).
- **Segurança:** JWT, RBAC por papel (hoje só `Administrador` existe — quem gerencia
  usuários e o catálogo de sistemas). Senha só como hash (bcrypt). Senha temporária
  gerada ao criar conta/redefinir, com troca obrigatória no próximo login — mesmo
  mecanismo do SIGA (`TrocaSenhaObrigatoria`, middleware que bloqueia as demais rotas
  enquanto isso).

## Modelo de dados
- `usuario` — conta de login central: nome, `nome_usuario` (único), `senha_hash`,
  `ativo`, `troca_senha_obrigatoria`.
- `papel` / `usuario_papel` — papel de administração do **Portal em si** (hoje só
  `Administrador`, quem gerencia usuários e o catálogo de sistemas). Não confundir
  com `sistema_papel` abaixo.
- `sistema` — catálogo: nome, descrição, `url_base` (pra onde o portal leva o
  usuário), `ativo` (soft delete — sistema descontinuado some da lista sem apagar o
  cadastro).
- `sistema_papel` — os papéis que cada sistema declara ter (ex.: SIGA tem
  Administrador e Consulta). Cada sistema tem seu próprio vocabulário; o Portal não
  presume nenhum.
- `usuario_sistema_papel` — N-para-N entre usuário e `sistema_papel`: além de dizer
  que a pessoa pode abrir um sistema, diz **com qual papel** (ex.: Administrador no
  SIGA, Consulta em outro sistema, ao mesmo tempo). O token emitido no login carrega
  um claim `sistemaPapel` por combinação (`"SIGA:Administrador"`) — é isso que,
  quando a integração de verdade acontecer, cada sistema vai ler em vez de manter o
  próprio RBAC.
  - **Regra:** no máximo um papel por sistema por usuário (não faz sentido ser
    Administrador e Consulta do SIGA ao mesmo tempo — confirmado com o responsável
    do projeto). Hoje só validado em código (`UsuarioEndpoints.ValidarAsync`); ainda
    falta uma constraint de unicidade `(UsuarioId, SistemaId)` no banco pra isso não
    depender só do código não falhar (ver Evolução abaixo).

## Evolução (YAGNI — não implementar agora, mas não bloquear)
- **Constraint de unicidade** `(UsuarioId, SistemaId)` em `usuario_sistema_papel` —
  hoje a regra "um papel por sistema" só existe em código; reforçar no schema é mais
  seguro (o banco recusa mesmo se o código tiver um bug), mas exige uma coluna
  `SistemaId` desnormalizada na tabela de junção (hoje ela só tem `SistemaPapelId`,
  que implica o sistema indiretamente) ou um índice único calculado — avaliar a
  forma mais simples quando for implementar.
- Refresh token, rate limiting, observabilidade estruturada — mesma lista de
  adiados do SIGA, mesmo raciocínio.
- **Rotação de `Jwt:Key`** — hoje trocar a chave exige atualizar em todos os
  sistemas do ecossistema ao mesmo tempo (nada de rotação gradual/dupla-chave).
  Só vale resolver isso quando o número de sistemas realmente justificar.
