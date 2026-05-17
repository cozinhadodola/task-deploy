
-- Rename all tables with task_ prefix
ALTER TABLE public.tarefas RENAME TO task_tarefas;
ALTER TABLE public.listas RENAME TO task_listas;
ALTER TABLE public.subtarefas RENAME TO task_subtarefas;
ALTER TABLE public.responsaveis RENAME TO task_responsaveis;

-- Rename foreign key constraints to match new table names
ALTER TABLE public.task_tarefas RENAME CONSTRAINT tarefas_lista_id_fkey TO task_tarefas_lista_id_fkey;
ALTER TABLE public.task_subtarefas RENAME CONSTRAINT subtarefas_tarefa_id_fkey TO task_subtarefas_tarefa_id_fkey;

-- Rename RLS policies for task_tarefas
ALTER POLICY "Allow public read on tarefas" ON public.task_tarefas RENAME TO "Allow public read on task_tarefas";
ALTER POLICY "Allow public insert on tarefas" ON public.task_tarefas RENAME TO "Allow public insert on task_tarefas";
ALTER POLICY "Allow public update on tarefas" ON public.task_tarefas RENAME TO "Allow public update on task_tarefas";
ALTER POLICY "Allow public delete on tarefas" ON public.task_tarefas RENAME TO "Allow public delete on task_tarefas";

-- Rename RLS policies for task_listas
ALTER POLICY "Allow public read on listas" ON public.task_listas RENAME TO "Allow public read on task_listas";
ALTER POLICY "Allow public insert on listas" ON public.task_listas RENAME TO "Allow public insert on task_listas";
ALTER POLICY "Allow public update on listas" ON public.task_listas RENAME TO "Allow public update on task_listas";
ALTER POLICY "Allow public delete on listas" ON public.task_listas RENAME TO "Allow public delete on task_listas";

-- Rename RLS policies for task_subtarefas
ALTER POLICY "Allow public read on subtarefas" ON public.task_subtarefas RENAME TO "Allow public read on task_subtarefas";
ALTER POLICY "Allow public insert on subtarefas" ON public.task_subtarefas RENAME TO "Allow public insert on task_subtarefas";
ALTER POLICY "Allow public update on subtarefas" ON public.task_subtarefas RENAME TO "Allow public update on task_subtarefas";
ALTER POLICY "Allow public delete on subtarefas" ON public.task_subtarefas RENAME TO "Allow public delete on task_subtarefas";

-- Rename RLS policies for task_responsaveis
ALTER POLICY "Allow public read on responsaveis" ON public.task_responsaveis RENAME TO "Allow public read on task_responsaveis";
ALTER POLICY "Allow public insert on responsaveis" ON public.task_responsaveis RENAME TO "Allow public insert on task_responsaveis";
ALTER POLICY "Allow public update on responsaveis" ON public.task_responsaveis RENAME TO "Allow public update on task_responsaveis";
ALTER POLICY "Allow public delete on responsaveis" ON public.task_responsaveis RENAME TO "Allow public delete on task_responsaveis";
