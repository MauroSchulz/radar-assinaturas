import { gerarExtrato } from '../../dados/extrato';
import { detectarAssinaturas } from '../deteccao';
import { dinheiroCurto } from '../formato';
import { gastosPorMes, resumoDoAno } from '../gastos';
import type { Transacao } from '../tipos';

const HOJE = '2026-11-07';

const t = (data: string, valor: number, descricao = 'LOJA'): Transacao => ({ id: `${data}${valor}`, data, descricao, valor });

describe('gastosPorMes', () => {
  const extrato = [
    t('2026-01-10', 10000),
    t('2026-01-20', 5000),
    t('2026-01-21', -2000), // estorno
    t('2026-03-05', 30000),
    t('2026-11-02', 40000), // mês atual
    t('2026-11-30', 99999), // depois de hoje: não entra
    t('2025-12-31', 77777), // outro ano
    t('2026-02-01', 0), // teste grátis
  ];
  const meses = gastosPorMes(extrato, [], 2026, HOJE);

  it('tem os 12 meses, em ordem, com o nome', () => {
    expect(meses.map((m) => m.mes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(meses[6].nome).toBe('julho');
  });

  it('soma pela data da compra e desconta estorno', () => {
    expect(meses[0]).toMatchObject({ total: 13000, compras: 2 });
    expect(meses[1]).toMatchObject({ total: 0, compras: 0 });
    expect(meses[2].total).toBe(30000);
    expect(meses[10].total).toBe(40000);
  });

  it('marca fechado, atual e futuro', () => {
    expect(meses[9].situacao).toBe('fechado');
    expect(meses[10].situacao).toBe('atual');
    expect(meses[11].situacao).toBe('futuro');
    expect(gastosPorMes([], [], 2025, HOJE).every((m) => m.situacao === 'fechado')).toBe(true);
  });
});

describe('resumoDoAno', () => {
  it('maior, menor e média ignoram meses sem compra e o futuro; a média ignora o mês atual', () => {
    const meses = gastosPorMes([t('2026-01-10', 10000), t('2026-03-05', 30000), t('2026-11-02', 20000)], [], 2026, HOJE);
    const r = resumoDoAno(meses);
    expect(r.maior?.nome).toBe('março');
    expect(r.menor?.nome).toBe('janeiro');
    expect(r.media).toBe(20000);
    expect(r.total).toBe(60000);
  });

  it('o mês atual só é o maior se passar dos fechados', () => {
    const r = resumoDoAno(gastosPorMes([t('2026-01-10', 10000), t('2026-11-02', 50000)], [], 2026, HOJE));
    expect(r.maior?.nome).toBe('novembro');
  });

  it('ano sem compras', () => {
    expect(resumoDoAno(gastosPorMes([], [], 2026, HOJE))).toEqual({ maior: null, menor: null, media: 0, total: 0 });
  });
});

describe('na demonstração', () => {
  const extrato = gerarExtrato(HOJE);
  const meses = gastosPorMes(extrato, detectarAssinaturas(extrato, HOJE), 2026, HOJE);

  it('todo mês até hoje tem compras, e o das férias é o que mais gastou', () => {
    expect(meses.slice(0, 11).every((m) => m.compras > 0)).toBe(true);
    expect(resumoDoAno(meses).maior?.nome).toBe('julho');
  });

  it('separa o que foi assinatura', () => {
    expect(meses[9].emAssinaturas).toBeGreaterThan(0);
    expect(meses[9].emAssinaturas).toBeLessThan(meses[9].total);
  });
});

describe('dinheiroCurto', () => {
  it.each([
    [85000, 'R$\u00A0850'],
    [494853, 'R$\u00A04,9 mil'],
    [300000, 'R$\u00A03 mil'],
    [123456789, 'R$\u00A01,2 mi'],
  ])('%i → %s', (centavos, texto) => expect(dinheiroCurto(centavos)).toBe(texto));
});
