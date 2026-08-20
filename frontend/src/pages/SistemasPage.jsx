import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataGrid } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  listarSistemas,
  criarSistema,
  atualizarSistema,
  desativarSistema,
  ativarSistema,
  criarPapelSistema,
  removerPapelSistema,
} from "../api/sistemas";

// Papéis só existem pra sistemas já cadastrados (a gente precisa do Id) —
// por isso essa seção só aparece ao editar, nunca ao criar.
function SecaoPapeis({ sistema }) {
  const queryClient = useQueryClient();
  const [novoPapel, setNovoPapel] = useState("");

  const criarMutation = useMutation({
    mutationFn: (nome) => criarPapelSistema(sistema.id, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistemas"] });
      setNovoPapel("");
    },
  });

  const removerMutation = useMutation({
    mutationFn: (papelId) => removerPapelSistema(sistema.id, papelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistemas"] }),
  });

  return (
    <Stack spacing={1.5}>
      <Divider textAlign="left">Papéis dentro do sistema</Divider>
      <Typography variant="body2" color="text.secondary">
        O que uma pessoa pode ser dentro de {sistema.nome} (ex.: Administrador, Consulta) — é o
        que aparece pra escolher na tela de Usuários.
      </Typography>

      {criarMutation.isError && <Alert severity="error">{criarMutation.error.message}</Alert>}

      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {sistema.papeis.map((p) => (
          <Chip
            key={p.id}
            label={p.nome}
            size="small"
            onDelete={() => removerMutation.mutate(p.id)}
            deleteIcon={<CloseIcon fontSize="small" />}
            disabled={removerMutation.isPending}
          />
        ))}
        {sistema.papeis.length === 0 && (
          <Typography variant="caption" color="text.secondary">Nenhum papel cadastrado ainda.</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label="Novo papel"
          value={novoPapel}
          onChange={(e) => setNovoPapel(e.target.value)}
          fullWidth
        />
        <Button
          variant="outlined"
          onClick={() => criarMutation.mutate(novoPapel)}
          disabled={!novoPapel.trim() || criarMutation.isPending}
        >
          Adicionar
        </Button>
      </Stack>
    </Stack>
  );
}

function DialogSistema({ aberto, onFechar, onSalvar, salvando, erro, sistemaEditando }) {
  const ehEdicao = !!sistemaEditando;

  const [nome, setNome] = useState(sistemaEditando?.nome ?? "");
  const [descricao, setDescricao] = useState(sistemaEditando?.descricao ?? "");
  const [urlBase, setUrlBase] = useState(sistemaEditando?.urlBase ?? "");

  const valido = nome.trim() && urlBase.trim();

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>{ehEdicao ? "Editar sistema" : "Novo sistema"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}

          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus required />
          <TextField
            label="URL"
            value={urlBase}
            onChange={(e) => setUrlBase(e.target.value)}
            required
            helperText="Endereço pra onde o card vai levar o usuário (ex.: http://localhost:5173)."
          />
          <TextField
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            multiline
            minRows={2}
          />

          {ehEdicao && <SecaoPapeis sistema={sistemaEditando} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => onSalvar({ nome, descricao: descricao || null, urlBase })}
          disabled={!valido || salvando}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SistemasPage() {
  const queryClient = useQueryClient();

  const [dialogSistema, setDialogSistema] = useState(null); // null | "novo" | sistema
  const [mensagem, setMensagem] = useState(null);

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["sistemas"],
    queryFn: listarSistemas,
  });

  // Mantém o diálogo sincronizado com a lista mais recente (pra refletir
  // papel adicionado/removido sem precisar fechar e reabrir).
  const sistemaEmEdicao =
    dialogSistema && dialogSistema !== "novo" ? data.find((s) => s.id === dialogSistema.id) ?? dialogSistema : dialogSistema;

  function invalidarEFechar(mensagemSucesso) {
    queryClient.invalidateQueries({ queryKey: ["sistemas"] });
    setDialogSistema(null);
    setMensagem({ tipo: "success", texto: mensagemSucesso });
  }

  const criarMutation = useMutation({
    mutationFn: criarSistema,
    onSuccess: () => invalidarEFechar("Sistema cadastrado com sucesso."),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }) => atualizarSistema(id, dados),
    onSuccess: () => invalidarEFechar("Sistema atualizado."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativar }) => (ativar ? ativarSistema(id) : desativarSistema(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistemas"] });
      setMensagem({ tipo: "success", texto: "Status atualizado." });
    },
    onError: (err) => setMensagem({ tipo: "error", texto: err.message }),
  });

  const colunas = [
    { field: "nome", headerName: "Nome", flex: 1 },
    { field: "descricao", headerName: "Descrição", flex: 1.5 },
    {
      field: "papeis",
      headerName: "Papéis",
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
          {params.value.map((p) => <Chip key={p.id} size="small" label={p.nome} />)}
        </Stack>
      ),
    },
    {
      field: "ativo",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? "Ativo" : "Inativo"}
          color={params.value ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "acoes",
      headerName: "",
      sortable: false,
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => setDialogSistema(params.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.ativo ? "Desativar" : "Ativar"}>
            <IconButton
              size="small"
              onClick={() => statusMutation.mutate({ id: params.row.id, ativar: !params.row.ativo })}
            >
              {params.row.ativo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sistemas
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setDialogSistema("novo")}>
          Novo sistema
        </Button>
      </Stack>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

      <Box sx={{ bgcolor: "background.paper" }}>
        <DataGrid
          autoHeight
          rows={data}
          columns={colunas}
          loading={isLoading}
          hideFooter
          disableColumnFilter
          disableRowSelectionOnClick
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-cell": { display: "flex", alignItems: "center", py: 1 },
            "& .MuiDataGrid-columnHeaderTitleContainer": { alignItems: "center" },
          }}
        />
      </Box>

      {sistemaEmEdicao && (
        <DialogSistema
          aberto
          sistemaEditando={sistemaEmEdicao === "novo" ? null : sistemaEmEdicao}
          salvando={criarMutation.isPending || atualizarMutation.isPending}
          erro={
            criarMutation.isError
              ? criarMutation.error.message
              : atualizarMutation.isError
                ? atualizarMutation.error.message
                : null
          }
          onFechar={() => setDialogSistema(null)}
          onSalvar={(dados) =>
            sistemaEmEdicao === "novo"
              ? criarMutation.mutate(dados)
              : atualizarMutation.mutate({ id: sistemaEmEdicao.id, dados })
          }
        />
      )}

      <Snackbar
        open={!!mensagem}
        autoHideDuration={4000}
        onClose={() => setMensagem(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {mensagem && <Alert severity={mensagem.tipo}>{mensagem.texto}</Alert>}
      </Snackbar>
    </Box>
  );
}
