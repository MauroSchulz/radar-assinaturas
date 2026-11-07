/**
 * Transforma um texto (o Pix copia e cola) na grade de um QR Code: `true` é quadradinho escuro.
 * Usa só o núcleo da biblioteca `qrcode`, que é JavaScript puro; o desenho fica com a tela.
 */
import { create } from 'qrcode/lib/core/qrcode';

export interface MatrizQr {
  /** Quadradinhos por lado (sem a margem branca). */
  tamanho: number;
  escuro: (linha: number, coluna: number) => boolean;
}

/** Correção de erro média (M): aguenta uns 15% do código sujo ou riscado, e é o que os bancos usam. */
export function matrizQr(texto: string): MatrizQr {
  const { modules } = create(texto, { errorCorrectionLevel: 'M' });
  return { tamanho: modules.size, escuro: (l, c) => Boolean(modules.get(l, c)) };
}
