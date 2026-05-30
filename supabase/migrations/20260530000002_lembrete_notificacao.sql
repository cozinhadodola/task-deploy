ALTER TABLE public.task_tarefas
  ADD COLUMN IF NOT EXISTS lembrete_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notificado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_task_tarefas_lembrete ON public.task_tarefas(lembrete_em) WHERE lembrete_enviado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_tarefas_notificado ON public.task_tarefas(data_vencimento) WHERE notificado_em IS NULL;