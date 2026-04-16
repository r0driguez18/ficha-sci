
import React from 'react';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex h-16 items-center px-4 w-full">
      {collapsed ? (
        <div className="flex w-full items-center justify-center">
          <SidebarTrigger className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all hover:bg-sidebar-accent border border-transparent shadow-none" />
        </div>
      ) : (
        <div className="flex items-center w-full">
          <SidebarTrigger className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all hover:bg-sidebar-accent border border-transparent shadow-none mr-3 shrink-0" />
          <img 
            src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png" 
            alt="BCA Logo" 
            className="h-10"
          />
        </div>
      )}
    </div>
  );
};
