import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cachedInitial, writeCache } from "@/lib/localCache";

// Normaliza a grafia do status vinda do banco para um valor canônico.
// A coluna é texto livre e historicamente acumulou variantes (ex.: "concluido"
// sem acento). Como o app compara com "concluído" (com acento), qualquer variante
// não normalizada apareceria como card ativo "fantasma" no quadro.
export function normStatus(v: string | null | undefined): string | null {
  if (v == null) return v;
  const s = String(v).trim().toLowerCase();
  if (["concluido", "concluído", "concluida", "concluída", "feito", "done"].includes(s)) return "concluído";
  if (["em andamento", "andamento", "em-andamento", "fazendo"].includes(s)) return "em andamento";
  if (["pendente", "a fazer", "nao iniciado", "não iniciado"].includes(s)) return "pendente";
  return String(v).trim();
}

const withNormStatus = (rows: Tarefa[]): Tarefa[] =>
  rows.map((t) => ({ ...t, status: normStatus(t.status) }));

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
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const KEY_ABERTAS = ["tarefas", "abertas"] as const;
const KEY_CONCLUIDAS = ["tarefas", "concluidas"] as const;
const KEY_DELETED = ["tarefas", "deleted"] as const;

const isDone = (t: Pick<Tarefa, "status">) => normStatus(t.status) === "concluído";

// Mesmo corte do normStatus, feito no banco: as concluídas são a pilha que só
// cresce, então ficam numa consulta à parte e não são baixadas de novo a cada edição.
const FILTRO_ABERTAS = "status.is.null,and(status.not.ilike.conclu*,status.not.in.(feito,done))";
const FILTRO_CONCLUIDAS = "status.ilike.conclu*,status.in.(feito,done)";

async function fetchTarefas(filtro: string) {
  const { data, error } = await supabase
    .from("task_tarefas" as any)
    .select("*")
    .is("deleted_at", null)
    .or(filtro)
    .order("data_vencimento", { ascending: true, nullsFirst: false })
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withNormStatus((data as unknown) as Tarefa[]);
}

export function useTarefasAbertas() {
  return useQuery({
    queryKey: KEY_ABERTAS,
    queryFn: async () => {
      const rows = await fetchTarefas(FILTRO_ABERTAS);
      writeCache("tarefas-abertas", rows);
      return rows;
    },
    staleTime: 2 * 60 * 1000,
    ...cachedInitial<Tarefa[]>("tarefas-abertas"),
  });
}

export function useTarefasConcluidas() {
  return useQuery({
    queryKey: KEY_CONCLUIDAS,
    queryFn: () => fetchTarefas(FILTRO_CONCLUIDAS),
    staleTime: 5 * 60 * 1000,
  });
}

const SEM_TAREFAS: Tarefa[] = [];

export function useAllTarefas() {
  const { data: abertas = SEM_TAREFAS } = useTarefasAbertas();
  const { data: concluidas = SEM_TAREFAS } = useTarefasConcluidas();
  const data = useMemo(() => [...abertas, ...concluidas], [abertas, concluidas]);
  return { data };
}

export function useDeletedTarefas() {
  return useQuery({
    queryKey: KEY_DELETED,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_tarefas" as any)
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return withNormStatus((data as unknown) as Tarefa[]);
    },
    staleTime: 30 * 1000,
  });
}

/* ─── Cache: a tela muda na hora, o banco confirma depois ─── */

type Snapshots = [readonly unknown[], Tarefa[] | undefined][];

async function snapshot(qc: QueryClient): Promise<Snapshots> {
  await qc.cancelQueries({ queryKey: ["tarefas"] });
  return qc.getQueriesData<Tarefa[]>({ queryKey: ["tarefas"] });
}

function rollback(qc: QueryClient, snapshots: Snapshots | undefined) {
  snapshots?.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
}

// Aplica as alterações e deixa cada tarefa na pilha certa (aberta × concluída).
// Se as concluídas ainda não chegaram, a tarefa fica onde está: a tela junta as
// duas pilhas e separa pelo status, então o resultado visível é o mesmo.
export function patchTarefas(qc: QueryClient, patches: (Partial<Tarefa> & { id: string })[]) {
  const byId = new Map(patches.map((p) => [p.id, p]));
  const abertas = qc.getQueryData<Tarefa[]>(KEY_ABERTAS);
  const concluidas = qc.getQueryData<Tarefa[]>(KEY_CONCLUIDAS);
  const apply = (t: Tarefa) => (byId.has(t.id) ? { ...t, ...byId.get(t.id) } : t);

  if (!abertas || !concluidas) {
    if (abertas) qc.setQueryData(KEY_ABERTAS, abertas.map(apply));
    if (concluidas) qc.setQueryData(KEY_CONCLUIDAS, concluidas.map(apply));
    return;
  }
  const all = [...abertas, ...concluidas].map(apply);
  qc.setQueryData(KEY_ABERTAS, all.filter((t) => !isDone(t)));
  qc.setQueryData(KEY_CONCLUIDAS, all.filter(isDone));
}

function removeTarefa(qc: QueryClient, id: string): Tarefa | undefined {
  let removed: Tarefa | undefined;
  for (const key of [KEY_ABERTAS, KEY_CONCLUIDAS]) {
    qc.setQueryData<Tarefa[]>(key, (old) => {
      if (!old) return old;
      removed = old.find((t) => t.id === id) ?? removed;
      return old.filter((t) => t.id !== id);
    });
  }
  return removed;
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
    onMutate: async (tarefa) => {
      // O id nasce aqui: a tarefa já aparece na tela com o id definitivo e pode
      // ser editada ou concluída antes de o banco responder.
      tarefa.id ??= crypto.randomUUID();
      const snapshots = await snapshot(qc);
      const agora = new Date().toISOString();
      const nova: Tarefa = {
        descricao: null, status: "pendente", prioridade: null, lista_id: null, responsavel: null,
        data_vencimento: null, lembrete_em: null, lembrete_enviado_em: null, notificado_em: null,
        periodicidade: null, dia_recorrencia: null, hora_recorrencia: null, tarefa_modelo_id: null,
        ordem: null, deleted_at: null, created_at: agora, updated_at: agora,
        ...tarefa,
        id: tarefa.id,
      };
      const key = isDone(nova) ? KEY_CONCLUIDAS : KEY_ABERTAS;
      qc.setQueryData<Tarefa[]>(key, (old) => (old ? [nova, ...old] : old));
      return { snapshots };
    },
    onError: (_err, _vars, context) => rollback(qc, context?.snapshots),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY_ABERTAS }),
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
    onMutate: async (newData) => {
      const snapshots = await snapshot(qc);
      patchTarefas(qc, [newData]);
      return { snapshots };
    },
    onError: (_err, _vars, context) => rollback(qc, context?.snapshots),
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: KEY_ABERTAS });
      if ("status" in vars) qc.invalidateQueries({ queryKey: KEY_CONCLUIDAS });
    },
  });
}

export function useDeleteTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: marca deleted_at em vez de excluir
      const { error } = await supabase
        .from("task_tarefas" as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const snapshots = await snapshot(qc);
      const removed = removeTarefa(qc, id);
      if (removed) {
        qc.setQueryData<Tarefa[]>(KEY_DELETED, (old) =>
          old ? [{ ...removed, deleted_at: new Date().toISOString() }, ...old] : old
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => rollback(qc, context?.snapshots),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY_DELETED }),
  });
}

export function useRestoreTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_tarefas" as any)
        .update({ deleted_at: null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const snapshots = await snapshot(qc);
      qc.setQueryData<Tarefa[]>(KEY_DELETED, (old) => old?.filter((t) => t.id !== id));
      return { snapshots };
    },
    onError: (_err, _vars, context) => rollback(qc, context?.snapshots),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });
}

export function useReorderTarefas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; ordem: number; lista_id?: string | null }[]) => {
      const results = await Promise.all(
        updates.map((u) =>
          supabase
            .from("task_tarefas" as any)
            .update({ ordem: u.ordem, ...(u.lista_id !== undefined ? { lista_id: u.lista_id } : {}) } as any)
            .eq("id", u.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (updates) => {
      const snapshots = await snapshot(qc);
      patchTarefas(qc, updates);
      return { snapshots };
    },
    onError: (_err, _vars, context) => rollback(qc, context?.snapshots),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY_ABERTAS }),
  });
}
