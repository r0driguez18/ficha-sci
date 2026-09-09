
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function HeaderBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const operatorName =
    (user?.user_metadata?.name as string | undefined) || user?.email || 'Utilizador';

  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sair');
    }
  };

  return (
    <header className="h-16 flex items-center gap-4 border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 shadow-sm">
      <SidebarTrigger className="shrink-0" />

      <div className="min-w-0 flex-1 hidden sm:block">
        {/* Breadcrumbs herdam a margem inferior do componente; anulada aqui para caber no header */}
        <div className="[&>div]:mb-0">
          <BreadcrumbNavigation />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <span className="hidden md:inline text-xs text-muted-foreground capitalize">{today}</span>
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-foreground truncate max-w-[10rem]">{operatorName}</p>
          <p className="text-[11px] text-muted-foreground">Sessão ativa</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          <HeaderBar />
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
