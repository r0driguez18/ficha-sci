import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { diffFicha } from '@/lib/retificacaoFicha';
import { listarEdicoesFicha, type EdicaoFicha, type ExportedTaskboard } from '@/services/exportedTaskboardService';

const quando = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-PT');
};

/** Quem retificou a ficha, quando, porquê e o que mudou . */
export function HistoricoEdicoesDialog({ record, onClose }: { record: ExportedTaskboard | null; onClose: () => void }) {
  const [edicoes, setEdicoes] = useState<EdicaoFicha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!record) return;
    let vivo = true;
    setEdicoes(null);
    setErro(null);
    listarEdicoesFicha(record.id).then(({ data, error }) => {
      if (!vivo) return;
      setEdicoes(data);
      setErro(error);
    });
    return () => {
      vivo = false;
    };
  }, [record]);

  return (
    <Dialog open={!!record} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Retificações — ficha de {record?.date}</DialogTitle>
          <DialogDescription>Cada retificação guarda a versão anterior completa; nada se perde nem se apaga.</DialogDescription>
        </DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {!erro && edicoes === null && <p className="text-sm text-muted-foreground">A carregar…</p>}
        {edicoes?.length === 0 && <p className="text-sm text-muted-foreground">Esta ficha nunca foi retificada.</p>}
        <div className="space-y-4">
          {edicoes?.map((e) => {
            const mudancas = diffFicha(e.antes, e.depois);
            return (
              <div key={e.id} className="rounded-md border p-3 text-sm">
                <p className="font-semibold">
                  Versão {e.versao_anterior} → {e.versao_nova}
                  <span className="ml-2 font-normal text-muted-foreground">
                    por {e.editado_por_codigo ?? '—'} · {quando(e.editado_em)}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Motivo:</span> {e.motivo}
                </p>
                {mudancas.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {mudancas.map((m, i) => (
                      <li key={i}>
                        <span className="font-medium">{m.campo}:</span>{' '}
                        <span className="text-muted-foreground line-through">{m.de}</span> → {m.para}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
