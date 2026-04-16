
export interface Turno1Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  abrirServidores: boolean;
  percurso76931: boolean;
  enviar: boolean;
  etr: boolean;
  impostos: boolean;
  inpsExtrato: boolean;
  vistoUsa: boolean;
  ben: boolean;
  bcta: boolean;
  percurso76857: boolean;
  percurso76857_7h30: boolean;
  percurso76857_10h: boolean;
  percurso76857_12h: boolean;
  validacaoDigitalizacaoFichaDiaria: boolean;
  verificarDebitos: boolean;
  enviarReportes: boolean;
  verificarRecepcaoSisp: boolean;
  verificarAsc: boolean;
  verificarCsv: boolean;
  verificarEci: boolean;
  backupsDiferidos: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  enviarSegundoEtr: boolean;
  envioFicheirosVisa12h30: boolean;
  enviarFicheiroCom: boolean;
  dia01: boolean;
  dia08: boolean;
  dia16: boolean;
  dia23: boolean;
  atualizarCentralRisco: boolean;
  bmjrn: boolean;
  grjrcv: boolean;
  aujrn: boolean;
  mvdia1: boolean;
  mvdia2: boolean;
  brjrn: boolean;
  restoreBmBcaCv2: boolean;
  duptapBmSemBcaCv2: boolean;
  diferidosBmmes: boolean;
}

export interface Turno2Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  verificarReportes: boolean;
  verificarDebitos: boolean;
  percurso76857: boolean;
  percurso76857_14h: boolean;
  percurso76857_16h: boolean;
  percurso76857_19h: boolean;
  inpsProcessar: boolean;
  inpsEnviarRetorno: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  rececaoFicheirosVisaVss: boolean;
  enviarEciEdv: boolean;
  confirmarAtualizacaoFicheiros: boolean;
  envioFicheirosVisaPafCaf: boolean;
  validarSaco: boolean;
  verificarPendentes: boolean;
  fecharBalcoes: boolean;
  verificarSistemas2: boolean;
}

export interface Turno3Tasks {
  verificarDebitos: boolean;
  tratarTapes: boolean;
  fecharServidores: boolean;
  fecharImpressoras: boolean;
  userFecho: boolean;
  listaRequisicoesCheques: boolean;
  cancelarCartoesClientes: boolean;
  prepararEnviarAsc: boolean;
  adicionarRegistrosBanka: boolean;
  fecharServidoresBanka: boolean;
  alterarInternetBanking: boolean;
  prepararEnviarCsv: boolean;
  fecharRealTime: boolean;
  fecharRealTimeHora: string;
  prepararEnviarEtr: boolean;
  fazerLoggOffAml: boolean;
  aplicarFicheiroErroEtr: boolean;
  validarBalcao14: boolean;
  fecharBalcao14: boolean;
  arranqueManual: boolean;
  inicioFecho: boolean;
  inicioFechoHora: string;
  validarEnvioEmail: boolean;
  controlarTrabalhos: boolean;
  saveBmbck: boolean;
  abrirServidoresInternet: boolean;
  imprimirCheques: boolean;
  backupBm: boolean;
  validarFicheiroCcln: boolean;
  aplicarFicheirosCompensacao: boolean;
  validarSaldoConta: boolean;
  saldoContaValor: string;
  saldoNegativo: boolean;
  saldoPositivo: boolean;
  abrirRealTime: boolean;
  abrirRealTimeHora: string;
  verificarTransacoes: boolean;
  aplicarFicheiroVisa: boolean;
  cativarCartoes: boolean;
  abrirBcaDireto: boolean;
  abrirServidoresBanka: boolean;
  atualizarTelefonesOffline: boolean;
  verificarReplicacao: boolean;
  enviarFicheiroCsv: boolean;
  transferirFicheirosLiquidity: boolean;
  percurso76921: boolean;
  percurso76922: boolean;
  percurso76923: boolean;
  abrirServidoresTesteProducao: boolean;
  impressaoCheques: boolean;
  arquivarCheques: boolean;
  terminoFecho: boolean;
  terminoFechoHora: string;
  transferirFicheirosDsi: boolean;
  limpaGbtrlogFimMes: boolean; // Added this property for end-of-month task
}

export type TurnKey = 'turno1' | 'turno2' | 'turno3';

export type TasksType = {
  turno1: Turno1Tasks;
  turno2: Turno2Tasks;
  turno3: Turno3Tasks;
};

export type TurnDataType = {
  turno1: { operator: string; entrada: string; saida: string; observations: string };
  turno2: { operator: string; entrada: string; saida: string; observations: string };
  turno3: { operator: string; entrada: string; saida: string; observations: string };
};

export enum FormType {
  TASKBOARD = "dia-util",
  TASKBOARD_DIA_NAO_UTIL = "dia-nao-util",
  TASKBOARD_FINAL_MES_UTIL = "final-mes-util",
  TASKBOARD_FINAL_MES_NAO_UTIL = "final-mes-nao-util"
}
