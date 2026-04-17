
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  subItems?: { label: string; to: string; badge?: number }[];
}

export const SidebarItem = ({ icon: Icon, label, to, subItems }: SidebarItemProps) => {
  const location = useLocation();
  const { state, setOpen: setSidebarOpen } = useSidebar();
  const collapsed = state === 'collapsed';
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const hasActiveChild = subItems?.some(
    (sub) => location.pathname === sub.to || location.pathname.startsWith(`${sub.to}/`)
  );
  const [open, setOpen] = useState(isActive || !!hasActiveChild);

  if (subItems) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={() => {
                    if (setSidebarOpen) setSidebarOpen(true);
                    setOpen(true);
                  }}
                  isActive={!!hasActiveChild}
                  className="w-full flex justify-center py-6"
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="sr-only">{label}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <SidebarMenuButton
              onClick={() => setOpen(!open)}
              isActive={!!hasActiveChild}
              className="w-full py-5"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-base">{label}</span>
              {open
                ? <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                : <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              }
            </SidebarMenuButton>
          )}
          {open && !collapsed && (
            <SidebarMenuSub>
              {subItems.map((subItem) => {
                const subActive = location.pathname === subItem.to || location.pathname.startsWith(`${subItem.to}/`);
                return (
                  <SidebarMenuSubItem key={subItem.to}>
                    <SidebarMenuSubButton asChild isActive={subActive}>
                      <NavLink to={subItem.to} className="flex justify-between items-center w-full">
                        <span>{subItem.label}</span>
                        {!!subItem.badge && subItem.badge > 0 && (
                          <span className="bg-red-600 text-white text-[10px] leading-tight font-bold px-1.5 py-0.5 rounded-sm">
                            {subItem.badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (collapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={isActive} className="w-full flex justify-center py-6">
                <NavLink to={to}>
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="sr-only">{label}</span>
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} className="w-full py-5">
          <NavLink to={to}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-base">{label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
