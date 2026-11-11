import { gerarExtrato } from '../../dados/extrato';
import { BANCOS_DEMO, novaConexao, situacaoDaConexao } from '../bancos';
import { somarDias } from '../datas';
import { detectarAssinaturas } from '../deteccao';
import { JANELA_DE_AVISOS_DIAS, lembretesDeRacha, lembretesDoRadar } from '../lembretes';

const HOJE = '2026-11-07';

describe('conexões de banco (demonstração)', () => {
  it('o consentimento vale 12 meses', () => {
    expect(novaConexao('aurora', HOJE)).toEqual({ bancoId: 'aurora', desde: HOJE, validoAte: '2027-11-07', ultimaLeitura: HOJE });
  });

  it('avisa quando faltam 30 dias ou menos, e vence depois do prazo', () => {
    const c = novaConexao('aurora', HOJE);
    expect(situacaoDaConexao(c, HOJE)).toBe('ativa');
    expect(situacaoDaConexao(c, '2027-10-08')).toBe('vencendo');
    expect(situacaoDaConexao(c, '2027-11-07')).toBe('vencendo');
    expect(situacaoDaConexao(c, '2027-11-08')).toBe('vencida');
  });

  it('os bancos têm id único', () => {
    expect(new Set(BANCOS_DEMO.map((b) => b.id)).size).toBe(BANCOS_DEMO.length);
  });
});

describe('lembretesDoRadar', () => {
  const extrato = gerarExtrato(HOJE);
  const assinaturas = detectarAssinaturas(extrato, HOJE);
  const todos = { cobranca: true, teste: true };

  it('avisa um dia antes de cada cobrança, com nome e valor', () => {
    const lembretes = lembretesDoRadar(assinaturas, {}, todos, HOJE);
    const spotify = assinaturas.find((a) => a.nome === 'Spotify')!;
    const aviso = lembretes.find((l) => l.assinaturaId === spotify.id && l.id.startsWith('cobranca'))!;
    expect(aviso.data).toBe(somarDias(spotify.proximaCobranca, -1));
    expect(aviso.titulo).toBe('Spotify cobra amanhã: R$ 21,90');
  });

  it('avisa dois dias antes do fim do teste grátis', () => {
    const teste = assinaturas.find((a) => a.situacao === 'teste')!;
    const aviso = lembretesDoRadar(assinaturas, {}, todos, HOJE).find((l) => l.id.startsWith('teste'))!;
    expect(aviso.data).toBe(somarDias(teste.proximaCobranca, -2));
    expect(aviso.titulo).toMatch(/acaba em 2 dias$/);
  });

  it('nada de passado, nada além da janela, nada de assinatura encerrada, e em ordem de data', () => {
    const lembretes = lembretesDoRadar(assinaturas, {}, todos, HOJE);
    expect(lembretes.length).toBeGreaterThan(0);
    for (const l of lembretes) {
      expect(l.data >= HOJE).toBe(true);
      expect(l.data <= somarDias(HOJE, JANELA_DE_AVISOS_DIAS)).toBe(true);
    }
    const encerradas = new Set(assinaturas.filter((a) => a.situacao === 'encerrada').map((a) => a.id));
    expect(lembretes.some((l) => encerradas.has(l.assinaturaId))).toBe(false);
    expect([...lembretes].sort((a, b) => a.data.localeCompare(b.data)).map((l) => l.data)).toEqual(lembretes.map((l) => l.data));
  });

  it('respeita as preferências', () => {
    expect(lembretesDoRadar(assinaturas, {}, { cobranca: false, teste: false }, HOJE)).toEqual([]);
    expect(lembretesDoRadar(assinaturas, {}, { cobranca: false, teste: true }, HOJE).every((l) => l.id.startsWith('teste'))).toBe(true);
  });

  it('quem marcou para cancelar recebe o lembrete de que ainda dá tempo', () => {
    const spotify = assinaturas.find((a) => a.nome === 'Spotify')!;
    const aviso = lembretesDoRadar(assinaturas, { [spotify.id]: 'cancelar' }, todos, HOJE).find((l) => l.assinaturaId === spotify.id)!;
    expect(aviso.corpo).toMatch(/Ainda dá tempo/);
  });
});

describe('lembretesDeRacha', () => {
  it('uma semana depois da pendência; se já passou, amanhã', () => {
    const [carla, bruno] = lembretesDeRacha(
      [
        { pessoaId: 'carla', nome: 'Carla', valor: 12000, desde: '2026-11-06' },
        { pessoaId: 'bruno', nome: 'Bruno', valor: 14245, desde: '2026-10-20' },
      ],
      HOJE,
    );
    expect(carla).toMatchObject({ data: '2026-11-13', titulo: 'Carla te deve R$ 120,00' });
    expect(carla.corpo).toMatch(/^Faz 7 dias\./);
    expect(bruno.data).toBe('2026-11-08');
  });

  it('conta a semana a partir da última cobrança mandada; quem não deve, não recebe', () => {
    const [l] = lembretesDeRacha(
      [
        { pessoaId: 'carla', nome: 'Carla', valor: 12000, desde: '2026-11-01', cobradoEm: '2026-11-06' },
        { pessoaId: 'ana', nome: 'Ana', valor: -3000, desde: '2026-11-01' },
      ],
      HOJE,
    );
    expect(l.data).toBe('2026-11-13');
    expect(lembretesDeRacha([{ pessoaId: 'ana', nome: 'Ana', valor: 0, desde: HOJE }], HOJE)).toEqual([]);
  });
});
