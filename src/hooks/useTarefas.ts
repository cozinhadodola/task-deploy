import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string | null;
  prioridade: string | null;
  lista_id: string | null;
  responsavel: string | null;
  data_vencimento: string | null;
  lembrete_em: string | null;
  lembrete_enviado_em: string | null;
  notificado_em: string | null;
  periodicidade: string | null;
  dia_recorrencia: string | null;
  hora_recorrencia: string | null;
  tarefa_modelo_id: string | null;
  ordem: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export function useTarefas(listaId: string | null) {
  return useQuery({
    queryKey: ["tarefas", listaId],
    queryFn: async () => {
      let query = supabase
        .from("task_tarefas" as any)
        .select("*")
        .order("data_vencimento", { ascending: true, nullsFirst: false })
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (listaId) {
        query = query.eq("lista_id", listaId);
      } else {
        query = query.is("lista_id", null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Tarefa[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAllTarefas() {
  return useQuery({
    queryKey: ["tarefas", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_tarefas" as any)
        .select("*")
        .order("data_vencimento", { ascending: true, nullsFirst: false })
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as Tarefa[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tarefa: Partial<Tarefa> & { titulo: string }) => {
      const { data, error } = await supabase
        .from("task_tarefas" as any)
        .insert(tarefa as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });
}

export function useUpdateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tarefa> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_tarefas" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // Optimistic update: atualiza o cache imediatamente sem esperar a API
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: ["tarefas"] });
      const snapshots = qc.getQueriesData<Tarefa[]>({ queryKey: ["tarefas"] });
      qc.setQueriesData<Tarefa[]>({ queryKey: ["tarefas"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t) => t.id === newData.id ? { ...t, ...newData } : t);
      });
      return { snapshots };
    },
    onError: (_err, _vars, context: any) => {
      // Rollback em caso de erro
      context?.snapshots?.forEach(([queryKey, data]: any) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });
}

export function useDeleteTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_tarefas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });
}

export function useReorderTarefas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; ordem: number; lista_id?: string | null }[]) => {
      const promises = updates.map((u) =>
        supabase
          .from("task_tarefas" as any)
          .update({ ordem: u.ordem, ...(u.lista_id !== undefined ? { lista_id: u.lista_id } : {}) } as any)
          .eq("id", u.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });
}