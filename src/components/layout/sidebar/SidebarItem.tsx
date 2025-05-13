
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
    isActive 
      ? "bg-white/20 text-white" 
      : "text-white/70 hover:text-white hover:bg-white/10"
  );

  const LinkContent = (
    <>
      <Icon className="h-5 w-5 text-white" />
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
