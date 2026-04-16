
import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex h-16 items-center justify-center px-4">
      {collapsed ? (
        <img 
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png" 
          alt="BCA Logo" 
          className="h-8 w-8 object-contain"
        />
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
