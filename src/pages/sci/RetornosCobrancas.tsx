import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, Clock, FileText, Send, Flame } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getAllReturns,
  markReturnsAsSent,
  updateReturnExpectedDate,
  type CobrancaRetorno,
} from '@/services/cobrancasRetornoService';
import { useOperators } from '@/hooks/useOperators';
import { returnStatus, type ReturnSeverity } from '@/lib/cobrancasSla';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const fmt = (iso?: string | null) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const SEVERITY_BADGE: Record<ReturnSeverity, { cls: string; icon: typeof Clock }> = {
  enviado: { cls: 'bg-success text-success-foreground', icon: CheckCircle },
  urgente: { cls: 'bg-destructive text-destructive-foreground', icon: Flame },
  atrasado: { cls: 'bg-destructive text-destructive-foreground', icon: AlertTriangle },
  due: { cls: 'bg-warning text-warning-foreground', icon: Clock },
  pendente: { cls: 'border border-input text-foreground', icon: Clock },
};

export default function RetornosCobrancas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { labelOf } = useOperators();
  const [returns, setReturns] = useState<CobrancaRetorno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogIds, setDialogIds] = useState<string[] | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReturns = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await getAllReturns();
      if (error) throw error;
      setReturns(data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar retornos de cobranças', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const pendingReturns = useMemo(() => returns.filter((r) => !r.retorno_enviado), [returns]);
  const sentReturns = useMemo(() => returns.filter((r) => r.retorno_enviado), [returns]);

  const counts = useMemo(() => {
    const c = { urgente: 0, atrasado: 0, due: 0, pendente: 0 };
    for (const r of pendingReturns) {
      const s = returnStatus(r).severity;
      if (s in c) c[s as keyof typeof c] += 1;
    }
    return c;
  }, [pendingReturns]);

  const confirmSend = async () => {
    if (!dialogIds || dialogIds.length === 0) return;
    setSaving(true);
    try {
      const { error } = await markReturnsAsSent(dialogIds, observacoes);
      if (error) throw error;
      toast({
        title: 'Sucesso',
        description: dialogIds.length === 1 ? 'Retorno marcado como enviado' : `${dialogIds.length} retornos marcados como enviados`,
      });
      await fetchReturns();
      window.dispatchEvent(new Event('update-returns-badge'));
      setDialogIds(null);
      setObservacoes('');
    } catch (error) {
      console.error('Error marking returns as sent:', error);
      toast({ title: 'Erro', description: 'Erro ao marcar retorno(s) como enviado(s)', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const changeExpectedDate = async (retorno: CobrancaRetorno, novaData: string) => {
    if (!user?.id || !novaData || novaData === retorno.data_retorno_esperada.split('T')[0]) return;
    try {
      const { error } = await updateReturnExpectedDate(retorno.id, novaData);
      if (error) throw error;
      toast({ title: 'Data atualizada', description: `Novo prazo: ${fmt(novaData)}` });
      await fetchReturns();
      window.dispatchEvent(new Event('update-returns-badge'));
    } catch (error) {
      console.error('Error updating expected date:', error);
      toast({ title: 'Erro', description: 'Não foi possível alterar a data', variant: 'destructive' });
    }
  };

  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allPendingSelected = pendingReturns.length > 0 && selectedIds.size === pendingReturns.length;
  const toggleAll = () =>
    setSelectedIds(allPendingSelected ? new Set() : new Set(pendingReturns.map((r) => r.id)));

  const statusBadge = (r: CobrancaRetorno) => {
    const st = returnStatus(r);
    const { cls, icon: Icon } = SEVERITY_BADGE[st.severity];
    return (
      <Badge className={cls}>
        <Icon className="h-3 w-3 mr-1" />
        {st.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <PageContainer size="wide">
        <PageHeader title="Retornos de Cobranças" subtitle="Gestão de retornos de ficheiros de cobrança" />
        <LoadingState label="A carregar retornos…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader title="Retornos de Cobranças" subtitle="Gestão de retornos de ficheiros de cobrança" />

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { n: counts.urgente, label: 'Urgentes', icon: Flame, tone: 'text-destructive' },
          { n: counts.atrasado, label: 'Em Atraso', icon: AlertTriangle, tone: 'text-destructive' },
          { n: counts.due, label: 'Vencem Hoje', icon: Clock, tone: 'text-warning' },
          { n: counts.pendente, label: 'Pendentes', icon: FileText, tone: 'text-primary' },
          { n: sentReturns.length, label: 'Enviados', icon: CheckCircle, tone: 'text-success' },
        ].map(({ n, label, icon: Icon, tone }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${tone}`} />
                <div>
                  <p className="text-2xl font-bold">{n}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingReturns.length})</TabsTrigger>
          <TabsTrigger value="sent">Enviados ({sentReturns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Retornos Pendentes</CardTitle>
              {selectedIds.size > 0 && (
                <Button size="sm" onClick={() => setDialogIds([...selectedIds])}>
                  <Send className="h-4 w-4 mr-1" />
                  Marcar {selectedIds.size} como {selectedIds.size === 1 ? 'enviado' : 'enviados'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {pendingReturns.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="Sem retornos pendentes"
                  hint="Todos os retornos de cobrança foram enviados."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPendingSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Data Aplicação</TableHead>
                      <TableHead>Prazo (editável)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReturns.map((retorno) => (
                      <TableRow key={retorno.id} data-state={selectedIds.has(retorno.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(retorno.id)}
                            onCheckedChange={() => toggleId(retorno.id)}
                            aria-label={`Selecionar ${retorno.ficheiro_nome}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{retorno.ficheiro_nome}</TableCell>
                        <TableCell>{fmt(retorno.data_aplicacao)}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            defaultValue={retorno.data_retorno_esperada.split('T')[0]}
                            className="h-8 w-[9.5rem]"
                            onBlur={(e) => changeExpectedDate(retorno, e.target.value)}
                          />
                          {retorno.data_retorno_alterada_em && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              alterada por {labelOf(retorno.data_retorno_alterada_por)} em{' '}
                              {fmt(retorno.data_retorno_alterada_em)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(retorno)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setDialogIds([retorno.id])}>
                            <Send className="h-4 w-4 mr-1" />
                            Enviado
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader><CardTitle>Retornos Enviados</CardTitle></CardHeader>
            <CardContent>
              {sentReturns.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Ainda sem retornos enviados"
                  hint="Os retornos que marcares como enviados aparecem aqui."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Data Aplicação</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Data Enviado</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentReturns.map((retorno) => (
                      <TableRow key={retorno.id}>
                        <TableCell className="font-medium">{retorno.ficheiro_nome}</TableCell>
                        <TableCell>{fmt(retorno.data_aplicacao)}</TableCell>
                        <TableCell>{fmt(retorno.data_retorno_esperada)}</TableCell>
                        <TableCell>{fmt(retorno.data_retorno_enviado)}</TableCell>
                        <TableCell>{retorno.observacoes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!dialogIds} onOpenChange={(open) => { if (!open) { setDialogIds(null); setObservacoes(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogIds?.length === 1 ? 'Marcar retorno como enviado' : `Marcar ${dialogIds?.length ?? 0} retornos como enviados`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre o envio do(s) retorno(s)..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogIds(null); setObservacoes(''); }}>
                Cancelar
              </Button>
              <Button onClick={confirmSend} disabled={saving}>
                {saving ? 'A processar...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
