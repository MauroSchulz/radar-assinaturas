import { gerarExtrato } from '../../dados/extrato';
import { esquemaDe, ehPreferenciaDeTema } from '../../tema/preferencia';
import { gastosPorCategoria } from '../categorias';
import { detectarAssinaturas } from '../deteccao';
import { resumir } from '../resumo';

const HOJE = '2026-11-11';
const assinaturas = detectarAssinaturas(gerarExtrato(HOJE), HOJE);

describe('gastosPorCategoria', () => {
  const categorias = gastosPorCategoria(assinaturas);

  it('soma o mesmo total do Início (só as ativas)', () => {
    expect(categorias.reduce((s, c) => s + c.mensal, 0)).toBe(resumir(assinaturas, {}).totalMensal);
    expect(categorias.reduce((s, c) => s + c.fracao, 0)).toBeCloseTo(1, 10);
  });

  it('vem da mais cara para a mais barata, sem categoria repetida', () => {
    const valores = categorias.map((c) => c.mensal);
    expect(valores).toEqual([...valores].sort((a, b) => b - a));
    expect(new Set(categorias.map((c) => c.categoria)).size).toBe(categorias.length);
  });

  it('lista os nomes de cada categoria, e teste grátis e encerrada ficam de fora', () => {
    const video = categorias.find((c) => c.categoria === 'video')!;
    expect(video.nomes).toContain('Netflix');
    expect(categorias.flatMap((c) => c.nomes)).not.toContain('Disney+');
    expect(categorias.flatMap((c) => c.nomes)).not.toContain('Deezer');
  });

  it('sem assinaturas, nada', () => {
    expect(gastosPorCategoria([])).toEqual([]);
  });
});

describe('tema escolhido', () => {
  it('claro e escuro valem por cima do celular; "sistema" segue o celular', () => {
    expect(esquemaDe('claro', 'dark')).toBe('claro');
    expect(esquemaDe('escuro', 'light')).toBe('escuro');
    expect(esquemaDe('sistema', 'dark')).toBe('escuro');
    expect(esquemaDe('sistema', null)).toBe('claro');
  });

  it('só aceita o que foi salvo de verdade', () => {
    expect(ehPreferenciaDeTema('escuro')).toBe(true);
    expect(ehPreferenciaDeTema('roxo')).toBe(false);
    expect(ehPreferenciaDeTema(null)).toBe(false);
  });
});
