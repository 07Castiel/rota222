CREATE TABLE public.tentativas_login (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escopo text NOT NULL CHECK (escopo IN ('aluno','admin')),
  chave text NOT NULL,
  sucesso boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tentativas_login TO service_role;
ALTER TABLE public.tentativas_login ENABLE ROW LEVEL SECURITY;

CREATE INDEX tentativas_login_busca ON public.tentativas_login (escopo, chave, criado_em DESC);

CREATE TABLE public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ator text NOT NULL,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

CREATE INDEX auditoria_recentes ON public.auditoria (criado_em DESC);

CREATE OR REPLACE FUNCTION public.registrar_tentativa(p_escopo text, p_chave text, p_sucesso boolean)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO tentativas_login (escopo, chave, sucesso) VALUES (p_escopo, p_chave, p_sucesso);
  DELETE FROM tentativas_login WHERE criado_em < now() - interval '1 day';
$$;

CREATE OR REPLACE FUNCTION public.tentativas_recentes(p_escopo text, p_chave text, p_minutos integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM tentativas_login
  WHERE escopo = p_escopo AND chave = p_chave AND NOT sucesso
    AND criado_em > now() - make_interval(mins => p_minutos);
$$;

CREATE OR REPLACE FUNCTION public.registrar_auditoria(p_ator text, p_acao text, p_entidade text, p_entidade_id uuid, p_detalhes jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO auditoria (ator, acao, entidade, entidade_id, detalhes)
  VALUES (p_ator, p_acao, p_entidade, p_entidade_id, coalesce(p_detalhes, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.encerrar_viagens_passadas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_total integer := 0;
BEGIN
  UPDATE solicitacoes s SET status = 'encerrada'
  FROM viagens v
  WHERE s.viagem_id = v.id AND s.status = 'confirmada'
    AND v.status <> 'cancelada'
    AND v.data < (now() AT TIME ZONE 'America/Fortaleza')::date;
  GET DIAGNOSTICS v_total = ROW_COUNT;

  UPDATE solicitacoes s SET status = 'viagem_cancelada'
  FROM viagens v
  WHERE s.viagem_id = v.id AND s.status = 'confirmada' AND v.status = 'cancelada';

  UPDATE viagens SET status = 'fechada'
  WHERE status = 'aberta' AND data < (now() AT TIME ZONE 'America/Fortaleza')::date;

  RETURN v_total;
END; $$;