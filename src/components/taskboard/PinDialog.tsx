import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

type Mode = 'set' | 'enter';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  operatorName: string;
  /** Valida o PIN. Devolve ok=false + mensagem para mostrar no diálogo. */
  onConfirm: (pin: string) => Promise<{ ok: boolean; error?: string | null }>;
  /** Chamado depois de um PIN válido; o diálogo já se fechou. */
  onSuccess: () => void;
}

const FOUR_DIGITS = /^[0-9]{4}$/;

function digitsOnly(v: string) {
  return v.replace(/\D/g, '').slice(0, 4);
}

export function PinDialog({ open, onOpenChange, mode, operatorName, onConfirm, onSuccess }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setConfirmPin('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    if (!FOUR_DIGITS.test(pin)) {
      setError('O PIN tem de ter 4 dígitos.');
      return;
    }
    if (mode === 'set' && pin !== confirmPin) {
      setError('Os dois PIN não coincidem.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await onConfirm(pin);
    setBusy(false);
    if (res.ok) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError(res.error || 'PIN incorreto.');
      setPin('');
      setConfirmPin('');
    }
  };

  const asName = operatorName ? ` como ${operatorName}` : '';
  const title = mode === 'set' ? 'Definir PIN de assinatura' : 'Assinar ficha';
  const description =
    mode === 'set'
      ? `Defina um código de 4 dígitos que passará a usar para assinar as fichas${asName}.`
      : `Introduza o seu PIN de 4 dígitos para assinar esta ficha${asName}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pin-field">{mode === 'set' ? 'Novo PIN' : 'PIN'}</Label>
            <Input
              id="pin-field"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={pin}
              onChange={(e) => setPin(digitsOnly(e.target.value))}
              placeholder="••••"
              className="tracking-[0.5em] text-center text-lg"
            />
          </div>

          {mode === 'set' && (
            <div className="space-y-1.5">
              <Label htmlFor="pin-confirm">Confirmar PIN</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmPin}
                onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
                placeholder="••••"
                className="tracking-[0.5em] text-center text-lg"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'A validar…' : mode === 'set' ? 'Definir e assinar' : 'Assinar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
