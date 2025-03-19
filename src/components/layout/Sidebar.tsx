
import React from 'react';
import { cn } from '@/lib/utils';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarContent } from './sidebar/SidebarContent';
import { SidebarFooter } from './sidebar/SidebarFooter';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex flex-col bg-[#18467e] border-r border-blue-800 transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarHeader collapsed={collapsed} setCollapsed={setCollapsed} />
      <SidebarContent collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}
