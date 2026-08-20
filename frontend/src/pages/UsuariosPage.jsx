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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Divider from "@mui/material/Divider";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  desativarUsuario,
  ativarUsuario,
  redefinirSenha,
} from "../api/usuarios";
import { listarPapeis } from "../api/papeis";
import { listarSistemas } from "../api/sistemas";

function SeletorMultiplo({ label, opcoes, selecionados, onChange }) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selecionados}
        onChange={(e) => onChange(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={(sel) => (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
            {sel.map((id) => (
              <Chip key={id} size="small" label={opcoes.find((o) => o.id === id)?.nome ?? id} />
            ))}
          </Stack>
        )}
      >
        {opcoes.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.nome}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// Um select por sistema, não um multi-select genérico — assim fica
// impossível escolher dois papéis pro mesmo sistema sem querer (a pessoa
// é Administrador OU Consulta no SIGA, nunca as duas ao mesmo tempo).
function SeletorPapelPorSistema({ sistemas, sistemaPapelIdPorSistema, onChange }) {
  return (
    <Stack spacing={2}>
      <Divider textAlign="left">Acesso por sistema</Divider>
      {sistemas.map((sistema) => (
        <FormControl key={sistema.id} fullWidth size="small">
          <InputLabel>{sistema.nome}</InputLabel>
          <Select
            label={sistema.nome}
            value={sistemaPapelIdPorSistema[sistema.id] ?? ""}
            onChange={(e) => onChange(sistema.id, e.target.value === "" ? null : e.target.value)}
          >
            <MenuItem value="">
              <em>Sem acesso</em>
            </MenuItem>
            {sistema.papeis.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Stack>
  );
}

function DialogUsuario({ aberto, onFechar, onSalvar, salvando, erro, papeis, sistemas, usuarioEditando }) {
  const ehEdicao = !!usuarioEditando;

  const [nome, setNome] = useState(usuarioEditando?.nome ?? "");
  const [nomeUsuario, setNomeUsuario] = useState(usuarioEditando?.nomeUsuario ?? "");
  const [papeisIds, setPapeisIds] = useState(
    usuarioEditando ? papeis.filter((p) => usuarioEditando.papeis.includes(p.nome)).map((p) => p.id) : []
  );

  // Deriva, a partir dos SistemaPapeisIds do usuário, qual papel está
  // selecionado em cada sistema — { [sistemaId]: sistemaPapelId }.
  const [sistemaPapelIdPorSistema, setSistemaPapelIdPorSistema] = useState(() => {
    const inicial = {};
    for (const sistema of sistemas) {
      const papelAtual = sistema.papeis.find((p) => usuarioEditando?.sistemaPapeisIds?.includes(p.id));
      if (papelAtual) inicial[sistema.id] = papelAtual.id;
    }
    return inicial;
  });

  function handleMudarSistema(sistemaId, sistemaPapelId) {
    setSistemaPapelIdPorSistema((atual) => {
      const novo = { ...atual };
      if (sistemaPapelId === null) delete novo[sistemaId];
      else novo[sistemaId] = sistemaPapelId;
      return novo;
    });
  }

  const handleSalvar = () =>
    onSalvar({ nome, nomeUsuario, papeisIds, sistemaPapeisIds: Object.values(sistemaPapelIdPorSistema) });

  const valido = nome.trim() && nomeUsuario.trim();

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>{ehEdicao ? "Editar usuário" : "Novo usuário"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}

          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus required />
          <TextField
            label="Usuário"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            required
            helperText="Usado para fazer login — sem espaços."
          />
          {!ehEdicao && (
            <Alert severity="info">
              Uma senha temporária será gerada automaticamente. O usuário precisará
              trocá-la no primeiro login.
            </Alert>
          )}
          <SeletorMultiplo label="Papéis do Portal" opcoes={papeis} selecionados={papeisIds} onChange={setPapeisIds} />
          <SeletorPapelPorSistema
            sistemas={sistemas}
            sistemaPapelIdPorSistema={sistemaPapelIdPorSistema}
            onChange={handleMudarSistema}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={handleSalvar} disabled={!valido || salvando}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogRedefinirSenha({ aberto, usuario, onFechar, onConfirmar, salvando, erro }) {
  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="xs">
      <DialogTitle>Redefinir senha</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <Typography variant="body2">
            Uma nova senha temporária será gerada para <strong>{usuario?.nome}</strong>. A senha
            atual deixa de funcionar e ele precisará trocá-la no próximo login.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirmar} disabled={salvando}>
          Redefinir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogExcluirUsuario({ aberto, usuario, onFechar, onConfirmar, salvando, erro }) {
  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="xs">
      <DialogTitle>Excluir usuário</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <Typography variant="body2">
            <strong>{usuario?.nome}</strong> perderá o acesso ao Portal e a todos os sistemas
            imediatamente. O registro não é apagado — fica marcado como inativo.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={onConfirmar} disabled={salvando}>
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogSenhaGerada({ senha, onFechar }) {
  return (
    <Dialog open={!!senha} onClose={onFechar} fullWidth maxWidth="xs">
      <DialogTitle>Senha temporária gerada</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">Anote agora — essa senha não será exibida de novo.</Alert>
          <TextField label="Senha temporária" value={senha ?? ""} InputProps={{ readOnly: true }} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onFechar}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsuariosPage() {
  const queryClient = useQueryClient();

  const [dialogUsuario, setDialogUsuario] = useState(null); // null | "novo" | usuario
  const [dialogSenhaPara, setDialogSenhaPara] = useState(null);
  const [dialogExcluirPara, setDialogExcluirPara] = useState(null);
  const [senhaGerada, setSenhaGerada] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const { data: papeis = [] } = useQuery({ queryKey: ["papeis"], queryFn: listarPapeis });
  const { data: sistemas = [] } = useQuery({ queryKey: ["sistemas"], queryFn: listarSistemas });
  const { data: usuarios = [], isLoading, isError, error } = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios });

  function invalidarEFechar(mensagemSucesso) {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    setDialogUsuario(null);
    setDialogSenhaPara(null);
    setMensagem({ tipo: "success", texto: mensagemSucesso });
  }

  function invalidarEMostrarSenha(senha) {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    setDialogUsuario(null);
    setDialogSenhaPara(null);
    setSenhaGerada(senha);
  }

  const criarMutation = useMutation({
    mutationFn: criarUsuario,
    onSuccess: (resposta) => invalidarEMostrarSenha(resposta.senhaGerada),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }) => atualizarUsuario(id, dados),
    onSuccess: () => invalidarEFechar("Usuário atualizado."),
  });

  const ativarMutation = useMutation({
    mutationFn: (id) => ativarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setMensagem({ tipo: "success", texto: "Usuário reativado." });
    },
    onError: (err) => setMensagem({ tipo: "error", texto: err.message }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id) => desativarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDialogExcluirPara(null);
      setMensagem({ tipo: "success", texto: "Usuário excluído." });
    },
  });

  const redefinirSenhaMutation = useMutation({
    mutationFn: (id) => redefinirSenha(id),
    onSuccess: (resposta) => invalidarEMostrarSenha(resposta.senhaGerada),
  });

  const colunas = [
    { field: "nome", headerName: "Nome", flex: 1 },
    { field: "nomeUsuario", headerName: "Usuário", flex: 1 },
    {
      field: "papeis",
      headerName: "Papéis",
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
          {params.value.map((p) => <Chip key={p} size="small" label={p} />)}
        </Stack>
      ),
    },
    {
      field: "sistemaPapeisIds",
      headerName: "Acesso",
      flex: 1.3,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
          {params.value.map((id) => {
            const sistema = sistemas.find((s) => s.papeis.some((p) => p.id === id));
            const papel = sistema?.papeis.find((p) => p.id === id);
            return (
              <Chip key={id} size="small" label={`${sistema?.nome ?? "?"} · ${papel?.nome ?? "?"}`} />
            );
          })}
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
      width: 170,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => setDialogUsuario(params.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redefinir senha">
            <IconButton size="small" onClick={() => setDialogSenhaPara(params.row)}>
              <LockResetOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.ativo ? (
            <Tooltip title="Excluir">
              <IconButton size="small" onClick={() => setDialogExcluirPara(params.row)}>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Reativar">
              <IconButton size="small" onClick={() => ativarMutation.mutate(params.row.id)}>
                <CheckCircleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Usuários
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PersonAddAltOutlinedIcon />}
          onClick={() => setDialogUsuario("novo")}
        >
          Novo usuário
        </Button>
      </Stack>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

      <Box sx={{ bgcolor: "background.paper" }}>
        <DataGrid
          autoHeight
          rows={usuarios}
          columns={colunas}
          loading={isLoading}
          hideFooter
          disableColumnFilter
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
            "& .MuiDataGrid-columnHeaderTitleContainer": { alignItems: "center" },
          }}
        />
      </Box>

      {dialogUsuario && (
        <DialogUsuario
          aberto
          usuarioEditando={dialogUsuario === "novo" ? null : dialogUsuario}
          papeis={papeis}
          sistemas={sistemas}
          salvando={criarMutation.isPending || atualizarMutation.isPending}
          erro={
            criarMutation.isError
              ? criarMutation.error.message
              : atualizarMutation.isError
                ? atualizarMutation.error.message
                : null
          }
          onFechar={() => setDialogUsuario(null)}
          onSalvar={(dados) =>
            dialogUsuario === "novo"
              ? criarMutation.mutate(dados)
              : atualizarMutation.mutate({ id: dialogUsuario.id, dados })
          }
        />
      )}

      {dialogSenhaPara && (
        <DialogRedefinirSenha
          aberto
          usuario={dialogSenhaPara}
          salvando={redefinirSenhaMutation.isPending}
          erro={redefinirSenhaMutation.isError ? redefinirSenhaMutation.error.message : null}
          onFechar={() => setDialogSenhaPara(null)}
          onConfirmar={() => redefinirSenhaMutation.mutate(dialogSenhaPara.id)}
        />
      )}

      {dialogExcluirPara && (
        <DialogExcluirUsuario
          aberto
          usuario={dialogExcluirPara}
          salvando={excluirMutation.isPending}
          erro={excluirMutation.isError ? excluirMutation.error.message : null}
          onFechar={() => setDialogExcluirPara(null)}
          onConfirmar={() => excluirMutation.mutate(dialogExcluirPara.id)}
        />
      )}

      <DialogSenhaGerada senha={senhaGerada} onFechar={() => setSenhaGerada(null)} />

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
