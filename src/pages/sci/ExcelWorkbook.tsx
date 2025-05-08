
import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import ExcelViewer from '@/components/excel/ExcelViewer';
import { Card, CardContent } from '@/components/ui/card';

const ExcelWorkbook = () => {
  // Example initial data (optional)
  const sampleData = {
    headers: ['ID', 'Nome', 'Departamento', 'Data', 'Valor'],
    data: [
      [1, 'João Silva', 'Operações', '2025-01-15', 1500.00],
      [2, 'Maria Santos', 'Financeiro', '2025-01-16', 2300.50],
      [3, 'Pedro Costa', 'TI', '2025-01-17', 1800.75],
    ]
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Gerador PS2" 
        subtitle="Visualize e edite arquivos Excel para processamento PS2"
        id="excel-workbook-page"
      />
      
      <div className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <ExcelViewer 
              title="Gerador PS2" 
              initialData={sampleData}
              height="500px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelWorkbook;
