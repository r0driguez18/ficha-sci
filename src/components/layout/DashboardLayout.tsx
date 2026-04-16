
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
      <div className="min-h-screen flex w-full bg-slate-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          <header className="h-16 flex items-center border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 shadow-sm transition-all duration-300">
          </header>
          <main className="flex-1 overflow-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 -z-10" />
            <div className="container py-8 px-4 sm:px-6 lg:px-8 animate-fade-in max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
      <Sonner position="top-right" richColors />
    </SidebarProvider>
  );
}
