
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./components/auth/AuthProvider";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { ThemeProvider } from "./hooks/use-theme";
import { SyncStatusProvider } from "./hooks/useSyncStatus";
import { ServerStatusProvider } from "./hooks/useServerStatus";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";

// Import pages
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import FichaProcedimentos from "./pages/sci/FichaProcedimentos";
import Procedimentos from "./pages/sci/Procedimentos";
import CrcTratamento from "./pages/crc/Tratamento";
import EasyVistaEstatisticas from "./pages/easyvista/Estatisticas";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import HistoricoFichas from './pages/sci/HistoricoFichas';
import RetornosCobrancas from './pages/sci/RetornosCobrancas';
import PassagemTurno from './pages/sci/PassagemTurno';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <ServerStatusProvider>
        <SyncStatusProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
              
              {/* SCI Routes */}
              <Route path="/sci" element={<Navigate to="/sci/procedimentos" replace />} />
              <Route path="/sci/procedimentos" element={<PrivateRoute><DashboardLayout><Procedimentos /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard" element={<PrivateRoute><DashboardLayout><FichaProcedimentos key="dia-util" formType="dia-util" /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard-dia-nao-util" element={<PrivateRoute><DashboardLayout><FichaProcedimentos key="dia-nao-util" formType="dia-nao-util" /></DashboardLayout></PrivateRoute>} />
              {/* Rotas antigas de "final de mês" — a folha de tapes passou a viver dentro das 2 fichas */}
              <Route path="/sci/taskboard-final-mes-util" element={<Navigate to="/sci/taskboard" replace />} />
              <Route path="/sci/taskboard-final-mes-nao-util" element={<Navigate to="/sci/taskboard-dia-nao-util" replace />} />
              <Route path="/sci/historico-fichas" element={<PrivateRoute><DashboardLayout><HistoricoFichas /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/retornos-cobrancas" element={<PrivateRoute><DashboardLayout><RetornosCobrancas /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/passagem-turno" element={<PrivateRoute><DashboardLayout><PassagemTurno /></DashboardLayout></PrivateRoute>} />

              {/* CRC Routes */}
              <Route path="/crc" element={<Navigate to="/crc/tratamento" replace />} />
              <Route path="/crc/tratamento" element={<PrivateRoute><DashboardLayout><CrcTratamento /></DashboardLayout></PrivateRoute>} />
              
              {/* Processamentos Routes */}
              <Route path="/easyvista" element={<Navigate to="/easyvista/estatisticas" replace />} />
              <Route path="/easyvista/estatisticas" element={<PrivateRoute><DashboardLayout><EasyVistaEstatisticas /></DashboardLayout></PrivateRoute>} />
              
              {/* System Routes */}
              <Route path="/settings" element={<PrivateRoute><DashboardLayout><Settings /></DashboardLayout></PrivateRoute>} />
              <Route path="/docs" element={<PrivateRoute><DashboardLayout><Documentation /></DashboardLayout></PrivateRoute>} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

        </TooltipProvider>
        </SyncStatusProvider>
        </ServerStatusProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
