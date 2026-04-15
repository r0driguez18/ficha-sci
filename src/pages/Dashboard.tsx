
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClipboardCheck, PieChart, ArrowRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { DailyAlertsWidget } from '@/components/alerts/DailyAlertsWidget';

const Dashboard = () => {
  const modules = [
    {
      title: 'SCI',
      description: 'Sistema de Controle Interno',
      icon: ClipboardCheck,
      path: '/sci/procedimentos',
    },
    {
      title: 'Processamentos',
      description: 'Estatísticas e Relatórios',
      icon: PieChart,
      path: '/easyvista/estatisticas',
    }
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle="Bem-vindo ao seu Backoffice Admin"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {modules.map((module) => (
          <RouterLink to={module.path} key={module.title} className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <module.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="mt-4 text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acesse o módulo {module.title} para gerenciar seus recursos.
                </p>
              </CardContent>
            </Card>
          </RouterLink>
        ))}
        
        <div className="h-full">
          <DailyAlertsWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
