import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  label: string;
  path: string;
  keywords?: string[];
  /** Secção a que pertence (ex.: "SCI"), só para mostrar. */
  group?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  onNavigate: (path: string) => void;
}

/**
 * Paleta de comandos (⌘K / Ctrl+K) para saltar para qualquer página.
 * Modal centrado, teclado primeiro: escrever filtra, ↑/↓ move, Enter abre.
 */
export function CommandPalette({ open, onOpenChange, items, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.group?.toLowerCase().includes(q) ||
        it.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // Repõe o estado sempre que abre.
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Mantém o item selecionado dentro dos limites.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  const go = (path: string) => {
    onNavigate(path);
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) go(item.path);
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg gap-0 overflow-hidden p-0"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir para…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sem resultados para “{query}”.
            </p>
          ) : (
            results.map((it, i) => (
              <button
                key={it.path}
                type="button"
                data-idx={i}
                onMouseMove={() => setActive(i)}
                onClick={() => go(it.path)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm',
                  i === active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {it.group && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {it.group}
                    </span>
                  )}
                  <span className="truncate">{it.label}</span>
                </span>
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
