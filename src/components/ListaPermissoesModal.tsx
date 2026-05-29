import { useState } from "react";
import { X, Plus, Trash2, Shield, Eye } from "lucide-react";
import {
  useListaPermissoes,
  useListaOwner,
  useCurrentUser,
  useAddPermissao,
  useUpdatePermissao,
  useRemovePermissao,
  type Permissao,
} from "@/hooks/useListaPermissoes";

interface Props {
  listaId: string;
  listaNome: string;
  onClose: () => void;
}

export default function ListaPermissoesModal({ listaId, listaNome, onClose }: Props) {
  const { data: permissoes = [] } = useListaPermissoes(listaId);
  const { data: ownerId } = useListaOwner(listaId);
  const { data: currentUser } = useCurrentUser();
  const addPermissao = useAddPermissao();
  const updatePermissao = useUpdatePermissao();
  const removePermissao = useRemovePermissao();

  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState<Permissao>("edicao");
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUser?.id === ownerId;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addPermissao.mutateAsync({ listaId, email: email.trim(), permissao: nivel });
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Compartilhar lista</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{listaNome}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Membros atuais */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Membros com acesso</p>
            <div className="space-y-2">
              {/* Dono */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{currentUser?.email}</span>
                </div>
                <span className="text-xs text-primary font-medium">Dono</span>
              </div>

              {/* Outros membros */}
              {permissoes.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg group">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      {p.permissao === "edicao"
                        ? <Shield className="h-3 w-3 text-muted-foreground" />
                        : <Eye className="h-3 w-3 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{p.profiles?.name || p.profiles?.email}</p>
                      {p.profiles?.name && <p className="text-xs text-muted-foreground">{p.profiles.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <>
                        <select
                          value={p.permissao}
                          onChange={(e) => updatePermissao.mutate({ id: p.id, listaId, permissao: e.target.value as Permissao })}
                          className="text-xs bg-background border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="edicao">Edição</option>
                          <option value="leitura">Leitura</option>
                        </select>
                        <button
                          onClick={() => removePermissao.mutate({ id: p.id, listaId })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <span className="text-xs text-muted-foreground">
                        {p.permissao === "edicao" ? "Edição" : "Leitura"}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {permissoes.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-2">Nenhum membro além do dono</p>
              )}
            </div>
          </div>

          {/* Adicionar membro (só dono) */}
          {isOwner && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Adicionar pessoa</p>
              <form onSubmit={handleAdd} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <select
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value as Permissao)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="edicao">Edição (pode criar e modificar)</option>
                    <option value="leitura">Leitura (só visualiza)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={addPermissao.isPending || !email.trim()}
                    className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
