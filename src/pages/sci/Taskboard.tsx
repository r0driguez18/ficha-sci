
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, FileDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface TableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

const Taskboard = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);

  // Operator states for each turn
  const [turnData, setTurnData] = useState({
    turno1: { operator: '', entrada: '', saida: '', observations: '' },
    turno2: { operator: '', entrada: '', saida: '', observations: '' },
    turno3: { operator: '', entrada: '', saida: '', observations: '' }
  });

  // Tasks states (checkboxes)
  const [tasks, setTasks] = useState({
    turno1: {
      datacenter: false,
      sistemas: false,
      servicos: false,
      abrirServidores: false,
      percurso76931: false,
      enviar: false,
      etr: false,
      impostos: false,
      inpsExtrato: false,
      vistoUsa: false,
      ben: false,
      bcta: false,
      verificarDebitos: false,
      processarTef: false,
      processarTelecomp: false
    },
    turno2: {
      datacenter: false,
      sistemas: false,
      servicos: false,
      verificarReportes: false,
      inpsProcessar: false,
      inpsEnviarRetorno: false,
      processarTef: false,
      processarTelecomp: false,
      enviarEci: false,
      enviarEdv: false,
      validarSaco: false,
      verificarPendentes: false,
      fecharBalcoes: false
    },
    turno3: {
      verificarDebitos: false,
      tratarTapes: false,
      fecharServidores: false,
      fecharImpressoras: false,
      userFecho: false,
      validarFicheiro: false,
      bmjrn: false,
      grjrcv: false,
      aujrn: false,
      mvdia1: false,
      mvdia2: false,
      brjrn: false
    }
  });

  // Update task state
  const handleTaskChange = (turno: 'turno1' | 'turno2' | 'turno3', task: string, checked: boolean) => {
    setTasks({
      ...tasks,
      [turno]: {
        ...tasks[turno],
        [task]: checked
      }
    });
  };

  // Update turn data
  const handleTurnDataChange = (turno: 'turno1' | 'turno2' | 'turno3', field: string, value: string) => {
    setTurnData({
      ...turnData,
      [turno]: {
        ...turnData[turno],
        [field]: value
      }
    });
  };

  const addTableRow = () => {
    const newRow = {
      id: tableRows.length + 1,
      hora: '',
      tarefa: '',
      nomeAs: '',
      operacao: '',
      executado: ''
    };
    setTableRows([...tableRows, newRow]);
  };

  const removeTableRow = () => {
    if (tableRows.length > 1) {
      setTableRows(tableRows.slice(0, -1));
    }
  };

  const handleInputChange = (id: number, field: keyof TableRow, value: string) => {
    setTableRows(
      tableRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = () => {
    // In a real app, this would save to a database or API
    toast.success('Ficha de procedimentos salva com sucesso!');
  };

  const generatePDF = () => {
    // This would be the PDF generation logic
    // For now, we'll just simulate it with a toast message
    toast.success('PDF gerado com sucesso!');
    
    // In a real implementation, this would use a library like jspdf and jspdf-autotable
    // Similar to what the original script was doing
    console.log('Data that would go into the PDF:');
    console.log('Date:', date);
    console.log('Turn data:', turnData);
    console.log('Tasks:', tasks);
    console.log('Table rows:', tableRows);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-[#18467e] text-white">
        <CardTitle className="text-center text-2xl">CENTRO INFORMÁTICA</CardTitle>
        <CardDescription className="text-center text-white text-xl">Ficha de Procedimentos</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Processamentos Diários</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="whitespace-nowrap">Data:</Label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
              required
            />
          </div>
        </div>

        <Tabs defaultValue="turno1" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="turno1">Turno 1</TabsTrigger>
            <TabsTrigger value="turno2">Turno 2</TabsTrigger>
            <TabsTrigger value="turno3">Turno 3</TabsTrigger>
          </TabsList>
          
          {/* Turno 1 */}
          <TabsContent value="turno1">
            <div className="p-4 border rounded-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="operador-turno1">Operador:</Label>
                  <Select 
                    value={turnData.turno1.operator}
                    onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joao">João</SelectItem>
                      <SelectItem value="maria">Maria</SelectItem>
                      <SelectItem value="edelgado">Edelgado</SelectItem>
                      <SelectItem value="etavares">Etavares</SelectItem>
                      <SelectItem value="lspencer">Lspencer</SelectItem>
                      <SelectItem value="sbarbosa">Sbarbosa</SelectItem>
                      <SelectItem value="nalves">Nalves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entrada-turno1">Entrada:</Label>
                  <Input 
                    type="time" 
                    id="entrada-turno1" 
                    value={turnData.turno1.entrada}
                    onChange={(e) => handleTurnDataChange('turno1', 'entrada', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="saida-turno1">Saída:</Label>
                  <Input 
                    type="time" 
                    id="saida-turno1" 
                    value={turnData.turno1.saida}
                    onChange={(e) => handleTurnDataChange('turno1', 'saida', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-1" 
                    checked={tasks.turno1.datacenter}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'datacenter', !!checked)}
                  />
                  <Label htmlFor="tarefa1-1" className="cursor-pointer">Verificar DATA CENTER</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-2"
                    checked={tasks.turno1.sistemas}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'sistemas', !!checked)}
                  />
                  <Label htmlFor="tarefa1-2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-3"
                    checked={tasks.turno1.servicos}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'servicos', !!checked)}
                  />
                  <Label htmlFor="tarefa1-3" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-4"
                    checked={tasks.turno1.abrirServidores}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'abrirServidores', !!checked)}
                  />
                  <Label htmlFor="tarefa1-4" className="cursor-pointer">Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-5"
                    checked={tasks.turno1.percurso76931}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'percurso76931', !!checked)}
                  />
                  <Label htmlFor="tarefa1-5" className="cursor-pointer">Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados</Label>
                </div>
                
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="tarefa1-6-enviar"
                      checked={tasks.turno1.enviar}
                      onCheckedChange={(checked) => handleTaskChange('turno1', 'enviar', !!checked)}
                    />
                    <Label htmlFor="tarefa1-6-enviar" className="cursor-pointer font-medium">Enviar:</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-1"
                        checked={tasks.turno1.etr}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'etr', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-1" className="cursor-pointer">ETR</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-2"
                        checked={tasks.turno1.impostos}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'impostos', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-2" className="cursor-pointer">Impostos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-3"
                        checked={tasks.turno1.inpsExtrato}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'inpsExtrato', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-3" className="cursor-pointer">INPS/Extrato</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-4"
                        checked={tasks.turno1.vistoUsa}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'vistoUsa', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-4" className="cursor-pointer">Visto USA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-5"
                        checked={tasks.turno1.ben}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'ben', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-5" className="cursor-pointer">BEN</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa1-6-6"
                        checked={tasks.turno1.bcta}
                        onCheckedChange={(checked) => handleTaskChange('turno1', 'bcta', !!checked)}
                      />
                      <Label htmlFor="tarefa1-6-6" className="cursor-pointer">BCTA</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-7"
                    checked={tasks.turno1.verificarDebitos}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'verificarDebitos', !!checked)}
                  />
                  <Label htmlFor="tarefa1-7" className="cursor-pointer">Verificar Débitos/Créditos aplicados no dia Anterior</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-8"
                    checked={tasks.turno1.processarTef}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'processarTef', !!checked)}
                  />
                  <Label htmlFor="tarefa1-8" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa1-9"
                    checked={tasks.turno1.processarTelecomp}
                    onCheckedChange={(checked) => handleTaskChange('turno1', 'processarTelecomp', !!checked)}
                  />
                  <Label htmlFor="tarefa1-9" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv1">Outras Intervenções/Ocorrências:</Label>
                  <Textarea 
                    id="outrasInterv1" 
                    className="min-h-[100px]"
                    value={turnData.turno1.observations}
                    onChange={(e) => handleTurnDataChange('turno1', 'observations', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Turno 2 */}
          <TabsContent value="turno2">
            <div className="p-4 border rounded-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="operador-turno2">Operador:</Label>
                  <Select
                    value={turnData.turno2.operator}
                    onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edelgado">Edelgado</SelectItem>
                      <SelectItem value="etavares">Etavares</SelectItem>
                      <SelectItem value="lspencer">Lspencer</SelectItem>
                      <SelectItem value="sbarbosa">Sbarbosa</SelectItem>
                      <SelectItem value="nalves">Nalves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entrada-turno2">Entrada:</Label>
                  <Input 
                    type="time" 
                    id="entrada-turno2" 
                    value={turnData.turno2.entrada}
                    onChange={(e) => handleTurnDataChange('turno2', 'entrada', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="saida-turno2">Saída:</Label>
                  <Input 
                    type="time" 
                    id="saida-turno2" 
                    value={turnData.turno2.saida}
                    onChange={(e) => handleTurnDataChange('turno2', 'saida', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-1"
                    checked={tasks.turno2.datacenter}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'datacenter', !!checked)}
                  />
                  <Label htmlFor="tarefa2-1" className="cursor-pointer">Verificar DATA CENTER</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-2"
                    checked={tasks.turno2.sistemas}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'sistemas', !!checked)}
                  />
                  <Label htmlFor="tarefa2-2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-3"
                    checked={tasks.turno2.servicos}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'servicos', !!checked)}
                  />
                  <Label htmlFor="tarefa2-3" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-4"
                    checked={tasks.turno2.verificarReportes}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'verificarReportes', !!checked)}
                  />
                  <Label htmlFor="tarefa2-4" className="cursor-pointer">Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)</Label>
                </div>
                
                <div className="border rounded-md p-3 bg-gray-50 mt-2">
                  <Label className="font-medium mb-2 block">Ficheiros INPS:</Label>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa2-5-1"
                        checked={tasks.turno2.inpsProcessar}
                        onCheckedChange={(checked) => handleTaskChange('turno2', 'inpsProcessar', !!checked)}
                      />
                      <Label htmlFor="tarefa2-5-1" className="cursor-pointer">Processar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa2-5-2"
                        checked={tasks.turno2.inpsEnviarRetorno}
                        onCheckedChange={(checked) => handleTaskChange('turno2', 'inpsEnviarRetorno', !!checked)}
                      />
                      <Label htmlFor="tarefa2-5-2" className="cursor-pointer">Enviar Retorno</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-6"
                    checked={tasks.turno2.processarTef}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'processarTef', !!checked)}
                  />
                  <Label htmlFor="tarefa2-6" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-7"
                    checked={tasks.turno2.processarTelecomp}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'processarTelecomp', !!checked)}
                  />
                  <Label htmlFor="tarefa2-7" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
                </div>
                
                <div className="border rounded-md p-3 bg-gray-50 mt-2">
                  <Label className="font-medium mb-2 block">Enviar Ficheiro:</Label>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa2-8-1"
                        checked={tasks.turno2.enviarEci}
                        onCheckedChange={(checked) => handleTaskChange('turno2', 'enviarEci', !!checked)}
                      />
                      <Label htmlFor="tarefa2-8-1" className="cursor-pointer">ECI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tarefa2-8-2"
                        checked={tasks.turno2.enviarEdv}
                        onCheckedChange={(checked) => handleTaskChange('turno2', 'enviarEdv', !!checked)}
                      />
                      <Label htmlFor="tarefa2-8-2" className="cursor-pointer">EDV</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 mt-2">
                  <Checkbox 
                    id="tarefa2-9"
                    checked={tasks.turno2.validarSaco}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'validarSaco', !!checked)}
                  />
                  <Label htmlFor="tarefa2-9" className="cursor-pointer">Validar Saco 1935</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-10"
                    checked={tasks.turno2.verificarPendentes}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'verificarPendentes', !!checked)}
                  />
                  <Label htmlFor="tarefa2-10" className="cursor-pointer">Verificar Pendentes dos Balcões</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa2-11"
                    checked={tasks.turno2.fecharBalcoes}
                    onCheckedChange={(checked) => handleTaskChange('turno2', 'fecharBalcoes', !!checked)}
                  />
                  <Label htmlFor="tarefa2-11" className="cursor-pointer">Fechar os Balcoes Centrais</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv2">Outras Intervenções/Ocorrências:</Label>
                  <Textarea 
                    id="outrasInterv2" 
                    className="min-h-[100px]"
                    value={turnData.turno2.observations}
                    onChange={(e) => handleTurnDataChange('turno2', 'observations', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Turno 3 */}
          <TabsContent value="turno3">
            <div className="p-4 border rounded-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="operador-turno3">Operador:</Label>
                  <Select
                    value={turnData.turno3.operator}
                    onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edelgado">Edelgado</SelectItem>
                      <SelectItem value="etavares">Etavares</SelectItem>
                      <SelectItem value="lspencer">Lspencer</SelectItem>
                      <SelectItem value="sbarbosa">Sbarbosa</SelectItem>
                      <SelectItem value="nalves">Nalves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entrada-turno3">Entrada:</Label>
                  <Input 
                    type="time" 
                    id="entrada-turno3" 
                    value={turnData.turno3.entrada}
                    onChange={(e) => handleTurnDataChange('turno3', 'entrada', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="saida-turno3">Saída:</Label>
                  <Input 
                    type="time" 
                    id="saida-turno3" 
                    value={turnData.turno3.saida}
                    onChange={(e) => handleTurnDataChange('turno3', 'saida', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg mb-2">Antes do Fecho</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-1"
                    checked={tasks.turno3.verificarDebitos}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'verificarDebitos', !!checked)}
                  />
                  <Label htmlFor="tarefa3-1" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-2"
                    checked={tasks.turno3.tratarTapes}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'tratarTapes', !!checked)}
                  />
                  <Label htmlFor="tarefa3-2" className="cursor-pointer">Tratar e trocar Tapes BM, BMBCK – percurso 7622</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-3"
                    checked={tasks.turno3.fecharServidores}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'fecharServidores', !!checked)}
                  />
                  <Label htmlFor="tarefa3-3" className="cursor-pointer">Fechar Servidores Teste e Produção</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-4"
                    checked={tasks.turno3.fecharImpressoras}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'fecharImpressoras', !!checked)}
                  />
                  <Label htmlFor="tarefa3-4" className="cursor-pointer">Fechar Impressoras e balcões centrais abertos exceto 14 - DSI</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-5"
                    checked={tasks.turno3.userFecho}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'userFecho', !!checked)}
                  />
                  <Label htmlFor="tarefa3-5" className="cursor-pointer">User Fecho Executar o percurso 7624 Save SYS1OB</Label>
                </div>
                
                <h3 className="font-bold text-lg mt-4 mb-2">Depois do Fecho</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-20"
                    checked={tasks.turno3.validarFicheiro}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'validarFicheiro', !!checked)}
                  />
                  <Label htmlFor="tarefa3-20" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
                </div>
                
                <h3 className="font-bold text-lg mt-4 mb-2">Backups Diferidos</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-30"
                    checked={tasks.turno3.bmjrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'bmjrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-30" className="cursor-pointer">BMJRN (2 tapes/alterar 1 por mês/inicializar no início do mês)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-31"
                    checked={tasks.turno3.grjrcv}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'grjrcv', !!checked)}
                  />
                  <Label htmlFor="tarefa3-31" className="cursor-pointer">GRJRCV (1 tape)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-32"
                    checked={tasks.turno3.aujrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'aujrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-32" className="cursor-pointer">AUJRN (1 tape)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-33"
                    checked={tasks.turno3.mvdia1}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'mvdia1', !!checked)}
                  />
                  <Label htmlFor="tarefa3-33" className="cursor-pointer">MVDIA1 (eliminar obj. após save N)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-34"
                    checked={tasks.turno3.mvdia2}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'mvdia2', !!checked)}
                  />
                  <Label htmlFor="tarefa3-34" className="cursor-pointer">MVDIA2 (eliminar obj. após save S)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-35"
                    checked={tasks.turno3.brjrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'brjrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-35" className="cursor-pointer">BRJRN (1 tape)</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv3">Outras Intervenções/Ocorrências:</Label>
                  <Textarea 
                    id="outrasInterv3" 
                    className="min-h-[100px]"
                    value={turnData.turno3.observations}
                    onChange={(e) => handleTurnDataChange('turno3', 'observations', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Processamento de Ficheiros</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HORA</TableHead>
                <TableHead>TAREFAS</TableHead>
                <TableHead>NOME AS/400</TableHead>
                <TableHead>Nº OPERAÇÃO</TableHead>
                <TableHead>EXECUTADO POR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input 
                      type="time" 
                      value={row.hora} 
                      onChange={(e) => handleInputChange(row.id, 'hora', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.tarefa} 
                      onChange={(e) => handleInputChange(row.id, 'tarefa', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.nomeAs} 
                      onChange={(e) => handleInputChange(row.id, 'nomeAs', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.operacao} 
                      onChange={(e) => handleInputChange(row.id, 'operacao', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={row.executado}
                      onValueChange={(value) => handleInputChange(row.id, 'executado', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edelgado">Edelgado</SelectItem>
                        <SelectItem value="etavares">Etavares</SelectItem>
                        <SelectItem value="lspencer">Lspencer</SelectItem>
                        <SelectItem value="sbarbosa">Sbarbosa</SelectItem>
                        <SelectItem value="nalves">Nalves</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={addTableRow} type="button" variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Linha
        </Button>
        <Button onClick={removeTableRow} variant="destructive" type="button">
          <Trash2 className="h-4 w-4 mr-2" />
          Remover Última Linha
        </Button>
        <Button onClick={handleSave} variant="default" type="button">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
        <Button onClick={generatePDF} variant="outline" type="button">
          <FileDown className="h-4 w-4 mr-2" />
          Gerar PDF
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Taskboard;
