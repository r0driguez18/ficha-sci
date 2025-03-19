
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

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
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner />
    </div>
  );
}
