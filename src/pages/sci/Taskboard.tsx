import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UITableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, FileDown, RotateCcw } from 'lucide-react';
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
import type { Turno1Tasks, Turno2Tasks, Turno3Tasks, TurnKey, TasksType, TurnDataType } from '@/types/taskboard';

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
      enviarReportes: false,
      verificarRecepcaoSisp: false,
      backupsDiferidos: false,
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
      brjrn: false,
      verificarAsc: false,
      verificarCsv: false,
      verificarEci: false
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
      confirmarAtualizacaoFicheiros: false,
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

  const handleTaskChange = (turno: TurnKey, task: string, checked: boolean | string) => {
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
        enviarReportes: false,
        verificarRecepcaoSisp: false,
        backupsDiferidos: false,
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
        brjrn: false,
        verificarAsc: false,
        verificarCsv: false,
        verificarEci: false
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
        confirmarAtualizacaoFicheiros: false,
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
    
    // Helper function to ensure we only pass boolean values to drawCheckbox
    const ensureBoolean = (value: boolean | string): boolean => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'indeterminate';
      }
      return Boolean(value);
    };
    
    const drawCheckbox = (x: number, y: number, checked: boolean | string) => {
      const isChecked = ensureBoolean(checked);
      doc.rect(x, y, 3, 3);
      if (isChecked) {
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
      
      doc.text(`Operador: ${turn.operator}`, 50, y);
      doc.text(`Entrada: ${turn.entrada}`, 120, y);
      doc.text(`Saída: ${turn.saida}`, 170, y);
      y += 10;
      
      // Process tasks for Turno 1
      if (turnKey === 'turno1') {
        const taskList: {key: keyof Turno1Tasks, text: string}[] = [
          {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
          {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
          {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
          {key: 'abrirServidores', text: "Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)"},
          {key: 'percurso76931', text: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"},
          {key: 'enviar', text: "Enviar:"},
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos aplicados no dia Anterior"},
          {key: 'enviarReportes', text: "Enviar Reportes (INPS, Visto USA, BCV, IMPC)"},
          {key: 'verificarRecepcaoSisp', text: "Verificar Recep. dos Ficheiros Enviados à SISP:"},
          {key: 'backupsDiferidos', text: "Backups Diferidos"},
          {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
          {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"},
          {key: 'enviarSegundoEtr', text: "Enviar 2º Ficheiro ETR (13h:30)"},
          {key: 'enviarFicheiroCom', text: "Enviar Ficheiro COM, dias específicos"},
          {key: 'atualizarCentralRisco', text: "Atualizar Nº Central de Risco (Todas as Sextas-Feiras)"}
        ];
        
        // Process basic tasks
        taskList.forEach(item => {
          y = checkPageSpace(y, 8);
          
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno1[item.key]));
          doc.setFontSize(10);
          
          // Handle the "Enviar:" special case
          if (item.key === 'enviar') {
            doc.text(item.text, 20, y);
            
            // Process sub-items inline for "Enviar"
            const enviarSubItems = [
              { key: 'etr', text: 'ETR' },
              { key: 'impostos', text: 'Impostos' },
              { key: 'inpsExtrato', text: 'INPS/Extrato' },
              { key: 'vistoUsa', text: 'Visto USA' },
              { key: 'ben', text: 'BEN' },
              { key: 'bcta', text: 'BCTA' }
            ];
            
            let xOffset = 35;
            enviarSubItems.forEach(subItem => {
              const itemKey = subItem.key as keyof Turno1Tasks;
              drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[itemKey]));
              doc.text(subItem.text, xOffset + 5, y);
              xOffset += doc.getTextWidth(subItem.text) + 15;
            });
            
            y += 6;
          } else if (item.key === 'verificarRecepcaoSisp') {
            // Handle Verificar Recepção SISP with ASC, CSV, ECI checkboxes
            doc.text(item.text, 20, y);
            
            let xOffset = 115;
            const sispItems = [
              { key: 'verificarAsc', text: 'ASC' },
              { key: 'verificarCsv', text: 'CSV' },
              { key: 'verificarEci', text: 'ECI' }
            ];
            
            sispItems.forEach(subItem => {
              const itemKey = subItem.key as keyof Turno1Tasks;
              drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[itemKey]));
              doc.text(subItem.text, xOffset + 5, y);
              xOffset += doc.getTextWidth(subItem.text) + 15;
            });
            
            y += 6;
          } else {
            doc.text(item.text, 20, y);
            y += 6;
          }
          
          // Add sub-items for backupsDiferidos
          if (item.key === 'backupsDiferidos') {
            const backupItems = [
              { key: 'bmjrn', text: "BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)" },
              { key: 'grjrcv', text: "GRJRCV (1 tape)" },
              { key: 'aujrn', text: "AUJRN (1tape)" },
              { key: 'mvdia1', text: "MVDIA1 (eliminar obj. após save N)" },
              { key: 'mvdia2', text: "MVDIA2 (eliminar obj. após save S)" },
              { key: 'brjrn', text: "BRJRN (1tape)" }
            ];
            
            backupItems.forEach(item => {
              y = checkPageSpace(y, 8);
              drawCheckbox(25, y - 3, ensureBoolean(tasks.turno1[item.key as keyof Turno1Tasks]));
              doc.text(item.text, 30, y);
              y += 6;
            });
          }
          
          // Add sub-items for enviarFicheiroCom
          if (item.key === 'enviarFicheiroCom') {
            y = checkPageSpace(y, 8);
            doc.text("Dias:", 25, y);
            
            let xOffset = 40;
            const comDaysItems = [
              { key: 'dia01', text: '01' },
              { key: 'dia08', text: '08' },
              { key: 'dia16', text: '16' },
              { key: 'dia23', text: '23' }
            ];
            
            comDaysItems.forEach(item => {
              drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[item.key as keyof Turno1Tasks]));
              doc.text(item.text, xOffset + 5, y);
              xOffset += 20;
            });
            y += 6;
          }
        });
        
        // Observations
        if (turn.observations) {
          y = checkPageSpace(y, 20);
          doc.setFont("helvetica", "bold");
          doc.text("Observações:", 15, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          
          // Break long text into multiple lines
          const splitText = doc.splitTextToSize(turn.observations, pageWidth - 30);
          doc.text(splitText, 15, y);
          y += splitText.length * 5 + 5;
        }
      }
      
      // Process tasks for Turno 2
      if (turnKey === 'turno2') {
        const taskList: {key: keyof Turno2Tasks, text: string}[] = [
          {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
          {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
          {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
          {key: 'verificarReportes', text: "Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)"},
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"}
        ];
        
        // Process basic tasks
        taskList.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.setFontSize(10);
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        // Ficheiros INPS
        y = checkPageSpace(y, 10);
        doc.setFont("helvetica", "bold");
        doc.text("Ficheiros INPS:", 15, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        
        const inpsItems = [
          { key: 'inpsProcessar', text: "Processar" },
          { key: 'inpsEnviarRetorno', text: "Enviar Retorno" }
        ];
        
        inpsItems.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(20, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.text(item.text, 25, y);
          y += 6;
        });
        
        // Continue with remaining tasks in order
        const remainingTasks: {key: keyof Turno2Tasks, text: string}[] = [
          {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
          {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"}
        ];
        
        remainingTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        // Enviar Ficheiro
        y = checkPageSpace(y, 10);
        doc.setFont("helvetica", "bold");
        doc.text("Enviar Ficheiro:", 15, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        
        const ficheirosItems = [
          { key: 'enviarEci', text: "ECI" },
          { key: 'enviarEdv', text: "EDV" }
        ];
        
        ficheirosItems.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(20, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.text(item.text, 25, y);
          y += 6;
        });
        
        // Final tasks
        const finalTasks: {key: keyof Turno2Tasks, text: string}[] = [
          {key: 'confirmarAtualizacaoFicheiros', text: "Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)"},
          {key: 'validarSaco', text: "Validar Saco 1935"},
          {key: 'verificarPendentes', text: "Verificar Pendentes dos Balcões"},
          {key: 'fecharBalcoes', text: "Fechar os Balcoes Centrais"}
        ];
        
        finalTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        // Observations
        if (turn.observations) {
          y = checkPageSpace(y, 20);
          doc.setFont("helvetica", "bold");
          doc.text("Observações:", 15, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          
          const splitText = doc.splitTextToSize(turn.observations, pageWidth - 30);
          doc.text(splitText, 15, y);
          y += splitText.length * 5 + 5;
        }
      }
      
      // Process tasks for Turno 3
      if (turnKey === 'turno3') {
        // Section: Antes do Fecho
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Antes do Fecho", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        const beforeCloseTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
          {key: 'tratarTapes', text: "Tratar e trocar Tapes BM, BMBCK – percurso 7622"},
          {key: 'fecharServidores', text: "Fechar Servidores Teste e Produção"},
          {key: 'fecharImpressoras', text: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI"},
          {key: 'userFecho', text: "User Fecho Executar o percurso 7624 Save SYS1OB"},
          {key: 'listaRequisicoesCheques', text: "Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911"},
          {key: 'cancelarCartoesClientes', text: "User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857"},
          {key: 'prepararEnviarAsc', text: "Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132"},
          {key: 'adicionarRegistrosBanka', text: "User Fecho Adiciona registos na Banka Remota- percurso 768975"},
          {key: 'fecharServidoresBanka', text: "User Fecho, fechar servidores Banka remota IN1/IN3/IN4"},
          {key: 'alterarInternetBanking', text: "User Fecho Alterar Internet Banking para OFFLINE – percurso 49161"},
          {key: 'prepararEnviarCsv', text: "Preparar e enviar ficheiro CSV (saldos)"}
        ];
        
        // Process before close tasks
        beforeCloseTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.setFontSize(10);
          
          // Split long text if necessary to ensure it fits width
          const maxWidth = pageWidth - 25; // 15px left margin + 10px buffer
          const textLines = doc.splitTextToSize(item.text, maxWidth);
          doc.text(textLines, 20, y);
          
          // Adjust y position based on number of lines
          y += textLines.length * 5 + 1;
        });

        // Real Time Closing Section
        y = checkPageSpace(y, 12);
        doc.setFont("helvetica", "bold");
        doc.text("Fecho Real Time", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        // Draw checkbox and include time in the same line
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.fecharRealTime));
        doc.text(`Interromper o Real-Time com a SISP: ${tasks.turno3.fecharRealTimeHora || ""}`, 20, y);
        y += 8;
        
        // Next group of tasks
        const middleTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'prepararEnviarEtr', text: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103"},
          {key: 'fazerLoggOffAml', text: "Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)"},
          {key: 'aplicarFicheiroErroEtr', text: "Aplicar Ficheiro Erro ETR"},
          {key: 'validarBalcao14', text: "Validar balção 14 7185"},
          {key: 'fecharBalcao14', text: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados"},
          {key: 'arranqueManual', text: "Arranque Manual - Verificar Data da Aplicação – Percurso 431"}
        ];
        
        middleTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.setFontSize(10);
          
          // Split long text if necessary
          const maxWidth = pageWidth - 25;
          const textLines = doc.splitTextToSize(item.text, maxWidth);
          doc.text(textLines, 20, y);
          
          // Adjust y position based on number of lines
          y += textLines.length * 5 + 1;
        });
        
        // Inicio Fecho with time
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.inicioFecho));
        doc.text(`Início do Fecho: ${tasks.turno3.inicioFechoHora || ""}`, 20, y);
        y += 8;
        
        // More tasks
        const moreTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'validarEnvioEmail', text: "Validar envio email (Notificação Inicio Fecho) a partir do ISeries"},
          {key: 'controlarTrabalhos', text: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)"},
          {key: 'saveBmbck', text: "Save BMBCK – Automático"},
          {key: 'abrirServidoresInternet', text: "Abrir Servidores Internet Banking – Percurso 161–"},
          {key: 'imprimirCheques', text: "Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)"},
          {key: 'backupBm', text: "Backup BM – Automático"},
          {key: 'validarFicheiroCcln', text: "Validar ficheiro CCLN - 76853"},
          {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)"},
          {key: 'validarSaldoConta', text: "Validar saldo da conta 18/5488102:"}
        ];
        
        moreTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.setFontSize(10);
          
          // Split long text if necessary
          const maxWidth = pageWidth - 25;
          const textLines = doc.splitTextToSize(item.text, maxWidth);
          doc.text(textLines, 20, y);
          
          // Adjust y position based on number of lines
          y += textLines.length * 5 + 1;
        });
        
        // Saldo conta value
        if (ensureBoolean(tasks.turno3.validarSaldoConta)) {
          y = checkPageSpace(y, 8);
          doc.text(`Valor: ${tasks.turno3.saldoContaValor || ""}`, 30, y);
          y += 6;
          
          // Checkboxes for saldo type
          y = checkPageSpace(y, 8);
          drawCheckbox(30, y - 3, ensureBoolean(tasks.turno3.saldoPositivo));
          doc.text("Positivo", 35, y);
          
          drawCheckbox(70, y - 3, ensureBoolean(tasks.turno3.saldoNegativo));
          doc.text("Negativo", 75, y);
          y += 8;
        }
        
        // Abrir Real Time with time
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.abrirRealTime));
        doc.text(`Abrir o Real-Time: ${tasks.turno3.abrirRealTimeHora || ""}`, 20, y);
        y += 8;
        
        // Final tasks
        const finalTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'verificarTransacoes', text: "Verificar a entrada de transações 3100 4681"},
          {key: 'aplicarFicheiroVisa', text: "Aplicar ficheiro VISA DAF - com o user FECHO 4131"},
          {key: 'cativarCartoes', text: "Cativar cartões de crédito em incumprimento - com o user FECHO – 7675"},
          {key: 'abrirBcaDireto', text: "Abrir o BCADireto percurso 49162 – Validar transações"},
          {key: 'abrirServidoresBanka', text: "User Fecho, Abril servidores Banka remota IN1/IN3/IN4"},
          {key: 'atualizarTelefonesOffline', text: "Atualiza Telefones tratados no OFFLINE- percurso 768976"},
          {key: 'verificarReplicacao', text: "Verificar Replicação"},
          {key: 'enviarFicheiroCsv', text: "Enviar ficheiro CSV (Comunicação Saldo Véspera)"},
          {key: 'transferirFicheirosLiquidity', text: "Transferência ficheiros SSM Liquidity Exercices (Confirmação)"},
          {key: 'percurso76921', text: "Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)"},
          {key: 'percurso76922', text: "Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)"},
          {key: 'percurso76923', text: "Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"},
          {key: 'abrirServidoresTesteProducao', text: "Abrir Servidores Teste e Produção"},
          {key: 'impressaoCheques', text: "Impressão Cheques e respectivos Diários (verificação dos mesmos)"},
          {key: 'arquivarCheques', text: "Arquivar Cheques e respectivos Diários"}
        ];
        
        finalTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.setFontSize(10);
          
          // Split long text if necessary
          const maxWidth = pageWidth - 25;
          const textLines = doc.splitTextToSize(item.text, maxWidth);
          doc.text(textLines, 20, y);
          
          // Adjust y position based on number of lines
          y += textLines.length * 5 + 1;
        });
        
        // Término Fecho with time
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.terminoFecho));
        doc.text(`Término do Fecho: ${tasks.turno3.terminoFechoHora || ""}`, 20, y);
        y += 8;
        
        // Add the missing transferirFicheirosDsi task
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.transferirFicheirosDsi));
        doc.text("Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023", 20, y);
        y += 8;
        
        // Observations
        if (turn.observations) {
          y = checkPageSpace(y, 20);
          doc.setFont("helvetica", "bold");
          doc.text("Observações:", 15, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          
          const splitText = doc.splitTextToSize(turn.observations, pageWidth - 30);
          doc.text(splitText, 15, y);
          y += splitText.length * 5 + 5;
        }
      }
    });
    
    // Add Processos table
    if (tableRows.length > 0) {
      y = checkPageSpace(y, 30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Tabela de Processamentos", 15, y);
      y += 10;
      
      // Create table header
      const headers = ["Hora", "Tarefa", "Nome AS400", "Nº Operação", "Executado por"];
      const data = tableRows.map(row => [
        row.hora,
        row.tarefa,
        row.nomeAs,
        row.operacao,
        row.executado
      ]);
      
      // Add the table to the PDF
      autoTable(doc, {
        startY: y,
        head: [headers],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { top: 15, right: 15, bottom: 15, left: 15 }
      });
    }
    
    doc.save(`taskboard-${formattedDate}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ficha de Procedimentos</h1>
        <div className="flex items-center space-x-2">
          <Input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Tabs defaultValue="turnos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="turnos">
          <Tabs defaultValue="turno1" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="turno1">Turno 1</TabsTrigger>
              <TabsTrigger value="turno2">Turno 2</TabsTrigger>
              <TabsTrigger value="turno3">Turno 3</TabsTrigger>
            </TabsList>
            
            <TabsContent value="turno1">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 1</CardTitle>
                  <CardDescription>Tarefas do turno da manhã</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <Label htmlFor="operator1">Operador</Label>
                      <Select 
                        value={turnData.turno1.operator}
                        onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                      >
                        <SelectTrigger id="operator1">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
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
                  
                  <Turno1TasksComponent
                    tasks={tasks.turno1}
                    onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                    observations={turnData.turno1.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="turno2">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 2</CardTitle>
                  <CardDescription>Tarefas do turno da tarde</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <Label htmlFor="operator2">Operador</Label>
                      <Select 
                        value={turnData.turno2.operator}
                        onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                      >
                        <SelectTrigger id="operator2">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
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
                  
                  <Turno2TasksComponent
                    tasks={tasks.turno2}
                    onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                    observations={turnData.turno2.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="turno3">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 3</CardTitle>
                  <CardDescription>Tarefas do turno da noite</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <Label htmlFor="operator3">Operador</Label>
                      <Select 
                        value={turnData.turno3.operator}
                        onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                      >
                        <SelectTrigger id="operator3">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
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
                  
                  <Turno3TasksComponent
                    tasks={tasks.turno3}
                    onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)}
                    observations={turnData.turno3.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="processos">
          <Card>
            <CardHeader>
              <CardTitle>Processamentos</CardTitle>
              <CardDescription>Registo de processos executados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <UITableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Nome AS400</TableHead>
                      <TableHead>Nº Operação</TableHead>
                      <TableHead>Executado por</TableHead>
                    </UITableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
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
                            value={row.tarefa}
                            onChange={(e) => handleInputChange(row.id, 'tarefa', e.target.value)}
                            placeholder="Descrição da tarefa"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={row.nomeAs}
                            onChange={(e) => handleInputChange(row.id, 'nomeAs', e.target.value)}
                            placeholder="Nome AS400"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={row.operacao}
                            onChange={(e) => handleInputChange(row.id, 'operacao', e.target.value)}
                            placeholder="Nº Operação"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={row.executado}
                            onValueChange={(value) => handleInputChange(row.id, 'executado', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorsList.map((operator) => (
                                <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </UITableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-start space-x-2 mt-4">
                <Button variant="outline" size="sm" onClick={addTableRow}>
                  <PlusCircle className="mr-1 h-4 w-4" />
                  Adicionar linha
                </Button>
                <Button variant="outline" size="sm" onClick={removeTableRow} disabled={tableRows.length <= 1}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remover última linha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-between">
        <div className="space-x-2">
          <Button variant="destructive" onClick={resetForm}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reiniciar
          </Button>
          <Button variant="secondary" onClick={generatePDF}>
            <FileDown className="mr-1 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-1 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default Taskboard;
