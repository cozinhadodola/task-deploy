
-- Enable public access for all tables (no auth required)
CREATE POLICY "Allow public read on listas" ON public.listas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on listas" ON public.listas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on listas" ON public.listas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on listas" ON public.listas FOR DELETE USING (true);

CREATE POLICY "Allow public read on tarefas" ON public.tarefas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tarefas" ON public.tarefas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tarefas" ON public.tarefas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on tarefas" ON public.tarefas FOR DELETE USING (true);

CREATE POLICY "Allow public read on subtarefas" ON public.subtarefas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on subtarefas" ON public.subtarefas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on subtarefas" ON public.subtarefas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on subtarefas" ON public.subtarefas FOR DELETE USING (true);

-- Add trigger for updated_at on tarefas
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
