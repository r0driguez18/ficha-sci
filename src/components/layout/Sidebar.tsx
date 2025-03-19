
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
  Link,
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
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
              ? "bg-sidebar-primary text-sidebar-primary-foreground" 
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
                  ? "bg-sidebar-accent text-sidebar-foreground" 
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
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
        "fixed inset-y-0 left-0 z-10 flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-6">
        {!collapsed && (
          <div className="flex items-center">
            <span className="text-xl font-semibold text-sidebar-foreground">Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4 px-4">
        <nav className="space-y-6">
          <div>
            <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase")}>
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
              icon={Link}
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
            <div className={cn("mb-2", collapsed ? "px-2 sr-only" : "px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase")}>
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
      
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-sidebar-foreground/60">admin@example.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
