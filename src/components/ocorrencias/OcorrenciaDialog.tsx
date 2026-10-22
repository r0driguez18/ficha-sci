import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CATEGORIAS, TURNOS, horaAtual, validarOcorrencia, type FormOcorrencia, type Ocorrencia } from '@/lib/ocorrencias';

const SEM_VALOR = '__sem_valor__';

export const formVazio = (data: string): FormOcorrencia => ({
  data,
  turno: '',
  n_avaria: '',
  descricao: '',
  hora_inicio: horaAtual(),
  hora_termino: '',
  encaminhamento: '',
  categoria: '',
  sistema: '',
});

const doRegisto = (o: Ocorrencia): FormOcorrencia => ({
  data: o.data,
  turno: o.turno ?? '',
  n_avaria: o.n_avaria ?? '',
  descricao: o.descricao,
  hora_inicio: o.hora_inicio ?? '',
  hora_termino: o.hora_termino ?? '',
  encaminhamento: o.encaminhamento ?? '',
  categoria: o.categoria ?? '',
  sistema: o.sistema ?? '',
});

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Dia da ficha aberta (a data de uma nova ocorrência). */
  data: string;
  /** Se vier, é uma edição (a data e o turno também se podem corrigir). */
  ocorrencia?: Ocorrencia | null;
  /** Sistemas já usados, para sugerir (e assim juntar as repetições). */
  sistemasConhecidos: string[];
  onGuardar: (form: FormOcorrencia) => Promise<string | null>;
}

/** Registar ou editar uma ocorrência, com os campos da ficha em papel. */
export const OcorrenciaDialog: React.FC<Props> = ({ aberto, onFechar, data, ocorrencia, sistemasConhecidos, onGuardar }) => {
  const [f, setF] = useState<FormOcorrencia>(formVazio(data));
  const [erro, setErro] = useState<string | null>(null);
  const [aGravar, setAGravar] = useState(false);

  useEffect(() => {
    if (aberto) {
      setF(ocorrencia ? doRegisto(ocorrencia) : formVazio(data));
      setErro(null);
    }
  }, [aberto, ocorrencia, data]);

  const mudar = <K extends keyof FormOcorrencia>(k: K, v: FormOcorrencia[K]) => setF((x) => ({ ...x, [k]: v }));
  const edicao = !!ocorrencia;

  const guardar = async () => {
    const e = validarOcorrencia(f);
    if (e) {
      setErro(e);
      return;
    }
    setAGravar(true);
    const r = await onGuardar({
      ...f,
      n_avaria: f.n_avaria.trim(),
      descricao: f.descricao.trim(),
      encaminhamento: f.encaminhamento.trim(),
      sistema: f.sistema.trim(),
    });
    setAGravar(false);
    if (r) setErro(r);
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && !aGravar && onFechar()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar ocorrência' : 'Nova ocorrência'}</DialogTitle>
          <DialogDescription>
            Os mesmos campos da ficha de comunicação/ocorrências em papel. Sem hora de término, a ocorrência fica em curso.{edicao && ' Se alguém se enganou na data ou no turno, corrige-os aqui.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="oc-n">N.º Avaria</Label>
            <Input id="oc-n" maxLength={30} value={f.n_avaria} onChange={(e) => mudar('n_avaria', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-data">Data</Label>
            <Input id="oc-data" type="date" value={f.data} onChange={(e) => mudar('data', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Turno</Label>
            <Select
              value={f.turno || SEM_VALOR}
              onValueChange={(v) => mudar('turno', v === SEM_VALOR ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_VALOR}>—</SelectItem>
                {TURNOS.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="oc-desc">Descrição da Avaria</Label>
            <Textarea id="oc-desc" rows={3} maxLength={1000} value={f.descricao} onChange={(e) => mudar('descricao', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oc-ini">Hora início</Label>
            <Input id="oc-ini" type="time" value={f.hora_inicio} onChange={(e) => mudar('hora_inicio', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-fim">Hora término</Label>
            <Input id="oc-fim" type="time" value={f.hora_termino} onChange={(e) => mudar('hora_termino', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-enc">Encaminhamento</Label>
            <Input id="oc-enc" maxLength={300} value={f.encaminhamento} onChange={(e) => mudar('encaminhamento', e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-3">
            <p className="text-xs text-muted-foreground">
              Opcional — ajuda a pesquisar e a ver o que se repete (não aparece na ficha em papel):
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Categoria</Label>
            <Select value={f.categoria || SEM_VALOR} onValueChange={(v) => mudar('categoria', v === SEM_VALOR ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_VALOR}>—</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-sistema">Sistema</Label>
            <Input
              id="oc-sistema"
              list="oc-sistemas"
              placeholder="ex.: BCACV1"
              maxLength={60}
              value={f.sistema}
              onChange={(e) => mudar('sistema', e.target.value)}
            />
            <datalist id="oc-sistemas">
              {sistemasConhecidos.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={aGravar}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={aGravar}>
            {aGravar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {edicao ? 'Guardar' : 'Registar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
