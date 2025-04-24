
export interface TurnData {
  operator: string;
  entrada: string;
  saida: string;
  observations: string;
}

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
  processarTef: boolean;
  processarTelecomp: boolean;
}

export interface Turno2Tasks {
  datacenter: boolean;
  sistemas: boolean;
  servicos: boolean;
  verificarReportes: boolean;
  inpsProcessar: boolean;
  inpsEnviarRetorno: boolean;
  processarTef: boolean;
  processarTelecomp: boolean;
  enviarEci: boolean;
  enviarEdv: boolean;
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
  validarFicheiro: boolean;
  bmjrn: boolean;
  grjrcv: boolean;
  aujrn: boolean;
  mvdia1: boolean;
  mvdia2: boolean;
  brjrn: boolean;
}

export interface TasksType {
  turno1: Turno1Tasks;
  turno2: Turno2Tasks;
  turno3: Turno3Tasks;
}

export type TurnKey = 'turno1' | 'turno2' | 'turno3';

export interface TurnDataType {
  turno1: TurnData;
  turno2: TurnData;
  turno3: TurnData;
}
