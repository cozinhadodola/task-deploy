import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AuthPage from "@/pages/AuthPage";
import { useQueryClient } from "@tanstack/react-query";
import { clearCache, setCacheUser } from "@/lib/localCache";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearCache();
        queryClient.clear();
      }
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (session === undefined) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return <AuthPage />;
  }

  // Antes de montar as telas: é o que libera a leitura do cache deste usuário.
  setCacheUser(session.user.id);

  return <>{children}</>;
}
