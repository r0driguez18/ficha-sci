import React, { useEffect, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';
import { useAuth } from '@/components/auth/AuthProvider';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { TaskboardHeader } from '@/components/taskboard/TaskboardHeader';
import { TaskboardTabs } from '@/components/taskboard/TaskboardTabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TaskboardSkeleton } from '@/components/ui/loading-skeleton';
import type { TurnKey } from '@/types/taskboard';
import { supabase } from '@/integrations/supabase/client';
import { saveExportedTaskboard } from '@/services/exportedTaskboardService';
import { createCobrancaRetorno } from '@/services/cobrancasRetornoService';
import { useTaskboard } from '@/hooks/useTaskboard';

const Taskboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    // State
    date,
    setDate,
    isEndOfMonth,
    tableRows,
    activeTab,
    setActiveTab,
    isLoading,
    signerName,
    setSignerName,
    signatureDataUrl,
    setSignatureDataUrl,
    turnData,
    tasks,
    
    // Computed values
    completedTasksCount,
    validTableRowsCount,
    
    // Methods
    getFormType,
    loadTaskboardData,
    handleTaskChange,
    handleTurnDataChange,
    addTableRow,
    removeTableRow,
    handleInputChange,
    resetForm,
    syncData
  } = useTaskboard();

  useEffect(() => {
    loadTaskboardData();
  }, [loadTaskboardData]);

  const saveTableRowsToSupabase = async () => {
    try {
      const rowsToSave = tableRows.filter(row => {
        const hasRequiredCommonFields = 
          row.hora.trim() !== '' && 
          row.executado.trim() !== '';
        
        const taskOnlyOption = 
          hasRequiredCommonFields && 
          row.tarefa.trim() !== '';
                           
        const asWithOperationOption = 
          hasRequiredCommonFields && 
          row.nomeAs.trim() !== '' &&
          row.operacao.trim() !== '';
                           
        return taskOnlyOption || asWithOperationOption;
      });
      
      if (rowsToSave.length === 0) {
        toast.error("Nenhum dado válido para salvar. Preencha pelo menos Hora, (Tarefa OU (Nome AS400 E Nº Operação)), e Executado Por.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      if (!signerName || !signatureDataUrl) {
        toast.error("Não é possível guardar sem assinatura. Preencha o nome do responsável e assine a ficha.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      let savedCount = 0;
      let duplicateCount = 0;
      
      // Process rows in batches for better performance
      const batchSize = 5;
      for (let i = 0; i < rowsToSave.length; i += batchSize) {
        const batch = rowsToSave.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (row) => {
          try {
            const result = await saveFileProcess({
              time_registered: row.hora,
              task: row.tarefa,
              as400_name: row.tarefa.trim() !== '' && row.nomeAs.trim() === '' ? null : row.nomeAs,
              operation_number: row.operacao || null,
              executed_by: row.executado
            });
            
            if (!result.error) {
              savedCount++;
              
              if (row.tipo === 'cobrancas' && row.nomeAs && user?.id) {
                try {
                  await createCobrancaRetorno(user.id, date, row.nomeAs);
                } catch (returnErr) {
                  console.error('Error creating collection return:', returnErr);
                }
              }
            } else if (result.error.message && result.error.message.includes("já existe")) {
              duplicateCount++;
            }
          } catch (error) {
            console.error('Error processing row:', error);
          }
        }));
      }
      
      return { savedCount, duplicateCount };
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
      return { savedCount: 0, duplicateCount: 0 };
    }
  };

  const handleSave = async () => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        toast.error("Utilizador não autenticado");
        return;
      }

      toast.loading("Guardando dados...", { id: 'saving' });

      // Sync data before saving to ensure everything is up to date
      await syncData();

      const { savedCount, duplicateCount } = await saveTableRowsToSupabase();
      
      toast.dismiss('saving');
      
      if (savedCount > 0) {
        toast.success(`Ficha guardada! ${savedCount} processamentos salvos com sucesso.`, {
          action: {
            label: "Ver Gráficos",
            onClick: () => navigate("/easyvista/dashboards")
          }
        });
        
        if (duplicateCount > 0) {
          toast.info(`${duplicateCount} processamentos foram ignorados por já existirem no sistema.`);
        }
      } else if (duplicateCount > 0) {
        toast.info(`Todos os ${duplicateCount} processamentos já existem no sistema.`);
      } else {
        toast.success("Ficha guardada com sucesso!");
      }
    } catch (error) {
      toast.dismiss('saving');
      console.error('Erro ao guardar ficha:', error);
      toast.error('Erro ao guardar ficha. Tente novamente.');
    }
  };

  const exportToPDF = async () => {
    if (!signerName || !signatureDataUrl) {
      toast.error("Não é possível exportar sem assinatura. Preencha o nome do responsável e assine a ficha.");
      return;
    }

    try {
      const fileName = await generateTaskboardPDF(
        date,
        turnData,
        tasks,
        tableRows,
        false,
        isEndOfMonth,
        {
          imageDataUrl: signatureDataUrl,
          signerName,
          signedAt: new Date().toISOString()
        }
      );

      if (user?.id) {
        await saveExportedTaskboard(
          user.id,
          getFormType(),
          date,
          turnData,
          tasks,
          tableRows,
          {
            signerName,
            signedAt: new Date().toISOString(),
            imageDataUrl: signatureDataUrl
          }
        );
      }

      toast.success(`PDF exportado com sucesso: ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Suspense fallback={<TaskboardSkeleton />}>
          <TaskboardSkeleton />
        </Suspense>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6 animate-fade-in">
        <TaskboardHeader
          date={date}
          onDateChange={setDate}
          completedTasksCount={completedTasksCount}
          validTableRowsCount={validTableRowsCount}
          isEndOfMonth={isEndOfMonth}
        />

        <TaskboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tasks={tasks}
          turnData={turnData}
          onTaskChange={handleTaskChange}
          onTurnDataChange={handleTurnDataChange}
        />

        <TableRowsSection
          tableRows={tableRows}
          operatorsList={[]}
          onInputChange={handleInputChange}
          onAddRow={addTableRow}
          onRemoveRow={removeTableRow}
        />

        <SignatureSection
          signerName={signerName}
          signatureDataUrl={signatureDataUrl}
          onSignerNameChange={setSignerName}
          onSignatureChange={setSignatureDataUrl}
        />

        <FormActions
          onSave={handleSave}
          onExportPDF={exportToPDF}
          onReset={resetForm}
          isValidated={validTableRowsCount > 0 && !!(signerName && signatureDataUrl)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Taskboard;