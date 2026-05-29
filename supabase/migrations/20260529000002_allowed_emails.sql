-- Tabela de e-mails permitidos para cadastro
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (anon) pode verificar se um e-mail está na lista (necessário antes do login)
CREATE POLICY "Leitura publica para verificar email" ON public.allowed_emails FOR SELECT TO anon, authenticated USING (true);

-- Só o service_role pode inserir/remover (via painel Supabase)
-- Nenhuma policy de INSERT/UPDATE/DELETE = bloqueado para todos os clientes
