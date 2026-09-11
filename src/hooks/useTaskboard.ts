import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { consumirTokenAssinatura } from '@/services/operatorPinService';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { computeFichaHash } from '@/lib/signatureHash';
import { fichaFileName } from '@/lib/fichaFileName';
import { supabase } from '@/integrations/supabase/client';
import { TASKBOARD_CONFIGS } from '@/lib/taskboardConfig';
import {
  emptyTasks,
  emptyTurnData,
  emptyTableRow,
  emptyVerificacaoTapes,
  todayIso,
} from '@/lib/taskboardDefaults';
import type { FichaSignature } from '@/types/signature';
import type { TasksType, TurnDataType, TurnKey, VerificacaoTapes } from '@/types/taskboard';
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
  const [activeTab, setActiveTab] = useState<TurnKey>(config.turns[0]);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([emptyTableRow(1)]);
  const [turnData, setTurnData] = useState<TurnDataType>(emptyTurnData());
  const [tasks, setTasks] = useState<TasksType>(emptyTasks());
  const [verificacaoTapes, setVerificacaoTapes] = useState<VerificacaoTapes>(emptyVerificacaoTapes());
  const [signerName, setSignerName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  /** Token de assinatura devolvido pelo servidor ao validar o PIN — ver operatorPinService. */
  const [signingToken, setSigningToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Bloqueia "Guardar" / "Exportar PDF" durante a operação (evita duplo-clique). */
  const [busy, setBusy] = useState(false);

  const singleTurn = config.turns.length === 1;
  const activeTabForSync = singleTurn ? undefined : activeTab;

  /**
   * A folha de verificação de tapes aparece ao domingo e sempre no último dia
   * do mês (mesmo em dia útil). Aos sábados / outros dias não úteis não aparece.
   */
  const { isEndOfMonth, showTapeVerification } = useMemo(() => {
    if (!date) return { isEndOfMonth: false, showTapeVerification: false };
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return { isEndOfMonth: false, showTapeVerification: false };
    const lastDay = new Date(y, m, 0).getDate();
    const eom = d === lastDay;
    const isSunday = new Date(y, m - 1, d).getDay() === 0;
    return { isEndOfMonth: eom, showTapeVerification: isSunday || eom };
  }, [date]);

  // A forma guardada preserva o que cada variante sempre gravou: dias não úteis
  // guardam apenas { turno3: ... }. A folha de tapes vai junto quando visível.
  const storedTurnData = {
    ...(singleTurn ? { turno3: turnData.turno3 } : turnData),
    ...(showTapeVerification ? { verificacaoTapes } : {}),
  };
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
      if (savedTurnData) {
        const parsed = JSON.parse(savedTurnData);
        setTurnData(mergeTurnData(parsed));
        if (parsed?.verificacaoTapes) {
          setVerificacaoTapes({ ...emptyVerificacaoTapes(), ...parsed.verificacaoTapes });
        }
      }
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
          if (remote.turn_data) {
            setTurnData(mergeTurnData(remote.turn_data));
            const vt = (remote.turn_data as { verificacaoTapes?: Partial<VerificacaoTapes> }).verificacaoTapes;
            if (vt) setVerificacaoTapes({ ...emptyVerificacaoTapes(), ...vt });
          }
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
  }, [date, turnData, tasks, tableRows, verificacaoTapes, activeTab, isLoading]);

  // A assinatura vale para o conteúdo tal como estava no momento de
  // assinar — qualquer edição depois disso invalida-a (o token de
  // assinatura, de uso único, ainda nem chegou a ser gasto, e expira
  // sozinho em 10 min), exigindo assinar de novo antes de exportar.
  useEffect(() => {
    if (signatureDataUrl || signingToken) {
      setSignerName('');
      setSignatureDataUrl(null);
      setSigningToken(null);
      toast.info('A ficha foi alterada depois de assinada — assina novamente antes de exportar.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnData, tasks, tableRows, verificacaoTapes]);

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
  // Saldo da conta: negativo/positivo são mutuamente exclusivos — marcar um
  // desmarca o outro, nunca os dois ao mesmo tempo.
  const SALDO_OPOSTO: Record<string, string> = {
    saldoNegativo: 'saldoPositivo',
    saldoPositivo: 'saldoNegativo',
  };

  const handleTaskChange = useCallback(
    (turnKey: TurnKey, task: string, checked: boolean | string) => {
      setTasks((prev) => {
        const turnTasks = { ...prev[turnKey], [task]: checked };
        const oposto = SALDO_OPOSTO[task];
        if (oposto && checked === true) {
          (turnTasks as Record<string, unknown>)[oposto] = false;
        }
        return { ...prev, [turnKey]: turnTasks };
      });
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

  /** Remove a linha indicada (nunca a última que sobrar) — nunca a "última da lista" por omissão. */
  const removeTableRow = useCallback((id: number) => {
    setTableRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }, []);

  const handleInputChange = useCallback(
    (id: number, field: keyof TaskTableRow, value: string) => {
      const v = field === 'operacao' ? value.replace(/\D/g, '').slice(0, OP_LENGTH) : value;
      setTableRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: v } : row)));
    },
    [],
  );

  const handleTapesChange = useCallback(
    (field: keyof VerificacaoTapes, value: boolean | string) => {
      setVerificacaoTapes((prev) => ({ ...prev, [field]: value }));
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

  /**
   * Entrada igual à saída é sempre um erro (turno de duração zero) — mas
   * entrada > saída é válido (turnos que atravessam a meia-noite), por
   * isso não se pode validar isso de forma genérica.
   */
  const turnoComHorarioInvalido = () => {
    for (const key of config.turns) {
      const td = turnData[key];
      if (td.entrada && td.saida && td.entrada === td.saida) {
        return key;
      }
    }
    return null;
  };

  // Exige também o token: sem ele, "assinado" é só estado local (ver
  // SignatureSection / operatorPinService) e não passa em
  // consumir_token_assinatura no momento de exportar.
  const isSigned = signatureDataUrl === 'pin' && !!signerName && !!signingToken;

  /** Uma linha da tabela conta como processamento a registar? */
  const isSavableRow = (row: (typeof tableRows)[number]) => {
    const common = row.hora.trim() !== '' && row.executado.trim() !== '';
    const taskOnly = common && row.tarefa.trim() !== '';
    const asWithOp = common && row.nomeAs.trim() !== '' && row.operacao.trim() !== '';
    return taskOnly || asWithOp;
  };

  // ---------- Guardar processamentos ----------
  const saveTableRowsToSupabase = async () => {
    const rowsToSave = tableRows.filter(isSavableRow);

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
    let failedCount = 0;
    let failedReturnCount = 0;
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
              const retornoResult = await createCobrancaRetorno(user.id, date, ficheiroNome);
              if (retornoResult.error) {
                failedReturnCount++;
                console.error('Erro ao criar retorno de cobrança:', retornoResult.error);
              }
            } catch (returnErr) {
              failedReturnCount++;
              console.error('Erro ao criar retorno de cobrança:', returnErr);
            }
          }
        } else if (result.error.message?.includes('já existe')) {
          duplicateCount++;
        } else {
          // Não é "silencioso": uma linha que falha a meio do lote (rede,
          // erro do servidor) tem de ser dita ao operador, não só ao console
          // — sem isto a ficha parecia gravada por completo quando não foi.
          failedCount++;
          console.error('Erro ao guardar processamento da linha:', row, result.error);
        }
      }
    } catch (error) {
      console.error('Erro ao guardar processamentos:', error);
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} processamento(s) não foram guardados (erro de gravação) — confirma na Estatística e volta a tentar se faltarem.`,
      );
    }
    if (failedReturnCount > 0) {
      toast.error(
        `${failedReturnCount} processamento(s) de cobrança foram guardados, mas o registo de retorno (prazo/SLA) falhou — confirma em Retornos de Cobranças.`,
      );
    }
    return { savedCount, duplicateCount };
  };

  // ---------- Exportar e guardar ----------
  // Um só passo: valida, regista os processamentos (para a Estatística),
  // gera o PDF e arquiva a ficha no histórico. Não há "guardar" à parte —
  // o rascunho já grava sozinho enquanto se preenche.
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
    const horarioInvalido = turnoComHorarioInvalido();
    if (horarioInvalido) {
      const labels: Record<TurnKey, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
      toast.error(`Entrada e saída do ${labels[horarioInvalido]} não podem ser a mesma hora.`);
      return;
    }

    setBusy(true);
    try {
      let duplicates: string[];
      try {
        duplicates = await findDuplicateOps();
      } catch (e) {
        console.error('Erro ao verificar duplicados:', e);
        toast.error('Não foi possível verificar operações duplicadas — tenta novamente.');
        return;
      }
      if (duplicates.length > 0) {
        toast.error(`A(s) operação(ões) já se encontram no arquivo e não podem ser duplicadas: ${duplicates.join(', ')}`);
        return;
      }

      const missingTurn = turnsFilled();
      if (missingTurn) {
        const labels: Record<TurnKey, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
        toast.error(`Preencha Operador, Entrada e Saída do ${labels[missingTurn]} antes de exportar.`);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Utilizador não autenticado');
        return;
      }

      // Gasta o token de assinatura no servidor — é a única coisa que prova
      // que a verificação de PIN aconteceu mesmo (ver operatorPinService).
      // Um token forjado/expirado/já usado falha aqui, mesmo que o estado
      // local pareça "assinado".
      if (!signingToken) {
        toast.error("A ficha não pode ser gerada sem ser assinada. Use 'Assinar ficha' e introduza o seu PIN.");
        return;
      }
      const { error: tokenError } = await consumirTokenAssinatura(signingToken);
      if (tokenError) {
        console.error('Token de assinatura inválido:', tokenError);
        toast.error('A assinatura expirou ou já foi usada — assina a ficha novamente.');
        setSignerName('');
        setSignatureDataUrl(null);
        setSigningToken(null);
        return;
      }

      // Regista os processamentos da tabela (alimenta a Estatística). Só há
      // toast quando há linhas — uma ficha pode legitimamente não ter nenhuma.
      const temProcessamentos = tableRows.some(isSavableRow);
      let savedCount = 0;
      let duplicateCount = 0;
      if (temProcessamentos) {
        ({ savedCount, duplicateCount } = await saveTableRowsToSupabase());
      }

      const contentHash = await computeFichaHash({
        date,
        formType,
        turnData,
        tasks,
        tableRows,
        verificacaoTapes: showTapeVerification ? verificacaoTapes : undefined,
      });
      const signature: FichaSignature = {
        signerName,
        signerUserId: authUser.id,
        method: 'pin',
        signedAt: new Date().toISOString(),
        contentHash,
        imageDataUrl: null,
      };

      const tapesForExport = showTapeVerification ? verificacaoTapes : undefined;

      const doc = generateTaskboardPDF(
        date,
        turnData,
        tasks,
        tableRows,
        config.isDiaNaoUtil,
        signature,
        tapesForExport,
      );
      const fileName = fichaFileName(date);
      doc.save(fileName);

      const turnDataToPersist = tapesForExport
        ? ({ ...turnData, verificacaoTapes: tapesForExport } as TurnDataType)
        : turnData;

      const { error: saveError } = await saveExportedTaskboard(
        authUser.id,
        formType,
        date,
        turnDataToPersist,
        tasks,
        tableRows,
        signature,
        showTapeVerification,
      );

      if (saveError) {
        console.error('Erro ao guardar no histórico:', saveError);
        toast.error('PDF gerado, mas houve erro ao guardar no histórico.');
        return;
      }

      toast.success(`PDF gerado e guardado no histórico: ${fileName}`);
      if (savedCount > 0) {
        toast.success(`${savedCount} processamento(s) registado(s) na Estatística.`);
        toast.message('Dados guardados.', {
          action: { label: 'Ver Gráficos', onClick: () => navigate('/easyvista/estatisticas') },
        });
      }
      if (duplicateCount > 0) {
        toast.info(`${duplicateCount} processamento(s) já existiam e foram ignorados.`);
      }

      // A assinatura não transita para o dia seguinte: exportar de novo exige
      // reautenticar com o PIN (a data avança para a ficha do próximo dia).
      setSignerName('');
      setSignatureDataUrl(null);
      setSigningToken(null);

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
    setVerificacaoTapes(emptyVerificacaoTapes());
    setTableRows([emptyTableRow(1, currentOperator?.value ?? '')]);
    setActiveTab(config.turns[0]);
    setSignerName('');
    setSignatureDataUrl(null);
    setSigningToken(null);
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
    showTapeVerification,
    verificacaoTapes,
    activeTab,
    setActiveTab,
    tableRows,
    turnData,
    tasks,
    signerName,
    setSignerName,
    signatureDataUrl,
    setSignatureDataUrl,
    signingToken,
    setSigningToken,
    isLoading,
    busy,
    syncStatus,
    lastSavedAt,
    isValidated: isSigned,
    handleTaskChange,
    handleTurnDataChange,
    handleTapesChange,
    addTableRow,
    removeTableRow,
    handleInputChange,
    exportToPDF,
    resetForm,
  };
}
