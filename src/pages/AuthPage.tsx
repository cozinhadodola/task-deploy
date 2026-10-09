import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare } from "lucide-react";

// Entrada só pelo Google. Quem pode entrar é decidido no banco: gatilho em
// auth.users confere o e-mail contra public.allowed_emails.
export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Volta do Google com erro (ex.: e-mail fora da lista de permitidos): o Supabase
  // devolve o motivo na URL em vez de abrir sessão.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const description = params.get("error_description") ?? hash.get("error_description");
    if (!description) return;
    setError(
      /database error|not allowed|autorizad/i.test(description)
        ? "Esta conta Google não está autorizada a acessar."
        : description
    );
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    // Sem erro o navegador já está saindo para o Google.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <CheckSquare className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-foreground">Tarefas</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-medium text-foreground mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-5">Acesse suas tarefas</p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-background border border-border text-foreground rounded-lg py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {loading ? "Aguarde..." : "Entrar com Google"}
          </button>

          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
