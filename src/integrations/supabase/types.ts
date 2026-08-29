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
      admin_config: {
        Row: {
          id: number
          senha_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          senha_hash: string
          updated_at?: string
        }
        Update: {
          id?: number
          senha_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          ativo: boolean
          cpf: string
          created_at: string
          curso: string
          dias_semana: string[]
          email: string | null
          endereco: string | null
          id: string
          inicio_aulas: string | null
          instituicao: string
          matricula: string
          nascimento: string | null
          nome: string
          rg: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf: string
          created_at?: string
          curso: string
          dias_semana?: string[]
          email?: string | null
          endereco?: string | null
          id?: string
          inicio_aulas?: string | null
          instituicao: string
          matricula: string
          nascimento?: string | null
          nome: string
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf?: string
          created_at?: string
          curso?: string
          dias_semana?: string[]
          email?: string | null
          endereco?: string | null
          id?: string
          inicio_aulas?: string | null
          instituicao?: string
          matricula?: string
          nascimento?: string | null
          nome?: string
          rg?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assentos: {
        Row: {
          created_at: string
          id: string
          numero: number
          onibus_id: string
          solicitacao_id: string
          trecho: string
          viagem_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          numero: number
          onibus_id: string
          solicitacao_id: string
          trecho: string
          viagem_id: string
        }
        Update: {
          created_at?: string
          id?: string
          numero?: number
          onibus_id?: string
          solicitacao_id?: string
          trecho?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assentos_onibus_id_fkey"
            columns: ["onibus_id"]
            isOneToOne: false
            referencedRelation: "onibus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assentos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assentos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          ator: string
          criado_em: string
          detalhes: Json
          entidade: string
          entidade_id: string | null
          id: string
        }
        Insert: {
          acao: string
          ator: string
          criado_em?: string
          detalhes?: Json
          entidade: string
          entidade_id?: string | null
          id?: string
        }
        Update: {
          acao?: string
          ator?: string
          criado_em?: string
          detalhes?: Json
          entidade?: string
          entidade_id?: string | null
          id?: string
        }
        Relationships: []
      }
      onibus: {
        Row: {
          ativo: boolean
          capacidade: number
          codigo: string
          descricao_rota: string | null
          hora_ida: string
          hora_volta: string
          id: string
          nome: string
          ordem: number
          rota: string | null
        }
        Insert: {
          ativo?: boolean
          capacidade?: number
          codigo: string
          descricao_rota?: string | null
          hora_ida: string
          hora_volta: string
          id?: string
          nome: string
          ordem?: number
          rota?: string | null
        }
        Update: {
          ativo?: boolean
          capacidade?: number
          codigo?: string
          descricao_rota?: string | null
          hora_ida?: string
          hora_volta?: string
          id?: string
          nome?: string
          ordem?: number
          rota?: string | null
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          aluno_id: string
          cancelada_em: string | null
          created_at: string
          id: string
          onibus_ida_id: string | null
          onibus_volta_id: string | null
          poltrona_ida: number | null
          poltrona_volta: number | null
          status: string
          tipo: string
          updated_at: string
          viagem_id: string
        }
        Insert: {
          aluno_id: string
          cancelada_em?: string | null
          created_at?: string
          id?: string
          onibus_ida_id?: string | null
          onibus_volta_id?: string | null
          poltrona_ida?: number | null
          poltrona_volta?: number | null
          status?: string
          tipo: string
          updated_at?: string
          viagem_id: string
        }
        Update: {
          aluno_id?: string
          cancelada_em?: string | null
          created_at?: string
          id?: string
          onibus_ida_id?: string | null
          onibus_volta_id?: string | null
          poltrona_ida?: number | null
          poltrona_volta?: number | null
          status?: string
          tipo?: string
          updated_at?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_onibus_ida_id_fkey"
            columns: ["onibus_ida_id"]
            isOneToOne: false
            referencedRelation: "onibus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_onibus_volta_id_fkey"
            columns: ["onibus_volta_id"]
            isOneToOne: false
            referencedRelation: "onibus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_login: {
        Row: {
          chave: string
          criado_em: string
          escopo: string
          id: string
          sucesso: boolean
        }
        Insert: {
          chave: string
          criado_em?: string
          escopo: string
          id?: string
          sucesso?: boolean
        }
        Update: {
          chave?: string
          criado_em?: string
          escopo?: string
          id?: string
          sucesso?: boolean
        }
        Relationships: []
      }
      viagens: {
        Row: {
          abertura_em: string
          created_at: string
          data: string
          fechamento_em: string
          id: string
          status: string
        }
        Insert: {
          abertura_em: string
          created_at?: string
          data: string
          fechamento_em: string
          id?: string
          status?: string
        }
        Update: {
          abertura_em?: string
          created_at?: string
          data?: string
          fechamento_em?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      alterar_senha_admin: { Args: { p_senha: string }; Returns: undefined }
      cancelar_transporte: {
        Args: { p_aluno: string; p_viagem: string }
        Returns: undefined
      }
      encerrar_viagens_passadas: { Args: never; Returns: number }
      ocupacao_viagem: {
        Args: { p_viagem: string }
        Returns: {
          capacidade: number
          codigo: string
          descricao_rota: string
          hora_ida: string
          hora_volta: string
          nome: string
          ocupados_ida: number
          ocupados_volta: number
          onibus_id: string
          rota: string
        }[]
      }
      proxima_poltrona: {
        Args: {
          p_onibus: string
          p_preferida: number
          p_trecho: string
          p_viagem: string
        }
        Returns: number
      }
      registrar_auditoria: {
        Args: {
          p_acao: string
          p_ator: string
          p_detalhes: Json
          p_entidade: string
          p_entidade_id: string
        }
        Returns: undefined
      }
      registrar_tentativa: {
        Args: { p_chave: string; p_escopo: string; p_sucesso: boolean }
        Returns: undefined
      }
      reservar_transporte: {
        Args: {
          p_aluno: string
          p_onibus_ida: string
          p_onibus_volta: string
          p_tipo: string
          p_viagem: string
        }
        Returns: Json
      }
      tentativas_recentes: {
        Args: { p_chave: string; p_escopo: string; p_minutos: number }
        Returns: number
      }
      verificar_senha_admin: { Args: { p_senha: string }; Returns: boolean }
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
