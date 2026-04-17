
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createCobrancaRetorno } from '@/services/cobrancasRetornoService';
import { saveExportedTaskboard } from '@/services/exportedTaskboardService';
import { useAuth } from '@/components/auth/AuthProvider';
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { sendFechoInicioNotification, sendFechoTerminoNotification } from '@/services/telegramService';
import type { TurnKey, TasksType, TurnDataType, Turno1Tasks, Turno2Tasks, Turno3Tasks } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';

const operatorsList = [
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "ebrito", label: "Elvis Brito" },
  { value: "lspencer", label: "Louis Spencer" }
];

const TaskboardFinalMesUtil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<TurnKey>('turno1');
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }
  ]);

  // Assinatura digital
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
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
      percurso76857: false,
      percurso76857_7h30: false,
      percurso76857_10h: false,
      percurso76857_12h: false,
      validacaoDigitalizacaoFichaDiaria: false,
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
      envioFicheirosVisa12h30: false,
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
      restoreBmBcaCv2: false,
      duptapBmSemBcaCv2: false,
      diferidosBmmes: false,
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
      percurso76857: false,
      percurso76857_14h: false,
      percurso76857_16h: false,
      percurso76857_19h: false,
      inpsProcessar: false,
      inpsEnviarRetorno: false,
      processarTef: false,
      processarTelecomp: false,
      rececaoFicheirosVisaVss: false,
      enviarEciEdv: false,
      confirmarAtualizacaoFicheiros: false,
      envioFicheirosVisaPafCaf: false,
      validarSaco: false,
      verificarPendentes: false,
      fecharBalcoes: false,
      verificarSistemas2: false
    },
    turno3: {
      datacenter: false,
      sistemas: false,
      verificarDebitos: false,
      tratarTapes: false,
      fecharServidores: false,
      fecharImpressoras: false,
      requisicoesCheques: false,
      gerarFicheiroAsc: false,
      fecharBalcao22: false,
      userFecho7624: false,
      userFechoBankaRemota: false,
      userFechoServidoresBanka: false,
      userFechoInternetBanking: false,
      fecharPfs: false,
      prepararCsv: false,
      interromperRealTime: false,
      interromperRealTimeHora: '',
      percurso768989: false,
      prepararFicheiroEtr: false,
      loggOffUtilizadores: false,
      aplicarFicheiroErro: false,
      validarBalcao14: false,
      bloquearNearsoft: false,
      fecharBalcao14: false,
      percurso43: false,
      inicioFecho: false,
      inicioFechoHora: '',
      enviarSmsArranque: false,
      validarEnvioEmail: false,
      controlarTrabalhos: false,
      paragemAberturaServidores: false,
      ativarNearsoft: false,
      saveBmbck: false,
      imprimirCheques: false,
      backupBm: false,
      aplicarFicheirosCompensacao: false,
      tratarPendentesCartoes: false,
      consultarSaldoConta: false,
      saldoNegativo: false,
      saldoPositivo: false,
      abrirRealTime: false,
      abrirRealTimeHora: '',
      verificarEntradaTransacoes: false,
      abrirBcaDireto: false,
      userFechoAbrirServidores: false,
      abrirServidoresPfs: false,
      atualizaTelefones: false,
      efetuarTesteCarregamento: false,
      verificarReplicacao: false,
      enviarFicheiroCsv: false,
      terminoFecho: false,
      terminoFechoHora: '',
      enviarSmsFim: false,
      percurso76921: false,
      percurso76922: false,
      percurso76923: false,
      impressaoCheques: false,
      arquivarCheques: false
    }
  });

  // Load data from localStorage if available
  useEffect(() => {
    const savedDate = localStorage.getItem('taskboard-final-mes-util-date');
    const savedTurnData = localStorage.getItem('taskboard-final-mes-util-turnData');
    const savedTasks = localStorage.getItem('taskboard-final-mes-util-tasks');
    const savedTableRows = localStorage.getItem('taskboard-final-mes-util-tableRows');
    const savedActiveTab = localStorage.getItem('taskboard-final-mes-util-activeTab');

    if (savedDate) setDate(savedDate);
    if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
    if (savedActiveTab) setActiveTab(savedActiveTab as TurnKey);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskboard-final-mes-util-date', date);
    localStorage.setItem('taskboard-final-mes-util-turnData', JSON.stringify(turnData));
    localStorage.setItem('taskboard-final-mes-util-tasks', JSON.stringify(tasks));
    localStorage.setItem('taskboard-final-mes-util-tableRows', JSON.stringify(tableRows));
    localStorage.setItem('taskboard-final-mes-util-activeTab', activeTab);
  }, [date, turnData, tasks, tableRows, activeTab]);

  const handleTaskChange = <T extends keyof TasksType>(
    turnKey: T,
    task: keyof TasksType[T],
    checked: boolean | string
  ) => {
    if (turnKey === 'turno3' && checked === true && tasks[turnKey][task as keyof typeof tasks[typeof turnKey]] !== true) {
      const operator = operatorsList.find(op => op.value === turnData.turno3.operator);
      const operatorName = operator?.label || 'Operador';
      
      if (task as string === 'inicioFecho') {
        sendFechoInicioNotification(operatorName);
      } else if (task as string === 'terminoFecho') {
        sendFechoTerminoNotification(operatorName);
      }
    }

    setTasks({
      ...tasks,
      [turnKey]: {
        ...tasks[turnKey],
        [task]: checked
      }
    });
  };

  const handleTurnDataChange = (turnKey: TurnKey, field: string, value: string) => {
    setTurnData({
      ...turnData,
      [turnKey]: {
        ...turnData[turnKey],
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
      executado: '',
      tipo: ''
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
          row.executado.trim() !== '';
        
        // If tarefa is filled, we don't need nomeAs or operacao
        const taskOnlyOption = 
          hasRequiredCommonFields && 
          row.tarefa.trim() !== '';
                           
        // If nomeAs is filled, then operacao is required
        const asWithOperationOption = 
          hasRequiredCommonFields && 
          row.nomeAs.trim() !== '' &&
          row.operacao.trim() !== '';
                           
        return taskOnlyOption || asWithOperationOption;
      });
      
      if (rowsToSave.length === 0) {
        toast.error("Nenhum dado válido para salvar. Preencha pelo menos Hora, (Tarefa OU (Nome AS400 E Nº Operação)), e Executado Por.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      // Verificar se está assinado
      if (!signerName || !signatureDataUrl) {
        toast.error("Não é possível guardar sem assinatura. Preencha o nome do responsável e assine a ficha.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      let savedCount = 0;
      let duplicateCount = 0;
      
      for (const row of rowsToSave) {
        console.log("Processando linha:", row);
        const result = await saveFileProcess({
          time_registered: row.hora,
          task: row.tarefa,
          as400_name: row.tarefa.trim() !== '' && row.nomeAs.trim() === '' ? null : row.nomeAs,
          operation_number: row.operacao || null,
          executed_by: row.executado,
          tipo: row.tipo || null
        });
        
        if (!result.error) {
          savedCount++;
          
          if (row.tipo === 'cobrancas' && user?.id) {
            const ficheiroNome = row.nomeAs?.trim() || row.tarefa?.trim() || 'Cobrança sem nome';
            try {
              console.log('Criando retorno para cobrança:', ficheiroNome);
              await createCobrancaRetorno(user.id, date, ficheiroNome);
            } catch (returnErr) {
              console.error('Error creating collection return:', returnErr);
            }
          }
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
    // Validate operator, entrada, saida for all turns
    const turnLabels = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
    for (const key of ['turno1', 'turno2', 'turno3'] as Array<keyof TurnDataType>) {
      const td = turnData[key];
      if (!td.operator || !td.entrada || !td.saida) {
        toast.error(`Preencha Operador, Entrada e Saída do ${turnLabels[key]} antes de guardar.`);
        return;
      }
    }

    // Verificar se está assinado primeiro
    if (!signerName || !signatureDataUrl) {
      toast.error("Não é possível guardar sem assinatura. Preencha o nome do responsável e assine a ficha.");
      return;
    }

    try {
      // Salvar ficha completa (turnos, tarefas, etc.)
      const { saveTaskboardData } = await import('@/services/taskboardService');
      await saveTaskboardData({
        user_id: user?.id || 'anonymous',
        form_type: 'final-mes-util',
        date,
        turn_data: { turno1: turnData.turno1, turno2: turnData.turno2, turno3: turnData.turno3 },
        tasks: { turno1: tasks.turno1, turno2: tasks.turno2, turno3: tasks.turno3 },
        table_rows: tableRows
      });

      // Salvar processamentos da tabela
      const { savedCount, duplicateCount } = await saveTableRowsToSupabase();
      
      toast.success("Ficha guardada com sucesso!");
      
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
      }
    } catch (error) {
      console.error('Erro ao guardar ficha:', error);
      toast.error('Erro ao guardar ficha. Tente novamente.');
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
        percurso76857: false,
        percurso76857_7h30: false,
        percurso76857_10h: false,
        percurso76857_12h: false,
        validacaoDigitalizacaoFichaDiaria: false,
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
        envioFicheirosVisa12h30: false,
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
        restoreBmBcaCv2: false,
        duptapBmSemBcaCv2: false,
        diferidosBmmes: false,
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
        percurso76857: false,
        percurso76857_14h: false,
        percurso76857_16h: false,
        percurso76857_19h: false,
        inpsProcessar: false,
        inpsEnviarRetorno: false,
        processarTef: false,
        processarTelecomp: false,
        rececaoFicheirosVisaVss: false,
        enviarEciEdv: false,
        confirmarAtualizacaoFicheiros: false,
        envioFicheirosVisaPafCaf: false,
        validarSaco: false,
        verificarPendentes: false,
        fecharBalcoes: false,
        verificarSistemas2: false
      },
      turno3: {
        datacenter: false,
        sistemas: false,
        verificarDebitos: false,
        tratarTapes: false,
        fecharServidores: false,
        fecharImpressoras: false,
        requisicoesCheques: false,
        gerarFicheiroAsc: false,
        fecharBalcao22: false,
        userFecho7624: false,
        userFechoBankaRemota: false,
        userFechoServidoresBanka: false,
        userFechoInternetBanking: false,
        fecharPfs: false,
        prepararCsv: false,
        interromperRealTime: false,
        interromperRealTimeHora: '',
        percurso768989: false,
        prepararFicheiroEtr: false,
        loggOffUtilizadores: false,
        aplicarFicheiroErro: false,
        validarBalcao14: false,
        bloquearNearsoft: false,
        fecharBalcao14: false,
        percurso43: false,
        inicioFecho: false,
        inicioFechoHora: '',
        enviarSmsArranque: false,
        validarEnvioEmail: false,
        controlarTrabalhos: false,
        paragemAberturaServidores: false,
        ativarNearsoft: false,
        saveBmbck: false,
        imprimirCheques: false,
        backupBm: false,
        aplicarFicheirosCompensacao: false,
        tratarPendentesCartoes: false,
        consultarSaldoConta: false,
        saldoNegativo: false,
        saldoPositivo: false,
        abrirRealTime: false,
        abrirRealTimeHora: '',
        verificarEntradaTransacoes: false,
        abrirBcaDireto: false,
        userFechoAbrirServidores: false,
        abrirServidoresPfs: false,
        atualizaTelefones: false,
        efetuarTesteCarregamento: false,
        verificarReplicacao: false,
        enviarFicheiroCsv: false,
        terminoFecho: false,
        terminoFechoHora: '',
        enviarSmsFim: false,
        percurso76921: false,
        percurso76922: false,
        percurso76923: false,
        impressaoCheques: false,
        arquivarCheques: false
      }
    });
    setActiveTab('turno1');
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }]);
    setSignerName("");
    setSignatureDataUrl(null);
    
    localStorage.removeItem('taskboard-final-mes-util-date');
    localStorage.removeItem('taskboard-final-mes-util-turnData');
    localStorage.removeItem('taskboard-final-mes-util-tasks');
    localStorage.removeItem('taskboard-final-mes-util-tableRows');
    localStorage.removeItem('taskboard-final-mes-util-activeTab');
    
    toast.success('Formulário reiniciado com sucesso!');
  };

  const exportToPDF = async () => {
    // Verificar se está assinado primeiro
    if (!signerName || !signatureDataUrl) {
      toast.error("Não é possível exportar PDF sem assinatura. Preencha o nome do responsável e assine a ficha.");
      return;
    }

    try {
      const doc = generateTaskboardPDF(
        date, 
        turnData, 
        tasks, 
        tableRows, 
        false, 
        true,
        { imageDataUrl: signatureDataUrl, signerName, signedAt: new Date().toLocaleString('pt-PT') }
      ); // Set isEndOfMonth to true
      const [yyyy, mm, dd] = date.split('-');
      const yy = yyyy.slice(2);
      const fileName = `FD ${dd}${mm}${yy}.pdf`;
      doc.save(fileName);

      // Save to exported_taskboards for history
      const signature = {
        signerName: signerName || '',
        signedAt: new Date().toISOString(),
        imageDataUrl: signatureDataUrl
      };
      
      if (user) {
        const { error: saveError } = await saveExportedTaskboard(
          user.id,
          'final-mes-util',
          date,
          turnData,
          tasks,
          tableRows,
          signature
        );

        if (saveError) {
          console.error('Erro ao salvar no histórico:', saveError);
          toast.error('PDF gerado mas houve erro ao salvar no histórico');
        } else {
          toast.success(`PDF gerado e salvo no histórico: ${fileName}`);
          
          // Atualizar a data para o dia seguinte após exportação bem-sucedida
          const currentDate = new Date(date);
          currentDate.setDate(currentDate.getDate() + 1);
          const nextDate = currentDate.toISOString().split('T')[0];
          setDate(nextDate);
          toast.info(`Data atualizada para ${nextDate}`);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Ficha de Procedimentos - Final do Mês Dia Útil</CardTitle>
          <CardDescription>Preencha as informações necessárias para o dia de fecho de final de mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as TurnKey)}>
            <TabsList className="mb-4">
              <TabsTrigger value="turno1">Turno 1</TabsTrigger>
              <TabsTrigger value="turno2">Turno 2</TabsTrigger>
              <TabsTrigger value="turno3">Turno 3</TabsTrigger>
            </TabsList>
            
            <TabsContent value="turno1">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno1"
                  operator={turnData.turno1.operator}
                  entrada={turnData.turno1.entrada}
                  saida={turnData.turno1.saida}
                  title="Operador Turno 1"
                  operatorsList={operatorsList}
                  onTurnDataChange={(_turno, field, value) => handleTurnDataChange('turno1', field, value)}
                />
                
                <div className="mt-6">
                  <Turno1TasksComponent
                    tasks={tasks.turno1}
                    onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                    observations={turnData.turno1.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="turno2">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno2"
                  operator={turnData.turno2.operator}
                  entrada={turnData.turno2.entrada}
                  saida={turnData.turno2.saida}
                  title="Operador Turno 2"
                  operatorsList={operatorsList}
                  onTurnDataChange={(_turno, field, value) => handleTurnDataChange('turno2', field, value)}
                />
                
                <div className="mt-6">
                  <Turno2TasksComponent
                    tasks={tasks.turno2}
                    onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                    observations={turnData.turno2.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="turno3">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno3"
                  operator={turnData.turno3.operator}
                  entrada={turnData.turno3.entrada}
                  saida={turnData.turno3.saida}
                  title="Operador Turno 3"
                  operatorsList={operatorsList}
                  onTurnDataChange={(_turno, field, value) => handleTurnDataChange('turno3', field, value)}
                />
                
                <div className="mt-6">
                  <Turno3TasksComponent
                    tasks={tasks.turno3}
                    onTaskChange={(task, checked) => handleTaskChange('turno3', task, checked)}
                    observations={turnData.turno3.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                    isEndOfMonth={true} // Force it to always be an end-of-month form
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <TableRowsSection
            tableRows={tableRows}
            operatorsList={operatorsList}
            onAddRow={addTableRow}
            onRemoveRow={removeTableRow}
            onInputChange={handleInputChange}
          />
          
          <SignatureSection
            signerName={signerName}
            onSignerNameChange={setSignerName}
            signatureDataUrl={signatureDataUrl}
            onSignatureChange={setSignatureDataUrl}
          />
          
          <FormActions
            onSave={handleSave}
            onExportPDF={exportToPDF}
            onReset={resetForm}
            isValidated={!!signerName && !!signatureDataUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskboardFinalMesUtil;
