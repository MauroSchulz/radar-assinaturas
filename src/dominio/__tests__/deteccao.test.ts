import { somarDias, somarMeses } from '../datas';
import { chaveDoComerciante, classificarIntervalo, detectarAssinaturas, nomeLegivel } from '../deteccao';
import type { Transacao } from '../tipos';

const HOJE = '2026-11-06';
let n = 0;
const t = (data: string, descricao: string, valor: number): Transacao => ({ id: `x${++n}`, data, descricao, valor });

/** `quantas` cobranças mensais terminando `ultimaHaDias` antes de HOJE. */
function mensais(descricao: string, valores: number[], ultimaHaDias = 5): Transacao[] {
  const ultima = somarDias(HOJE, -ultimaHaDias);
  return valores.map((v, i) => t(somarMeses(ultima, -(valores.length - 1 - i)), descricao, v));
}

describe('chaveDoComerciante', () => {
  it.each([
    ['NETFLIX.COM 0412', 'NETFLIX.COM'],
    ['PG *DISNEY PLUS', 'DISNEY PLUS'],
    ['UBER *TRIP 8H2K', 'UBER TRIP'],
    ['Açaí do Zé', 'ACAI DO ZE'],
    ['GOOGLE *YouTubePremium', 'GOOGLE YOUTUBEPREMIUM'],
  ])('%s → %s', (descricao, chave) => expect(chaveDoComerciante(descricao)).toBe(chave));

  it('junta descrições que só mudam o código', () => {
    expect(chaveDoComerciante('SPOTIFY 1234')).toBe(chaveDoComerciante('SPOTIFY 9876'));
  });
});

describe('nomeLegivel', () => {
  it('capitaliza e tira o .com', () => {
    expect(nomeLegivel('ACADEMIA CORPO LIVRE')).toBe('Academia Corpo Livre');
    expect(nomeLegivel('CANVA.COM')).toBe('Canva');
  });
});

describe('classificarIntervalo', () => {
  it.each([
    [7, 'semanal'],
    [28, 'mensal'],
    [31, 'mensal'],
    [365, 'anual'],
    [12, null],
    [60, null],
  ])('%i dias → %s', (dias, periodo) => expect(classificarIntervalo(dias)).toBe(periodo));
});

describe('detectarAssinaturas', () => {
  it('reconhece uma assinatura mensal e calcula próxima cobrança e custos', () => {
    const [a] = detectarAssinaturas(mensais('SPOTIFY 1111', [2190, 2190, 2190, 2190]), HOJE);
    expect(a).toMatchObject({
      nome: 'Spotify',
      categoria: 'musica',
      periodo: 'mensal',
      situacao: 'ativa',
      valorAtual: 2190,
      valorAnterior: null,
      ultimaCobranca: '2026-11-01',
      proximaCobranca: '2026-12-01',
      custoMensal: 2190,
      custoAnual: 26280,
    });
  });

  it('serviço fora do catálogo também é detectado, com o nome do extrato', () => {
    const [a] = detectarAssinaturas(mensais('CANVA.COM 22', [3500, 3500, 3500]), HOJE);
    expect(a.nome).toBe('Canva');
    expect(a.categoria).toBe('outros');
    expect(a.comoCancelar.length).toBeGreaterThan(0);
  });

  it('precisa de 3 cobranças mensais: 2 podem ser coincidência', () => {
    expect(detectarAssinaturas(mensais('SPOTIFY', [2190, 2190]), HOJE)).toEqual([]);
  });

  it('anual basta com 2 cobranças, e o custo mensal é 1/12', () => {
    const lista = [t('2025-02-10', 'AMAZON PRIME BR', 16680), t('2026-02-10', 'AMAZON PRIME BR', 16680)];
    const [a] = detectarAssinaturas(lista, HOJE);
    expect(a.periodo).toBe('anual');
    expect(a.proximaCobranca).toBe('2027-02-10');
    expect(a.custoMensal).toBe(1390);
    expect(a.custoAnual).toBe(16680);
  });

  it('ignora compra com ritmo mas valor muito variável (mercado)', () => {
    const lista = [0, 7, 14, 21, 28].map((d, i) => t(somarDias(HOJE, -d), 'MERCADO', [9000, 41000, 22000, 15000, 30000][i]));
    expect(detectarAssinaturas(lista, HOJE)).toEqual([]);
  });

  it('ignora compra com valor parecido mas sem ritmo', () => {
    const lista = [2, 13, 19, 50, 61].map((d) => t(somarDias(HOJE, -d), 'PADARIA', 1500));
    expect(detectarAssinaturas(lista, HOJE)).toEqual([]);
  });

  it('percebe aumento de preço e guarda quando mudou', () => {
    const lista = mensais('NETFLIX.COM', [3990, 3990, 3990, 4490, 4490]);
    const [a] = detectarAssinaturas(lista, HOJE);
    expect(a.valorAtual).toBe(4490);
    expect(a.valorAnterior).toBe(3990);
    expect(a.mudouEm).toBe(lista[3].data);
  });

  it('separa cobrança duplicada sem deixar ela bagunçar o ritmo', () => {
    const lista = [...mensais('GLOBOPLAY', [2290, 2290, 2290, 2290], 3), t(somarDias(HOJE, -2), 'GLOBOPLAY', 2290)];
    const [a] = detectarAssinaturas(lista, HOJE);
    expect(a.periodo).toBe('mensal');
    expect(a.cobrancas).toHaveLength(5);
    expect(a.duplicidades).toHaveLength(1);
    expect(a.duplicidades[0].repetida.data).toBe('2026-11-04');
    expect(a.cobrancas.filter((c) => c.duplicada)).toHaveLength(1);
  });

  it('marca como encerrada quando passou do vencimento além da tolerância', () => {
    const [a] = detectarAssinaturas(mensais('DEEZER', [1990, 1990, 1990], 85), HOJE);
    expect(a.situacao).toBe('encerrada');
  });

  it('cobrança de R$ 0,00 sem nada pago depois é um teste grátis', () => {
    const [a] = detectarAssinaturas([t(somarDias(HOJE, -5), 'PG *DISNEY PLUS', 0)], HOJE);
    expect(a).toMatchObject({ nome: 'Disney+', situacao: 'teste', proximaCobranca: '2026-11-08', valorAtual: 3390 });
  });

  it('teste grátis que já acabou sem cobrança some (foi cancelado a tempo)', () => {
    expect(detectarAssinaturas([t(somarDias(HOJE, -20), 'PG *DISNEY PLUS', 0)], HOJE)).toEqual([]);
  });

  it('estorno não conta como cobrança', () => {
    const lista = [...mensais('SPOTIFY', [2190, 2190, 2190]), t(somarDias(HOJE, -1), 'SPOTIFY', -2190)];
    const [a] = detectarAssinaturas(lista, HOJE);
    expect(a.cobrancas).toHaveLength(3);
  });

  it('ordena da mais cara para a mais barata', () => {
    const lista = [...mensais('SPOTIFY', [2190, 2190, 2190]), ...mensais('ACADEMIA X', [11990, 11990, 11990])];
    expect(detectarAssinaturas(lista, HOJE).map((a) => a.nome)).toEqual(['Academia X', 'Spotify']);
  });
});
