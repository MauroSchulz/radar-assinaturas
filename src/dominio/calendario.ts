/**
 * Calendário de cobranças de um mês: em que dia cada assinatura cobra.
 *
 * Até hoje, valem as cobranças que aparecem no extrato (`cobrada`). De hoje em diante, o app
 * prevê pelo ritmo da assinatura, a partir da próxima cobrança (`prevista`). No teste grátis,
 * o dia em que o teste acaba é o primeiro com cobrança (`fimDoTeste`). Assinatura que parou de
 * cobrar só aparece pelo que já cobrou.
 */
import { diasNoMes, MESES, noDia, numeroDoDiaDaSemana, somarDias, somarMeses, type DataISO } from './datas';
import type { Assinatura, Categoria, Decisao } from './tipos';

export type TipoNoCalendario = 'cobrada' | 'prevista' | 'fimDoTeste';

export interface CobrancaNoCalendario {
  assinaturaId: string;
  nome: string;
  categoria: Categoria;
  data: DataISO;
  valor: number;
  tipo: TipoNoCalendario;
  /** Você marcou "vou cancelar": a cobrança ainda aparece, para lembrar o prazo. */
  vaiCancelar: boolean;
}

export interface DiaDoCalendario {
  data: DataISO;
  dia: number;
  cobrancas: CobrancaNoCalendario[];
  total: number;
}

export interface MesDoCalendario {
  ano: number;
  /** 1 a 12. */
  mes: number;
  nome: string;
  dias: DiaDoCalendario[];
  /** Semanas de domingo a sábado; `null` nos espaços antes do dia 1 e depois do último. */
  semanas: (DiaDoCalendario | null)[][];
  total: number;
  jaCobrado: number;
  aCobrar: number;
  quantas: number;
}

/** As datas previstas a partir da próxima cobrança, pelo ritmo, até `ate`. */
function previstas(a: Assinatura, ate: DataISO): DataISO[] {
  const datas: DataISO[] = [];
  for (let k = 0; k < 400; k++) {
    // Sempre a partir da mesma âncora: dia 31 que vira 30 em um mês volta a ser 31 no outro.
    const data =
      a.periodo === 'semanal' ? somarDias(a.proximaCobranca, 7 * k) : somarMeses(a.proximaCobranca, a.periodo === 'anual' ? 12 * k : k);
    if (data > ate) break;
    datas.push(data);
  }
  return datas;
}

export function cobrancasDoMes(
  assinaturas: Assinatura[],
  decisoes: Readonly<Record<string, Decisao>>,
  ano: number,
  mes: number,
  dataHoje: DataISO,
): MesDoCalendario {
  const inicio = noDia(ano, mes, 1);
  const fim = noDia(ano, mes, 31);
  const noMes = (d: DataISO) => d >= inicio && d <= fim;
  const lista: CobrancaNoCalendario[] = [];

  for (const a of assinaturas) {
    const base = { assinaturaId: a.id, nome: a.nome, categoria: a.categoria, vaiCancelar: decisoes[a.id] === 'cancelar' };
    const jaCobradas = a.cobrancas.filter((c) => c.valor > 0 && c.data <= dataHoje);
    for (const c of jaCobradas) {
      if (noMes(c.data)) lista.push({ ...base, data: c.data, valor: c.valor, tipo: 'cobrada' });
    }
    if (a.situacao === 'encerrada') continue;
    const datasJaCobradas = new Set(jaCobradas.map((c) => c.data));
    for (const data of previstas(a, fim)) {
      if (data < dataHoje || !noMes(data) || datasJaCobradas.has(data)) continue;
      const tipo: TipoNoCalendario = a.situacao === 'teste' && data === a.proximaCobranca ? 'fimDoTeste' : 'prevista';
      lista.push({ ...base, data, valor: a.valorAtual, tipo });
    }
  }

  const quantosDias = diasNoMes(ano, mes);
  const dias: DiaDoCalendario[] = Array.from({ length: quantosDias }, (_, i) => {
    const data = noDia(ano, mes, i + 1);
    const cobrancas = lista.filter((c) => c.data === data).sort((x, y) => y.valor - x.valor);
    return { data, dia: i + 1, cobrancas, total: cobrancas.reduce((s, c) => s + c.valor, 0) };
  });

  const semanas: (DiaDoCalendario | null)[][] = [];
  let semana: (DiaDoCalendario | null)[] = Array.from({ length: numeroDoDiaDaSemana(inicio) }, () => null);
  for (const d of dias) {
    semana.push(d);
    if (semana.length === 7) {
      semanas.push(semana);
      semana = [];
    }
  }
  if (semana.length) semanas.push([...semana, ...Array.from({ length: 7 - semana.length }, () => null)]);

  const jaCobrado = lista.filter((c) => c.tipo === 'cobrada').reduce((s, c) => s + c.valor, 0);
  const total = lista.reduce((s, c) => s + c.valor, 0);
  return { ano, mes, nome: MESES[mes - 1], dias, semanas, total, jaCobrado, aCobrar: total - jaCobrado, quantas: lista.length };
}
