import { dataCurta, diasEntre, hoje, quando, type DataISO } from './datas';
import { dinheiro, POR_PERIODO, porcentagem } from './formato';
import type { Assinatura } from './tipos';

export type TipoAlerta = 'fimDoTeste' | 'duplicada' | 'aumento' | 'cobrancaProxima';

export interface Alerta {
  /** Estável entre aberturas do app, para que "dispensar" continue valendo. */
  id: string;
  tipo: TipoAlerta;
  assinaturaId: string;
  titulo: string;
  detalhe: string;
  /** Data do fato que gerou o alerta. */
  data: DataISO;
  /** 3 = mexe no bolso se ignorar; 1 = só para saber. */
  gravidade: 1 | 2 | 3;
}

/** Avisar o fim do teste grátis com até 3 dias de antecedência. */
export const AVISO_TESTE_DIAS = 3;
/** Avisar cobrança normal com até 3 dias de antecedência. */
export const AVISO_COBRANCA_DIAS = 3;
/** Aumento de preço continua aparecendo por 45 dias. */
export const JANELA_AUMENTO_DIAS = 45;
/** Cobrança duplicada continua aparecendo por 60 dias (prazo razoável para pedir estorno). */
export const JANELA_DUPLICADA_DIAS = 60;

export function gerarAlertas(
  assinaturas: Assinatura[],
  dataHoje: DataISO = hoje(),
  dispensados: readonly string[] = [],
): Alerta[] {
  const alertas: Alerta[] = [];

  for (const a of assinaturas) {
    if (a.situacao === 'encerrada') continue;

    if (a.situacao === 'teste') {
      const faltam = diasEntre(dataHoje, a.proximaCobranca);
      if (faltam >= 0 && faltam <= AVISO_TESTE_DIAS) {
        alertas.push({
          id: `fimDoTeste:${a.id}:${a.proximaCobranca}`,
          tipo: 'fimDoTeste',
          assinaturaId: a.id,
          titulo: `${a.nome}: teste grátis acaba ${quando(a.proximaCobranca, dataHoje)}`,
          detalhe:
            a.valorAtual > 0
              ? `Depois vira cobrança de ${dinheiro(a.valorAtual)} ${POR_PERIODO[a.periodo]}. Cancele antes se não for usar.`
              : 'Depois começa a cobrar. Cancele antes se não for usar.',
          data: a.proximaCobranca,
          gravidade: 3,
        });
      }
      continue;
    }

    for (const d of a.duplicidades) {
      if (diasEntre(d.repetida.data, dataHoje) > JANELA_DUPLICADA_DIAS) continue;
      alertas.push({
        id: `duplicada:${a.id}:${d.repetida.data}`,
        tipo: 'duplicada',
        assinaturaId: a.id,
        titulo: `${a.nome} cobrou duas vezes`,
        detalhe: `${dinheiro(d.repetida.valor)} em ${dataCurta(d.primeira.data, dataHoje)} e de novo em ${dataCurta(d.repetida.data, dataHoje)}. Peça o estorno da segunda.`,
        data: d.repetida.data,
        gravidade: 3,
      });
    }

    if (a.valorAnterior !== null && a.mudouEm && a.valorAtual > a.valorAnterior) {
      if (diasEntre(a.mudouEm, dataHoje) <= JANELA_AUMENTO_DIAS) {
        const alta = (a.valorAtual - a.valorAnterior) / a.valorAnterior;
        alertas.push({
          id: `aumento:${a.id}:${a.mudouEm}`,
          tipo: 'aumento',
          assinaturaId: a.id,
          titulo: `${a.nome}: preço subiu ${porcentagem(alta)}`,
          detalhe: `Passou de ${dinheiro(a.valorAnterior)} para ${dinheiro(a.valorAtual)} ${POR_PERIODO[a.periodo]}.`,
          data: a.mudouEm,
          gravidade: 2,
        });
      }
    }

    const faltam = diasEntre(dataHoje, a.proximaCobranca);
    if (faltam >= 0 && faltam <= AVISO_COBRANCA_DIAS) {
      alertas.push({
        id: `cobrancaProxima:${a.id}:${a.proximaCobranca}`,
        tipo: 'cobrancaProxima',
        assinaturaId: a.id,
        titulo: `${a.nome} cobra ${quando(a.proximaCobranca, dataHoje)}`,
        detalhe: `${dinheiro(a.valorAtual)} no cartão, em ${dataCurta(a.proximaCobranca, dataHoje)}.`,
        data: a.proximaCobranca,
        gravidade: 1,
      });
    }
  }

  return alertas
    .filter((al) => !dispensados.includes(al.id))
    .sort((x, y) => y.gravidade - x.gravidade || (x.data < y.data ? -1 : x.data > y.data ? 1 : 0));
}
