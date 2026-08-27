import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cpfValido, normalizarCpf } from "./cpf";
import type {
  Aluno,
  InicioAluno,
  ItemHistorico,
  StatusSolicitacao,
  LinhaPassageiro,
  Onibus,
  OnibusOcupacao,
  PainelOnibus,
  PainelViagem,
  SolicitacaoDetalhe,
  TipoViagem,
  Viagem,
} from "./tipos";

import { auditar, encerrarPassadas, exigirLimite, registrarTentativa } from "./seguranca.server";
import {
  encerrarSessaoAdmin,
  encerrarSessaoAluno,
  exigirAdmin,
  exigirAluno,
  iniciarSessaoAdmin,
  iniciarSessaoAluno,
} from "./session.server";

const CAMPOS_ALUNO =
  "id, nome, cpf, matricula, curso, instituicao, ativo, nascimento, rg, endereco, telefone, email, dias_semana, inicio_aulas";

const MENSAGENS: Record<string, string> = {
  ALUNO_NAO_CADASTRADO:
    "CPF não encontrado. Entre em contato com a responsável pelo transporte.",
  ALUNO_INATIVO:
    "Seu cadastro está inativo. Entre em contato com a responsável pelo transporte.",
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
  await exigirLimite("aluno");
  const cpf = normalizarCpf(cpfBruto);
  if (!cpfValido(cpf)) {
    await registrarTentativa("aluno", false);
    throw erroAmigavel(new Error("CPF_INVALIDO"));
  }

  const { data, error } = await supabaseAdmin
    .from("alunos")
    .select(CAMPOS_ALUNO)
    .eq("cpf", cpf)
    .maybeSingle();
  if (error) throw erroAmigavel(error);
  if (!data || !data.ativo) {
    await registrarTentativa("aluno", false);
    throw erroAmigavel(new Error(!data ? "ALUNO_NAO_CADASTRADO" : "ALUNO_INATIVO"));
  }

  await registrarTentativa("aluno", true);
  await iniciarSessaoAluno(data.id);
  return data as Aluno;
}

export async function alunoAtual(): Promise<Aluno | null> {
  const { alunoIdDaSessao } = await import("./session.server");
  const id = await alunoIdDaSessao();
  if (!id) return null;
  const { data } = await supabaseAdmin
    .from("alunos")
    .select(CAMPOS_ALUNO)
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
    .eq("status", "confirmada")
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
  await auditar(`aluno:${alunoId}`, "cancelou", "solicitacao", null, { viagem_id: viagemId });
}

/* ---------------- Administrador ---------------- */

export async function entrarAdmin(senha: string): Promise<void> {
  await exigirLimite("admin");
  const { data, error } = await supabaseAdmin.rpc("verificar_senha_admin", { p_senha: senha });
  if (error) throw erroAmigavel(error);
  if (!data) {
    await registrarTentativa("admin", false);
    throw new Error("Senha incorreta.");
  }
  await registrarTentativa("admin", true);
  await auditar("admin", "entrou", "sessao", null);
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
    .select(CAMPOS_ALUNO)
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

const SELECT_HISTORICO =
  "id, tipo, status, created_at, poltrona_ida, poltrona_volta, " +
  "viagens(data, status), " +
  "ida:onibus!solicitacoes_onibus_ida_id_fkey(nome, rota, hora_ida), " +
  "volta:onibus!solicitacoes_onibus_volta_id_fkey(nome, rota, hora_volta)";

type LinhaOnibus = { nome: string; rota: string | null; hora_ida?: string; hora_volta?: string };

function hojeCeara(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
}

function montarHistorico(linhas: Record<string, unknown>[]): ItemHistorico[] {
  const hoje = hojeCeara();
  return linhas
    .map((s) => {
      const viagem = s["viagens"] as { data: string; status: string } | null;
      const ida = s["ida"] as LinhaOnibus | null;
      const volta = s["volta"] as LinhaOnibus | null;
      const bruto = s["status"] as StatusSolicitacao;
      let status: StatusSolicitacao = bruto;
      if (bruto === "confirmada") {
        if (viagem?.status === "cancelada") status = "viagem_cancelada";
        else if ((viagem?.data ?? "") < hoje) status = "encerrada";
      }
      return {
        id: s["id"] as string,
        data: viagem?.data ?? "",
        tipo: s["tipo"] as TipoViagem,
        onibus_ida: ida?.nome ?? null,
        onibus_volta: volta?.nome ?? null,
        rota_ida: ida?.rota ?? null,
        rota_volta: volta?.rota ?? null,
        saida_pacuja: ida?.hora_ida ? ida.hora_ida.slice(0, 5) : null,
        saida_sobral: volta?.hora_volta ? volta.hora_volta.slice(0, 5) : null,
        poltrona_ida: (s["poltrona_ida"] as number | null) ?? null,
        poltrona_volta: (s["poltrona_volta"] as number | null) ?? null,
        criado_em: s["created_at"] as string,
        status,
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em));
}

async function historicoDoAluno(alunoId: string): Promise<ItemHistorico[]> {
  const { data, error } = await supabaseAdmin
    .from("solicitacoes")
    .select(SELECT_HISTORICO)
    .eq("aluno_id", alunoId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw erroAmigavel(error);
  return montarHistorico((data ?? []) as unknown as Record<string, unknown>[]);
}

/** Área inicial do aluno: cadastro, próxima data, solicitação atual e histórico. */
export async function inicioAluno(): Promise<InicioAluno> {
  const alunoId = await exigirAluno();
  await encerrarPassadas();
  const aluno = await alunoAtual();
  if (!aluno) throw erroAmigavel(new Error("SESSAO_EXPIRADA"));

  const { data: viagens, error } = await supabaseAdmin
    .from("viagens")
    .select("id, data, abertura_em, fechamento_em, status")
    .neq("status", "cancelada")
    .gte("data", hojeCeara())
    .order("data")
    .limit(1);
  if (error) throw erroAmigavel(error);

  const historico = await historicoDoAluno(alunoId);

  let proxima: InicioAluno["proxima"] = null;
  let solicitacao: ItemHistorico | null = null;

  const bruta = viagens?.[0];
  if (bruta) {
    const viagem = viagemComEstado(bruta);
    const agora = Date.now();
    const janela: "aberta" | "aguardando" | "encerrada" = viagem.aberta_agora
      ? "aberta"
      : viagem.status === "aberta" && agora < new Date(viagem.abertura_em).getTime()
        ? "aguardando"
        : "encerrada";
    const onibus = await listarOnibus();
    const primeiro = onibus[0];
    proxima = { viagem, janela, saida_pacuja: primeiro ? primeiro.hora_ida.slice(0, 5) : null };
    solicitacao =
      historico.find((h) => h.data === viagem.data && h.status === "confirmada") ?? null;
  }

  return { aluno, proxima, solicitacao, historico };
}

export async function detalhesAluno(
  id: string,
): Promise<{ aluno: Aluno; historico: ItemHistorico[] }> {
  await exigirAdmin();
  const { data: aluno, error } = await supabaseAdmin
    .from("alunos")
    .select(CAMPOS_ALUNO)
    .eq("id", id)
    .maybeSingle();
  if (error) throw erroAmigavel(error);
  if (!aluno) throw new Error("Aluno não encontrado.");

  return { aluno: aluno as Aluno, historico: await historicoDoAluno(id) };
}

export interface EntradaAluno {
  id?: string | undefined;
  nome: string;
  cpf: string;
  matricula: string;
  curso: string;
  instituicao: string;
  ativo: boolean;
  nascimento?: string | null | undefined;
  rg?: string | null | undefined;
  endereco?: string | null | undefined;
  telefone?: string | null | undefined;
  email?: string | null | undefined;
  dias_semana?: string[] | undefined;
  inicio_aulas?: string | null | undefined;
}

function texto(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
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
    nascimento: texto(entrada.nascimento),
    rg: texto(entrada.rg),
    endereco: texto(entrada.endereco),
    telefone: texto(entrada.telefone),
    email: texto(entrada.email),
    dias_semana: entrada.dias_semana ?? [],
    inicio_aulas: texto(entrada.inicio_aulas),
  };
  const query = entrada.id
    ? supabaseAdmin.from("alunos").update(registro).eq("id", entrada.id)
    : supabaseAdmin.from("alunos").insert(registro);
  const { data, error } = await query
    .select(CAMPOS_ALUNO)
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Já existe um aluno com este CPF.");
    throw erroAmigavel(error);
  }
  const salvo = data as Aluno;
  await auditar("admin", entrada.id ? "editou" : "criou", "aluno", salvo.id, { nome: salvo.nome });
  return salvo;
}


export async function alternarAtivo(id: string, ativo: boolean): Promise<void> {
  await exigirAdmin();
  const { error } = await supabaseAdmin.from("alunos").update({ ativo }).eq("id", id);
  if (error) throw erroAmigavel(error);
  await auditar("admin", ativo ? "reativou" : "inativou", "aluno", id);
}

export async function listarViagens(): Promise<Viagem[]> {
  await exigirAdmin();
  await encerrarPassadas();
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
  await auditar("admin", entrada.id ? "editou" : "criou", "viagem", data.id, { data: data.data });
  return viagemComEstado(data);
}

export async function alterarStatusViagem(id: string, status: Viagem["status"]): Promise<void> {
  await exigirAdmin();
  const { error } = await supabaseAdmin.from("viagens").update({ status }).eq("id", id);
  if (error) throw erroAmigavel(error);
  await auditar("admin", "alterou_status", "viagem", id, { status });
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

