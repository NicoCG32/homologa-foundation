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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cargos: {
        Row: {
          descripcion: string | null
          empresa_id: string
          id: string
          nombre: string
          sueldo: number | null
          tipo: Database["public"]["Enums"]["cargo_tipo"]
        }
        Insert: {
          descripcion?: string | null
          empresa_id: string
          id?: string
          nombre: string
          sueldo?: number | null
          tipo: Database["public"]["Enums"]["cargo_tipo"]
        }
        Update: {
          descripcion?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
          sueldo?: number | null
          tipo?: Database["public"]["Enums"]["cargo_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "cargos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      criterios: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          peso: number
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          peso?: number
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          peso?: number
        }
        Relationships: []
      }
      ejecuciones: {
        Row: {
          cargo_id: string
          estado: Database["public"]["Enums"]["ejecucion_estado"]
          fecha: string
          id: string
        }
        Insert: {
          cargo_id: string
          estado?: Database["public"]["Enums"]["ejecucion_estado"]
          fecha?: string
          id?: string
        }
        Update: {
          cargo_id?: string
          estado?: Database["public"]["Enums"]["ejecucion_estado"]
          fecha?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecuciones_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["empresa_tipo"]
        }
        Insert: {
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["empresa_tipo"]
        }
        Update: {
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["empresa_tipo"]
        }
        Relationships: []
      }
      resultados: {
        Row: {
          candidato_id: string
          ejecucion_id: string
          id: string
          score_deterministico: number | null
          score_final: number | null
          score_semantico: number | null
        }
        Insert: {
          candidato_id: string
          ejecucion_id: string
          id?: string
          score_deterministico?: number | null
          score_final?: number | null
          score_semantico?: number | null
        }
        Update: {
          candidato_id?: string
          ejecucion_id?: string
          id?: string
          score_deterministico?: number | null
          score_final?: number | null
          score_semantico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_ejecucion_id_fkey"
            columns: ["ejecucion_id"]
            isOneToOne: false
            referencedRelation: "ejecuciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cargo_tipo: "INTERNO" | "REFERENCIA"
      ejecucion_estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "ERROR"
      empresa_tipo: "P" | "M" | "G"
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
    Enums: {
      cargo_tipo: ["INTERNO", "REFERENCIA"],
      ejecucion_estado: ["PENDIENTE", "EN_PROCESO", "COMPLETADA", "ERROR"],
      empresa_tipo: ["P", "M", "G"],
    },
  },
} as const
