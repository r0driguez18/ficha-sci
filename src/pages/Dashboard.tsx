
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClipboardCheck, Link, Database, PieChart } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const Dashboard = () => {
  const modules = [
    {
      title: 'SCI',
      description: 'Sistema de Controle Interno',
      icon: ClipboardCheck,
      path: '/sci/procedimentos',
      color: 'bg-blue-500'
    },
    {
      title: 'CRC',
      description: 'Tratamento de Ficheiros',
      icon: Link,
      path: '/crc/tratamento',
      color: 'bg-purple-500'
    },
    {
      title: 'DIS',
      description: 'Dados e Inserção',
      icon: Database,
      path: '/dis/dados',
      color: 'bg-orange-500'
    },
    {
      title: 'Processamentos',
      description: 'Estatísticas e Relatórios',
      icon: PieChart,
      path: '/easyvista/estatisticas',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle="Bem-vindo ao seu Backoffice Admin"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => (
          <RouterLink to={module.path} key={module.title} className="hover-card-effect">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-full ${module.color} flex items-center justify-center text-white`}>
                    <module.icon className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
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
      </div>
    </div>
  );
};

export default Dashboard;
