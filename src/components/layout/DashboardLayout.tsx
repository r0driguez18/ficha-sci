
import React from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-background sticky top-0 z-10 px-4">
            <SidebarTrigger className="h-8 w-8" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <div className="container py-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
      <Sonner />
    </SidebarProvider>
  );
}
