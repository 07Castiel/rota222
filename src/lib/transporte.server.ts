import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cpfValido, normalizarCpf } from "./cpf";
import type {
  Aluno,
  LinhaPassageiro,
  Onibus,
  OnibusOcupacao,
  PainelOnibus,
  PainelViagem,
  SolicitacaoDetalhe,
  TipoViagem,
  Viagem,
} from "./tipos";

import {
  encerrarSessaoAdmin,
  encerrarSessaoAluno,
  exigirAdmin,
  exigirAluno,
  iniciarSessaoAdmin,
  iniciarSessaoAluno,
} from "./session.server";

const MENSAGENS: Record<string, string> = {
  ALUNO_NAO_CADASTRADO: "CPF não cadastrado. Procure a administração.",
  ALUNO_INATIVO: "Seu cadastro está inativo. Procure a administração.",
  CPF_INVALIDO: "CPF inválido.",
  JANELA_FECHADA: "As solicitações desta data não estão abertas.",
  ONIBUS_LOTADO: "Este ônibus já está lotado neste trecho.",
  ONIBUS_INVALIDO: "Ônibus inválido.",
  TIPO_INVALIDO: "Tipo de viagem inválido.",
  VIAGEM_INEXISTENTE: "Data de transporte não encontrada.",
  ONIBUS_IDA_OBRIGATORIO: "Selecione o ônibus da ida.",
  ONIBUS_VOLTA_OBRIGATORIO: "Selecione o ônibus da volta.",
  SESSAO_EXPIRADA: "Sessão expirada. Entre novamente com seu CPF.",
  ACESSO_NEGADO: "Acesso negado.",
};

export function erroAmigavel(e: unknown): Error {
  const bruto = e instanceof Error ? e.message : String(e);
  const chave = Object.keys(MENSAGENS).find((k) => bruto.includes(k));
  return new Error(chave ? MENSAGENS[chave]! : bruto);
}

function viagemComEstado(v: {
  id: string;
  data: string;
  abertura_em: string;
  fechamento_em: string;
  status: string;
}): Viagem {
  const agora = Date.now();
  return {
    id: v.id,
    data: v.data,
    abertura_em: v.abertura_em,
    fechamento_em: v.fechamento_em,
    status: v.status as Viagem["status"],
    aberta_agora:
      v.status === "aberta" &&
      agora >= new Date(v.abertura_em).getTime() &&
      agora <= new Date(v.fechamento_em).getTime(),
  };
}

/* ---------------- Aluno ---------------- */

export async function entrarComCpf(cpfBruto: string): Promise<Aluno> {
  const cpf = normalizarCpf(cpfBruto);
  if (!cpfValido(cpf)) throw erroAmigavel(new Error("CPF_INVALIDO"));

  const { data, error } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, cpf, matricula, curso, instituicao, ativo")
    .eq("cpf", cpf)
    .maybeSingle();
  if (error) throw erroAmigavel(error);
  if (!data) throw erroAmigavel(new Error("ALUNO_NAO_CADASTRADO"));
  if (!data.ativo) throw erroAmigavel(new Error("ALUNO_INATIVO"));

  await iniciarSessaoAluno(data.id);
  return data as Aluno;
}

export async function alunoAtual(): Promise<Aluno | null> {
  const { alunoIdDaSessao } = await import("./session.server");
  const id = await alunoIdDaSessao();
  if (!id) return null;
  const { data } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, cpf, matricula, curso, instituicao, ativo")
    .eq("id", id)
    .maybeSingle();
  if (!data || !data.ativo) return null;
  return data as Aluno;
}

export function sairAluno() {
  encerrarSessaoAluno();
}

async function listarOnibus(): Promise<Onibus[]> {
  const { data, error } = await supabaseAdmin
    .from("onibus")
    .select("id, codigo, nome, rota, descricao_rota, capacidade, hora_ida, hora_volta")
    .eq("ativo", true)
    .order("ordem");
  if (error) throw erroAmigavel(error);
  return (data ?? []) as Onibus[];
}

async function ocupacao(viagemId: string): Promise<OnibusOcupacao[]> {
  const { data, error } = await supabaseAdmin.rpc("ocupacao_viagem", { p_viagem: viagemId });
  if (error) throw erroAmigavel(error);
  return (data ?? []).map((o: Record<string, unknown>) => ({
    id: o["onibus_id"] as string,
    codigo: o["codigo"] as string,
    nome: o["nome"] as string,
    rota: (o["rota"] ?? null) as string | null,
    descricao_rota: (o["descricao_rota"] ?? null) as string | null,
    capacidade: Number(o["capacidade"]),
    hora_ida: o["hora_ida"] as string,
    hora_volta: o["hora_volta"] as string,
    ocupados_ida: Number(o["ocupados_ida"]),
    ocupados_volta: Number(o["ocupados_volta"]),
  }));
}

import type { ViagemComOcupacao } from "./tipos";
export type { ViagemComOcupacao };


export async function painelDoAluno(): Promise<{ aluno: Aluno; datas: ViagemComOcupacao[] }> {
  const alunoId = await exigirAluno();
  const aluno = await alunoAtual();
  if (!aluno) throw erroAmigavel(new Error("SESSAO_EXPIRADA"));

  const hoje = new Date();
  hoje.setDate(hoje.getDate() - 1);
  const { data, error } = await supabaseAdmin
    .from("viagens")
    .select("id, data, abertura_em, fechamento_em, status")
    .neq("status", "cancelada")
    .gte("data", hoje.toISOString().slice(0, 10))
    .order("data");
  if (error) throw erroAmigavel(error);

  const datas: ViagemComOcupacao[] = [];
  for (const v of data ?? []) {
    datas.push({
      viagem: viagemComEstado(v),
      onibus: await ocupacao(v.id),
      solicitacao: await buscarSolicitacao(alunoId, v.id),
    });
  }
  return { aluno, datas };
}

async function buscarSolicitacao(alunoId: string, viagemId: string): Promise<SolicitacaoDetalhe | null> {
  const { data, error } = await supabaseAdmin
    .from("solicitacoes")
    .select("id, viagem_id, tipo, onibus_ida_id, onibus_volta_id")
    .eq("aluno_id", alunoId)
    .eq("viagem_id", viagemId)
    .maybeSingle();
  if (error) throw erroAmigavel(error);
  if (!data) return null;

  const { data: assentos } = await supabaseAdmin
    .from("assentos")
    .select("trecho, numero")
    .eq("solicitacao_id", data.id);

  const onibus = await listarOnibus();
  const acha = (id: string | null) => onibus.find((o) => o.id === id) ?? null;

  return {
    id: data.id,
    viagem_id: data.viagem_id,
    tipo: data.tipo as TipoViagem,
    onibus_ida: acha(data.onibus_ida_id),
    onibus_volta: acha(data.onibus_volta_id),
    poltrona_ida: assentos?.find((a) => a.trecho === "ida")?.numero ?? null,
    poltrona_volta: assentos?.find((a) => a.trecho === "volta")?.numero ?? null,
  };
}

export async function reservar(input: {
  viagemId: string;
  tipo: TipoViagem;
  onibusIdaId: string | null;
  onibusVoltaId: string | null;
}): Promise<SolicitacaoDetalhe> {
  const alunoId = await exigirAluno();
  const { error } = await supabaseAdmin.rpc("reservar_transporte", {
    p_aluno: alunoId,
    p_viagem: input.viagemId,
    p_tipo: input.tipo,
    p_onibus_ida: input.onibusIdaId as string,
    p_onibus_volta: input.onibusVoltaId as string,
  });
  if (error) throw erroAmigavel(error);
  const solicitacao = await buscarSolicitacao(alunoId, input.viagemId);
  if (!solicitacao) throw erroAmigavel(new Error("Não foi possível registrar a solicitação."));
  return solicitacao;
}

export async function cancelar(viagemId: string): Promise<void> {
  const alunoId = await exigirAluno();
  const { error } = await supabaseAdmin.rpc("cancelar_transporte", {
    p_aluno: alunoId,
    p_viagem: viagemId,
  });
  if (error) throw erroAmigavel(error);
}

/* ---------------- Administrador ---------------- */

export async function entrarAdmin(senha: string): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc("verificar_senha_admin", { p_senha: senha });
  if (error) throw erroAmigavel(error);
  if (!data) throw new Error("Senha incorreta.");
  await iniciarSessaoAdmin();
}

export function sairAdmin() {
  encerrarSessaoAdmin();
}

export async function listarAlunos(
  busca: string,
  status: "todos" | "ativos" | "inativos" = "todos",
): Promise<Aluno[]> {
  await exigirAdmin();
  let q = supabaseAdmin
    .from("alunos")
    .select("id, nome, cpf, matricula, curso, instituicao, ativo")
    .order("nome");
  if (status === "ativos") q = q.eq("ativo", true);
  if (status === "inativos") q = q.eq("ativo", false);
  const termo = busca.trim();
  if (termo) {
    const digitos = normalizarCpf(termo);
    q = digitos.length >= 3
      ? q.or(`nome.ilike.%${termo}%,cpf.ilike.%${digitos}%,matricula.ilike.%${termo}%,curso.ilike.%${termo}%,instituicao.ilike.%${termo}%`)
      : q.or(`nome.ilike.%${termo}%,matricula.ilike.%${termo}%,curso.ilike.%${termo}%,instituicao.ilike.%${termo}%`);
  }
  const { data, error } = await q.limit(300);
  if (error) throw erroAmigavel(error);
  return (data ?? []) as Aluno[];
}

export interface HistoricoAluno {
  viagem_data: string;
  tipo: TipoViagem;
  poltrona_ida: number | null;
  poltrona_volta: number | null;
}

export async function detalhesAluno(
  id: string,
): Promise<{ aluno: Aluno; historico: HistoricoAluno[] }> {
  await exigirAdmin();
  const { data: aluno, error } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, cpf, matricula, curso, instituicao, ativo")
    .eq("id", id)
    .maybeSingle();
  if (error) throw erroAmigavel(error);
  if (!aluno) throw new Error("Aluno não encontrado.");

  const { data: sols, error: erroSols } = await supabaseAdmin
    .from("solicitacoes")
    .select("id, tipo, viagens(data), assentos(trecho, numero)")
    .eq("aluno_id", id)
    .limit(50);
  if (erroSols) throw erroAmigavel(erroSols);

  const historico: HistoricoAluno[] = (sols ?? [])
    .map((s) => {
      const assentos = (s.assentos ?? []) as unknown as { trecho: string; numero: number }[];
      const viagem = s.viagens as unknown as { data: string } | null;
      return {
        viagem_data: viagem?.data ?? "",
        tipo: s.tipo as TipoViagem,
        poltrona_ida: assentos.find((a) => a.trecho === "ida")?.numero ?? null,
        poltrona_volta: assentos.find((a) => a.trecho === "volta")?.numero ?? null,
      };
    })
    .sort((a, b) => b.viagem_data.localeCompare(a.viagem_data));

  return { aluno: aluno as Aluno, historico };
}


export interface EntradaAluno {
  id?: string | undefined;
  nome: string;
  cpf: string;
  matricula: string;
  curso: string;
  instituicao: string;
  ativo: boolean;
}

export async function salvarAluno(entrada: EntradaAluno): Promise<Aluno> {
  await exigirAdmin();
  const cpf = normalizarCpf(entrada.cpf);
  if (!cpfValido(cpf)) throw erroAmigavel(new Error("CPF_INVALIDO"));
  const registro = {
    nome: entrada.nome.trim(),
    cpf,
    matricula: entrada.matricula.trim(),
    curso: entrada.curso.trim(),
    instituicao: entrada.instituicao.trim(),
    ativo: entrada.ativo,
  };
  const query = entrada.id
    ? supabaseAdmin.from("alunos").update(registro).eq("id", entrada.id)
    : supabaseAdmin.from("alunos").insert(registro);
  const { data, error } = await query
    .select("id, nome, cpf, matricula, curso, instituicao, ativo")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Já existe um aluno com este CPF.");
    throw erroAmigavel(error);
  }
  return data as Aluno;
}

export async function alternarAtivo(id: string, ativo: boolean): Promise<void> {
  await exigirAdmin();
  const { error } = await supabaseAdmin.from("alunos").update({ ativo }).eq("id", id);
  if (error) throw erroAmigavel(error);
}

export async function listarViagens(): Promise<Viagem[]> {
  await exigirAdmin();
  const { data, error } = await supabaseAdmin
    .from("viagens")
    .select("id, data, abertura_em, fechamento_em, status")
    .order("data", { ascending: false });
  if (error) throw erroAmigavel(error);
  return (data ?? []).map(viagemComEstado);
}

export async function salvarViagem(entrada: {
  id?: string | undefined;
  data: string;
  abertura_em: string;
  fechamento_em: string;
}): Promise<Viagem> {
  await exigirAdmin();
  if (new Date(entrada.fechamento_em) <= new Date(entrada.abertura_em)) {
    throw new Error("O fechamento deve ser posterior à abertura.");
  }
  const registro = {
    data: entrada.data,
    abertura_em: new Date(entrada.abertura_em).toISOString(),
    fechamento_em: new Date(entrada.fechamento_em).toISOString(),
  };
  const query = entrada.id
    ? supabaseAdmin.from("viagens").update(registro).eq("id", entrada.id)
    : supabaseAdmin.from("viagens").insert(registro);
  const { data, error } = await query
    .select("id, data, abertura_em, fechamento_em, status")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma viagem nesta data.");
    throw erroAmigavel(error);
  }
  return viagemComEstado(data);
}

export async function alterarStatusViagem(id: string, status: Viagem["status"]): Promise<void> {
  await exigirAdmin();
  const { error } = await supabaseAdmin.from("viagens").update({ status }).eq("id", id);
  if (error) throw erroAmigavel(error);
}

export async function painelViagem(viagemId: string): Promise<PainelViagem> {
  await exigirAdmin();
  const { data: v, error } = await supabaseAdmin
    .from("viagens")
    .select("id, data, abertura_em, fechamento_em, status")
    .eq("id", viagemId)
    .single();
  if (error) throw erroAmigavel(error);

  const onibus = await ocupacao(viagemId);

  const { data: assentos, error: erroAssentos } = await supabaseAdmin
    .from("assentos")
    .select(
      "numero, trecho, onibus_id, solicitacao_id, solicitacoes(tipo, alunos(nome, matricula, curso))",
    )
    .eq("viagem_id", viagemId)
    .order("numero");
  if (erroAssentos) throw erroAmigavel(erroAssentos);

  const listas: PainelOnibus[] = onibus.map((o) => {
    const porSolicitacao = new Map<string, LinhaPassageiro>();

    for (const a of assentos ?? []) {
      if (a.onibus_id !== o.id) continue;
      const s = a.solicitacoes as unknown as {
        tipo: TipoViagem;
        alunos: { nome: string; matricula: string; curso: string };
      };
      let linha = porSolicitacao.get(a.solicitacao_id);
      if (!linha) {
        linha = {
          solicitacao_id: a.solicitacao_id,
          nome: s?.alunos?.nome ?? "—",
          matricula: s?.alunos?.matricula ?? "—",
          curso: s?.alunos?.curso ?? "—",
          tipo: s?.tipo ?? "ida",
          poltrona_ida: null,
          poltrona_volta: null,
        };
        porSolicitacao.set(a.solicitacao_id, linha);
      }
      if (a.trecho === "ida") linha.poltrona_ida = a.numero;
      else linha.poltrona_volta = a.numero;
    }

    const linhas = [...porSolicitacao.values()].sort((x, y) => {
      const cx = x.poltrona_ida ?? x.poltrona_volta ?? 0;
      const cy = y.poltrona_ida ?? y.poltrona_volta ?? 0;
      return cx - cy || x.nome.localeCompare(y.nome, "pt-BR");
    });

    return {
      onibus: o,
      hora_ida: o.hora_ida.slice(0, 5),
      hora_volta: o.hora_volta.slice(0, 5),
      linhas,
    };
  });

  return { viagem: viagemComEstado(v), onibus, listas };
}

