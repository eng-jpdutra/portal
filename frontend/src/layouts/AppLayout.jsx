import { Outlet, NavLink, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useAuth, usePodeEscrever } from "../auth/AuthContext";
import { useThemeMode } from "../theme/ThemeModeProvider";
import { useFotoPerfil } from "../hooks/useFotoPerfil";

const LARGURA_MENU = 240;
const ALTURA_CABECALHO = 88;

// Mesmo truque do SIGA: o MUI aplica a altura padrão do Toolbar via
// breakpoint (maior especificidade que um "minHeight" simples), então o
// override precisa entrar também dentro do media query.
const alturaCabecalhoSx = {
  minHeight: ALTURA_CABECALHO,
  "@media (min-width:600px)": { minHeight: ALTURA_CABECALHO },
};

// Layout base — cabeçalho fixo + menu lateral fixo, igual ao SIGA (mesmo
// arquivo de brasão, mesma estrutura, mesmo padrão de cabeçalho: avatar
// leva direto pro perfil, tema/sair são ícones à parte), pra quem já usa
// um sistema do ecossistema não estranhar o outro.
export default function AppLayout() {
  const { usuario, sair } = useAuth();
  const podeEscrever = usePodeEscrever();
  const { modo, alternarModo } = useThemeMode();
  const navigate = useNavigate();
  const urlFoto = useFotoPerfil(usuario?.temFoto);

  const itensDeNavegacao = [
    { rotulo: "Início", caminho: "/", icone: HomeOutlinedIcon },
    ...(podeEscrever
      ? [
          { rotulo: "Usuários", caminho: "/usuarios", icone: GroupOutlinedIcon },
          { rotulo: "Sistemas", caminho: "/sistemas", icone: AppsOutlinedIcon },
        ]
      : []),
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2, ...alturaCabecalhoSx }}>
          <Box
            component="img"
            src="/brasao-marilia.png"
            alt="Brasão do Município de Marília"
            sx={{ height: 64, width: "auto" }}
          />
          <Typography variant="h5" component="div">
            Portal de Sistemas da Câmara Municipal de Marília
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography
              variant="body2"
              sx={{ color: "primary.contrastText", lineHeight: 1, position: "relative", top: "2px" }}
            >
              {usuario?.nome}
            </Typography>

            <Tooltip title="Meu perfil">
              <IconButton onClick={() => navigate("/meu-perfil")} sx={{ p: 0 }} aria-label="meu perfil">
                <Avatar src={urlFoto ?? undefined} sx={{ width: 48, height: 48, bgcolor: "secondary.main" }}>
                  <AccountCircleOutlinedIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </IconButton>
            </Tooltip>

            <Tooltip title={modo === "dark" ? "Modo claro" : "Modo escuro"}>
              <IconButton color="inherit" onClick={alternarModo} aria-label="alternar tema claro/escuro">
                {modo === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Sair">
              <IconButton color="inherit" onClick={sair} aria-label="sair">
                <LogoutOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: LARGURA_MENU,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: LARGURA_MENU,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Toolbar sx={alturaCabecalhoSx} />
        <List sx={{ pt: 1 }}>
          {itensDeNavegacao.map((item) => {
            const Icone = item.icone;
            return (
              <ListItem key={item.caminho} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.caminho}
                  end={item.caminho === "/"}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    minHeight: 44,
                    color: "text.primary",
                    "&.active": {
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                      fontWeight: 500,
                      "& .MuiListItemIcon-root": { color: "inherit" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 2, color: "text.secondary" }}>
                    <Icone />
                  </ListItemIcon>
                  <ListItemText primary={item.rotulo} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, color: "text.primary", p: 3 }}>
        <Toolbar sx={alturaCabecalhoSx} />
        <Outlet />
      </Box>
    </Box>
  );
}
