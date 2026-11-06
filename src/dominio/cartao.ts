/**
 * Cartão de crédito: a fatura que está aberta agora, o limite e quanto da fatura é assinatura.
 *
 * A fatura junta as compras do dia seguinte ao último fechamento até hoje. Fecha no
 * `diaFechamento` e vence no `diaVencimento` (no mesmo mês, ou no seguinte se o dia de
 * vencimento vier antes do de fechamento).
 */
import { hoje, noDia, somarDias, type DataISO } from './datas';
import { chaveDoComerciante } from './deteccao';
import type { Assinatura, Transacao } from './tipos';

export interface ConfigCartao {
  /** Em centavos. */
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
}

/** Cartão de demonstração. */
export const CARTAO_DEMO: ConfigCartao = { limite: 1500000, diaFechamento: 25, diaVencimento: 2 };

export interface Ciclo {
  /** Primeiro dia da fatura (dia seguinte ao fechamento anterior). */
  abertura: DataISO;
  fechamento: DataISO;
  vencimento: DataISO;
}

function partes(data: DataISO): [number, number, number] {
  const [a, m, d] = data.split('-').map(Number);
  return [a, m, d];
}

function mesSeguinte(ano: number, mes: number): [number, number] {
  return mes === 12 ? [ano + 1, 1] : [ano, mes + 1];
}

function mesAnterior(ano: number, mes: number): [number, number] {
  return mes === 1 ? [ano - 1, 12] : [ano, mes - 1];
}

/** A fatura aberta em `dataHoje`. No próprio dia do fechamento, ela ainda está aberta. */
export function cicloAtual(config: ConfigCartao, dataHoje: DataISO = hoje()): Ciclo {
  const [ano, mes, dia] = partes(dataHoje);
  const [aF, mF] = dia <= config.diaFechamento ? [ano, mes] : mesSeguinte(ano, mes);
  const fechamento = noDia(aF, mF, config.diaFechamento);
  const [aA, mA] = mesAnterior(aF, mF);
  const abertura = somarDias(noDia(aA, mA, config.diaFechamento), 1);
  const [aV, mV] = config.diaVencimento > config.diaFechamento ? [aF, mF] : mesSeguinte(aF, mF);
  return { abertura, fechamento, vencimento: noDia(aV, mV, config.diaVencimento) };
}

export interface Fatura extends Ciclo {
  compras: Transacao[];
  /** Compras menos estornos, até hoje. */
  total: number;
  limite: number;
  limiteDisponivel: number;
  /** Quanto do total são cobranças de assinatura. */
  emAssinaturas: number;
}

export function faturaAtual(
  extrato: Transacao[],
  assinaturas: Assinatura[],
  config: ConfigCartao = CARTAO_DEMO,
  dataHoje: DataISO = hoje(),
): Fatura {
  const ciclo = cicloAtual(config, dataHoje);
  const compras = extrato
    .filter((t) => t.valor !== 0 && t.data >= ciclo.abertura && t.data <= dataHoje)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const total = compras.reduce((s, t) => s + t.valor, 0);
  const chaves = new Set(assinaturas.map((a) => a.id));
  const emAssinaturas = compras.filter((t) => t.valor > 0 && chaves.has(chaveDoComerciante(t.descricao))).reduce((s, t) => s + t.valor, 0);
  return { ...ciclo, compras, total, limite: config.limite, limiteDisponivel: Math.max(0, config.limite - total), emAssinaturas };
}
