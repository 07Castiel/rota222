REVOKE ALL ON FUNCTION public.registrar_tentativa(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tentativas_recentes(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registrar_auditoria(text, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.encerrar_viagens_passadas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_tentativa(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.tentativas_recentes(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria(text, text, text, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.encerrar_viagens_passadas() TO service_role;