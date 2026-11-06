/**
 * Caixinhas de demonstração, criadas na primeira vez que o app abre: uma viagem com meta,
 * guardando todo mês há seis meses, e a economia do Deezer (a assinatura que o radar mostra
 * como encerrada) guardada desde o cancelamento.
 */
import { somarMeses, type DataISO } from '../dominio/datas';
import type { Caixinha } from '../dominio/investimentos';

export function caixinhasDeDemonstracao(dataHoje: DataISO): Caixinha[] {
  const viagem = somarMeses(dataHoje, -6);
  const deezer = somarMeses(dataHoje, -2);
  return [
    {
      id: 'demo-viagem',
      nome: 'Viagem de fim de ano',
      criadaEm: viagem,
      meta: 300000,
      recorrencias: [{ valor: 30000, desde: viagem, ate: null }],
      movimentos: [],
    },
    {
      id: 'demo-deezer',
      nome: 'Economia: Deezer',
      criadaEm: deezer,
      meta: null,
      recorrencias: [{ valor: 1990, desde: deezer, ate: null }],
      movimentos: [],
      origem: { assinaturaId: 'DEEZER', nome: 'Deezer' },
    },
  ];
}
