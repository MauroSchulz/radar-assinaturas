import { diasEntre, hoje, type DataISO } from './datas';
import type { Assinatura, Decisao } from './tipos';

export interface Resumo {
  /** Soma do que as assinaturas ativas custam por mês (teste grátis não entra: ainda não cobra). */
  totalMensal: number;
  totalAnual: number;
  ativas: number;
  emTeste: number;
  /** Quantas a pessoa marcou como "vou cancelar". */
  marcadas: number;
  /** Quanto sobra por ano se cancelar as marcadas (inclui teste grátis, que viraria cobrança). */
  economiaAnual: number;
}

export function resumir(assinaturas: Assinatura[], decisoes: Readonly<Record<string, Decisao>>): Resumo {
  const ativas = assinaturas.filter((a) => a.situacao === 'ativa');
  const marcadas = assinaturas.filter((a) => a.situacao !== 'encerrada' && decisoes[a.id] === 'cancelar');
  return {
    totalMensal: ativas.reduce((soma, a) => soma + a.custoMensal, 0),
    totalAnual: ativas.reduce((soma, a) => soma + a.custoAnual, 0),
    ativas: ativas.length,
    emTeste: assinaturas.filter((a) => a.situacao === 'teste').length,
    marcadas: marcadas.length,
    economiaAnual: marcadas.reduce((soma, a) => soma + a.custoAnual, 0),
  };
}

/** Cobranças (ou fins de teste) dos próximos `dias` dias, da mais próxima para a mais distante. */
export function proximasCobrancas(assinaturas: Assinatura[], dias = 7, dataHoje: DataISO = hoje()): Assinatura[] {
  return assinaturas
    .filter((a) => {
      if (a.situacao === 'encerrada') return false;
      const faltam = diasEntre(dataHoje, a.proximaCobranca);
      return faltam >= 0 && faltam <= dias;
    })
    .sort((a, b) => diasEntre(b.proximaCobranca, a.proximaCobranca));
}
