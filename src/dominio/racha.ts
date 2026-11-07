/**
 * Racha de contas: dividir uma compra, ou uma assinatura todo mês, com amigos.
 *
 * Um racha de compra gera uma cota por amigo. Um racha de assinatura gera uma cota por
 * amigo **a cada cobrança** da assinatura desde o dia em que a divisão começou, então a
 * conta de cada mês aparece sozinha. Quem pagou fica guardado em `pagamentos`, com a
 * chave `racha|pessoa|cobrança`.
 */
import { dataCurta, hoje, type DataISO } from './datas';
import { dinheiro } from './formato';
import { linkDoPix } from './linkPix';
import { NOME_DO_TIPO_DE_CHAVE, type TipoChave } from './pix';
import type { Assinatura } from './tipos';

export interface Pessoa {
  id: string;
  nome: string;
}

export type OrigemRacha =
  | { tipo: 'compra'; transacaoId: string; descricao: string; data: DataISO; valor: number }
  | { tipo: 'assinatura'; assinaturaId: string; desde: DataISO };

export interface Racha {
  id: string;
  titulo: string;
  criadoEm: DataISO;
  /** Amigos que entram na divisão (sem você). */
  pessoas: string[];
  /** Se você também paga uma parte. */
  incluiVoce: boolean;
  origem: OrigemRacha;
}

/** A parte de uma pessoa numa cobrança. */
export interface Cota {
  chave: string;
  rachaId: string;
  pessoaId: string;
  /** Data da cobrança que está sendo dividida. */
  referente: DataISO;
  valor: number;
  pagoEm: DataISO | null;
}

export type Pagamentos = Readonly<Record<string, DataISO>>;

/**
 * Divide `total` centavos em partes iguais, sem perder nenhum centavo. O que sobra da
 * divisão fica com você; se você não entra, vai um centavo a mais para os primeiros.
 */
export function dividir(total: number, amigos: number, incluiVoce: boolean): { suaParte: number; partes: number[] } {
  const quantos = amigos + (incluiVoce ? 1 : 0);
  if (quantos === 0) return { suaParte: total, partes: [] };
  const base = Math.floor(total / quantos);
  const resto = total - base * quantos;
  if (incluiVoce) return { suaParte: base + resto, partes: Array.from({ length: amigos }, () => base) };
  return { suaParte: 0, partes: Array.from({ length: amigos }, (_, i) => base + (i < resto ? 1 : 0)) };
}

export function chaveDaCota(rachaId: string, pessoaId: string, referente: DataISO): string {
  return `${rachaId}|${pessoaId}|${referente}`;
}

/** As cobranças que o racha divide: uma só na compra; na assinatura, cada uma desde o início. */
export function cobrancasDoRacha(racha: Racha, assinaturas: Assinatura[]): { data: DataISO; valor: number }[] {
  if (racha.origem.tipo === 'compra') return [{ data: racha.origem.data, valor: racha.origem.valor }];
  const { assinaturaId, desde } = racha.origem;
  const assinatura = assinaturas.find((a) => a.id === assinaturaId);
  if (!assinatura) return [];
  return assinatura.cobrancas
    .filter((c) => !c.duplicada && c.data >= desde)
    .map((c) => ({ data: c.data, valor: c.valor }));
}

export function cotasDoRacha(racha: Racha, assinaturas: Assinatura[], pagamentos: Pagamentos): Cota[] {
  const cotas: Cota[] = [];
  for (const cobranca of cobrancasDoRacha(racha, assinaturas)) {
    const { partes } = dividir(cobranca.valor, racha.pessoas.length, racha.incluiVoce);
    racha.pessoas.forEach((pessoaId, i) => {
      const chave = chaveDaCota(racha.id, pessoaId, cobranca.data);
      cotas.push({ chave, rachaId: racha.id, pessoaId, referente: cobranca.data, valor: partes[i], pagoEm: pagamentos[chave] ?? null });
    });
  }
  return cotas;
}

export interface Saldo {
  pessoa: Pessoa;
  devendo: number;
  pendentes: Cota[];
}

/** Quanto cada pessoa te deve, de quem deve mais para quem deve menos. Quem está em dia não aparece. */
export function saldos(cotas: Cota[], pessoas: Pessoa[]): Saldo[] {
  return pessoas
    .map((pessoa) => {
      const pendentes = cotas.filter((c) => c.pessoaId === pessoa.id && !c.pagoEm);
      return { pessoa, pendentes, devendo: pendentes.reduce((s, c) => s + c.valor, 0) };
    })
    .filter((s) => s.devendo > 0)
    .sort((a, b) => b.devendo - a.devendo);
}

/** O racha ativo de uma assinatura, se ela estiver dividida. */
export function rachaDaAssinatura(assinaturaId: string, rachas: Racha[]): Racha | undefined {
  return rachas.find((r) => r.origem.tipo === 'assinatura' && r.origem.assinaturaId === assinaturaId);
}

/** Quanto a assinatura custa **para você** por mês, já descontada a parte dos amigos. */
export function suaParteMensal(assinatura: Assinatura, rachas: Racha[]): number {
  const racha = rachaDaAssinatura(assinatura.id, rachas);
  if (!racha) return assinatura.custoMensal;
  return dividir(assinatura.custoMensal, racha.pessoas.length, racha.incluiVoce).suaParte;
}

/* ---------- Cobrança ---------- */

export type FormaDePagamento = 'pixCopiaECola' | 'chavePix' | 'qrCode' | 'transferencia' | 'dinheiro';

/** Ordem em que as formas aparecem na tela e na mensagem. */
export const FORMAS_DE_PAGAMENTO: FormaDePagamento[] = ['pixCopiaECola', 'chavePix', 'qrCode', 'transferencia', 'dinheiro'];

export interface DadosTransferencia {
  banco: string;
  agencia: string;
  conta: string;
}

/**
 * O que vai na mensagem: cada forma só entra se veio preenchida. `pixCopiaECola` e `qrCode`
 * recebem o código Pix (o payload); na mensagem eles viram links (ver `linkPix.ts`).
 */
export interface FormasNaMensagem {
  pixCopiaECola?: string;
  qrCode?: string;
  chavePix?: { tipo: TipoChave; chave: string };
  transferencia?: DadosTransferencia & { titular: string };
  dinheiro?: boolean;
}

function linhaDaForma(forma: FormaDePagamento, f: FormasNaMensagem): string | null {
  switch (forma) {
    case 'pixCopiaECola':
      return f.pixCopiaECola ? `Pix copia e cola (toque no link e o código é copiado, já com o valor):\n${linkDoPix(f.pixCopiaECola, 'copiar')}` : null;
    case 'chavePix':
      return f.chavePix ? `Chave Pix (${NOME_DO_TIPO_DE_CHAVE[f.chavePix.tipo].toLowerCase()}): ${f.chavePix.chave}` : null;
    case 'qrCode':
      return f.qrCode ? `QR Code (para ler com o app do banco):\n${linkDoPix(f.qrCode, 'qr')}` : null;
    case 'transferencia': {
      const t = f.transferencia;
      return t ? `Transferência: ${t.banco} · agência ${t.agencia} · conta ${t.conta} · ${t.titular}` : null;
    }
    case 'dinheiro':
      return f.dinheiro ? 'Dinheiro, na próxima vez que a gente se encontrar.' : null;
  }
}

/** Texto pronto para mandar no WhatsApp, com as formas de pagamento escolhidas. */
export function mensagemDeCobranca(
  nome: string,
  itens: { titulo: string; referente: DataISO; valor: number }[],
  formas: FormasNaMensagem,
  dataHoje: DataISO = hoje(),
): string {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const linhas = itens.map((i) => `• ${i.titulo} (${dataCurta(i.referente, dataHoje)}): ${dinheiro(i.valor)}`);
  const partes = [`Oi, ${nome}! Sua parte no racha:`, ...linhas];
  if (itens.length > 1) partes.push(`Total: ${dinheiro(total)}`);
  partes.push('');

  const opcoes = FORMAS_DE_PAGAMENTO.map((forma) => linhaDaForma(forma, formas)).filter((l): l is string => l !== null);
  if (opcoes.length === 0) partes.push('Me manda por Pix quando puder?');
  else if (opcoes.length === 1) partes.push(`Como pagar:\n${opcoes[0]}`);
  // Uma linha em branco entre as opções: no WhatsApp os links longos quebram em várias linhas
  // e, sem o respiro, não dá para ver onde uma opção termina e a outra começa.
  else partes.push(`Como pagar (escolha uma):\n\n${opcoes.map((o, i) => `${i + 1}) ${o}`).join('\n\n')}`);
  return partes.join('\n');
}
