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
      analisis_semanticos: {
        Row: {
          candidatos_enviados: Json
          created_at: string
          ejecucion_id: string
          error_mensaje: string | null
          estado: Database["public"]["Enums"]["semantico_estado"]
          id: string
          modelo: string
          prompt_version: string
          respuesta_cruda: string | null
          respuesta_validada: Json | null
          updated_at: string
        }
        Insert: {
          candidatos_enviados?: Json
          created_at?: string
          ejecucion_id: string
          error_mensaje?: string | null
          estado: Database["public"]["Enums"]["semantico_estado"]
          id?: string
          modelo: string
          prompt_version: string
          respuesta_cruda?: string | null
          respuesta_validada?: Json | null
          updated_at?: string
        }
        Update: {
          candidatos_enviados?: Json
          created_at?: string
          ejecucion_id?: string
          error_mensaje?: string | null
          estado?: Database["public"]["Enums"]["semantico_estado"]
          id?: string
          modelo?: string
          prompt_version?: string
          respuesta_cruda?: string | null
          respuesta_validada?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_semanticos_ejecucion_id_fkey"
            columns: ["ejecucion_id"]
            isOneToOne: false
            referencedRelation: "ejecuciones"
            referencedColumns: ["id"]
          },
        ]
      }
      bandas_salariales: {
        Row: {
          cargo_id: string
          created_at: string
          id: string
          p25: number | null
          p50: number | null
          p75: number | null
          promedio: number | null
          tipo_empresa: Database["public"]["Enums"]["empresa_tipo"]
          updated_at: string
        }
        Insert: {
          cargo_id: string
          created_at?: string
          id?: string
          p25?: number | null
          p50?: number | null
          p75?: number | null
          promedio?: number | null
          tipo_empresa: Database["public"]["Enums"]["empresa_tipo"]
          updated_at?: string
        }
        Update: {
          cargo_id?: string
          created_at?: string
          id?: string
          p25?: number | null
          p50?: number | null
          p75?: number | null
          promedio?: number | null
          tipo_empresa?: Database["public"]["Enums"]["empresa_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bandas_salariales_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          atributos_semanticos: Json
          codigo_area: string | null
          codigo_cargo: string | null
          codigo_nivel_jerarquico: string | null
          codigo_subarea: string | null
          descripcion: string | null
          empresa_id: string
          experiencia_requerida: string | null
          id: string
          nivel_jerarquico: string | null
          nombre: string
          nombre_area: string | null
          nombre_subarea: string | null
          requisitos_formacion: string | null
          sueldo: number | null
          tipo: Database["public"]["Enums"]["cargo_tipo"]
        }
        Insert: {
          atributos_semanticos?: Json
          codigo_area?: string | null
          codigo_cargo?: string | null
          codigo_nivel_jerarquico?: string | null
          codigo_subarea?: string | null
          descripcion?: string | null
          empresa_id: string
          experiencia_requerida?: string | null
          id?: string
          nivel_jerarquico?: string | null
          nombre: string
          nombre_area?: string | null
          nombre_subarea?: string | null
          requisitos_formacion?: string | null
          sueldo?: number | null
          tipo: Database["public"]["Enums"]["cargo_tipo"]
        }
        Update: {
          atributos_semanticos?: Json
          codigo_area?: string | null
          codigo_cargo?: string | null
          codigo_nivel_jerarquico?: string | null
          codigo_subarea?: string | null
          descripcion?: string | null
          empresa_id?: string
          experiencia_requerida?: string | null
          id?: string
          nivel_jerarquico?: string | null
          nombre?: string
          nombre_area?: string | null
          nombre_subarea?: string | null
          requisitos_formacion?: string | null
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
          campo: Database["public"]["Enums"]["criterio_campo"]
          id: string
          nombre: string
          obligatorio: boolean
          peso: number
        }
        Insert: {
          activo?: boolean
          campo?: Database["public"]["Enums"]["criterio_campo"]
          id?: string
          nombre: string
          obligatorio?: boolean
          peso?: number
        }
        Update: {
          activo?: boolean
          campo?: Database["public"]["Enums"]["criterio_campo"]
          id?: string
          nombre?: string
          obligatorio?: boolean
          peso?: number
        }
        Relationships: []
      }
      diccionario_entradas: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["diccionario_tipo"]
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["diccionario_tipo"]
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["diccionario_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      ejecuciones: {
        Row: {
          cargo_id: string
          criterios_usados: Json
          estado: Database["public"]["Enums"]["ejecucion_estado"]
          fecha: string
          id: string
        }
        Insert: {
          cargo_id: string
          criterios_usados?: Json
          estado?: Database["public"]["Enums"]["ejecucion_estado"]
          fecha?: string
          id?: string
        }
        Update: {
          cargo_id?: string
          criterios_usados?: Json
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
          tamano: Database["public"]["Enums"]["empresa_tipo"] | null
          tipo: Database["public"]["Enums"]["empresa_tipo"]
        }
        Insert: {
          id?: string
          nombre: string
          tamano?: Database["public"]["Enums"]["empresa_tipo"] | null
          tipo: Database["public"]["Enums"]["empresa_tipo"]
        }
        Update: {
          id?: string
          nombre?: string
          tamano?: Database["public"]["Enums"]["empresa_tipo"] | null
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
      criterio_campo:
        | "nombre"
        | "descripcion"
        | "area"
        | "subarea"
        | "codigo_cargo"
        | "nivel_jerarquico"
        | "experiencia"
        | "requisitos"
        | "tipo_empresa"
      diccionario_tipo: "AREA" | "SUBAREA" | "NIVEL"
      ejecucion_estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADA" | "ERROR"
      empresa_tipo: "P" | "M" | "G"
      semantico_estado: "OK" | "ERROR"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      criterio_campo: [
        "nombre",
        "descripcion",
        "area",
        "subarea",
        "codigo_cargo",
        "nivel_jerarquico",
        "experiencia",
        "requisitos",
        "tipo_empresa",
      ],
      diccionario_tipo: ["AREA", "SUBAREA", "NIVEL"],
      ejecucion_estado: ["PENDIENTE", "EN_PROCESO", "COMPLETADA", "ERROR"],
      empresa_tipo: ["P", "M", "G"],
      semantico_estado: ["OK", "ERROR"],
    },
  },
} as const
