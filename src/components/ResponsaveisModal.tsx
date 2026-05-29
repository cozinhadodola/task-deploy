import { useState, useRef, useEffect } from "react";
import { X, Phone, CheckCircle2, XCircle, Loader2, Plus, Trash2, UserCircle } from "lucide-react";
import { useResponsaveis, useCreateResponsavel, useUpdateResponsavel, useDeleteResponsavel, type Responsavel } from "@/hooks/useResponsaveis";

const N8N_WEBHOOK_URL = "https://n8n.cozinhadodola.com.br/webhook/verificar-whatsapp";

interface VerifyState {
  status: "idle" | "loading" | "found" | "not_found" | "error";
  pn: string | null;
  lid: string | null;
}

function usePhoneVerify() {
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle", pn: null, lid: null });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const verify = (telefone: string) => {
    clearTimeout(timerRef.current);
    const digits = telefone.replace(/\D/g, "");
    if (digits.length < 10) {
      setVerifyState({ status: "idle", pn: null, lid: null });
      return;
    }
    setVerifyState({ status: "loading", pn: null, lid: null });
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone }),
        });
        const data = await res.json();
        if (data.exists) {
          setVerifyState({ status: "found", pn: data.pn, lid: data.lid });
        } else {
          setVerifyState({ status: "not_found", pn: null, lid: null });
        }
      } catch {
        setVerifyState({ status: "error", pn: null, lid: null });
      }
    }, 1500);
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    setVerifyState({ status: "idle", pn: null, lid: null });
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { verifyState, verify, reset };
}

function PhoneStatusIcon({ status }: { status: VerifyState["status"] }) {
  if (status === "loading") return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  if (status === "found") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (status === "not_found") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "error") return <XCircle className="h-3.5 w-3.5 text-yellow-500" />;
  return <Phone className="h-3.5 w-3.5 text-muted-foreground/40" />;
}

function ResponsavelRow({ resp }: { resp: Responsavel }) {
  const updateResp = useUpdateResponsavel();
  const deleteResp = useDeleteResponsavel();
  const { verifyState, verify, reset } = usePhoneVerify();
  const [telefone, setTelefone] = useState(resp.telefone ?? "");
  const [editing, setEditing] = useState(false);

  // Sync if external update
  useEffect(() => { setTelefone(resp.telefone ?? ""); }, [resp.telefone]);

  const handlePhoneChange = (val: string) => {
    setTelefone(val);
    verify(val);
  };

  const savePhone = () => {
    const digits = telefone.replace(/\D/g, "");
    const updates: Partial<Responsavel> & { id: string } = {
      id: resp.id,
      telefone: telefone || null,
    };
    if (verifyState.status === "found") {
      updates.waha_pn = verifyState.pn;
      updates.waha_lid = verifyState.lid;
      updates.waha_verificado = true;
    } else if (digits.length === 0) {
      updates.waha_pn = null;
      updates.waha_lid = null;
      updates.waha_verificado = false;
    }
    updateResp.mutate(updates);
    setEditing(false);
    reset();
  };

  // Determine displayed WhatsApp status (from DB or current verification)
  const waStatus =
    verifyState.status !== "idle"
      ? verifyState.status
      : resp.waha_verificado
        ? "found"
        : resp.telefone
          ? "not_found"
          : "idle";

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 bg-muted/20 rounded-lg">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
        {resp.nome.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium truncate">{resp.nome}</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <PhoneStatusIcon status={verifyState.status} />
            <input
              value={telefone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="5511999999999"
              autoFocus
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={savePhone}
              className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => { setEditing(false); setTelefone(resp.telefone ?? ""); reset(); }}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 mt-0.5 group/phone"
          >
            <PhoneStatusIcon status={waStatus} />
            <span className={`text-xs ${resp.telefone ? "text-muted-foreground" : "text-muted-foreground/40"} group-hover/phone:text-foreground transition-colors`}>
              {resp.telefone
                ? resp.telefone
                : "Adicionar telefone"}
            </span>
            {resp.waha_verificado && (
              <span className="text-[10px] text-green-600 font-medium ml-1">WhatsApp ✓</span>
            )}
          </button>
        )}
      </div>
      <button
        onClick={() => deleteResp.mutate(resp.id)}
        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10 shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddResponsavelForm() {
  const createResp = useCreateResponsavel();
  const { verifyState, verify, reset } = usePhoneVerify();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const handlePhoneChange = (val: string) => {
    setTelefone(val);
    verify(val);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (!n) return;
    const payload: Parameters<typeof createResp.mutate>[0] = { nome: n };
    if (telefone) {
      payload.telefone = telefone;
      if (verifyState.status === "found") {
        payload.waha_pn = verifyState.pn;
        payload.waha_lid = verifyState.lid;
        payload.waha_verificado = true;
      }
    }
    createResp.mutate(payload, {
      onSuccess: () => {
        setNome("");
        setTelefone("");
        reset();
      },
    });
  };

  return (
    <form onSubmit={handleAdd} className="border border-dashed border-border rounded-lg p-3 space-y-2">
      <p className="text-[11px] text-muted-foreground font-medium">Novo responsável</p>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome…"
        className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center gap-1.5">
        <PhoneStatusIcon status={verifyState.status} />
        <input
          value={telefone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="Telefone (opcional): 5511999999999"
          className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {verifyState.status === "found" && (
        <p className="text-[11px] text-green-600">✓ WhatsApp encontrado — será salvo automaticamente</p>
      )}
      {verifyState.status === "not_found" && (
        <p className="text-[11px] text-destructive">Número não encontrado no WhatsApp</p>
      )}
      <button
        type="submit"
        disabled={!nome.trim() || createResp.isPending}
        className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar
      </button>
    </form>
  );
}

interface Props {
  onClose: () => void;
}

export default function ResponsaveisModal({ onClose }: Props) {
  const { data: responsaveis = [] } = useResponsaveis();

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Responsáveis</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {responsaveis.map((resp) => (
            <ResponsavelRow key={resp.id} resp={resp} />
          ))}
          {responsaveis.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-4">Nenhum responsável cadastrado</p>
          )}
        </div>

        <div className="p-5 border-t border-border shrink-0">
          <AddResponsavelForm />
        </div>
      </div>
    </div>
  );
}
