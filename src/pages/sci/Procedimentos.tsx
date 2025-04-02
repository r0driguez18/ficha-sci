
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

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Ficha de Procedimentos" 
        subtitle="Selecione o tipo de ficha de procedimentos"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardContent className="p-0 flex flex-col space-y-4">
            <h3 className="text-xl font-semibold mb-4">Selecione o tipo de procedimento</h3>
            
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
              onClick={goToTaskboard}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Dia Não Útil
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboard}
            >
              <FileText className="mr-2 h-5 w-5" />
              FD Final do Mês Dia Útil
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-[#18467e] text-white hover:bg-[#103662] h-14 text-lg justify-start"
              onClick={goToTaskboard}
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
