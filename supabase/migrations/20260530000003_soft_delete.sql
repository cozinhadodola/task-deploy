ALTER TABLE public.task_tarefas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_task_tarefas_deleted ON public.task_tarefas(deleted_at) WHERE deleted_at IS NULL;