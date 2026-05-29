import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Responsavel = {
  id: string;
  nome: string;
  telefone: string | null;
  waha_pn: string | null;
  waha_lid: string | null;
  waha_verificado: boolean | null;
  created_at: string | null;
};

export function useResponsaveis() {
  return useQuery({
    queryKey: ["responsaveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_responsaveis" as any)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data as unknown) as Responsavel[];
    },
  });
}

export function useCreateResponsavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; telefone?: string | null; waha_pn?: string | null; waha_lid?: string | null; waha_verificado?: boolean }) => {
      const { data, error } = await supabase
        .from("task_responsaveis" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["responsaveis"] }),
  });
}

export function useUpdateResponsavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Responsavel> & { id: string }) => {
      const { data, error } = await supabase
        .from("task_responsaveis" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["responsaveis"] }),
  });
}

export function useDeleteResponsavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_responsaveis" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["responsaveis"] }),
  });
}
