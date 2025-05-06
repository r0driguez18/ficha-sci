
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
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "sbarbosa", label: "Silvino Barbosa" },
  { value: "lspencer", label: "Louis Spencer" }
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
    
    // Helper function to draw a rectangle around observations
    const drawObservationsBox = (startY: number, text: string): number => {
      const padding = 5;
      const lineHeight = 5;
      
      doc.setFont("helvetica", "bold");
      doc.text("Observações:", 15, startY);
      startY += 6;
      
      // Calculate the height needed for the observations text
      const splitText = doc.splitTextToSize(text || "", pageWidth - 30 - (padding * 2));
      const textHeight = splitText.length * lineHeight;
      
      // Draw rectangle with padding
      const boxHeight = Math.max(20, textHeight + padding * 2); // Minimum 20px height
      doc.setDrawColor(200, 200, 200); // Light gray border
      doc.setLineWidth(0.5);
      doc.rect(15 - padding, startY - padding, pageWidth - 30, boxHeight);
      
      // If there is text, add it inside the rectangle
      if (text) {
        doc.setFont("helvetica", "normal");
        doc.text(splitText, 15, startY + padding);
        return startY + textHeight + (padding * 2);
      }
      
      return startY + boxHeight;
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
      
      // Add extra spacing between turns (20 pixels)
      if (index > 0) {
        y = checkPageSpace(y, 20);
        y += 15; // Add extra spacing between turns
      }
      
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
        // Process basic tasks
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
        
        taskList.forEach(item => {
          y = checkPageSpace(y, 8);
          
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno1[item.key]));
          doc.setFontSize(10);
          
          // Handle the "Enviar:" special case
          if (item.key === 'enviar') {
            doc.text(item.text, 20, y);
            y += 6;  // Add extra line space after "Enviar:" label
            
            // Process sub-items in rows rather than inline for "Enviar"
            const enviarSubItems = [
              { key: 'etr', text: 'ETR' },
              { key: 'impostos', text: 'Impostos' },
              { key: 'inpsExtrato', text: 'INPS/Extrato' },
              { key: 'vistoUsa', text: 'Visto USA' },
              { key: 'ben', text: 'BEN' },
              { key: 'bcta', text: 'BCTA' }
            ];
            
            // Display in two columns, 3 items per row
            for (let i = 0; i < enviarSubItems.length; i += 3) {
              y = checkPageSpace(y, 8);
              
              // First column items (up to 3 per row)
              for (let j = 0; j < 3; j++) {
                if (i + j < enviarSubItems.length) {
                  const subItem = enviarSubItems[i + j];
                  const itemKey = subItem.key as keyof Turno1Tasks;
                  const xOffset = 25 + (j * 40); // Space items horizontally
                  
                  drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[itemKey]));
                  doc.text(subItem.text, xOffset + 5, y);
                }
              }
              
              y += 6; // Move to next row after displaying up to 3 items
            }
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
              xOffset += 20;
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
        
        // Observations with rectangle
        y = checkPageSpace(y, 30);
        y = drawObservationsBox(y, turn.observations);
      }
      
      // Process tasks for Turno 2
      if (turnKey === 'turno2') {
        const taskList: {key: keyof Turno2Tasks, text: string}[] = [
          {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
          {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
          {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
          {key: 'verificarReportes', text: "Verificar envio de reportes (INPS, VISTO USA, BCV, IMPC)"},
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
          {key: 'confirmarAtualizacaoSisp', text: "Confirmar Atualização SISP"}
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
          {key: 'confirmarAtualizacaoFicheiros', text: "Confirmar Actualização dos Ficheiros"},
          {key: 'validarSaco', text: "Validar Movimento do Dia/Chave do SACO"},
          {key: 'verificarPendentes', text: "Verificar Movimentos Pendentes da SISP/Compensação"},
          {key: 'fecharBalcoes', text: "Fechar Balcões 14/Liquidação Ordenados"}
        ];
        
        finalTasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key]));
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        // Observations with rectangle
        y = checkPageSpace(y, 30);
        y = drawObservationsBox(y, turn.observations);
      }
      
      // Process tasks for Turno 3
      if (turnKey === 'turno3') {
        const taskList: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
          {key: 'tratarTapes', text: "Tratar Tapes (BMJRN, BRJRN, GRJRCV, AUJRN)"},
          {key: 'fecharServidores', text: "Fechar Servidores (SWIFT, OPDIF, TRMSG, CDGOV)"},
          {key: 'fecharImpressoras', text: "Fechar Impressoras: SPOOL DDS"},
          {key: 'userFecho', text: "USER para fecho"},
          {key: 'listaRequisicoesCheques', text: "Lista de Requisições de Cheques (Dia)"},
          {key: 'cancelarCartoesClientes', text: "Cancelar Cartões de Clientes (Dia)"}
        ];
        
        taskList.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        y = checkPageSpace(y, 10);
        doc.setFont("helvetica", "bold");
        doc.text("OUTROS PROCEDIMENTOS:", 15, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        
        const bank1Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'prepararEnviarAsc', text: "Preparar e enviar ficheiro ASC"},
          {key: 'adicionarRegistrosBanka', text: "Adicionar Registros Banka (se o Automático não funcionar)"},
          {key: 'fecharServidoresBanka', text: "Fechar servidores Banka"},
          {key: 'alterarInternetBanking', text: "Alterar Internet Banking para Modo Manutenção"},
          {key: 'prepararEnviarCsv', text: "Preparar e enviar ficheiro CSV"},
          {key: 'fecharRealTime', text: "Fechar REAL-TIME"}
        ];
        
        bank1Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          
          if (item.key === 'fecharRealTime') {
            doc.text(`${item.text}: ${tasks.turno3.fecharRealTimeHora}`, 20, y);
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
        });
        
        const bank2Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'prepararEnviarEtr', text: "Preparar e enviar ficheiro ETR"},
          {key: 'fazerLoggOffAml', text: "Fazer LOGIN/LOGGOFF no AML"},
          {key: 'aplicarFicheiroErroEtr', text: "Aplicar ficheiro de Erro do ETR"},
          {key: 'validarBalcao14', text: "Validar Balcão 14"},
          {key: 'fecharBalcao14', text: "Fechar Balcão 14"},
          {key: 'arranqueManual', text: "Arranque Manual (VERIFY,MANUAL)"},
          {key: 'inicioFecho', text: "Início do Fecho"}
        ];
        
        bank2Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          
          if (item.key === 'inicioFecho') {
            doc.text(`${item.text}: ${tasks.turno3.inicioFechoHora}`, 20, y);
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
        });
        
        const bank3Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'validarEnvioEmail', text: "Validar envio do Email"},
          {key: 'controlarTrabalhos', text: "Controlar Trabalhos Activos/Diferidos"},
          {key: 'saveBmbck', text: "SAVE BMBCK D/Verificar Gravação das Fitas (WRKJOB PESCOBAR)"},
          {key: 'abrirServidoresInternet', text: "Abrir Servidores no Internet Banking"},
          {key: 'imprimirCheques', text: "Imprimir Cheques/Livro de Operações"},
          {key: 'backupBm', text: "BACKUP BM (SAVE BMBCK S/Verificar Tapes) (WRKJOB PESCOBAR)"},
          {key: 'validarFicheiroCcln', text: "Validar Ficheiro CCLN (Verificar)"}
        ];
        
        bank3Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          doc.text(item.text, 20, y);
          y += 6;
        });
        
        const bank4Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros Compensação"},
          {key: 'validarSaldoConta', text: "Validar saldo da conta 18/5488102"}
        ];
        
        bank4Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          
          if (item.key === 'validarSaldoConta') {
            // Display account value
            doc.text(`${item.text}: ${tasks.turno3.saldoContaValor}`, 20, y);
            
            // Add checkboxes for negative/positive balance
            const xOffsetNeg = 150;
            const xOffsetPos = 180;
            
            drawCheckbox(xOffsetNeg, y - 3, ensureBoolean(tasks.turno3.saldoNegativo));
            doc.text("Negativo", xOffsetNeg + 5, y);
            
            drawCheckbox(xOffsetPos, y - 3, ensureBoolean(tasks.turno3.saldoPositivo));
            doc.text("Positivo", xOffsetPos + 5, y);
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
        });
        
        const bank5Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'abrirRealTime', text: "Abrir REAL-TIME"},
          {key: 'verificarTransacoes', text: "Verificar Transações Online"},
          {key: 'aplicarFicheiroVisa', text: "Aplicar Ficheiro VISA+"},
          {key: 'cativarCartoes', text: "Cativar Cartões"},
          {key: 'abrirBcaDireto', text: "Abrir BCA Direto"},
          {key: 'abrirServidoresBanka', text: "Abrir Servidores Banka"},
          {key: 'atualizarTelefonesOffline', text: "Atualizar Telefones (OFFLINE)"}
        ];
        
        bank5Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          
          if (item.key === 'abrirRealTime') {
            doc.text(`${item.text}: ${tasks.turno3.abrirRealTimeHora}`, 20, y);
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
        });
        
        const bank6Tasks: {key: keyof Turno3Tasks, text: string}[] = [
          {key: 'verificarReplicacao', text: "Verificar Replicação MIA"},
          {key: 'enviarFicheiroCsv', text: "Enviar ficheiro CSV"},
          {key: 'transferirFicheirosLiquidity', text: "Transferir ficheiros Liquidity (SWIFT)/BCV"},
          {key: 'percurso76921', text: "Percurso 76921 - Atualiza data de cobrança/confirmação e nº de documento abono família"},
          {key: 'percurso76922', text: "Percurso 76922 - Atualiza pendentes nas prestações de crédito"},
          {key: 'percurso76923', text: "Percurso 76923 - Atualiza condições anormais nas prestações de crédito"},
          {key: 'abrirServidoresTesteProducao', text: "Abrir Servidores Teste/Produção (SWIFT, OPDIF, TRMSG, AML, CDGOV)"},
          {key: 'impressaoCheques', text: "Impressão Cheques BCV/Requisição Cheques"},
          {key: 'arquivarCheques', text: "Arquivar cheques"},
          {key: 'terminoFecho', text: "Término do fecho"},
          {key: 'transferirFicheirosDsi', text: "Transferir ficheiros para DSI (MFSISP.TRANS.CRC)"}
        ];
        
        bank6Tasks.forEach(item => {
          y = checkPageSpace(y, 8);
          drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key]));
          
          if (item.key === 'terminoFecho') {
            doc.text(`${item.text}: ${tasks.turno3.terminoFechoHora}`, 20, y);
          } else {
            doc.text(item.text, 20, y);
          }
          
          y += 6;
        });
        
        // Observations with rectangle
        y = checkPageSpace(y, 30);
        y = drawObservationsBox(y, turn.observations);
      }
    });
    
    const fileName = `Centro_Informatica_${formattedDate}.pdf`;
    doc.save(fileName);
    toast.success(`Documento PDF gerado: ${fileName}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Centro Informática - Ficha de Procedimentos</CardTitle>
        <CardDescription>Registo de Procedimentos Diários</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="date">Data</Label>
          <Input 
            id="date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-[250px]"
          />
        </div>
        
        <Tabs defaultValue="turno1" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="turno1">Turno 1</TabsTrigger>
            <TabsTrigger value="turno2">Turno 2</TabsTrigger>
            <TabsTrigger value="turno3">Turno 3</TabsTrigger>
          </TabsList>
          
          <TabsContent value="turno1">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="turno1-operator">Operador</Label>
                <Select 
                  value={turnData.turno1.operator} 
                  onValueChange={(value) => handleTurnDataChange('turno1', 'operator', value)}
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
              </div>
              <div>
                <Label htmlFor="turno1-entrada">Hora de Entrada</Label>
                <Input 
                  id="turno1-entrada"
                  type="time"
                  value={turnData.turno1.entrada}
                  onChange={(e) => handleTurnDataChange('turno1', 'entrada', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="turno1-saida">Hora de Saída</Label>
                <Input 
                  id="turno1-saida"
                  type="time"
                  value={turnData.turno1.saida}
                  onChange={(e) => handleTurnDataChange('turno1', 'saida', e.target.value)}
                />
              </div>
            </div>
            
            <Turno1TasksComponent tasks={tasks.turno1} onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)} />
            
            <div className="mt-6">
              <Label htmlFor="turno1-observations">Observações</Label>
              <Textarea 
                id="turno1-observations"
                value={turnData.turno1.observations}
                onChange={(e) => handleTurnDataChange('turno1', 'observations', e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="turno2">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="turno2-operator">Operador</Label>
                <Select 
                  value={turnData.turno2.operator} 
                  onValueChange={(value) => handleTurnDataChange('turno2', 'operator', value)}
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
              </div>
              <div>
                <Label htmlFor="turno2-entrada">Hora de Entrada</Label>
                <Input 
                  id="turno2-entrada"
                  type="time"
                  value={turnData.turno2.entrada}
                  onChange={(e) => handleTurnDataChange('turno2', 'entrada', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="turno2-saida">Hora de Saída</Label>
                <Input 
                  id="turno2-saida"
                  type="time"
                  value={turnData.turno2.saida}
                  onChange={(e) => handleTurnDataChange('turno2', 'saida', e.target.value)}
                />
              </div>
            </div>
            
            <Turno2TasksComponent tasks={tasks.turno2} onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)} />
            
            <div className="mt-6">
              <Label htmlFor="turno2-observations">Observações</Label>
              <Textarea 
                id="turno2-observations"
                value={turnData.turno2.observations}
                onChange={(e) => handleTurnDataChange('turno2', 'observations', e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="turno3">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="turno3-operator">Operador</Label>
                <Select 
                  value={turnData.turno3.operator} 
                  onValueChange={(value) => handleTurnDataChange('turno3', 'operator', value)}
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
              </div>
              <div>
                <Label htmlFor="turno3-entrada">Hora de Entrada</Label>
                <Input 
                  id="turno3-entrada"
                  type="time"
                  value={turnData.turno3.entrada}
                  onChange={(e) => handleTurnDataChange('turno3', 'entrada', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="turno3-saida">Hora de Saída</Label>
                <Input 
                  id="turno3-saida"
                  type="time"
                  value={turnData.turno3.saida}
                  onChange={(e) => handleTurnDataChange('turno3', 'saida', e.target.value)}
                />
              </div>
            </div>
            
            <Turno3TasksComponent tasks={tasks.turno3} onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)} />
            
            <div className="mt-6">
              <Label htmlFor="turno3-observations">Observações</Label>
              <Textarea 
                id="turno3-observations"
                value={turnData.turno3.observations}
                onChange={(e) => handleTurnDataChange('turno3', 'observations', e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Registo de Processamentos</h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <UITableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tarefa/Nome</TableHead>
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
                        placeholder="Tarefa"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="text" 
                        value={row.nomeAs} 
                        onChange={(e) => handleInputChange(row.id, 'nomeAs', e.target.value)}
                        placeholder="Nome AS400"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="text" 
                        value={row.operacao} 
                        onChange={(e) => handleInputChange(row.id, 'operacao', e.target.value)}
                        placeholder="Nº Operação"
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
          
          <div className="mt-4 space-x-2">
            <Button onClick={addTableRow} variant="outline" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Linha
            </Button>
            <Button onClick={removeTableRow} variant="outline" className="flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Última Linha
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={resetForm}
          variant="outline"
          className="flex items-center"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpar
        </Button>
        <div className="space-x-2">
          <Button
            onClick={generatePDF}
            variant="outline"
            className="flex items-center"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleSave}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Taskboard;
