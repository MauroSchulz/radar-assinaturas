import { dataCurta, dataLonga, diasEntre, quando, somarDias, somarMeses } from '../datas';
import { dinheiro, porcentagem } from '../formato';

const NBSP = ' ';

describe('dinheiro', () => {
  it.each([
    [4490, `R$${NBSP}44,90`],
    [5, `R$${NBSP}0,05`],
    [0, `R$${NBSP}0,00`],
    [318360, `R$${NBSP}3.183,60`],
    [123456789, `R$${NBSP}1.234.567,89`],
    [-2290, `-R$${NBSP}22,90`],
  ])('%i centavos vira %s', (centavos, esperado) => {
    expect(dinheiro(centavos)).toBe(esperado);
  });
});

describe('porcentagem', () => {
  it('usa vírgula e uma casa', () => expect(porcentagem(0.12531)).toBe('12,5%'));
  it('tira o ",0" de número redondo', () => expect(porcentagem(0.1)).toBe('10%'));
});

describe('datas', () => {
  it('soma dias atravessando o ano', () => expect(somarDias('2026-12-30', 5)).toBe('2027-01-04'));
  it('conta dias atravessando o ano', () => expect(diasEntre('2026-12-28', '2027-01-05')).toBe(8));
  it('31 de janeiro + 1 mês cai no último dia de fevereiro', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2028-01-31', 1)).toBe('2028-02-29');
  });
  it('volta meses', () => expect(somarMeses('2026-03-15', -3)).toBe('2025-12-15'));
  it('escreve datas em português', () => {
    expect(dataCurta('2026-11-12', '2026-11-06')).toBe('12 nov');
    expect(dataLonga('2026-03-01', '2026-11-06')).toBe('1 de março');
  });
  it('mostra o ano só quando não é o ano de hoje', () => {
    expect(dataCurta('2025-12-30', '2026-01-04')).toBe('30 dez 2025');
    expect(dataLonga('2027-01-02', '2026-12-20')).toBe('2 de janeiro de 2027');
  });
  it.each([
    ['2026-11-06', 'hoje'],
    ['2026-11-07', 'amanhã'],
    ['2026-11-09', 'em 3 dias'],
    ['2026-11-05', 'ontem'],
    ['2026-11-01', 'há 5 dias'],
  ])('%s é "%s" visto de 06/11', (data, esperado) => {
    expect(quando(data, '2026-11-06')).toBe(esperado);
  });
});
