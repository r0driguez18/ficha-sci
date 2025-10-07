
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';
import { SearchSidebar } from '../SearchSidebar';
import { 
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings,
  Calendar,
  Search,
  History,
  ArrowLeftRight
} from 'lucide-react';

interface SidebarContentProps {
  collapsed: boolean;
}

export const SidebarContent = ({ collapsed }: SidebarContentProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const searchItems = [
    { label: 'SCI - Procedimentos', path: '/sci/procedimentos', keywords: ['sci', 'taskboard', 'procedimentos'] },
    { label: 'SCI - Calendário', path: '/sci/calendar', keywords: ['sci', 'calendar', 'calendário'] },
    { label: 'SCI - Histórico', path: '/sci/historico-fichas', keywords: ['sci', 'histórico', 'fichas', 'guardadas'] },
    { label: 'SCI - Retornos de Cobranças', path: '/sci/retornos-cobrancas', keywords: ['sci', 'retornos', 'cobranças', 'ficheiros'] },
    { label: 'CRC - Tratamento', path: '/crc/tratamento', keywords: ['crc', 'tratamento', 'ficheiros'] },
    { label: 'DIS - Dados', path: '/dis/dados', keywords: ['dis', 'dados', 'database'] },
    { label: 'Processamentos - Estatísticas', path: '/easyvista/estatisticas', keywords: ['processamentos', 'estatísticas', 'charts'] },
    { label: 'Configurações', path: '/settings', keywords: ['settings', 'configurações', 'config'] },
    { label: 'Documentação', path: '/docs', keywords: ['docs', 'documentação', 'help', 'ajuda'] },
  ];

  return (
    <>
      <div className="flex-1 overflow-auto py-4 px-4">
        {/* Search Button */}
        {!collapsed && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="w-full justify-start text-white hover:bg-white/10 border border-white/20"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="text-sm">Pesquisar...</span>
            </Button>
          </div>
        )}

        <nav className="space-y-6">
          <div>
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              to="/dashboard"
              collapsed={collapsed}
            />
          </div>
          
          <div>
            <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-white/40 uppercase")}>
              Módulos
            </div>
            <SidebarItem
              icon={ClipboardCheck}
              label="SCI"
              to="/sci"
              collapsed={collapsed}
              subItems={[
                { label: "Ficha de Procedimentos", to: "/sci/procedimentos" },
                { label: "Calendário", to: "/sci/calendar" },
                { label: "Histórico de Fichas", to: "/sci/historico-fichas" },
                { label: "Retornos Cobranças", to: "/sci/retornos-cobrancas" }
              ]}
            />
            <SidebarItem
              icon={LayoutDashboard}
              label="CRC"
              to="/crc"
              collapsed={collapsed}
              subItems={[
                { label: "Tratamento de Ficheiros", to: "/crc/tratamento" }
              ]}
            />
            <SidebarItem
              icon={Database}
              label="DIS"
              to="/dis"
              collapsed={collapsed}
              subItems={[
                { label: "Dados", to: "/dis/dados" }
              ]}
            />
            <SidebarItem
              icon={PieChart}
              label="Processamentos"
              to="/easyvista"
              collapsed={collapsed}
              subItems={[
                { label: "Estatísticas", to: "/easyvista/estatisticas" }
              ]}
            />
          </div>
          
          <div>
            <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-white/40 uppercase")}>
              Sistema
            </div>
            <SidebarItem
              icon={Settings}
              label="Configurações"
              to="/settings"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={FileText}
              label="Documentação"
              to="/docs"
              collapsed={collapsed}
            />
          </div>
        </nav>
      </div>

      <SearchSidebar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchItems}
        onNavigate={navigate}
      />
    </>
  );
};
