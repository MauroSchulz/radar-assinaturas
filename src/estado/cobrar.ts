import { useMemo } from 'react';
import type { DataISO } from '../dominio/datas';
import { hoje } from '../dominio/datas';
import { normalizarChave, payloadPix, type DadosPix } from '../dominio/pix';
import {
  mensagemDeCobranca,
  type Cota,
  type DadosTransferencia,
  type FormaDePagamento,
  type FormasNaMensagem,
  type Pessoa,
  type Racha,
} from '../dominio/racha';
import { useRachas } from './rachas';
import { useCotas } from './radar';

/** Se dá para mandar o Pix junto (chave cadastrada e válida). */
export function temPix(chave: string): boolean {
  return normalizarChave(chave) !== null;
}

/** Se os dados de transferência estão completos o bastante para entrar na mensagem. */
export function temTransferencia(t: { banco: string; agencia: string; conta: string }): boolean {
  return Boolean(t.banco.trim() && t.agencia.trim() && t.conta.trim());
}

/** Tudo de que uma cobrança depende; o mesmo para uma pessoa ou para "cobrar todos". */
export interface ContextoDeCobranca {
  cotas: Cota[];
  rachas: Racha[];
  pessoas: Pessoa[];
  pix: DadosPix;
  transferencia: DadosTransferencia;
  formas: FormaDePagamento[];
  cobradoEm: Record<string, DataISO>;
}

/**
 * A cobrança de uma pessoa: o que ela deve (de todos os rachas, ou só de um), menos o que você
 * deve a ela; o Pix com o valor exato; as formas de pagamento; e a mensagem pronta. Se você já
 * mandou cobrança antes, a mensagem é a de lembrete.
 */
export function montarCobranca(ctx: ContextoDeCobranca, pessoaId: string, rachaId?: string) {
  const pessoa = ctx.pessoas.find((p) => p.id === pessoaId);
  const pendentes = ctx.cotas.filter((c) => c.pessoaId === pessoaId && !c.pagoEm && (!rachaId || c.rachaId === rachaId));
  const tituloDe = (id: string) => ctx.rachas.find((r) => r.id === id)?.titulo ?? 'Racha';
  const itens = pendentes.map((c) => ({
    titulo: tituloDe(c.rachaId),
    referente: c.referente,
    valor: c.direcao === 'voceDeve' ? -c.valor : c.valor,
  }));
  const teDeve = pendentes.filter((c) => c.direcao === 'teDeve').reduce((s, c) => s + c.valor, 0);
  const voceDeve = pendentes.filter((c) => c.direcao === 'voceDeve').reduce((s, c) => s + c.valor, 0);
  const total = teDeve - voceDeve;
  const chave = normalizarChave(ctx.pix.chave);
  const pixCopiaECola = chave && total > 0 ? payloadPix(ctx.pix, total) : null;

  // Cada forma só pode ser escolhida se tiver o que mostrar.
  const disponivel: Record<FormaDePagamento, boolean> = {
    pixCopiaECola: pixCopiaECola !== null,
    chavePix: chave !== null,
    qrCode: pixCopiaECola !== null,
    // A transferência precisa do titular: o nome cadastrado em “como você recebe”.
    transferencia: temTransferencia(ctx.transferencia) && ctx.pix.nome.trim() !== '',
    dinheiro: true,
  };
  const escolhidas = ctx.formas.filter((f) => disponivel[f]);
  const naMensagem: FormasNaMensagem = {
    ...(escolhidas.includes('pixCopiaECola') && pixCopiaECola ? { pixCopiaECola } : {}),
    ...(escolhidas.includes('chavePix') && chave ? { chavePix: chave } : {}),
    ...(escolhidas.includes('qrCode') && pixCopiaECola ? { qrCode: pixCopiaECola } : {}),
    ...(escolhidas.includes('transferencia') && disponivel.transferencia ? { transferencia: { ...ctx.transferencia, titular: ctx.pix.nome.trim() } } : {}),
    ...(escolhidas.includes('dinheiro') ? { dinheiro: true } : {}),
  };
  const cobradoEm = ctx.cobradoEm[pessoaId];

  return {
    pessoa,
    pendentes,
    itens,
    teDeve,
    voceDeve,
    total,
    pixCopiaECola,
    disponivel,
    escolhidas,
    cobradoEm,
    mensagem: pessoa && total > 0 ? mensagemDeCobranca(pessoa.nome, itens, naMensagem, hoje(), Boolean(cobradoEm)) : '',
  };
}

export function useContextoDeCobranca(): ContextoDeCobranca {
  const cotas = useCotas();
  const rachas = useRachas((s) => s.rachas);
  const pessoas = useRachas((s) => s.pessoas);
  const pix = useRachas((s) => s.pix);
  const transferencia = useRachas((s) => s.transferencia);
  const formas = useRachas((s) => s.formas);
  const cobradoEm = useRachas((s) => s.cobradoEm);
  return useMemo(
    () => ({ cotas, rachas, pessoas, pix, transferencia, formas, cobradoEm }),
    [cotas, rachas, pessoas, pix, transferencia, formas, cobradoEm],
  );
}

export function useCobranca(pessoaId: string, rachaId?: string) {
  const ctx = useContextoDeCobranca();
  return useMemo(() => montarCobranca(ctx, pessoaId, rachaId), [ctx, pessoaId, rachaId]);
}
