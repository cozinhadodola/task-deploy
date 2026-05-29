-- Campo is_admin na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Função que verifica se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Políticas de task_listas com admin
DROP POLICY IF EXISTS "Ver listas com acesso" ON public.task_listas;
DROP POLICY IF EXISTS "Criar lista" ON public.task_listas;
DROP POLICY IF EXISTS "Editar lista propria" ON public.task_listas;
DROP POLICY IF EXISTS "Excluir lista propria" ON public.task_listas;

CREATE POLICY "Ver listas" ON public.task_listas FOR SELECT TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid() OR public.user_has_lista_access(id));

CREATE POLICY "Criar lista" ON public.task_listas FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Editar lista" ON public.task_listas FOR UPDATE TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid())
  WITH CHECK (public.is_admin() OR owner_id = auth.uid());

CREATE POLICY "Excluir lista" ON public.task_listas FOR DELETE TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid());

-- Políticas de task_tarefas com admin
DROP POLICY IF EXISTS "Ver tarefas de listas com acesso" ON public.task_tarefas;
DROP POLICY IF EXISTS "Criar tarefa em lista editavel" ON public.task_tarefas;
DROP POLICY IF EXISTS "Editar tarefa em lista editavel" ON public.task_tarefas;
DROP POLICY IF EXISTS "Excluir tarefa em lista editavel" ON public.task_tarefas;

CREATE POLICY "Ver tarefas" ON public.task_tarefas FOR SELECT TO authenticated
  USING (public.is_admin() OR lista_id IS NULL OR public.user_has_lista_access(lista_id));

CREATE POLICY "Criar tarefa" ON public.task_tarefas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR lista_id IS NULL OR public.user_can_edit_lista(lista_id));

CREATE POLICY "Editar tarefa" ON public.task_tarefas FOR UPDATE TO authenticated
  USING (public.is_admin() OR lista_id IS NULL OR public.user_can_edit_lista(lista_id))
  WITH CHECK (public.is_admin() OR lista_id IS NULL OR public.user_can_edit_lista(lista_id));

CREATE POLICY "Excluir tarefa" ON public.task_tarefas FOR DELETE TO authenticated
  USING (public.is_admin() OR lista_id IS NULL OR public.user_can_edit_lista(lista_id));

-- Admin gerencia permissões de qualquer lista
DROP POLICY IF EXISTS "Dono gerencia permissoes" ON public.task_lista_permissoes;
CREATE POLICY "Dono ou admin gerencia permissoes" ON public.task_lista_permissoes FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.task_listas WHERE id = lista_id AND owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.task_listas WHERE id = lista_id AND owner_id = auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "Autenticados podem ver profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuario pode atualizar proprio profile" ON public.profiles;
CREATE POLICY "Ver profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editar profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin() OR auth.uid() = id)
  WITH CHECK (public.is_admin() OR auth.uid() = id);
