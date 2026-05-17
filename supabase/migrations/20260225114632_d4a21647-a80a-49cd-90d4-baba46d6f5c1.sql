ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS hora_recorrencia time DEFAULT NULL;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS dia_recorrencia text DEFAULT NULL;