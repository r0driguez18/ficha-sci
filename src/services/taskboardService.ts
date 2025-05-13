
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TurnDataType, TasksType } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';
import { toast } from '@/components/ui/use-toast';

export type FormType = 'dia-util' | 'dia-nao-util' | 'final-mes-util' | 'final-mes-nao-util';

export interface TaskboardData {
  id?: string;
  user_id: string;
  form_type: FormType;
  date: string;
  turn_data: TurnDataType | Record<string, any>;
  tasks: TasksType | Record<string, any>;
  table_rows: TaskTableRow[];
  active_tab?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save taskboard data to Supabase
 */
export const saveTaskboardData = async (data: TaskboardData): Promise<{ data: any; error: any }> => {
  try {
    console.log('Saving taskboard data to Supabase:', data);
    
    // Check if there's already an entry for this user, form type and date
    const { data: existingData, error: fetchError } = await supabase
      .from('taskboard_data')
      .select('id')
      .eq('user_id', data.user_id)
      .eq('form_type', data.form_type)
      .eq('date', data.date)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking for existing data:', fetchError);
      return { data: null, error: fetchError };
    }
    
    if (existingData) {
      // Update existing record
      const { data: updatedData, error: updateError } = await supabase
        .from('taskboard_data')
        .update({
          turn_data: data.turn_data,
          tasks: data.tasks,
          table_rows: data.table_rows,
          active_tab: data.active_tab || null
        })
        .eq('id', existingData.id);
      
      if (updateError) {
        console.error('Error updating taskboard data:', updateError);
        return { data: null, error: updateError };
      }
      
      console.log('Taskboard data updated successfully');
      return { data: updatedData, error: null };
    } else {
      // Insert new record
      const { data: insertedData, error: insertError } = await supabase
        .from('taskboard_data')
        .insert(data);
      
      if (insertError) {
        console.error('Error inserting taskboard data:', insertError);
        return { data: null, error: insertError };
      }
      
      console.log('Taskboard data inserted successfully');
      return { data: insertedData, error: null };
    }
  } catch (error) {
    console.error('Error saving taskboard data:', error);
    return { data: null, error };
  }
};

/**
 * Load taskboard data from Supabase
 */
export const loadTaskboardData = async (
  userId: string,
  formType: FormType,
  date: string
): Promise<{ data: TaskboardData | null; error: any }> => {
  try {
    console.log(`Loading taskboard data for ${formType}, date: ${date}`);
    
    const { data, error } = await supabase
      .from('taskboard_data')
      .select('*')
      .eq('user_id', userId)
      .eq('form_type', formType)
      .eq('date', date)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching taskboard data:', error);
      return { data: null, error };
    }
    
    console.log('Taskboard data loaded:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error loading taskboard data:', error);
    return { data: null, error };
  }
};

/**
 * Delete taskboard data from Supabase
 */
export const deleteTaskboardData = async (
  userId: string,
  formType: FormType,
  date: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('taskboard_data')
      .delete()
      .eq('user_id', userId)
      .eq('form_type', formType)
      .eq('date', date);
    
    if (error) {
      console.error('Error deleting taskboard data:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting taskboard data:', error);
    return { success: false, error };
  }
};

/**
 * Load all taskboard data for a specific form type
 */
export const loadAllTaskboardsByType = async (
  userId: string,
  formType: FormType
): Promise<{ data: TaskboardData[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('taskboard_data')
      .select('*')
      .eq('user_id', userId)
      .eq('form_type', formType)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all taskboard data:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error loading all taskboard data:', error);
    return { data: [], error };
  }
};

/**
 * Hook to sync taskboard data between localStorage and Supabase
 */
export const useTaskboardSync = (
  formType: FormType, 
  date: string, 
  turnData: TurnDataType | Record<string, any>, 
  tasks: TasksType | Record<string, any>, 
  tableRows: TaskTableRow[],
  activeTab?: string
) => {
  const { user } = useAuth();
  
  // Save data to both localStorage and Supabase
  const syncData = async () => {
    if (!user) {
      console.log('User not authenticated, storing in localStorage only');
      return;
    }
    
    try {
      // Local storage keys
      const localStoragePrefix = formType === 'dia-util' ? 'taskboard' : 
                                formType === 'dia-nao-util' ? 'taskboard-nao-util' : 
                                formType === 'final-mes-util' ? 'taskboard-final-mes-util' : 
                                'taskboard-final-mes-nao-util';
                                
      // Save to Supabase
      const taskboardData: TaskboardData = {
        user_id: user.id,
        form_type: formType,
        date,
        turn_data: turnData,
        tasks,
        table_rows: tableRows,
        active_tab: activeTab
      };
      
      await saveTaskboardData(taskboardData);
      
      // Also update localStorage as a fallback
      localStorage.setItem(`${localStoragePrefix}-date`, date);
      localStorage.setItem(`${localStoragePrefix}-turnData`, JSON.stringify(turnData));
      localStorage.setItem(`${localStoragePrefix}-tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${localStoragePrefix}-tableRows`, JSON.stringify(tableRows));
      if (activeTab) {
        localStorage.setItem(`${localStoragePrefix}-activeTab`, activeTab);
      }
    } catch (error) {
      console.error('Error synchronizing data:', error);
      toast({
        title: "Erro ao sincronizar dados",
        description: "Os dados foram salvos localmente, mas não puderam ser sincronizados com a nuvem.",
        variant: "destructive"
      });
    }
  };
  
  // Load data from Supabase first, then fall back to localStorage if needed
  const loadData = async () => {
    if (!user) {
      console.log('User not authenticated, using localStorage only');
      return null;
    }
    
    try {
      // Try to load from Supabase first
      const { data, error } = await loadTaskboardData(user.id, formType, date);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Data loaded from Supabase:', data);
        return data;
      }
      
      // If no data in Supabase, check localStorage
      const localStoragePrefix = formType === 'dia-util' ? 'taskboard' : 
                                formType === 'dia-nao-util' ? 'taskboard-nao-util' : 
                                formType === 'final-mes-util' ? 'taskboard-final-mes-util' : 
                                'taskboard-final-mes-nao-util';
                                
      const localDate = localStorage.getItem(`${localStoragePrefix}-date`);
      const localTurnData = localStorage.getItem(`${localStoragePrefix}-turnData`);
      const localTasks = localStorage.getItem(`${localStoragePrefix}-tasks`);
      const localTableRows = localStorage.getItem(`${localStoragePrefix}-tableRows`);
      const localActiveTab = localStorage.getItem(`${localStoragePrefix}-activeTab`);
      
      if (localDate && localTurnData && localTasks && localTableRows) {
        // Data exists in localStorage, sync it to Supabase
        const taskboardData: TaskboardData = {
          user_id: user.id,
          form_type: formType,
          date: localDate,
          turn_data: JSON.parse(localTurnData),
          tasks: JSON.parse(localTasks),
          table_rows: JSON.parse(localTableRows),
          active_tab: localActiveTab || undefined
        };
        
        await saveTaskboardData(taskboardData);
        return taskboardData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading synchronized data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar dados sincronizados. Usando dados locais.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Reset both localStorage and Supabase data
  const resetData = async () => {
    if (!user) {
      console.log('User not authenticated, clearing localStorage only');
      return;
    }
    
    try {
      // Clear data from Supabase
      await deleteTaskboardData(user.id, formType, date);
      
      // Clear data from localStorage
      const localStoragePrefix = formType === 'dia-util' ? 'taskboard' : 
                                formType === 'dia-nao-util' ? 'taskboard-nao-util' : 
                                formType === 'final-mes-util' ? 'taskboard-final-mes-util' : 
                                'taskboard-final-mes-nao-util';
                                
      localStorage.removeItem(`${localStoragePrefix}-date`);
      localStorage.removeItem(`${localStoragePrefix}-turnData`);
      localStorage.removeItem(`${localStoragePrefix}-tasks`);
      localStorage.removeItem(`${localStoragePrefix}-tableRows`);
      localStorage.removeItem(`${localStoragePrefix}-activeTab`);
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Erro ao redefinir dados",
        description: "Os dados locais foram limpos, mas pode haver resíduos na nuvem.",
        variant: "destructive"
      });
    }
  };
  
  return { syncData, loadData, resetData };
};
