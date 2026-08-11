CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'),
  matricula text NOT NULL,
  curso text NOT NULL,
  instituicao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onibus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  rota text,
  descricao_rota text,
  capacidade integer NOT NULL DEFAULT 46 CHECK (capacidade > 0),
  hora_ida time NOT NULL,
  hora_volta time NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE public.viagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  abertura_em timestamptz NOT NULL,
  fechamento_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','fechada','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fechamento_em > abertura_em)
);

CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id uuid NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ida','volta','ida_volta')),
  onibus_ida_id uuid REFERENCES public.onibus(id),
  onibus_volta_id uuid REFERENCES public.onibus(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (viagem_id, aluno_id)
);

CREATE TABLE public.assentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id uuid NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
  onibus_id uuid NOT NULL REFERENCES public.onibus(id),
  trecho text NOT NULL CHECK (trecho IN ('ida','volta')),
  numero integer NOT NULL CHECK (numero > 0),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (viagem_id, onibus_id, trecho, numero)
);
CREATE INDEX assentos_solicitacao_idx ON public.assentos(solicitacao_id);

CREATE TABLE public.admin_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  senha_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.onibus TO service_role;
GRANT ALL ON public.viagens TO service_role;
GRANT ALL ON public.solicitacoes TO service_role;
GRANT ALL ON public.assentos TO service_role;
GRANT ALL ON public.admin_config TO service_role;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onibus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER alunos_updated_at BEFORE UPDATE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.onibus (codigo, nome, rota, descricao_rota, capacidade, hora_ida, hora_volta, ordem) VALUES
  ('ONIBUS_01','Ônibus 01', NULL, 'Turno manhã', 46, '05:30', '11:00', 1),
  ('ONIBUS_02','Ônibus 02','ROTA01','UNINTA e F5', 46, '16:50', '21:30', 2),
  ('ONIBUS_03','Ônibus 03','ROTA02','Luciano Feijão e faculdades públicas', 46, '16:50', '21:30', 3);

INSERT INTO public.admin_config (id, senha_hash) VALUES (1, crypt('pacuja2026', gen_salt('bf')));

CREATE OR REPLACE FUNCTION public.proxima_poltrona(
  p_viagem uuid, p_onibus uuid, p_trecho text, p_preferida integer
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cap integer; v_num integer;
BEGIN
  SELECT capacidade INTO v_cap FROM onibus WHERE id = p_onibus AND ativo;
  IF v_cap IS NULL THEN RAISE EXCEPTION 'ONIBUS_INVALIDO'; END IF;

  IF (SELECT count(*) FROM assentos WHERE viagem_id = p_viagem AND onibus_id = p_onibus AND trecho = p_trecho) >= v_cap THEN
    RAISE EXCEPTION 'ONIBUS_LOTADO';
  END IF;

  IF p_preferida IS NOT NULL AND p_preferida <= v_cap AND NOT EXISTS (
    SELECT 1 FROM assentos WHERE viagem_id = p_viagem AND onibus_id = p_onibus AND trecho = p_trecho AND numero = p_preferida
  ) THEN
    RETURN p_preferida;
  END IF;

  SELECT n INTO v_num FROM generate_series(1, v_cap) AS n
  WHERE NOT EXISTS (
    SELECT 1 FROM assentos WHERE viagem_id = p_viagem AND onibus_id = p_onibus AND trecho = p_trecho AND numero = n
  ) ORDER BY n LIMIT 1;

  IF v_num IS NULL THEN RAISE EXCEPTION 'ONIBUS_LOTADO'; END IF;
  RETURN v_num;
END; $$;

CREATE OR REPLACE FUNCTION public.reservar_transporte(
  p_aluno uuid, p_viagem uuid, p_tipo text, p_onibus_ida uuid, p_onibus_volta uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ativo boolean; v_viagem viagens%ROWTYPE; v_sol uuid;
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

  DELETE FROM solicitacoes WHERE viagem_id = p_viagem AND aluno_id = p_aluno;

  INSERT INTO solicitacoes (viagem_id, aluno_id, tipo, onibus_ida_id, onibus_volta_id)
  VALUES (p_viagem, p_aluno, p_tipo,
          CASE WHEN p_tipo IN ('ida','ida_volta') THEN p_onibus_ida END,
          CASE WHEN p_tipo IN ('volta','ida_volta') THEN p_onibus_volta END)
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

  RETURN jsonb_build_object('solicitacao_id', v_sol, 'poltrona_ida', v_ida, 'poltrona_volta', v_volta);
END; $$;

CREATE OR REPLACE FUNCTION public.cancelar_transporte(p_aluno uuid, p_viagem uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_viagem viagens%ROWTYPE;
BEGIN
  SELECT * INTO v_viagem FROM viagens WHERE id = p_viagem FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'VIAGEM_INEXISTENTE'; END IF;
  IF v_viagem.status <> 'aberta' OR now() < v_viagem.abertura_em OR now() > v_viagem.fechamento_em THEN
    RAISE EXCEPTION 'JANELA_FECHADA';
  END IF;
  DELETE FROM solicitacoes WHERE viagem_id = p_viagem AND aluno_id = p_aluno;
END; $$;

CREATE OR REPLACE FUNCTION public.ocupacao_viagem(p_viagem uuid)
RETURNS TABLE (onibus_id uuid, codigo text, nome text, rota text, descricao_rota text,
               capacidade integer, hora_ida time, hora_volta time,
               ocupados_ida bigint, ocupados_volta bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.codigo, o.nome, o.rota, o.descricao_rota, o.capacidade, o.hora_ida, o.hora_volta,
    (SELECT count(*) FROM assentos a WHERE a.viagem_id = p_viagem AND a.onibus_id = o.id AND a.trecho = 'ida'),
    (SELECT count(*) FROM assentos a WHERE a.viagem_id = p_viagem AND a.onibus_id = o.id AND a.trecho = 'volta')
  FROM onibus o WHERE o.ativo ORDER BY o.ordem;
$$;

REVOKE ALL ON FUNCTION public.proxima_poltrona(uuid,uuid,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reservar_transporte(uuid,uuid,text,uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancelar_transporte(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ocupacao_viagem(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reservar_transporte(uuid,uuid,text,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_transporte(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ocupacao_viagem(uuid) TO service_role;