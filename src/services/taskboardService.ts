
import { saveFileProcess } from '@/services/fileProcessService';
import { toast } from 'sonner';
import { TaskTableRow } from '@/components/taskboard/TableRows';

interface SaveResult {
  savedCount: number;
  duplicateCount: number;
}

export const saveTableRowsToSupabase = async (tableRows: TaskTableRow[]): Promise<SaveResult> => {
  try {
    const rowsToSave = tableRows.filter(row => {
      const hasRequiredCommonFields = 
        row.hora.trim() !== '' && 
        row.operacao.trim() !== '' && 
        row.executado.trim() !== '';
      
      const option1Valid = 
        hasRequiredCommonFields && 
        row.tarefa.trim() !== '';
                       
      const option2Valid = 
        hasRequiredCommonFields && 
        row.nomeAs.trim() !== '';
                       
      return option1Valid || option2Valid;
    });
    
    if (rowsToSave.length === 0) {
      toast.error("Nenhum dado válido para salvar. Preencha pelo menos Hora, (Tarefa OU Nome AS400), Nº Operação e Executado Por.");
      return { savedCount: 0, duplicateCount: 0 };
    }
    
    let savedCount = 0;
    let duplicateCount = 0;
    
    for (const row of rowsToSave) {
      console.log("Processando linha:", row);
      const result = await saveFileProcess({
        time_registered: row.hora,
        task: row.tarefa,
        as400_name: row.nomeAs,
        operation_number: row.operacao,
        executed_by: row.executado
      });
      
      if (!result.error) {
        savedCount++;
      } else if (result.error.message && result.error.message.includes("já existe")) {
        duplicateCount++;
      }
    }
    
    console.log(`Salvos ${savedCount} registros e ignorados ${duplicateCount} registros duplicados no Supabase`);
    return { savedCount, duplicateCount };
  } catch (error) {
    console.error('Erro ao salvar dados no Supabase:', error);
    return { savedCount: 0, duplicateCount: 0 };
  }
};
