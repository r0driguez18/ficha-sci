
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TableRow {
  id: string;
  col1: string;
  col2: string;
  col3: string;
}

const SciTaskboard = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Revisar documentação', completed: false },
    { id: '2', title: 'Atualizar sistema', completed: true },
    { id: '3', title: 'Validar relatórios', completed: false },
  ]);
  
  const [tableData, setTableData] = useState<TableRow[]>([
    { id: '1', col1: 'Documento A', col2: 'Pendente', col3: '2023-06-01' },
    { id: '2', col1: 'Relatório B', col2: 'Concluído', col3: '2023-06-15' },
  ]);
  
  const [newTask, setNewTask] = useState('');
  const [newRow, setNewRow] = useState<TableRow>({ id: '', col1: '', col2: '', col3: '' });

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask('');
    toast.success('Tarefa adicionada com sucesso!');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast.success('Tarefa removida com sucesso!');
  };

  const addTableRow = () => {
    if (!newRow.col1 || !newRow.col2 || !newRow.col3) {
      toast.error('Preencha todos os campos');
      return;
    }
    const row: TableRow = {
      id: Date.now().toString(),
      col1: newRow.col1,
      col2: newRow.col2,
      col3: newRow.col3
    };
    setTableData([...tableData, row]);
    setNewRow({ id: '', col1: '', col2: '', col3: '' });
    toast.success('Linha adicionada com sucesso!');
  };

  const deleteTableRow = (id: string) => {
    setTableData(tableData.filter(row => row.id !== id));
    toast.success('Linha removida com sucesso!');
  };

  const generatePDF = () => {
    toast.success('Gerando PDF...');
    // In a real scenario, this would connect to a PDF generation service
    setTimeout(() => {
      toast.success('PDF gerado com sucesso!');
    }, 1500);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="SCI - Taskboard" 
        subtitle="Gerenciamento de tarefas e relatórios"
      >
        <Button onClick={generatePDF}>
          <FileDown className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </PageHeader>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-6">
                <Input 
                  placeholder="Nova tarefa" 
                  value={newTask} 
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <Button onClick={addTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma tarefa encontrada</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <Label 
                          htmlFor={`task-${task.id}`}
                          className={task.completed ? "line-through text-muted-foreground" : ""}
                        >
                          {task.title}
                        </Label>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="col1">Documento</Label>
                  <Input 
                    id="col1"
                    placeholder="Nome do documento" 
                    value={newRow.col1} 
                    onChange={(e) => setNewRow({...newRow, col1: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="col2">Status</Label>
                  <Input 
                    id="col2"
                    placeholder="Status" 
                    value={newRow.col2} 
                    onChange={(e) => setNewRow({...newRow, col2: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="col3">Data</Label>
                  <Input 
                    id="col3"
                    type="date" 
                    value={newRow.col3} 
                    onChange={(e) => setNewRow({...newRow, col3: e.target.value})}
                  />
                </div>
              </div>
              
              <Button onClick={addTableRow} className="mb-6">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Linha
              </Button>
              
              <div className="border rounded-md overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th className="w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhum dado encontrado
                        </td>
                      </tr>
                    ) : (
                      tableData.map(row => (
                        <tr key={row.id}>
                          <td>{row.col1}</td>
                          <td>{row.col2}</td>
                          <td>{row.col3}</td>
                          <td>
                            <Button variant="ghost" size="icon" onClick={() => deleteTableRow(row.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SciTaskboard;
