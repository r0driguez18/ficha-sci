
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Upload, File, Trash2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ShiftMap {
  id: string;
  file_name: string;
  uploaded_at: string;
  file_size: number;
}

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
      toast.error('Não foi possível carregar os mapas de turno');
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

          toast.success('Ficheiro carregado com sucesso');
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
            setFileData(newFileData.content);
          }
        } catch (error) {
          console.error('Erro ao processar ficheiro:', error);
          toast.error('Falha ao processar o ficheiro Excel');
        } finally {
          setUploading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro no carregamento:', error);
      toast.error('Falha ao carregar o ficheiro');
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: ShiftMap) => {
    setSelectedFile(file);
    setFileData(file.content);
  };

  const handleFileDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('shift_maps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Ficheiro eliminado com sucesso');
      
      // If the deleted file was selected, clear the selection
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setFileData(null);
      }
      
      // Refresh the list
      fetchShiftMaps();
    } catch (error) {
      console.error('Erro ao eliminar ficheiro:', error);
      toast.error('Falha ao eliminar o ficheiro');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT') + ' ' + date.toLocaleTimeString('pt-PT');
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - File list */}
        <Card className="w-full md:w-1/3 p-4 border-blue-100">
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
          
          <div className="overflow-y-auto max-h-[500px] space-y-2">
            {shiftMaps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                <p>Sem ficheiros. Carregue um ficheiro Excel para começar.</p>
              </div>
            ) : (
              shiftMaps.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                    selectedFile?.id === file.id 
                      ? 'bg-[#18467e] text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <FileSpreadsheet className={`h-5 w-5 mr-3 ${selectedFile?.id === file.id ? 'text-white' : 'text-[#18467e]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex text-xs mt-1">
                      <span className={selectedFile?.id === file.id ? 'text-white/80' : 'text-gray-500'}>
                        {formatDate(file.uploaded_at)}
                      </span>
                      <span className={`ml-2 ${selectedFile?.id === file.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {formatFileSize(file.file_size)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${selectedFile?.id === file.id ? 'text-white hover:text-white/80' : 'text-red-500 hover:text-red-700'}`}
                    onClick={(e) => handleFileDelete(file.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
        
        {/* Right side - File content view */}
        <Card className="w-full md:w-2/3 p-4 border-blue-100">
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
              <File className="mx-auto h-16 w-16 mb-3 text-gray-400" />
              <p className="text-lg">Selecione um ficheiro para visualizar o conteúdo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {fileData && fileData.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(fileData[0]).map((header, index) => (
                        <th 
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fileData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {cell?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Sem dados disponíveis neste ficheiro</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MapaTurno;
