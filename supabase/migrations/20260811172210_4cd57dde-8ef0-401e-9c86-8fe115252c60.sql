CREATE OR REPLACE FUNCTION public.verificar_senha_admin(p_senha text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT EXISTS (SELECT 1 FROM admin_config WHERE id = 1 AND senha_hash = crypt(p_senha, senha_hash));
$$;

REVOKE ALL ON FUNCTION public.verificar_senha_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_senha_admin(text) TO service_role;

CREATE OR REPLACE FUNCTION public.alterar_senha_admin(p_senha text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  UPDATE admin_config SET senha_hash = crypt(p_senha, gen_salt('bf')), updated_at = now() WHERE id = 1;
$$;

REVOKE ALL ON FUNCTION public.alterar_senha_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_senha_admin(text) TO service_role;