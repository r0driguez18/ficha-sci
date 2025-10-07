
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';

import { FileText, ArrowRight } from 'lucide-react';

const Procedimentos = () => {
  const navigate = useNavigate();

  const goToTaskboard = () => {
    navigate('/sci/taskboard');
  };
  
  const goToTaskboardDiaNaoUtil = () => {
    navigate('/sci/taskboard-dia-nao-util');
  };
  
  const goToTaskboardFinalMesUtil = () => {
    navigate('/sci/taskboard-final-mes-util');
  };
  
  const goToTaskboardFinalMesNaoUtil = () => {
    navigate('/sci/taskboard-final-mes-nao-util');
  };

  return (
    <div className="animate-fade-in container mx-auto px-4">
      <PageHeader 
        title="Ficha de Procedimentos" 
        subtitle="Selecione o tipo de ficha de procedimentos que deseja executar"
      />

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <EnhancedCard 
            variant="interactive" 
            className="group cursor-pointer"
            onClick={goToTaskboard}
          >
            <EnhancedCardHeader>
              <div className="flex items-center justify-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <EnhancedCardTitle className="text-lg">FD Dia Útil</EnhancedCardTitle>
                    <EnhancedCardDescription>Procedimentos normais</EnhancedCardDescription>
                  </div>
                </div>
                
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Execute os procedimentos padrão para dias úteis normais.
              </p>
              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                <span className="text-sm font-medium">Iniciar procedimentos</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard 
            variant="interactive" 
            className="group cursor-pointer"
            onClick={goToTaskboardDiaNaoUtil}
          >
            <EnhancedCardHeader>
              <div className="flex items-center justify-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <EnhancedCardTitle className="text-lg">FD Dia Não Útil</EnhancedCardTitle>
                    <EnhancedCardDescription>Fins de semana e feriados</EnhancedCardDescription>
                  </div>
                </div>
                
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Procedimentos específicos para dias não úteis.
              </p>
              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                <span className="text-sm font-medium">Iniciar procedimentos</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard 
            variant="interactive" 
            className="group cursor-pointer"
            onClick={goToTaskboardFinalMesUtil}
          >
            <EnhancedCardHeader>
              <div className="flex items-center justify-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <EnhancedCardTitle className="text-lg">FD Final Mês Útil</EnhancedCardTitle>
                    <EnhancedCardDescription>Fechamento mensal</EnhancedCardDescription>
                  </div>
                </div>
                
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Procedimentos de final de mês em dias úteis.
              </p>
              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                <span className="text-sm font-medium">Iniciar procedimentos</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard 
            variant="interactive" 
            className="group cursor-pointer"
            onClick={goToTaskboardFinalMesNaoUtil}
          >
            <EnhancedCardHeader>
              <div className="flex items-center justify-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <EnhancedCardTitle className="text-lg">FD Final Mês Não Útil</EnhancedCardTitle>
                    <EnhancedCardDescription>Fechamento especial</EnhancedCardDescription>
                  </div>
                </div>
                
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Procedimentos de final de mês em dias não úteis.
              </p>
              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                <span className="text-sm font-medium">Iniciar procedimentos</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
};

export default Procedimentos;
