
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  collapsed: boolean;
  subItems?: { label: string; to: string }[];
}

export const SidebarItem = ({ icon: Icon, label, to, collapsed, subItems }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const [open, setOpen] = React.useState(isActive);

  const linkClasses = ({ isActive }: { isActive: boolean }) => cn(
    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
  );

  const LinkContent = (
    <>
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
      {!collapsed && <span className="ml-3 truncate">{label}</span>}
    </>
  );

  return (
    <div className="mb-0.5">
      {collapsed ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink 
                to={to}
                className={linkClasses}
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
          className={linkClasses}
          onClick={(e) => {
            if (subItems) {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          {LinkContent}
          {subItems && (
            <span className="ml-auto">
              {open 
                ? <ChevronDown className="h-4 w-4 text-sidebar-foreground/40" /> 
                : <ChevronRight className="h-4 w-4 text-sidebar-foreground/40" />
              }
            </span>
          )}
        </NavLink>
      )}

      {!collapsed && subItems && open && (
        <div className="mt-0.5 ml-4 pl-3 border-l-2 border-sidebar-border space-y-0.5">
          {subItems.map((subItem) => (
            <NavLink
              key={subItem.to}
              to={subItem.to}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-150",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
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
