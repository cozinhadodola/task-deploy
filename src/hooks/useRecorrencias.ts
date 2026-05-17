import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Recorrencia = {
  id: string;
  tarefa_modelo_id: string;
  tipo_recorrencia: "diaria" | "semanal" | "mensal" | "anual";
  quantidade_intervalo: number;
  hora_execucao: string | null;
  dia_semana: number[];
  dia_mes: number | null;
  mes_ano: number | null;
  somente_dia_util: boolean;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  created_at: string | null;
};

export function useAllRecorrencias() {
  return useQuery({
    queryKey: ["recorrencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_recorrencias" as any)
        .select("*");
      if (error) throw error;
      return (data as unknown) as Recorrencia[];
    },
  });
}

export function useRecorrenciaByTarefa(tarefaModeloId: string | null) {
  return useQuery({
    queryKey: ["recorrencias", tarefaModeloId],
    enabled: !!tarefaModeloId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_recorrencias" as any)
        .select("*")
        .eq("tarefa_modelo_id", tarefaModeloId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Recorrencia | null;
    },
  });
}

export function useCreateRecorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Omit<Recorrencia, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("task_recorrencias" as any)
        .insert(rec as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recorrencias"] });
      toast.success("Recorrência salva");
    },
    onError: () => {
      toast.error("Erro ao salvar recorrência");
    },
  });
}

export function useUpdateRecorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recorrencia> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_recorrencias" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recorrencias"] });
      toast.success("Recorrência salva");
    },
    onError: () => {
      toast.error("Erro ao salvar recorrência");
    },
  });
}

export function useDeleteRecorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_recorrencias" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recorrencias"] });
      toast.success("Recorrência removida");
    },
    onError: () => {
      toast.error("Erro ao remover recorrência");
    },
  });
}
