
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function DashboardLayout({ collapsed, setCollapsed }: DashboardLayoutProps) {
  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main 
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            collapsed ? "ml-20" : "ml-64"
          )}
        >
          <div className="container py-6 h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
