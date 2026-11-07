/**
 * Datas sempre como texto `AAAA-MM-DD`. As contas são feitas em UTC aqui dentro,
 * para que fuso e horário de verão nunca mudem a quantidade de dias entre duas datas.
 * Tela e regra não constroem `new Date(...)`: usam as funções deste arquivo.
 */
export type DataISO = string;

let hojeFixo: DataISO | null = null;

/** Só para testes: congela o "hoje". Passe `null` para voltar ao relógio. */
export function fixarHoje(data: DataISO | null): void {
  hojeFixo = data;
}

function paraISO(d: Date): DataISO {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function deISO(data: DataISO): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

export function hoje(): DataISO {
  if (hojeFixo) return hojeFixo;
  const agora = new Date();
  return paraISO(new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())));
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const d = deISO(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return paraISO(d);
}

/** Soma meses mantendo o dia; se o mês não tiver esse dia (31 de fevereiro), usa o último. */
export function somarMeses(data: DataISO, meses: number): DataISO {
  const [ano, mes, dia] = data.split('-').map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return paraISO(alvo);
}

/** Quantos dias de `de` até `ate` (negativo se `ate` vem antes). */
export function diasEntre(de: DataISO, ate: DataISO): number {
  return Math.round((deISO(ate).getTime() - deISO(de).getTime()) / 86_400_000);
}

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** `12 nov`; de outro ano que não o de `base`, `12 nov 2025`. */
export function dataCurta(data: DataISO, base: DataISO = hoje()): string {
  const d = deISO(data);
  const ano = data.slice(0, 4) === base.slice(0, 4) ? '' : ` ${data.slice(0, 4)}`;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()].slice(0, 3)}${ano}`;
}

/** `12 de novembro`; de outro ano que não o de `base`, `12 de novembro de 2025`. */
export function dataLonga(data: DataISO, base: DataISO = hoje()): string {
  const d = deISO(data);
  const ano = data.slice(0, 4) === base.slice(0, 4) ? '' : ` de ${data.slice(0, 4)}`;
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}${ano}`;
}

const DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** `quarta-feira` */
export function diaDaSemana(data: DataISO): string {
  return DIAS_DA_SEMANA[deISO(data).getUTCDay()];
}

/** Um dia do mês (1 a 31) na data `AAAA-MM-DD`, ajustado para o último dia se o mês for curto. */
export function noDia(ano: number, mes: number, dia: number): DataISO {
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

/** `hoje`, `amanhã`, `em 3 dias`, `ontem`, `há 5 dias` */
export function quando(data: DataISO, base: DataISO = hoje()): string {
  const n = diasEntre(base, data);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}
