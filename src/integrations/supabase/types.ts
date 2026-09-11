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
      operators: {
        Row: {
          id: string
          value: string
          nome: string
          ativo: boolean
          papel: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          value: string
          nome: string
          ativo?: boolean
          papel?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          value?: string
          nome?: string
          ativo?: boolean
          papel?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cobrancas_retornos: {
        Row: {
          created_at: string
          data_aplicacao: string
          data_retorno_alterada_em: string | null
          data_retorno_alterada_por: string | null
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
          data_retorno_alterada_em?: string | null
          data_retorno_alterada_por?: string | null
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
          data_retorno_alterada_em?: string | null
          data_retorno_alterada_por?: string | null
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
      crc_tratamentos: {
        Row: {
          created_at: string
          estado: string
          falhas: number
          id: string
          iniciado_em: string
          parametros: Json
          processados: number
          resumo: string | null
          terminado_em: string | null
          tipo: string
          total_registos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          falhas?: number
          id?: string
          iniciado_em?: string
          parametros?: Json
          processados?: number
          resumo?: string | null
          terminado_em?: string | null
          tipo?: string
          total_registos?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          estado?: string
          falhas?: number
          id?: string
          iniciado_em?: string
          parametros?: Json
          processados?: number
          resumo?: string | null
          terminado_em?: string | null
          tipo?: string
          total_registos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_renewal_sessions: {
        Row: {
          created_at: string
          estado: string
          id: string
          nome: string
          proximo_lote: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          nome: string
          proximo_lote?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          nome?: string
          proximo_lote?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_renewal_cards: {
        Row: {
          balcao: string
          created_at: string
          dados: Json
          id: string
          lote_numero: number | null
          nome_titular: string | null
          numero_cartao: string
          posicao: number
          session_id: string
        }
        Insert: {
          balcao: string
          created_at?: string
          dados?: Json
          id?: string
          lote_numero?: number | null
          nome_titular?: string | null
          numero_cartao: string
          posicao?: number
          session_id: string
        }
        Update: {
          balcao?: string
          created_at?: string
          dados?: Json
          id?: string
          lote_numero?: number | null
          nome_titular?: string | null
          numero_cartao?: string
          posicao?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_renewal_cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "card_renewal_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      card_renewal_lotes: {
        Row: {
          balcoes: string[]
          created_at: string
          criado_por: string | null
          ficheiro_nome: string
          id: string
          numero: number
          session_id: string
          total_cartoes: number
        }
        Insert: {
          balcoes: string[]
          created_at?: string
          criado_por?: string | null
          ficheiro_nome: string
          id?: string
          numero: number
          session_id: string
          total_cartoes: number
        }
        Update: {
          balcoes?: string[]
          created_at?: string
          criado_por?: string | null
          ficheiro_nome?: string
          id?: string
          numero?: number
          session_id?: string
          total_cartoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_renewal_lotes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "card_renewal_sessions"
            referencedColumns: ["id"]
          }
        ]
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
      handover_notes: {
        Row: {
          autor_nome: string | null
          autor_user_id: string | null
          created_at: string
          date: string
          id: string
          lida_em: string | null
          lida_por: string | null
          lida_por_nome: string | null
          nota: string
          turno: string
          updated_at: string
        }
        Insert: {
          autor_nome?: string | null
          autor_user_id?: string | null
          created_at?: string
          date: string
          id?: string
          lida_em?: string | null
          lida_por?: string | null
          lida_por_nome?: string | null
          nota?: string
          turno: string
          updated_at?: string
        }
        Update: {
          autor_nome?: string | null
          autor_user_id?: string | null
          created_at?: string
          date?: string
          id?: string
          lida_em?: string | null
          lida_por?: string | null
          lida_por_nome?: string | null
          nota?: string
          turno?: string
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
          tapes_anexada_at: string | null
          tapes_anexada_by: string | null
          tapes_evidencia: Json
          tapes_status: string
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
          tapes_anexada_at?: string | null
          tapes_anexada_by?: string | null
          tapes_evidencia?: Json
          tapes_status?: string
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
          tapes_anexada_at?: string | null
          tapes_anexada_by?: string | null
          tapes_evidencia?: Json
          tapes_status?: string
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
          tipo: string | null
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
          tipo?: string | null
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
          tipo?: string | null
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
      claim_operator: {
        Args: { operator_value: string }
        Returns: undefined
      }
      criar_lote_renovacao: {
        Args: {
          p_session_id: string
          p_balcoes: string[]
          p_nome_base: string
          p_limite?: number
        }
        Returns: { lote_numero: number; numero_cartao: string; balcao: string }[]
      }
      concluir_sessao_renovacao: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      operator_has_pin: {
        Args: Record<string, never>
        Returns: boolean
      }
      set_operator_pin: {
        Args: { new_pin: string }
        Returns: undefined
      }
      set_tapes_evidencia: {
        Args: { taskboard_id: string; evidencia: Json }
        Returns: undefined
      }
      change_operator_pin: {
        Args: { current_pin: string; new_pin: string }
        Returns: boolean
      }
      verify_operator_pin: {
        Args: { pin: string }
        Returns: boolean
      }
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
