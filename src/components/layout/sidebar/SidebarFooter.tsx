
import React from 'react';
import { useAuth } from '../../auth/AuthProvider';

interface SidebarFooterProps {
  collapsed: boolean;
}

export const SidebarFooter = ({ collapsed }: SidebarFooterProps) => {
  const { user } = useAuth();
  
  const userEmail = user?.email || 'No email';
  const userInitial = userEmail ? userEmail[0].toUpperCase() : 'U';
  
  return (
    <div className="p-4 border-t border-blue-800">
      {!collapsed ? (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
            {userInitial}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.user_metadata?.name || 'User'}</p>
            <p className="text-xs text-white/60">{userEmail}</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
            {userInitial}
          </div>
        </div>
      )}
    </div>
  );
};
