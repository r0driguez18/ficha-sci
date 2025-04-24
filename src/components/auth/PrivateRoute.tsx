
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};
