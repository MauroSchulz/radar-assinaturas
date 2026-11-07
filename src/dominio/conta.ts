/**
 * Conta de demonstração: saldo, Pix e transferência saindo da conta (débito) e Pix no crédito
 * (sai do limite do cartão, em parcelas com juros, e entra na fatura).
 *
 * É simulação: nenhum dinheiro se move. O saldo começa num valor de exemplo e cada envio
 * pelo débito desconta dele; cada Pix no crédito soma a primeira parcela na fatura aberta e
 * reserva o total no limite.
 */
import { hoje, type DataISO } from './datas';
import { parcelaPrice } from './emprestimo';
import { dinheiro } from './formato';
import type { Fatura } from './cartao';

/** Saldo de exemplo da conta: R$ 4.832,17. */
export const SALDO_INICIAL_DEMO = 483217;
/** Juros de exemplo do Pix no crédito: 3,49% ao mês, inclusive em 1x. */
export const JUROS_PIX_CREDITO_MENSAL = 0.0349;
export const PARCELAS_PIX_CREDITO = [1, 2, 3, 6, 12];

export type TipoEnvio = 'pix' | 'transferencia' | 'pixCredito';

export const NOME_DO_ENVIO: Record<TipoEnvio, string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  pixCredito: 'Pix no crédito',
};

export interface Envio {
  id: string;
  tipo: TipoEnvio;
  data: DataISO;
  /** O que chega para quem recebe, em centavos. */
  valor: number;
  /** Nome de quem recebe (no Pix pode faltar: aí aparece a chave). */
  para: string;
  /** "Chave celular: +55…" ou "Banco X · ag. 0001 · conta 123-4". */
  destino: string;
  descricao?: string;
  /** Só no Pix no crédito. */
  credito?: { parcelas: number; parcela: number; total: number; juros: number };
}

export interface SimulacaoPixCredito {
  valor: number;
  parcelas: number;
  parcela: number;
  /** O que vai para a fatura somando todas as parcelas. */
  total: number;
  juros: number;
  taxaMensal: number;
}

/** Parcelas fixas (Tabela Price). Mesmo em 1x há juros de um mês: é crédito, não débito. */
export function simularPixNoCredito(valor: number, parcelas: number, taxaMensal: number = JUROS_PIX_CREDITO_MENSAL): SimulacaoPixCredito {
  const parcela = parcelaPrice(valor, taxaMensal, parcelas);
  const total = parcela * parcelas;
  return { valor, parcelas, parcela, total, juros: total - valor, taxaMensal };
}

/** O saldo depois dos envios pelo débito. O Pix no crédito não mexe no saldo. */
export function saldoDaConta(envios: Envio[], saldoInicial: number = SALDO_INICIAL_DEMO): number {
  return saldoInicial - envios.filter((e) => e.tipo !== 'pixCredito').reduce((s, e) => s + e.valor, 0);
}

/**
 * Por que um envio não pode sair, ou `null` se pode. `valor` é o que a pessoa digitou já lido
 * (`null` quando não deu para ler). No crédito, o que precisa caber no limite é o total com juros.
 */
export function erroDoValor(
  tipo: TipoEnvio,
  valor: number | null,
  disponivel: { saldo: number; limite: number },
  parcelas = 1,
): string | null {
  if (valor === null) return 'Escreva o valor, por exemplo 50 ou 1.250,00.';
  if (tipo === 'pixCredito') {
    const { total } = simularPixNoCredito(valor, parcelas);
    return total > disponivel.limite ? `Com os juros fica ${dinheiro(total)}, e o limite disponível é ${dinheiro(disponivel.limite)}.` : null;
  }
  return valor > disponivel.saldo ? `Seu saldo em conta é ${dinheiro(disponivel.saldo)}.` : null;
}

/** Agência: de 1 a 5 números. Conta: números com o dígito depois do traço (o traço é opcional). */
export function agenciaValida(agencia: string): boolean {
  return /^\d{1,5}$/.test(agencia.trim());
}

export function contaValida(conta: string): boolean {
  return /^\d{1,12}-?[\dXx]$/.test(conta.trim());
}

export interface FaturaComPix extends Fatura {
  /** Primeiras parcelas de Pix no crédito que caem nesta fatura. */
  pixNoCredito: number;
}

/**
 * A fatura aberta somando o Pix no crédito: a 1ª parcela de cada um feito neste ciclo entra no
 * total, e o total com juros de todos sai do limite (as parcelas futuras continuam reservadas).
 */
export function faturaComPixNoCredito(fatura: Fatura, envios: Envio[]): FaturaComPix {
  const credito = envios.filter((e) => e.tipo === 'pixCredito' && e.credito);
  const nestaFatura = credito
    .filter((e) => e.data >= fatura.abertura && e.data <= fatura.fechamento)
    .reduce((s, e) => s + e.credito!.parcela, 0);
  const reservado = credito.reduce((s, e) => s + e.credito!.total, 0);
  return {
    ...fatura,
    total: fatura.total + nestaFatura,
    limiteDisponivel: Math.max(0, fatura.limiteDisponivel - reservado),
    pixNoCredito: nestaFatura,
  };
}

/** Código do comprovante: "E" + data + 8 caracteres, como o identificador de um Pix de verdade. */
export function codigoDoComprovante(id: string, data: DataISO = hoje()): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `E${data.replace(/-/g, '')}${h.toString(36).toUpperCase().padStart(8, '0').slice(-8)}`;
}
