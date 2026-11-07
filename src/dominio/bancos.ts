/**
 * Conectar banco, em modo demonstração: imita o consentimento do Open Finance (o que é
 * compartilhado, por quanto tempo, e que dá para cancelar), mas os bancos são fictícios e
 * nada sai do celular. No app de verdade, o extrato viria daqui em vez de `gerarExtrato()`.
 */
import { diasEntre, somarMeses, type DataISO } from './datas';
import type { Categoria } from './tipos';

export interface BancoDemo {
  id: string;
  nome: string;
  /** Só para a cor do avatar. */
  categoria: Categoria;
}

/** Nomes inventados: nenhum é banco de verdade. */
export const BANCOS_DEMO: BancoDemo[] = [
  { id: 'aurora', nome: 'Banco Aurora', categoria: 'nuvem' },
  { id: 'horizonte', nome: 'Banco Horizonte', categoria: 'saude' },
  { id: 'raiz', nome: 'Cooperativa Raiz', categoria: 'musica' },
  { id: 'pinheiro', nome: 'Banco Pinheiro', categoria: 'video' },
];

/** O que o Radar pede para ler. Nada de movimentar dinheiro: só leitura. */
export const DADOS_COMPARTILHADOS = [
  'Faturas e compras do cartão de crédito',
  'Saldo e extrato da conta',
  'Nome e CPF, para confirmar que a conta é sua',
];

/** O consentimento do Open Finance vale por até 12 meses; depois, é preciso renovar. */
export const PRAZO_DO_CONSENTIMENTO_MESES = 12;
/** A partir de quantos dias antes do fim o app avisa que está vencendo. */
export const AVISO_DE_RENOVACAO_DIAS = 30;

export interface Conexao {
  bancoId: string;
  desde: DataISO;
  validoAte: DataISO;
  ultimaLeitura: DataISO;
}

export function novaConexao(bancoId: string, dataHoje: DataISO): Conexao {
  return { bancoId, desde: dataHoje, validoAte: somarMeses(dataHoje, PRAZO_DO_CONSENTIMENTO_MESES), ultimaLeitura: dataHoje };
}

export type SituacaoDaConexao = 'ativa' | 'vencendo' | 'vencida';

export function situacaoDaConexao(c: Conexao, dataHoje: DataISO): SituacaoDaConexao {
  const faltam = diasEntre(dataHoje, c.validoAte);
  if (faltam < 0) return 'vencida';
  if (faltam <= AVISO_DE_RENOVACAO_DIAS) return 'vencendo';
  return 'ativa';
}

export function bancoPorId(id: string): BancoDemo | undefined {
  return BANCOS_DEMO.find((b) => b.id === id);
}
