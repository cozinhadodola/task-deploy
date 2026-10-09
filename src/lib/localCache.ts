// Guarda a última resposta de cada consulta no aparelho, para o app abrir já
// com conteúdo enquanto busca a versão nova. Cada entrada leva o id do usuário:
// outra conta no mesmo aparelho nunca enxerga o que ficou guardado.
const PREFIX = "task-cache:";

let currentUserId: string | null = null;

export function setCacheUser(userId: string | null) {
  currentUserId = userId;
}

export function readCache<T>(key: string): T | undefined {
  if (!currentUserId) return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as { user: string; data: T };
    return entry.user === currentUserId ? entry.data : undefined;
  } catch {
    return undefined;
  }
}

export function writeCache<T>(key: string, data: T) {
  if (!currentUserId) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ user: currentUserId, data }));
  } catch {
    // armazenamento cheio ou bloqueado: o app segue sem cache
  }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // idem
  }
}

// Opções de useQuery: mostra o que está guardado e revalida em seguida.
export function cachedInitial<T>(key: string) {
  return {
    initialData: () => readCache<T>(key),
    initialDataUpdatedAt: 0,
  };
}
