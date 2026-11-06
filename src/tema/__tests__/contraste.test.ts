import { CATEGORIA_CLARO, CATEGORIA_ESCURO, CLARO, ESCURO, type Paleta } from '../tokens';

/** Contraste WCAG 2 entre duas cores `#RRGGBB`. */
function contraste(a: string, b: string): number {
  const luminancia = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Texto (primeiro) sobre fundo (segundo): todos os pares que as telas usam. */
const PARES: [keyof Paleta, keyof Paleta][] = [
  ['texto', 'fundo'],
  ['texto', 'superficie'],
  ['textoSuave', 'fundo'],
  ['textoSuave', 'superficie'],
  ['textoSobreFundo', 'fundo'],
  ['destaqueTexto', 'fundo'],
  ['destaqueTexto', 'superficie'],
  ['destaqueTexto', 'destaqueSuave'],
  ['texto', 'destaqueSuave'],
  ['sobreDestaque', 'destaque'],
  ['sobreDestaqueSuave', 'destaque'],
  ['sobreDestaque', 'faixa'],
  ['sobreDestaqueSuave', 'faixa'],
  ['sobreDestaque', 'selo'],
  ['perigo', 'fundo'],
  ['perigo', 'superficie'],
  ['perigoSobreFundo', 'fundo'],
  ['perigo', 'perigoFundo'],
  ['texto', 'perigoFundo'],
  ['alerta', 'alertaFundo'],
  ['texto', 'alertaFundo'],
  ['info', 'infoFundo'],
  ['texto', 'infoFundo'],
];

describe.each([
  ['claro', CLARO],
  ['escuro', ESCURO],
])('paleta %s', (_nome, paleta) => {
  it.each(PARES)('%s sobre %s passa 4,5:1', (texto, fundo) => {
    expect(contraste(paleta[texto], paleta[fundo])).toBeGreaterThanOrEqual(4.5);
  });

  it('ícone inativo da barra de abas passa 3:1 sobre a pílula', () => {
    expect(contraste(paleta.textoSuave, paleta.superficie)).toBeGreaterThanOrEqual(3);
  });
});

describe.each([
  ['claro', CATEGORIA_CLARO],
  ['escuro', CATEGORIA_ESCURO],
])('letras dos avatares no tema %s', (_nome, categorias) => {
  it.each(Object.entries(categorias))('%s passa 4,5:1', (_categoria, { fundo, texto }) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });
});

it('as duas paletas têm exatamente as mesmas chaves', () => {
  expect(Object.keys(ESCURO).sort()).toEqual(Object.keys(CLARO).sort());
});
