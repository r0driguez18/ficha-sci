
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';
import { SearchSidebar } from '../SearchSidebar';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, useSidebar } from '@/components/ui/sidebar';
import { 
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  Home,
  PieChart,
  Settings,
  Search
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getPendingReturns } from '@/services/cobrancasRetornoService';
import { getPendingTapesEvidencia } from '@/services/exportedTaskboardService';

export const SidebarContent = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const [retornosBadge, setRetornosBadge] = useState<number>(0);
  const [tapesBadge, setTapesBadge] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const { data } = await getPendingReturns();

        if (isMounted) {
          setRetornosBadge(data?.length || 0);
        }
      } catch (error) {
        console.error('Failed to load pending returns count:', error);
      }
    };

    const fetchTapes = async () => {
      try {
        const { data } = await getPendingTapesEvidencia();
        if (isMounted) setTapesBadge(data?.length || 0);
      } catch (error) {
        console.error('Failed to load pending tapes count:', error);
      }
    };

    fetchCounts();
    fetchTapes();
    // Refresh every 5 minutes in background
    const interval = setInterval(() => { fetchCounts(); fetchTapes(); }, 5 * 60 * 1000);

    // Listen for manual updates triggered by other components
    window.addEventListener('update-returns-badge', fetchCounts);
    window.addEventListener('update-tapes-badge', fetchTapes);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('update-returns-badge', fetchCounts);
      window.removeEventListener('update-tapes-badge', fetchTapes);
    };
  }, [user]);

  const searchItems = [
    { label: 'SCI - Procedimentos', path: '/sci/procedimentos', keywords: ['sci', 'taskboard', 'procedimentos'] },
    { label: 'SCI - Histórico', path: '/sci/historico-fichas', keywords: ['sci', 'histórico', 'fichas', 'guardadas'] },
    { label: 'SCI - Retornos de Cobranças', path: '/sci/retornos-cobrancas', keywords: ['sci', 'retornos', 'cobranças', 'ficheiros'] },
    { label: 'SCI - Calendário', path: '/sci/calendario', keywords: ['sci', 'calendário', 'eventos', 'notas', 'agenda'] },
    { label: 'CRC - Fecho de Inconsistências', path: '/crc/tratamento', keywords: ['crc', 'inconsistências', 'fecho', 'validar'] },
    { label: 'DIS - Dados', path: '/dis/dados', keywords: ['dis', 'dados', 'database'] },
    { label: 'Processamentos - Estatísticas', path: '/easyvista/estatisticas', keywords: ['processamentos', 'estatísticas', 'charts'] },
    { label: 'Configurações', path: '/settings', keywords: ['settings', 'configurações', 'config'] },
    { label: 'Documentação', path: '/docs', keywords: ['docs', 'documentação', 'help', 'ajuda'] },
  ];

  return (
    <>
      {/* Search */}
      {!collapsed && (
        <div className="mb-4 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent border border-sidebar-foreground/20 rounded-lg h-9"
          >
            <Search className="h-4 w-4 mr-2 shrink-0" />
            <span className="text-sm">Pesquisar...</span>
          </Button>
        </div>
      )}

      {/* Home */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarItem icon={Home} label="Home" to="/dashboard" />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Módulos */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground/50">Módulos</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarItem
            icon={ClipboardCheck}
            label="SCI"
            to="/sci"
            subItems={[
              { label: "Ficha de Procedimentos", to: "/sci/procedimentos" },
              { label: "Histórico de Fichas", to: "/sci/historico-fichas", badge: tapesBadge },
              { label: "Retornos Cobranças", to: "/sci/retornos-cobrancas", badge: retornosBadge },
              { label: "Calendário", to: "/sci/calendario" }
            ]}
          />
          <SidebarItem
            icon={LayoutDashboard}
            label="CRC"
            to="/crc"
            subItems={[
              { label: "Fecho de Inconsistências", to: "/crc/tratamento" }
            ]}
          />
          <SidebarItem
            icon={Database}
            label="DIS"
            to="/dis"
            subItems={[
              { label: "Dados", to: "/dis/dados" }
            ]}
          />
          <SidebarItem
            icon={PieChart}
            label="Processamentos"
            to="/easyvista"
            subItems={[
              { label: "Estatísticas", to: "/easyvista/estatisticas" }
            ]}
          />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Sistema */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground/50">Sistema</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarItem icon={Settings} label="Configurações" to="/settings" />
          <SidebarItem icon={FileText} label="Documentação" to="/docs" />
        </SidebarGroupContent>
      </SidebarGroup>

      <SearchSidebar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchItems}
        onNavigate={navigate}
      />
    </>
  );
};
