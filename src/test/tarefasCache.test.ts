import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { patchTarefas, type Tarefa } from "@/hooks/useTarefas";
import { readCache, writeCache, clearCache, setCacheUser } from "@/lib/localCache";

// O cliente real exige as variáveis do Supabase; aqui só o cache é exercitado.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const ABERTAS = ["tarefas", "abertas"];
const CONCLUIDAS = ["tarefas", "concluidas"];

const tarefa = (id: string, status: string, extra: Partial<Tarefa> = {}) =>
  ({ id, titulo: id, status, ordem: 0, lista_id: "l1", ...extra }) as Tarefa;

const ids = (qc: QueryClient, key: string[]) => qc.getQueryData<Tarefa[]>(key)?.map((t) => t.id);

describe("patchTarefas", () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient();
  });

  it("move a tarefa para as concluídas ao concluir, e de volta ao reabrir", () => {
    qc.setQueryData(ABERTAS, [tarefa("a", "pendente"), tarefa("b", "pendente")]);
    qc.setQueryData(CONCLUIDAS, [tarefa("c", "concluído")]);

    patchTarefas(qc, [{ id: "a", status: "concluído" }]);
    expect(ids(qc, ABERTAS)).toEqual(["b"]);
    expect(ids(qc, CONCLUIDAS)).toEqual(["a", "c"]);

    patchTarefas(qc, [{ id: "c", status: "pendente" }]);
    expect(ids(qc, ABERTAS)).toEqual(["b", "c"]);
    expect(ids(qc, CONCLUIDAS)).toEqual(["a"]);
  });

  it("não inventa a pilha de concluídas enquanto ela não carregou", () => {
    qc.setQueryData(ABERTAS, [tarefa("a", "pendente")]);

    patchTarefas(qc, [{ id: "a", status: "concluído" }]);

    expect(qc.getQueryData(CONCLUIDAS)).toBeUndefined();
    expect(qc.getQueryData<Tarefa[]>(ABERTAS)?.[0].status).toBe("concluído");
  });

  it("aplica várias alterações de uma vez (arrastar entre listas)", () => {
    qc.setQueryData(ABERTAS, [tarefa("a", "pendente"), tarefa("b", "pendente")]);
    qc.setQueryData(CONCLUIDAS, []);

    patchTarefas(qc, [{ id: "a", ordem: 1 }, { id: "b", ordem: 0, lista_id: "l2" }]);

    const abertas = qc.getQueryData<Tarefa[]>(ABERTAS)!;
    expect(abertas.find((t) => t.id === "a")?.ordem).toBe(1);
    expect(abertas.find((t) => t.id === "b")).toMatchObject({ ordem: 0, lista_id: "l2" });
  });
});

describe("localCache", () => {
  beforeEach(() => {
    clearCache();
    setCacheUser(null);
  });

  it("só devolve o que o mesmo usuário guardou", () => {
    setCacheUser("u1");
    writeCache("listas", [1, 2]);
    expect(readCache("listas")).toEqual([1, 2]);

    setCacheUser("u2");
    expect(readCache("listas")).toBeUndefined();
  });

  it("não lê nem grava sem usuário, e limpa tudo ao sair", () => {
    writeCache("listas", [1]);
    expect(readCache("listas")).toBeUndefined();

    setCacheUser("u1");
    writeCache("listas", [1]);
    clearCache();
    expect(readCache("listas")).toBeUndefined();
  });
});
