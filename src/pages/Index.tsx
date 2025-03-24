
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Backoffice Admin</h1>
        <p className="text-xl text-gray-600 mb-8">Um sistema integrado para gerenciamento de tarefas e recursos.</p>
        
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link to="/dashboard">Acessar Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/sci/taskboard">Ver Tarefas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
