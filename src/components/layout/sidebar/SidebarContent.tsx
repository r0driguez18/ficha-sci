
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';
import { SearchSidebar } from '../SearchSidebar';
import { 
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  Home,
  PieChart,
  Settings,
  Search,
  MessageCircle
} from 'lucide-react';

export const SidebarContent = () => {
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
    { label: 'Telegram Setup', path: '/telegram-setup', keywords: ['telegram', 'notificações', 'grupo', 'bot'] },
    { label: 'Documentação', path: '/docs', keywords: ['docs', 'documentação', 'help', 'ajuda'] },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Search */}
        <div className="mb-5">
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

        <nav className="space-y-6" aria-label="Navegação principal">
          {/* Home */}
          <div>
            <SidebarItem icon={Home} label="Home" to="/dashboard" />
          </div>
          
          {/* Módulos */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase select-none">
              Módulos
            </p>
            <SidebarItem
              icon={ClipboardCheck}
              label="SCI"
              to="/sci"
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
              subItems={[
                { label: "Tratamento de Ficheiros", to: "/crc/tratamento" }
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
          </div>
          
          {/* Sistema */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase select-none">
              Sistema
            </p>
            <SidebarItem icon={Settings} label="Configurações" to="/settings" />
            <SidebarItem icon={MessageCircle} label="Telegram Setup" to="/telegram-setup" />
            <SidebarItem icon={FileText} label="Documentação" to="/docs" />
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
