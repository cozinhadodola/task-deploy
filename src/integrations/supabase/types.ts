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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      receitas: {
        Row: {
          categoria: string | null
          cozinha: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          ingredientes: string | null
          link_original: string | null
          modo_preparo: string | null
          nota: number | null
          porcoes: string | null
          tempo_preparo: string | null
          tipo_carne: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          cozinha?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ingredientes?: string | null
          link_original?: string | null
          modo_preparo?: string | null
          nota?: number | null
          porcoes?: string | null
          tempo_preparo?: string | null
          tipo_carne?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          cozinha?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          ingredientes?: string | null
          link_original?: string | null
          modo_preparo?: string | null
          nota?: number | null
          porcoes?: string | null
          tempo_preparo?: string | null
          tipo_carne?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_atualizacoes: {
        Row: {
          created_at: string | null
          data_registro: string
          descricao: string
          id: string
          tarefa_id: string
        }
        Insert: {
          created_at?: string | null
          data_registro?: string
          descricao: string
          id?: string
          tarefa_id: string
        }
        Update: {
          created_at?: string | null
          data_registro?: string
          descricao?: string
          id?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_atualizacoes_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "task_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_listas: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      task_recorrencias: {
        Row: {
          ativo: boolean
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          dia_mes: number | null
          dia_semana: number[] | null
          hora_execucao: string | null
          id: string
          mes_ano: number | null
          quantidade_intervalo: number
          somente_dia_util: boolean
          tarefa_modelo_id: string
          tipo_recorrencia: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          dia_mes?: number | null
          dia_semana?: number[] | null
          hora_execucao?: string | null
          id?: string
          mes_ano?: number | null
          quantidade_intervalo?: number
          somente_dia_util?: boolean
          tarefa_modelo_id: string
          tipo_recorrencia: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          dia_mes?: number | null
          dia_semana?: number[] | null
          hora_execucao?: string | null
          id?: string
          mes_ano?: number | null
          quantidade_intervalo?: number
          somente_dia_util?: boolean
          tarefa_modelo_id?: string
          tipo_recorrencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_recorrencias_tarefa_modelo_id_fkey"
            columns: ["tarefa_modelo_id"]
            isOneToOne: false
            referencedRelation: "task_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_responsaveis: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      task_subtarefas: {
        Row: {
          created_at: string | null
          id: string
          ordem: number | null
          status: string | null
          tarefa_id: string | null
          titulo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordem?: number | null
          status?: string | null
          tarefa_id?: string | null
          titulo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ordem?: number | null
          status?: string | null
          tarefa_id?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_subtarefas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "task_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tarefas: {
        Row: {
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          dia_recorrencia: string | null
          hora_recorrencia: string | null
          id: string
          lista_id: string | null
          ordem: number | null
          periodicidade: string | null
          prioridade: string | null
          responsavel: string | null
          status: string | null
          tarefa_modelo_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          dia_recorrencia?: string | null
          hora_recorrencia?: string | null
          id?: string
          lista_id?: string | null
          ordem?: number | null
          periodicidade?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          tarefa_modelo_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          dia_recorrencia?: string | null
          hora_recorrencia?: string | null
          id?: string
          lista_id?: string | null
          ordem?: number | null
          periodicidade?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          tarefa_modelo_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_tarefas_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "task_listas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tarefas_tarefa_modelo_id_fkey"
            columns: ["tarefa_modelo_id"]
            isOneToOne: false
            referencedRelation: "task_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_evolucao: {
        Row: {
          braco: number | null
          cintura: number | null
          data_registro: string | null
          foto_progresso: string | null
          gordura_corporal: number | null
          id: string
          peito: number | null
          perna: number | null
          peso: number | null
          usuario_id: string | null
        }
        Insert: {
          braco?: number | null
          cintura?: number | null
          data_registro?: string | null
          foto_progresso?: string | null
          gordura_corporal?: number | null
          id?: string
          peito?: number | null
          perna?: number | null
          peso?: number | null
          usuario_id?: string | null
        }
        Update: {
          braco?: number | null
          cintura?: number | null
          data_registro?: string | null
          foto_progresso?: string | null
          gordura_corporal?: number | null
          id?: string
          peito?: number | null
          perna?: number | null
          peso?: number | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_evolucao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_relatorio_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "treino_evolucao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_exercicio: {
        Row: {
          created_at: string | null
          equipamento: string | null
          foto_url: string | null
          grupo_muscular: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string | null
          equipamento?: string | null
          foto_url?: string | null
          grupo_muscular?: string | null
          id?: string
          nome?: string | null
        }
        Update: {
          created_at?: string | null
          equipamento?: string | null
          foto_url?: string | null
          grupo_muscular?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      treino_plano: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dia_semana: number | null
          id: string
          nome: string | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dia_semana?: number | null
          id?: string
          nome?: string | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dia_semana?: number | null
          id?: string
          nome?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_plano_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_relatorio_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "treino_plano_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_plano_exercicio: {
        Row: {
          carga_sugerida: number | null
          descanso_segundos: number | null
          exercicio_id: string | null
          id: string
          observacoes: string | null
          ordem: number | null
          plano_id: string | null
          repeticoes: string | null
          series: number | null
        }
        Insert: {
          carga_sugerida?: number | null
          descanso_segundos?: number | null
          exercicio_id?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_id?: string | null
          repeticoes?: string | null
          series?: number | null
        }
        Update: {
          carga_sugerida?: number | null
          descanso_segundos?: number | null
          exercicio_id?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number | null
          plano_id?: string | null
          repeticoes?: string | null
          series?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_plano_exercicio_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "treino_exercicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treino_plano_exercicio_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "treino_plano"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_sessao: {
        Row: {
          data_treino: string | null
          duracao_minutos: number | null
          id: string
          nota_treino: number | null
          observacoes: string | null
          plano_id: string | null
          usuario_id: string | null
        }
        Insert: {
          data_treino?: string | null
          duracao_minutos?: number | null
          id?: string
          nota_treino?: number | null
          observacoes?: string | null
          plano_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          data_treino?: string | null
          duracao_minutos?: number | null
          id?: string
          nota_treino?: number | null
          observacoes?: string | null
          plano_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_sessao_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "treino_plano"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treino_sessao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_relatorio_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "treino_sessao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "treino_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_sessao_exercicio: {
        Row: {
          concluido: boolean | null
          exercicio_id: string | null
          foto_execucao: string | null
          id: string
          peso_utilizado: number | null
          repeticoes_realizadas: string | null
          sessao_id: string | null
        }
        Insert: {
          concluido?: boolean | null
          exercicio_id?: string | null
          foto_execucao?: string | null
          id?: string
          peso_utilizado?: number | null
          repeticoes_realizadas?: string | null
          sessao_id?: string | null
        }
        Update: {
          concluido?: boolean | null
          exercicio_id?: string | null
          foto_execucao?: string | null
          id?: string
          peso_utilizado?: number | null
          repeticoes_realizadas?: string | null
          sessao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_sessao_exercicio_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "treino_exercicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treino_sessao_exercicio_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "treino_sessao"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_usuario: {
        Row: {
          altura: number | null
          auth_user_id: string | null
          created_at: string | null
          id: string
          idade: number | null
          nome: string | null
          objetivo: string | null
          peso_inicial: number | null
        }
        Insert: {
          altura?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          objetivo?: string | null
          peso_inicial?: number | null
        }
        Update: {
          altura?: number | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          objetivo?: string | null
          peso_inicial?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      treino_relatorio_usuario: {
        Row: {
          media_nota: number | null
          total_treinos: number | null
          ultimo_treino: string | null
          usuario_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      priority_level: "baixa" | "média" | "alta"
      recurrence_type: "diária" | "semanal" | "mensal" | "anual" | "quinzenal"
      status_type: "Não iniciado" | "Em andamento" | "Atrasado" | "Pausado"
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
      priority_level: ["baixa", "média", "alta"],
      recurrence_type: ["diária", "semanal", "mensal", "anual", "quinzenal"],
      status_type: ["Não iniciado", "Em andamento", "Atrasado", "Pausado"],
    },
  },
} as const
