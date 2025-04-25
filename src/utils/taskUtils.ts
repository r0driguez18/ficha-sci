
import type { TurnKey, TasksType, Turno1Tasks, Turno2Tasks, Turno3Tasks } from '@/types/taskboard';

/**
 * Ensures a value is properly converted to a boolean
 */
export const ensureBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

/**
 * Updates a task in the tasks state
 */
export const updateTask = (
  tasks: TasksType,
  turno: TurnKey,
  task: string,
  checked: boolean | string
): TasksType => {
  const booleanValue = ensureBoolean(checked);
  
  return {
    ...tasks,
    [turno]: {
      ...tasks[turno],
      [task]: booleanValue
    }
  };
};

export const getInitialTasks = (): TasksType => ({
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
