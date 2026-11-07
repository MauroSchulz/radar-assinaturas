/**
 * Quanto você gastou no cartão em cada mês do ano, para o gráfico "em que mês gastei mais".
 *
 * Soma as compras pela data de cada uma (não pela fatura em que caíram), descontando estornos.
 * O mês de hoje está **em andamento** (só até hoje) e os meses seguintes ainda não chegaram:
 * nenhum dos dois entra na média, e o mês em andamento só vira "o que mais gastou" se passar
 * mesmo dos meses fechados.
 */
import { hoje, MESES, type DataISO } from './datas';
import { chaveDoComerciante } from './deteccao';
import type { Assinatura, Transacao } from './tipos';

export type SituacaoDoMes = 'fechado' | 'atual' | 'futuro';

export interface GastoDoMes {
  /** 1 a 12. */
  mes: number;
  nome: string;
  /** Em centavos, estornos já descontados. */
  total: number;
  compras: number;
  emAssinaturas: number;
  situacao: SituacaoDoMes;
}

export function gastosPorMes(extrato: Transacao[], assinaturas: Assinatura[], ano: number, dataHoje: DataISO = hoje()): GastoDoMes[] {
  const [anoHoje, mesHoje] = dataHoje.split('-').map(Number);
  const chaves = new Set(assinaturas.map((a) => a.id));
  const meses: GastoDoMes[] = MESES.map((nome, i) => {
    const mes = i + 1;
    const situacao: SituacaoDoMes =
      ano < anoHoje || (ano === anoHoje && mes < mesHoje) ? 'fechado' : ano === anoHoje && mes === mesHoje ? 'atual' : 'futuro';
    return { mes, nome, total: 0, compras: 0, emAssinaturas: 0, situacao };
  });
  for (const t of extrato) {
    if (t.valor === 0 || t.data > dataHoje) continue;
    const [a, m] = t.data.split('-').map(Number);
    if (a !== ano) continue;
    const g = meses[m - 1];
    g.total += t.valor;
    if (t.valor > 0) g.compras += 1;
    if (t.valor > 0 && chaves.has(chaveDoComerciante(t.descricao))) g.emAssinaturas += t.valor;
  }
  return meses;
}

export interface ResumoDoAno {
  /** O mês que mais gastou (fechado ou o atual, se já passou de todos). */
  maior: GastoDoMes | null;
  /** O que menos gastou entre os fechados com alguma compra. */
  menor: GastoDoMes | null;
  /** Média dos meses fechados com alguma compra. */
  media: number;
  /** Tudo o que foi gasto no ano até hoje. */
  total: number;
}

export function resumoDoAno(meses: GastoDoMes[]): ResumoDoAno {
  const comDados = meses.filter((m) => m.situacao !== 'futuro' && m.compras > 0);
  const fechados = comDados.filter((m) => m.situacao === 'fechado');
  const maior = comDados.reduce<GastoDoMes | null>((a, m) => (!a || m.total > a.total ? m : a), null);
  const menor = fechados.reduce<GastoDoMes | null>((a, m) => (!a || m.total < a.total ? m : a), null);
  const media = fechados.length ? Math.round(fechados.reduce((s, m) => s + m.total, 0) / fechados.length) : 0;
  return { maior, menor, media, total: comDados.reduce((s, m) => s + m.total, 0) };
}
