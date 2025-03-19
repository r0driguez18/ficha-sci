
import React from 'react';

interface SidebarFooterProps {
  collapsed: boolean;
}

export const SidebarFooter = ({ collapsed }: SidebarFooterProps) => {
  return (
    <div className="p-4 border-t border-blue-800">
      {!collapsed ? (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-white/60">admin@example.com</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#18467e] font-semibold">
            A
          </div>
        </div>
      )}
    </div>
  );
};
