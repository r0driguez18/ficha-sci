
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UITableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, FileDown, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import type { Turno1Tasks, Turno2Tasks, Turno3Tasks, TurnKey, TasksType, TurnDataType } from '@/types/taskboard';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface TaskTableRow {
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
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
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
      backupsDiferidos: false,
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
      confirmarAtualizacaoSisp: false,
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
      listaRequisicoesCheques: false,
      cancelarCartoesClientes: false,
      prepararEnviarAsc: false,
      adicionarRegistrosBanka: false,
      fecharServidoresBanka: false,
      alterarInternetBanking: false,
      prepararEnviarCsv: false,
      fecharRealTime: false,
      fecharRealTimeHora: '',
      prepararEnviarEtr: false,
      fazerLoggOffAml: false,
      aplicarFicheiroErroEtr: false,
      validarBalcao14: false,
      fecharBalcao14: false,
      arranqueManual: false,
      inicioFecho: false,
      inicioFechoHora: '',
      validarEnvioEmail: false,
      controlarTrabalhos: false,
      saveBmbck: false,
      abrirServidoresInternet: false,
      imprimirCheques: false,
      backupBm: false,
      validarFicheiroCcln: false,
      aplicarFicheirosCompensacao: false,
      validarSaldoConta: false,
      saldoContaValor: '',
      saldoNegativo: false,
      saldoPositivo: false,
      abrirRealTime: false,
      abrirRealTimeHora: '',
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
      terminoFechoHora: '',
      transferirFicheirosDsi: false
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

  const saveTableRowsToSupabase = async () => {
    try {
      const rowsToSave = tableRows.filter(row => {
        const hasRequiredCommonFields = 
          row.hora.trim() !== '' && 
          row.operacao.trim() !== '' && 
          row.executado.trim() !== '';
        
        const option1Valid = 
          hasRequiredCommonFields && 
          row.tarefa.trim() !== '';
                           
        const option2Valid = 
          hasRequiredCommonFields && 
          row.nomeAs.trim() !== '';
                           
        return option1Valid || option2Valid;
      });
      
      if (rowsToSave.length === 0) {
        toast.error("Nenhum dado válido para salvar. Preencha pelo menos Hora, (Tarefa OU Nome AS400), Nº Operação e Executado Por.");
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
        backupsDiferidos: false,
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
        confirmarAtualizacaoSisp: false,
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
        listaRequisicoesCheques: false,
        cancelarCartoesClientes: false,
        prepararEnviarAsc: false,
        adicionarRegistrosBanka: false,
        fecharServidoresBanka: false,
        alterarInternetBanking: false,
        prepararEnviarCsv: false,
        fecharRealTime: false,
        fecharRealTimeHora: '',
        prepararEnviarEtr: false,
        fazerLoggOffAml: false,
        aplicarFicheiroErroEtr: false,
        validarBalcao14: false,
        fecharBalcao14: false,
        arranqueManual: false,
        inicioFecho: false,
        inicioFechoHora: '',
        validarEnvioEmail: false,
        controlarTrabalhos: false,
        saveBmbck: false,
        abrirServidoresInternet: false,
        imprimirCheques: false,
        backupBm: false,
        validarFicheiroCcln: false,
        aplicarFicheirosCompensacao: false,
        validarSaldoConta: false,
        saldoContaValor: '',
        saldoNegativo: false,
        saldoPositivo: false,
        abrirRealTime: false,
        abrirRealTimeHora: '',
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
        terminoFechoHora: '',
        transferirFicheirosDsi: false
      }
    });
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }]);
    
    localStorage.removeItem('taskboard-date');
    localStorage.removeItem('taskboard-turnData');
    localStorage.removeItem('taskboard-tasks');
    localStorage.removeItem('taskboard-tableRows');
    
    toast.success('Formulário reiniciado com sucesso!');
  };

  // Fix for TypeScript error - Ensure we only pass boolean values
  const ensureBoolean = (value: string | boolean): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    // Convert string to boolean
    return value === 'true';
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    const drawCheckbox = (x: number, y: number, checked: string | boolean) => {
      const isChecked = ensureBoolean(checked);
      doc.rect(x, y, 3, 3);
      if (isChecked) {
        doc.line(x, y, x + 3, y + 3);
        doc.line(x + 3, y, x, y + 3);
      }
    };
    
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
      doc.text(`${turnName}:`, 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Operador: ${turn.operator}`, 50, y);
      doc.text(`Entrada: ${turn.entrada}`, 120, y);
      doc.text(`Saída: ${turn.saida}`, 170, y);
      y += 10;

      const processTask = (taskKey: string, taskText: string, checked: boolean) => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, checked);
        doc.text(taskText, 20, y);
        y += 6;
      };

      if (turnKey === 'turno2') {
        Object.entries(tasks.turno2).forEach(([key, value]) => {
          const taskTexts: Record<string, string> = {
            datacenter: "Verificar DATA CENTER",
            sistemas: "Verificar Sistemas: BCACV1/BCACV2",
            servicos: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA",
            verificarReportes: "Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)",
            verificarDebitos: "Verificar Débitos/Créditos Aplicados no Turno Anterior",
            confirmarAtualizacaoSisp: "Confirmar Atualização SISP",
            processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
            processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR",
            validarSaco: "Validar Saco 1935",
            verificarPendentes: "Verificar Pendentes dos Balcões",
            fecharBalcoes: "Fechar os Balcoes Centrais"
          };

          if (key === 'inpsProcessar' || key === 'inpsEnviarRetorno') {
            if (key === 'inpsProcessar' && !y.toString().includes('INPS')) {
              y = checkPageSpace(y, 8);
              doc.text("Ficheiros INPS:", 20, y);
              y += 6;
            }
            const text = key === 'inpsProcessar' ? "Processar" : "Enviar Retorno";
            processTask(key, text, ensureBoolean(value));
          } else if (key === 'enviarEci' || key === 'enviarEdv') {
            if (key === 'enviarEci' && !y.toString().includes('Enviar')) {
              y = checkPageSpace(y, 8);
              doc.text("Enviar Ficheiro:", 20, y);
              y += 6;
            }
            const text = key === 'enviarEci' ? "ECI" : "EDV";
            processTask(key, text, ensureBoolean(value));
          } else if (taskTexts[key]) {
            processTask(key, taskTexts[key], ensureBoolean(value));
          }
        });
      }
      
      if (turnKey === 'turno1') {
        // Turno 1 tasks processing
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
          processTask(taskKey, taskTexts[taskKey], ensureBoolean(tasks.turno1[typedTaskKey]));
        });
        
        // "Enviar" section with checkboxes
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
        
        // Remaining Turno 1 tasks
        const remainingTasks = [
          'verificarDebitos', 'processarTef', 'processarTelecomp', 'backupsDiferidos', 'enviarSegundoEtr',
          'enviarFicheiroCom', 'dia01', 'dia08', 'dia16', 'dia23', 'atualizarCentralRisco',
          'bmjrn', 'grjrcv', 'aujrn', 'mvdia1', 'mvdia2', 'brjrn'
        ];
        
        const taskTexts: Record<string, string> = {
          verificarDebitos: "Verificar Débitos/Créditos aplicados no dia Anterior",
          processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
          processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR",
          backupsDiferidos: "Backups Diferidos",
          enviarSegundoEtr: "Enviar Segundo ETR",
          enviarFicheiroCom: "Enviar Ficheiro COM",
          dia01: "Dia 01",
          dia08: "Dia 08",
          dia16: "Dia 16",
          dia23: "Dia 23",
          atualizarCentralRisco: "Atualizar Central de Risco",
          bmjrn: "BMJRN",
          grjrcv: "GRJRCV",
          aujrn: "AUJRN",
          mvdia1: "MVDIA1",
          mvdia2: "MVDIA2",
          brjrn: "BRJRN"
        };
        
        remainingTasks.forEach(taskKey => {
          if (taskTexts[taskKey]) {
            const typedTaskKey = taskKey as keyof Turno1Tasks;
            processTask(taskKey, taskTexts[taskKey], ensureBoolean(tasks.turno1[typedTaskKey]));
          }
        });
      }
      
      if (turnKey === 'turno3') {
        // Before Close tasks
        const beforeCloseTasks = [
          'verificarDebitos', 'tratarTapes', 'fecharServidores', 'fecharImpressoras', 'userFecho', 
          'listaRequisicoesCheques', 'cancelarCartoesClientes', 'prepararEnviarAsc', 'adicionarRegistrosBanka',
          'fecharServidoresBanka', 'alterarInternetBanking', 'prepararEnviarCsv', 'fecharRealTime',
          'prepararEnviarEtr', 'fazerLoggOffAml', 'aplicarFicheiroErroEtr', 'validarBalcao14',
          'fecharBalcao14', 'arranqueManual', 'inicioFecho', 'validarEnvioEmail', 'controlarTrabalhos',
          'saveBmbck', 'abrirServidoresInternet', 'imprimirCheques', 'backupBm'
        ];
        
        const taskTexts: Record<string, string> = {
          verificarDebitos: "Verificar Débitos/Créditos Aplicados no Turno Anterior",
          tratarTapes: "Tratar e trocar Tapes BM, BMBCK – percurso 7622",
          fecharServidores: "Fechar Servidores Teste e Produção",
          fecharImpressoras: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI",
          userFecho: "User Fecho Executar o percurso 7624 Save SYS1OB",
          listaRequisicoesCheques: "Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911",
          cancelarCartoesClientes: "User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857",
          prepararEnviarAsc: "Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132",
          adicionarRegistrosBanka: "User Fecho Adiciona registos na Banka Remota- percurso 768975",
          fecharServidoresBanka: "User Fecho, fechar servidores Banka remota IN1/IN3/IN4",
          alterarInternetBanking: "User Fecho Alterar Internet Banking para OFFLINE – percurso 49161",
          prepararEnviarCsv: "Preparar e enviar ficheiro CSV (saldos)",
          fecharRealTime: "Interromper o Real-Time com a SISP",
          prepararEnviarEtr: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18   5488103",
          fazerLoggOffAml: "Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)",
          aplicarFicheiroErroEtr: "Aplicar Ficheiro Erro ETR",
          validarBalcao14: "Validar balção 14 7185",
          fecharBalcao14: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados",
          arranqueManual: "Arranque Manual - Verificar Data da Aplicação – Percurso 431",
          inicioFecho: "Início do Fecho",
          validarEnvioEmail: "Validar envio email( Notificação Inicio Fecho)  a partir do ISeries",
          controlarTrabalhos: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)",
          saveBmbck: "Save BMBCK – Automático",
          abrirServidoresInternet: "Abrir Servidores Internet Banking – Percurso 161–",
          imprimirCheques: "Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)",
          backupBm: "Backup BM – Automático"
        };
        
        beforeCloseTasks.forEach(taskKey => {
          if (taskTexts[taskKey]) {
            const typedTaskKey = taskKey as keyof Turno3Tasks;
            processTask(taskKey, taskTexts[taskKey], ensureBoolean(tasks.turno3[typedTaskKey]));
          }
        });
        
        // Add timestamps for specific tasks
        if (tasks.turno3.fecharRealTimeHora) {
          const lastIndex = beforeCloseTasks.indexOf('fecharRealTime');
          if (lastIndex !== -1) {
            y -= 6; // Go back up a bit
            doc.text(`Hora: ${tasks.turno3.fecharRealTimeHora}`, 120, y);
            y += 6; // Go back down
          }
        }
        
        if (tasks.turno3.inicioFechoHora) {
          const lastIndex = beforeCloseTasks.indexOf('inicioFecho');
          if (lastIndex !== -1) {
            y -= 6; // Go back up a bit
            doc.text(`Hora: ${tasks.turno3.inicioFechoHora}`, 120, y);
            y += 6; // Go back down
          }
        }
        
        // After Close tasks
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Depois do Fecho", 15, y);
        y += 8;
        
        const afterCloseTasks = [
          'validarFicheiroCcln', 'aplicarFicheirosCompensacao', 'validarSaldoConta',
          'abrirRealTime', 'verificarTransacoes', 'aplicarFicheiroVisa', 'cativarCartoes',
          'abrirBcaDireto', 'abrirServidoresBanka', 'atualizarTelefonesOffline',
          'verificarReplicacao', 'enviarFicheiroCsv', 'transferirFicheirosLiquidity',
          'percurso76921', 'percurso76922', 'percurso76923', 'abrirServidoresTesteProducao',
          'impressaoCheques', 'arquivarCheques', 'terminoFecho', 'transferirFicheirosDsi'
        ];
        
        const afterCloseTaskTexts: Record<string, string> = {
          validarFicheiroCcln: "Validar Ficheiro CCLN",
          aplicarFicheirosCompensacao: "Aplicar Ficheiros de Compensação",
          validarSaldoConta: "Validar Saldo da Conta: 5488103 pelo SP (opção 85) e também na 21.86.3",
          abrirRealTime: "Iniciar o Real-Time SISP",
          verificarTransacoes: "Verificar se o número de transações da compensação está correcto",
          aplicarFicheiroVisa: "Aplicar Ficheiro Visa",
          cativarCartoes: "Cativar cartões, gerar NTPs",
          abrirBcaDireto: "User fecho Abrir BCA Directo – percurso 49162",
          abrirServidoresBanka: "User fecho Abrir servidores Banka remota (s/GATEs)",
          atualizarTelefonesOffline: "User fecho Atualizar telefones offline percurso 76861",
          verificarReplicacao: "Verificar replicação pelo transactional agent",
          enviarFicheiroCsv: "Enviar Ficheiro CSV",
          transferirFicheirosLiquidity: "Transferir Ficheiros Liquidity",
          percurso76921: "Percurso 76921 após conclusão do fecho",
          percurso76922: "Percurso 76922 MVDIAR após conclusão do percurso 76921",
          percurso76923: "Percurso 76923 GRJCVR após conclusão do percurso 76922",
          abrirServidoresTesteProducao: "Abrir servidores Teste e Produção",
          impressaoCheques: "Impressão de Cheques / Talões de Levantamento",
          arquivarCheques: "Arquivar cheques",
          terminoFecho: "Termino do Fecho",
          transferirFicheirosDsi: "Transferir Ficheiros DSI"
        };
        
        afterCloseTasks.forEach(taskKey => {
          if (afterCloseTaskTexts[taskKey]) {
            const typedTaskKey = taskKey as keyof Turno3Tasks;
            processTask(taskKey, afterCloseTaskTexts[taskKey], ensureBoolean(tasks.turno3[typedTaskKey]));
          }
        });
        
        // Add timestamps for specific tasks
        if (tasks.turno3.abrirRealTimeHora) {
          const lastIndex = afterCloseTasks.indexOf('abrirRealTime');
          if (lastIndex !== -1) {
            y -= 6; // Go back up a bit
            doc.text(`Hora: ${tasks.turno3.abrirRealTimeHora}`, 120, y);
            y += 6; // Go back down
          }
        }
        
        if (tasks.turno3.terminoFechoHora) {
          const lastIndex = afterCloseTasks.indexOf('terminoFecho');
          if (lastIndex !== -1) {
            y -= 6; // Go back up a bit
            doc.text(`Hora: ${tasks.turno3.terminoFechoHora}`, 120, y);
            y += 6; // Go back down
          }
        }
        
        // Saldo conta section
        if (tasks.turno3.validarSaldoConta) {
          const lastIndex = afterCloseTasks.indexOf('validarSaldoConta');
          if (lastIndex !== -1) {
            const saldoValor = tasks.turno3.saldoContaValor;
            if (saldoValor) {
              y -= 6; // Go back up a bit
              doc.text(`Valor: ${saldoValor}`, 120, y);
            }
            y -= 4; // Go back up more for the checkboxes
            
            let xOffset = 160;
            doc.setFontSize(10);
            
            if (tasks.turno3.saldoNegativo || tasks.turno3.saldoPositivo) {
              if (tasks.turno3.saldoPositivo) {
                drawCheckbox(xOffset, y, tasks.turno3.saldoPositivo);
                doc.text("Positivo", xOffset + 5, y + 3);
                xOffset += 40;
              }
              
              if (tasks.turno3.saldoNegativo) {
                drawCheckbox(xOffset, y, tasks.turno3.saldoNegativo);
                doc.text("Negativo", xOffset + 5, y + 3);
              }
              
              y += 10; // Go back down
            }
          }
        }
      }
      
      // Add observations
      const observations = turnData[turnKey].observations;
      if (observations) {
        y = checkPageSpace(y, 20);
        doc.setFont("helvetica", "bold");
        doc.text("Observações:", 15, y);
        y += 6;
        
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(observations, pageWidth - 30);
        doc.text(lines, 15, y);
        y += lines.length * 6 + 8;
      }
    });

    // Table for task processing
    y = checkPageSpace(y, 15);
    doc.setFont("helvetica", "bold");
    doc.text("Processamentos:", 15, y);
    y += 10;

    // Format the table data
    const tableData = tableRows
      .filter(row => row.hora || row.tarefa || row.nomeAs || row.operacao || row.executado)
      .map(row => [
        row.hora,
        row.tarefa,
        row.nomeAs,
        row.operacao,
        row.executado
      ]);
    
    // Add the table to the PDF
    doc.autoTable({
      startY: y,
      head: [['Hora', 'Tarefa', 'Nome AS/400', 'Nº Operação', 'Executado Por']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [24, 70, 126], textColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 10 }
    });
    
    // Save the PDF with the current date in the filename
    doc.save(`Ficha_Procedimentos_${formattedDate}.pdf`);
  };  

  return (
    <div className="container mx-auto pb-12">
      <div className="my-4">
        <PageHeader
          title="Ficha de Processamentos"
          description="Centro Informática - Formulário para registro diário de processamentos, tarefas e operações realizadas pelos diferentes turnos."
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Data do Registro</CardTitle>
          <CardDescription>Selecione a data para registro das atividades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="date" className="w-20">Data</Label>
            <Input 
              type="date" 
              id="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="max-w-xs" 
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="turno1" className="mb-6">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="turno1">Turno 1</TabsTrigger>
          <TabsTrigger value="turno2">Turno 2</TabsTrigger>
          <TabsTrigger value="turno3">Turno 3</TabsTrigger>
        </TabsList>

        <TabsContent value="turno1">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Turno 1</CardTitle>
              <CardDescription>Preencha as informações do operador e atividades realizadas no Turno 1.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-full md:w-auto md:flex-1">
                  <Label htmlFor="operator1">Operador</Label>
                  <Select
                    value={turnData.turno1.operator}
                    onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsList.map((op) => (
                        <SelectItem key={`turno1-${op.value}`} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="entrada1">Hora de Entrada</Label>
                  <Input
                    id="entrada1"
                    type="time"
                    value={turnData.turno1.entrada}
                    onChange={(e) => handleTurnDataChange('turno1', 'entrada', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="saida1">Hora de Saída</Label>
                  <Input
                    id="saida1"
                    type="time"
                    value={turnData.turno1.saida}
                    onChange={(e) => handleTurnDataChange('turno1', 'saida', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Tarefas do Turno 1</h3>
                <Turno1TasksComponent 
                  tasks={tasks.turno1}
                  onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                  observations={turnData.turno1.observations}
                  onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turno2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Turno 2</CardTitle>
              <CardDescription>Preencha as informações do operador e atividades realizadas no Turno 2.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-full md:w-auto md:flex-1">
                  <Label htmlFor="operator2">Operador</Label>
                  <Select
                    value={turnData.turno2.operator}
                    onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsList.map((op) => (
                        <SelectItem key={`turno2-${op.value}`} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="entrada2">Hora de Entrada</Label>
                  <Input
                    id="entrada2"
                    type="time"
                    value={turnData.turno2.entrada}
                    onChange={(e) => handleTurnDataChange('turno2', 'entrada', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="saida2">Hora de Saída</Label>
                  <Input
                    id="saida2"
                    type="time"
                    value={turnData.turno2.saida}
                    onChange={(e) => handleTurnDataChange('turno2', 'saida', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Tarefas do Turno 2</h3>
                <Turno2TasksComponent 
                  tasks={tasks.turno2}
                  onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                  observations={turnData.turno2.observations}
                  onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turno3">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Turno 3</CardTitle>
              <CardDescription>Preencha as informações do operador e atividades realizadas no Turno 3.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-full md:w-auto md:flex-1">
                  <Label htmlFor="operator3">Operador</Label>
                  <Select
                    value={turnData.turno3.operator}
                    onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsList.map((op) => (
                        <SelectItem key={`turno3-${op.value}`} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="entrada3">Hora de Entrada</Label>
                  <Input
                    id="entrada3"
                    type="time"
                    value={turnData.turno3.entrada}
                    onChange={(e) => handleTurnDataChange('turno3', 'entrada', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="w-full md:w-1/4">
                  <Label htmlFor="saida3">Hora de Saída</Label>
                  <Input
                    id="saida3"
                    type="time"
                    value={turnData.turno3.saida}
                    onChange={(e) => handleTurnDataChange('turno3', 'saida', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Tarefas do Turno 3</h3>
                <Turno3TasksComponent 
                  tasks={tasks.turno3}
                  onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)}
                  observations={turnData.turno3.observations}
                  onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registro de Processamentos</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addTableRow}>
                <PlusCircle className="w-4 h-4 mr-1" /> Adicionar
              </Button>
              <Button size="sm" variant="outline" onClick={removeTableRow} disabled={tableRows.length <= 1}>
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Registre as atividades, processamentos ou operações realizadas durante o seu turno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <UITableRow>
                  <TableHead className="w-[100px]">Hora</TableHead>
                  <TableHead className="w-[200px]">Tarefa</TableHead>
                  <TableHead className="w-[200px]">Nome AS/400</TableHead>
                  <TableHead className="w-[150px]">Nº Operação</TableHead>
                  <TableHead className="w-[150px]">Executado Por</TableHead>
                </UITableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map(row => (
                  <UITableRow key={row.id}>
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
                        placeholder="Descreva a tarefa..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="text" 
                        value={row.nomeAs} 
                        onChange={(e) => handleInputChange(row.id, 'nomeAs', e.target.value)}
                        placeholder="Nome AS/400..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="text"
                        pattern="[0-9]*"
                        value={row.operacao}
                        onChange={(e) => handleInputChange(row.id, 'operacao', e.target.value)}
                        placeholder="Apenas números..."
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={row.executado}
                        onValueChange={(value) => handleInputChange(row.id, 'executado', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((op) => (
                            <SelectItem key={`row-${row.id}-${op.value}`} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </UITableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={resetForm}>
          <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar Formulário
        </Button>
        <Button variant="secondary" onClick={generatePDF}>
          <FileDown className="w-4 h-4 mr-2" /> Gerar PDF
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" /> Salvar Dados
        </Button>
      </div>
    </div>
  );
};

export default Taskboard;
