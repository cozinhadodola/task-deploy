import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Permissao = "leitura" | "edicao";

export interface ListaPermissao {
  id: string;
  lista_id: string;
  user_id: string;
  permissao: Permissao;
  profiles: { email: string; name: string | null } | null;
}

export function useListaPermissoes(listaId: string | null) {
  return useQuery({
    queryKey: ["lista_permissoes", listaId],
    enabled: !!listaId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("task_lista_permissoes")
        .select("*, profiles(email, name)")
        .eq("lista_id", listaId);
      if (error) throw error;
      return (data ?? []) as ListaPermissao[];
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current_user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}

export function useListaOwner(listaId: string | null) {
  return useQuery({
    queryKey: ["lista_owner", listaId],
    enabled: !!listaId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("task_listas")
        .select("owner_id")
        .eq("id", listaId)
        .single();
      if (error) throw error;
      return data?.owner_id as string | null;
    },
  });
}

export function useAddPermissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listaId, email, permissao }: { listaId: string; email: string; permissao: Permissao }) => {
      // Find user by email via profiles
      const { data: profile, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      if (profileError || !profile) throw new Error("Usuário não encontrado com esse e-mail.");

      const { error } = await (supabase as any)
        .from("task_lista_permissoes")
        .upsert({ lista_id: listaId, user_id: profile.id, permissao }, { onConflict: "lista_id,user_id" });
      if (error) throw error;
    },
    onSuccess: (_data, { listaId }) => {
      qc.invalidateQueries({ queryKey: ["lista_permissoes", listaId] });
    },
  });
}

export function useUpdatePermissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, listaId, permissao }: { id: string; listaId: string; permissao: Permissao }) => {
      const { error } = await (supabase as any)
        .from("task_lista_permissoes")
        .update({ permissao })
        .eq("id", id);
      if (error) throw error;
      return listaId;
    },
    onSuccess: (_data, { listaId }) => {
      qc.invalidateQueries({ queryKey: ["lista_permissoes", listaId] });
    },
  });
}

export function useRemovePermissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, listaId }: { id: string; listaId: string }) => {
      const { error } = await (supabase as any)
        .from("task_lista_permissoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return listaId;
    },
    onSuccess: (_data, { listaId }) => {
      qc.invalidateQueries({ queryKey: ["lista_permissoes", listaId] });
    },
  });
}
