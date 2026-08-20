import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useAuth } from "../auth/AuthContext";
import { useFotoPerfil } from "../hooks/useFotoPerfil";
import { alterarFotoPerfil, removerFotoPerfil } from "../api/meuPerfil";
import DialogAlterarMinhaSenha from "../components/DialogAlterarMinhaSenha";

export default function MeuPerfilPage() {
  const { usuario, atualizarTemFoto } = useAuth();
  const queryClient = useQueryClient();
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [versaoFoto, setVersaoFoto] = useState(0);
  const inputArquivoRef = useRef(null);

  const urlFoto = useFotoPerfil(usuario?.temFoto, versaoFoto);

  function aplicarResultadoFoto(temFoto, mensagemSucesso) {
    atualizarTemFoto(temFoto);
    setVersaoFoto((v) => v + 1);
    // Cards de sistema no dashboard/cabeçalho também usam a foto — invalida
    // qualquer coisa que dependa da sessão pra refletir na hora.
    queryClient.invalidateQueries();
    setMensagem({ tipo: "success", texto: mensagemSucesso });
  }

  const trocarFotoMutation = useMutation({
    mutationFn: alterarFotoPerfil,
    onSuccess: () => aplicarResultadoFoto(true, "Foto atualizada."),
    onError: (err) => setMensagem({ tipo: "error", texto: err.message }),
  });

  const removerFotoMutation = useMutation({
    mutationFn: removerFotoPerfil,
    onSuccess: () => aplicarResultadoFoto(false, "Foto removida."),
    onError: (err) => setMensagem({ tipo: "error", texto: err.message }),
  });

  function handleArquivoSelecionado(e) {
    const arquivo = e.target.files?.[0];
    if (arquivo) trocarFotoMutation.mutate(arquivo);
    e.target.value = "";
  }

  const salvandoFoto = trocarFotoMutation.isPending || removerFotoMutation.isPending;

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h5">Meu perfil</Typography>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={3} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ position: "relative" }}>
            <Avatar src={urlFoto ?? undefined} sx={{ width: 80, height: 80, bgcolor: "secondary.main" }}>
              <AccountCircleOutlinedIcon sx={{ fontSize: 52 }} />
            </Avatar>
            {salvandoFoto && (
              <CircularProgress
                size={80}
                sx={{ position: "absolute", top: 0, left: 0, color: "secondary.main" }}
              />
            )}
            <Tooltip title="Trocar foto">
              <IconButton
                size="small"
                onClick={() => inputArquivoRef.current?.click()}
                disabled={salvandoFoto}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <PhotoCameraOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={handleArquivoSelecionado}
            />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
            <Typography variant="subtitle1">{usuario?.nome}</Typography>
            <Typography variant="body2" color="text.secondary">@{usuario?.nomeUsuario}</Typography>
            {usuario?.papeis?.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                {usuario.papeis.map((p) => <Chip key={p} size="small" label={`Portal: ${p}`} />)}
              </Stack>
            )}
          </Box>

          <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<VpnKeyOutlinedIcon />}
              onClick={() => setDialogSenhaAberto(true)}
            >
              Alterar senha
            </Button>
            {usuario?.temFoto && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => removerFotoMutation.mutate()}
                disabled={salvandoFoto}
              >
                Remover foto
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Acesso aos sistemas</Typography>
        <Divider sx={{ mb: 1 }} />
        {usuario?.sistemas?.length > 0 ? (
          <List disablePadding>
            {usuario.sistemas.map((s) => (
              <ListItem key={s.sistemaId} disablePadding sx={{ py: 1 }}>
                <ListItemText primary={s.nome} secondary={s.descricao} />
                <Chip size="small" label={s.papel} variant="outlined" />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Você ainda não tem acesso a nenhum sistema.
          </Typography>
        )}
      </Paper>

      <DialogAlterarMinhaSenha aberto={dialogSenhaAberto} onFechar={() => setDialogSenhaAberto(false)} />

      <Snackbar
        open={!!mensagem}
        autoHideDuration={4000}
        onClose={() => setMensagem(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {mensagem && <Alert severity={mensagem.tipo}>{mensagem.texto}</Alert>}
      </Snackbar>
    </Stack>
  );
}
