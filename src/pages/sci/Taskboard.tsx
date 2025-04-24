
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { TasksType, TurnDataType, TurnKey } from '@/types/taskboard';

export interface TableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

const operatorsList = [
  { value: "joao", label: "João" },
  { value: "maria", label: "Maria" },
  { value: "edelgado", label: "Edelgado" },
  { value: "etavares", label: "Etavares" },
  { value: "lspencer", label: "Lspencer" },
  { value: "sbarbosa", label: "Sbarbosa" },
  { value: "nalves", label: "Nalves" }
];

const processFormSchema = z.object({
  operacao: z.string().regex(/^\d{9}$/, {
    message: "O número de operação deve conter exatamente 9 dígitos"
  }),
  executado: z.string({
    required_error: "Por favor selecione um operador"
  })
});

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
      processarTelecomp: false,
      enviarSegundoEtr: false,
      enviarFicheiroCom: false,
      dia01: false,
      dia08: false,
      dia16: false,
      dia23: false,
      atualizarCentralRisco: false,
      bmjrn: false,
      grjrcv: false,
      aujrn: false,
      mvdia1: false,
      mvdia2: false,
      brjrn: false
    },
    turno2: {
      datacenter: false,
      sistemas: false,
      servicos: false,
      verificarReportes: false,
      verificarDebitos: false,
      inpsProcessar: false,
      inpsEnviarRetorno: false,
      processarTef: false,
      processarTelecomp: false,
      enviarEci: false,
      enviarEdv: false,
      confirmarSisp: false,
      verificarPendentes: false,
      validarSaco: false,
      fecharBalcoes: false
    },
    turno3: {
      verificarDebitos: false,
      tratarTapes: false,
      fecharServidores: false,
      fecharImpressoras: false,
      userFecho: false,
      listaRequisicoesCheques: false,
      cancelarCartoesClientes: false,
      prepararEnviarAsc: false,
      adicionarRegistrosBanka: false,
      fecharServidoresBanka: false,
      alterarInternetBanking: false,
      prepararEnviarCsv: false,
      fecharRealTime: false,
      prepararEnviarEtr: false,
      fazerLoggOffAml: false,
      aplicarFicheiroErroEtr: false,
      validarBalcao14: false,
      fecharBalcao14: false,
      arranqueManual: false,
      inicioFecho: false,
      validarEnvioEmail: false,
      controlarTrabalhos: false,
      saveBmbck: false,
      abrirServidoresInternet: false,
      imprimirCheques: false,
      backupBm: false,
      validarFicheiroCcln: false,
      aplicarFicheirosCompensacao: false,
      validarSaldoConta: false,
      saldoNegativo: false,
      saldoPositivo: false,
      abrirRealTime: false,
      verificarTransacoes: false,
      aplicarFicheiroVisa: false,
      cativarCartoes: false,
      abrirBcaDireto: false,
      abrirServidoresBanka: false,
      atualizarTelefonesOffline: false,
      verificarReplicacao: false,
      enviarFicheiroCsv: false,
      transferirFicheirosLiquidity: false,
      percurso76921: false,
      percurso76922: false,
      percurso76923: false,
      abrirServidoresTesteProducao: false,
      impressaoCheques: false,
      arquivarCheques: false,
      terminoFecho: false,
      transferirFicheirosDsi: false,
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

  const saveTableRowsToSupabase = async () => {
    try {
      const rowsToSave = tableRows.filter(row => {
        const hasCommonRequiredFields = 
          row.hora.trim() !== '' && 
          row.executado.trim() !== '';
        
        if (row.nomeAs.trim() !== '') {
          return hasCommonRequiredFields && 
                 row.operacao.trim() !== '' &&
                 /^\d{9}$/.test(row.operacao);
        }
        
        return hasCommonRequiredFields && row.tarefa.trim() !== '';
      });
      
      if (rowsToSave.length === 0) {
        toast.error("Preencha pelo menos: Hora, (Tarefa OU Nome AS400 com Nº Operação) e Executado Por.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      let savedCount = 0;
      let duplicateCount = 0;
      
      for (const row of rowsToSave) {
        console.log("Processando linha:", row);
        const result = await saveFileProcess({
          time_registered: row.hora,
          task: row.tarefa,
          as400_name: row.nomeAs,
          operation_number: row.operacao,
          executed_by: row.executado
        });
        
        if (!result.error) {
          savedCount++;
        } else if (result.error.message && result.error.message.includes("já existe")) {
          duplicateCount++;
        }
      }
      
      console.log(`Salvos ${savedCount} registros e ignorados ${duplicateCount} registros duplicados no Supabase`);
      return { savedCount, duplicateCount };
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
      return { savedCount: 0, duplicateCount: 0 };
    }
  };

  const handleSave = async () => {
    const { savedCount, duplicateCount } = await saveTableRowsToSupabase();
    
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
        processarTelecomp: false,
        enviarSegundoEtr: false,
        enviarFicheiroCom: false,
        dia01: false,
        dia08: false,
        dia16: false,
        dia23: false,
        atualizarCentralRisco: false,
        bmjrn: false,
        grjrcv: false,
        aujrn: false,
        mvdia1: false,
        mvdia2: false,
        brjrn: false
      },
      turno2: {
        datacenter: false,
        sistemas: false,
        servicos: false,
        verificarReportes: false,
        verificarDebitos: false,
        inpsProcessar: false,
        inpsEnviarRetorno: false,
        processarTef: false,
        processarTelecomp: false,
        enviarEci: false,
        enviarEdv: false,
        confirmarSisp: false,
        verificarPendentes: false,
        validarSaco: false,
        fecharBalcoes: false
      },
      turno3: {
        verificarDebitos: false,
        tratarTapes: false,
        fecharServidores: false,
        fecharImpressoras: false,
        userFecho: false,
        listaRequisicoesCheques: false,
        cancelarCartoesClientes: false,
        prepararEnviarAsc: false,
        adicionarRegistrosBanka: false,
        fecharServidoresBanka: false,
        alterarInternetBanking: false,
        prepararEnviarCsv: false,
        fecharRealTime: false,
        prepararEnviarEtr: false,
        fazerLoggOffAml: false,
        aplicarFicheiroErroEtr: false,
        validarBalcao14: false,
        fecharBalcao14: false,
        arranqueManual: false,
        inicioFecho: false,
        validarEnvioEmail: false,
        controlarTrabalhos: false,
        saveBmbck: false,
        abrirServidoresInternet: false,
        imprimirCheques: false,
        backupBm: false,
        validarFicheiroCcln: false,
        aplicarFicheirosCompensacao: false,
        validarSaldoConta: false,
        saldoNegativo: false,
        saldoPositivo: false,
        abrirRealTime: false,
        verificarTransacoes: false,
        aplicarFicheiroVisa: false,
        cativarCartoes: false,
        abrirBcaDireto: false,
        abrirServidoresBanka: false,
        atualizarTelefonesOffline: false,
        verificarReplicacao: false,
        enviarFicheiroCsv: false,
        transferirFicheirosLiquidity: false,
        percurso76921: false,
        percurso76922: false,
        percurso76923: false,
        abrirServidoresTesteProducao: false,
        impressaoCheques: false,
        arquivarCheques: false,
        terminoFecho: false,
        transferirFicheirosDsi: false,
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno1;
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
          const itemKey = item.key as keyof typeof tasks.turno1;
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno1;
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno2;
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno2;
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno2;
          processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey]);
        });
      }
      
      if (turnKey === 'turno3') {
        const beforeCloseTasks = ['verificarDebitos', 'tratarTapes', 'fecharServidores', 'fecharImpressoras', 'userFecho', 'validarFicheiroCcln'];
        
        beforeCloseTasks.forEach(taskKey => {
          const taskTexts: Record<string, string> = {
            verificarDebitos: "Verificar Débitos/Créditos Aplicados no Turno Anterior",
            tratarTapes: "Tratar e trocar Tapes BM, BMBCK – percurso 7622",
            fecharServidores: "Fechar Servidores Teste e Produção",
            fecharImpressoras: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI",
            userFecho: "User Fecho Executar o percurso 7624 Save SYS1OB",
            validarFicheiroCcln: "Validar ficheiro CCLN - 76853"
          };
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno3;
          processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey]);
          
          if (taskKey === 'validarFicheiroCcln') {
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
          
          const typedTaskKey = taskKey as keyof typeof tasks.turno3;
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
    <Card className="w-full max-h-[calc(100vh-2rem)] flex flex-col">
      <CardHeader className="bg-[#18467e] text-white shrink-0">
        <CardTitle className="text-center text-2xl">CENTRO INFORMÁTICA</CardTitle>
        <CardDescription className="text-center text-white text-xl">Ficha de Procedimentos</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 overflow-y-auto flex-1">
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
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Turno 1</CardTitle>
                <CardDescription>Informações do operador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="operator1">Operador</Label>
                    <Select
                      value={turnData.turno1.operator}
                      onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                    >
                      <SelectTrigger id="operator1">
                        <SelectValue placeholder="Selecionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorsList.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="entrada1">Entrada</Label>
                      <Input 
                        id="entrada1" 
                        type="time"
                        value={turnData.turno1.entrada}
                        onChange={(e) => handleTurnDataChange('turno1', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida1">Saída</Label>
                      <Input 
                        id="saida1" 
                        type="time"
                        value={turnData.turno1.saida}
                        onChange={(e) => handleTurnDataChange('turno1', 'saida', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Tarefas</CardTitle>
                <CardDescription>Marque as tarefas executadas</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                <Turno1TasksComponent 
                  tasks={tasks.turno1} 
                  onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)} 
                />
                
                <div className="mt-6">
                  <Label htmlFor="observacoes1">Observações</Label>
                  <Textarea 
                    id="observacoes1"
                    placeholder="Observações sobre o turno..."
                    className="mt-2"
                    value={turnData.turno1.observations}
                    onChange={(e) => handleTurnDataChange('turno1', 'observations', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="turno2">
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Turno 2</CardTitle>
                <CardDescription>Informações do operador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="operator2">Operador</Label>
                    <Select 
                      value={turnData.turno2.operator}
                      onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                    >
                      <SelectTrigger id="operator2">
                        <SelectValue placeholder="Selecionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorsList.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="entrada2">Entrada</Label>
                      <Input 
                        id="entrada2" 
                        type="time"
                        value={turnData.turno2.entrada}
                        onChange={(e) => handleTurnDataChange('turno2', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida2">Saída</Label>
                      <Input 
                        id="saida2" 
                        type="time"
                        value={turnData.turno2.saida}
                        onChange={(e) => handleTurnDataChange('turno2', 'saida', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Tarefas</CardTitle>
                <CardDescription>Marque as tarefas executadas</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                <Turno2TasksComponent 
                  tasks={tasks.turno2} 
                  onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)} 
                />
                
                <div className="mt-6">
                  <Label htmlFor="observacoes2">Observações</Label>
                  <Textarea 
                    id="observacoes2"
                    placeholder="Observações sobre o turno..."
                    className="mt-2"
                    value={turnData.turno2.observations}
                    onChange={(e) => handleTurnDataChange('turno2', 'observations', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="turno3">
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Turno 3</CardTitle>
                <CardDescription>Informações do operador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="operator3">Operador</Label>
                    <Select
                      value={turnData.turno3.operator}
                      onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                    >
                      <SelectTrigger id="operator3">
                        <SelectValue placeholder="Selecionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorsList.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="entrada3">Entrada</Label>
                      <Input 
                        id="entrada3" 
                        type="time"
                        value={turnData.turno3.entrada}
                        onChange={(e) => handleTurnDataChange('turno3', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida3">Saída</Label>
                      <Input 
                        id="saida3" 
                        type="time"
                        value={turnData.turno3.saida}
                        onChange={(e) => handleTurnDataChange('turno3', 'saida', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>Tarefas</CardTitle>
                <CardDescription>Marque as tarefas executadas</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                <Turno3TasksComponent 
                  tasks={tasks.turno3} 
                  onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)} 
                />
                
                <div className="mt-6">
                  <Label htmlFor="observacoes3">Observações</Label>
                  <Textarea 
                    id="observacoes3"
                    placeholder="Observações sobre o turno..."
                    className="mt-2"
                    value={turnData.turno3.observations}
                    onChange={(e) => handleTurnDataChange('turno3', 'observations', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle>Processamento de Ficheiros</CardTitle>
              <CardDescription>Registe os ficheiros processados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Nome AS/400</TableHead>
                    <TableHead>Nº Operação</TableHead>
                    <TableHead>Executado por</TableHead>
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
                          className="border-none"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.tarefa}
                          onChange={(e) => handleInputChange(row.id, 'tarefa', e.target.value)}
                          className="border-none"
                          placeholder="Nome da tarefa"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.nomeAs}
                          onChange={(e) => handleInputChange(row.id, 'nomeAs', e.target.value)}
                          className="border-none"
                          placeholder="Nome AS400"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.operacao}
                          onChange={(e) => handleInputChange(row.id, 'operacao', e.target.value)}
                          className="border-none"
                          placeholder="Nº Operação (9 dígitos)"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.executado}
                          onValueChange={(value) => handleInputChange(row.id, 'executado', value)}
                        >
                          <SelectTrigger className="border-none">
                            <SelectValue placeholder="Selecionar operador" />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorsList.map((operator) => (
                              <SelectItem key={operator.value} value={operator.value}>
                                {operator.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={addTableRow}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
                <Button variant="outline" onClick={removeTableRow} disabled={tableRows.length <= 1}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <CardFooter className="flex justify-between pt-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generatePDF}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default Taskboard;
