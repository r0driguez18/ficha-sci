
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Book, HelpCircle, ExternalLink } from 'lucide-react';

const Documentation = () => {
  const docs = [
    {
      title: 'SCI - Sistema de Controle Interno',
      description: 'Documentação para gerenciamento de tarefas e relatórios',
      icon: FileText,
      content: 'Utilize o módulo SCI para gerenciar tarefas internas, criar relatórios e acompanhar o progresso das atividades. O Taskboard permite criar listas de tarefas com checkboxes e gerar relatórios em PDF.'
    },
    {
      title: 'CRC - Tratamento de Ficheiros',
      description: 'Guia para gerenciamento de referências',
      icon: Book,
      content: 'O módulo CRC permite adicionar e remover referências de arquivos. Utilize este módulo para manter um controle organizado dos seus documentos e referências.'
    },
    {
      title: 'DIS - Dados e Inserção',
      description: 'Manual de operação da base de dados',
      icon: HelpCircle,
      content: 'O DIS oferece uma interface completa para operações CRUD (Criar, Ler, Atualizar, Deletar) em suas tabelas de dados. Também é possível exportar dados para Excel para análises mais detalhadas.'
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
