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
 * cai na lista estática enquanto a base de dados não responde.
 */
export function useOperators(): { operators: OperatorRow[]; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: listOperators,
    staleTime: FIVE_MIN,
  });
  const operators = data && data.length > 0 ? data : FALLBACK;
  return { operators, loading: isLoading };
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
