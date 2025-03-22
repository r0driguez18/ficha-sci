
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
      <div className={collapsed ? "mx-auto" : ""}>
        <img 
          src="/lovable-uploads/e9c60d16-29f0-415b-8024-2888c0e9f536.png" 
          alt="BCA Logo" 
          className="h-8"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`text-white/70 hover:text-white hover:bg-white/10 ${collapsed ? "" : "ml-auto"}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>
    </div>
  );
};
