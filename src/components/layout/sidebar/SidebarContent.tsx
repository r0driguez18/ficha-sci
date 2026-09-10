import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '../CommandPalette';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  ClipboardCheck,
  Archive,
  Undo2,
  ArrowRightLeft,
  Banknote,
  ShieldCheck,
  BarChart3,
  Settings,
  BookOpen,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getPendingReturns } from '@/services/cobrancasRetornoService';
import { getPendingTapesEvidencia } from '@/services/exportedTaskboardService';

export const SidebarContent = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const [retornosBadge, setRetornosBadge] = useState<number>(0);
  const [tapesBadge, setTapesBadge] = useState<number>(0);

  // Atalho ⌘K / Ctrl+K abre a paleta de comandos.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const { data } = await getPendingReturns();
        if (isMounted) setRetornosBadge(data?.length || 0);
      } catch (error) {
        console.error('Failed to load pending returns count:', error);
      }
    };
    const fetchTapes = async () => {
      try {
        const { data } = await getPendingTapesEvidencia();
        if (isMounted) setTapesBadge(data?.length || 0);
      } catch (error) {
        console.error('Failed to load pending tapes count:', error);
      }
    };

    fetchCounts();
    fetchTapes();
    const interval = setInterval(() => {
      fetchCounts();
      fetchTapes();
    }, 5 * 60 * 1000);

    window.addEventListener('update-returns-badge', fetchCounts);
    window.addEventListener('update-tapes-badge', fetchTapes);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('update-returns-badge', fetchCounts);
      window.removeEventListener('update-tapes-badge', fetchTapes);
    };
  }, [user]);

  const searchItems = [
    { label: 'Início', path: '/dashboard', group: 'Início', keywords: ['dashboard', 'resumo', 'hoje'] },
    { label: 'Ficha de Procedimentos', path: '/sci/procedimentos', group: 'SCI', keywords: ['taskboard', 'procedimentos', 'ficha'] },
    { label: 'Histórico de Fichas', path: '/sci/historico-fichas', group: 'SCI', keywords: ['histórico', 'fichas', 'guardadas', 'arquivo'] },
    { label: 'Retornos de Cobranças', path: '/sci/retornos-cobrancas', group: 'SCI', keywords: ['retornos', 'cobranças', 'ficheiros', 'sla'] },
    { label: 'Passagem de Turno', path: '/sci/passagem-turno', group: 'SCI', keywords: ['passagem', 'turno', 'notas', 'handover'] },
    { label: 'Gerador PS2', path: '/sci/gerador-ps2', group: 'SCI', keywords: ['ps2', 'salários', 'pagamentos', 'ficheiro', 'banco', 'nib'] },
    { label: 'CRC — Inconsistências', path: '/crc/tratamento', group: 'Ferramentas', keywords: ['inconsistências', 'fecho', 'validar', 'crc'] },
    { label: 'Estatísticas', path: '/easyvista/estatisticas', group: 'Ferramentas', keywords: ['estatísticas', 'gráficos', 'processamentos', 'charts'] },
    { label: 'Configurações', path: '/settings', group: 'Sistema', keywords: ['settings', 'configurações', 'tema', 'senha'] },
    { label: 'Documentação', path: '/docs', group: 'Sistema', keywords: ['docs', 'documentação', 'ajuda', 'help'] },
  ];

  return (
    <>
      {/* Pesquisa / paleta de comandos */}
      {!collapsed && (
        <div className="mb-2 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="w-full justify-start gap-2 rounded-lg border border-sidebar-foreground/15 h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-sm">Pesquisar</span>
            <kbd className="ml-auto rounded border border-sidebar-foreground/20 px-1.5 font-mono text-[10px] text-sidebar-foreground/50">
              Ctrl K
            </kbd>
          </Button>
        </div>
      )}

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarItem icon={Home} label="Início" to="/dashboard" />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>SCI</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarItem icon={ClipboardCheck} label="Ficha de Procedimentos" to="/sci/procedimentos" />
            <SidebarItem icon={Archive} label="Histórico de Fichas" to="/sci/historico-fichas" badge={tapesBadge} />
            <SidebarItem icon={Undo2} label="Retornos de Cobranças" to="/sci/retornos-cobrancas" badge={retornosBadge} />
            <SidebarItem icon={ArrowRightLeft} label="Passagem de Turno" to="/sci/passagem-turno" />
            <SidebarItem icon={Banknote} label="Gerador PS2" to="/sci/gerador-ps2" />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarItem icon={ShieldCheck} label="CRC — Inconsistências" to="/crc/tratamento" />
            <SidebarItem icon={BarChart3} label="Estatísticas" to="/easyvista/estatisticas" />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>Sistema</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarItem icon={Settings} label="Configurações" to="/settings" />
            <SidebarItem icon={BookOpen} label="Documentação" to="/docs" />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <CommandPalette
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        items={searchItems}
        onNavigate={navigate}
      />
    </>
  );
};
