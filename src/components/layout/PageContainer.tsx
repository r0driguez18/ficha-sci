import React from 'react';
import { cn } from '@/lib/utils';

type Size = 'narrow' | 'default' | 'wide';

const MAX_WIDTH: Record<Size, string> = {
  /** Formulários de coluna única (ex.: CRC). */
  narrow: 'max-w-3xl',
  /** Formulários e listas normais (ex.: Gerador PS2, Passagem de Turno). */
  default: 'max-w-5xl',
  /** Tabelas largas e dashboards (ex.: Histórico, Estatísticas). */
  wide: 'max-w-7xl',
};

interface PageContainerProps {
  /** Largura máxima do conteúdo. Predefinição: `wide`. */
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

/**
 * Invólucro único do conteúdo de cada página. O `DashboardLayout` já trata do
 * fundo, do padding e do espaço vertical — as páginas só escolhem aqui a
 * largura de leitura, para que a navegação entre módulos não salte de largura.
 */
export function PageContainer({ size = 'wide', className, children }: PageContainerProps) {
  return <div className={cn('mx-auto w-full', MAX_WIDTH[size], className)}>{children}</div>;
}
