import { faturaAtual } from '../cartao';
import {
  agenciaValida,
  codigoDoComprovante,
  contaValida,
  erroDoValor,
  faturaComPixNoCredito,
  saldoDaConta,
  SALDO_INICIAL_DEMO,
  simularPixNoCredito,
  type Envio,
} from '../conta';

const HOJE = '2026-11-07';
const base = { para: 'Bruno', destino: 'Chave celular: +5511987654321' };
const pix: Envio = { id: 'a', tipo: 'pix', data: HOJE, valor: 10000, ...base };
const ted: Envio = { id: 'b', tipo: 'transferencia', data: HOJE, valor: 25050, ...base };
const credito = (valor: number, parcelas: number, data = HOJE): Envio => {
  const s = simularPixNoCredito(valor, parcelas);
  return { id: `c${valor}`, tipo: 'pixCredito', data, valor, ...base, credito: { parcelas, parcela: s.parcela, total: s.total, juros: s.juros } };
};

describe('simularPixNoCredito', () => {
  it('em 1x cobra um mês de juros', () => {
    expect(simularPixNoCredito(100000, 1)).toMatchObject({ parcela: 103490, total: 103490, juros: 3490 });
  });

  it('parcelado, as parcelas somam o total e o total passa do valor', () => {
    const s = simularPixNoCredito(100000, 6);
    expect(s.parcela * 6).toBe(s.total);
    expect(s.total).toBeGreaterThan(100000);
    expect(s.juros).toBe(s.total - 100000);
  });
});

describe('saldoDaConta', () => {
  it('desconta Pix e transferência, mas não o Pix no crédito', () => {
    expect(saldoDaConta([])).toBe(SALDO_INICIAL_DEMO);
    expect(saldoDaConta([pix, ted, credito(50000, 3)])).toBe(SALDO_INICIAL_DEMO - 10000 - 25050);
  });
});

describe('erroDoValor', () => {
  const disponivel = { saldo: 20000, limite: 100000 };
  it('valor ilegível', () => {
    expect(erroDoValor('pix', null, disponivel)).toMatch(/Escreva o valor/);
  });
  it('débito não passa do saldo', () => {
    expect(erroDoValor('pix', 20000, disponivel)).toBeNull();
    expect(erroDoValor('transferencia', 20001, disponivel)).toBe('Seu saldo em conta é R$ 200,00.');
  });
  it('no crédito, o total com juros é que precisa caber no limite', () => {
    expect(erroDoValor('pixCredito', 96000, disponivel, 1)).toBeNull(); // 99.350,40 → 99.350
    expect(erroDoValor('pixCredito', 97000, disponivel, 1)).toMatch(/limite disponível é R\$.1\.000,00/);
    // E não olha o saldo: dá para fazer Pix no crédito sem dinheiro na conta.
    expect(erroDoValor('pixCredito', 50000, { saldo: 0, limite: 100000 }, 3)).toBeNull();
  });
});

describe('agência e conta', () => {
  it.each([
    ['0001', true],
    ['12345', true],
    ['123456', false],
    ['00a1', false],
  ])('agência %s → %s', (a, ok) => expect(agenciaValida(a)).toBe(ok));
  it.each([
    ['12345-6', true],
    ['123456', true],
    ['1234-X', true],
    ['-1', false],
    ['abc-1', false],
  ])('conta %s → %s', (c, ok) => expect(contaValida(c)).toBe(ok));
});

describe('faturaComPixNoCredito', () => {
  const fatura = faturaAtual([{ id: 't', data: HOJE, descricao: 'LOJA', valor: 30000 }], [], { limite: 500000, diaFechamento: 25, diaVencimento: 2 }, HOJE);

  it('sem Pix no crédito, nada muda', () => {
    expect(faturaComPixNoCredito(fatura, [pix])).toMatchObject({ total: 30000, limiteDisponivel: 470000, pixNoCredito: 0 });
  });

  it('a 1ª parcela entra na fatura e o total com juros sai do limite', () => {
    const e = credito(60000, 3);
    const f = faturaComPixNoCredito(fatura, [e, pix]);
    expect(f.pixNoCredito).toBe(e.credito!.parcela);
    expect(f.total).toBe(30000 + e.credito!.parcela);
    expect(f.limiteDisponivel).toBe(470000 - e.credito!.total);
  });

  it('Pix no crédito de uma fatura anterior não entra no total, mas segue reservado no limite', () => {
    const antigo = credito(60000, 3, '2026-10-10');
    const f = faturaComPixNoCredito(fatura, [antigo]);
    expect(f.total).toBe(30000);
    expect(f.limiteDisponivel).toBe(470000 - antigo.credito!.total);
  });
});

describe('codigoDoComprovante', () => {
  it('começa com E e a data, e é sempre o mesmo para o mesmo envio', () => {
    const c = codigoDoComprovante('abc', HOJE);
    expect(c).toMatch(/^E20261107[0-9A-Z]{8}$/);
    expect(codigoDoComprovante('abc', HOJE)).toBe(c);
    expect(codigoDoComprovante('abd', HOJE)).not.toBe(c);
  });
});
