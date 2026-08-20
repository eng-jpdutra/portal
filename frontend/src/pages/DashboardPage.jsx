import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import { useAuth } from "../auth/AuthContext";
import { obterToken } from "../api/client";

// Cada card leva pro sistema em si (fora do Portal) — o Portal só decide
// quem pode ver o quê e com qual papel, não é dono de nada do que
// acontece lá dentro. O token vai junto na URL (rota /sso de cada
// sistema) — é o que evita pedir login de novo lá.
function CardSistema({ sistema }) {
  const href = `${sistema.urlBase}/sso?token=${encodeURIComponent(obterToken())}`;

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardActionArea
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ height: "100%", p: 1 }}
        >
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5 }}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <AppsOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" component="h2">
                  {sistema.nome}
                </Typography>
                <Chip size="small" label={sistema.papel} variant="outlined" sx={{ mt: 0.5 }} />
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {sistema.descricao ?? "Sem descrição."}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const sistemas = usuario?.sistemas ?? [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Olá, {usuario?.nome?.split(" ")[0]}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sistemas que você tem acesso.
      </Typography>

      {sistemas.length === 0 ? (
        <Alert severity="info">
          Você ainda não tem acesso a nenhum sistema. Fale com um administrador do Portal.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {sistemas.map((s) => (
            <CardSistema key={s.sistemaId} sistema={s} />
          ))}
        </Grid>
      )}
    </Box>
  );
}
