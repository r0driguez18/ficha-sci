
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { precisaTrocarSenha } from '@/lib/politicaSenha';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Conta criada com palavra-passe que a pessoa não escolheu: tem de a trocar antes de usar a app.
  if (precisaTrocarSenha(user.user_metadata)) {
    return <Navigate to="/auth/definir-senha" replace />;
  }

  return <>{children}</>;
};
