-- A lista de e-mails permitidos passa a valer no banco, não só na tela de cadastro.
-- Com login pelo Google, a conta nasce sem passar pelo formulário: sem esta trava,
-- qualquer conta Google entraria. Vale também para signUp direto pela API.
CREATE OR REPLACE FUNCTION public.enforce_allowed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.allowed_emails WHERE lower(email) = lower(trim(NEW.email))
  ) THEN
    RAISE EXCEPTION 'E-mail nao autorizado: %', NEW.email USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_email_on_signup ON auth.users;
CREATE TRIGGER enforce_allowed_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_allowed_email();
