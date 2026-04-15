
import React from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto ml-64 bg-background">
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
