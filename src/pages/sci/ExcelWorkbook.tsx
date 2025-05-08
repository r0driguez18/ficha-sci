
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import ExcelViewer from '@/components/excel/ExcelViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

const ExcelWorkbook = () => {
  // Initial example data
  const sampleData = {
    headers: ['NIB', 'Valor', 'Nome'],
    data: [
      ['12345678901234567890123', 1500, 'João Silva'],
      ['09876543210987654321098', 2300, 'Maria Santos'],
      ['11122233344455566677788', 1800, 'Pedro Costa'],
    ]
  };

  const [contaEmpresa, setContaEmpresa] = useState('');
  const [dataProcessamento, setDataProcessamento] = useState('');
  const [referenciaOrdenante, setReferenciaOrdenante] = useState('');
  const [excelData, setExcelData] = useState(sampleData);

  // Function to update Excel data (will be passed to ExcelViewer)
  const handleDataUpdate = (updatedData) => {
    setExcelData(updatedData);
  };

  // Function to generate PS2 file based on the VBA logic
  const gerarFicheiroPS2 = () => {
    try {
      // Validate company account (NIB)
      const cleanContaEmpresa = contaEmpresa.replace(/\s/g, '');
      if (cleanContaEmpresa.length !== 21 || isNaN(Number(cleanContaEmpresa))) {
        toast.error('O NIB da empresa deve conter exatamente 21 dígitos numéricos.');
        return;
      }

      // Validate processing date
      if (dataProcessamento.length !== 8 || isNaN(Number(dataProcessamento))) {
        toast.error('A data de processamento deve estar no formato AAAAMMDD.');
        return;
      }

      // Validate reference
      if (!referenciaOrdenante.trim()) {
        toast.error('A referência do ordenante é obrigatória.');
        return;
      }

      const moeda = 'CVE';
      const paddedReferenciaOrdenante = (referenciaOrdenante.padEnd(20, ' ')).substring(0, 20);

      // Generate header (PS21)
      let cabecalho = `PS2112000${cleanContaEmpresa}${moeda}${dataProcessamento}${paddedReferenciaOrdenante}`;
      cabecalho = cabecalho.padEnd(80, '0');

      let conteudo = cabecalho + '\n';
      let somaTotal = 0;
      let totalRegistos = 0;

      // Generate detail records (PS22)
      for (let i = 0; i < excelData.data.length; i++) {
        const row = excelData.data[i];
        const nib = String(row[0]).replace(/\s/g, '');
        
        if (nib.length !== 21 || isNaN(Number(nib))) {
          toast.error(`Erro na linha ${i + 1}: o NIB deve ter exatamente 21 dígitos numéricos.`);
          return;
        }

        const valor = Number(row[1]);
        const valorFormatado = valor.toString().padStart(11, '0') + '00'; // 11 digits + 00
        
        const nome = String(row[2] || '');
        const nomeCompleto = nome.padEnd(35, ' ').substring(0, 35);

        const linhaPS22 = `PS2212000${nib}${valorFormatado}${nomeCompleto}00`;

        if (linhaPS22.length !== 80) {
          toast.error(`Erro na linha ${i + 1}: linha PS22 tem ${linhaPS22.length} caracteres (esperado: 80).`);
          return;
        }

        conteudo += linhaPS22 + '\n';
        somaTotal += valor;
        totalRegistos++;
      }

      // Generate footer (PS29)
      const totalRegFormatado = totalRegistos.toString().padStart(14, '0');
      const totalFormatado = Math.floor(somaTotal).toString().padStart(11, '0');
      
      let rodape = 'PS29000000000000';
      rodape += totalRegFormatado;
      rodape += totalFormatado;
      rodape = rodape.padEnd(80, '0');
      
      conteudo += rodape;

      // Create and download the file
      const blob = new Blob([conteudo], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ficheiro_ps2.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Ficheiro PS2 gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar ficheiro PS2:', error);
      toast.error('Ocorreu um erro ao gerar o ficheiro PS2.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Gerador PS2" 
        subtitle="Visualize e edite arquivos Excel para processamento PS2"
        id="excel-workbook-page"
      />
      
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <CardTitle>Dados para Geração PS2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contaEmpresa">NIB da Empresa (21 dígitos)</Label>
                <Input 
                  id="contaEmpresa"
                  value={contaEmpresa}
                  onChange={(e) => setContaEmpresa(e.target.value)}
                  placeholder="NIB - 21 dígitos numéricos"
                />
              </div>
              <div>
                <Label htmlFor="dataProcessamento">Data de Processamento (AAAAMMDD)</Label>
                <Input 
                  id="dataProcessamento"
                  value={dataProcessamento}
                  onChange={(e) => setDataProcessamento(e.target.value)}
                  placeholder="AAAAMMDD"
                />
              </div>
              <div>
                <Label htmlFor="referenciaOrdenante">Referência do Ordenante</Label>
                <Input 
                  id="referenciaOrdenante"
                  value={referenciaOrdenante}
                  onChange={(e) => setReferenciaOrdenante(e.target.value)}
                  placeholder="Ref. Ordenante"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={gerarFicheiroPS2} 
                className="bg-[#18467e] hover:bg-[#103662]"
              >
                <Download className="mr-2 h-4 w-4" /> Gerar Ficheiro PS2
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ExcelViewer 
              title="Dados PS2"
              initialData={sampleData}
              height="500px"
              onDataUpdate={handleDataUpdate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelWorkbook;
