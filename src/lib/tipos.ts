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

export interface Passageiro {
  poltrona: number;
  nome: string;
  matricula: string;
  curso: string;
  tipo: TipoViagem;
}

export interface PainelTrecho {
  onibus: OnibusOcupacao;
  trecho: Trecho;
  horario: string;
  origem: string;
  destino: string;
  passageiros: Passageiro[];
}

export interface PainelViagem {
  viagem: Viagem;
  onibus: OnibusOcupacao[];
  trechos: PainelTrecho[];
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
