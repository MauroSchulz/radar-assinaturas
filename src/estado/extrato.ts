/**
 * O extrato e as assinaturas detectadas nele. Lidos uma vez ao abrir o app; no app de
 * verdade, viriam do banco (Open Finance) em vez de `gerarExtrato()`.
 *
 * Fica separado das lojas para que `loja.ts` e `rachas.ts` possam usar sem um importar o outro.
 */
import { gerarExtrato } from '../dados/extrato';
import { faturaAtual } from '../dominio/cartao';
import { diasEntre, hoje } from '../dominio/datas';
import { chaveDoComerciante, detectarAssinaturas, nomeLegivel } from '../dominio/deteccao';
import type { Transacao } from '../dominio/tipos';

export const EXTRATO = gerarExtrato();
export const ASSINATURAS = detectarAssinaturas(EXTRATO);

export interface Compra extends Transacao {
  nome: string;
}

const CHAVES_DE_ASSINATURA = new Set(ASSINATURAS.map((a) => a.id));

/** Compras avulsas (não assinatura) dos últimos 30 dias, da mais recente para a mais antiga. */
export const COMPRAS_RECENTES: Compra[] = EXTRATO.filter((t) => {
  if (t.valor <= 0 || diasEntre(t.data, hoje()) > 30) return false;
  return !CHAVES_DE_ASSINATURA.has(chaveDoComerciante(t.descricao));
}).map((t) => ({ ...t, nome: nomeLegivel(chaveDoComerciante(t.descricao)) }));

/** A fatura do cartão aberta hoje, com quanto dela é assinatura. */
export const FATURA = faturaAtual(EXTRATO, ASSINATURAS);
