import { createTheme } from "@mui/material/styles";

// Mesma paleta institucional da Câmara usada no SIGA (ver CLAUDE.md) —
// o Portal é a porta de entrada do mesmo ecossistema, então usa a mesma
// identidade visual, não uma própria.
const paletaInstitucional = {
  verde: "#17352E",
  ambar: "#C4862E",
  creme: "#ECEAE2",
  branco: "#FFFFFF",
  textoSobreEscuroPrimario: "#F3F1EA",
  textoSobreEscuroSecundario: "#7E9C8D",
  textoSobreClaro: "#1C2A25",
  fundoEscuroDefault: "#10201B",
  fundoEscuroSuperficie: "#17251F",
};

const paletasPorModo = {
  light: {
    mode: "light",
    background: {
      default: paletaInstitucional.creme,
      paper: paletaInstitucional.branco,
    },
    text: {
      primary: paletaInstitucional.textoSobreClaro,
      secondary: paletaInstitucional.textoSobreEscuroSecundario,
    },
  },
  dark: {
    mode: "dark",
    background: {
      default: paletaInstitucional.fundoEscuroDefault,
      paper: paletaInstitucional.fundoEscuroSuperficie,
    },
    text: {
      primary: paletaInstitucional.textoSobreEscuroPrimario,
      secondary: paletaInstitucional.textoSobreEscuroSecundario,
    },
  },
};

export function criarTema(modo) {
  return createTheme({
    palette: {
      ...paletasPorModo[modo],
      primary: {
        main: paletaInstitucional.verde,
        contrastText: paletaInstitucional.textoSobreEscuroPrimario,
      },
      secondary: {
        main: paletaInstitucional.ambar,
        contrastText: paletaInstitucional.textoSobreClaro,
      },
    },
    typography: {
      button: {
        textTransform: "none",
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme: t }) => ({
            backgroundColor: t.palette.primary.main,
            color: t.palette.primary.contrastText,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });
}
