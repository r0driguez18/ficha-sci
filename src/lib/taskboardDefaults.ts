/**
 * Valores iniciais (tudo por preencher) das estruturas da ficha de
 * procedimentos. Antes estavam copiados em cada uma das 4 variantes.
 */
import type {
  Turno1Tasks,
  Turno2Tasks,
  Turno3Tasks,
  TasksType,
  TurnDataType,
  VerificacaoTapes,
} from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';

export function emptyTurno1Tasks(): Turno1Tasks {
  return {
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
    validarRececaoEnvioVisa: false,
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
    verificarEci: false,
  };
}

export function emptyTurno2Tasks(): Turno2Tasks {
  return {
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
    verificarSistemas2: false,
  };
}

export function emptyTurno3Tasks(): Turno3Tasks {
  return {
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
    transferenciasInterbancarias: false,
    impressaoCheques: false,
    arquivarCheques: false,
  };
}

export function emptyVerificacaoTapes(): VerificacaoTapes {
  return {
    verificadoPor: '',
    bmmes: false,
    bmmesb: false,
    trlog: false,
    blc: false,
    notlh: false,
    savsys: false,
    bmsem: false,
    brjrn: false,
    mvcoh: false,
    hrm: false,
    im: false,
    am: false,
    amjrn: false,
  };
}

export function emptyTurn() {
  return { operator: '', entrada: '', saida: '', observations: '' };
}

export function emptyTasks(): TasksType {
  return {
    turno1: emptyTurno1Tasks(),
    turno2: emptyTurno2Tasks(),
    turno3: emptyTurno3Tasks(),
  };
}

export function emptyTurnData(): TurnDataType {
  return { turno1: emptyTurn(), turno2: emptyTurn(), turno3: emptyTurn() };
}

export function emptyTableRow(id: number, executado = ''): TaskTableRow {
  return { id, hora: '', tarefa: '', nomeAs: '', operacao: '', executado, tipo: '' };
}

/** Data local de hoje em 'AAAA-MM-DD' (não UTC — a app corre em UTC−1). */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
