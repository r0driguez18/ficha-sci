
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O Supabase volta a emitir o evento de sessão sempre que a janela ganha foco (e ao renovar o token), com um objeto
    // `user` novo mas a mesma pessoa. Quem depende de `user` (ex.: o carregamento da ficha) recarregava tudo e fazia
    // perder o scroll e o que estava por gravar. Mantém-se o mesmo objeto enquanto for o mesmo utilizador.
    const aplicar = (s: Session | null) => {
      setSession(s);
      setUser((antes) => {
        const novo = s?.user ?? null;
        return antes && novo && antes.id === novo.id ? antes : novo;
      });
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => aplicar(s));

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => aplicar(session));

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
