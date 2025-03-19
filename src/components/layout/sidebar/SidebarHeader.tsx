
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarHeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const SidebarHeader = ({ collapsed, setCollapsed }: SidebarHeaderProps) => {
  return (
    <div className="flex h-16 items-center justify-between px-4 py-6 border-b border-blue-800">
      {!collapsed ? (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-[#18467e] font-bold mr-2">
            A
          </div>
          <span className="text-xl font-semibold text-white">Admin</span>
        </div>
      ) : (
        <div className="mx-auto">
          <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-[#18467e] font-bold">
            A
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="text-white/70 hover:text-white hover:bg-white/10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>
    </div>
  );
};
