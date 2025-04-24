
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
import Procedimentos from "./pages/sci/Procedimentos";
import CrcTratamento from "./pages/crc/Tratamento";
import DisDados from "./pages/dis/Dados";
import EasyVistaEstatisticas from "./pages/easyvista/Estatisticas";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import CalendarPage from './pages/sci/Calendar';

// Initialize theme from localStorage
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
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
              <Route path="/" element={<Navigate to="/sci/procedimentos" replace />} />
              <Route path="/auth/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
              
              {/* SCI Routes */}
              <Route path="/sci" element={<Navigate to="/sci/procedimentos" replace />} />
              <Route path="/sci/procedimentos" element={<PrivateRoute><DashboardLayout><Procedimentos /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/taskboard" element={<PrivateRoute><DashboardLayout><Taskboard /></DashboardLayout></PrivateRoute>} />
              <Route path="/sci/calendar" element={<PrivateRoute><DashboardLayout><CalendarPage /></DashboardLayout></PrivateRoute>} />
              
              {/* CRC Routes */}
              <Route path="/crc" element={<Navigate to="/crc/tratamento" replace />} />
              <Route path="/crc/tratamento" element={<PrivateRoute><DashboardLayout><CrcTratamento /></DashboardLayout></PrivateRoute>} />
              
              {/* DIS Routes */}
              <Route path="/dis" element={<Navigate to="/dis/dados" replace />} />
              <Route path="/dis/dados" element={<PrivateRoute><DashboardLayout><DisDados /></DashboardLayout></PrivateRoute>} />
              
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
          <Toaster richColors />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
