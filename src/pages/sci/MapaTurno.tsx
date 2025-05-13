
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Tables } from '@/integrations/supabase/types';

// Define interface for ShiftMap with correct typing
interface ShiftMap extends Tables<'shift_maps'> {}

const MapaTurno = () => {
  const [uploading, setUploading] = useState(false);
  const [shiftMaps, setShiftMaps] = useState<ShiftMap[]>([]);
  const [selectedFile, setSelectedFile] = useState<ShiftMap | null>(null);
  const [fileData, setFileData] = useState<any[] | null>(null);

  // Fetch list of uploaded shift maps
  useEffect(() => {
    fetchShiftMaps();
  }, []);

  const fetchShiftMaps = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_maps')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setShiftMaps(data || []);
    } catch (error) {
      console.error('Erro ao carregar mapas de turno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os mapas de turno",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Read file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Upload file to storage
          const fileName = `${Date.now()}_${file.name}`;
          const { error: storageError } = await supabase.storage
            .from('shift-maps')
            .upload(fileName, file);

          if (storageError) throw storageError;

          // Save metadata to database
          const { error: dbError } = await supabase.from('shift_maps').insert({
            file_name: file.name,
            content: jsonData,
            file_size: file.size
          });

          if (dbError) throw dbError;

          toast({
            title: "Sucesso",
            description: "Ficheiro carregado com sucesso",
          });
          
          fetchShiftMaps();
          
          // Auto-select the newly uploaded file
          const { data: newFileData } = await supabase
            .from('shift_maps')
            .select('*')
            .eq('file_name', file.name)
            .order('uploaded_at', { ascending: false })
            .limit(1)
            .single();
            
          if (newFileData) {
            setSelectedFile(newFileData);
            if (newFileData.content) {
              setFileData(Array.isArray(newFileData.content) ? newFileData.content : []);
            }
          }
        } catch (error) {
          console.error('Erro ao processar ficheiro:', error);
          toast({
            title: "Erro",
            description: "Falha ao processar o ficheiro Excel",
            variant: "destructive"
          });
        } finally {
          setUploading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro no carregamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar o ficheiro",
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  const handleFileSelect = (file: ShiftMap) => {
    setSelectedFile(file);
    // Ensure content is parsed as an array
    if (file.content) {
      setFileData(Array.isArray(file.content) ? file.content : []);
    }
  };

  const handleFileDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('shift_maps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Ficheiro eliminado com sucesso"
      });
      
      // If the deleted file was selected, clear the selection
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setFileData(null);
      }
      
      // Refresh the list
      fetchShiftMaps();
    } catch (error) {
      console.error('Erro ao eliminar ficheiro:', error);
      toast({
        title: "Erro",
        description: "Falha ao eliminar o ficheiro",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT') + ' ' + date.toLocaleTimeString('pt-PT');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - File upload and table list */}
        <Card className="w-full p-4 border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#18467e]">Mapas de Turno</h2>
            <div className="relative">
              <Input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer border-[#18467e] text-[#18467e] hover:bg-[#18467e]/10"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" /> 
                  {uploading ? 'A carregar...' : 'Upload'}
                </Button>
              </label>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Table of uploaded files */}
          {shiftMaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileSpreadsheet className="mx-auto h-12 w-12 mb-2 text-gray-400" />
              <p>Sem ficheiros. Carregue um ficheiro Excel para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Ficheiro</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftMaps.map((file) => (
                  <TableRow 
                    key={file.id}
                    className={selectedFile?.id === file.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  >
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell>{formatDate(file.uploaded_at || '')}</TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleFileSelect(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={(e) => handleFileDelete(file.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
      
      {/* File content view */}
      <Card className="w-full p-4 border-blue-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#18467e]">
            {selectedFile 
              ? `Detalhes: ${selectedFile.file_name}` 
              : 'Visualizador de Conteúdo'}
          </h2>
        </div>
        
        <Separator className="my-4" />
        
        {!selectedFile ? (
          <div className="text-center py-16 text-gray-500">
            <FileSpreadsheet className="mx-auto h-16 w-16 mb-3 text-gray-400" />
            <p className="text-lg">Selecione um ficheiro da tabela para visualizar o conteúdo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {fileData && fileData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(fileData[0]).map((header, index) => (
                      <TableHead key={index}>
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fileData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Sem dados disponíveis neste ficheiro</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MapaTurno;
