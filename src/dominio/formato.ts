import type { Periodo } from './tipos';

/** Espaço que não quebra linha: `R$` nunca fica sozinho no fim da linha. */
const ESPACO_FIXO = ' ';

/**
 * Centavos para `R$ 1.234,56`. Feito à mão porque o Hermes (motor do React Native)
 * nem sempre traz os dados de idioma que o `toLocaleString` precisa.
 */
export function dinheiro(centavos: number): string {
  const negativo = centavos < 0;
  const total = Math.abs(Math.round(centavos));
  const reais = String(Math.floor(total / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = String(total % 100).padStart(2, '0');
  return `${negativo ? '-' : ''}R$${ESPACO_FIXO}${reais},${resto}`;
}

/** Valor curto para rótulo de gráfico: `R$ 4,9 mil`, `R$ 850`, `R$ 1,2 mi`. */
export function dinheiroCurto(centavos: number): string {
  const reais = Math.round(centavos / 100);
  const com1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (Math.abs(reais) >= 1_000_000) return `R$${ESPACO_FIXO}${com1(reais / 1_000_000)} mi`;
  if (Math.abs(reais) >= 1_000) return `R$${ESPACO_FIXO}${com1(reais / 1_000)} mil`;
  return `R$${ESPACO_FIXO}${reais}`;
}

/** 0.125 para `12,5%`; 0.1 para `10%`; com `casas = 2`, 0.1415 para `14,15%`. */
export function porcentagem(fracao: number, casas = 1): string {
  const fator = 10 ** casas;
  const valor = Math.round(fracao * 100 * fator) / fator;
  const texto = Number.isInteger(valor) ? String(valor) : valor.toFixed(casas).replace(/0+$/, '').replace('.', ',');
  return `${texto}%`;
}

/**
 * Lê o que a pessoa digitou como dinheiro e devolve centavos: `"44,90"`, `"44,9"`, `"1.234,56"`,
 * `"R$ 100"` e `"100"` funcionam. Devolve `null` se não for um valor positivo.
 */
export function lerValor(texto: string): number | null {
  const limpo = texto.replace(/R\$/i, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const [inteiro, decimal = ''] = limpo.replace(/\./g, '').split(',');
  const centavos = Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
  return centavos > 0 ? centavos : null;
}

export const POR_PERIODO: Record<Periodo, string> = {
  semanal: 'por semana',
  mensal: 'por mês',
  anual: 'por ano',
};

export const NOME_DO_PERIODO: Record<Periodo, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};
