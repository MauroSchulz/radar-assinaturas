import { gerarExtrato } from '../../dados/extrato';
import { gerarAlertas } from '../alertas';
import { detectarAssinaturas } from '../deteccao';
import { proximasCobrancas, resumir } from '../resumo';

const HOJE = '2026-11-06';
const assinaturas = detectarAssinaturas(gerarExtrato(HOJE), HOJE);
const porNome = (nome: string) => assinaturas.find((a) => a.nome === nome)!;

describe('extrato de demonstração', () => {
  it('encontra as assinaturas e ignora Uber, iFood, mercado, posto e farmácia', () => {
    expect(assinaturas.map((a) => a.nome).sort()).toEqual(
      ['Academia Corpo Livre', 'Amazon Prime', 'Deezer', 'Disney+', 'Globoplay', 'Netflix', 'Spotify', 'YouTube Premium', 'iCloud+'].sort(),
    );
  });

  it('cada caso da demonstração aparece do jeito certo', () => {
    expect(porNome('Deezer').situacao).toBe('encerrada');
    expect(porNome('Disney+').situacao).toBe('teste');
    expect(porNome('Netflix').valorAnterior).toBe(3990);
    expect(porNome('Globoplay').duplicidades).toHaveLength(1);
    expect(porNome('Amazon Prime').periodo).toBe('anual');
  });

  it('funciona com qualquer "hoje", não só com a data em que foi escrito', () => {
    for (const dia of ['2027-03-01', '2027-07-31', '2028-02-29']) {
      const nomes = detectarAssinaturas(gerarExtrato(dia), dia).map((a) => a.nome);
      expect(nomes).toHaveLength(9);
      expect(nomes).not.toContain('Uber Trip');
    }
  });
});

describe('gerarAlertas', () => {
  const alertas = gerarAlertas(assinaturas, HOJE);
  const tipos = alertas.map((a) => `${a.tipo}:${a.assinaturaId}`);

  it('avisa o fim do teste, a duplicada, o aumento e a cobrança que chega', () => {
    expect(tipos).toEqual(
      expect.arrayContaining(['fimDoTeste:DISNEY PLUS', 'duplicada:GLOBOPLAY', 'aumento:NETFLIX.COM', 'cobrancaProxima:SPOTIFY']),
    );
  });

  it('não avisa nada de assinatura encerrada', () => {
    expect(alertas.some((a) => a.assinaturaId === 'DEEZER')).toBe(false);
  });

  it('o mais grave vem primeiro', () => {
    const gravidades = alertas.map((a) => a.gravidade);
    expect(gravidades).toEqual([...gravidades].sort((x, y) => y - x));
  });

  it('o texto fala a língua da pessoa', () => {
    const teste = alertas.find((a) => a.tipo === 'fimDoTeste')!;
    expect(teste.titulo).toBe('Disney+: teste grátis acaba em 2 dias');
    expect(teste.detalhe).toContain('33,90 por mês');
    const aumento = alertas.find((a) => a.tipo === 'aumento')!;
    expect(aumento.titulo).toBe('Netflix: preço subiu 12,5%');
  });

  it('alerta dispensado não volta', () => {
    const [primeiro] = alertas;
    expect(gerarAlertas(assinaturas, HOJE, [primeiro.id]).map((a) => a.id)).not.toContain(primeiro.id);
  });

  it('aumento antigo deixa de ser alerta', () => {
    // O aumento da Netflix foi em 30/09: em 20/12 já passou da janela de 45 dias.
    expect(gerarAlertas(assinaturas, '2026-12-20').some((a) => a.tipo === 'aumento')).toBe(false);
  });
});

describe('resumir', () => {
  it('soma só as ativas', () => {
    const r = resumir(assinaturas, {});
    // Netflix 44,90 + Spotify 21,90 + Academia 119,90 + iCloud 14,90 + YouTube 26,90 + Globoplay 22,90 + Prime 166,80/12
    expect(r.totalMensal).toBe(4490 + 2190 + 11990 + 1490 + 2690 + 2290 + 1390);
    expect(r.ativas).toBe(7);
    expect(r.emTeste).toBe(1);
    expect(r.economiaAnual).toBe(0);
  });

  it('economia conta as marcadas para cancelar, inclusive teste grátis', () => {
    const r = resumir(assinaturas, { 'NETFLIX.COM': 'cancelar', 'DISNEY PLUS': 'cancelar', SPOTIFY: 'manter' });
    expect(r.marcadas).toBe(2);
    expect(r.economiaAnual).toBe(4490 * 12 + 3390 * 12);
  });

  it('marcar assinatura já encerrada não gera economia', () => {
    expect(resumir(assinaturas, { DEEZER: 'cancelar' }).economiaAnual).toBe(0);
  });
});

describe('proximasCobrancas', () => {
  it('lista os próximos 7 dias em ordem', () => {
    const nomes = proximasCobrancas(assinaturas, 7, HOJE).map((a) => a.nome);
    expect(nomes[0]).toBe('Disney+');
    expect(nomes).toContain('Spotify');
    expect(nomes).not.toContain('Deezer');
  });
});
