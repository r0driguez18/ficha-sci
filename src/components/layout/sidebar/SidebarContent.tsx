
import React from 'react';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { 
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings,
  Calendar
} from 'lucide-react';

interface SidebarContentProps {
  collapsed: boolean;
}

export const SidebarContent = ({ collapsed }: SidebarContentProps) => {
  return (
    <div className="flex-1 overflow-auto py-4 px-4">
      <nav className="space-y-6">
        <div>
          <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-white/40 uppercase")}>
            Main
          </div>
          <SidebarItem
            icon={ClipboardCheck}
            label="SCI"
            to="/sci"
            collapsed={collapsed}
            subItems={[
              { label: "Ficha de Procedimentos", to: "/sci/procedimentos" },
              { label: "Calendar", to: "/sci/calendar" }
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
            label="EasyVista"
            to="/easyvista"
            collapsed={collapsed}
            subItems={[
              { label: "Dashboards", to: "/easyvista/dashboards" },
              { label: "Estatísticas", to: "/easyvista/estatisticas" }
            ]}
          />
        </div>
        
        <div>
          <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-white/40 uppercase")}>
            System
          </div>
          <SidebarItem
            icon={Settings}
            label="Settings"
            to="/settings"
            collapsed={collapsed}
          />
          <SidebarItem
            icon={FileText}
            label="Documentation"
            to="/docs"
            collapsed={collapsed}
          />
        </div>
      </nav>
    </div>
  );
};
