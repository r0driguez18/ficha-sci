import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { OPERATORS } from '@/lib/operators';
import {
  listOperators,
  getMyOperator,
  checkIsAdmin,
  type OperatorRow,
} from '@/services/operatorService';

const FIVE_MIN = 5 * 60 * 1000;

/** A lista estática de `src/lib/operators.ts` no formato de linha, usada como
 *  recurso enquanto a base de dados não responde (ou está offline). */
const FALLBACK: OperatorRow[] = OPERATORS.map((o) => ({
  id: o.value,
  value: o.value,
  label: o.label,
  ativo: true,
  papel: 'operador',
  user_id: null,
}));

/**
 * Lista de operadores ativos para dropdowns e filtros. Nunca fica vazia —
 * cai na lista estática enquanto a base de dados não responde. `labelOf`
 * resolve um código de operador (`file_processes.executed_by`, etc.) para o
 * nome, usando a lista da BD (F9) e não a constante estática.
 */
export function useOperators(): {
  operators: OperatorRow[];
  loading: boolean;
  labelOf: (value: string | null | undefined) => string;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: listOperators,
    staleTime: FIVE_MIN,
  });
  const operators = data && data.length > 0 ? data : FALLBACK;
  const labelOf = useMemo(() => {
    const map = new Map(operators.map((o) => [o.value, o.label]));
    return (value: string | null | undefined) => (value ? map.get(value) ?? value : '');
  }, [operators]);
  return { operators, loading: isLoading, labelOf };
}

/** O operador ligado à conta em sessão, ou null se ainda não foi associado. */
export function useCurrentOperator(): OperatorRow | null {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['my-operator', user?.id],
    queryFn: getMyOperator,
    enabled: !!user?.id,
    staleTime: FIVE_MIN,
  });
  return data ?? null;
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: checkIsAdmin,
    enabled: !!user?.id,
    staleTime: FIVE_MIN,
  });
  return data === true;
}
