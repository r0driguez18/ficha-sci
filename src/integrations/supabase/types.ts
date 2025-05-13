export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      shift_maps: {
        Row: {
          content: Json
          file_name: string
          file_size: number
          id: string
          uploaded_at: string | null
        }
        Insert: {
          content: Json
          file_name: string
          file_size: number
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          content?: Json
          file_name?: string
          file_size?: number
          id?: string
          uploaded_at?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
