import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  /** Contador opcional (ex.: pendências). */
  badge?: number;
}

/**
 * Item de menu — sempre um link direto (o menu é plano, sem submenus).
 * Recolhido: só o ícone, com tooltip do label (tratado pelo SidebarMenuButton).
 */
export const SidebarItem = ({ icon: Icon, label, to, badge }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={showBadge ? `${label} (${badge})` : label}>
        <NavLink to={to}>
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
      {showBadge && (
        <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
          {badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
};
