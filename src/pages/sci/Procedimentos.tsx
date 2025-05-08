
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

const Procedimentos = () => {
  const navigate = useNavigate();

  const goToTaskboard = () => {
    navigate('/sci/taskboard');
  };
  
  const goToTaskboardDiaNaoUtil = () => {
    navigate('/sci/taskboard-nao-util');
  };
  
  const goToTaskboardFinalMesUtil = () => {
    // This will be implemented later
    navigate('/sci/taskboard');
  };
  
  const goToTaskboardFinalMesNaoUtil = () => {
    // This will be implemented later
    navigate('/sci/taskboard-nao-util');
  };

  return (
    <div className="animate-fade-in container mx-auto px-4">
      <PageHeader 
        title="Ficha de Procedimentos" 
        subtitle="Selecione o tipo de ficha de procedimentos"
      />

      <div className="flex justify-center items-center">
        <Card className="p-6 w-full max-w-md">
          <CardContent className="p-0 flex flex-col space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-center">Selecione o tipo de procedimento</h3>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboard}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Dia Útil
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboardDiaNaoUtil}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Dia Não Útil
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboardFinalMesUtil}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Final do Mês Dia Útil
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboardFinalMesNaoUtil}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Final do Mês Dia Não Útil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Procedimentos;
