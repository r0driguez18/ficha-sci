import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Import pages
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Taskboard from "./pages/sci/Taskboard";
import CrcTratamento from "./pages/crc/Tratamento";
import DisDados from "./pages/dis/Dados";
import EasyVistaDashboards from "./pages/easyvista/Dashboards";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import CalendarPage from './pages/sci/Calendar';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/sci/taskboard" replace />} />
          
          <Route path="/" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          
          {/* SCI Routes */}
          <Route path="/sci" element={<Navigate to="/sci/taskboard" replace />} />
          <Route path="/sci/taskboard" element={<DashboardLayout><Taskboard /></DashboardLayout>} />
          <Route path="/sci/calendar" element={<CalendarPage />} />
          
          {/* CRC Routes */}
          <Route path="/crc" element={<Navigate to="/crc/tratamento" replace />} />
          <Route path="/crc/tratamento" element={<DashboardLayout><CrcTratamento /></DashboardLayout>} />
          
          {/* DIS Routes */}
          <Route path="/dis" element={<Navigate to="/dis/dados" replace />} />
          <Route path="/dis/dados" element={<DashboardLayout><DisDados /></DashboardLayout>} />
          
          {/* EasyVista Routes */}
          <Route path="/easyvista" element={<Navigate to="/easyvista/dashboards" replace />} />
          <Route path="/easyvista/dashboards" element={<DashboardLayout><EasyVistaDashboards /></DashboardLayout>} />
          
          {/* System Routes */}
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          <Route path="/docs" element={<DashboardLayout><Documentation /></DashboardLayout>} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
