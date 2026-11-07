/** Tipos do núcleo da biblioteca `qrcode` (o pacote só publica tipos da entrada principal). */
declare module 'qrcode/lib/core/qrcode' {
  export function create(
    texto: string,
    opcoes?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' },
  ): { modules: { size: number; get: (linha: number, coluna: number) => number | boolean } };
}
