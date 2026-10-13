import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { CHAVE_TROCA_OBRIGATORIA, SENHA_MIN, precisaTrocarSenha, validarSenha } from '@/lib/politicaSenha';

/**
 * Primeiro acesso: a conta foi criada com uma palavra-passe que a pessoa não escolheu
 * (temporária, ou aleatória). Até a trocar, nenhuma outra página abre (ver PrivateRoute).
 */
const DefinirSenha = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth/login', { replace: true });
    else if (!precisaTrocarSenha(user.user_metadata)) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarSenha(senha, confirmacao);
    setErro(problema);
    if (problema) return;

    setAGuardar(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
        data: { [CHAVE_TROCA_OBRIGATORIA]: false },
      });
      if (error) throw error;
      toast.success('Palavra-passe definida.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setErro(
        /different from the old/i.test(msg)
          ? 'A palavra-passe nova tem de ser diferente da atual.'
          : msg || 'Não foi possível guardar a palavra-passe.',
      );
    } finally {
      setAGuardar(false);
    }
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Escolhe a tua palavra-passe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta conta foi criada com uma palavra-passe provisória. Escolhe uma que só tu saibas — ninguém a vai ver.
          </p>
        </CardHeader>
        <CardContent>
          {erro && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={guardar} className="space-y-4">
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={`Nova palavra-passe (mín. ${SENHA_MIN} caracteres)`}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Repete a nova palavra-passe"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={aGuardar}>
              {aGuardar ? 'A guardar…' : 'Guardar e entrar'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={sair}>
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefinirSenha;
