import { z } from "zod";

export const esquemaCpf = z.object({
  cpf: z.string().trim().min(11).max(20),
});

export const esquemaSenhaAdmin = z.object({
  senha: z.string().min(4).max(200),
});

export const esquemaReserva = z.object({
  viagemId: z.string().uuid(),
  tipo: z.enum(["ida", "volta", "ida_volta"]),
  onibusIdaId: z.string().uuid().nullable(),
  onibusVoltaId: z.string().uuid().nullable(),
});

export const esquemaViagemId = z.object({
  viagemId: z.string().uuid(),
});

export const esquemaAluno = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(3, "Informe o nome completo").max(120),
  cpf: z.string().trim().min(11).max(20),
  matricula: z.string().trim().min(1, "Informe a matrícula").max(40),
  curso: z.string().trim().min(2, "Informe o curso").max(80),
  instituicao: z.string().trim().min(2, "Informe a instituição").max(80),
  ativo: z.boolean(),
  nascimento: z.string().max(10).nullish(),
  rg: z.string().trim().max(30).nullish(),
  endereco: z.string().trim().max(160).nullish(),
  telefone: z.string().trim().max(30).nullish(),
  email: z.string().trim().max(120).nullish(),
  dias_semana: z.array(z.string().max(20)).max(7).default([]),
  inicio_aulas: z.string().max(10).nullish(),
});

export const esquemaBusca = z.object({
  busca: z.string().max(80).default(""),
  status: z.enum(["todos", "ativos", "inativos"]).default("todos"),
});

export const esquemaAlunoId = z.object({
  id: z.string().uuid(),
});

export const esquemaAtivo = z.object({
  id: z.string().uuid(),
  ativo: z.boolean(),
});

export const esquemaViagem = z.object({
  id: z.string().uuid().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  abertura_em: z.string().min(10, "Informe a abertura"),
  fechamento_em: z.string().min(10, "Informe o fechamento"),
});

export const esquemaStatusViagem = z.object({
  id: z.string().uuid(),
  status: z.enum(["aberta", "fechada", "cancelada"]),
});

export const esquemaOnibus = z.object({
  id: z.string().uuid().optional(),
  codigo: z.string().trim().min(2, "Informe o código").max(30),
  nome: z.string().trim().min(2, "Informe o nome").max(80),
  rota: z.string().trim().max(40).nullish(),
  descricao_rota: z.string().trim().max(200).nullish(),
  capacidade: z.number().int().min(1).max(100),
  hora_ida: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  hora_volta: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  ordem: z.number().int().min(0).max(99),
  ativo: z.boolean(),
});

export const esquemaOnibusAtivo = z.object({
  id: z.string().uuid(),
  ativo: z.boolean(),
});

export const esquemaLoteViagens = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  dias: z.array(z.number().int().min(0).max(6)).min(1, "Selecione ao menos um dia"),
  abertura_hora: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  fechamento_hora: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  dias_antes_abertura: z.number().int().min(0).max(30),
});
