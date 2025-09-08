import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { FileProcess } from '@/services/fileProcessService';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface PaginatedProcessesTableProps {
  processes: FileProcess[];
  title?: string;
  pageSize?: number;
}

const PaginatedProcessesTable: React.FC<PaginatedProcessesTableProps> = ({ 
  processes, 
  title = "Processamentos", 
  pageSize = 10 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getProcessType = (process: FileProcess) => {
    if (process.tipo) {
      switch (process.tipo) {
        case 'salario':
          return { label: 'Salário', classes: 'bg-orange-50 text-orange-700 border-orange-200' };
        case 'cobrancas':
          return { label: 'Cobranças', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
        case 'compensacao':
          return { label: 'Compensação', classes: 'bg-green-50 text-green-700 border-green-200' };
        default:
          return { label: 'Outros', classes: 'bg-muted text-muted-foreground border-border' };
      }
    }
    return { label: 'Sem Categoria', classes: 'bg-muted text-muted-foreground border-border' };
  };

  // Filter and search logic
  const filteredProcesses = useMemo(() => {
    return processes.filter(process => {
      const matchesSearch = searchTerm === '' || 
        process.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.as400_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.executed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.operation_number?.includes(searchTerm);

      const matchesType = typeFilter === 'all' || process.tipo === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [processes, searchTerm, typeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProcesses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProcesses = filteredProcesses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  return (
    <Card className="hover-card-effect">
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary" className="text-sm">
            {filteredProcesses.length} de {processes.length}
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por tarefa, AS400, operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="salario">Salário</SelectItem>
              <SelectItem value="cobrancas">Cobranças</SelectItem>
              <SelectItem value="compensacao">Compensação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Nome AS/400</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Executado Por</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProcesses.length > 0 ? (
                  currentProcesses.map((process) => {
                    const processType = getProcessType(process);
                    return (
                      <TableRow key={process.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {process.date_registered ? format(new Date(process.date_registered), 'dd/MM/yyyy') : ''}
                        </TableCell>
                        <TableCell>{process.time_registered}</TableCell>
                        <TableCell className="max-w-48 truncate" title={process.task}>
                          {process.task}
                        </TableCell>
                        <TableCell>{process.as400_name}</TableCell>
                        <TableCell className="font-mono">{process.operation_number}</TableCell>
                        <TableCell>{process.executed_by}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`px-2 py-1 text-xs font-medium ${processType.classes}`}
                          >
                            {processType.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || typeFilter !== 'all' 
                        ? 'Nenhum processo encontrado para os filtros aplicados'
                        : 'Nenhum processo encontrado'
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProcesses.length)} de {filteredProcesses.length} resultados
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaginatedProcessesTable;