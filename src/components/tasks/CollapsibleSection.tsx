import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  title: string;
  done: number;
  total: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Secção da ficha que colapsa, com contador "n/total" (F8). Começa aberta —
 * nada fica escondido sem o operador o decidir. Não altera a ordem nem o
 * texto das tarefas lá dentro.
 */
export const CollapsibleSection: React.FC<Props> = ({
  title,
  done,
  total,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const complete = total > 0 && done === total;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="font-bold text-lg underline">{title}</span>
        <Badge
          variant={complete ? 'secondary' : 'outline'}
          className={`ml-auto ${complete ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}`}
        >
          {done}/{total}
        </Badge>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
