CREATE TABLE public.responsaveis (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on responsaveis" ON public.responsaveis FOR SELECT USING (true);
CREATE POLICY "Allow public insert on responsaveis" ON public.responsaveis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on responsaveis" ON public.responsaveis FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on responsaveis" ON public.responsaveis FOR DELETE USING (true);