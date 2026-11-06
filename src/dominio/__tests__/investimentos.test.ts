import { lerValor, porcentagem } from '../formato';
import {
  aliquotaIR,
  aporteMensalAtual,
  depositosAutomaticos,
  extratoDaCaixinha,
  mesesParaMeta,
  saldoDaCaixinha,
  simularAportesMensais,
  taxaDiaria,
  taxaMensal,
  type Caixinha,
} from '../investimentos';

const HOJE = '2026-11-06';

describe('taxas', () => {
  it('12,6825% ao ano é 1% ao mês', () => expect(taxaMensal(0.126825)).toBeCloseTo(0.01, 6));
  it('a taxa diária composta 365 vezes volta à anual', () => {
    expect((1 + taxaDiaria(0.1415)) ** 365 - 1).toBeCloseTo(0.1415, 10);
  });
});

describe('aliquotaIR (tabela regressiva)', () => {
  it.each([
    [1, 0.225],
    [6, 0.225],
    [7, 0.2],
    [12, 0.2],
    [13, 0.175],
    [24, 0.175],
    [25, 0.15],
    [120, 0.15],
  ])('%i meses → %f', (meses, aliquota) => expect(aliquotaIR(meses)).toBe(aliquota));
});

describe('simularAportesMensais', () => {
  it('sem juros, termina com o que guardou e não paga imposto', () => {
    expect(simularAportesMensais(10000, 12, 0)).toEqual({
      meses: 12,
      aportado: 120000,
      bruto: 120000,
      rendimento: 0,
      imposto: 0,
      liquido: 120000,
    });
  });

  it('um depósito por um mês a 1% ao mês: rende 1% e paga 22,5% de IR sobre o rendimento', () => {
    const s = simularAportesMensais(100000, 1, 0.126825);
    expect(s.bruto).toBe(101000);
    expect(s.imposto).toBe(225);
    expect(s.liquido).toBe(100775);
  });

  it('cada depósito paga IR pela própria idade: em 3 anos, o imposto fica entre 15% e 22,5% do rendimento', () => {
    const s = simularAportesMensais(26530, 36);
    expect(s.aportado).toBe(26530 * 36);
    expect(s.liquido).toBeGreaterThan(s.aportado);
    expect(s.imposto / s.rendimento).toBeGreaterThan(0.15);
    expect(s.imposto / s.rendimento).toBeLessThan(0.225);
    expect(s.bruto - s.imposto).toBe(s.liquido);
  });
});

describe('mesesParaMeta', () => {
  it('sem juros, é a conta de dividir', () => expect(mesesParaMeta(100000, 10000, 0, 0)).toBe(10));
  it('com juros, chega antes (num prazo longo os juros pesam)', () => {
    // R$ 100 por mês até R$ 10.000: sem juros, 100 meses.
    expect(mesesParaMeta(1000000, 10000, 0, 0)).toBe(100);
    expect(mesesParaMeta(1000000, 10000, 0)!).toBeLessThan(80);
  });
  it('já bateu a meta', () => expect(mesesParaMeta(100000, 10000, 150000)).toBe(0));
  it('sem guardar nada e sem saldo, nunca chega', () => expect(mesesParaMeta(100000, 0, 0)).toBeNull());
});

const viagem: Caixinha = {
  id: 'c1',
  nome: 'Viagem',
  criadaEm: '2026-08-06',
  meta: 300000,
  recorrencias: [{ valor: 30000, desde: '2026-08-06', ate: null }],
  movimentos: [{ id: 'm1', data: '2026-10-20', valor: -5000 }],
};

describe('caixinhas', () => {
  it('depósito automático todo mês, no mesmo dia, até hoje', () => {
    expect(depositosAutomaticos(viagem, HOJE).map((d) => d.data)).toEqual(['2026-08-06', '2026-09-06', '2026-10-06', '2026-11-06']);
  });

  it('recorrência parada não deposita mais', () => {
    const parada = { ...viagem, recorrencias: [{ valor: 30000, desde: '2026-08-06', ate: '2026-09-10' }] };
    expect(depositosAutomaticos(parada, HOJE)).toHaveLength(2);
    expect(aporteMensalAtual(parada)).toBe(0);
    expect(aporteMensalAtual(viagem)).toBe(30000);
  });

  it('o extrato junta automáticos e manuais, do mais recente para o mais antigo', () => {
    const extrato = extratoDaCaixinha(viagem, HOJE);
    expect(extrato.map((m) => [m.data, m.valor, m.automatico])).toEqual([
      ['2026-11-06', 30000, true],
      ['2026-10-20', -5000, false],
      ['2026-10-06', 30000, true],
      ['2026-09-06', 30000, true],
      ['2026-08-06', 30000, true],
    ]);
  });

  it('sem juros, o saldo é o que entrou menos o que saiu', () => {
    expect(saldoDaCaixinha(viagem, HOJE, 0)).toEqual({ saldo: 115000, guardado: 115000, rendimento: 0 });
  });

  it('com juros, rende mais quem está guardado há mais tempo', () => {
    const { saldo, guardado, rendimento } = saldoDaCaixinha(viagem, HOJE);
    expect(guardado).toBe(115000);
    expect(rendimento).toBeGreaterThan(0);
    expect(saldo).toBe(guardado + rendimento);
    // 300 guardados há 3 meses a ~1,1% ao mês rendem perto de R$ 10; o total fica abaixo de R$ 30.
    expect(rendimento).toBeLessThan(3000);
  });
});

describe('formato para investimentos', () => {
  it('porcentagem com duas casas', () => {
    expect(porcentagem(0.1415, 2)).toBe('14,15%');
    expect(porcentagem(0.15, 2)).toBe('15%');
    expect(porcentagem(0.175, 2)).toBe('17,5%');
  });

  it.each([
    ['44,90', 4490],
    ['44,9', 4490],
    ['1.234,56', 123456],
    ['1234,56', 123456],
    ['R$ 100', 10000],
    ['3000', 300000],
  ])('lerValor(%s) = %i', (texto, centavos) => expect(lerValor(texto)).toBe(centavos));

  it.each(['', 'abc', '0', '0,00', '12,345', '1.23', '-5'])('lerValor recusa "%s"', (texto) => {
    expect(lerValor(texto)).toBeNull();
  });
});
