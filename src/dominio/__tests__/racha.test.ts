import { gerarExtrato } from '../../dados/extrato';
import { linkDoPix } from '../linkPix';
import { detectarAssinaturas } from '../deteccao';
import {
  chaveDaCota,
  cotasDoRacha,
  dividir,
  mensagemDeCobranca,
  saldos,
  suaParteMensal,
  type Pessoa,
  type Racha,
} from '../racha';

const HOJE = '2026-11-06';
const assinaturas = detectarAssinaturas(gerarExtrato(HOJE), HOJE);
const netflix = assinaturas.find((a) => a.nome === 'Netflix')!;
const pessoas: Pessoa[] = [
  { id: 'ana', nome: 'Ana' },
  { id: 'bruno', nome: 'Bruno' },
  { id: 'carla', nome: 'Carla' },
];

const churrasco: Racha = {
  id: 'r1',
  titulo: 'Churrascaria',
  criadoEm: HOJE,
  pessoas: ['ana', 'bruno', 'carla'],
  incluiVoce: true,
  origem: { tipo: 'compra', transacaoId: 't1', descricao: 'CHURRASCARIA', data: '2026-11-05', valor: 48000 },
};

const netflixRachada: Racha = {
  id: 'r2',
  titulo: 'Netflix',
  criadoEm: HOJE,
  pessoas: ['bruno'],
  incluiVoce: true,
  origem: { tipo: 'assinatura', assinaturaId: netflix.id, desde: netflix.cobrancas[netflix.cobrancas.length - 3].data },
};

describe('dividir', () => {
  it('divide igual quando dá exato', () => {
    expect(dividir(48000, 3, true)).toEqual({ suaParte: 12000, partes: [12000, 12000, 12000] });
  });

  it('os centavos que sobram ficam com você', () => {
    const r = dividir(1000, 2, true); // R$ 10,00 em 3
    expect(r).toEqual({ suaParte: 334, partes: [333, 333] });
    expect(r.suaParte + r.partes.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it('sem você na divisão, o resto vai um centavo para cada um dos primeiros', () => {
    const r = dividir(1000, 3, false);
    expect(r).toEqual({ suaParte: 0, partes: [334, 333, 333] });
  });

  it('nunca perde nem cria centavo', () => {
    for (let total = 1; total < 2000; total += 7) {
      for (let amigos = 1; amigos <= 6; amigos++) {
        for (const incluiVoce of [true, false]) {
          const r = dividir(total, amigos, incluiVoce);
          expect(r.suaParte + r.partes.reduce((a, b) => a + b, 0)).toBe(total);
        }
      }
    }
  });
});

describe('cotasDoRacha', () => {
  it('compra: uma cota por amigo', () => {
    const cotas = cotasDoRacha(churrasco, assinaturas, {});
    expect(cotas.map((c) => [c.pessoaId, c.valor])).toEqual([
      ['ana', 12000],
      ['bruno', 12000],
      ['carla', 12000],
    ]);
  });

  it('assinatura: uma cota a cada cobrança desde o início, com o valor daquele mês', () => {
    const cotas = cotasDoRacha(netflixRachada, assinaturas, {});
    // As 3 últimas cobranças da Netflix: 39,90 e depois 44,90 duas vezes.
    expect(cotas.map((c) => c.valor)).toEqual([1995, 2245, 2245]);
  });

  it('marca o que já foi pago', () => {
    const chave = chaveDaCota('r1', 'ana', '2026-11-05');
    const cotas = cotasDoRacha(churrasco, assinaturas, { [chave]: HOJE });
    expect(cotas.find((c) => c.pessoaId === 'ana')!.pagoEm).toBe(HOJE);
    expect(cotas.find((c) => c.pessoaId === 'bruno')!.pagoEm).toBeNull();
  });

  it('assinatura que sumiu do extrato não gera cota', () => {
    const fantasma: Racha = { ...netflixRachada, origem: { tipo: 'assinatura', assinaturaId: 'NAO EXISTE', desde: HOJE } };
    expect(cotasDoRacha(fantasma, assinaturas, {})).toEqual([]);
  });
});

describe('saldos', () => {
  it('soma o que cada um deve, de quem deve mais para quem deve menos, e esconde quem está em dia', () => {
    const pagamentos = { [chaveDaCota('r1', 'ana', '2026-11-05')]: HOJE };
    const cotas = [...cotasDoRacha(churrasco, assinaturas, pagamentos), ...cotasDoRacha(netflixRachada, assinaturas, pagamentos)];
    const s = saldos(cotas, pessoas);
    expect(s.map((x) => [x.pessoa.nome, x.devendo])).toEqual([
      ['Bruno', 12000 + 1995 + 2245 + 2245],
      ['Carla', 12000],
    ]);
  });
});

describe('suaParteMensal', () => {
  it('desconta a parte dos amigos', () => {
    expect(suaParteMensal(netflix, [netflixRachada])).toBe(2245);
  });
  it('sem racha, é o custo inteiro', () => {
    expect(suaParteMensal(netflix, [])).toBe(4490);
  });
});

describe('mensagemDeCobranca', () => {
  const itens = [
    { titulo: 'Churrascaria', referente: '2026-11-05', valor: 12000 },
    { titulo: 'Netflix', referente: '2026-10-31', valor: 2245 },
  ];

  it('lista cada item, o total e a única forma de pagamento escolhida', () => {
    expect(mensagemDeCobranca('Bruno', itens, { pixCopiaECola: '000201PIX' }, HOJE)).toBe(
      [
        'Oi, Bruno! Sua parte no racha:',
        '• Churrascaria (5 nov): R$ 120,00',
        '• Netflix (31 out): R$ 22,45',
        'Total: R$ 142,45',
        '',
        'Como pagar:',
        'Pix copia e cola (toque no link e o código é copiado, já com o valor):',
        linkDoPix('000201PIX', 'copiar'),
      ].join('\n'),
    );
  });

  it('com várias formas, numera na ordem fixa (copia e cola, chave, QR Code, transferência, dinheiro), com uma linha em branco entre elas', () => {
    const msg = mensagemDeCobranca(
      'Bruno',
      itens,
      {
        dinheiro: true,
        transferencia: { banco: 'Banco Exemplo', agencia: '0001', conta: '1234-5', titular: 'Mauro Schulz' },
        chavePix: { tipo: 'celular', chave: '+5511987654321' },
        qrCode: '000201PIX',
        pixCopiaECola: '000201PIX',
      },
      HOJE,
    );
    expect(msg.split('\n').slice(5)).toEqual([
      'Como pagar (escolha uma):',
      '',
      '1) Pix copia e cola (toque no link e o código é copiado, já com o valor):',
      linkDoPix('000201PIX', 'copiar'),
      '',
      '2) Chave Pix (celular): +5511987654321',
      '',
      '3) QR Code (para ler com o app do banco):',
      linkDoPix('000201PIX', 'qr'),
      '',
      '4) Transferência: Banco Exemplo · agência 0001 · conta 1234-5 · Mauro Schulz',
      '',
      '5) Dinheiro, na próxima vez que a gente se encontrar.',
    ]);
  });

  it('sem nenhuma forma, pede o Pix do jeito de sempre', () => {
    const msg = mensagemDeCobranca('Ana', [{ titulo: 'Pizza', referente: HOJE, valor: 3000 }], {}, HOJE);
    expect(msg).not.toContain('Total');
    expect(msg.endsWith('Me manda por Pix quando puder?')).toBe(true);
  });
});
