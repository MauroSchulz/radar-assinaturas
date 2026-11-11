import { gerarExtrato } from '../../dados/extrato';
import { cobrancasDoMes } from '../calendario';
import { detectarAssinaturas } from '../deteccao';
import type { Assinatura } from '../tipos';

const HOJE = '2026-11-08';
const assinaturas = detectarAssinaturas(gerarExtrato(HOJE), HOJE);

function base(parcial: Partial<Assinatura>): Assinatura {
  return {
    id: 'X',
    nome: 'Serviço',
    categoria: 'video',
    periodo: 'mensal',
    situacao: 'ativa',
    valorAtual: 1000,
    valorAnterior: null,
    mudouEm: null,
    cobrancas: [],
    duplicidades: [],
    ultimaCobranca: null,
    proximaCobranca: '2026-11-20',
    custoMensal: 1000,
    custoAnual: 12000,
    comoCancelar: [],
    ...parcial,
  };
}

describe('cobrancasDoMes', () => {
  it('monta as semanas de domingo a sábado, com espaços antes do dia 1', () => {
    const m = cobrancasDoMes([], {}, 2026, 11, HOJE);
    expect(m.nome).toBe('novembro');
    expect(m.dias).toHaveLength(30);
    // 1º de novembro de 2026 é um domingo.
    expect(m.semanas[0][0]?.dia).toBe(1);
    expect(m.semanas.every((s) => s.length === 7)).toBe(true);
    const fev = cobrancasDoMes([], {}, 2026, 2, HOJE);
    // 1º de fevereiro de 2026 também é domingo; 28 dias fecham 4 semanas certinhas.
    expect(fev.semanas).toHaveLength(4);
    const out = cobrancasDoMes([], {}, 2026, 10, HOJE);
    expect(out.semanas[0].slice(0, 4)).toEqual([null, null, null, null]); // 1º de outubro é quinta
  });

  it('o que já saiu vem do extrato; o que falta é previsto pelo ritmo', () => {
    const a = base({ cobrancas: [{ id: 'c', data: '2026-11-03', valor: 990, duplicada: false }], proximaCobranca: '2026-11-20' });
    const m = cobrancasDoMes([a], {}, 2026, 11, HOJE);
    expect(m.dias[2].cobrancas[0]).toMatchObject({ tipo: 'cobrada', valor: 990 });
    expect(m.dias[19].cobrancas[0]).toMatchObject({ tipo: 'prevista', valor: 1000 });
    expect(m).toMatchObject({ total: 1990, jaCobrado: 990, aCobrar: 1000, quantas: 2 });
  });

  it('semanal aparece toda semana; anual, só no mês dele', () => {
    const semanal = base({ id: 'S', periodo: 'semanal', proximaCobranca: '2026-11-10' });
    const anual = base({ id: 'A', periodo: 'anual', proximaCobranca: '2027-03-15' });
    const nov = cobrancasDoMes([semanal, anual], {}, 2026, 11, HOJE);
    expect(nov.dias.filter((d) => d.cobrancas.length).map((d) => d.dia)).toEqual([10, 17, 24]);
    const mar = cobrancasDoMes([anual], {}, 2027, 3, HOJE);
    expect(mar.dias[14].cobrancas).toHaveLength(1);
    expect(cobrancasDoMes([anual], {}, 2027, 4, HOJE).quantas).toBe(0);
  });

  it('dia 31 vira o último dia nos meses curtos', () => {
    const a = base({ proximaCobranca: '2026-12-31' });
    expect(cobrancasDoMes([a], {}, 2027, 2, HOJE).dias[27].cobrancas).toHaveLength(1);
  });

  it('teste grátis: o fim do teste é a primeira cobrança; encerrada não prevê nada', () => {
    const teste = base({ id: 'T', situacao: 'teste', proximaCobranca: '2026-11-12', valorAtual: 2790 });
    const encerrada = base({ id: 'E', situacao: 'encerrada', proximaCobranca: '2026-11-15' });
    const m = cobrancasDoMes([teste, encerrada], {}, 2026, 11, HOJE);
    expect(m.dias[11].cobrancas[0]).toMatchObject({ tipo: 'fimDoTeste', valor: 2790 });
    expect(m.dias[14].cobrancas).toEqual([]);
    expect(cobrancasDoMes([teste], {}, 2026, 12, HOJE).dias[11].cobrancas[0].tipo).toBe('prevista');
  });

  it('marca o que você decidiu cancelar', () => {
    const m = cobrancasDoMes([base({})], { X: 'cancelar' }, 2026, 11, HOJE);
    expect(m.dias[19].cobrancas[0].vaiCancelar).toBe(true);
  });

  it('na demonstração, novembro tem cobrança já feita e por vir, e a soma bate', () => {
    const m = cobrancasDoMes(assinaturas, {}, 2026, 11, HOJE);
    expect(m.jaCobrado).toBeGreaterThan(0);
    expect(m.aCobrar).toBeGreaterThan(0);
    expect(m.dias.reduce((s, d) => s + d.total, 0)).toBe(m.total);
    const spotify = assinaturas.find((a) => a.nome === 'Spotify')!;
    expect(m.dias.find((d) => d.data === spotify.proximaCobranca)!.cobrancas.some((c) => c.nome === 'Spotify')).toBe(true);
  });
});
