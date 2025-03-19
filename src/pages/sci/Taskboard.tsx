
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save } from 'lucide-react';

const Taskboard = () => {
  const [date, setDate] = useState('');
  const [tableRows, setTableRows] = useState([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);

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

  const handleSave = () => {
    // Implementar lógica de salvamento
    alert('Formulário salvo com sucesso!');
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joao">João</SelectItem>
                      <SelectItem value="maria">Maria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entrada-turno1">Entrada:</Label>
                  <Input type="time" id="entrada-turno1" />
                </div>
                <div>
                  <Label htmlFor="saida-turno1">Saída:</Label>
                  <Input type="time" id="saida-turno1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-1" />
                  <Label htmlFor="tarefa1-1" className="cursor-pointer">Verificar DATA CENTER</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-2" />
                  <Label htmlFor="tarefa1-2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-3" />
                  <Label htmlFor="tarefa1-3" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-4" />
                  <Label htmlFor="tarefa1-4" className="cursor-pointer">Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-5" />
                  <Label htmlFor="tarefa1-5" className="cursor-pointer">Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados</Label>
                </div>
                
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="tarefa1-6-enviar" />
                    <Label htmlFor="tarefa1-6-enviar" className="cursor-pointer font-medium">Enviar:</Label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-1" />
                      <Label htmlFor="tarefa1-6-1" className="cursor-pointer">ETR</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-2" />
                      <Label htmlFor="tarefa1-6-2" className="cursor-pointer">Impostos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-3" />
                      <Label htmlFor="tarefa1-6-3" className="cursor-pointer">INPS/Extrato</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-4" />
                      <Label htmlFor="tarefa1-6-4" className="cursor-pointer">Visto USA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-5" />
                      <Label htmlFor="tarefa1-6-5" className="cursor-pointer">BEN</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tarefa1-6-6" />
                      <Label htmlFor="tarefa1-6-6" className="cursor-pointer">BCTA</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-7" />
                  <Label htmlFor="tarefa1-7" className="cursor-pointer">Verificar Débitos/Créditos aplicados no dia Anterior</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-8" />
                  <Label htmlFor="tarefa1-8" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa1-9" />
                  <Label htmlFor="tarefa1-9" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv1">Outras Intervenções/Ocorrências:</Label>
                  <Input id="outrasInterv1" className="h-20" />
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
                  <Select>
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
                  <Input type="time" id="entrada-turno2" />
                </div>
                <div>
                  <Label htmlFor="saida-turno2">Saída:</Label>
                  <Input type="time" id="saida-turno2" />
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Similar tasks as turno1, just with different IDs */}
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa2-1" />
                  <Label htmlFor="tarefa2-1" className="cursor-pointer">Verificar DATA CENTER</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa2-2" />
                  <Label htmlFor="tarefa2-2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa2-3" />
                  <Label htmlFor="tarefa2-3" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv2">Outras Intervenções/Ocorrências:</Label>
                  <Input id="outrasInterv2" className="h-20" />
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
                  <Select>
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
                  <Input type="time" id="entrada-turno3" />
                </div>
                <div>
                  <Label htmlFor="saida-turno3">Saída:</Label>
                  <Input type="time" id="saida-turno3" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg mb-2">Antes do Fecho</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa3-1" />
                  <Label htmlFor="tarefa3-1" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa3-2" />
                  <Label htmlFor="tarefa3-2" className="cursor-pointer">Tratar e trocar Tapes BM, BMBCK – percurso 7622</Label>
                </div>
                
                <h3 className="font-bold text-lg mt-4 mb-2">Depois do Fecho</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa3-20" />
                  <Label htmlFor="tarefa3-20" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
                </div>
                
                <h3 className="font-bold text-lg mt-4 mb-2">Backups Diferidos</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox id="tarefa3-30" />
                  <Label htmlFor="tarefa3-30" className="cursor-pointer">BMJRN (2 tapes/alterar 1 por mês/inicializar no início do mês)</Label>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="outrasInterv3">Outras Intervenções/Ocorrências:</Label>
                  <Input id="outrasInterv3" className="h-20" />
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
                    <Input type="time" value={row.hora} onChange={(e) => {
                      const newRows = [...tableRows];
                      const index = newRows.findIndex(r => r.id === row.id);
                      newRows[index].hora = e.target.value;
                      setTableRows(newRows);
                    }} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={row.tarefa} onChange={(e) => {
                      const newRows = [...tableRows];
                      const index = newRows.findIndex(r => r.id === row.id);
                      newRows[index].tarefa = e.target.value;
                      setTableRows(newRows);
                    }} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={row.nomeAs} onChange={(e) => {
                      const newRows = [...tableRows];
                      const index = newRows.findIndex(r => r.id === row.id);
                      newRows[index].nomeAs = e.target.value;
                      setTableRows(newRows);
                    }} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" value={row.operacao} onChange={(e) => {
                      const newRows = [...tableRows];
                      const index = newRows.findIndex(r => r.id === row.id);
                      newRows[index].operacao = e.target.value;
                      setTableRows(newRows);
                    }} />
                  </TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => {
                      const newRows = [...tableRows];
                      const index = newRows.findIndex(r => r.id === row.id);
                      newRows[index].executado = value;
                      setTableRows(newRows);
                    }}>
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
      <CardFooter className="flex justify-start gap-2">
        <Button onClick={addTableRow} type="button">
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
      </CardFooter>
    </Card>
  );
};

export default Taskboard;
