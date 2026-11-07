import { base64url, deBase64url, linkDoPix, PAGINA_DO_PIX } from '../linkPix';
import { payloadPix } from '../pix';

const PIX = payloadPix({ chave: '051.790.931-63', nome: 'Mauro Schulz', cidade: 'Brasília' }, 14245);

describe('linkDoPix', () => {
  it('base64url: troca + e / por - e _, sem = no fim', () => {
    expect(base64url('')).toBe('');
    expect(base64url('a')).toBe('YQ');
    expect(base64url('ab')).toBe('YWI');
    expect(base64url('abc')).toBe('YWJj');
    expect(base64url('abcd')).toBe('YWJjZA');
    expect(base64url('>>>')).toBe('Pj4-'); // no base64 comum, Pj4+
    expect(base64url('???')).toBe('Pz8_'); // no base64 comum, Pz8/
  });

  it('volta igual, em qualquer tamanho', () => {
    for (const texto of ['', 'a', 'ab', 'abc', 'abcd', '>>>', PIX, 'MAURO SCHULZ***6304']) {
      expect(deBase64url(base64url(texto))).toBe(texto);
    }
  });

  it('o link só tem caracteres que o WhatsApp não corta nem formata', () => {
    for (const modo of ['copiar', 'qr'] as const) {
      const link = linkDoPix(PIX, modo);
      expect(link.startsWith(`${PAGINA_DO_PIX}#${modo}=`)).toBe(true);
      expect(link.slice(PAGINA_DO_PIX.length)).toMatch(/^#(copiar|qr)=[A-Za-z0-9_-]+$/);
    }
  });

  it('a página recebe o código Pix inteiro, sem perder nada', () => {
    const codigo = linkDoPix(PIX, 'copiar').split('#copiar=')[1];
    expect(deBase64url(codigo)).toBe(PIX);
  });
});
