
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClipboardCheck, Link, Database, PieChart } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { DailyAlertsWidget } from '@/components/alerts/DailyAlertsWidget';
import { useAuth } from '@/components/auth/AuthProvider';

const Dashboard = () => {
  const { user } = useAuth();
  
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

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Utilizador';
  };
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title={`Bem-vindo, ${getUserDisplayName()}!`}
        subtitle="Acesso rápido aos módulos do sistema"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <div className="xl:col-span-1">
          {/* Load alerts asynchronously to not block dashboard rendering */}
          <React.Suspense fallback={
            <Card>
              <CardHeader>
                <CardTitle>Alertas do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando alertas...</span>
                </div>
              </CardContent>
            </Card>
          }>
          <DailyAlertsWidget />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
