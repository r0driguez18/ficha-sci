import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOperators, useCurrentOperator } from '@/hooks/useOperators';
import { todayIso } from '@/lib/taskboardDefaults';
import type { TurnKey } from '@/types/taskboard';
import {
  getHandoverNotes,
  saveHandoverNote,
  confirmarLeituraHandover,
  type HandoverNote,
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
  const currentOperator = useCurrentOperator();
  const nomeOperador = currentOperator?.label ?? user?.email ?? 'Operador';

  const [date, setDate] = useState<string>(todayIso());
  const [notes, setNotes] = useState<Record<string, HandoverNote>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getHandoverNotes(date);
    if (error) {
      toast.error('Erro ao carregar as notas de passagem de turno.');
    }
    const byTurno: Record<string, HandoverNote> = {};
    (data ?? []).forEach((n) => {
      byTurno[n.turno] = n;
    });
    setNotes(byTurno);
    setDrafts(
      Object.fromEntries(TURNOS.map(({ key }) => [key, byTurno[key]?.nota ?? ''])),
    );
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const guardar = async (turno: TurnKey) => {
    if (!user?.id) return;
    setBusy(turno);
    try {
      const { data, error } = await saveHandoverNote(
        date,
        turno,
        drafts[turno] ?? '',
        user.id,
        nomeOperador,
      );
      if (error || !data) {
        toast.error(error?.message ?? 'Não foi possível guardar a nota.');
        return;
      }
      setNotes((prev) => ({ ...prev, [turno]: data }));
      toast.success('Nota guardada.');
    } finally {
      setBusy(null);
    }
  };

  const confirmarLeitura = async (turno: TurnKey) => {
    const note = notes[turno];
    if (!note || !user?.id) return;
    setBusy(`${turno}-leitura`);
    try {
      const { error } = await confirmarLeituraHandover(note.id, user.id, nomeOperador);
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader
        title="Passagem de Turno"
        subtitle="Quem sai deixa o resumo do turno; quem entra confirma a leitura"
      />

      <div className="mb-6 max-w-xs">
        <Label htmlFor="ht-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Data
        </Label>
        <Input
          id="ht-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || todayIso())}
          className="mt-1.5"
        />
        {!isToday && <p className="mt-1 text-xs text-muted-foreground">A ver um dia diferente de hoje.</p>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> A carregar…
        </div>
      ) : (
        <div className="space-y-5">
          {TURNOS.map(({ key, label }) => {
            const note = notes[key];
            const draft = drafts[key] ?? '';
            const dirty = draft !== (note?.nota ?? '');
            const lida = !!note?.lida_em;
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="text-base">{label}</CardTitle>
                  {lida ? (
                    <Badge variant="secondary" className="bg-success/15 text-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Lida por {note?.lida_por_nome ?? labelOf(note?.lida_por)} · {fmt(note?.lida_em)}
                    </Badge>
                  ) : note ? (
                    <Badge variant="outline">Por confirmar</Badge>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Resumo do turno para quem entra: ocorrências, pendências a acompanhar, avisos…"
                    className="min-h-[110px]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => guardar(key)} disabled={!dirty || busy === key}>
                      {busy === key ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1.5" />
                      )}
                      Guardar
                    </Button>
                    {note && !lida && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmarLeitura(key)}
                        disabled={busy === `${key}-leitura` || dirty}
                        title={dirty ? 'Guarde as alterações antes de confirmar a leitura' : undefined}
                      >
                        {busy === `${key}-leitura` ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        )}
                        Confirmar leitura
                      </Button>
                    )}
                    {note && (
                      <span className="text-xs text-muted-foreground">
                        por {note.autor_nome ?? labelOf(note.autor_user_id)} · atualizada {fmt(note.updated_at)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
