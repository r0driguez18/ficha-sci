import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { appendTapesEvidencia } from '@/utils/pdf/appendTapesEvidencia';
import { fichaFileName } from '@/lib/fichaFileName';
import { supabase } from '@/integrations/supabase/client';
import { getExportedTaskboards, ExportedTaskboard } from '@/services/exportedTaskboardService';
import {
  addTapesEvidencia,
  removeTapesEvidencia,
  downloadTapesEvidencia,
} from '@/services/tapesEvidenciaService';
import { useOperators } from '@/hooks/useOperators';
import { isSigned } from '@/types/signature';

import {
  FileDown,
  Eye,
  Calendar,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  CheckCircle,
  Paperclip,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';

type TaskboardRecord = ExportedTaskboard;

/** Dias corridos a partir dos quais uma pendência de display é "em atraso". */
const TAPES_ATRASO_DIAS = 3;

const isTapesAtrasado = (record: ExportedTaskboard): boolean => {
  if (record.tapes_status !== 'pendente') return false;
  const ref = record.exported_at || record.created_at;
  if (!ref) return false;
  const dias = (Date.now() - new Date(ref).getTime()) / 86_400_000;
  return dias >= TAPES_ATRASO_DIAS;
};

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

interface SignatureData {
  imageDataUrl: string | null;
  signerName?: string;
  signedAt?: string;
}

// Inclui os tipos antigos "final-mes-*" para as fichas já arquivadas continuarem
// a ter etiqueta/cor no histórico (não se criam novas).
const formTypeLabels: Record<string, string> = {
  'dia-util': 'Dia Útil',
  'dia-nao-util': 'Dia Não Útil',
  'final-mes-util': 'Final de Mês Útil',
  'final-mes-nao-util': 'Final de Mês Não Útil'
};

const formTypeColors: Record<string, string> = {
  'dia-util': 'bg-success/15 text-success',
  'dia-nao-util': 'bg-primary/15 text-primary',
  'final-mes-util': 'bg-warning/15 text-warning',
  'final-mes-nao-util': 'bg-destructive/15 text-destructive'
};

const labelForType = (t: string) => formTypeLabels[t] ?? t;
const colorForType = (t: string) => formTypeColors[t] ?? 'bg-muted text-muted-foreground';
const isNaoUtilType = (t: string) => t === 'dia-nao-util' || t === 'final-mes-nao-util';

export default function HistoricoFichas() {
  const { operators } = useOperators();
  const [records, setRecords] = useState<ExportedTaskboard[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExportedTaskboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');
  const [signerFilter, setSignerFilter] = useState<string>('all');
  const [tapesFilter, setTapesFilter] = useState<string>('all');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<ExportedTaskboard | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, formTypeFilter, signerFilter, tapesFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Utilizador não autenticado",
          variant: "destructive"
        });
        return;
      }

      // Load exported taskboards for the whole team (F1)
      const { data: allRecords, error } = await getExportedTaskboards();
      
      if (error) {
        console.error('Erro ao carregar histórico:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar histórico de fichas",
          variant: "destructive"
        });
        return;
      }

      setRecords(allRecords || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de fichas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (formTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.form_type === formTypeFilter);
    }

    if (signerFilter !== 'all') {
      filtered = filtered.filter(record => record.pdf_signature?.signerName === signerFilter);
    }

    if (tapesFilter === 'pendente') {
      filtered = filtered.filter(record => record.tapes_status === 'pendente');
    } else if (tapesFilter === 'anexada') {
      filtered = filtered.filter(record => record.tapes_status === 'anexada');
    } else if (tapesFilter === 'atraso') {
      filtered = filtered.filter(isTapesAtrasado);
    }

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        labelForType(record.form_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.pdf_signature?.signerName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  /** Gera o PDF da ficha e, se houver evidência de tapes anexada, junta-a no fim. */
  const buildFichaPdfBlob = async (record: ExportedTaskboard): Promise<Blob> => {
    const pdf = generateTaskboardPDF(
      record.date,
      record.turn_data,
      record.tasks,
      record.table_rows,
      isNaoUtilType(record.form_type),
      record.pdf_signature,
      (record.turn_data as { verificacaoTapes?: unknown })?.verificacaoTapes as never,
    );

    const evidencia = record.tapes_evidencia ?? [];
    if (evidencia.length === 0) {
      return pdf.output('blob');
    }

    const merged = await appendTapesEvidencia(pdf.output('arraybuffer'), evidencia);
    return new Blob([merged], { type: 'application/pdf' });
  };

  const downloadPDF = async (record: ExportedTaskboard) => {
    if (record.tapes_status === 'pendente') {
      toast({
        title: 'Display de tapes em falta',
        description: 'Esta ficha só pode ser descarregada depois de anexar o display de tapes.',
        variant: 'destructive',
      });
      return;
    }
    setBusyId(record.id);
    try {
      const blob = await buildFichaPdfBlob(record);
      const fileName = fichaFileName(record.date);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Gerado",
        description: `Ficheiro ${fileName} foi descarregado com sucesso`
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
    } finally {
      setBusyId(null);
    }
  };

  const handlePreviewPDF = async (record: ExportedTaskboard) => {
    setBusyId(record.id);
    try {
      const blob = await buildFichaPdfBlob(record);
      const url = URL.createObjectURL(blob);
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error('Erro ao gerar preview PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar preview do PDF",
        variant: "destructive"
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleAttachFiles = async (record: ExportedTaskboard, files: File[]) => {
    if (files.length === 0) return;
    setBusyId(record.id);
    try {
      const { data, error } = await addTapesEvidencia(
        record.id,
        record.form_type,
        record.date,
        record.tapes_evidencia ?? [],
        files,
      );
      if (error || !data) {
        toast({ title: 'Erro', description: error ?? 'Falha ao anexar', variant: 'destructive' });
        return;
      }
      applyTapesUpdate(record.id, data);
      toast({ title: 'Display anexado', description: `${files.length} ficheiro(s) anexado(s) à ficha de ${record.date}.` });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveFile = async (record: ExportedTaskboard, path: string) => {
    setBusyId(record.id);
    try {
      const { data, error } = await removeTapesEvidencia(record.id, record.tapes_evidencia ?? [], path);
      if (error || !data) {
        toast({ title: 'Erro', description: error ?? 'Falha ao remover', variant: 'destructive' });
        return;
      }
      applyTapesUpdate(record.id, data);
    } finally {
      setBusyId(null);
    }
  };

  /** Atualiza o registo em memória depois de anexar/remover evidência. */
  const applyTapesUpdate = (id: string, evidencia: ExportedTaskboard['tapes_evidencia']) => {
    const status: ExportedTaskboard['tapes_status'] = evidencia.length > 0 ? 'anexada' : 'pendente';
    setRecords((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              tapes_evidencia: evidencia,
              tapes_status: status,
              tapes_anexada_at: status === 'anexada' ? new Date().toISOString() : null,
            }
          : r,
      ),
    );
    setAttachTarget((t) => (t && t.id === id ? { ...t, tapes_evidencia: evidencia, tapes_status: status } : t));
    window.dispatchEvent(new Event('update-tapes-badge'));
  };

  const closePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const viewAttachedFile = async (path: string) => {
    const blob = await downloadTapesEvidencia(path);
    if (!blob) {
      toast({ title: 'Erro', description: 'Não foi possível abrir o ficheiro.', variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const getSignatureStatus = (record: ExportedTaskboard) => {
    return isSigned(record.pdf_signature);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Histórico de Fichas" 
        subtitle="As fichas de procedimentos guardadas"
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por data, tipo ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ficha</label>
              <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="dia-util">Dia Útil</SelectItem>
                  <SelectItem value="dia-nao-util">Dia Não Útil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Select value={signerFilter} onValueChange={setSignerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os operadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os operadores</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.label}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display de Tapes</label>
              <Select value={tapesFilter} onValueChange={setTapesFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes de display</SelectItem>
                  <SelectItem value="atraso">Pendentes em atraso</SelectItem>
                  <SelectItem value="anexada">Display anexado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadRecords} variant="outline" className="w-full">
                Atualizar Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fichas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichas Guardadas ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            Abre uma ficha para ver os detalhes ou descarregar o PDF
          </CardDescription>
          {(() => {
            const pendentes = records.filter((r) => r.tapes_status === 'pendente');
            if (pendentes.length === 0) return null;
            const atraso = pendentes.filter(isTapesAtrasado).length;
            return (
              <button
                type="button"
                onClick={() => setTapesFilter('pendente')}
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 px-3 py-1.5 text-sm text-foreground hover:bg-warning/20"
              >
                <AlertTriangle className="h-4 w-4" />
                {pendentes.length} ficha(s) a aguardar o display de tapes
                {atraso > 0 && <span className="font-semibold">· {atraso} em atraso</span>}
              </button>
            );
          })()}
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState label="A carregar fichas…" />
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={records.length === 0 ? 'Sem fichas guardadas' : 'Nenhuma ficha corresponde aos filtros'}
              hint={
                records.length === 0
                  ? 'As fichas de procedimentos exportadas aparecem aqui.'
                  : 'Ajusta ou limpa os filtros acima.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Ficha</TableHead>
                  <TableHead>Data da Ficha</TableHead>
                  <TableHead>Exportado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Display de Tapes</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge className={colorForType(record.form_type)}>
                        {labelForType(record.form_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {record.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(record.exported_at || record.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSignatureStatus(record) ? (
                        <Badge variant="secondary" className="bg-success/15 text-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Não Assinado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.tapes_status === 'nao_aplicavel' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : record.tapes_status === 'anexada' ? (
                        <Badge variant="secondary" className="bg-success/15 text-success">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Anexado ({record.tapes_evidencia?.length ?? 0})
                        </Badge>
                      ) : isTapesAtrasado(record) ? (
                        <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Em atraso
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning/40">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.pdf_signature?.signerName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {record.pdf_signature.signerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {record.tapes_status !== 'nao_aplicavel' && (
                          <Button
                            variant={record.tapes_status === 'pendente' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setAttachTarget(record)}
                            aria-label={`Anexar display de tapes da ficha de ${record.date}`}
                            title="Anexar/gerir o display de tapes"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === record.id}
                          onClick={() => handlePreviewPDF(record)}
                          aria-label={`Pré-visualizar PDF da ficha de ${record.date}`}
                          title="Pré-visualizar PDF"
                        >
                          {busyId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          disabled={busyId === record.id || record.tapes_status === 'pendente'}
                          onClick={() => downloadPDF(record)}
                          aria-label={`Descarregar PDF da ficha de ${record.date}`}
                          title={
                            record.tapes_status === 'pendente'
                              ? 'Anexe o display de tapes antes de descarregar'
                              : 'Descarregar PDF'
                          }
                        >
                          {busyId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Anexar display de tapes */}
      <Dialog open={!!attachTarget} onOpenChange={(open) => { if (!open) setAttachTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Display de Tapes — ficha de {attachTarget?.date}</DialogTitle>
            <DialogDescription>
              Anexe o print do <code>display-tape</code> (PDF ou TXT). O ficheiro é junto ao fim do PDF
              da ficha quando esta é descarregada do histórico.
            </DialogDescription>
          </DialogHeader>

          {attachTarget && (
            <div className="space-y-4">
              <div className="rounded border divide-y">
                {(attachTarget.tapes_evidencia ?? []).length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Sem ficheiros anexados.</p>
                ) : (
                  (attachTarget.tapes_evidencia ?? []).map((f) => (
                    <div key={f.path} className="flex items-center gap-2 p-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <button
                        type="button"
                        className="flex-1 text-left truncate hover:underline"
                        onClick={() => viewAttachedFile(f.path)}
                        title="Abrir ficheiro"
                      >
                        {f.name}
                      </button>
                      <span className="text-xs text-muted-foreground shrink-0">{formatBytes(f.size)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={busyId === attachTarget.id}
                        onClick={() => handleRemoveFile(attachTarget, f.path)}
                        aria-label={`Remover ${f.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div>
                <input
                  id="tapes-file-input"
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  multiple
                  className="hidden"
                  disabled={busyId === attachTarget.id}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = '';
                    if (attachTarget) handleAttachFiles(attachTarget, files);
                  }}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={busyId === attachTarget.id}
                  onClick={() => document.getElementById('tapes-file-input')?.click()}
                >
                  {busyId === attachTarget.id ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A carregar…</>
                  ) : (
                    <><Paperclip className="h-4 w-4 mr-2" /> Escolher ficheiros (PDF/TXT)</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!pdfPreviewUrl} onOpenChange={(open) => { if (!open) closePdfPreview(); }}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>Preview do PDF</DialogTitle>
            <DialogDescription>
              Visualização da ficha de procedimentos em formato PDF
            </DialogDescription>
          </DialogHeader>
          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              className="w-full flex-1 rounded border"
              style={{ height: 'calc(85vh - 100px)' }}
              title="PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}