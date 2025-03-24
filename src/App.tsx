
import { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Documentation from '@/pages/Documentation';
import Settings from '@/pages/Settings';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Taskboard from '@/pages/sci/Taskboard';
import Calendar from '@/pages/sci/Calendar';
import Dados from '@/pages/dis/Dados';
import Tratamento from '@/pages/crc/Tratamento';
import Dashboards from '@/pages/easyvista/Dashboards';
import { NotificationProvider } from '@/contexts/NotificationContext';

function App() {
  // Initialize collapsed state from localStorage if available
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<DashboardLayout collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sci/taskboard" element={<Taskboard />} />
              <Route path="/sci/calendar" element={<Calendar />} />
              <Route path="/dis/dados" element={<Dados />} />
              <Route path="/crc/tratamento" element={<Tratamento />} />
              <Route path="/easyvista/dashboards" element={<Dashboards />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
