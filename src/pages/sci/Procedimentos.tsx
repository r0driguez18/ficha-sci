
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { useFichasPorFechar } from '@/services/fichasPorFecharService';
import { dataCurta, type TipoFicha } from '@/lib/fichasPorFechar';

const CARDS: { title: string; description: string; detail: string; to: string; tipo: TipoFicha }[] = [
  {
    title: 'FD Dia Útil',
    description: 'Procedimentos normais',
    detail: 'Execute os procedimentos padrão para dias úteis normais.',
    to: '/sci/taskboard',
    tipo: 'dia-util',
  },
  {
    title: 'FD Dia Não Útil',
    description: 'Fins de semana e feriados',
    detail: 'Procedimentos específicos para dias não úteis. Inclui a folha de Verificação de Tapes.',
    to: '/sci/taskboard-dia-nao-util',
    tipo: 'dia-nao-util',
  },
];

const Procedimentos = () => {
  const navigate = useNavigate();
  const porFechar = useFichasPorFechar();

  return (
    <PageContainer size="default">
      <PageHeader
        title="Ficha de Procedimentos"
        subtitle="Escolhe a ficha a preencher"
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
                {porFechar
                  .filter((f) => f.formType === card.tipo)
                  .map((f) => (
                    <div
                      key={f.date}
                      role="status"
                      className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-50 p-2.5 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Ficha por fechar: {dataCurta(f.date)}</strong>
                        <br />
                        Ao abrir, continuas esta ficha e podes validá-la e exportá-la.
                      </span>
                    </div>
                  ))}
                <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Iniciar procedimentos</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Procedimentos;
