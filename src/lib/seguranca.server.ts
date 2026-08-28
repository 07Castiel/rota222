import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Limites de tentativas por janela de tempo. */
const LIMITES = {
  aluno: { max: 10, minutos: 15 },
  admin: { max: 5, minutos: 15 },
} as const;

export function ipCliente(): string {
  const encaminhado = getRequestHeader("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  return getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-real-ip") ?? "desconhecido";
}

/** Lança erro quando o IP excedeu as tentativas malsucedidas recentes. */
export async function exigirLimite(escopo: "aluno" | "admin"): Promise<void> {
  const { max, minutos } = LIMITES[escopo];
  const { data, error } = await supabaseAdmin.rpc("tentativas_recentes", {
    p_escopo: escopo,
    p_chave: ipCliente(),
    p_minutos: minutos,
  });
  if (error) return; // nunca bloquear o acesso por falha da verificação
  if (Number(data ?? 0) >= max) {
    throw new Error(
      `Muitas tentativas. Aguarde ${minutos} minutos antes de tentar novamente.`,
    );
  }
}

export async function registrarTentativa(
  escopo: "aluno" | "admin",
  sucesso: boolean,
): Promise<void> {
  await supabaseAdmin.rpc("registrar_tentativa", {
    p_escopo: escopo,
    p_chave: ipCliente(),
    p_sucesso: sucesso,
  });
}

export async function auditar(
  ator: string,
  acao: string,
  entidade: string,
  entidadeId: string | null,
  detalhes: Record<string, unknown> = {},
): Promise<void> {
  await supabaseAdmin.rpc("registrar_auditoria", {
    p_ator: ator,
    p_acao: acao,
    p_entidade: entidade,
    p_entidade_id: entidadeId as string,
    p_detalhes: { ...detalhes, ip: ipCliente() },
  });
}

/** Fecha janelas e encerra solicitações de datas já passadas. */
export async function encerrarPassadas(): Promise<void> {
  await supabaseAdmin.rpc("encerrar_viagens_passadas");
}
