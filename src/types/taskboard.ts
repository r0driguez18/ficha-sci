
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
  verificarDebitos: boolean;
  backupsDiferidos: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  enviarSegundoEtr: boolean;
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
}

export interface Turno2Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  verificarReportes: boolean;
  verificarDebitos: boolean;
  confirmarAtualizacaoSisp: boolean;
  inpsProcessar: boolean;
  inpsEnviarRetorno: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  enviarEci: boolean;
  enviarEdv: boolean;
  confirmarAtualizacaoFicheirosSisp: boolean;  // New task
  validarSaco: boolean;
  verificarPendentes: boolean;
  fecharBalcoes: boolean;
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
