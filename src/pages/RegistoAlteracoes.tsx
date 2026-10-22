import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useOperators';
import {
  TABELAS_AUDITADAS,
  TAMANHO_PAGINA,
  descreverAlteracoes,
  listarRegisto,
  type FiltroRegisto,
  type RegistoAlteracao,
} from '@/services/registoAlteracoesService';

const TODAS = '__todas__';

/** "Alterado · ps2_lotes (empresa, sentido)" → "empresa, sentido". */
const camposAlterados = (resumo: string) => /\(([^)]*)\)\s*$/.exec(resumo)?.[1] ?? '';

const quando = (iso: string) =>
  new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'medium' });

const COR_OPERACAO: Record<RegistoAlteracao['operacao'], 'default' | 'secondary' | 'destructive'> = {
  INSERT: 'secondary',
  UPDATE: 'default',
  DELETE: 'destructive',
};
const NOME_OPERACAO: Record<RegistoAlteracao['operacao'], string> = {
  INSERT: 'Criado',
  UPDATE: 'Alterado',
  DELETE: 'Apagado',
};

export default function RegistoAlteracoes() {
  const isAdmin = useIsAdmin();
  const [filtro, setFiltro] = useState<FiltroRegisto>({});
  const [registos, setRegistos] = useState<RegistoAlteracao[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());

  const carregar = useCallback(
    async (mais: boolean) => {
      setACarregar(true);
      const antes = mais ? registos[registos.length - 1]?.id : undefined;
      const r = await listarRegisto(filtro, antes);
      setACarregar(false);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setErro(null);
      setRegistos((atuais) => (mais ? [...atuais, ...r.registos] : r.registos));
      setTemMais(r.registos.length === TAMANHO_PAGINA);
    },
    // `registos` só interessa ao pedir "mais"; os filtros recarregam do início.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtro],
  );

  useEffect(() => {
    if (isAdmin) void carregar(false);
  }, [isAdmin, carregar]);

  const alternar = (id: number) =>
    setAbertos((a) => {
      const n = new Set(a);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (!isAdmin) {
    return (
      <PageContainer size="default">
        <PageHeader title="Registo de alterações" subtitle="Só para administradores" />
        <Alert>
          <AlertDescription>Só os administradores podem consultar o registo de alterações.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Registo de alterações"
        subtitle="Quem criou, alterou ou apagou o quê, e quando. Não se pode editar nem apagar."
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>O quê</Label>
            <Select
              value={filtro.tabela ?? TODAS}
              onValueChange={(v) => setFiltro((f) => ({ ...f, tabela: v === TODAS ? undefined : v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Tudo</SelectItem>
                {Object.entries(TABELAS_AUDITADAS).map(([k, nome]) => (
                  <SelectItem key={k} value={k}>
                    {nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-operador">Operador</Label>
            <Input
              id="reg-operador"
              placeholder="ex.: nalves"
              value={filtro.operador ?? ''}
              onChange={(e) => setFiltro((f) => ({ ...f, operador: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-de">De</Label>
            <Input id="reg-de" type="date" value={filtro.de ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, de: e.target.value || undefined }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-ate">Até</Label>
            <Input id="reg-ate" type="date" value={filtro.ate ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, ate: e.target.value || undefined }))} />
          </div>
        </CardContent>
      </Card>

      {erro && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {aCarregar && registos.length === 0 ? (
        <LoadingState label="A carregar o registo…" />
      ) : registos.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sem registos para estes filtros" hint="Alterações em fichas, lotes, operadores e contas aparecem aqui." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-44">Quando</TableHead>
                <TableHead className="w-28">Operador</TableHead>
                <TableHead className="w-28">Ação</TableHead>
                <TableHead>O quê</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registos.map((r) => {
                const aberto = abertos.has(r.id);
                const linhas = descreverAlteracoes(r);
                return (
                  <React.Fragment key={r.id}>
                    <TableRow className="cursor-pointer" onClick={() => alternar(r.id)}>
                      <TableCell>{aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{quando(r.quando)}</TableCell>
                      <TableCell className="font-mono text-sm">{r.operador}</TableCell>
                      <TableCell>
                        <Badge variant={COR_OPERACAO[r.operacao]}>{NOME_OPERACAO[r.operacao]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.tabela === 'contas' ? (
                          <span className="font-medium">{r.resumo}</span>
                        ) : (
                          <>
                            <span className="font-medium">{TABELAS_AUDITADAS[r.tabela] ?? r.tabela}</span>
                            {camposAlterados(r.resumo) && (
                              <span className="text-muted-foreground"> — {camposAlterados(r.resumo)}</span>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    {aberto && (
                      <TableRow className="bg-muted/30">
                        <TableCell />
                        <TableCell colSpan={4} className="text-xs">
                          {r.registo_id && <div className="mb-1 font-mono text-muted-foreground">registo: {r.registo_id}</div>}
                          {linhas.length === 0 ? (
                            <span className="text-muted-foreground">Sem mais detalhes.</span>
                          ) : (
                            <ul className="space-y-0.5 font-mono">
                              {linhas.map((l) => (
                                <li key={l} className="break-all">
                                  {l}
                                </li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {temMais && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => carregar(true)} disabled={aCarregar}>
            Carregar mais
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
