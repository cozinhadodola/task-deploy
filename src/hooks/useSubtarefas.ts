import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Subtarefa = {
  id: string;
  tarefa_id: string | null;
  titulo: string | null;
  status: string | null;
  ordem: number | null;
  created_at: string | null;
};

export function useSubtarefas(tarefaId: string | null) {
  return useQuery({
    queryKey: ["subtarefas", tarefaId],
    enabled: !!tarefaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_subtarefas" as any)
        .select("*")
        .eq("tarefa_id", tarefaId!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data as unknown) as Subtarefa[];
    },
  });
}

export function useCreateSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Partial<Subtarefa> & { tarefa_id: string }) => {
      const { data, error } = await supabase
        .from("task_subtarefas" as any)
        .insert(sub as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtarefas"] }),
  });
}

export function useUpdateSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subtarefa> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_subtarefas" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtarefas"] }),
  });
}

export function useDeleteSubtarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_subtarefas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtarefas"] }),
  });
}
