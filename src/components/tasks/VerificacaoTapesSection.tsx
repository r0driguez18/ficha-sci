import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { VerificacaoTapes } from '@/types/taskboard';

interface Props {
  /** Data da ficha (herdada, só leitura). */
  data: string;
  /** Nome do operador do Turno 3 (herdado, só leitura). */
  operador: string;
  tapes: VerificacaoTapes;
  onChange: (field: keyof VerificacaoTapes, value: boolean | string) => void;
}

const BANKA: { key: keyof VerificacaoTapes; label: string }[] = [
  { key: 'bmmes', label: 'BMMES do mês anterior ao do mês em curso (1º dia mês)' },
  { key: 'bmmesb', label: 'BMMESB do mês anterior ao do mês em curso (1º dia mês)' },
  { key: 'trlog', label: 'TRLOG (1º dia mês)' },
  { key: 'blc', label: 'BLC (1º dia mês)' },
  { key: 'notlh', label: 'NOTLH (1º dia mês)' },
  { key: 'savsys', label: 'SAVSYS (último savsys efectuado)' },
  { key: 'bmsem', label: 'BMSEM (Tape semanal enviado ao Sal) (2ª feira)' },
  { key: 'brjrn', label: 'BRJRN (2ª feira)' },
  { key: 'mvcoh', label: 'MVCOH (2ª feira)' },
];

const HRM: { key: keyof VerificacaoTapes; label: string }[] = [
  { key: 'hrm', label: 'HRM (1º dia mês)' },
  { key: 'im', label: 'IM (1º dia mês)' },
  { key: 'am', label: 'AM (1º dia mês)' },
  { key: 'amjrn', label: 'AMJRN (1º dia mês)' },
];

export const VerificacaoTapesSection: React.FC<Props> = ({ data, operador, tapes, onChange }) => {
  const renderGroup = (title: string, items: typeof BANKA) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold underline">{title}</h4>
      <div className="ml-2 space-y-3">
        {items.map((it) => (
          <div key={it.key} className="flex items-start space-x-2">
            <Checkbox
              id={`tape-${it.key}`}
              checked={!!tapes[it.key]}
              onCheckedChange={(c) => onChange(it.key, !!c)}
            />
            <Label htmlFor={`tape-${it.key}`} className="cursor-pointer text-foreground">{it.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="mt-10 pt-6 border-t">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-1">Procedimento Verificação de Tapes</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Presente na ficha de dia não útil e sempre que a data corresponde ao último dia do mês.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data</Label>
          <Input value={data} readOnly disabled className="bg-muted/40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Operador</Label>
          <Input value={operador || '—'} readOnly disabled className="bg-muted/40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tape-verificadoPor" className="text-xs uppercase tracking-wide text-muted-foreground">
            Verificado por
          </Label>
          <Input
            id="tape-verificadoPor"
            value={tapes.verificadoPor}
            onChange={(e) => onChange('verificadoPor', e.target.value)}
            placeholder="Nome de quem verificou"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        De modo a verificar o bom funcionamento e o estado das tapes em uso no BCA (AS/400 e Servidores),
        para além dos «restores» diários deve ser feito um «display-tape» para papel do conteúdo das tapes
        utilizadas, principalmente da que é enviada para a ilha do Sal. Os «prints» devem ser anexados a
        este procedimento, para posterior verificação pelo controlo interno e pelas Auditorias Internas e
        Externas ao Banco.
      </p>

      <div className="space-y-6">
        {renderGroup('Tapes AS/400 – BANKA', BANKA)}
        {renderGroup('Tapes AS/400 – HRM/IM/AM', HRM)}
      </div>
    </section>
  );
};

export default VerificacaoTapesSection;
