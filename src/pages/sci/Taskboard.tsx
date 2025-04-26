
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, FileDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Turno1Tasks, Turno2Tasks, Turno3Tasks, TurnKey, TasksType, TurnDataType } from '@/types/taskboard';
import { TaskboardTableRows, TaskTableRow } from '@/components/taskboard/TableRows';
import { TurnForm } from '@/components/taskboard/TurnForm';
import { generateTaskboardPDF } from '@/services/pdfService';
import { saveTableRowsToSupabase } from '@/services/taskboardService';
import { ensureBoolean, updateTask, getInitialTasks } from '@/utils/taskUtils';

const operatorsList = [
  { value: "joao", label: "João" },
  { value: "maria", label: "Maria" },
  { value: "edelgado", label: "Edelgado" },
  { value: "etavares", label: "Etavares" },
  { value: "lspencer", label: "Lspencer" },
  { value: "sbarbosa", label: "Sbarbosa" },
  { value: "nalves", label: "Nalves" }
];

const Taskboard = () => {
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);

  const [turnData, setTurnData] = useState<TurnDataType>({
    turno1: { operator: '', entrada: '', saida: '', observations: '' },
    turno2: { operator: '', entrada: '', saida: '', observations: '' },
    turno3: { operator: '', entrada: '', saida: '', observations: '' }
  });

  const [tasks, setTasks] = useState<TasksType>(getInitialTasks());

  useEffect(() => {
    const savedDate = localStorage.getItem('taskboard-date');
    const savedTurnData = localStorage.getItem('taskboard-turnData');
    const savedTasks = localStorage.getItem('taskboard-tasks');
    const savedTableRows = localStorage.getItem('taskboard-tableRows');

    if (savedDate) setDate(savedDate);
    if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
  }, []);

  useEffect(() => {
    localStorage.setItem('taskboard-date', date);
    localStorage.setItem('taskboard-turnData', JSON.stringify(turnData));
    localStorage.setItem('taskboard-tasks', JSON.stringify(tasks));
    localStorage.setItem('taskboard-tableRows', JSON.stringify(tableRows));
  }, [date, turnData, tasks, tableRows]);

  const handleTaskChange = (turno: TurnKey, task: string, checked: boolean | string) => {
    setTasks(updateTask(tasks, turno, task, checked));
  };

  const handleTurnDataChange = (turno: TurnKey, field: string, value: string) => {
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

  const handleInputChange = (id: number, field: keyof TaskTableRow, value: string) => {
    if (field === 'operacao') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setTableRows(
        tableRows.map(row => 
          row.id === id ? { ...row, [field]: numericValue } : row
        )
      );
      return;
    }
    
    setTableRows(
      tableRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async () => {
    const { savedCount, duplicateCount } = await saveTableRowsToSupabase(tableRows);
    
    if (savedCount > 0) {
      toast.success(`${savedCount} processamentos salvos com sucesso!`);
      
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} processamentos foram ignorados por já existirem no sistema.`);
      }
      
      toast.message(
        "Dados salvos com sucesso!",
        {
          action: {
            label: "Ver Gráficos",
            onClick: () => navigate("/easyvista/dashboards")
          }
        }
      );
    } else if (duplicateCount > 0) {
      toast.info(`Todos os ${duplicateCount} processamentos já existem no sistema.`);
    } else {
      toast.error('Nenhum processamento foi salvo. Verifique os dados.');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTurnData({
      turno1: { operator: '', entrada: '', saida: '', observations: '' },
      turno2: { operator: '', entrada: '', saida: '', observations: '' },
      turno3: { operator: '', entrada: '', saida: '', observations: '' }
    });
    setTasks(getInitialTasks());
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }]);
    
    localStorage.removeItem('taskboard-date');
    localStorage.removeItem('taskboard-turnData');
    localStorage.removeItem('taskboard-tasks');
    localStorage.removeItem('taskboard-tableRows');
    
    toast.success('Formulário reiniciado com sucesso!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ficha de Processamentos</CardTitle>
          <CardDescription>Registo de tarefas diárias do Centro Informática</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="w-full md:w-1/4">
              <Label htmlFor="date">Data</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
          </div>
          
          <Tabs defaultValue="turno1" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="turno1">Turno 1</TabsTrigger>
              <TabsTrigger value="turno2">Turno 2</TabsTrigger>
              <TabsTrigger value="turno3">Turno 3</TabsTrigger>
            </TabsList>
            
            <TabsContent value="turno1" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <TurnForm 
                    turnKey="turno1"
                    turnNumber="1"
                    operator={turnData.turno1.operator}
                    entrada={turnData.turno1.entrada}
                    saida={turnData.turno1.saida}
                    observations={turnData.turno1.observations}
                    tasks={tasks.turno1}
                    operatorsList={operatorsList}
                    onOperatorChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                    onEntradaChange={(value) => handleTurnDataChange('turno1', 'entrada', value)}
                    onSaidaChange={(value) => handleTurnDataChange('turno1', 'saida', value)}
                    onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                    onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="turno2" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <TurnForm 
                    turnKey="turno2"
                    turnNumber="2"
                    operator={turnData.turno2.operator}
                    entrada={turnData.turno2.entrada}
                    saida={turnData.turno2.saida}
                    observations={turnData.turno2.observations}
                    tasks={tasks.turno2}
                    operatorsList={operatorsList}
                    onOperatorChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                    onEntradaChange={(value) => handleTurnDataChange('turno2', 'entrada', value)}
                    onSaidaChange={(value) => handleTurnDataChange('turno2', 'saida', value)}
                    onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                    onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="turno3" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 3</CardTitle>
                </CardHeader>
                <CardContent>
                  <TurnForm 
                    turnKey="turno3"
                    turnNumber="3"
                    operator={turnData.turno3.operator}
                    entrada={turnData.turno3.entrada}
                    saida={turnData.turno3.saida}
                    observations={turnData.turno3.observations}
                    tasks={tasks.turno3}
                    operatorsList={operatorsList}
                    onOperatorChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                    onEntradaChange={(value) => handleTurnDataChange('turno3', 'entrada', value)}
                    onSaidaChange={(value) => handleTurnDataChange('turno3', 'saida', value)}
                    onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                    onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processamentos</CardTitle>
          <CardDescription>Registo de processamentos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskboardTableRows
            tableRows={tableRows}
            operatorsList={operatorsList}
            onAddRow={addTableRow}
            onRemoveRow={removeTableRow}
            onInputChange={handleInputChange}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => generateTaskboardPDF(date, turnData, tasks, tableRows)}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
        <Button 
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </div>
    </div>
  );
};

export default Taskboard;
