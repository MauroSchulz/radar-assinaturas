/**
 * Simulador de empréstimo pessoal em parcelas fixas (Tabela Price).
 *
 * É simulação, não oferta de crédito: usa uma taxa de exemplo e não inclui IOF nem seguro,
 * que no empréstimo de verdade entram no custo efetivo total (CET).
 */

/** Valor disponível de demonstração, em centavos. */
export const LIMITE_EMPRESTIMO = 1000000;
/** Taxa de exemplo: 3,99% ao mês. */
export const TAXA_EMPRESTIMO_MENSAL = 0.0399;

/** Parcela fixa da Tabela Price: valor × i ÷ (1 − (1 + i)^−n). Sem juros, é a divisão simples. */
export function parcelaPrice(valor: number, taxaMensal: number, parcelas: number): number {
  if (parcelas <= 0) throw new Error('Número de parcelas precisa ser positivo');
  if (taxaMensal === 0) return Math.round(valor / parcelas);
  return Math.round((valor * taxaMensal) / (1 - (1 + taxaMensal) ** -parcelas));
}

export interface SimulacaoEmprestimo {
  valor: number;
  parcelas: number;
  parcela: number;
  /** Tudo o que você paga no fim. */
  total: number;
  juros: number;
  taxaMensal: number;
  /** A mesma taxa ao ano, composta. */
  taxaAnual: number;
}

export function simularEmprestimo(valor: number, parcelas: number, taxaMensal: number = TAXA_EMPRESTIMO_MENSAL): SimulacaoEmprestimo {
  const parcela = parcelaPrice(valor, taxaMensal, parcelas);
  const total = parcela * parcelas;
  return { valor, parcelas, parcela, total, juros: total - valor, taxaMensal, taxaAnual: (1 + taxaMensal) ** 12 - 1 };
}
