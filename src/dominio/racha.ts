/**
 * Racha de contas: dividir uma compra, ou uma assinatura todo mês, com amigos.
 *
 * Um racha de compra gera uma cota por amigo. Um racha de assinatura gera uma cota por
 * amigo **a cada cobrança** da assinatura desde o dia em que a divisão começou, então a
 * conta de cada mês aparece sozinha. Quem pagou fica guardado em `pagamentos`, com a
 * chave `racha|pessoa|cobrança`.
 *
 * A divisão pode ser igual, por valor (cada um diz quanto) ou por partes (pesos: quem levou
 * acompanhante conta 2). E a conta pode ter sido paga por um amigo: aí a única cota é a sua,
 * que **você deve** a ele (as dívidas dos outros com ele não são da sua conta).
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
  | { tipo: 'assinatura'; assinaturaId: string; desde: DataISO }
  /** Despesa que não está no seu cartão: em geral, uma que um amigo pagou. */
  | { tipo: 'manual'; descricao: string; data: DataISO; valor: number };

/** A chave da sua parte em `Divisao` (as outras são os ids dos amigos). */
export const VOCE = 'voce';

export type ModoDeDivisao = 'igual' | 'valor' | 'partes';

export type Divisao =
  | { modo: 'igual' }
  /** Quanto cada um paga, em centavos. Tem que somar o total. */
  | { modo: 'valor'; valores: Record<string, number> }
  /** Pesos inteiros: 2 paga o dobro de 1. */
  | { modo: 'partes'; partes: Record<string, number> };

export interface Racha {
  id: string;
  titulo: string;
  criadoEm: DataISO;
  /** Amigos que entram na divisão (sem você). */
  pessoas: string[];
  /** Se você também paga uma parte. */
  incluiVoce: boolean;
  origem: OrigemRacha;
  /** Como dividir; sem isso, em partes iguais. */
  divisao?: Divisao;
  /** O amigo que pagou a conta; sem isso, foi você. */
  pagouId?: string;
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
  /** `teDeve`: o amigo te deve. `voceDeve`: o amigo pagou a conta e você deve a sua parte a ele. */
  direcao: 'teDeve' | 'voceDeve';
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

/**
 * Divide `total` como a divisão manda. Em `partes`, os centavos que sobram seguem a regra de
 * `dividir` (ficam com você, ou com os primeiros se você não entra); em `valor`, valem os
 * valores digitados (confira antes com `erroDaDivisao`).
 */
export function dividirPor(
  total: number,
  pessoas: string[],
  incluiVoce: boolean,
  divisao: Divisao = { modo: 'igual' },
): { suaParte: number; partes: number[] } {
  if (divisao.modo === 'igual') return dividir(total, pessoas.length, incluiVoce);
  if (divisao.modo === 'valor') {
    return { suaParte: incluiVoce ? (divisao.valores[VOCE] ?? 0) : 0, partes: pessoas.map((id) => divisao.valores[id] ?? 0) };
  }
  const peso = (id: string) => Math.max(0, Math.floor(divisao.partes[id] ?? 1));
  const pesoVoce = incluiVoce ? peso(VOCE) : 0;
  const pesos = pessoas.map(peso);
  const soma = pesoVoce + pesos.reduce((a, b) => a + b, 0);
  if (soma === 0) return dividir(total, pessoas.length, incluiVoce);
  const partes = pesos.map((w) => Math.floor((total * w) / soma));
  const suaBase = Math.floor((total * pesoVoce) / soma);
  let resto = total - suaBase - partes.reduce((a, b) => a + b, 0);
  if (incluiVoce && pesoVoce > 0) return { suaParte: suaBase + resto, partes };
  for (let i = 0; resto > 0 && i < partes.length; i = (i + 1) % partes.length) {
    if (pesos[i] > 0) {
      partes[i] += 1;
      resto -= 1;
    }
  }
  return { suaParte: suaBase, partes };
}

/** Por que a divisão não fecha, ou `null` se está certa. */
export function erroDaDivisao(total: number, pessoas: string[], incluiVoce: boolean, divisao: Divisao = { modo: 'igual' }): string | null {
  if (divisao.modo === 'igual') return null;
  const quem = [...(incluiVoce ? [VOCE] : []), ...pessoas];
  if (divisao.modo === 'partes') {
    const pesos = quem.map((id) => divisao.partes[id] ?? 1);
    if (pesos.some((w) => !Number.isInteger(w) || w < 1)) return 'Cada pessoa precisa de pelo menos 1 parte.';
    return null;
  }
  const soma = quem.reduce((s, id) => s + (divisao.valores[id] ?? 0), 0);
  if (soma < total) return `Faltam ${dinheiro(total - soma)} para fechar ${dinheiro(total)}.`;
  if (soma > total) return `Passou ${dinheiro(soma - total)} de ${dinheiro(total)}.`;
  return null;
}

export function chaveDaCota(rachaId: string, pessoaId: string, referente: DataISO): string {
  return `${rachaId}|${pessoaId}|${referente}`;
}

/** As cobranças que o racha divide: uma só na compra; na assinatura, cada uma desde o início. */
export function cobrancasDoRacha(racha: Racha, assinaturas: Assinatura[]): { data: DataISO; valor: number }[] {
  if (racha.origem.tipo !== 'assinatura') return [{ data: racha.origem.data, valor: racha.origem.valor }];
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
    const { suaParte, partes } = dividirPor(cobranca.valor, racha.pessoas, racha.incluiVoce, racha.divisao);
    if (racha.pagouId) {
      // Um amigo pagou: a única conta sua é a sua parte, devida a ele.
      if (!racha.incluiVoce || suaParte <= 0) continue;
      const chave = chaveDaCota(racha.id, VOCE, cobranca.data);
      cotas.push({
        chave,
        rachaId: racha.id,
        pessoaId: racha.pagouId,
        referente: cobranca.data,
        valor: suaParte,
        pagoEm: pagamentos[chave] ?? null,
        direcao: 'voceDeve',
      });
      continue;
    }
    racha.pessoas.forEach((pessoaId, i) => {
      if (partes[i] <= 0) return;
      const chave = chaveDaCota(racha.id, pessoaId, cobranca.data);
      cotas.push({
        chave,
        rachaId: racha.id,
        pessoaId,
        referente: cobranca.data,
        valor: partes[i],
        pagoEm: pagamentos[chave] ?? null,
        direcao: 'teDeve',
      });
    });
  }
  return cotas;
}

export interface Saldo {
  pessoa: Pessoa;
  /** Quanto a pessoa te deve (pendente). */
  devendo: number;
  /** Quanto você deve a ela (pendente). */
  voceDeve: number;
  /** Um pelo outro: positivo, ela te deve; negativo, você deve a ela. */
  liquido: number;
  /** As duas direções juntas. */
  pendentes: Cota[];
  /** A pendência mais antiga. */
  desde: DataISO;
}

/**
 * O saldo com cada amigo, um pelo outro: de quem te deve mais até a quem você deve mais.
 * Quem está quite (nada pendente) não aparece.
 */
export function saldos(cotas: Cota[], pessoas: Pessoa[]): Saldo[] {
  const lista: Saldo[] = [];
  for (const pessoa of pessoas) {
    const pendentes = cotas.filter((c) => c.pessoaId === pessoa.id && !c.pagoEm);
    if (pendentes.length === 0) continue;
    const devendo = pendentes.filter((c) => c.direcao === 'teDeve').reduce((s, c) => s + c.valor, 0);
    const voceDeve = pendentes.filter((c) => c.direcao === 'voceDeve').reduce((s, c) => s + c.valor, 0);
    const desde = pendentes.reduce((min, c) => (c.referente < min ? c.referente : min), pendentes[0].referente);
    lista.push({ pessoa, devendo, voceDeve, liquido: devendo - voceDeve, pendentes, desde });
  }
  return lista.sort((a, b) => b.liquido - a.liquido);
}

/** O racha ativo de uma assinatura, se ela estiver dividida. */
export function rachaDaAssinatura(assinaturaId: string, rachas: Racha[]): Racha | undefined {
  return rachas.find((r) => r.origem.tipo === 'assinatura' && r.origem.assinaturaId === assinaturaId);
}

/** Quanto a assinatura custa **para você** por mês, já descontada a parte dos amigos. */
export function suaParteMensal(assinatura: Assinatura, rachas: Racha[]): number {
  const racha = rachaDaAssinatura(assinatura.id, rachas);
  if (!racha) return assinatura.custoMensal;
  return dividirPor(assinatura.custoMensal, racha.pessoas, racha.incluiVoce, racha.divisao).suaParte;
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

/**
 * Texto pronto para mandar no WhatsApp, com as formas de pagamento escolhidas. Item com valor
 * negativo é o que você deve à pessoa, descontado do total. `lembrete` troca o começo por um
 * mais gentil, para quem já foi cobrado antes.
 */
export function mensagemDeCobranca(
  nome: string,
  itens: { titulo: string; referente: DataISO; valor: number }[],
  formas: FormasNaMensagem,
  dataHoje: DataISO = hoje(),
  lembrete = false,
): string {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const linhas = itens.map((i) =>
    i.valor < 0
      ? `• Descontando ${i.titulo}, que você pagou (${dataCurta(i.referente, dataHoje)}): −${dinheiro(-i.valor)}`
      : `• ${i.titulo} (${dataCurta(i.referente, dataHoje)}): ${dinheiro(i.valor)}`,
  );
  const abertura = lembrete ? `Oi, ${nome}! Passando só pra lembrar do racha, sem pressa:` : `Oi, ${nome}! Sua parte no racha:`;
  const partes = [abertura, ...linhas];
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
