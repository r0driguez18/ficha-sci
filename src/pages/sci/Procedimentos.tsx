
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { FileText, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    title: 'FD Dia Útil',
    description: 'Procedimentos normais',
    detail: 'Execute os procedimentos padrão para dias úteis normais.',
    to: '/sci/taskboard',
  },
  {
    title: 'FD Dia Não Útil',
    description: 'Fins de semana e feriados',
    detail: 'Procedimentos específicos para dias não úteis. Inclui a folha de Verificação de Tapes.',
    to: '/sci/taskboard-dia-nao-util',
  },
];

const Procedimentos = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in container mx-auto px-4">
      <PageHeader
        title="Ficha de Procedimentos"
        subtitle="Selecione o tipo de ficha de procedimentos que deseja executar"
      />

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {CARDS.map((card) => (
            <EnhancedCard
              key={card.to}
              variant="interactive"
              className="group cursor-pointer"
              onClick={() => navigate(card.to)}
            >
              <EnhancedCardHeader>
                <div className="flex items-center justify-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <EnhancedCardTitle className="text-lg">{card.title}</EnhancedCardTitle>
                      <EnhancedCardDescription>{card.description}</EnhancedCardDescription>
                    </div>
                  </div>
                </div>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <p className="text-sm text-muted-foreground mb-4">{card.detail}</p>
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Iniciar procedimentos</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Procedimentos;
