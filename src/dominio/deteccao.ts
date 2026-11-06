/**
 * O detector: lê o extrato do cartão e descobre quais cobranças são assinaturas.
 *
 * Como funciona, em quatro passos:
 * 1. Agrupa as compras pelo comerciante, limpando a descrição (`NETFLIX.COM 0412`
 *    e `NETFLIX.COM 9981` viram o mesmo grupo).
 * 2. Mede o intervalo entre as cobranças. Se quase todos ficam perto de 7, 30 ou
 *    365 dias, é semanal, mensal ou anual. Compra solta (Uber, iFood) não tem ritmo.
 * 3. Confere o valor: assinatura cobra quase sempre o mesmo preço. Mercado, que cai
 *    toda semana mas com valor muito diferente, fica de fora.
 * 4. Olha a última cobrança: se o próximo vencimento já passou faz tempo, a
 *    assinatura foi encerrada. Uma cobrança de R$ 0,00 sem nenhuma paga depois é
 *    o começo de um teste grátis.
 */
import { CATALOGO, COMO_CANCELAR_PADRAO, TESTE_DIAS_PADRAO, type ServicoConhecido } from './catalogo';
import { diasEntre, hoje, somarDias, somarMeses, type DataISO } from './datas';
import type { Assinatura, Cobranca, Duplicidade, Periodo, Transacao } from './tipos';

/** Palavras que os adquirentes colocam na descrição e não dizem nada do comerciante. */
const RUIDO = new Set(['PG', 'PAG', 'EBN', 'BR', 'DL']);

/** `PG *DISNEY PLUS` → `DISNEY PLUS`; `NETFLIX.COM 0412` → `NETFLIX.COM`. */
export function chaveDoComerciante(descricao: string): string {
  return descricao
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\*/g, ' ')
    .split(/\s+/)
    .filter((parte) => parte.length > 0 && !/\d/.test(parte) && !RUIDO.has(parte))
    .join(' ');
}

export function servicoDe(chave: string): ServicoConhecido | undefined {
  return CATALOGO.find((s) => chave.includes(s.padrao));
}

/** `ACADEMIA CORPO LIVRE` → `Academia Corpo Livre`. */
export function nomeLegivel(chave: string): string {
  return chave
    .replace(/\.COM$/, '')
    .toLowerCase()
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function classificarIntervalo(dias: number): Periodo | null {
  if (dias >= 5 && dias <= 9) return 'semanal';
  if (dias >= 25 && dias <= 35) return 'mensal';
  if (dias >= 350 && dias <= 380) return 'anual';
  return null;
}

function mediana(numeros: number[]): number {
  const ordenados = [...numeros].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/** Cobranças necessárias para ter certeza do ritmo. Anual fica com 2: ninguém espera 3 anos. */
export const MINIMO_COBRANCAS: Record<Periodo, number> = { semanal: 3, mensal: 3, anual: 2 };
/** Fração mínima dos intervalos que precisa bater com o período. */
export const REGULARIDADE_MINIMA = 0.75;
/** Quanto uma cobrança pode se afastar do valor típico (35%) e ainda contar como assinatura. */
export const VARIACAO_MAXIMA = 0.35;
/** Mesmo valor cobrado de novo em até 3 dias é cobrança duplicada. */
export const JANELA_DUPLICADA = 3;
/** Dias de atraso depois do vencimento até considerar a assinatura encerrada. */
export const TOLERANCIA: Record<Periodo, number> = { semanal: 4, mensal: 10, anual: 30 };

export function proximaData(ultima: DataISO, periodo: Periodo): DataISO {
  if (periodo === 'semanal') return somarDias(ultima, 7);
  if (periodo === 'mensal') return somarMeses(ultima, 1);
  return somarMeses(ultima, 12);
}

export function custos(valor: number, periodo: Periodo): { custoMensal: number; custoAnual: number } {
  if (periodo === 'semanal') return { custoMensal: Math.round((valor * 52) / 12), custoAnual: valor * 52 };
  if (periodo === 'mensal') return { custoMensal: valor, custoAnual: valor * 12 };
  return { custoMensal: Math.round(valor / 12), custoAnual: valor };
}

function porData(a: Transacao, b: Transacao): number {
  return a.data < b.data ? -1 : a.data > b.data ? 1 : 0;
}

function separarDuplicadas(pagas: Transacao[]): { unicas: Transacao[]; cobrancas: Cobranca[]; duplicidades: Duplicidade[] } {
  const unicas: Transacao[] = [];
  const cobrancas: Cobranca[] = [];
  const duplicidades: Duplicidade[] = [];
  for (const t of pagas) {
    const anterior = unicas[unicas.length - 1];
    const repetida = anterior !== undefined && anterior.valor === t.valor && diasEntre(anterior.data, t.data) <= JANELA_DUPLICADA;
    const cobranca: Cobranca = { id: t.id, data: t.data, valor: t.valor, duplicada: repetida };
    cobrancas.push(cobranca);
    if (repetida) {
      const primeira = cobrancas.find((c) => c.id === anterior.id)!;
      duplicidades.push({ primeira, repetida: cobranca });
    } else {
      unicas.push(t);
    }
  }
  return { unicas, cobrancas, duplicidades };
}

function detectarTeste(chave: string, gratis: Transacao[], dataHoje: DataISO): Assinatura | null {
  const servico = servicoDe(chave);
  const inicio = gratis[gratis.length - 1].data;
  const fim = somarDias(inicio, servico?.testeDias ?? TESTE_DIAS_PADRAO);
  // Teste que já acabou sem nenhuma cobrança paga: a pessoa cancelou a tempo.
  if (diasEntre(dataHoje, fim) < 0) return null;
  const valor = servico?.precoReferencia ?? 0;
  return {
    id: chave,
    nome: servico?.nome ?? nomeLegivel(chave),
    categoria: servico?.categoria ?? 'outros',
    periodo: 'mensal',
    situacao: 'teste',
    valorAtual: valor,
    valorAnterior: null,
    mudouEm: null,
    cobrancas: [],
    duplicidades: [],
    ultimaCobranca: null,
    proximaCobranca: fim,
    ...custos(valor, 'mensal'),
    comoCancelar: servico?.comoCancelar ?? COMO_CANCELAR_PADRAO,
  };
}

function detectarRecorrente(chave: string, pagas: Transacao[], dataHoje: DataISO): Assinatura | null {
  const { unicas, cobrancas, duplicidades } = separarDuplicadas(pagas);
  if (unicas.length < 2) return null;

  const intervalos = unicas.slice(1).map((t, i) => diasEntre(unicas[i].data, t.data));
  const periodo = classificarIntervalo(mediana(intervalos));
  if (!periodo) return null;
  // Duas compras na mesma loja com um mês de distância podem ser coincidência.
  if (unicas.length < MINIMO_COBRANCAS[periodo]) return null;
  const noRitmo = intervalos.filter((d) => classificarIntervalo(d) === periodo).length;
  if (noRitmo / intervalos.length < REGULARIDADE_MINIMA) return null;

  const valorTipico = mediana(unicas.map((t) => t.valor));
  if (unicas.some((t) => Math.abs(t.valor - valorTipico) / valorTipico > VARIACAO_MAXIMA)) return null;

  const ultima = unicas[unicas.length - 1];
  let valorAnterior: number | null = null;
  let mudouEm: DataISO | null = null;
  for (let i = unicas.length - 1; i > 0; i--) {
    if (unicas[i - 1].valor !== ultima.valor) {
      valorAnterior = unicas[i - 1].valor;
      mudouEm = unicas[i].data;
      break;
    }
  }

  const proximaCobranca = proximaData(ultima.data, periodo);
  const atraso = diasEntre(proximaCobranca, dataHoje);
  const servico = servicoDe(chave);
  return {
    id: chave,
    nome: servico?.nome ?? nomeLegivel(chave),
    categoria: servico?.categoria ?? 'outros',
    periodo,
    situacao: atraso > TOLERANCIA[periodo] ? 'encerrada' : 'ativa',
    valorAtual: ultima.valor,
    valorAnterior,
    mudouEm,
    cobrancas,
    duplicidades,
    ultimaCobranca: ultima.data,
    proximaCobranca,
    ...custos(ultima.valor, periodo),
    comoCancelar: servico?.comoCancelar ?? COMO_CANCELAR_PADRAO,
  };
}

export function detectarAssinaturas(transacoes: Transacao[], dataHoje: DataISO = hoje()): Assinatura[] {
  const grupos = new Map<string, Transacao[]>();
  for (const t of transacoes) {
    if (t.valor < 0) continue; // estorno
    const chave = chaveDoComerciante(t.descricao);
    if (!chave) continue;
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(t);
    else grupos.set(chave, [t]);
  }

  const encontradas: Assinatura[] = [];
  for (const [chave, lista] of grupos) {
    const ordenada = [...lista].sort(porData);
    const pagas = ordenada.filter((t) => t.valor > 0);
    const gratis = ordenada.filter((t) => t.valor === 0);
    const assinatura =
      pagas.length > 0 ? detectarRecorrente(chave, pagas, dataHoje) : detectarTeste(chave, gratis, dataHoje);
    if (assinatura) encontradas.push(assinatura);
  }
  return encontradas.sort((a, b) => b.custoMensal - a.custoMensal);
}
