-- Remove políticas públicas e exige autenticação em todas as tabelas task_*

-- task_listas
DROP POLICY IF EXISTS "Allow public read on listas" ON public.task_listas;
DROP POLICY IF EXISTS "Allow public insert on listas" ON public.task_listas;
DROP POLICY IF EXISTS "Allow public update on listas" ON public.task_listas;
DROP POLICY IF EXISTS "Allow public delete on listas" ON public.task_listas;
CREATE POLICY "Autenticados podem acessar task_listas" ON public.task_listas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_tarefas
DROP POLICY IF EXISTS "Allow public read on tarefas" ON public.task_tarefas;
DROP POLICY IF EXISTS "Allow public insert on tarefas" ON public.task_tarefas;
DROP POLICY IF EXISTS "Allow public update on tarefas" ON public.task_tarefas;
DROP POLICY IF EXISTS "Allow public delete on tarefas" ON public.task_tarefas;
CREATE POLICY "Autenticados podem acessar task_tarefas" ON public.task_tarefas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_subtarefas
DROP POLICY IF EXISTS "Allow public read on subtarefas" ON public.task_subtarefas;
DROP POLICY IF EXISTS "Allow public insert on subtarefas" ON public.task_subtarefas;
DROP POLICY IF EXISTS "Allow public update on subtarefas" ON public.task_subtarefas;
DROP POLICY IF EXISTS "Allow public delete on subtarefas" ON public.task_subtarefas;
CREATE POLICY "Autenticados podem acessar task_subtarefas" ON public.task_subtarefas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_responsaveis
DROP POLICY IF EXISTS "Allow public read on task_responsaveis" ON public.task_responsaveis;
DROP POLICY IF EXISTS "Allow public insert on task_responsaveis" ON public.task_responsaveis;
DROP POLICY IF EXISTS "Allow public update on task_responsaveis" ON public.task_responsaveis;
DROP POLICY IF EXISTS "Allow public delete on task_responsaveis" ON public.task_responsaveis;
CREATE POLICY "Autenticados podem acessar task_responsaveis" ON public.task_responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_recorrencias
DROP POLICY IF EXISTS "Allow public read on task_recorrencias" ON public.task_recorrencias;
DROP POLICY IF EXISTS "Allow public insert on task_recorrencias" ON public.task_recorrencias;
DROP POLICY IF EXISTS "Allow public update on task_recorrencias" ON public.task_recorrencias;
DROP POLICY IF EXISTS "Allow public delete on task_recorrencias" ON public.task_recorrencias;
CREATE POLICY "Autenticados podem acessar task_recorrencias" ON public.task_recorrencias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_atualizacoes
DROP POLICY IF EXISTS "Allow public read on task_atualizacoes" ON public.task_atualizacoes;
DROP POLICY IF EXISTS "Allow public insert on task_atualizacoes" ON public.task_atualizacoes;
DROP POLICY IF EXISTS "Allow public update on task_atualizacoes" ON public.task_atualizacoes;
DROP POLICY IF EXISTS "Allow public delete on task_atualizacoes" ON public.task_atualizacoes;
CREATE POLICY "Autenticados podem acessar task_atualizacoes" ON public.task_atualizacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
