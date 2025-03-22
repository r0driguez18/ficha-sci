
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
      <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
        <img 
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png" 
          alt="BCA Logo" 
          className={`h-8 ${collapsed ? "mx-auto" : ""}`}
        />
      </div>
      {!collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 absolute right-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
