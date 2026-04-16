
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  subItems?: { label: string; to: string }[];
}

export const SidebarItem = ({ icon: Icon, label, to, subItems }: SidebarItemProps) => {
  const location = useLocation();
  const { state } = useSidebar();
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
                  onClick={() => setOpen(!open)}
                  isActive={!!hasActiveChild}
                  className="w-full"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : (
            <SidebarMenuButton
              onClick={() => setOpen(!open)}
              isActive={!!hasActiveChild}
              className="w-full"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{label}</span>
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
                      <NavLink to={subItem.to}>
                        {subItem.label}
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
              <SidebarMenuButton asChild isActive={isActive}>
                <NavLink to={to}>
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
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
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink to={to}>
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
