import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PinDialog } from '@/components/taskboard/PinDialog';
import { operatorHasPin, setOperatorPin, changeOperatorPin } from '@/services/operatorPinService';

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);
const FOUR = /^[0-9]{4}$/;

export function PinManagerCard() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [setOpen, setSetOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => operatorHasPin().then(setHasPin);
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (changeOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setBusy(false);
    }
  }, [changeOpen]);

  const submitChange = async () => {
    if (!FOUR.test(currentPin) || !FOUR.test(newPin)) {
      setError('Os PIN têm de ter 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('O novo PIN não coincide com a confirmação.');
      return;
    }
    setBusy(true);
    setError(null);
    const { ok, error: err } = await changeOperatorPin(currentPin, newPin);
    setBusy(false);
    if (ok) {
      setChangeOpen(false);
      toast.success('PIN alterado.');
    } else {
      setError(err || 'Não foi possível alterar o PIN.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PIN de assinatura</CardTitle>
        <CardDescription>
          Código pessoal de 4 dígitos usado para assinar as fichas de procedimentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          {hasPin === null ? (
            <span className="text-muted-foreground">A verificar…</span>
          ) : hasPin ? (
            <>
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>PIN definido.</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4 text-warning" />
              <span>Ainda não definiu um PIN.</span>
            </>
          )}
        </div>

        <div className="pt-2">
          {hasPin ? (
            <Button variant="outline" onClick={() => setChangeOpen(true)}>
              Alterar PIN
            </Button>
          ) : (
            <Button onClick={() => setSetOpen(true)} disabled={hasPin === null}>
              Definir PIN
            </Button>
          )}
        </div>
      </CardContent>

      <PinDialog
        open={setOpen}
        onOpenChange={setSetOpen}
        mode="set"
        operatorName=""
        onConfirm={async (pin) => {
          const { error: err } = await setOperatorPin(pin);
          return { ok: !err, error: err };
        }}
        onSuccess={() => {
          setHasPin(true);
          toast.success('PIN definido.');
        }}
      />

      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar PIN</DialogTitle>
            <DialogDescription>Introduza o PIN atual e o novo PIN de 4 dígitos.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) submitChange();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="cur-pin">PIN atual</Label>
              <Input
                id="cur-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={currentPin}
                onChange={(e) => setCurrentPin(digits(e.target.value))}
                className="tracking-[0.5em] text-center text-lg"
                placeholder="••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pin">Novo PIN</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={newPin}
                onChange={(e) => setNewPin(digits(e.target.value))}
                className="tracking-[0.5em] text-center text-lg"
                placeholder="••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pin">Confirmar novo PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmPin}
                onChange={(e) => setConfirmPin(digits(e.target.value))}
                className="tracking-[0.5em] text-center text-lg"
                placeholder="••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setChangeOpen(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'A guardar…' : 'Alterar PIN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
