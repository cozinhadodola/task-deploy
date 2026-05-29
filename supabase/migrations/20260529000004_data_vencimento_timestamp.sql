-- Altera data_vencimento de DATE para TIMESTAMPTZ para suportar hora
ALTER TABLE public.task_tarefas
  ALTER COLUMN data_vencimento TYPE TIMESTAMP WITH TIME ZONE
  USING data_vencimento::timestamp with time zone;
