
-- Add tarefa_modelo_id to task_tarefas to link occurrences to their model task
ALTER TABLE public.task_tarefas ADD COLUMN tarefa_modelo_id uuid REFERENCES public.task_tarefas(id) ON DELETE SET NULL;

-- Create recurrence table
CREATE TABLE public.task_recorrencias (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  tarefa_modelo_id uuid NOT NULL REFERENCES public.task_tarefas(id) ON DELETE CASCADE,
  tipo_recorrencia text NOT NULL CHECK (tipo_recorrencia IN ('diaria', 'semanal', 'mensal', 'anual')),
  quantidade_intervalo integer NOT NULL DEFAULT 1,
  hora_execucao time WITHOUT TIME ZONE,
  dia_semana integer[] DEFAULT '{}',
  dia_mes integer,
  mes_ano integer,
  somente_dia_util boolean NOT NULL DEFAULT false,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp WITHOUT TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_recorrencias ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern)
CREATE POLICY "Allow public read on task_recorrencias" ON public.task_recorrencias FOR SELECT USING (true);
CREATE POLICY "Allow public insert on task_recorrencias" ON public.task_recorrencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on task_recorrencias" ON public.task_recorrencias FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on task_recorrencias" ON public.task_recorrencias FOR DELETE USING (true);
