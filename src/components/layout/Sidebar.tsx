
import React from 'react';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarContent } from './sidebar/SidebarContent';
import { SidebarFooter } from './sidebar/SidebarFooter';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter as ShadcnSidebarFooter,
  SidebarHeader as ShadcnSidebarHeader,
} from '@/components/ui/sidebar';

export function Sidebar() {
  return (
    <ShadcnSidebar collapsible="icon">
      <ShadcnSidebarHeader className="border-b border-sidebar-border p-0">
        <SidebarHeader />
      </ShadcnSidebarHeader>
      <ShadcnSidebarContent className="py-4 px-2">
        <SidebarContent />
      </ShadcnSidebarContent>
      <ShadcnSidebarFooter className="border-t border-sidebar-border p-0">
        <SidebarFooter />
      </ShadcnSidebarFooter>
    </ShadcnSidebar>
  );
}
