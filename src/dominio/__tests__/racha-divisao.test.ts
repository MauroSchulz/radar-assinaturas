import {
  chaveDaCota,
  cotasDoRacha,
  dividirPor,
  erroDaDivisao,
  mensagemDeCobranca,
  saldos,
  VOCE,
  type Pessoa,
  type Racha,
} from '../racha';

const HOJE = '2026-11-08';
const pessoas: Pessoa[] = [
  { id: 'ana', nome: 'Ana' },
  { id: 'bruno', nome: 'Bruno' },
];

describe('dividirPor', () => {
  it('igual é o mesmo de sempre', () => {
    expect(dividirPor(1000, ['ana', 'bruno'], true)).toEqual({ suaParte: 334, partes: [333, 333] });
  });

  it('por valor usa o que cada um disse', () => {
    const d = { modo: 'valor' as const, valores: { [VOCE]: 5000, ana: 8000, bruno: 12000 } };
    expect(dividirPor(25000, ['ana', 'bruno'], true, d)).toEqual({ suaParte: 5000, partes: [8000, 12000] });
  });

  it('por partes: 2 paga o dobro de 1, e o centavo que sobra fica com você', () => {
    const d = { modo: 'partes' as const, partes: { [VOCE]: 1, ana: 2, bruno: 1 } };
    expect(dividirPor(10000, ['ana', 'bruno'], true, d)).toEqual({ suaParte: 2500, partes: [5000, 2500] });
    const r = dividirPor(1001, ['ana', 'bruno'], true, d);
    expect(r.suaParte + r.partes[0] + r.partes[1]).toBe(1001);
    expect(r.suaParte).toBe(251);
  });

  it('por partes sem você: o resto vai para os primeiros, sem perder centavo', () => {
    const d = { modo: 'partes' as const, partes: { ana: 1, bruno: 2 } };
    const r = dividirPor(1000, ['ana', 'bruno'], false, d);
    expect(r.suaParte).toBe(0);
    expect(r.partes[0] + r.partes[1]).toBe(1000);
  });
});

describe('erroDaDivisao', () => {
  it('por valor tem que fechar o total', () => {
    const quase = { modo: 'valor' as const, valores: { [VOCE]: 5000, ana: 4000 } };
    expect(erroDaDivisao(10000, ['ana'], true, quase)).toBe('Faltam R$ 10,00 para fechar R$ 100,00.');
    const passou = { modo: 'valor' as const, valores: { [VOCE]: 6000, ana: 5000 } };
    expect(erroDaDivisao(10000, ['ana'], true, passou)).toBe('Passou R$ 10,00 de R$ 100,00.');
    expect(erroDaDivisao(10000, ['ana'], true, { modo: 'valor', valores: { [VOCE]: 5000, ana: 5000 } })).toBeNull();
  });

  it('por partes, ninguém com zero', () => {
    expect(erroDaDivisao(10000, ['ana'], true, { modo: 'partes', partes: { [VOCE]: 1, ana: 0 } })).toMatch(/pelo menos 1 parte/);
    expect(erroDaDivisao(10000, ['ana'], true, { modo: 'partes', partes: {} })).toBeNull();
  });
});

describe('quando um amigo pagou', () => {
  const cinema: Racha = {
    id: 'r9',
    titulo: 'Cinema',
    criadoEm: HOJE,
    pessoas: ['ana', 'bruno'],
    incluiVoce: true,
    pagouId: 'ana',
    origem: { tipo: 'manual', descricao: 'Cinema', data: HOJE, valor: 9000 },
  };

  it('a única cota é a sua, devida a quem pagou', () => {
    const cotas = cotasDoRacha(cinema, [], {});
    expect(cotas).toEqual([
      { chave: chaveDaCota('r9', VOCE, HOJE), rachaId: 'r9', pessoaId: 'ana', referente: HOJE, valor: 3000, pagoEm: null, direcao: 'voceDeve' },
    ]);
  });

  it('o saldo junta as duas direções: um pelo outro', () => {
    const jantar: Racha = {
      id: 'r1',
      titulo: 'Jantar',
      criadoEm: HOJE,
      pessoas: ['ana'],
      incluiVoce: true,
      origem: { tipo: 'compra', transacaoId: 't', descricao: 'JANTAR', data: HOJE, valor: 10000 },
    };
    const cotas = [...cotasDoRacha(jantar, [], {}), ...cotasDoRacha(cinema, [], {})];
    const [ana] = saldos(cotas, pessoas);
    expect(ana).toMatchObject({ devendo: 5000, voceDeve: 3000, liquido: 2000, desde: HOJE });
  });

  it('quem você deve vem por último; quem está quite some', () => {
    const pago = { [chaveDaCota('r9', VOCE, HOJE)]: HOJE };
    expect(saldos(cotasDoRacha(cinema, [], {}), pessoas).map((s) => [s.pessoa.id, s.liquido])).toEqual([['ana', -3000]]);
    expect(saldos(cotasDoRacha(cinema, [], pago), pessoas)).toEqual([]);
  });
});

describe('mensagem com desconto e lembrete', () => {
  it('desconta o que você deve e o lembrete começa mais gentil', () => {
    const msg = mensagemDeCobranca(
      'Ana',
      [
        { titulo: 'Jantar', referente: HOJE, valor: 5000 },
        { titulo: 'Cinema', referente: HOJE, valor: -3000 },
      ],
      {},
      HOJE,
      true,
    );
    expect(msg.split('\n').slice(0, 4)).toEqual([
      'Oi, Ana! Passando só pra lembrar do racha, sem pressa:',
      '• Jantar (8 nov): R$ 50,00',
      '• Descontando Cinema, que você pagou (8 nov): −R$ 30,00',
      'Total: R$ 20,00',
    ]);
  });
});
