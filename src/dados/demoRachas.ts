/**
 * Rachas de demonstração: o churrasco de ontem dividido em quatro, a pizza de quatro dias
 * atrás dividida em três (a Júlia ainda não pagou) e a Netflix dividida com o Bruno há três meses. Como o extrato de demonstração anda junto com "hoje", estes
 * dados são refeitos a cada dia (ver `estado/rachas.ts`).
 */
import { somarDias, type DataISO } from '../dominio/datas';
import { chaveDaCota, type Pessoa, type Racha } from '../dominio/racha';
import type { Assinatura, Transacao } from '../dominio/tipos';
import { ID_CHURRASCO, ID_PIZZARIA } from './extrato';

export const PESSOAS_DA_DEMO: Pessoa[] = [
  { id: 'ana', nome: 'Ana' },
  { id: 'bruno', nome: 'Bruno' },
  { id: 'carla', nome: 'Carla' },
  { id: 'julia', nome: 'Júlia' },
];

export function rachasDeDemonstracao(
  extrato: Transacao[],
  assinaturas: Assinatura[],
  dataHoje: DataISO,
): { rachas: Racha[]; pagamentos: Record<string, DataISO> } {
  const rachas: Racha[] = [];
  const pagamentos: Record<string, DataISO> = {};

  const churrasco = extrato.find((t) => t.id === ID_CHURRASCO);
  if (churrasco) {
    rachas.push({
      id: 'demo-churrasco',
      titulo: 'Churrascaria Brasa Viva',
      criadoEm: churrasco.data,
      pessoas: ['ana', 'bruno', 'carla'],
      incluiVoce: true,
      origem: { tipo: 'compra', transacaoId: churrasco.id, descricao: churrasco.descricao, data: churrasco.data, valor: churrasco.valor },
    });
    pagamentos[chaveDaCota('demo-churrasco', 'ana', churrasco.data)] = dataHoje; // a Ana já pagou
  }

  const pizza = extrato.find((t) => t.id === ID_PIZZARIA);
  if (pizza) {
    rachas.push({
      id: 'demo-pizza',
      titulo: 'Pizzaria Forno di Napoli',
      criadoEm: pizza.data,
      pessoas: ['julia', 'ana'],
      incluiVoce: true,
      origem: { tipo: 'compra', transacaoId: pizza.id, descricao: pizza.descricao, data: pizza.data, valor: pizza.valor },
    });
    pagamentos[chaveDaCota('demo-pizza', 'ana', pizza.data)] = somarDias(pizza.data, 1); // a Ana pagou no dia seguinte
  }

  const netflix = assinaturas.find((a) => a.nome === 'Netflix');
  if (netflix && netflix.cobrancas.length >= 3) {
    const ultimas = netflix.cobrancas.slice(-3);
    rachas.push({
      id: 'demo-netflix',
      titulo: 'Netflix',
      criadoEm: ultimas[0].data,
      pessoas: ['bruno'],
      incluiVoce: true,
      origem: { tipo: 'assinatura', assinaturaId: netflix.id, desde: ultimas[0].data },
    });
    // O Bruno pagou os dois primeiros meses; o deste mês está pendente.
    for (const c of ultimas.slice(0, 2)) pagamentos[chaveDaCota('demo-netflix', 'bruno', c.data)] = somarDias(c.data, 2);
  }

  return { rachas, pagamentos };
}
