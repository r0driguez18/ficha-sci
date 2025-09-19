
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Initialize collapsed state from localStorage if available
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

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
            "flex-1 overflow-auto transition-all duration-300 ease-in-out bg-background",
            collapsed ? "ml-20" : "ml-64"
          )}
        >
          <div className="container py-6 h-full animate-fade-in overflow-visible">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner />
    </div>
  );
}
