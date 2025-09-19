
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 glass-morphism rounded-lg text-center space-y-6 animate-fade-in">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
        <p className="text-muted-foreground">A página que você está procurando não existe ou foi movida.</p>
        <div className="pt-4">
          <Button onClick={() => navigate("/")} className="min-w-32">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
