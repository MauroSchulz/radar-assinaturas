/**
 * Investimentos: caixinhas que rendem 100% do CDI e a simulação de "quanto suas
 * assinaturas virariam se fossem investidas".
 *
 * É simulação, não promessa: usa um CDI fixo (`CDI_ANUAL`), juros compostos e a tabela
 * regressiva do imposto de renda de renda fixa. Não considera IOF (só vale para resgates
 * em menos de 30 dias) nem a variação do CDI ao longo do tempo.
 */
import { diasEntre, hoje, somarMeses, type DataISO } from './datas';

/** CDI de exemplo (14,15% ao ano). Troque aqui para atualizar o app inteiro. */
export const CDI_ANUAL = 0.1415;

export function taxaMensal(anual: number): number {
  return (1 + anual) ** (1 / 12) - 1;
}

/** Em dias corridos: uma aproximação boa para mostrar saldo, não para conferir extrato de banco. */
export function taxaDiaria(anual: number): number {
  return (1 + anual) ** (1 / 365) - 1;
}

/**
 * Alíquota do IR de renda fixa pelo tempo aplicado: até 180 dias 22,5%, até 360 dias 20%,
 * até 720 dias 17,5%, acima disso 15%. Aqui contado em meses (6, 12 e 24).
 */
export function aliquotaIR(meses: number): number {
  if (meses <= 6) return 0.225;
  if (meses <= 12) return 0.2;
  if (meses <= 24) return 0.175;
  return 0.15;
}

export interface Simulacao {
  meses: number;
  /** Quanto você colocou. */
  aportado: number;
  /** Quanto teria antes do imposto. */
  bruto: number;
  rendimento: number;
  imposto: number;
  /** O que sobra se resgatar tudo no fim. */
  liquido: number;
}

/**
 * Guardar `aporte` centavos no começo de cada mês, por `meses` meses. Cada depósito paga IR
 * pela própria idade (o primeiro é o mais velho e paga menos).
 */
export function simularAportesMensais(aporte: number, meses: number, taxaAnual: number = CDI_ANUAL): Simulacao {
  const tm = taxaMensal(taxaAnual);
  let bruto = 0;
  let imposto = 0;
  for (let i = 0; i < meses; i++) {
    const idade = meses - i;
    const valorFinal = aporte * (1 + tm) ** idade;
    bruto += valorFinal;
    imposto += (valorFinal - aporte) * aliquotaIR(idade);
  }
  const aportado = aporte * meses;
  const brutoArredondado = Math.round(bruto);
  const impostoArredondado = Math.round(imposto);
  return {
    meses,
    aportado,
    bruto: brutoArredondado,
    rendimento: brutoArredondado - aportado,
    imposto: impostoArredondado,
    liquido: brutoArredondado - impostoArredondado,
  };
}

/** Em quantos meses o saldo chega na meta guardando `aporte` por mês. `null` se nunca chega (em 50 anos). */
export function mesesParaMeta(meta: number, aporte: number, saldoInicial = 0, taxaAnual: number = CDI_ANUAL): number | null {
  if (saldoInicial >= meta) return 0;
  const tm = taxaMensal(taxaAnual);
  let saldo = saldoInicial;
  for (let mes = 1; mes <= 600; mes++) {
    saldo = (saldo + aporte) * (1 + tm);
    if (saldo >= meta) return mes;
  }
  return null;
}

/* ---------- Caixinhas ---------- */

/** Depósito (valor positivo) ou resgate (negativo) feito na mão. */
export interface Movimento {
  id: string;
  data: DataISO;
  valor: number;
}

/** "Guardar R$ X todo mês", do dia `desde` até `ate` (ou para sempre, se `null`). */
export interface Recorrencia {
  valor: number;
  desde: DataISO;
  ate: DataISO | null;
}

export interface Caixinha {
  id: string;
  nome: string;
  criadaEm: DataISO;
  /** Em centavos; `null` é caixinha sem meta. */
  meta: number | null;
  recorrencias: Recorrencia[];
  movimentos: Movimento[];
  /** Quando nasceu da economia de uma assinatura cancelada. */
  origem?: { assinaturaId: string; nome: string };
}

export interface MovimentoDoExtrato extends Movimento {
  automatico: boolean;
}

/** Depósitos automáticos já feitos até hoje: um por mês, no mesmo dia de `desde`. */
export function depositosAutomaticos(c: Caixinha, dataHoje: DataISO = hoje()): MovimentoDoExtrato[] {
  const depositos: MovimentoDoExtrato[] = [];
  c.recorrencias.forEach((r, n) => {
    const fim = r.ate && r.ate < dataHoje ? r.ate : dataHoje;
    for (let k = 0; ; k++) {
      const data = somarMeses(r.desde, k);
      if (data > fim) break;
      depositos.push({ id: `${c.id}-auto-${n}-${k}`, data, valor: r.valor, automatico: true });
    }
  });
  return depositos;
}

/** Tudo o que entrou e saiu da caixinha, do mais recente para o mais antigo. */
export function extratoDaCaixinha(c: Caixinha, dataHoje: DataISO = hoje()): MovimentoDoExtrato[] {
  return [...depositosAutomaticos(c, dataHoje), ...c.movimentos.map((m) => ({ ...m, automatico: false }))]
    .filter((m) => m.data <= dataHoje)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

export interface SaldoDaCaixinha {
  saldo: number;
  /** Depósitos menos resgates. */
  guardado: number;
  /** Saldo menos guardado (antes do IR). */
  rendimento: number;
}

/** Cada movimento rende (ou deixa de render, se for resgate) desde o dia em que aconteceu. */
export function saldoDaCaixinha(c: Caixinha, dataHoje: DataISO = hoje(), taxaAnual: number = CDI_ANUAL): SaldoDaCaixinha {
  const td = taxaDiaria(taxaAnual);
  let saldo = 0;
  let guardado = 0;
  for (const m of extratoDaCaixinha(c, dataHoje)) {
    saldo += m.valor * (1 + td) ** diasEntre(m.data, dataHoje);
    guardado += m.valor;
  }
  const arredondado = Math.max(0, Math.round(saldo));
  return { saldo: arredondado, guardado, rendimento: arredondado - guardado };
}

/** Quanto entra por mês daqui pra frente: só as recorrências sem data de fim. */
export function aporteMensalAtual(c: Caixinha): number {
  return c.recorrencias.filter((r) => r.ate === null).reduce((s, r) => s + r.valor, 0);
}
