import { gerarExtrato } from '../../dados/extrato';
import { cicloAtual, faturaAtual, type ConfigCartao } from '../cartao';
import { diaDaSemana, noDia } from '../datas';
import { detectarAssinaturas } from '../deteccao';
import { parcelaPrice, simularEmprestimo } from '../emprestimo';

const HOJE = '2026-11-06';

describe('datas para o cartão', () => {
  it('dia da semana', () => {
    expect(diaDaSemana('2026-12-02')).toBe('quarta-feira');
    expect(diaDaSemana('2026-12-10')).toBe('quinta-feira');
  });
  it('dia 31 num mês de 30 vira o último dia', () => {
    expect(noDia(2026, 11, 31)).toBe('2026-11-30');
    expect(noDia(2027, 2, 30)).toBe('2027-02-28');
  });
});

describe('cicloAtual', () => {
  const config: ConfigCartao = { limite: 100000, diaFechamento: 25, diaVencimento: 2 };

  it('antes do fechamento: fecha este mês e vence no seguinte', () => {
    expect(cicloAtual(config, HOJE)).toEqual({ abertura: '2026-10-26', fechamento: '2026-11-25', vencimento: '2026-12-02' });
  });

  it('no dia do fechamento a fatura ainda está aberta', () => {
    expect(cicloAtual(config, '2026-11-25').fechamento).toBe('2026-11-25');
  });

  it('depois do fechamento: já é a fatura do mês seguinte, atravessando o ano', () => {
    expect(cicloAtual(config, '2026-12-26')).toEqual({ abertura: '2026-12-26', fechamento: '2027-01-25', vencimento: '2027-02-02' });
  });

  it('vencimento depois do fechamento cai no mesmo mês', () => {
    expect(cicloAtual({ ...config, diaFechamento: 3, diaVencimento: 10 }, HOJE)).toEqual({
      abertura: '2026-11-04',
      fechamento: '2026-12-03',
      vencimento: '2026-12-10',
    });
  });
});

describe('faturaAtual (com o extrato de demonstração)', () => {
  const extrato = gerarExtrato(HOJE);
  const assinaturas = detectarAssinaturas(extrato, HOJE);
  const fatura = faturaAtual(extrato, assinaturas, { limite: 1500000, diaFechamento: 25, diaVencimento: 2 }, HOJE);

  it('só entram compras desde a abertura até hoje', () => {
    expect(fatura.compras.length).toBeGreaterThan(0);
    expect(fatura.compras.every((t) => t.data >= '2026-10-26' && t.data <= HOJE)).toBe(true);
  });

  it('o total é a soma das compras e o limite disponível desconta o total', () => {
    expect(fatura.total).toBe(fatura.compras.reduce((s, t) => s + t.valor, 0));
    expect(fatura.limiteDisponivel).toBe(1500000 - fatura.total);
  });

  it('separa o que é assinatura: Netflix (31/10) e as duas do Globoplay (3 e 4/11)', () => {
    expect(fatura.emAssinaturas).toBe(4490 + 2290 + 2290);
    expect(fatura.emAssinaturas).toBeLessThan(fatura.total);
  });
});

describe('empréstimo (Tabela Price)', () => {
  it('R$ 1.000 a 1% ao mês em 12x dá R$ 88,85', () => expect(parcelaPrice(100000, 0.01, 12)).toBe(8885));
  it('sem juros é a divisão simples', () => expect(parcelaPrice(120000, 0, 12)).toBe(10000));
  it('recusa zero parcelas', () => expect(() => parcelaPrice(1000, 0.01, 0)).toThrow());

  it('a simulação fecha: total = parcela × parcelas e juros = total − valor', () => {
    const s = simularEmprestimo(500000, 12, 0.0399);
    expect(s.total).toBe(s.parcela * 12);
    expect(s.juros).toBe(s.total - 500000);
    expect(s.taxaAnual).toBeCloseTo(0.5989, 3); // 3,99% ao mês ≈ 59,9% ao ano
  });

  it('mais parcelas, parcela menor e juros maiores', () => {
    const curto = simularEmprestimo(500000, 6);
    const longo = simularEmprestimo(500000, 24);
    expect(longo.parcela).toBeLessThan(curto.parcela);
    expect(longo.juros).toBeGreaterThan(curto.juros);
  });
});
