
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Book } from 'lucide-react';

const Documentation = () => {
  const docs = [
    {
      title: 'SCI — Sistema de Controlo Interno',
      description: 'Fichas de procedimentos, histórico, retornos e passagem de turno',
      icon: FileText,
      content: 'No módulo SCI preenche-se a ficha de procedimentos do turno (tarefas com marcação, observações e assinatura), consulta-se o histórico de fichas guardadas, acompanham-se os retornos de cobrança com o respetivo SLA e regista-se a passagem de turno. As fichas são exportadas em PDF.'
    },
    {
      title: 'CRC - Fecho de Inconsistências',
      description: 'Guia do fecho de inconsistências no CRC Front Office',
      icon: Book,
      content: 'O módulo CRC confirma em massa as inconsistências pendentes no CRC Front Office, através de um serviço local que abre o Chrome para o login e corre o ciclo de confirmação.'
    }
  ];

  return (
    <PageContainer size="default">
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
    </PageContainer>
  );
};

export default Documentation;
