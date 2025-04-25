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

  const drawCheckbox = (x: number, y: number, checked: string | boolean) => {
    const isChecked = ensureBoolean(checked);
    doc.rect(x, y, 3, 3);
    if (isChecked) {
      doc.line(x, y, x + 3, y + 3);
      doc.line(x + 3, y, x, y + 3);
    }
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
        
        const afterCloseTaskTexts: Record<string
