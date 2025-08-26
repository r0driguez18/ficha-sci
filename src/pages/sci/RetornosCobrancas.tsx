import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, Clock, FileText, Send } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getAllReturns, markReturnAsSent, type CobrancaRetorno } from '@/services/cobrancasRetornoService';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';

export default function RetornosCobrancas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [returns, setReturns] = useState<CobrancaRetorno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<CobrancaRetorno | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [sendingReturn, setSendingReturn] = useState(false);

  const fetchReturns = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await getAllReturns(user.id);
      if (error) throw error;
      
      setReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar retornos de cobranças",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!selectedReturn) return;
    
    setSendingReturn(true);
    try {
      const { error } = await markReturnAsSent(selectedReturn.id, observacoes);
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Retorno marcado como enviado",
      });
      
      // Refresh the list
      await fetchReturns();
      
      // Reset form
      setSelectedReturn(null);
      setObservacoes('');
    } catch (error) {
      console.error('Error marking return as sent:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar retorno como enviado",
        variant: "destructive"
      });
    } finally {
      setSendingReturn(false);
    }
  };

  const getReturnStatus = (retorno: CobrancaRetorno) => {
    if (retorno.retorno_enviado) return 'sent';
    
    const today = new Date().toISOString().split('T')[0];
    const expectedDate = retorno.data_retorno_esperada;
    
    if (expectedDate < today) return 'overdue';
    if (expectedDate === today) return 'due';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Atrasado</Badge>;
      case 'due':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Vence Hoje</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const pendingReturns = returns.filter(r => !r.retorno_enviado);
  const sentReturns = returns.filter(r => r.retorno_enviado);
  const overdueReturns = pendingReturns.filter(r => getReturnStatus(r) === 'overdue');
  const dueToday = pendingReturns.filter(r => getReturnStatus(r) === 'due');

  useEffect(() => {
    fetchReturns();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader 
          title="Retornos de Cobranças" 
          subtitle="Gestão de retornos de ficheiros de cobrança"
        />
        <Card>
          <CardContent className="p-6">
            <p>A carregar retornos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader 
        title="Retornos de Cobranças" 
        subtitle="Gestão de retornos de ficheiros de cobrança"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{overdueReturns.length}</p>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{dueToday.length}</p>
                <p className="text-sm text-muted-foreground">Vencem Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{pendingReturns.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{sentReturns.length}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingReturns.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Enviados ({sentReturns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Retornos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReturns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Sem retornos pendentes!</p>
                  <p className="text-sm text-muted-foreground">Todos os retornos foram enviados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Data Aplicação</TableHead>
                      <TableHead>Data Retorno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReturns.map((retorno) => (
                      <TableRow key={retorno.id}>
                        <TableCell className="font-medium">
                          {retorno.ficheiro_nome}
                        </TableCell>
                        <TableCell>
                          {new Date(retorno.data_aplicacao).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {new Date(retorno.data_retorno_esperada).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(getReturnStatus(retorno))}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedReturn(retorno)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Marcar Enviado
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Marcar Retorno como Enviado</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p><strong>Ficheiro:</strong> {selectedReturn?.ficheiro_nome}</p>
                                  <p><strong>Data de Aplicação:</strong> {selectedReturn && new Date(selectedReturn.data_aplicacao).toLocaleDateString('pt-PT')}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Observações (opcional)</label>
                                  <Textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Adicione observações sobre o envio do retorno..."
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedReturn(null);
                                      setObservacoes('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    onClick={handleMarkAsSent}
                                    disabled={sendingReturn}
                                  >
                                    {sendingReturn ? 'A processar...' : 'Marcar como Enviado'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Retornos Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              {sentReturns.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhum retorno enviado ainda</p>
                  <p className="text-sm text-muted-foreground">Os retornos enviados aparecerão aqui.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Data Aplicação</TableHead>
                      <TableHead>Data Retorno</TableHead>
                      <TableHead>Data Enviado</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentReturns.map((retorno) => (
                      <TableRow key={retorno.id}>
                        <TableCell className="font-medium">
                          {retorno.ficheiro_nome}
                        </TableCell>
                        <TableCell>
                          {new Date(retorno.data_aplicacao).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {new Date(retorno.data_retorno_esperada).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {retorno.data_retorno_enviado && new Date(retorno.data_retorno_enviado).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {retorno.observacoes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}