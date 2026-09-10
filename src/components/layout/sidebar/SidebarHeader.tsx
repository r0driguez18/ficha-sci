import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Cabeçalho da barra lateral: o logótipo BCA quando aberta, nada quando
 * recolhida. O botão de recolher/expandir vive uma única vez no cabeçalho
 * da aplicação (DashboardLayout).
 */
export const SidebarHeader = () => {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return <div className="h-16" />;
  }

  return (
    <div className="flex h-16 items-center px-3 w-full">
      <img
        src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png"
        alt="BCA — Sistema de Controlo Interno"
        className="ml-1 h-10"
      />
    </div>
  );
};
