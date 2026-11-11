/**
 * Quanto das assinaturas vai para cada categoria (vídeo, música, academia...), por mês.
 * Conta as mesmas do total do Início: as ativas. Teste grátis ainda não cobra; encerrada já parou.
 */
import type { Assinatura, Categoria } from './tipos';

export interface GastoDaCategoria {
  categoria: Categoria;
  /** Por mês, em centavos. */
  mensal: number;
  quantas: number;
  /** Parte do total, de 0 a 1. */
  fracao: number;
  nomes: string[];
}

export function gastosPorCategoria(assinaturas: Assinatura[]): GastoDaCategoria[] {
  const ativas = assinaturas.filter((a) => a.situacao === 'ativa');
  const total = ativas.reduce((s, a) => s + a.custoMensal, 0);
  const porCategoria = new Map<Categoria, Assinatura[]>();
  for (const a of ativas) porCategoria.set(a.categoria, [...(porCategoria.get(a.categoria) ?? []), a]);
  return [...porCategoria.entries()]
    .map(([categoria, lista]) => {
      const mensal = lista.reduce((s, a) => s + a.custoMensal, 0);
      return {
        categoria,
        mensal,
        quantas: lista.length,
        fracao: total > 0 ? mensal / total : 0,
        nomes: [...lista].sort((x, y) => y.custoMensal - x.custoMensal).map((a) => a.nome),
      };
    })
    .sort((a, b) => b.mensal - a.mensal);
}
