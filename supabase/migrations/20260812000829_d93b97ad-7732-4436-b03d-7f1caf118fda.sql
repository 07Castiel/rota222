ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS nascimento date,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS dias_semana text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inicio_aulas date;

ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmada',
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz,
  ADD COLUMN IF NOT EXISTS poltrona_ida integer,
  ADD COLUMN IF NOT EXISTS poltrona_volta integer;

ALTER TABLE public.solicitacoes DROP CONSTRAINT IF EXISTS solicitacoes_status_check;
ALTER TABLE public.solicitacoes ADD CONSTRAINT solicitacoes_status_check
  CHECK (status IN ('confirmada','cancelada','encerrada','viagem_cancelada'));

UPDATE public.solicitacoes s SET
  poltrona_ida = (SELECT a.numero FROM public.assentos a WHERE a.solicitacao_id = s.id AND a.trecho = 'ida' LIMIT 1),
  poltrona_volta = (SELECT a.numero FROM public.assentos a WHERE a.solicitacao_id = s.id AND a.trecho = 'volta' LIMIT 1)
WHERE poltrona_ida IS NULL AND poltrona_volta IS NULL;

DROP INDEX IF EXISTS solicitacoes_viagem_aluno_key;
ALTER TABLE public.solicitacoes DROP CONSTRAINT IF EXISTS solicitacoes_viagem_id_aluno_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS solicitacoes_ativa_unica
  ON public.solicitacoes (viagem_id, aluno_id) WHERE status = 'confirmada';

CREATE OR REPLACE FUNCTION public.cancelar_transporte(p_aluno uuid, p_viagem uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_viagem viagens%ROWTYPE; v_sol uuid;
BEGIN
  SELECT * INTO v_viagem FROM viagens WHERE id = p_viagem FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VIAGEM_INEXISTENTE'; END IF;
  IF v_viagem.status <> 'aberta' OR now() < v_viagem.abertura_em OR now() > v_viagem.fechamento_em THEN
    RAISE EXCEPTION 'JANELA_FECHADA';
  END IF;

  SELECT id INTO v_sol FROM solicitacoes
    WHERE viagem_id = p_viagem AND aluno_id = p_aluno AND status = 'confirmada' FOR UPDATE;
  IF v_sol IS NULL THEN RETURN; END IF;

  DELETE FROM assentos WHERE solicitacao_id = v_sol;
  UPDATE solicitacoes SET status = 'cancelada', cancelada_em = now() WHERE id = v_sol;
END; $function$;

CREATE OR REPLACE FUNCTION public.reservar_transporte(p_aluno uuid, p_viagem uuid, p_tipo text, p_onibus_ida uuid, p_onibus_volta uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_ativo boolean; v_viagem viagens%ROWTYPE; v_sol uuid; v_antiga uuid;
  v_ida integer; v_volta integer;
BEGIN
  SELECT ativo INTO v_ativo FROM alunos WHERE id = p_aluno;
  IF v_ativo IS NULL THEN RAISE EXCEPTION 'ALUNO_NAO_CADASTRADO'; END IF;
  IF NOT v_ativo THEN RAISE EXCEPTION 'ALUNO_INATIVO'; END IF;

  IF p_tipo NOT IN ('ida','volta','ida_volta') THEN RAISE EXCEPTION 'TIPO_INVALIDO'; END IF;

  SELECT * INTO v_viagem FROM viagens WHERE id = p_viagem FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VIAGEM_INEXISTENTE'; END IF;
  IF v_viagem.status <> 'aberta' OR now() < v_viagem.abertura_em OR now() > v_viagem.fechamento_em THEN
    RAISE EXCEPTION 'JANELA_FECHADA';
  END IF;

  IF p_tipo IN ('ida','ida_volta') AND p_onibus_ida IS NULL THEN RAISE EXCEPTION 'ONIBUS_IDA_OBRIGATORIO'; END IF;
  IF p_tipo IN ('volta','ida_volta') AND p_onibus_volta IS NULL THEN RAISE EXCEPTION 'ONIBUS_VOLTA_OBRIGATORIO'; END IF;

  SELECT id INTO v_antiga FROM solicitacoes
    WHERE viagem_id = p_viagem AND aluno_id = p_aluno AND status = 'confirmada' FOR UPDATE;
  IF v_antiga IS NOT NULL THEN
    DELETE FROM assentos WHERE solicitacao_id = v_antiga;
    UPDATE solicitacoes SET status = 'cancelada', cancelada_em = now() WHERE id = v_antiga;
  END IF;

  INSERT INTO solicitacoes (viagem_id, aluno_id, tipo, onibus_ida_id, onibus_volta_id, status)
  VALUES (p_viagem, p_aluno, p_tipo,
          CASE WHEN p_tipo IN ('ida','ida_volta') THEN p_onibus_ida END,
          CASE WHEN p_tipo IN ('volta','ida_volta') THEN p_onibus_volta END,
          'confirmada')
  RETURNING id INTO v_sol;

  IF p_tipo IN ('ida','ida_volta') THEN
    v_ida := proxima_poltrona(p_viagem, p_onibus_ida, 'ida', NULL);
    INSERT INTO assentos (viagem_id, onibus_id, trecho, numero, solicitacao_id)
    VALUES (p_viagem, p_onibus_ida, 'ida', v_ida, v_sol);
  END IF;

  IF p_tipo IN ('volta','ida_volta') THEN
    v_volta := proxima_poltrona(p_viagem, p_onibus_volta, 'volta',
      CASE WHEN p_onibus_volta = p_onibus_ida THEN v_ida ELSE NULL END);
    INSERT INTO assentos (viagem_id, onibus_id, trecho, numero, solicitacao_id)
    VALUES (p_viagem, p_onibus_volta, 'volta', v_volta, v_sol);
  END IF;

  UPDATE solicitacoes SET poltrona_ida = v_ida, poltrona_volta = v_volta WHERE id = v_sol;

  RETURN jsonb_build_object('solicitacao_id', v_sol, 'poltrona_ida', v_ida, 'poltrona_volta', v_volta);
END; $function$;