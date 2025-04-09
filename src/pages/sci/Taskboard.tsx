import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, FileDown, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';

export interface TableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

type TurnKey = 'turno1' | 'turno2' | 'turno3';

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
  const navigate = useNavigate();
  
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

  const saveTableRowsToSupabase = async () => {
    try {
      const rowsToSave = tableRows.filter(
        row => row.hora.trim() !== '' && row.tarefa.trim() !== '' && row.nomeAs.trim() !== ''
      );
      
      if (rowsToSave.length === 0) {
        toast.error("Nenhum dado válido para salvar. Preencha pelo menos um processamento.");
        return;
      }
      
      let savedCount = 0;
      
      for (const row of rowsToSave) {
        const result = await saveFileProcess({
          time_registered: row.hora,
          task: row.tarefa,
          as400_name: row.nomeAs,
          operation_number: row.operacao,
          executed_by: row.executado
        });
        
        if (!result.error) {
          savedCount++;
        }
      }
      
      console.log(`Salvos ${savedCount} registros no Supabase`);
      return savedCount;
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
      return 0;
    }
  };

  const handleSave = async () => {
    const savedCount = await saveTableRowsToSupabase();
    
    if (savedCount > 0) {
      toast.success(`${savedCount} processamentos salvos com sucesso!`);
      
      toast.message(
        "Dados salvos com sucesso!",
        {
          action: {
            label: "Ver Gráficos",
            onClick: () => navigate("/easyvista/dashboards")
          }
        }
      );
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
    setTasks({
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
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }]);
    
    localStorage.removeItem('taskboard-date');
    localStorage.removeItem('taskboard-turnData');
    localStorage.removeItem('taskboard-tasks');
    localStorage.removeItem('taskboard-tableRows');
    
    toast.success('Formulário reiniciado com sucesso!');
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
      
      const processTask = (taskKey: string, taskText: string, checked: boolean) => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, checked);
        doc.setFontSize(10);
        doc.text(taskText, 20, y);
        y += 6;
      };
      
      if (turnKey === 'turno1') {
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
        
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, tasks.turno1.enviar);
        doc.setFontSize(10);
        doc.text("Enviar:", 20, y);
        
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
          drawCheckbox(xOffset, y - 3, tasks.turno1[itemKey]);
          doc.text(item.text, xOffset + 5, y);
          xOffset += doc.getTextWidth(item.text) + 15;
        });
        
        y += 8;
        
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
      
      if (turnKey === 'turno2') {
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
        
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Ficheiros INPS:", 20, y);
        
        let xOffset = 55;
        
        drawCheckbox(xOffset, y - 3, tasks.turno2.inpsProcessar);
        doc.text("Processar", xOffset + 5, y);
        
        xOffset += 35;
        
        drawCheckbox(xOffset, y - 3, tasks.turno2.inpsEnviarRetorno);
        doc.text("Enviar Retorno", xOffset + 5, y);
        
        y += 8;
        
        const middleTasksToProcess = ['processarTef', 'processarTelecomp'];
        
        middleTasksToProcess.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
            processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
          };
          
          const typedTaskKey = taskKey as keyof Turno2Tasks;
          processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey]);
        });
        
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Enviar Ficheiro:", 20, y);
        
        xOffset = 55;
        
        drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEci);
        doc.text("ECI", xOffset + 5, y);
        
        xOffset += 20;
        
        drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEdv);
        doc.text("EDV", xOffset + 5, y);
        
        y += 8;
        
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
      
      if (turnKey === 'turno3') {
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
      
      y = checkPageSpace(y, 25);
      doc.setFont("helvetica", "bold");
      doc.text("Outras Intervenções/Ocorrências:", 15, y);
      y += 7;
      
      const observations = turn.observations;
      
      if (observations && observations.trim() !== '') {
        doc.setDrawColor(150, 150, 150);
        doc.setFillColor(255, 255, 255);
        const textAreaHeight = 20;
        doc.rect(15, y, pageWidth - 30, textAreaHeight, 'S');
        
        const observationLines = doc.splitTextToSize(observations, pageWidth - 35);
        doc.text(observationLines, 17, y + 5);
        y += textAreaHeight + 10;
      } else {
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

    saveTableRowsToSupabase();
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/sci/calendar')}
              className="mr-2"
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendário
            </Button>
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
              </div>
              
              <div className="mt-4">
                <Label htmlFor="obs-turno1" className="font-medium">Outras Intervenções/Ocorrências:</Label>
                <Textarea 
                  id="obs-turno1" 
                  className="mt-2"
                  value={turnData.turno1.observations}
                  onChange={(e) => handleTurnDataChange('turno1', 'observations', e.target.value)}
                />
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
              </div>
              
              <div className="mt-4">
                <Label htmlFor="obs-turno2" className="font-medium">Outras Intervenções/Ocorrências:</Label>
                <Textarea 
                  id="obs-turno2" 
                  className="mt-2"
                  value={turnData.turno2.observations}
                  onChange={(e) => handleTurnDataChange('turno2', 'observations', e.target.value)}
                />
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
              </div>
              
              <div className="mt-4">
                <Label htmlFor="obs-turno3" className="font-medium">Outras Intervenções/Ocorrências:</Label>
                <Textarea 
                  id="obs-turno3" 
                  className="mt-2"
                  value={turnData.turno3.observations}
                  onChange={(e) => handleTurnDataChange('turno3', 'observations', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Processamento de Ficheiros</h3>
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
                {tableRows.map(row => (
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
          
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={addTableRow}>
              <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Linha
            </Button>
            <Button variant="outline" size="sm" onClick={removeTableRow} disabled={tableRows.length <= 1}>
              <Trash2 className="h-4 w-4 mr-2" /> Remover Linha
            </Button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <div className="space-x-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar
            </Button>
          </div>
          <Button onClick={generatePDF}>
            <FileDown className="h-4 w-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Taskboard;
