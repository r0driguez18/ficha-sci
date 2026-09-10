
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { ServerStatusBanner } from './ServerStatusBanner';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatusBadge } from '@/components/taskboard/SyncStatusBadge';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrentOperator } from '@/hooks/useOperators';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/** Turno em curso a partir da hora local (Turno 3 entra às 23h, sai às 7h). */
function currentTurno(d = new Date()): 1 | 2 | 3 {
  const h = d.getHours();
  if (h >= 7 && h < 15) return 1;
  if (h >= 15 && h < 23) return 2;
  return 3;
}

function HeaderBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const operator = useCurrentOperator();
  const { status: syncStatus, lastSavedAt } = useSyncStatus();

  const operatorName =
    operator?.label ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    'Utilizador';

  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const turno = currentTurno();

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
    <header className="h-16 flex items-center gap-3 sm:gap-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 shadow-sm">
      <SidebarTrigger className="shrink-0" />

      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Único sítio com breadcrumbs. Anula a margem inferior do componente. */}
        <div className="[&>div]:mb-0">
          <BreadcrumbNavigation />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
        {syncStatus !== 'idle' && (
          <span className="hidden md:inline-flex">
            <SyncStatusBadge status={syncStatus} lastSavedAt={lastSavedAt} />
          </span>
        )}

        <div className="hidden lg:flex flex-col items-end leading-tight">
          <span className="text-xs text-muted-foreground capitalize">{today}</span>
          <span className="text-[11px] font-medium text-primary">Turno {turno}</span>
        </div>

        <ThemeToggle />

        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-foreground truncate max-w-[9rem]">{operatorName}</p>
          <p className="text-[11px] text-muted-foreground">
            {operator ? `Operador ${operator.value}` : 'Sessão ativa'}
          </p>
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
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          <HeaderBar />
          <ServerStatusBanner />
          <main className="flex-1 overflow-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 -z-10" />
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
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
