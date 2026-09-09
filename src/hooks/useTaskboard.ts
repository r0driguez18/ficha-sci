import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOperators, useCurrentOperator } from '@/hooks/useOperators';
import {
  useTaskboardSync,
  taskboardLocalPrefix,
  type FormType,
} from '@/services/taskboardService';
import { saveFileProcess } from '@/services/fileProcessService';
import { createCobrancaRetorno } from '@/services/cobrancasRetornoService';
import { saveExportedTaskboard, checkDuplicateOperations } from '@/services/exportedTaskboardService';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { computeFichaHash } from '@/lib/signatureHash';
import { supabase } from '@/integrations/supabase/client';
import { TASKBOARD_CONFIGS } from '@/lib/taskboardConfig';
import {
  emptyTasks,
  emptyTurnData,
  emptyTableRow,
  todayIso,
} from '@/lib/taskboardDefaults';
import type { FichaSignature } from '@/types/signature';
import type { TasksType, TurnDataType, TurnKey } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';

const OP_LENGTH = 9;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** Reconstrói o estado completo a partir de dados guardados que podem estar
 *  na forma de 3 turnos ou só do turno 3 (dias não úteis). Cada turno é
 *  fundido sobre os valores por omissão, para que um registo parcial ou
 *  antigo (sem algum campo) não deixe campos `undefined` no estado. */
function mergeTurnData(stored: AnyRecord | undefined | null): TurnDataType {
  const base = emptyTurnData();
  if (!stored) return base;
  return {
    turno1: { ...base.turno1, ...(stored.turno1 ?? {}) },
    turno2: { ...base.turno2, ...(stored.turno2 ?? {}) },
    turno3: { ...base.turno3, ...(stored.turno3 ?? {}) },
  };
}

function mergeTasks(stored: AnyRecord | undefined | null): TasksType {
  const base = emptyTasks();
  if (!stored) return base;
  return {
    turno1: { ...base.turno1, ...(stored.turno1 ?? {}) },
    turno2: { ...base.turno2, ...(stored.turno2 ?? {}) },
    turno3: { ...base.turno3, ...(stored.turno3 ?? {}) },
  };
}

export function useTaskboard(formType: FormType) {
  const config = TASKBOARD_CONFIGS[formType];
  const navigate = useNavigate();
  const { user } = useAuth();
  const { operators: operatorsList } = useOperators();
  const currentOperator = useCurrentOperator();

  const [date, setDate] = useState(todayIso());
  const [isEndOfMonth, setIsEndOfMonth] = useState<boolean>(config.forceEndOfMonth);
  const [activeTab, setActiveTab] = useState<TurnKey>(config.turns[0]);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([emptyTableRow(1)]);
  const [turnData, setTurnData] = useState<TurnDataType>(emptyTurnData());
  const [tasks, setTasks] = useState<TasksType>(emptyTasks());
  const [signerName, setSignerName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Bloqueia "Guardar" / "Exportar PDF" durante a operação (evita duplo-clique). */
  const [busy, setBusy] = useState(false);

  const singleTurn = config.turns.length === 1;
  const activeTabForSync = singleTurn ? undefined : activeTab;

  // A forma guardada preserva o que cada variante sempre gravou: dias não úteis
  // guardam apenas { turno3: ... }.
  const storedTurnData = singleTurn ? { turno3: turnData.turno3 } : turnData;
  const storedTasks = singleTurn ? { turno3: tasks.turno3 } : tasks;

  const { syncData, loadData, resetData, status: syncStatus, lastSavedAt } = useTaskboardSync(
    formType,
    date,
    storedTurnData,
    storedTasks,
    tableRows,
    activeTabForSync,
  );

  // ---------- Carregar ----------
  useEffect(() => {
    let cancelled = false;
    const prefix = taskboardLocalPrefix(formType);

    async function readLocalFallback() {
      const savedDate = localStorage.getItem(`${prefix}-date`);
      const savedTurnData = localStorage.getItem(`${prefix}-turnData`);
      const savedTasks = localStorage.getItem(`${prefix}-tasks`);
      const savedTableRows = localStorage.getItem(`${prefix}-tableRows`);
      const savedActiveTab = localStorage.getItem(`${prefix}-activeTab`);

      if (savedDate) setDate(savedDate);
      if (savedTurnData) setTurnData(mergeTurnData(JSON.parse(savedTurnData)));
      if (savedTasks) setTasks(mergeTasks(JSON.parse(savedTasks)));
      if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
      if (!singleTurn && savedActiveTab) setActiveTab(savedActiveTab as TurnKey);
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const remote = user ? await loadData() : null;
        if (cancelled) return;

        if (remote) {
          if (remote.date) setDate(remote.date);
          if (remote.turn_data) setTurnData(mergeTurnData(remote.turn_data));
          if (remote.tasks) setTasks(mergeTasks(remote.tasks));
          if (remote.table_rows) setTableRows(remote.table_rows);
          if (!singleTurn && remote.active_tab) setActiveTab(remote.active_tab as TurnKey);
        } else {
          await readLocalFallback();
        }
      } catch (error) {
        console.error('Erro ao carregar dados da ficha:', error);
        toast.error('Erro ao carregar dados. A usar a configuração por omissão.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, formType]);

  // ---------- Gravação automática do rascunho ----------
  useEffect(() => {
    if (!isLoading) syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, turnData, tasks, tableRows, activeTab, isLoading]);

  // ---------- Fim de mês ----------
  useEffect(() => {
    if (config.forceEndOfMonth) {
      setIsEndOfMonth(true);
      return;
    }
    if (!date) return;
    const d = new Date(date);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    setIsEndOfMonth(d.getDate() === lastDay);
  }, [date, config.forceEndOfMonth]);

  // ---------- Pré-preencher "Executado por" na 1.ª linha intacta ----------
  useEffect(() => {
    if (!currentOperator) return;
    setTableRows((rows) => {
      if (rows.length !== 1) return rows;
      const r = rows[0];
      if (r.executado || r.hora || r.tarefa || r.nomeAs || r.operacao || r.tipo) return rows;
      return [{ ...r, executado: currentOperator.value }];
    });
  }, [currentOperator]);

  // ---------- Handlers de edição ----------
  const handleTaskChange = useCallback(
    (turnKey: TurnKey, task: string, checked: boolean | string) => {
      setTasks((prev) => ({
        ...prev,
        [turnKey]: { ...prev[turnKey], [task]: checked },
      }));
    },
    [],
  );

  const handleTurnDataChange = useCallback((turnKey: TurnKey, field: string, value: string) => {
    setTurnData((prev) => ({
      ...prev,
      [turnKey]: { ...prev[turnKey], [field]: value },
    }));
  }, []);

  const addTableRow = useCallback(() => {
    setTableRows((rows) => [...rows, emptyTableRow(rows.length + 1, currentOperator?.value ?? '')]);
  }, [currentOperator]);

  const removeTableRow = useCallback(() => {
    setTableRows((rows) => (rows.length > 1 ? rows.slice(0, -1) : rows));
  }, []);

  const handleInputChange = useCallback(
    (id: number, field: keyof TaskTableRow, value: string) => {
      const v = field === 'operacao' ? value.replace(/\D/g, '').slice(0, OP_LENGTH) : value;
      setTableRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: v } : row)));
    },
    [],
  );

  // ---------- Validações partilhadas ----------
  const invalidOpFormat = () =>
    tableRows.some((r) => r.operacao && r.operacao.trim() !== '' && r.operacao.trim().length !== OP_LENGTH);

  const findDuplicateOps = async () => {
    const ops = tableRows.map((r) => r.operacao?.trim()).filter(Boolean) as string[];
    if (ops.length === 0) return [];
    return checkDuplicateOperations(formType, date, ops);
  };

  const turnsFilled = () => {
    for (const key of config.turns) {
      const td = turnData[key];
      if (!td.operator || !td.entrada || !td.saida) {
        return key;
      }
    }
    return null;
  };

  const isSigned = signatureDataUrl === 'pin' && !!signerName;

  // ---------- Guardar processamentos ----------
  const saveTableRowsToSupabase = async () => {
    const rowsToSave = tableRows.filter((row) => {
      const common = row.hora.trim() !== '' && row.executado.trim() !== '';
      const taskOnly = common && row.tarefa.trim() !== '';
      const asWithOp = common && row.nomeAs.trim() !== '' && row.operacao.trim() !== '';
      return taskOnly || asWithOp;
    });

    if (rowsToSave.length === 0) {
      toast.error(
        'Nenhum dado válido para guardar. Preencha pelo menos Hora, (Tarefa OU (Nome AS400 e Nº Operação)) e Executado por.',
      );
      return { savedCount: 0, duplicateCount: 0 };
    }
    if (!isSigned) {
      toast.error('Não é possível guardar sem assinatura. Assine a ficha com o seu PIN.');
      return { savedCount: 0, duplicateCount: 0 };
    }

    let savedCount = 0;
    let duplicateCount = 0;
    try {
      for (const row of rowsToSave) {
        const result = await saveFileProcess({
          time_registered: row.hora,
          task: row.tarefa,
          as400_name: row.tarefa.trim() !== '' && row.nomeAs.trim() === '' ? null : row.nomeAs,
          operation_number: row.operacao || null,
          executed_by: row.executado,
          tipo: row.tipo || null,
        });

        if (!result.error) {
          savedCount++;
          if (row.tipo === 'cobrancas' && user?.id) {
            const ficheiroNome = row.nomeAs?.trim() || row.tarefa?.trim() || 'Cobrança sem nome';
            try {
              await createCobrancaRetorno(user.id, date, ficheiroNome);
            } catch (returnErr) {
              console.error('Erro ao criar retorno de cobrança:', returnErr);
            }
          }
        } else if (result.error.message?.includes('já existe')) {
          duplicateCount++;
        }
      }
    } catch (error) {
      console.error('Erro ao guardar processamentos:', error);
    }
    return { savedCount, duplicateCount };
  };

  // ---------- Guardar ----------
  const handleSave = async () => {
    if (busy) return;
    if (!signerName || signerName.trim() === '') {
      toast.error("A ficha não pode ser guardada sem ser assinada. Use 'Assinar ficha' e introduza o seu PIN.");
      return;
    }
    if (invalidOpFormat()) {
      toast.error('O(s) número(s) de operação devem conter exatamente 9 dígitos. Verifique a tabela.');
      return;
    }
    const duplicates = await findDuplicateOps();
    if (duplicates.length > 0) {
      toast.error(`A(s) operação(ões) já se encontram no arquivo e não podem ser duplicadas: ${duplicates.join(', ')}`);
      return;
    }
    const missingTurn = turnsFilled();
    if (missingTurn) {
      const labels: Record<TurnKey, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
      toast.error(`Preencha Operador, Entrada e Saída do ${labels[missingTurn]} antes de guardar.`);
      return;
    }
    if (!isSigned) {
      toast.error('Não é possível guardar sem assinatura. Assine a ficha com o seu PIN.');
      return;
    }

    setBusy(true);
    try {
      await syncData(); // grava o rascunho agora (turnos, tarefas, tabela)
      const { savedCount, duplicateCount } = await saveTableRowsToSupabase();

      toast.success('Ficha guardada com sucesso!');
      if (savedCount > 0) {
        toast.success(`${savedCount} processamentos guardados.`);
        if (duplicateCount > 0) {
          toast.info(`${duplicateCount} processamentos foram ignorados por já existirem.`);
        }
        toast.message('Dados guardados.', {
          action: { label: 'Ver Gráficos', onClick: () => navigate('/easyvista/estatisticas') },
        });
      } else if (duplicateCount > 0) {
        toast.info(`Todos os ${duplicateCount} processamentos já existem no sistema.`);
      }
      // O arquivo em exported_taskboards é feito apenas na exportação do PDF (RF-06.1).
    } catch (error) {
      console.error('Erro ao guardar ficha:', error);
      toast.error('Erro ao guardar ficha. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Exportar PDF ----------
  const exportToPDF = async () => {
    if (busy) return;
    if (!isSigned) {
      toast.error("A ficha não pode ser gerada sem ser assinada. Use 'Assinar ficha' e introduza o seu PIN.");
      return;
    }
    if (invalidOpFormat()) {
      toast.error('O(s) número(s) de operação devem conter exatamente 9 dígitos. Verifique a tabela.');
      return;
    }

    setBusy(true);
    try {
      const duplicates = await findDuplicateOps();
      if (duplicates.length > 0) {
        toast.error(`A(s) operação(ões) já se encontram no arquivo e não podem ser duplicadas: ${duplicates.join(', ')}`);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Utilizador não autenticado');
        return;
      }

      const effectiveEndOfMonth = config.forceEndOfMonth || isEndOfMonth;
      const contentHash = await computeFichaHash({
        date,
        formType,
        turnData,
        tasks,
        tableRows,
      });
      const signature: FichaSignature = {
        signerName,
        signerUserId: authUser.id,
        method: 'pin',
        signedAt: new Date().toISOString(),
        contentHash,
        imageDataUrl: null,
      };

      const doc = generateTaskboardPDF(
        date,
        turnData,
        tasks,
        tableRows,
        config.isDiaNaoUtil,
        effectiveEndOfMonth,
        signature,
      );
      const [yyyy, mm, dd] = date.split('-');
      const fileName = `FD ${dd}${mm}${yyyy.slice(2)}.pdf`;
      doc.save(fileName);

      const { error: saveError } = await saveExportedTaskboard(
        authUser.id,
        formType,
        date,
        turnData,
        tasks,
        tableRows,
        signature,
      );

      if (saveError) {
        console.error('Erro ao guardar no histórico:', saveError);
        toast.error('PDF gerado, mas houve erro ao guardar no histórico.');
        return;
      }

      toast.success(`PDF gerado e guardado no histórico: ${fileName}`);

      // A assinatura não transita para o dia seguinte: exportar de novo exige
      // reautenticar com o PIN (a data avança para a ficha do próximo dia).
      setSignerName('');
      setSignatureDataUrl(null);

      const [ny, nm, nd] = date.split('-').map(Number);
      const next = new Date(ny, nm - 1, nd + 1);
      const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
      setDate(nextIso);
      toast.info(`Data atualizada para ${nextIso}`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Reiniciar ----------
  const resetForm = async () => {
    setDate(todayIso());
    setTurnData(emptyTurnData());
    setTasks(emptyTasks());
    setTableRows([emptyTableRow(1, currentOperator?.value ?? '')]);
    setActiveTab(config.turns[0]);
    setSignerName('');
    setSignatureDataUrl(null);
    await resetData();
    toast.success('Formulário reiniciado com sucesso!');
  };

  return {
    config,
    user,
    operatorsList,
    date,
    setDate,
    isEndOfMonth,
    activeTab,
    setActiveTab,
    tableRows,
    turnData,
    tasks,
    signerName,
    setSignerName,
    signatureDataUrl,
    setSignatureDataUrl,
    isLoading,
    busy,
    syncStatus,
    lastSavedAt,
    isValidated: isSigned,
    handleTaskChange,
    handleTurnDataChange,
    addTableRow,
    removeTableRow,
    handleInputChange,
    handleSave,
    exportToPDF,
    resetForm,
  };
}
