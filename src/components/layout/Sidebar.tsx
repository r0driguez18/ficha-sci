
import React from 'react';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarContent } from './sidebar/SidebarContent';
import { SidebarFooter } from './sidebar/SidebarFooter';

export function Sidebar() {
  return (
    <aside 
      className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm"
      role="navigation"
      aria-label="Menu principal"
    >
      <SidebarHeader />
      <SidebarContent />
      <SidebarFooter />
    </aside>
  );
}
