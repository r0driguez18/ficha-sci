import React, { useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronsDown, CheckCircle2 } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { countTaskProgress } from '@/lib/taskboardProgress';
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { VerificacaoTapesSection } from '@/components/tasks/VerificacaoTapesSection';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { SyncStatusBadge } from '@/components/taskboard/SyncStatusBadge';
import { useTaskboard } from '@/hooks/useTaskboard';
import type { FormType } from '@/services/taskboardService';
import type { TurnKey } from '@/types/taskboard';

const TURN_LABELS: Record<TurnKey, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };

/** Limites razoáveis para a data da ficha — evita escolhas absurdas (2019, 2099…) sem bloquear correções antigas. */
function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const dateMinBound = isoDateOffset(-365);
const dateMaxBound = isoDateOffset(7);

interface FichaProcedimentosProps {
  formType: FormType;
}

export default function FichaProcedimentos({ formType }: FichaProcedimentosProps) {
  const tb = useTaskboard(formType);
  const { config, operatorsList } = tb;
  const multiTurn = config.turns.length > 1;

  const turnRefs = useRef<Partial<Record<TurnKey, HTMLDivElement | null>>>({});

  /** Leva o operador à primeira tarefa por marcar do turno. */
  const jumpToNextUnchecked = useCallback((turnKey: TurnKey) => {
    const container = turnRefs.current[turnKey];
    if (!container) return;
    const boxes = Array.from(
      container.querySelectorAll<HTMLElement>('[role="checkbox"][data-state="unchecked"]'),
    );
    if (boxes.length === 0) return;
    const next = boxes.find((b) => b.getBoundingClientRect().top > 130) ?? boxes[0];
    next.scrollIntoView({ behavior: 'smooth', block: 'center' });
    next.focus({ preventScroll: true });
  }, []);

  if (tb.isLoading) {
    return (
      <PageContainer size="default">
        <LoadingState label="A carregar a ficha…" />
      </PageContainer>
    );
  }

  const renderTurn = (turnKey: TurnKey) => {
    const td = tb.turnData[turnKey];
    const info = (
      <TurnInfoSection
        turnKey={turnKey}
        operator={td.operator}
        entrada={td.entrada}
        saida={td.saida}
        title={multiTurn ? TURN_LABELS[turnKey] : 'Operador'}
        operatorsList={operatorsList}
        onTurnDataChange={(_t, field, value) => tb.handleTurnDataChange(turnKey, field, value)}
      />
    );

    const progress = countTaskProgress(tb.tasks[turnKey]);
    const allDone = progress.total > 0 && progress.done === progress.total;

    return (
      <div className="space-y-6">
        {info}

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {progress.done}/{progress.total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => jumpToNextUnchecked(turnKey)}
            disabled={allDone}
          >
            {allDone ? (
              <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Turno completo</>
            ) : (
              <><ChevronsDown className="h-4 w-4 mr-1.5" /> Próxima por marcar</>
            )}
          </Button>
        </div>

        <div className="mt-6" ref={(el) => { turnRefs.current[turnKey] = el; }}>
          {turnKey === 'turno1' && (
            <Turno1TasksComponent
              tasks={tb.tasks.turno1}
              onTaskChange={(task, checked) => tb.handleTaskChange('turno1', task as string, checked)}
              observations={td.observations}
              onObservationsChange={(value) => tb.handleTurnDataChange('turno1', 'observations', value)}
            />
          )}
          {turnKey === 'turno2' && (
            <Turno2TasksComponent
              tasks={tb.tasks.turno2}
              onTaskChange={(task, checked) => tb.handleTaskChange('turno2', task as string, checked)}
              observations={td.observations}
              onObservationsChange={(value) => tb.handleTurnDataChange('turno2', 'observations', value)}
            />
          )}
          {turnKey === 'turno3' && (
            <Turno3TasksComponent
              tasks={tb.tasks.turno3}
              onTaskChange={(task, value) => tb.handleTaskChange('turno3', task as string, value)}
              observations={td.observations}
              onObservationsChange={(value) => tb.handleTurnDataChange('turno3', 'observations', value)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <PageContainer size="default">
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">{config.title}</CardTitle>
              <CardDescription className="mt-1">{config.description}</CardDescription>
            </div>
            {tb.user && <SyncStatusBadge status={tb.syncStatus} lastSavedAt={tb.lastSavedAt} />}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Label
              htmlFor="ficha-date"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Data
            </Label>
            <Input
              id="ficha-date"
              type="date"
              value={tb.date}
              onChange={(e) => tb.setDate(e.target.value)}
              min={dateMinBound}
              max={dateMaxBound}
              className="max-w-xs mt-1.5"
            />
          </div>

          {multiTurn ? (
            <Tabs value={tb.activeTab} onValueChange={(v) => tb.setActiveTab(v as TurnKey)}>
              <TabsList className="mb-6 h-11 p-1 bg-muted">
                {config.turns.map((turnKey) => {
                  const p = countTaskProgress(tb.tasks[turnKey]);
                  return (
                    <TabsTrigger
                      key={turnKey}
                      value={turnKey}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-medium"
                    >
                      {TURN_LABELS[turnKey]}
                      <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                        {p.done}/{p.total}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {config.turns.map((turnKey) => (
                <TabsContent key={turnKey} value={turnKey}>
                  {renderTurn(turnKey)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            renderTurn(config.turns[0])
          )}

          <TableRowsSection
            tableRows={tb.tableRows}
            operatorsList={operatorsList}
            onAddRow={tb.addTableRow}
            onRemoveRow={tb.removeTableRow}
            onInputChange={tb.handleInputChange}
          />

          {tb.showTapeVerification && (
            <VerificacaoTapesSection
              data={tb.date}
              operador={
                operatorsList.find((o) => o.value === tb.turnData.turno3.operator)?.label ??
                tb.turnData.turno3.operator ??
                ''
              }
              tapes={tb.verificacaoTapes}
              onChange={tb.handleTapesChange}
            />
          )}

          <SignatureSection
            signerName={tb.signerName}
            onSignerNameChange={tb.setSignerName}
            signatureDataUrl={tb.signatureDataUrl}
            onSignatureChange={tb.setSignatureDataUrl}
            signingToken={tb.signingToken}
            onSigningTokenChange={tb.setSigningToken}
          />

          <FormActions
            onExportPDF={tb.exportToPDF}
            onReset={tb.resetForm}
            isSigned={tb.isValidated}
            busy={tb.busy}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
