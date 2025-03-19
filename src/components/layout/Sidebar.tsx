
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  collapsed: boolean;
  subItems?: { label: string; to: string }[];
}

const SidebarItem = ({ icon: Icon, label, to, collapsed, subItems }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const [open, setOpen] = React.useState(isActive);

  const LinkContent = (
    <>
      <Icon className="h-5 w-5" />
      {!collapsed && <span className="ml-3">{label}</span>}
    </>
  );

  return (
    <div className="mb-1">
      {collapsed ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink 
                to={to}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {LinkContent}
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-1">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <NavLink 
          to={to}
          className={({ isActive }) => cn(
            "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
            isActive 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          onClick={() => subItems && setOpen(!open)}
        >
          {LinkContent}
          {subItems && (open ? <ChevronLeft className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
        </NavLink>
      )}

      {!collapsed && subItems && open && (
        <div className="mt-1 ml-6 space-y-1">
          {subItems.map((subItem) => (
            <NavLink
              key={subItem.to}
              to={subItem.to}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-white/20 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {subItem.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex flex-col bg-[#18467e] border-r border-blue-800 transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-6 border-b border-blue-800">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-[#18467e] font-bold mr-2">
              A
            </div>
            <span className="text-xl font-semibold text-white">Admin</span>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-[#18467e] font-bold">
              A
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

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
                { label: "Taskboard", to: "/sci/taskboard" }
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
                { label: "Dashboards", to: "/easyvista/dashboards" }
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
      
      <div className="p-4 border-t border-blue-800">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-white/60">admin@example.com</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
              A
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
