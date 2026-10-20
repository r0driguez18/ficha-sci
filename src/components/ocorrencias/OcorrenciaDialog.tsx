import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import {
  CATEGORIAS,
  GRAVIDADES,
  TURNOS,
  validarOcorrencia,
  type FormOcorrencia,
  type Ocorrencia,
} from '@/lib/ocorrencias';
import { todayIso } from '@/lib/taskboardDefaults';

const SEM_TURNO = '__sem_turno__';

export const formVazio = (): FormOcorrencia => ({
  data: todayIso(),
  hora: '',
  turno: '',
  categoria: '',
  gravidade: 'media',
  sistema: '',
  titulo: '',
  descricao: '',
});

const doRegisto = (o: Ocorrencia): FormOcorrencia => ({
  data: o.data,
  hora: o.hora ?? '',
  turno: o.turno ?? '',
  categoria: o.categoria,
  gravidade: o.gravidade,
  sistema: o.sistema ?? '',
  titulo: o.titulo,
  descricao: o.descricao ?? '',
});

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Se vier, é uma edição (a data e o turno não se alteram). */
  ocorrencia?: Ocorrencia | null;
  /** Sistemas já usados, para sugerir (e assim juntar as repetições). */
  sistemasConhecidos: string[];
  onGuardar: (form: FormOcorrencia) => Promise<string | null>;
}

/** Registar ou editar uma ocorrência. */
export const OcorrenciaDialog: React.FC<Props> = ({ aberto, onFechar, ocorrencia, sistemasConhecidos, onGuardar }) => {
  const [f, setF] = useState<FormOcorrencia>(formVazio());
  const [erro, setErro] = useState<string | null>(null);
  const [aGravar, setAGravar] = useState(false);

  useEffect(() => {
    if (aberto) {
      setF(ocorrencia ? doRegisto(ocorrencia) : formVazio());
      setErro(null);
    }
  }, [aberto, ocorrencia]);

  const mudar = <K extends keyof FormOcorrencia>(k: K, v: FormOcorrencia[K]) => setF((x) => ({ ...x, [k]: v }));
  const edicao = !!ocorrencia;

  const guardar = async () => {
    const e = validarOcorrencia(f);
    if (e) {
      setErro(e);
      return;
    }
    setAGravar(true);
    const r = await onGuardar({ ...f, titulo: f.titulo.trim(), sistema: f.sistema.trim() });
    setAGravar(false);
    if (r) setErro(r);
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && !aGravar && onFechar()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar ocorrência' : 'Nova ocorrência'}</DialogTitle>
          <DialogDescription>
            Regista o que aconteceu de forma que se possa pesquisar e comparar mais tarde. Sê concreto: o que falhou, onde e o que se fez.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="oc-data">Data</Label>
            <Input id="oc-data" type="date" value={f.data} disabled={edicao} onChange={(e) => mudar('data', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-hora">Hora (opcional)</Label>
            <Input id="oc-hora" type="time" value={f.hora} onChange={(e) => mudar('hora', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Turno</Label>
            <Select
              value={f.turno || SEM_TURNO}
              disabled={edicao}
              onValueChange={(v) => mudar('turno', v === SEM_TURNO ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_TURNO}>—</SelectItem>
                {TURNOS.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Categoria</Label>
            <Select value={f.categoria} onValueChange={(v) => mudar('categoria', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Escolhe…" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gravidade</Label>
            <Select value={f.gravidade} onValueChange={(v) => mudar('gravidade', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRAVIDADES.map((g) => (
                  <SelectItem key={g.valor} value={g.valor}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="oc-sistema">Sistema afetado (opcional)</Label>
            <Input
              id="oc-sistema"
              list="oc-sistemas"
              placeholder="ex.: BCACV1, SISP, Vinti4"
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

          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="oc-titulo">Título</Label>
            <Input id="oc-titulo" maxLength={120} value={f.titulo} onChange={(e) => mudar('titulo', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="oc-desc">Descrição (opcional)</Label>
            <Textarea id="oc-desc" rows={4} maxLength={2000} value={f.descricao} onChange={(e) => mudar('descricao', e.target.value)} />
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
