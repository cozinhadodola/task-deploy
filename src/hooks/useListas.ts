import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Lista = {
  id: string;
  nome: string;
  ordem: number | null;
  created_at: string | null;
  waha_session: string | null;
};

export const WAHA_SESSIONS = [
  "cozinha01",
  "cozinha02",
  "cozinha03",
  "cozinha04",
  "andredola",
  "Usiminas",
];

export function useListas() {
  return useQuery({
    queryKey: ["listas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_listas" as any)
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown) as Lista[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateLista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("task_listas" as any)
        .insert({ nome, owner_id: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listas"] }),
  });
}

export function useUpdateLista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, waha_session }: { id: string; waha_session: string | null }) => {
      const { error } = await supabase
        .from("task_listas" as any)
        .update({ waha_session } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listas"] }),
  });
}

export function useDeleteLista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_listas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listas"] }),
  });
}

export function useReorderListas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from("task_listas" as any).update({ ordem: index } as any).eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listas"] }),
  });
}
