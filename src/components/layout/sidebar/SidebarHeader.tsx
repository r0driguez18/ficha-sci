import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Cabeçalho da barra lateral: só a marca BCA. O botão de recolher/expandir
 * vive uma única vez no cabeçalho da aplicação (DashboardLayout).
 */
export const SidebarHeader = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex h-16 items-center px-3 w-full">
      {collapsed ? (
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold tracking-tight text-sidebar-primary-foreground">
          SCI
        </div>
      ) : (
        <img
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png"
          alt="BCA — Sistema de Controlo Interno"
          className="ml-1 h-10"
        />
      )}
    </div>
  );
};
