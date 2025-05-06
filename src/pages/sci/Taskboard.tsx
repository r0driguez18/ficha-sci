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
      
      // Processar tarefas para o Turno 1
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
          {key: 'verificarRecepcaoSisp', text: "Verificar Recep. dos Ficheiros Enviados à SISP: ASC CSV ECI"},
          {key: 'backupsDiferidos', text: "Backups Diferidos"},
          {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
          {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"},
          {key: 'enviarSegundoEtr', text: "Enviar 2º Ficheiro ETR (13h:30)"},
          {key: 'enviarFicheiroCom', text: "Enviar Ficheiro COM, dias específicos"},
          {key: 'atualizarCentralRisco', text: "Atualizar Nº Central de Risco (Todas as Sextas-Feiras)"}
        ];
        
        // Processar tarefas básicas
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
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
          
          // Adicionar sub-itens para backupsDiferidos
          if (item.key === 'backupsDiferidos' && ensureBoolean(tasks.turno1.backupsDiferidos)) {
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
          
          // Adicionar sub-itens para enviarFicheiroCom
          if (item.key === 'enviarFicheiroCom' && ensureBoolean(tasks.turno1.enviarFicheiroCom)) {
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
        
        // Observações
        if (turn.observations) {
          y = checkPageSpace(y, 20);
          doc.setFont("helvetica", "bold");
          doc.text("Observações:", 15, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          
          // Quebrar texto longo em várias linhas
          const splitText = doc.splitTextToSize(turn.observations, pageWidth - 30);
          doc.text(splitText, 15, y);
          y += splitText.length * 5 + 5;
        }
      }
      
      // Processar tarefas para o Turno 2
      if (turnKey === 'turno2') {
        const taskList: {key: keyof Turno2Tasks, text: string}[] = [
          {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
          {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
          {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
          {key: 'verificarReportes', text: "Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)"},
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
          {key: 'confirmarAtualizacaoSisp', text: "Confirmar atualização SISP"},
          {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
          {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"},
          {key: 'confirmarAtualizacaoFicheiros', text: "Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)"},
          {key: 'validarSaco', text: "Validar Saco 1935"},
          {key: 'verificarPendentes', text: "Verificar Pendentes dos Balcões"},
          {key: 'fecharBalcoes', text: "Fechar os Balcoes Centrais"}
        ];
        
        // Processar tarefas básicas
        taskList.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.setFontSize(10);
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        // Ficheiros INPS
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Ficheiros INPS:", 20, y);
        
        let xOffset = 55;
        drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno2.inpsProcessar));
        doc.text("Processar", xOffset + 5, y);
        
        xOffset += 35;
        drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno2.inpsEnviarRetorno));
        doc.text("Enviar Retorno", xOffset + 5, y);
        
        y += 8;
        
        // Enviar Ficheiro
        y = checkPageSpace(y, 8);
        doc.setFontSize(10);
        doc.text("Enviar Ficheiro:", 20, y);
        
        xOffset = 55;
        drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno2.enviarEci));
        doc.text("ECI", xOffset + 5, y);
        
        xOffset += 20;
        drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno2.enviarEdv));
        doc.text("EDV", xOffset + 5, y);
        
        y += 8;
        
        // Observações
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
      
      // Processar tarefas para o Turno 3
      if (turnKey === 'turno3') {
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Antes do Fecho", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        const beforeCloseTasks: {key: keyof Turno3Tasks, text: string, hasTime?: boolean}[] = [
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
          {key: 'prepararEnviarCsv', text: "Preparar e enviar ficheiro CSV (saldos)"},
          {key: 'fecharRealTime', text: "Interromper o Real-Time com a SISP", hasTime: true}
        ];
        
        beforeCloseTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          
          let taskText = task.text;
          if (task.hasTime && tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]) {
            taskText += ` ${tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]}`;
          }
          
          doc.text(taskText, 20, y);
          y += 6;
        });
        
        // Continuar com as tarefas antes do fecho
        const moreTasks: {key: keyof Turno3Tasks, text: string, hasTime?: boolean}[] = [
          {key: 'prepararEnviarEtr', text: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103"},
          {key: 'fazerLoggOffAml', text: "Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)"},
          {key: 'aplicarFicheiroErroEtr', text: "Aplicar Ficheiro Erro ETR"},
          {key: 'validarBalcao14', text: "Validar balção 14 7185"},
          {key: 'fecharBalcao14', text: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados"},
          {key: 'arranqueManual', text: "Arranque Manual - Verificar Data da Aplicação – Percurso 431"},
          {key: 'inicioFecho', text: "Início do Fecho", hasTime: true}
        ];
        
        moreTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          
          let taskText = task.text;
          if (task.hasTime && tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]) {
            taskText += ` ${tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]}`;
          }
          
          doc.text(taskText, 20, y);
          y += 6;
        });
        
        // Mais tarefas antes do fecho
        const finalBeforeTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'validarEnvioEmail', text: "Validar envio email (Notificação Inicio Fecho) a partir do ISeries"},
          {key: 'controlarTrabalhos', text: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)"},
          {key: 'saveBmbck', text: "Save BMBCK – Automático"},
          {key: 'abrirServidoresInternet', text: "Abrir Servidores Internet Banking – Percurso 161–"},
          {key: 'imprimirCheques', text: "Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)"},
          {key: 'backupBm', text: "Backup BM – Automático"}
        ];
        
        finalBeforeTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          doc.text(task.text, 20, y);
          y += 6;
        });
        
        // Adicionar seção "Depois do Fecho"
        y = checkPageSpace(y, 8);
        doc.setFont("helvetica", "bold");
        doc.text("Depois do Fecho", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        const afterCloseTasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'validarFicheiroCcln', text: "Validar ficheiro CCLN - 76853"},
          {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)"},
          {key: 'validarSaldoConta', text: "Validar saldo da conta 18/5488102:"}
        ];
        
        afterCloseTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          doc.text(task.text, 20, y);
          y += 6;
          
          // Adicionar valor do saldo e opções para validarSaldoConta
          if (task.key === 'validarSaldoConta') {
            if (tasks.turno3.saldoContaValor) {
              doc.text(`Valor: ${tasks.turno3.saldoContaValor}`, 30, y);
              y += 6;
            }
            
            let xOffset = 30;
            drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno3.saldoNegativo));
            doc.text("Negativo", xOffset + 5, y);
            
            xOffset += 40;
            drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno3.saldoPositivo));
            doc.text("Positivo", xOffset + 5, y);
            y += 6;
          }
        });
        
        // Continuar com tarefas depois do fecho
        const moreAfterTasks: {key: keyof Turno3Tasks, text: string, hasTime?: boolean}[] = [
          {key: 'abrirRealTime', text: "Abrir o Real-Time", hasTime: true},
          {key: 'verificarTransacoes', text: "Verificar a entrada de transações 3100 4681"},
          {key: 'aplicarFicheiroVisa', text: "Aplicar ficheiro VISA DAF - com o user FECHO 4131"},
          {key: 'cativarCartoes', text: "Cativar cartões de crédito em incumprimento - com o user FECHO – 7675"},
          {key: 'abrirBcaDireto', text: "Abrir o BCADireto percurso 49162 – Validar transações"},
          {key: 'abrirServidoresBanka', text: "User Fecho, Abril servidores Banka remota IN1/IN3/IN4"},
          {key: 'atualizarTelefonesOffline', text: "Atualiza Telefones tratados no OFFLINE- percurso 768976"},
          {key: 'verificarReplicacao', text: "Verificar Replicação"},
          {key: 'enviarFicheiroCsv', text: "Enviar ficheiro CSV (Comunicação Saldo Véspera)"},
          {key: 'transferirFicheirosLiquidity', text: "Transferência ficheiros SSM Liquidity Exercices (Confirmação)"}
        ];
        
        moreAfterTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          
          let taskText = task.text;
          if (task.hasTime && tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]) {
            taskText += ` ${tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]}`;
          }
          
          doc.text(taskText, 20, y);
          y += 6;
        });
        
        // Últimas tarefas depois do fecho
        const finalAfterTasks: {key: keyof Turno3Tasks, text: string, hasTime?: boolean}[] = [
          {key: 'percurso76921', text: "Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)"},
          {key: 'percurso76922', text: "Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)"},
          {key: 'percurso76923', text: "Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"},
          {key: 'abrirServidoresTesteProducao', text: "Abrir Servidores Teste e Produção"},
          {key: 'impressaoCheques', text: "Impressão Cheques dia seguinte"},
          {key: 'arquivarCheques', text: "Arquivar Cheques e Extratos Impressos"},
          {key: 'terminoFecho', text: "Termino do Fecho", hasTime: true},
          {key: 'transferirFicheirosDsi', text: "Transferir Ficheiros DSI"}
        ];
        
        finalAfterTasks.forEach(task => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[task.key]));
          doc.setFontSize(10);
          
          let taskText = task.text;
          if (task.hasTime && tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]) {
            taskText += ` ${tasks.turno3[`${task.key}Hora` as keyof Turno3Tasks]}`;
          }
          
          doc.text(taskText, 20, y);
          y += 6;
        });
        
        // Observações
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
    
    doc.save(`Ficha de Procedimentos - ${formattedDate}.pdf`);
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="operator1">Operador</Label>
                      <Select 
                        value={turnData.turno1.operator}
                        onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="entrada1">Hora Entrada</Label>
                      <Input 
                        id="entrada1" 
                        type="time" 
                        value={turnData.turno1.entrada}
                        onChange={(e) => handleTurnDataChange('turno1', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida1">Hora Saída</Label>
                      <Input 
                        id="saida1" 
                        type="time"
                        value={turnData.turno1.saida}
                        onChange={(e) => handleTurnDataChange('turno1', 'saida', e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="observations1">Observações</Label>
                    <Textarea 
                      id="observations1" 
                      value={turnData.turno1.observations}
                      onChange={(e) => handleTurnDataChange('turno1', 'observations', e.target.value)}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="mb-4 font-medium">Tarefas</h3>
                    <div className="space-y-4">
                      <Turno1TasksComponent 
                        tasks={tasks.turno1} 
                        onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                        observations={turnData.turno1.observations}
                        onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="turno2" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="operator2">Operador</Label>
                      <Select 
                        value={turnData.turno2.operator}
                        onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="entrada2">Hora Entrada</Label>
                      <Input 
                        id="entrada2" 
                        type="time" 
                        value={turnData.turno2.entrada}
                        onChange={(e) => handleTurnDataChange('turno2', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida2">Hora Saída</Label>
                      <Input 
                        id="saida2" 
                        type="time" 
                        value={turnData.turno2.saida}
                        onChange={(e) => handleTurnDataChange('turno2', 'saida', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="observations2">Observações</Label>
                    <Textarea 
                      id="observations2" 
                      value={turnData.turno2.observations}
                      onChange={(e) => handleTurnDataChange('turno2', 'observations', e.target.value)}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="mb-4 font-medium">Tarefas</h3>
                    <div className="space-y-4">
                      <Turno2TasksComponent 
                        tasks={tasks.turno2} 
                        onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                        observations={turnData.turno2.observations}
                        onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="turno3" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Turno 3</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="operator3">Operador</Label>
                      <Select 
                        value={turnData.turno3.operator}
                        onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorsList.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="entrada3">Hora Entrada</Label>
                      <Input 
                        id="entrada3" 
                        type="time" 
                        value={turnData.turno3.entrada}
                        onChange={(e) => handleTurnDataChange('turno3', 'entrada', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="saida3">Hora Saída</Label>
                      <Input 
                        id="saida3" 
                        type="time" 
                        value={turnData.turno3.saida}
                        onChange={(e) => handleTurnDataChange('turno3', 'saida', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="observations3">Observações</Label>
                    <Textarea 
                      id="observations3" 
                      value={turnData.turno3.observations}
                      onChange={(e) => handleTurnDataChange('turno3', 'observations', e.target.value)}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="mb-4 font-medium">Tarefas</h3>
                    <div className="space-y-4">
                      <Turno3TasksComponent 
                        tasks={tasks.turno3} 
                        onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)}
                        observations={turnData.turno3.observations}
                        onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                      />
                    </div>
                  </div>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <UITableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Nome AS400</TableHead>
                  <TableHead>Nº Operação</TableHead>
                  <TableHead>Executado Por</TableHead>
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
                        maxLength={9}
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
                          {operatorsList.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </UITableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addTableRow}
              className="flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1" /> Adicionar Linha
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={removeTableRow}
              disabled={tableRows.length <= 1}
              className="flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remover Linha
            </Button>
          </div>
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
            onClick={generatePDF}
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
