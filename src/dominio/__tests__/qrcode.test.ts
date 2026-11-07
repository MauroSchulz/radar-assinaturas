import { payloadPix } from '../pix';
import { matrizQr } from '../qrcode';

const PIX = payloadPix({ chave: '+55 11 98765-4321', nome: 'Mauro Schulz', cidade: 'São Paulo' }, 12000);

/** O "olho" de um canto: anel escuro 7×7, anel claro, miolo escuro 3×3. */
function temOlho(m: ReturnType<typeof matrizQr>, linha: number, coluna: number): boolean {
  for (let l = 0; l < 7; l++) {
    for (let c = 0; c < 7; c++) {
      const borda = l === 0 || l === 6 || c === 0 || c === 6;
      const miolo = l >= 2 && l <= 4 && c >= 2 && c <= 4;
      if (m.escuro(linha + l, coluna + c) !== (borda || miolo)) return false;
    }
  }
  return true;
}

describe('matrizQr', () => {
  const m = matrizQr(PIX);

  it('tem um tamanho válido de QR Code (21, 25, 29… quadradinhos por lado)', () => {
    expect((m.tamanho - 17) % 4).toBe(0);
    expect(m.tamanho).toBeGreaterThanOrEqual(21);
  });

  it('tem os três olhos que a câmera procura, nos cantos certos', () => {
    expect(temOlho(m, 0, 0)).toBe(true);
    expect(temOlho(m, 0, m.tamanho - 7)).toBe(true);
    expect(temOlho(m, m.tamanho - 7, 0)).toBe(true);
    // O canto de baixo à direita não tem olho.
    expect(temOlho(m, m.tamanho - 7, m.tamanho - 7)).toBe(false);
  });

  it('o mesmo texto gera sempre o mesmo desenho, e outro valor gera outro', () => {
    const igual = matrizQr(PIX);
    const outro = matrizQr(payloadPix({ chave: '+55 11 98765-4321', nome: 'Mauro Schulz', cidade: 'São Paulo' }, 2245));
    const desenho = (x: ReturnType<typeof matrizQr>) =>
      Array.from({ length: x.tamanho }, (_, l) => Array.from({ length: x.tamanho }, (_, c) => (x.escuro(l, c) ? 1 : 0)).join('')).join('\n');
    expect(desenho(igual)).toBe(desenho(m));
    expect(desenho(outro)).not.toBe(desenho(m));
  });
});
