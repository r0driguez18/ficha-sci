import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProvider';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { useCurrentOperator } from '@/hooks/useOperators';
import { assinaturaRetificada, diffFicha, rotuloChave, type ConteudoFicha } from '@/lib/retificacaoFicha';
import { computeFichaHash } from '@/lib/signatureHash';
import { todayIso } from '@/lib/taskboardDefaults';
import { editarFichaExportada, type ExportedTaskboard } from '@/services/exportedTaskboardService';

type Obj = Record<string, any>;

const NOME_TURNO: Record<string, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
const CAMPOS_LINHA: Array<[string, string]> = [
  ['hora', 'Hora'],
  ['tarefa', 'Tarefa'],
  ['nomeAs', 'Nome AS'],
  ['operacao', 'Operação'],
  ['executado', 'Executado'],
  ['tipo', 'Tipo'],
];

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface Props {
  record: ExportedTaskboard | null;
  onClose: () => void;
  /** Chamado depois de gravar, com a ficha já retificada. */
  onSaved: (atualizada: ExportedTaskboard) => void;
}

export function EditarFichaDialog({ record, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {record && <Editor key={record.id} record={record} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function Editor({ record, onClose, onSaved }: { record: ExportedTaskboard; onClose: () => void; onSaved: (r: ExportedTaskboard) => void }) {
  const { user } = useAuth();
  const operador = useCurrentOperator();
  const [date, setDate] = useState(record.date);
  const [turnData, setTurnData] = useState<Obj>(() => clone(record.turn_data as Obj));
  const [tasks, setTasks] = useState<Obj>(() => clone(record.tasks as Obj));
  const [rows, setRows] = useState<Obj[]>(() => clone(record.table_rows as unknown as Obj[]));
  const [motivo, setMotivo] = useState('');
  const [signerName, setSignerName] = useState('');
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const temTapes = record.tapes_status !== 'nao_aplicavel' || !!turnData.verificacaoTapes;
  const tapes: Obj = turnData.verificacaoTapes ?? {};
  const assinado = sigUrl === 'pin' && !!signerName && !!token;

  const antes: ConteudoFicha = useMemo(
    () => ({ date: record.date, turn_data: record.turn_data as Obj, tasks: record.tasks as Obj, table_rows: record.table_rows as unknown as Obj[] }),
    [record],
  );
  const mudancas = useMemo(
    () => diffFicha(antes, { date, turn_data: turnData, tasks, table_rows: rows }),
    [antes, date, turnData, tasks, rows],
  );

  const setTurno = (t: string, campo: string, v: string) =>
    setTurnData((d) => ({ ...d, [t]: { ...d[t], [campo]: v } }));
  const setTarefa = (t: string, k: string, v: boolean | string) =>
    setTasks((d) => ({ ...d, [t]: { ...d[t], [k]: v } }));
  const setLinha = (i: number, k: string, v: string) =>
    setRows((rs) => rs.map((r, ri) => (ri === i ? { ...r, [k]: v } : r)));
  const setTape = (k: string, v: boolean | string) =>
    setTurnData((d) => ({ ...d, verificacaoTapes: { ...(d.verificacaoTapes ?? {}), [k]: v } }));

  const guardar = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast.error('A data da ficha não é válida.');
    if (date > todayIso()) return toast.error('A data da ficha não pode ser no futuro.');
    if (motivo.trim().length < 10) return toast.error('Indica o motivo da retificação (pelo menos 10 caracteres).');
    if (mudancas.length === 0) return toast.error('Não há nenhuma alteração para guardar.');
    if (!assinado || !token || !user) return toast.error("Assina com o teu PIN para confirmar a retificação.");

    setSaving(true);
    try {
      const { verificacaoTapes, ...turnosSemTapes } = turnData;
      const hash = await computeFichaHash({
        date,
        formType: record.form_type,
        turnData: turnosSemTapes,
        tasks,
        tableRows: rows,
        verificacaoTapes,
      });
      const versao = (record.versao ?? 1) + 1;
      const em = new Date().toISOString();
      const assinatura = assinaturaRetificada(record.pdf_signature, hash, {
        versao,
        por: operador?.label ?? signerName,
        porUserId: user.id,
        em,
        motivo: motivo.trim(),
      });
      const { error } = await editarFichaExportada({
        id: record.id,
        token,
        date,
        turnData,
        tasks,
        tableRows: rows,
        assinatura,
        motivo: motivo.trim(),
      });
      if (error) {
        toast.error(error);
        setToken(null);
        setSigUrl(null);
        return;
      }
      toast.success(`Ficha retificada (versão ${versao}). O original ficou guardado no histórico.`);
      onSaved({
        ...record,
        date,
        turn_data: turnData as never,
        tasks: tasks as never,
        table_rows: rows as never,
        pdf_signature: assinatura,
        versao,
        editada_em: em,
        editada_por_codigo: operador?.value ?? null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Retificar ficha — {record.date}</DialogTitle>
        <DialogDescription>
          A ficha original fica guardada no histórico de retificações (quem, quando, porquê e o que mudou). Só administradores.
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Data e turnos</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="tabela">Tabela ({rows.length})</TabsTrigger>
          {temTapes && <TabsTrigger value="tapes">Tapes</TabsTrigger>}
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="max-w-xs space-y-1">
            <Label htmlFor="ret-data">Data da ficha</Label>
            <Input id="ret-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {['turno1', 'turno2', 'turno3'].map((t) => (
            <div key={t} className="grid gap-3 rounded-md border p-3 sm:grid-cols-4">
              <p className="text-sm font-semibold sm:col-span-4">{NOME_TURNO[t]}</p>
              <div className="space-y-1">
                <Label className="text-xs">Operador</Label>
                <Input value={turnData[t]?.operator ?? ''} onChange={(e) => setTurno(t, 'operator', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entrada</Label>
                <Input type="time" value={turnData[t]?.entrada ?? ''} onChange={(e) => setTurno(t, 'entrada', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Saída</Label>
                <Input type="time" value={turnData[t]?.saida ?? ''} onChange={(e) => setTurno(t, 'saida', e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-4">
                <Label className="text-xs">Observações</Label>
                <Textarea value={turnData[t]?.observations ?? ''} onChange={(e) => setTurno(t, 'observations', e.target.value)} className="min-h-[60px]" />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-4">
          {Object.keys(tasks).map((t) => (
            <div key={t} className="rounded-md border p-3">
              <p className="mb-2 text-sm font-semibold">{NOME_TURNO[t] ?? t}</p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {Object.entries(tasks[t] as Obj).map(([k, v]) =>
                  typeof v === 'boolean' ? (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox id={`rt-${t}-${k}`} checked={v} onCheckedChange={(c) => setTarefa(t, k, !!c)} />
                      <Label htmlFor={`rt-${t}-${k}`} className="cursor-pointer font-normal">{rotuloChave(k)}</Label>
                    </div>
                  ) : (
                    <div key={k} className="flex items-center gap-2">
                      <Label htmlFor={`rt-${t}-${k}`} className="w-40 shrink-0 text-xs font-normal">{rotuloChave(k)}</Label>
                      <Input id={`rt-${t}-${k}`} value={String(v ?? '')} onChange={(e) => setTarefa(t, k, e.target.value)} className="h-8" />
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tabela" className="space-y-2">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="px-2 py-1 w-10">#</th>
                  {CAMPOS_LINHA.map(([, l]) => <th key={l} className="px-2 py-1">{l}</th>)}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={String(r.id) + '-' + i} className="border-t">
                    <td className="px-2 py-1 text-muted-foreground">{String(r.id)}</td>
                    {CAMPOS_LINHA.map(([k, l]) => (
                      <td key={k} className="px-1 py-1">
                        <Input aria-label={l} value={String(r[k] ?? '')} onChange={(e) => setLinha(i, k, e.target.value)} className="h-8 min-w-[6rem]" />
                      </td>
                    ))}
                    <td className="px-1">
                      <Button type="button" variant="ghost" size="icon" aria-label={`Apagar a linha ${r.id}`} onClick={() => setRows((rs) => rs.filter((_, ri) => ri !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((rs) => [...rs, { id: rs.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar linha
          </Button>
        </TabsContent>

        {temTapes && (
          <TabsContent value="tapes" className="space-y-3">
            <div className="max-w-sm space-y-1">
              <Label htmlFor="ret-tape-por">Verificado por (quem fez o display)</Label>
              <Input id="ret-tape-por" value={tapes.verificadoPor ?? ''} onChange={(e) => setTape('verificadoPor', e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(tapes)
                .filter(([, v]) => typeof v === 'boolean')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <Checkbox id={`rtape-${k}`} checked={v as boolean} onCheckedChange={(c) => setTape(k, !!c)} />
                    <Label htmlFor={`rtape-${k}`} className="cursor-pointer font-normal uppercase">{k}</Label>
                  </div>
                ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <div className="space-y-2 rounded-md border bg-muted/30 p-3">
        <p className="text-sm font-semibold">
          O que vai mudar <span className="font-normal text-muted-foreground">({mudancas.length})</span>
        </p>
        {mudancas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ainda não alteraste nada.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {mudancas.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.campo}:</span>{' '}
                <span className="text-muted-foreground line-through">{m.de}</span> → <span>{m.para}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="ret-motivo">Motivo da retificação (obrigatório)</Label>
        <Textarea id="ret-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: a data estava trocada — era dia 1 e foi exportada como dia 2." className="min-h-[60px]" />
      </div>

      <SignatureSection
        signerName={signerName}
        onSignerNameChange={setSignerName}
        signatureDataUrl={sigUrl}
        onSignatureChange={setSigUrl}
        signingToken={token}
        onSigningTokenChange={setToken}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={guardar} disabled={saving || !assinado || motivo.trim().length < 10 || mudancas.length === 0}>
          {saving ? 'A guardar…' : 'Guardar retificação'}
        </Button>
      </div>
    </>
  );
}
