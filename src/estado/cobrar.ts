import { useMemo } from 'react';
import { normalizarChave, payloadPix } from '../dominio/pix';
import { mensagemDeCobranca, type FormaDePagamento, type FormasNaMensagem } from '../dominio/racha';
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

/**
 * Tudo o que a tela de cobrança precisa sobre uma pessoa: o que ela deve (de todos os rachas,
 * ou só de um), o Pix com o valor exato, quais formas de pagamento dá para oferecer e a
 * mensagem pronta com as formas escolhidas.
 */
export function useCobranca(pessoaId: string, rachaId?: string) {
  const todas = useCotas();
  const rachas = useRachas((s) => s.rachas);
  const pessoa = useRachas((s) => s.pessoas.find((p) => p.id === pessoaId));
  const pix = useRachas((s) => s.pix);
  const transferencia = useRachas((s) => s.transferencia);
  const formas = useRachas((s) => s.formas);

  return useMemo(() => {
    const pendentes = todas.filter((c) => c.pessoaId === pessoaId && !c.pagoEm && (!rachaId || c.rachaId === rachaId));
    const itens = pendentes.map((c) => ({
      titulo: rachas.find((r) => r.id === c.rachaId)?.titulo ?? 'Racha',
      referente: c.referente,
      valor: c.valor,
    }));
    const total = pendentes.reduce((s, c) => s + c.valor, 0);
    const chave = normalizarChave(pix.chave);
    const pixCopiaECola = chave && total > 0 ? payloadPix(pix, total) : null;

    // Cada forma só pode ser escolhida se tiver o que mostrar.
    const disponivel: Record<FormaDePagamento, boolean> = {
      pixCopiaECola: pixCopiaECola !== null,
      chavePix: chave !== null,
      qrCode: pixCopiaECola !== null,
      // A transferência precisa do titular: o nome cadastrado em “como você recebe”.
      transferencia: temTransferencia(transferencia) && pix.nome.trim() !== '',
      dinheiro: true,
    };
    const escolhidas = formas.filter((f) => disponivel[f]);
    const naMensagem: FormasNaMensagem = {
      ...(escolhidas.includes('pixCopiaECola') && pixCopiaECola ? { pixCopiaECola } : {}),
      ...(escolhidas.includes('chavePix') && chave ? { chavePix: chave } : {}),
      ...(escolhidas.includes('qrCode') && pixCopiaECola ? { qrCode: pixCopiaECola } : {}),
      ...(escolhidas.includes('transferencia') && disponivel.transferencia ? { transferencia: { ...transferencia, titular: pix.nome.trim() } } : {}),
      ...(escolhidas.includes('dinheiro') ? { dinheiro: true } : {}),
    };

    return {
      pessoa,
      pendentes,
      itens,
      total,
      pixCopiaECola,
      disponivel,
      escolhidas,
      mensagem: pessoa ? mensagemDeCobranca(pessoa.nome, itens, naMensagem) : '',
    };
  }, [todas, rachas, pessoa, pix, transferencia, formas, pessoaId, rachaId]);
}
