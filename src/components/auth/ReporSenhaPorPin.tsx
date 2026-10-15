import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { reporSenhaPorPin } from '@/services/reporSenhaService';
import { SENHA_MIN, validarSenha } from '@/lib/politicaSenha';

interface Props {
  utilizadorInicial?: string;
  onVoltar: () => void;
  /** Chamado com o utilizador, depois de a senha ser reposta. */
  onConcluido: (utilizador: string) => void;
}

/** "Esqueceu a senha?": utilizador + PIN de assinatura + senha nova. Sem email. */
export function ReporSenhaPorPin({ utilizadorInicial = '', onVoltar, onConcluido }: Props) {
  const [utilizador, setUtilizador] = useState(utilizadorInicial);
  const [pin, setPin] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!utilizador.trim()) return setErro('Escreve o teu utilizador.');
    if (!/^[0-9]{4}$/.test(pin)) return setErro('O PIN tem 4 dígitos.');
    const problema = validarSenha(senha, confirmacao);
    if (problema) return setErro(problema);

    setAEnviar(true);
    const r = await reporSenhaPorPin(utilizador.trim(), pin, senha);
    setAEnviar(false);
    if (r.erro) {
      setPin('');
      return setErro(r.erro);
    }
    toast.success('Senha reposta. Já podes entrar com a senha nova.');
    onConcluido(utilizador.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-[420px] shadow-lg border border-border/60 rounded-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <CardHeader className="space-y-1 pb-2 pt-8 px-8">
          <button
            type="button"
            onClick={onVoltar}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>
          <h1 className="text-2xl font-bold text-foreground">Esqueceu a senha?</h1>
          <p className="text-sm text-muted-foreground">
            Confirma quem és com o teu <strong>PIN de assinatura</strong> e escolhe uma senha nova. Se não tens PIN, ou
            falhar, pede ao administrador um link novo.
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {erro && (
            <Alert variant="destructive" className="mb-4 rounded-xl">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={submeter} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="repor-utilizador" className="text-sm font-medium text-foreground">
                Utilizador
              </label>
              <Input
                id="repor-utilizador"
                value={utilizador}
                onChange={(e) => setUtilizador(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="repor-pin" className="text-sm font-medium text-foreground">
                PIN de assinatura
              </label>
              <Input
                id="repor-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="h-11 rounded-xl tracking-[0.5em] text-center text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="repor-senha" className="text-sm font-medium text-foreground">
                Senha nova (mín. {SENHA_MIN} caracteres)
              </label>
              <Input
                id="repor-senha"
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="repor-confirmar" className="text-sm font-medium text-foreground">
                Repete a senha nova
              </label>
              <Input
                id="repor-confirmar"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={aEnviar}>
              <KeyRound className="mr-2 h-4 w-4" />
              {aEnviar ? 'A repor…' : 'Repor senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
