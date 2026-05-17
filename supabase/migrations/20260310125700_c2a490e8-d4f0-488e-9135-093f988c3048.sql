
CREATE TABLE public.task_atualizacoes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.task_tarefas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  data_registro TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE public.task_atualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on task_atualizacoes" ON public.task_atualizacoes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on task_atualizacoes" ON public.task_atualizacoes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on task_atualizacoes" ON public.task_atualizacoes FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on task_atualizacoes" ON public.task_atualizacoes FOR DELETE TO public USING (true);
