/**
 * Link do Pix: o WhatsApp não copia um texto ao tocar, mas abre link. Então o copia e cola
 * e o QR Code vão na mensagem como links para uma página do Radar (em `docs/pix/`, servida
 * pelo GitHub Pages) que copia o código e desenha o QR.
 *
 * O código vai depois do `#`, que o navegador não manda para o servidor, e em base64url
 * (só letras, números, `-` e `_`): o WhatsApp corta link em espaço e lê `*` como negrito.
 */
export const PAGINA_DO_PIX = 'https://mauroschulz.github.io/radar-assinaturas/pix/';

export type ModoDoLink = 'copiar' | 'qr';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url sem `=` no fim. O payload do Pix é só ASCII, então cada letra é um byte. */
export function base64url(texto: string): string {
  let saida = '';
  for (let i = 0; i < texto.length; i += 3) {
    const a = texto.charCodeAt(i);
    const b = i + 1 < texto.length ? texto.charCodeAt(i + 1) : 0;
    const c = i + 2 < texto.length ? texto.charCodeAt(i + 2) : 0;
    const n = (a << 16) | (b << 8) | c;
    saida += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63];
    if (i + 1 < texto.length) saida += ALFABETO[(n >> 6) & 63];
    if (i + 2 < texto.length) saida += ALFABETO[n & 63];
  }
  return saida;
}

export function deBase64url(codigo: string): string {
  let saida = '';
  for (let i = 0; i < codigo.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => (i + k < codigo.length ? ALFABETO.indexOf(codigo[i + k]) : 0));
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    saida += String.fromCharCode((n >> 16) & 255);
    if (i + 2 < codigo.length) saida += String.fromCharCode((n >> 8) & 255);
    if (i + 3 < codigo.length) saida += String.fromCharCode(n & 255);
  }
  return saida;
}

/** `copiar` abre a página já copiando o código; `qr` abre com o QR Code em destaque. */
export function linkDoPix(payload: string, modo: ModoDoLink): string {
  return `${PAGINA_DO_PIX}#${modo}=${base64url(payload)}`;
}
