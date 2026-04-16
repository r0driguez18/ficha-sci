
import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const SidebarFooter = () => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  
  const userEmail = user?.email || 'No email';
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName ? userName[0].toUpperCase() : 'U';
  
  const avatar = (
    <div className="h-9 w-9 rounded-full bg-sidebar-primary/25 flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
      {userInitial}
    </div>
  );

  if (collapsed) {
    return (
      <div className="p-3 flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>{avatar}</TooltipTrigger>
          <TooltipContent side="right">{userName}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
          <p className="text-xs text-sidebar-foreground/70 truncate">{userEmail}</p>
        </div>
      </div>
    </div>
  );
};
