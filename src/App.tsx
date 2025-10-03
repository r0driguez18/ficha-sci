
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./components/auth/AuthProvider";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { ThemeProvider } from "./hooks/use-theme";
import Login from "./pages/auth/Login";

// Import pages
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Taskboard from "./pages/sci/Taskboard";
import TaskboardDiaNaoUtil from "./pages/sci/TaskboardDiaNaoUtil";
import TaskboardFinalMesUtil from "./pages/sci/TaskboardFinalMesUtil";
import TaskboardFinalMesNaoUtil from "./pages/sci/TaskboardFinalMesNaoUtil";
import Procedimentos from "./pages/sci/Procedimentos";
import CrcTratamento from "./pages/crc/Tratamento";
import DisDados from "./pages/dis/Dados";
import EasyVistaEstatisticas from "./pages/easyvista/Estatisticas";
import EasyVistaDashboards from "./pages/easyvista/Dashboards";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import CalendarPage from './pages/sci/Calendar';
import HistoricoFichas from './pages/sci/HistoricoFichas';
import RetornosCobrancas from './pages/sci/RetornosCobrancas';

// Initialize theme from localStorage - Always use light mode
const initTheme = () => {
  // Force light mode always
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
};
// Execute theme initialization
initTheme();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
              
              {/* SCI Routes */}
              <Route path="/sci" element={<Navigate to="/sci/procedimentos" replace />} />
              <Route path="/sci/procedimentos" element={<PrivateRoute><DashboardLayout><Procedimentos /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard" element={<PrivateRoute><DashboardLayout><Taskboard /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard-dia-nao-util" element={<PrivateRoute><DashboardLayout><TaskboardDiaNaoUtil /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard-final-mes-util" element={<PrivateRoute><DashboardLayout><TaskboardFinalMesUtil /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard-final-mes-nao-util" element={<PrivateRoute><DashboardLayout><TaskboardFinalMesNaoUtil /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/calendar" element={<PrivateRoute><DashboardLayout><CalendarPage /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/historico-fichas" element={<PrivateRoute><DashboardLayout><HistoricoFichas /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/retornos-cobrancas" element={<PrivateRoute><DashboardLayout><RetornosCobrancas /></DashboardLayout></PrivateRoute>} />
              
              {/* CRC Routes */}
              <Route path="/crc" element={<Navigate to="/crc/tratamento" replace />} />
              <Route path="/crc/tratamento" element={<PrivateRoute><DashboardLayout><CrcTratamento /></DashboardLayout></PrivateRoute>} />
              
              {/* DIS Routes */}
              <Route path="/dis" element={<Navigate to="/dis/dados" replace />} />
              <Route path="/dis/dados" element={<PrivateRoute><DashboardLayout><DisDados /></DashboardLayout></PrivateRoute>} />
              
              {/* Processamentos Routes */}
              <Route path="/easyvista" element={<Navigate to="/easyvista/estatisticas" replace />} />
              <Route path="/easyvista/estatisticas" element={<PrivateRoute><DashboardLayout><EasyVistaEstatisticas /></DashboardLayout></PrivateRoute>} />
              <Route path="/easyvista/dashboards" element={<PrivateRoute><DashboardLayout><EasyVistaDashboards /></DashboardLayout></PrivateRoute>} />
              
              {/* System Routes */}
              <Route path="/settings" element={<PrivateRoute><DashboardLayout><Settings /></DashboardLayout></PrivateRoute>} />
              <Route path="/docs" element={<PrivateRoute><DashboardLayout><Documentation /></DashboardLayout></PrivateRoute>} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
