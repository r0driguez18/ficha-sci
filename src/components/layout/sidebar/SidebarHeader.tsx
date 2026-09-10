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
    <div className="flex h-16 items-center px-4 w-full">
      {collapsed ? (
        <img src="/bca-icon.png" alt="BCA" className="mx-auto h-8 w-8 rounded" />
      ) : (
        <img
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png"
          alt="BCA — Sistema de Controlo Interno"
          className="h-10"
        />
      )}
    </div>
  );
};
