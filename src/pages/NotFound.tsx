import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('404 — rota inexistente:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <Compass className="h-10 w-10 text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="text-3xl font-semibold tracking-tight">404</p>
            <p className="text-sm text-muted-foreground">
              Esta página não existe ou foi movida.
            </p>
          </div>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
