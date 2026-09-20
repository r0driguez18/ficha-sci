import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOperators } from '@/hooks/useOperators';
import { todayIso, isoDateOffset } from '@/lib/taskboardDefaults';
import type { TurnKey } from '@/types/taskboard';
import {
  getHandoverEntradas,
  adicionarEntradaHandover,
  confirmarLeituraEntradaHandover,
  type HandoverEntrada,
} from '@/services/handoverService';

const TURNOS: { key: TurnKey; label: string }[] = [
  { key: 'turno1', label: 'Turno 1' },
  { key: 'turno2', label: 'Turno 2' },
  { key: 'turno3', label: 'Turno 3' },
];

const fmt = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-PT');
  } catch {
    return iso;
  }
};

export default function PassagemTurno() {
  const { user } = useAuth();
  const { labelOf } = useOperators();

  const [date, setDate] = useState<string>(todayIso());
  const [entradas, setEntradas] = useState<HandoverEntrada[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await getHandoverEntradas(date);
    if (error) toast.error('Erro ao carregar as notas de passagem de turno.');
    setEntradas(data ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    setLoading(true);
    setDrafts({});
    load();
  }, [load]);

  const deixarNota = async (turno: TurnKey) => {
    const texto = (drafts[turno] ?? '').trim();
    if (!user?.id || texto === '') return;
    setBusy(turno);
    try {
      const { error } = await adicionarEntradaHandover(date, turno, texto);
      if (error) {
        toast.error(error.message || 'Não foi possível guardar a nota.');
        return;
      }
      setDrafts((prev) => ({ ...prev, [turno]: '' }));
      await load();
      toast.success('Nota deixada.');
    } finally {
      setBusy(null);
    }
  };

  const confirmarLeitura = async (entrada: HandoverEntrada) => {
    if (!user?.id) return;
    setBusy(`leitura-${entrada.id}`);
    try {
      const { error } = await confirmarLeituraEntradaHandover(entrada.id);
      if (error) {
        toast.error('Não foi possível registar a leitura.');
        return;
      }
      await load();
      toast.success('Leitura confirmada.');
    } finally {
      setBusy(null);
    }
  };

  const isToday = useMemo(() => date === todayIso(), [date]);
  const porLer = useMemo(() => entradas.filter((e) => e.leituras.length === 0).length, [entradas]);

  return (
    <PageContainer size="default">
      <PageHeader
        title="Passagem de Turno"
        subtitle="Quem sai deixa notas do turno; quem entra confirma a leitura de cada uma. Fica tudo registado."
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="max-w-xs">
          <Label htmlFor="ht-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data
          </Label>
          <Input
            id="ht-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayIso())}
            min={isoDateOffset(-365)}
            max={isoDateOffset(7)}
            className="mt-1.5"
          />
          {!isToday && <p className="mt-1 text-xs text-muted-foreground">A ver um dia diferente de hoje.</p>}
        </div>
        {!loading && (
          <Badge variant={porLer > 0 ? 'destructive' : 'secondary'} className="mb-1">
            {porLer > 0 ? `${porLer} nota(s) por ler neste dia` : 'Todas as notas deste dia foram lidas'}
          </Badge>
        )}
      </div>

      {loading ? (
        <LoadingState label="A carregar as notas…" />
      ) : (
        <div className="space-y-5">
          {TURNOS.map(({ key, label }) => {
            const doTurno = entradas.filter((e) => e.turno === key);
            const draft = drafts[key] ?? '';
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="text-base">{label}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {doTurno.length === 0 ? 'Sem notas' : `${doTurno.length} nota(s)`}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doTurno.length > 0 && (
                    <ul className="space-y-3">
                      {doTurno.map((e) => {
                        const jaLi = e.leituras.some((l) => l.user_id === user?.id);
                        return (
                          <li key={e.id} className="rounded-md border p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>
                                {e.autor_nome ?? labelOf(e.autor_user_id)} · {fmt(e.created_at)}
                              </span>
                              {e.leituras.length === 0 && <Badge variant="outline">Por ler</Badge>}
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{e.texto}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {e.leituras.map((l) => (
                                <Badge key={l.id} variant="secondary" className="bg-success/15 text-success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lida por {l.user_nome ?? labelOf(l.user_id)} · {fmt(l.lida_em)}
                                </Badge>
                              ))}
                              {!jaLi && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmarLeitura(e)}
                                  disabled={busy === `leitura-${e.id}`}
                                >
                                  {busy === `leitura-${e.id}` ? (
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                  )}
                                  Confirmar leitura
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="Nova nota para quem entra: ocorrências, pendências a acompanhar, avisos…"
                      maxLength={4000}
                      className="min-h-[90px]"
                    />
                    <Button size="sm" onClick={() => deixarNota(key)} disabled={draft.trim() === '' || busy === key}>
                      {busy === key ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1.5" />
                      )}
                      Deixar nota
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      As notas não se editam nem se apagam: para corrigir, deixa uma nova.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
