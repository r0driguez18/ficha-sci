
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  subItems?: { label: string; to: string }[];
}

export const SidebarItem = ({ icon: Icon, label, to, subItems }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const hasActiveChild = subItems?.some(
    (sub) => location.pathname === sub.to || location.pathname.startsWith(`${sub.to}/`)
  );
  const [open, setOpen] = useState(isActive || !!hasActiveChild);

  const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[40px]";
  
  const activeClasses = "bg-sidebar-accent text-sidebar-accent-foreground";
  const inactiveClasses = "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50";

  // Parent with subItems — acts as toggle, not a link
  if (subItems) {
    return (
      <div className="mb-0.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            baseClasses,
            "w-full text-left",
            hasActiveChild ? activeClasses : inactiveClasses
          )}
          aria-expanded={open}
        >
          <Icon className={cn("h-5 w-5 shrink-0", hasActiveChild ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
          <span className="flex-1 truncate">{label}</span>
          {open 
            ? <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0" /> 
            : <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
          }
        </button>

        {open && (
          <div className="mt-1 ml-4 pl-3 border-l-2 border-sidebar-border space-y-0.5">
            {subItems.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-150 min-h-[36px]",
                  isActive 
                    ? "bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                )}
              >
                {subItem.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Simple link item (no subItems)
  return (
    <div className="mb-0.5">
      <NavLink
        to={to}
        className={({ isActive }) => cn(
          baseClasses,
          isActive ? activeClasses : inactiveClasses
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
        <span className="truncate">{label}</span>
      </NavLink>
    </div>
  );
};
