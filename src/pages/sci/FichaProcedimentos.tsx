import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { SyncStatusBadge } from '@/components/taskboard/SyncStatusBadge';
import { useTaskboard } from '@/hooks/useTaskboard';
import type { FormType } from '@/services/taskboardService';
import type { TurnKey } from '@/types/taskboard';

const TURN_LABELS: Record<TurnKey, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };

interface FichaProcedimentosProps {
  formType: FormType;
}

export default function FichaProcedimentos({ formType }: FichaProcedimentosProps) {
  const tb = useTaskboard(formType);
  const { config, operatorsList } = tb;
  const multiTurn = config.turns.length > 1;

  if (tb.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>A carregar dados...</p>
      </div>
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

    return (
      <div className="space-y-6">
        {info}
        <div className="mt-6">
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
              isEndOfMonth={tb.isEndOfMonth}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container py-6 max-w-5xl">
      <Card className="shadow-sm border">
        <CardHeader className="pb-4 border-b bg-muted/30">
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
              className="max-w-xs mt-1.5"
            />
          </div>

          {multiTurn ? (
            <Tabs value={tb.activeTab} onValueChange={(v) => tb.setActiveTab(v as TurnKey)}>
              <TabsList className="mb-6 h-11 p-1 bg-muted">
                {config.turns.map((turnKey) => (
                  <TabsTrigger
                    key={turnKey}
                    value={turnKey}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-medium"
                  >
                    {TURN_LABELS[turnKey]}
                  </TabsTrigger>
                ))}
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

          <SignatureSection
            signerName={tb.signerName}
            onSignerNameChange={tb.setSignerName}
            signatureDataUrl={tb.signatureDataUrl}
            onSignatureChange={tb.setSignatureDataUrl}
          />

          <FormActions
            onSave={tb.handleSave}
            onExportPDF={tb.exportToPDF}
            onReset={tb.resetForm}
            isValidated={tb.isValidated}
          />
        </CardContent>
      </Card>
    </div>
  );
}
