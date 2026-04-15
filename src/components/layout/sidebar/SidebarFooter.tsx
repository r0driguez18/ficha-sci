
import React from 'react';
import { useAuth } from '../../auth/AuthProvider';

export const SidebarFooter = () => {
  const { user } = useAuth();
  
  const userEmail = user?.email || 'No email';
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName ? userName[0].toUpperCase() : 'U';
  
  return (
    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
          {userInitial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
        </div>
      </div>
    </div>
  );
};
