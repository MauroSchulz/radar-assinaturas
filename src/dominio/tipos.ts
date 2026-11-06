import type { DataISO } from './datas';

/** Uma linha do extrato do cartão. Valor em centavos (inteiro), nunca em reais com vírgula. */
export interface Transacao {
  id: string;
  data: DataISO;
  descricao: string;
  valor: number;
}

export type Periodo = 'semanal' | 'mensal' | 'anual';

export type Categoria = 'video' | 'musica' | 'saude' | 'nuvem' | 'compras' | 'outros';

/** `ativa`: cobra todo período. `teste`: teste grátis que vai virar cobrança. `encerrada`: parou de cobrar. */
export type Situacao = 'ativa' | 'teste' | 'encerrada';

export interface Cobranca {
  id: string;
  data: DataISO;
  valor: number;
  /** Cobrança repetida do mesmo valor poucos dias depois de outra. */
  duplicada: boolean;
}

export interface Duplicidade {
  primeira: Cobranca;
  repetida: Cobranca;
}

export interface Assinatura {
  /** Chave do comerciante, já normalizada (ex.: `NETFLIX.COM`). */
  id: string;
  nome: string;
  categoria: Categoria;
  periodo: Periodo;
  situacao: Situacao;
  /** Valor da última cobrança; no teste grátis, o preço que vai começar a cobrar (0 se desconhecido). */
  valorAtual: number;
  /** Valor antes da última mudança de preço, ou `null` se o preço nunca mudou. */
  valorAnterior: number | null;
  /** Data da primeira cobrança no preço atual, quando houve mudança. */
  mudouEm: DataISO | null;
  /** Do mais antigo ao mais recente. */
  cobrancas: Cobranca[];
  duplicidades: Duplicidade[];
  ultimaCobranca: DataISO | null;
  /** No teste grátis, é o dia em que o teste acaba. */
  proximaCobranca: DataISO;
  /** Quanto custa (ou vai custar, no teste) convertido para um mês e para um ano. */
  custoMensal: number;
  custoAnual: number;
  comoCancelar: string[];
}

export type Decisao = 'manter' | 'cancelar';
