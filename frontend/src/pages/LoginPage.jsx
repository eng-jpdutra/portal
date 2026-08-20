import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // getModifierState só reflete o estado real da tecla no momento do
  // evento — por isso precisa ficar tanto no keyup quanto no keydown, senão
  // o aviso fica desatualizado até a próxima tecla.
  function verificarCapsLock(e) {
    setCapsLockAtivo(e.getModifierState?.("CapsLock") ?? false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(nomeUsuario, senha);
      navigate(location.state?.de ?? "/", { replace: true });
    } catch {
      setErro("Usuário ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
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
              Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistemas da Câmara Municipal
            </Typography>
          </Box>

          {erro && <Alert severity="error">{erro}</Alert>}

          <TextField
            label="Usuário"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            autoFocus
            required
          />
          <TextField
            label="Senha"
            type={senhaVisivel ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={verificarCapsLock}
            onKeyUp={verificarCapsLock}
            required
            helperText={capsLockAtivo ? "Caps Lock está ativado." : " "}
            slotProps={{
              formHelperText: { sx: { color: capsLockAtivo ? "warning.main" : undefined } },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSenhaVisivel((v) => !v)}
                      edge="end"
                      aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                      tabIndex={-1}
                    >
                      {senhaVisivel ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button type="submit" variant="contained" color="secondary" size="large" disabled={carregando}>
            Entrar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
