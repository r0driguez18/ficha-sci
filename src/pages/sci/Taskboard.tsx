
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

// Define types for turnKey and tasks
type TurnKey = 'turno1' | 'turno2' | 'turno3';

// Define the task type for each shift
interface Turno1Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  abrirServidores: boolean;
  percurso76931: boolean;
  enviar: boolean;
  etr: boolean;
  impostos: boolean;
  inpsExtrato: boolean;
  vistoUsa: boolean;
  ben: boolean;
  bcta: boolean;
  verificarDebitos: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
}

interface Turno2Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  verificarReportes: boolean;
  inpsProcessar: boolean;
  inpsEnviarRetorno: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  enviarEci: boolean;
  enviarEdv: boolean;
  validarSaco: boolean;
  verificarPendentes: boolean;
  fecharBalcoes: boolean;
}

interface Turno3Tasks {
  verificarDebitos: boolean;
  tratarTapes: boolean;
  fecharServidores: boolean;
  fecharImpressoras: boolean;
  userFecho: boolean;
  validarFicheiro: boolean;
  bmjrn: boolean;
  grjrcv: boolean;
  aujrn: boolean;
  mvdia1: boolean;
  mvdia2: boolean;
  brjrn: boolean;
}

// Define interfaces for our task and turn data types
interface TasksType {
  turno1: Turno1Tasks;
  turno2: Turno2Tasks;
  turno3: Turno3Tasks;
}

interface TurnDataType {
  turno1: { operator: string; entrada: string; saida: string; observations: string };
  turno2: { operator: string; entrada: string; saida: string; observations: string };
  turno3: { operator: string; entrada: string; saida: string; observations: string };
}

const Taskboard = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);

  const [turnData, setTurnData] = useState<TurnDataType>({
    turno1: { operator: '', entrada: '', saida: '', observations: '' },
    turno2: { operator: '', entrada: '', saida: '', observations: '' },
    turno3: { operator: '', entrada: '', saida: '', observations: '' }
  });

  const [tasks, setTasks] = useState<TasksType>({
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

  const handleTaskChange = (turno: TurnKey, task: string, checked: boolean) => {
    setTasks({
      ...tasks,
      [turno]: {
        ...tasks[turno],
        [task]: checked
      }
    });
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

  const handleInputChange = (id: number, field: keyof TableRow, value: string) => {
    setTableRows(
      tableRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = () => {
    toast.success('Ficha de procedimentos salva com sucesso!');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;
    
    const centerText = (text: string, y: number) => {
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };
    
    const drawCheckbox = (x: number, y: number, checked: boolean) => {
      doc.rect(x, y, 3, 3);
      if (checked) {
        doc.line(x, y, x + 3, y + 3);
        doc.line(x + 3, y, x, y + 3);
      }
    };
    
    const checkPageSpace = (y: number, requiredSpace: number): number => {
      if (y + requiredSpace > pageHeight - 20) {
        doc.addPage();
        return 20;
      }
      return y;
    };
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    centerText("CENTRO INFORMÁTICA", y);
    y += 10;
    
    doc.setFontSize(16);
    centerText("Ficha de Procedimentos", y);
    y += 15;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Processamentos Diários", 15, y);
    doc.text(`Data: ${date}`, pageWidth - 50, y);
    y += 10;
    
    const turnKeys: TurnKey[] = ['turno1', 'turno2', 'turno3'];
    const turnNames = ['Turno 1', 'Turno 2', 'Turno 3'];
    
    turnKeys.forEach((turnKey, index) => {
      const turnName = turnNames[index];
      const turn = turnData[turnKey];
      
      y = checkPageSpace(y, 30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${turnName}:`, 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Operador: ${turn.operator}`, 40, y);
      doc.text(`Entrada: ${turn.entrada}`, 100, y);
      doc.text(`Saída: ${turn.saida}`, 150, y);
      y += 10;
      
      if (turnKey === 'turno3') {
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Antes do Fecho", 15, y);
        y += 8;
      }
      
      // Special handling for grouped tasks
      const processTask = (taskKey: string, taskText: string, checked: boolean) => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, checked);
        doc.setFontSize(10);
        doc.text(taskText, 20, y);
        y += 6;
      };
      
      // Special handling for "Enviar" group in turno1
      if (turnKey === 'turno1') {
        // Process regular tasks first
        const regularTasksToProcess = ['datacenter', 'sistemas', 'servicos', 'abrirServidores', 'percurso76931'];
        
        regularTasksToProcess.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            datacenter: "Verificar DATA CENTER",
            sistemas: "Verificar Sistemas: BCACV1/BCACV2",
            servicos: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA",
            abrirServidores: "Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)",
            percurso76931: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"
          };
          
          const typedTaskKey = taskKey as keyof Turno1Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno1[typedTaskKey]);
        });
        
        // Handle "Enviar" group - all on the same line
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, tasks.turno1.enviar);
        doc.setFontSize(10);
        doc.text("Enviar:", 20, y);
        
        // Draw the sub-items on the same line with reduced spacing
        let xOffset = 35;
        const subItems = [
          { key: 'etr', text: 'ETR' },
          { key: 'impostos', text: 'Impostos' },
          { key: 'inpsExtrato', text: 'INPS/Extrato' },
          { key: 'vistoUsa', text: 'Visto USA' },
          { key: 'ben', text: 'BEN' },
          { key: 'bcta', text: 'BCTA' }
        ];
        
        subItems.forEach(item => {
          const itemKey = item.key as keyof Turno1Tasks;
          // Add checkbox for each sub-item
          drawCheckbox(xOffset, y - 3, tasks.turno1[itemKey]);
          doc.text(item.text, xOffset + 5, y);
          xOffset += doc.getTextWidth(item.text) + 15; // Reduced spacing
        });
        
        y += 8;
        
        // Process remaining tasks
        const remainingTasks = ['verificarDebitos', 'processarTef', 'processarTelecomp'];
        
        remainingTasks.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            verificarDebitos: "Verificar Débitos/Créditos aplicados no dia Anterior",
            processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
            processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
          };
          
          const typedTaskKey = taskKey as keyof Turno1Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno1[typedTaskKey]);
        });
      }
      
      // Special handling for turno2
      else if (turnKey === 'turno2') {
        // First, process regular tasks until we hit special groups
        const regularTasksToProcess = ['datacenter', 'sistemas', 'servicos', 'verificarReportes'];
        
        regularTasksToProcess.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            datacenter: "Verificar DATA CENTER",
            sistemas: "Verificar Sistemas: BCACV1/BCACV2",
            servicos: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA",
            verificarReportes: "Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)"
          };
          
          const typedTaskKey = taskKey as keyof Turno2Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey]);
        });
        
        // Handle INPS group - all on the same line
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Ficheiros INPS:", 20, y);
        
        // Added checkboxes for INPS items with reduced spacing
        let xOffset = 55;
        
        // Draw checkbox for "Processar"
        drawCheckbox(xOffset, y - 3, tasks.turno2.inpsProcessar);
        doc.text("Processar", xOffset + 5, y);
        
        xOffset += 35; // Reduced spacing
        
        // Draw checkbox for "Enviar Retorno"
        drawCheckbox(xOffset, y - 3, tasks.turno2.inpsEnviarRetorno);
        doc.text("Enviar Retorno", xOffset + 5, y);
        
        y += 8;
        
        // Process regular tasks again until next special group
        const middleTasksToProcess = ['processarTef', 'processarTelecomp'];
        
        middleTasksToProcess.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
            processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
          };
          
          const typedTaskKey = taskKey as keyof Turno2Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey]);
        });
        
        // Handle Enviar Ficheiro group - all on the same line
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Enviar Ficheiro:", 20, y);
        
        // Added checkboxes for Enviar Ficheiro items with reduced spacing
        xOffset = 55;
        
        // Draw checkbox for "ECI"
        drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEci);
        doc.text("ECI", xOffset + 5, y);
        
        xOffset += 20; // Reduced spacing
        
        // Draw checkbox for "EDV"
        drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEdv);
        doc.text("EDV", xOffset + 5, y);
        
        y += 8;
        
        // Process remaining regular tasks
        const finalTasksToProcess = ['validarSaco', 'verificarPendentes', 'fecharBalcoes'];
        
        finalTasksToProcess.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            validarSaco: "Validar Saco 1935",
            verificarPendentes: "Verificar Pendentes dos Balcões",
            fecharBalcoes: "Fechar os Balcoes Centrais"
          };
          
          const typedTaskKey = taskKey as keyof Turno2Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey]);
        });
      }
      
      // Handle turno3 tasks
      else if (turnKey === 'turno3') {
        const beforeCloseTasks = ['verificarDebitos', 'tratarTapes', 'fecharServidores', 'fecharImpressoras', 'userFecho', 'validarFicheiro'];
        
        beforeCloseTasks.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            verificarDebitos: "Verificar Débitos/Créditos Aplicados no Turno Anterior",
            tratarTapes: "Tratar e trocar Tapes BM, BMBCK – percurso 7622",
            fecharServidores: "Fechar Servidores Teste e Produção",
            fecharImpressoras: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI",
            userFecho: "User Fecho Executar o percurso 7624 Save SYS1OB",
            validarFicheiro: "Validar ficheiro CCLN - 76853"
          };
          
          const typedTaskKey = taskKey as keyof Turno3Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey]);
          
          if (taskKey === 'validarFicheiro') {
            y = checkPageSpace(y, 8);
            doc.setFont("helvetica", "bold");
            doc.text("Depois do Fecho", 15, y);
            y += 8;
          }
        });
        
        // Handle "Backups Diferidos" section
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Backups Diferidos", 15, y);
        y += 8;
        
        const backupTasks = ['bmjrn', 'grjrcv', 'aujrn', 'mvdia1', 'mvdia2', 'brjrn'];
        
        backupTasks.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            bmjrn: "BMJRN (2 tapes/alterar 1 por mês/inicializar no início do mês)",
            grjrcv: "GRJRCV (1 tape)",
            aujrn: "AUJRN (1 tape)",
            mvdia1: "MVDIA1 (eliminar obj. após save N)",
            mvdia2: "MVDIA2 (eliminar obj. após save S)",
            brjrn: "BRJRN (1 tape)"
          };
          
          const typedTaskKey = taskKey as keyof Turno3Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey]);
        });
      }
      
      // Include observations text area in PDF
      y = checkPageSpace(y, 25);
      doc.setFont("helvetica", "bold");
      doc.text("Outras Intervenções/Ocorrências:", 15, y);
      y += 7;
      
      // Add text from the observations textarea
      doc.setFont("helvetica", "normal");
      const observations = turn.observations;
      
      if (observations && observations.trim() !== '') {
        // Draw a rectangle to simulate the textarea
        doc.setDrawColor(150, 150, 150);
        doc.setFillColor(255, 255, 255);
        const textAreaHeight = 20;
        doc.rect(15, y, pageWidth - 30, textAreaHeight, 'S');
        
        // Add the text content inside the rectangle
        const observationLines = doc.splitTextToSize(observations, pageWidth - 35);
        doc.text(observationLines, 17, y + 5); // Add a small padding inside the rectangle
        y += textAreaHeight + 10;
      } else {
        // If no observations, still draw an empty textarea
        doc.setDrawColor(150, 150, 150);
        doc.setFillColor(255, 255, 255);
        const textAreaHeight = 20;
        doc.rect(15, y, pageWidth - 30, textAreaHeight, 'S');
        y += textAreaHeight + 10;
      }
    });
    
    y = checkPageSpace(y, 10);
    doc.setFont("helvetica", "bold");
    doc.text("Processamento de Ficheiros", 15, y);
    y += 10;
    
    const tableData = tableRows.map(row => [
      row.hora,
      row.tarefa,
      row.nomeAs,
      row.operacao,
      row.executado
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['HORA', 'TAREFAS', 'NOME AS/400', 'Nº OPERAÇÃO', 'EXECUTADO POR']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [24, 70, 126], textColor: 255 },
      margin: { left: 15, right: 15 }
    });
    
    doc.save(`FD${formattedDate}.pdf`);
    
    toast.success('PDF gerado com sucesso!');
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
                  <div className="flex flex-wrap gap-4 mt-2 ml-6">
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
                
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-start">
                    <Label className="cursor-pointer font-medium mr-2">Ficheiros INPS:</Label>
                    <div className="flex gap-4">
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
                
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-start">
                    <Label className="cursor-pointer font-medium mr-2">Enviar Ficheiro:</Label>
                    <div className="flex gap-4">
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
                </div>
                
                <div className="flex items-start space-x-2">
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
                <h4 className="text-sm font-semibold mb-2">Antes do Fecho</h4>
                
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
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-6" 
                    checked={tasks.turno3.validarFicheiro}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'validarFicheiro', !!checked)}
                  />
                  <Label htmlFor="tarefa3-6" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
                </div>
                
                <h4 className="text-sm font-semibold mt-4 mb-2">Depois do Fecho</h4>
                <h4 className="text-sm font-semibold mt-4 mb-2">Backups Diferidos</h4>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-7" 
                    checked={tasks.turno3.bmjrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'bmjrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-7" className="cursor-pointer">BMJRN (2 tapes/alterar 1 por mês/inicializar no início do mês)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-8" 
                    checked={tasks.turno3.grjrcv}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'grjrcv', !!checked)}
                  />
                  <Label htmlFor="tarefa3-8" className="cursor-pointer">GRJRCV (1 tape)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-9" 
                    checked={tasks.turno3.aujrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'aujrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-9" className="cursor-pointer">AUJRN (1 tape)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-10" 
                    checked={tasks.turno3.mvdia1}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'mvdia1', !!checked)}
                  />
                  <Label htmlFor="tarefa3-10" className="cursor-pointer">MVDIA1 (eliminar obj. após save N)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-11" 
                    checked={tasks.turno3.mvdia2}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'mvdia2', !!checked)}
                  />
                  <Label htmlFor="tarefa3-11" className="cursor-pointer">MVDIA2 (eliminar obj. após save S)</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="tarefa3-12" 
                    checked={tasks.turno3.brjrn}
                    onCheckedChange={(checked) => handleTaskChange('turno3', 'brjrn', !!checked)}
                  />
                  <Label htmlFor="tarefa3-12" className="cursor-pointer">BRJRN (1 tape)</Label>
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
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Processamento de Ficheiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">HORA</TableHead>
                    <TableHead className="w-[300px]">TAREFAS</TableHead>
                    <TableHead className="w-[150px]">NOME AS/400</TableHead>
                    <TableHead className="w-[150px]">Nº OPERAÇÃO</TableHead>
                    <TableHead className="w-[150px]">EXECUTADO POR</TableHead>
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
                        <Input 
                          type="text" 
                          value={row.executado}
                          onChange={(e) => handleInputChange(row.id, 'executado', e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <Button type="button" onClick={addTableRow} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-1" /> Adicionar Linha
              </Button>
              <Button type="button" onClick={removeTableRow} variant="outline" size="sm" disabled={tableRows.length <= 1}>
                <Trash2 className="h-4 w-4 mr-1" /> Remover Linha
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-6 gap-4">
          <Button onClick={handleSave} type="button">
            <Save className="h-4 w-4 mr-2" /> Salvar
          </Button>
          <Button onClick={generatePDF} type="button" variant="outline">
            <FileDown className="h-4 w-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Taskboard;
