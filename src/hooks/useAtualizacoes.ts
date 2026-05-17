import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Atualizacao = {
  id: string;
  tarefa_id: string;
  descricao: string;
  data_registro: string;
  created_at: string | null;
};

export function useAtualizacoes(tarefaId: string | null) {
  return useQuery({
    queryKey: ["atualizacoes", tarefaId],
    enabled: !!tarefaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_atualizacoes" as any)
        .select("*")
        .eq("tarefa_id", tarefaId!)
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return (data as unknown) as Atualizacao[];
    },
  });
}

export function useCreateAtualizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (atualizacao: { tarefa_id: string; descricao: string; data_registro?: string }) => {
      const { data, error } = await supabase
        .from("task_atualizacoes" as any)
        .insert(atualizacao as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["atualizacoes", variables.tarefa_id] });
    },
  });
}

export function useDeleteAtualizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tarefaId }: { id: string; tarefaId: string }) => {
      const { error } = await supabase.from("task_atualizacoes" as any).delete().eq("id", id);
      if (error) throw error;
      return tarefaId;
    },
    onSuccess: (tarefaId) => {
      qc.invalidateQueries({ queryKey: ["atualizacoes", tarefaId] });
    },
  });
}
