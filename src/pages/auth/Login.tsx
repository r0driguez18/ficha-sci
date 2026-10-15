
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { emailDeLogin } from '@/lib/utilizador';
import { ReporSenhaPorPin } from '@/components/auth/ReporSenhaPorPin';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [aRepor, setARepor] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: emailDeLogin(email), password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error: any) {
      const raw = error?.message || '';
      const isInvalid = raw.toLowerCase().includes('invalid') || raw.toLowerCase().includes('credenciais');
      const errorMessage = isInvalid ? 'Utilizador ou senha incorretos' : (raw || 'Erro ao fazer login');
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (aRepor) {
    return (
      <ReporSenhaPorPin
        utilizadorInicial={email.includes('@') ? '' : email}
        onVoltar={() => setARepor(false)}
        onConcluido={(u) => {
          setEmail(u);
          setPassword('');
          setFormError(null);
          setARepor(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-[420px] shadow-lg border border-border/60 rounded-xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        
        <CardHeader className="space-y-4 pb-0 pt-8 px-8">
          {/* Icon + Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">BCA - SCI</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sistema de Controlo Interno
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-6">
          {formError && (
            <Alert variant="destructive" className="mb-5 rounded-xl">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Utilizador (ou email, nas contas antigas) */}
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-foreground mb-1.5 block">
                Utilizador
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="utilizador"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => { setARepor(true); setFormError(null); }}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  A entrar...
                </span>
              ) : 'Entrar'}
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              As contas são criadas pelo administrador do sistema. Se não consegues entrar, pede-lhe
              um link novo.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
