export type Trecho = "ida" | "volta";
export type TipoViagem = "ida" | "volta" | "ida_volta";

export interface Onibus {
  id: string;
  codigo: string;
  nome: string;
  rota: string | null;
  descricao_rota: string | null;
  capacidade: number;
  hora_ida: string;
  hora_volta: string;
}

export interface OnibusOcupacao extends Onibus {
  ocupados_ida: number;
  ocupados_volta: number;
}

export interface Viagem {
  id: string;
  data: string;
  abertura_em: string;
  fechamento_em: string;
  status: "aberta" | "fechada" | "cancelada";
  aberta_agora: boolean;
}

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  curso: string;
  instituicao: string;
  ativo: boolean;
  nascimento: string | null;
  rg: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  dias_semana: string[];
  inicio_aulas: string | null;
}

export type StatusSolicitacao = "confirmada" | "cancelada" | "encerrada" | "viagem_cancelada";

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  encerrada: "Encerrada",
  viagem_cancelada: "Viagem cancelada",
};

export interface ItemHistorico {
  id: string;
  data: string;
  tipo: TipoViagem;
  onibus_ida: string | null;
  onibus_volta: string | null;
  rota_ida: string | null;
  rota_volta: string | null;
  saida_pacuja: string | null;
  saida_sobral: string | null;
  poltrona_ida: number | null;
  poltrona_volta: number | null;
  criado_em: string;
  status: StatusSolicitacao;
}

export interface InicioAluno {
  aluno: Aluno;
  proxima: {
    viagem: Viagem;
    janela: "aberta" | "aguardando" | "encerrada";
    saida_pacuja: string | null;
  } | null;
  solicitacao: ItemHistorico | null;
  historico: ItemHistorico[];
}

export interface SolicitacaoDetalhe {
  id: string;
  viagem_id: string;
  tipo: TipoViagem;
  onibus_ida: Onibus | null;
  onibus_volta: Onibus | null;
  poltrona_ida: number | null;
  poltrona_volta: number | null;
}


export interface LinhaPassageiro {
  solicitacao_id: string;
  nome: string;
  matricula: string;
  curso: string;
  tipo: TipoViagem;
  poltrona_ida: number | null;
  poltrona_volta: number | null;
}

export interface PainelOnibus {
  onibus: OnibusOcupacao;
  hora_ida: string;
  hora_volta: string;
  linhas: LinhaPassageiro[];
}

export interface PainelViagem {
  viagem: Viagem;
  onibus: OnibusOcupacao[];
  listas: PainelOnibus[];
}


export const ROTULO_TIPO: Record<TipoViagem, string> = {
  ida: "Apenas ida",
  volta: "Apenas volta",
  ida_volta: "Ida e volta",
};

export interface ViagemComOcupacao {
  viagem: Viagem;
  onibus: OnibusOcupacao[];
  solicitacao: SolicitacaoDetalhe | null;
}
