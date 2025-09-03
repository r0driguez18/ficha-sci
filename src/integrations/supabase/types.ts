export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cobrancas_retornos: {
        Row: {
          created_at: string
          data_aplicacao: string
          data_retorno_enviado: string | null
          data_retorno_esperada: string
          ficheiro_nome: string
          id: string
          observacoes: string | null
          retorno_enviado: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_aplicacao: string
          data_retorno_enviado?: string | null
          data_retorno_esperada: string
          ficheiro_nome: string
          id?: string
          observacoes?: string | null
          retorno_enviado?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_aplicacao?: string
          data_retorno_enviado?: string | null
          data_retorno_esperada?: string
          ficheiro_nome?: string
          id?: string
          observacoes?: string | null
          retorno_enviado?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_alerts: {
        Row: {
          alert_name: string
          alert_time: string
          created_at: string
          days_of_week: Json
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alert_name: string
          alert_time: string
          created_at?: string
          days_of_week?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alert_name?: string
          alert_time?: string
          created_at?: string
          days_of_week?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      exported_taskboards: {
        Row: {
          created_at: string
          date: string
          exported_at: string
          file_name: string
          form_type: string
          id: string
          pdf_signature: Json
          table_rows: Json
          tasks: Json
          turn_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          exported_at?: string
          file_name: string
          form_type: string
          id?: string
          pdf_signature: Json
          table_rows: Json
          tasks: Json
          turn_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          exported_at?: string
          file_name?: string
          form_type?: string
          id?: string
          pdf_signature?: Json
          table_rows?: Json
          tasks?: Json
          turn_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_processes: {
        Row: {
          as400_name: string | null
          created_at: string | null
          date_registered: string
          executed_by: string | null
          id: string
          is_salary: boolean | null
          operation_number: string | null
          task: string
          time_registered: string
        }
        Insert: {
          as400_name?: string | null
          created_at?: string | null
          date_registered?: string
          executed_by?: string | null
          id?: string
          is_salary?: boolean | null
          operation_number?: string | null
          task: string
          time_registered: string
        }
        Update: {
          as400_name?: string | null
          created_at?: string | null
          date_registered?: string
          executed_by?: string | null
          id?: string
          is_salary?: boolean | null
          operation_number?: string | null
          task?: string
          time_registered?: string
        }
        Relationships: []
      }
      taskboard_data: {
        Row: {
          active_tab: string | null
          created_at: string | null
          date: string
          form_type: string
          id: string
          table_rows: Json
          tasks: Json
          turn_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_tab?: string | null
          created_at?: string | null
          date: string
          form_type: string
          id?: string
          table_rows: Json
          tasks: Json
          turn_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_tab?: string | null
          created_at?: string | null
          date?: string
          form_type?: string
          id?: string
          table_rows?: Json
          tasks?: Json
          turn_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      salary_processes: {
        Row: {
          as400_name: string | null
          created_at: string | null
          date_registered: string | null
          executed_by: string | null
          id: string | null
          is_salary: boolean | null
          operation_number: string | null
          task: string | null
          time_registered: string | null
        }
        Insert: {
          as400_name?: string | null
          created_at?: string | null
          date_registered?: string | null
          executed_by?: string | null
          id?: string | null
          is_salary?: boolean | null
          operation_number?: string | null
          task?: string | null
          time_registered?: string | null
        }
        Update: {
          as400_name?: string | null
          created_at?: string | null
          date_registered?: string | null
          executed_by?: string | null
          id?: string | null
          is_salary?: boolean | null
          operation_number?: string | null
          task?: string | null
          time_registered?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
