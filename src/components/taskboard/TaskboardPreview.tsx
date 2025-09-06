import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportedTaskboard } from '@/services/exportedTaskboardService';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react';

// Define form type labels locally since we're dealing with string values from DB
const formTypeLabels = {
  "dia-util": "Taskboard Normal",
  "dia-nao-util": "Taskboard Dia Não Útil", 
  "final-mes-util": "Taskboard Final do Mês Útil",
  "final-mes-nao-util": "Taskboard Final do Mês Não Útil"
};

interface TaskboardPreviewProps {
  taskboard: ExportedTaskboard;
}

export const TaskboardPreview: React.FC<TaskboardPreviewProps> = ({ taskboard }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT');
  };

  const getTurnLabel = (turn: number) => {
    return `${turn}º Turno`;
  };

  const getTaskStatus = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getTaskLabel = (taskKey: string) => {
    // Map task keys to readable labels
    const taskLabels: Record<string, string> = {
      // Turno 1
      'ben': 'BEN',
      'etr': 'ETR',
      'bcta': 'BCTA',
      'aujrn': 'AUJRN',
      'bmjrn': 'BMJRN',
      'brjrn': 'BRJRN',
      'dia01': 'DIA01',
      'dia08': 'DIA08',
      'dia16': 'DIA16',
      'dia23': 'DIA23',
      'enviar': 'Enviar',
      'grjrcv': 'GRJRCV',
      'mvdia1': 'MVDIA1',
      'mvdia2': 'MVDIA2',
      'impostos': 'Impostos',
      'servicos': 'Serviços',
      'sistemas': 'Sistemas',
      'vistoUsa': 'Visto USA',
      'datacenter': 'Datacenter',
      'inpsExtrato': 'INPS Extrato',
      'processarTef': 'Processar TEF',
      'verificarAsc': 'Verificar ASC',
      'verificarCsv': 'Verificar CSV',
      'verificarEci': 'Verificar ECI',
      'percurso76931': 'Percurso 76931',
      'enviarReportes': 'Enviar Reportes',
      'abrirServidores': 'Abrir Servidores',
      'backupsDiferidos': 'Backups Diferidos',
      'enviarSegundoEtr': 'Enviar Segundo ETR',
      'verificarDebitos': 'Verificar Débitos',
      'enviarFicheiroCom': 'Enviar Ficheiro COM',
      'processarTelecomp': 'Processar Telecomp',
      'atualizarCentralRisco': 'Atualizar Central Risco',
      'verificarRecepcaoSisp': 'Verificar Receção SISP',
      
      // Turno 2
      'enviarEci': 'Enviar ECI',
      'enviarEdv': 'Enviar EDV',
      'validarSaco': 'Validar Saco',
      'fecharBalcoes': 'Fechar Balcões',
      'inpsProcessar': 'INPS Processar',
      'inpsEnviarRetorno': 'INPS Enviar Retorno',
      'verificarReportes': 'Verificar Reportes',
      'verificarPendentes': 'Verificar Pendentes',
      'confirmarAtualizacaoFicheiros': 'Confirmar Atualização Ficheiros',
      
      // Turno 3
      'backupBm': 'Backup BM',
      'saveBmbck': 'Save BMBCK',
      'userFecho': 'User Fecho',
      'inicioFecho': 'Início Fecho',
      'tratarTapes': 'Tratar Tapes',
      'terminoFecho': 'Término Fecho',
      'abrirRealTime': 'Abrir Real Time',
      'percurso76921': 'Percurso 76921',
      'percurso76922': 'Percurso 76922',
      'percurso76923': 'Percurso 76923',
      'saldoNegativo': 'Saldo Negativo',
      'saldoPositivo': 'Saldo Positivo',
      'abrirBcaDireto': 'Abrir BCA Direto',
      'arranqueManual': 'Arranque Manual',
      'cativarCartoes': 'Cativar Cartões',
      'fecharBalcao14': 'Fechar Balcão 14',
      'fecharRealTime': 'Fechar Real Time',
      'arquivarCheques': 'Arquivar Cheques',
      'fazerLoggOffAml': 'Fazer LoggOff AML',
      'imprimirCheques': 'Imprimir Cheques',
      'inicioFechoHora': 'Hora Início Fecho',
      'validarBalcao14': 'Validar Balcão 14',
      'fecharServidores': 'Fechar Servidores',
      'impressaoCheques': 'Impressão Cheques',
      'terminoFechoHora': 'Hora Término Fecho',
      'abrirRealTimeHora': 'Hora Abrir Real Time',
      'enviarFicheiroCsv': 'Enviar Ficheiro CSV',
      'fecharImpressoras': 'Fechar Impressoras',
      'prepararEnviarAsc': 'Preparar Enviar ASC',
      'prepararEnviarCsv': 'Preparar Enviar CSV',
      'prepararEnviarEtr': 'Preparar Enviar ETR',
      'validarEnvioEmail': 'Validar Envio Email',
      'validarSaldoConta': 'Validar Saldo Conta',
      'controlarTrabalhos': 'Controlar Trabalhos',
      'fecharRealTimeHora': 'Hora Fechar Real Time',
      'limpaGbtrlogFimMes': 'Limpa GBTRLOG Fim Mês',
      'aplicarFicheiroVisa': 'Aplicar Ficheiro Visa',
      'validarFicheiroCcln': 'Validar Ficheiro CCLN',
      'verificarReplicacao': 'Verificar Replicação',
      'verificarTransacoes': 'Verificar Transações',
      'abrirServidoresBanka': 'Abrir Servidores Banka',
      'fecharServidoresBanka': 'Fechar Servidores Banka',
      'alterarInternetBanking': 'Alterar Internet Banking',
      'aplicarFicheiroErroEtr': 'Aplicar Ficheiro Erro ETR',
      'transferirFicheirosDsi': 'Transferir Ficheiros DSI',
      'abrirServidoresInternet': 'Abrir Servidores Internet',
      'adicionarRegistrosBanka': 'Adicionar Registros Banka',
      'cancelarCartoesClientes': 'Cancelar Cartões Clientes',
      'listaRequisicoesCheques': 'Lista Requisições Cheques',
      'atualizarTelefonesOffline': 'Atualizar Telefones Offline',
      'aplicarFicheirosCompensacao': 'Aplicar Ficheiros Compensação',
      'abrirServidoresTesteProducao': 'Abrir Servidores Teste/Produção',
      'transferirFicheirosLiquidity': 'Transferir Ficheiros Liquidity'
    };
    
    return taskLabels[taskKey] || taskKey;
  };

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <Badge variant="outline">{formTypeLabels[taskboard.form_type as keyof typeof formTypeLabels]}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Data</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(taskboard.date)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Exportado em</p>
              <p className="text-sm">{formatDateTime(taskboard.exported_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Assinado por</p>
              <p className="font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                {taskboard.pdf_signature.signerName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Turn */}
      <div className="grid gap-4">
        {/* Turn 1 Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>1º Turno - Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(taskboard.tasks.turno1 || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 border rounded">
                  {getTaskStatus(Boolean(value))}
                  <span className="text-sm">{getTaskLabel(key)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Turn 2 Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>2º Turno - Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(taskboard.tasks.turno2 || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 border rounded">
                  {getTaskStatus(Boolean(value))}
                  <span className="text-sm">{getTaskLabel(key)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Turn 3 Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>3º Turno - Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(taskboard.tasks.turno3 || {}).map(([key, value]) => {
                // Skip time fields for visual display
                if (key.includes('Hora') || key === 'saldoContaValor') {
                  return null;
                }
                return (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded">
                    {getTaskStatus(Boolean(value))}
                    <span className="text-sm">{getTaskLabel(key)}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Time fields for Turn 3 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {['inicioFechoHora', 'terminoFechoHora', 'abrirRealTimeHora', 'fecharRealTimeHora'].map(timeField => {
                const value = taskboard.tasks.turno3[timeField];
                if (value) {
                  return (
                    <div key={timeField} className="flex items-center gap-2 p-2 border rounded bg-blue-50">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{getTaskLabel(timeField)}:</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                }
                return null;
              })}
              
              {/* Saldo Conta field */}
              {taskboard.tasks.turno3.saldoContaValor && (
                <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                  <span className="text-sm font-medium">Saldo Conta:</span>
                  <span className="text-sm">{taskboard.tasks.turno3.saldoContaValor}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Table */}
      {taskboard.table_rows && taskboard.table_rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operações Executadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Nome AS/400</th>
                    <th className="text-left p-2">Operação</th>
                    <th className="text-left p-2">Executado Por</th>
                    <th className="text-left p-2">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {taskboard.table_rows.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.hora}</td>
                      <td className="p-2">{row.nomeAs}</td>
                      <td className="p-2">{row.operacao}</td>
                      <td className="p-2">{row.executado}</td>
                      <td className="p-2">{row.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Assinado por: <span className="font-normal">{taskboard.pdf_signature.signerName}</span></p>
              <p className="text-sm font-medium">Data/Hora: <span className="font-normal">{taskboard.pdf_signature.signedAt}</span></p>
              <p className="text-sm font-medium">Nome do arquivo: <span className="font-normal">{taskboard.file_name}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskboardPreview;