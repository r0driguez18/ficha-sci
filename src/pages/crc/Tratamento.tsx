
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

const CrcTratamento = () => {
  const [references, setReferences] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ message: string, isError: boolean } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removerReferencias = () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo XML.');
      return;
    }

    const referenciasParaEliminar = references.split(/[,\s]+/).map(item => 
      item.trim()).filter(Boolean);
    
    if (referenciasParaEliminar.length === 0) {
      toast.error('Por favor, insira pelo menos uma referência para eliminar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Não foi possível ler o arquivo');
        }
        
        const xmlString = e.target.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // Verificar se é um XML válido
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error('O arquivo selecionado não é um XML válido.');
        }

        const referenciasExistentes = Array.from(xmlDoc.querySelectorAll('CD'))
          .map(cd => cd.getAttribute('C_RefIF')?.trim() || '');

        const referenciasNaoEncontradas: string[] = [];

        // Remover referências
        for (let i = referenciasParaEliminar.length - 1; i >= 0; i--) {
          const referenciaParaEliminar = referenciasParaEliminar[i];
          
          if (!referenciasExistentes.includes(referenciaParaEliminar)) {
            referenciasNaoEncontradas.push(referenciaParaEliminar);
            continue;
          }
          
          const cds = xmlDoc.getElementsByTagName('CD');
          for (let j = cds.length - 1; j >= 0; j--) {
            const referencia = cds[j].getAttribute('C_RefIF')?.replace(/\s+/g, '') || '';
            if (referencia === referenciaParaEliminar) {
              cds[j].parentNode?.removeChild(cds[j]);
            }
          }
        }

        // Atualizar total
        const totalEnviadoElement = xmlDoc.querySelector('N_TotalEnviado');
        if (totalEnviadoElement) {
          const novoTotal = xmlDoc.createElement('N_TotalEnviado');
          novoTotal.textContent = String(
            referenciasExistentes.length - 
            (referenciasParaEliminar.length - referenciasNaoEncontradas.length)
          );
          totalEnviadoElement.parentNode?.replaceChild(novoTotal, totalEnviadoElement);
        }

        // Serializar de volta para string
        const serializer = new XMLSerializer();
        let novoXmlString = serializer.serializeToString(xmlDoc);
        novoXmlString = novoXmlString.replace(/\n\s*\n/g, '\n');

        // Download
        downloadFile(
          novoXmlString, 
          file.name.replace('.xml', '_sem_referencia.xml'), 
          'text/xml'
        );

        // Mostrar status
        if (referenciasNaoEncontradas.length === 0) {
          setStatus({
            message: 'Referências removidas com sucesso.',
            isError: false
          });
          toast.success('Referências removidas com sucesso.');
        } else {
          setStatus({
            message: `As seguintes referências não foram encontradas: ${referenciasNaoEncontradas.join(', ')}`,
            isError: true
          });
          toast.warning('Algumas referências não foram encontradas.');
        }
      } catch (error) {
        console.error('Erro ao processar XML:', error);
        setStatus({
          message: `Erro ao processar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          isError: true
        });
        toast.error('Erro ao processar o arquivo XML.');
      }
    };

    reader.onerror = () => {
      setStatus({
        message: 'Erro ao ler o arquivo.',
        isError: true
      });
      toast.error('Erro ao ler o arquivo.');
    };

    reader.readAsText(file);
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const a = document.createElement('a');
    const blob = new Blob([content], {type: contentType});
    const url = URL.createObjectURL(blob);
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="CRC - Tratamento de Ficheiros" 
        subtitle="Remoção de referências em arquivos XML"
      />

      <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-[#18467e]/5">
            <CardTitle className="text-[#18467e]">Remover Referências de COM</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="referencia">Referências para eliminar (separadas por vírgula ou espaço):</Label>
                <Input
                  id="referencia"
                  placeholder="Ex: REF001, REF002, REF003"
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fileInput">Selecionar arquivo XML:</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="fileInput"
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={removerReferencias} 
                className="w-full bg-[#004279] hover:bg-[#002b49] text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Remover Referências
              </Button>
              
              {status && (
                <div 
                  className={`mt-4 p-3 rounded-md ${
                    status.isError ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-600'
                  }`}
                >
                  {status.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrcTratamento;
