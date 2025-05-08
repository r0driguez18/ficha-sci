
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSpreadsheet, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ExcelData {
  headers: string[];
  data: any[][];
}

interface ExcelViewerProps {
  initialData?: ExcelData;
  title?: string;
  height?: string;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ 
  initialData,
  title = "Excel Workbook", 
  height = "500px" 
}) => {
  const [excelData, setExcelData] = useState<ExcelData | null>(initialData || null);
  const [fileName, setFileName] = useState<string>('workbook.xlsx');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to json
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          setExcelData({
            headers,
            data: rows
          });
          toast.success(`Arquivo "${file.name}" carregado com sucesso`);
        } else {
          toast.error("O arquivo parece estar vazio");
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        toast.error("Erro ao ler o arquivo Excel");
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const exportToExcel = () => {
    if (!excelData) return;
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert the data back to the format expected by xlsx
    const wsData = [
      excelData.headers,
      ...excelData.data
    ];
    
    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
    // Write the workbook and trigger a download
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={!excelData}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <div className="relative">
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
            <Button variant="outline" asChild className="cursor-pointer">
              <label htmlFor="excel-upload" className="flex cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Importar
              </label>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`border rounded-md h-[${height}]`} style={{ height }}>
          {excelData ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {excelData.headers.map((header, index) => (
                    <TableHead key={index}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelData.data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mb-4 opacity-50" />
              <p className="mb-2 text-lg font-medium">Nenhum arquivo Excel carregado</p>
              <p>Importe um arquivo Excel para visualizar os dados aqui</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExcelViewer;
