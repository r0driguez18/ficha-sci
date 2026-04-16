
import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex h-16 items-center justify-center px-4">
      {collapsed ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xl shadow-md border border-white/10">
          B
        </div>
      ) : (
        <img 
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png" 
          alt="BCA Logo" 
          className="h-10"
        />
      )}
    </div>
  );
};
