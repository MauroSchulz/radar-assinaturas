/**
 * Extrato de demonstração. Nada aqui vem de banco de verdade: nomes de serviço são os
 * que aparecem numa fatura comum, e os valores são inventados.
 *
 * Toda data é escrita como "N dias antes de hoje", para a demonstração nunca envelhecer.
 * O sorteio usa semente fixa: o mesmo "hoje" gera sempre o mesmo extrato.
 */
import { hoje, somarDias, somarMeses, type DataISO } from '../dominio/datas';
import type { Transacao } from '../dominio/tipos';

function sorteador(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Id fixo da compra que a demonstração de racha usa. */
export const ID_CHURRASCO = 'churrasco';

export function gerarExtrato(dataHoje: DataISO = hoje()): Transacao[] {
  const sortear = sorteador(20261106);
  const entre = (min: number, max: number) => Math.round(min + sortear() * (max - min));
  const codigo = () => String(entre(1000, 9999));
  const transacoes: Transacao[] = [];
  let contador = 0;
  const lancar = (data: DataISO, descricao: string, valor: number, id?: string) => {
    transacoes.push({ id: id ?? `t${++contador}`, data, descricao, valor });
  };

  /** Uma cobrança por mês; `valores` vai do mais antigo ao mais recente. */
  const mensal = (descricao: string, valores: number[], ultimaHaDias: number) => {
    const ultima = somarDias(dataHoje, -ultimaHaDias);
    valores.forEach((valor, i) => {
      lancar(somarMeses(ultima, -(valores.length - 1 - i)), descricao.replace('#', codigo()), valor);
    });
    return ultima;
  };
  const repetir = (n: number, valor: number) => Array.from({ length: n }, () => valor);

  // Assinaturas
  mensal('NETFLIX.COM #', [...repetir(6, 3990), ...repetir(2, 4490)], 6); // aumentou faz um mês
  mensal('SPOTIFY #', repetir(12, 2190), 29); // cobra nos próximos dias
  mensal('ACADEMIA CORPO LIVRE', repetir(10, 11990), 12);
  mensal('APPLE ICLOUD #', repetir(14, 1490), 20);
  mensal('GOOGLE *YouTubePremium', repetir(5, 2690), 15);
  const globo = mensal('GLOBOPLAY #', repetir(6, 2290), 3);
  lancar(somarDias(globo, 1), 'GLOBOPLAY 7731', 2290); // cobrou duas vezes
  lancar(somarDias(dataHoje, -665), 'AMAZON PRIME BR', 14900); // anual
  lancar(somarMeses(somarDias(dataHoje, -665), 12), 'AMAZON PRIME BR', 16680);
  mensal('DEEZER #', repetir(3, 1990), 85); // parou de cobrar
  lancar(somarDias(dataHoje, -5), 'PG *DISNEY PLUS', 0); // começou teste grátis

  // Compras soltas: não são assinatura e o radar precisa ignorar
  for (let i = 0; i < 30; i++) lancar(somarDias(dataHoje, -entre(0, 120)), `UBER *TRIP ${codigo()}`, entre(1200, 6500));
  for (let i = 0; i < 18; i++) lancar(somarDias(dataHoje, -entre(0, 120)), `IFOOD *${codigo()}`, entre(2500, 9000));
  for (let dia = 118; dia > 0; dia -= entre(6, 8)) lancar(somarDias(dataHoje, -dia), 'SUPERMERCADO BOM PRECO', entre(9000, 42000));
  for (let dia = 115; dia > 0; dia -= entre(10, 14)) lancar(somarDias(dataHoje, -dia), `POSTO IPIRANGA ${codigo()}`, entre(15000, 25000));
  lancar(somarDias(dataHoje, -47), 'DROGASIL 0231', 4790);
  lancar(somarDias(dataHoje, -9), 'DROGASIL 0187', 8320);
  lancar(somarDias(dataHoje, -22), 'LIVRARIA CULTURA', 6990);
  lancar(somarDias(dataHoje, -1), 'CHURRASCARIA BRASA VIVA', 48000, ID_CHURRASCO); // rachado com os amigos

  return transacoes.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}
