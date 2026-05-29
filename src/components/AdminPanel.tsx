import { useState } from "react";
import { X, Shield, ShieldOff, UserCheck } from "lucide-react";
import { useAllProfiles, useToggleAdmin } from "@/hooks/useAdmin";
import { useCurrentUser } from "@/hooks/useListaPermissoes";

interface Props {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: Props) {
  const { data: profiles = [] } = useAllProfiles();
  const { data: currentUser } = useCurrentUser();
  const toggleAdmin = useToggleAdmin();

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Painel Admin — Usuários</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Admins veem e modificam todas as listas. Usuários comuns só acessam listas compartilhadas com eles.
          </p>

          <div className="space-y-2">
            {profiles.map((profile) => {
              const isMe = profile.id === currentUser?.id;
              return (
                <div key={profile.id} className="flex items-center justify-between py-2.5 px-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${profile.is_admin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {(profile.name || profile.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-foreground">{profile.name || profile.email}</p>
                        {profile.is_admin && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Admin</span>
                        )}
                        {isMe && (
                          <span className="text-[10px] text-muted-foreground">(você)</span>
                        )}
                      </div>
                      {profile.name && <p className="text-xs text-muted-foreground">{profile.email}</p>}
                    </div>
                  </div>

                  {/* Não deixa remover admin de si mesmo */}
                  {!isMe && (
                    <button
                      onClick={() => toggleAdmin.mutate({ id: profile.id, is_admin: !profile.is_admin })}
                      disabled={toggleAdmin.isPending}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        profile.is_admin
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {profile.is_admin
                        ? <><ShieldOff className="h-3.5 w-3.5" /> Remover admin</>
                        : <><UserCheck className="h-3.5 w-3.5" /> Tornar admin</>
                      }
                    </button>
                  )}
                </div>
              );
            })}

            {profiles.length === 0 && (
              <p className="text-xs text-muted-foreground/60 text-center py-4">Nenhum usuário cadastrado ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
