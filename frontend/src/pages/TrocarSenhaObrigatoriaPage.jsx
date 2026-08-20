import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { alterarSenha } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export default function TrocarSenhaObrigatoriaPage() {
  const { salvarSessao } = useAuth();
  const navigate = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const senhasDivergem = confirmarSenha.length > 0 && novaSenha !== confirmarSenha;

  const mutation = useMutation({
    mutationFn: () => alterarSenha(senhaAtual, novaSenha),
    onSuccess: (resposta) => {
      salvarSessao(resposta);
      navigate("/", { replace: true });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (senhasDivergem) return;
    mutation.mutate();
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, width: "100%", maxWidth: 380 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" component="h1">
              Troque sua senha
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essa é uma senha temporária. Defina uma nova senha para continuar.
            </Typography>
          </Box>

          {mutation.isError && <Alert severity="error">{mutation.error.message}</Alert>}

          <TextField
            label="Senha temporária"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoFocus
            required
          />
          <TextField
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            helperText="Pelo menos 8 caracteres."
            required
          />
          <TextField
            label="Confirmar nova senha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            error={senhasDivergem}
            helperText={senhasDivergem ? "As senhas não coincidem." : " "}
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="large"
            disabled={!senhaAtual || novaSenha.length < 8 || senhasDivergem || confirmarSenha.length === 0 || mutation.isPending}
          >
            Trocar senha
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
