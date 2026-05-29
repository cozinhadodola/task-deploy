-- ─── Profiles (espelho de auth.users acessível pelo cliente) ───────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem ver profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuario pode atualizar proprio profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: cria profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Owner nas listas ────────────────────────────────────────────────────────
ALTER TABLE public.task_listas ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Preenche owner_id para listas existentes com o primeiro usuário encontrado
-- (ajuste manual depois se necessário)
UPDATE public.task_listas SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;

-- ─── Tabela de permissões por lista ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_lista_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID NOT NULL REFERENCES public.task_listas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissao TEXT NOT NULL CHECK (permissao IN ('leitura', 'edicao')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (lista_id, user_id)
);

ALTER TABLE public.task_lista_permissoes ENABLE ROW LEVEL SECURITY;

-- Dono da lista gerencia permissões
CREATE POLICY "Dono gerencia permissoes" ON public.task_lista_permissoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_listas WHERE id = lista_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.task_listas WHERE id = lista_id AND owner_id = auth.uid()));

-- Usuário vê as próprias permissões
CREATE POLICY "Usuario ve proprias permissoes" ON public.task_lista_permissoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ─── Funções auxiliares de permissão ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.user_has_lista_access(p_lista_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_listas WHERE id = p_lista_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.task_lista_permissoes WHERE lista_id = p_lista_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_lista(p_lista_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_listas WHERE id = p_lista_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.task_lista_permissoes WHERE lista_id = p_lista_id AND user_id = auth.uid() AND permissao = 'edicao'
  );
$$;

-- ─── RLS: task_listas ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_listas" ON public.task_listas;

CREATE POLICY "Ver listas com acesso" ON public.task_listas FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.user_has_lista_access(id));

CREATE POLICY "Criar lista" ON public.task_listas FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Editar lista propria" ON public.task_listas FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Excluir lista propria" ON public.task_listas FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ─── RLS: task_tarefas ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_tarefas" ON public.task_tarefas;

CREATE POLICY "Ver tarefas de listas com acesso" ON public.task_tarefas FOR SELECT TO authenticated
  USING (lista_id IS NULL OR public.user_has_lista_access(lista_id));

CREATE POLICY "Criar tarefa em lista editavel" ON public.task_tarefas FOR INSERT TO authenticated
  WITH CHECK (lista_id IS NULL OR public.user_can_edit_lista(lista_id));

CREATE POLICY "Editar tarefa em lista editavel" ON public.task_tarefas FOR UPDATE TO authenticated
  USING (lista_id IS NULL OR public.user_can_edit_lista(lista_id))
  WITH CHECK (lista_id IS NULL OR public.user_can_edit_lista(lista_id));

CREATE POLICY "Excluir tarefa em lista editavel" ON public.task_tarefas FOR DELETE TO authenticated
  USING (lista_id IS NULL OR public.user_can_edit_lista(lista_id));

-- ─── RLS: task_subtarefas ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_subtarefas" ON public.task_subtarefas;

CREATE POLICY "Ver subtarefas" ON public.task_subtarefas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_has_lista_access(t.lista_id))));

CREATE POLICY "Editar subtarefas" ON public.task_subtarefas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))));

-- ─── RLS: task_atualizacoes ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_atualizacoes" ON public.task_atualizacoes;

CREATE POLICY "Ver atualizacoes" ON public.task_atualizacoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_has_lista_access(t.lista_id))));

CREATE POLICY "Editar atualizacoes" ON public.task_atualizacoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))));

-- ─── RLS: task_recorrencias ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_recorrencias" ON public.task_recorrencias;

CREATE POLICY "Ver recorrencias" ON public.task_recorrencias FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_modelo_id AND (t.lista_id IS NULL OR public.user_has_lista_access(t.lista_id))));

CREATE POLICY "Editar recorrencias" ON public.task_recorrencias FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_modelo_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.task_tarefas t WHERE t.id = tarefa_modelo_id AND (t.lista_id IS NULL OR public.user_can_edit_lista(t.lista_id))));

-- ─── RLS: task_responsaveis (compartilhado entre todos autenticados) ─────────
DROP POLICY IF EXISTS "Autenticados podem acessar task_responsaveis" ON public.task_responsaveis;
CREATE POLICY "Autenticados acessam responsaveis" ON public.task_responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);
