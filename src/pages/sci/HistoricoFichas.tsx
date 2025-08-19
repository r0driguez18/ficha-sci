import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { loadAllTaskboardsByType, FormType } from '@/services/taskboardService';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileDown, 
  Eye, 
  Calendar,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';

interface TaskboardRecord {
  id: string;
  form_type: FormType;
  date: string;
  turn_data: any;
  tasks: any;
  table_rows: any;
  active_tab?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SignatureData {
  imageDataUrl: string | null;
  signerName?: string;
  signedAt?: string;
}

const formTypeLabels: Record<FormType, string> = {
  'dia-util': 'Dia Útil',
  'dia-nao-util': 'Dia Não Útil',
  'final-mes-util': 'Final de Mês Útil',
  'final-mes-nao-util': 'Final de Mês Não Útil'
};

const formTypeColors: Record<FormType, string> = {
  'dia-util': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'dia-nao-util': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'final-mes-util': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'final-mes-nao-util': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
};

export default function HistoricoFichas() {
  const [records, setRecords] = useState<TaskboardRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TaskboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<TaskboardRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, formTypeFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Utilizador não autenticado",
          variant: "destructive"
        });
        return;
      }

      const allRecords: TaskboardRecord[] = [];
      const formTypes: FormType[] = ['dia-util', 'dia-nao-util', 'final-mes-util', 'final-mes-nao-util'];

      for (const formType of formTypes) {
        const { data, error } = await loadAllTaskboardsByType(user.id, formType);
        if (error) {
          console.error(`Erro ao carregar fichas ${formType}:`, error);
          continue;
        }
        allRecords.push(...data.filter(item => item.id) as TaskboardRecord[]);
      }

      // Ordenar por data de criação (mais recente primeiro)
      allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setRecords(allRecords);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de fichas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (formTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.form_type === formTypeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formTypeLabels[record.form_type].toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const downloadPDF = async (record: TaskboardRecord) => {
    try {
      const signature: SignatureData = {
        imageDataUrl: record.turn_data?.signature?.imageDataUrl || null,
        signerName: record.turn_data?.signature?.signerName,
        signedAt: record.turn_data?.signature?.signedAt
      };

      const pdf = generateTaskboardPDF(
        record.date,
        record.turn_data,
        record.tasks,
        record.table_rows,
        record.form_type === 'dia-nao-util' || record.form_type === 'final-mes-nao-util',
        record.form_type === 'final-mes-util' || record.form_type === 'final-mes-nao-util',
        signature
      );

      const fileName = `Ficha_${formTypeLabels[record.form_type]}_${record.date}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Gerado",
        description: `Ficheiro ${fileName} foi descarregado com sucesso`
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
    }
  };

  const getSignatureStatus = (record: TaskboardRecord) => {
    const hasSignature = record.turn_data?.signature?.imageDataUrl && record.turn_data?.signature?.signerName;
    return hasSignature;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader 
        title="Histórico de Fichas" 
        subtitle="Consulte e gira as fichas de procedimentos guardadas"
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por data ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ficha</label>
              <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="dia-util">Dia Útil</SelectItem>
                  <SelectItem value="dia-nao-util">Dia Não Útil</SelectItem>
                  <SelectItem value="final-mes-util">Final de Mês Útil</SelectItem>
                  <SelectItem value="final-mes-nao-util">Final de Mês Não Útil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadRecords} variant="outline" className="w-full">
                Atualizar Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fichas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichas Guardadas ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            Clique numa ficha para visualizar os detalhes ou descarregar o PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando fichas...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ficha encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Ficha</TableHead>
                  <TableHead>Data da Ficha</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge className={formTypeColors[record.form_type]}>
                        {formTypeLabels[record.form_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {record.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(record.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSignatureStatus(record) ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Não Assinado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.turn_data?.signature?.signerName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {record.turn_data.signature.signerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {formTypeLabels[record.form_type]} - {record.date}
                              </DialogTitle>
                              <DialogDescription>
                                Visualização da ficha de procedimentos
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRecord && (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informações Gerais</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Tipo:</strong> {formTypeLabels[selectedRecord.form_type]}</p>
                                      <p><strong>Data:</strong> {selectedRecord.date}</p>
                                      <p><strong>Criado:</strong> {formatDate(selectedRecord.created_at)}</p>
                                      <p><strong>Atualizado:</strong> {formatDate(selectedRecord.updated_at)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Assinatura</h4>
                                    <div className="space-y-1 text-sm">
                                      {selectedRecord.turn_data?.signature?.signerName ? (
                                        <>
                                          <p><strong>Responsável:</strong> {selectedRecord.turn_data.signature.signerName}</p>
                                          {selectedRecord.turn_data.signature.signedAt && (
                                            <p><strong>Assinado em:</strong> {formatDate(selectedRecord.turn_data.signature.signedAt)}</p>
                                          )}
                                          <p className="text-green-600">✓ Ficha assinada</p>
                                        </>
                                      ) : (
                                        <p className="text-orange-600">⚠ Ficha não assinada</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {selectedRecord.table_rows && selectedRecord.table_rows.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Procedimentos Executados</h4>
                                    <div className="border rounded-lg overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Tarefa</TableHead>
                                            <TableHead>Nome AS400</TableHead>
                                            <TableHead>Nº Operação</TableHead>
                                            <TableHead>Executado por</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedRecord.table_rows.map((row: any, index: number) => (
                                            <TableRow key={index}>
                                              <TableCell>{row.task}</TableCell>
                                              <TableCell>{row.as400Name || '-'}</TableCell>
                                              <TableCell>{row.operationNumber || '-'}</TableCell>
                                              <TableCell>{row.executedBy || '-'}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => downloadPDF(record)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}