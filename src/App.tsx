
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/sci/procedimentos" replace />} />
          
          <Route path="/" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          
          {/* SCI Routes */}
          <Route path="/sci" element={<Navigate to="/sci/procedimentos" replace />} />
          <Route path="/sci/procedimentos" element={<DashboardLayout><Procedimentos /></DashboardLayout>} />
          <Route path="/sci/taskboard" element={<DashboardLayout><Taskboard /></DashboardLayout>} />
          <Route path="/sci/calendar" element={<DashboardLayout><CalendarPage /></DashboardLayout>} />
          
          {/* CRC Routes */}
          <Route path="/crc" element={<Navigate to="/crc/tratamento" replace />} />
          <Route path="/crc/tratamento" element={<DashboardLayout><CrcTratamento /></DashboardLayout>} />
          
          {/* DIS Routes */}
          <Route path="/dis" element={<Navigate to="/dis/dados" replace />} />
          <Route path="/dis/dados" element={<DashboardLayout><DisDados /></DashboardLayout>} />
          
          {/* Processamentos Routes - Previously EasyVista */}
          <Route path="/easyvista" element={<Navigate to="/easyvista/estatisticas" replace />} />
          <Route path="/easyvista/estatisticas" element={<DashboardLayout><EasyVistaEstatisticas /></DashboardLayout>} />
          
          {/* System Routes */}
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          <Route path="/docs" element={<DashboardLayout><Documentation /></DashboardLayout>} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
