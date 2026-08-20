import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import RotaProtegida from "./auth/RotaProtegida";
import LoginPage from "./pages/LoginPage";
import TrocarSenhaObrigatoriaPage from "./pages/TrocarSenhaObrigatoriaPage";
import DashboardPage from "./pages/DashboardPage";
import MeuPerfilPage from "./pages/MeuPerfilPage";
import UsuariosPage from "./pages/UsuariosPage";
import SistemasPage from "./pages/SistemasPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RotaProtegida />}>
        <Route path="/trocar-senha" element={<TrocarSenhaObrigatoriaPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/meu-perfil" element={<MeuPerfilPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/sistemas" element={<SistemasPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
