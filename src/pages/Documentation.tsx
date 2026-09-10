
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Book } from 'lucide-react';

const Documentation = () => {
  const docs = [
    {
      title: 'SCI - Sistema de Controle Interno',
      description: 'Documentação para gerenciamento de tarefas e relatórios',
      icon: FileText,
      content: 'Utilize o módulo SCI para gerenciar tarefas internas, criar relatórios e acompanhar o progresso das atividades. O Taskboard permite criar listas de tarefas com checkboxes e gerar relatórios em PDF.'
    },
    {
      title: 'CRC - Fecho de Inconsistências',
      description: 'Guia do fecho de inconsistências no CRC Front Office',
      icon: Book,
      content: 'O módulo CRC confirma em massa as inconsistências pendentes no CRC Front Office, através de um serviço local que abre o Chrome para o login e corre o ciclo de confirmação.'
    }
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Documentação" 
        subtitle="Guias de utilização do sistema"
      />
      
      <div className="grid grid-cols-1 gap-6">
        {docs.map((doc, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <doc.icon className="h-5 w-5 text-primary" />
                <CardTitle>{doc.title}</CardTitle>
              </div>
              <CardDescription>{doc.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{doc.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documentation;
