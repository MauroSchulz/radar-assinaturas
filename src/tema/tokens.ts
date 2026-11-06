import { Appearance, type TextStyle } from 'react-native';
import type { Categoria } from '../dominio/tipos';

/**
 * Visual de conceito "dentro do app do banco": roxo no topo e nos destaques. Sem logo nem nome
 * de banco. Toda cor e medida das telas sai daqui.
 *
 * Duas paletas, clara e escura, com as mesmas chaves. O app segue o tema do celular **ao abrir**:
 * as cores entram nos estilos uma vez só, então trocar o tema com o app aberto só aparece depois
 * de recarregar. Os pares texto/fundo de cada paleta passam 4,5:1 (WCAG AA), conferidos em
 * `__tests__/contraste.test.ts`.
 */
export const CLARO = {
  fundo: '#FFFFFF',
  /** Texto secundário direto no fundo. */
  textoSobreFundo: '#5E5869',
  /** Atalhos redondos, faixa "te devem", botão secundário, barra de abas. */
  superficie: '#F4F3F7',
  /** Linha pressionada, trilho da barra de progresso. */
  superficieSuave: '#E9E7EF',
  borda: '#E4E1EA',
  texto: '#1A1523',
  textoSuave: '#5E5869',
  /** Roxo de **fundo**: botão principal, cartões de total, ficha marcada, barra de progresso. */
  destaque: '#820AD1',
  /** Roxo de **texto e ícone**: links, Voltar, valores em destaque, aba ativa. */
  destaqueTexto: '#820AD1',
  /** Quadro lilás de destaque, botão selecionado, pílula da aba ativa. */
  destaqueSuave: '#F1E6FB',
  /** Faixa do topo do Início. */
  faixa: '#820AD1',
  sobreDestaque: '#FFFFFF',
  sobreDestaqueSuave: '#E9D5F7',
  perigo: '#A3241C',
  /** Vermelho para texto direto no fundo. */
  perigoSobreFundo: '#A3241C',
  perigoFundo: '#F7E0DC',
  /** Fundo do contador vermelho (texto branco por cima). */
  selo: '#A3241C',
  alerta: '#8A4304',
  alertaFundo: '#FAE8D6',
  info: '#24496F',
  infoFundo: '#DFE8F2',
  /** Sombra da barra de abas flutuante. */
  sombra: '#1A1523',
};

export type Paleta = Record<keyof typeof CLARO, string>;

export const ESCURO: Paleta = {
  fundo: '#000000',
  textoSobreFundo: '#A9A5B2',
  superficie: '#1C1B20',
  superficieSuave: '#2A2930',
  borda: '#26252B',
  texto: '#F5F4F7',
  textoSuave: '#A9A5B2',
  destaque: '#8A2BE2',
  destaqueTexto: '#C49BF5',
  destaqueSuave: '#2B1D3D',
  faixa: '#2E1A52',
  sobreDestaque: '#FFFFFF',
  sobreDestaqueSuave: '#EBDDFB',
  perigo: '#FF8F87',
  perigoSobreFundo: '#FF8F87',
  perigoFundo: '#3B1715',
  selo: '#C8322A',
  alerta: '#FFBE7A',
  alertaFundo: '#3A2611',
  info: '#A3C8F2',
  infoFundo: '#15263B',
  sombra: '#000000',
};

/** O tema do celular na hora em que o app abriu. */
export const ESQUEMA: 'claro' | 'escuro' = Appearance.getColorScheme() === 'dark' ? 'escuro' : 'claro';

export const cor: Paleta = ESQUEMA === 'escuro' ? ESCURO : CLARO;

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const raio = { s: 8, m: 14, l: 20, pilula: 999 } as const;
/** Menor área de toque aceitável. */
export const ALVO_MINIMO = 44;

type CoresDaCategoria = Record<Categoria, { fundo: string; texto: string }>;

export const CATEGORIA_CLARO: CoresDaCategoria = {
  video: { fundo: '#F6DEDA', texto: '#8E2A1F' },
  musica: { fundo: '#DCEFE0', texto: '#245E33' },
  saude: { fundo: '#FBE7C8', texto: '#7A4A06' },
  nuvem: { fundo: '#DDE7F4', texto: '#25476F' },
  compras: { fundo: '#EDE1F1', texto: '#5E3470' },
  outros: { fundo: '#E8E6DE', texto: '#454B47' },
};

/** No escuro, o quadradinho do avatar fica escuro e a letra clara: tom pastel no preto ofusca. */
export const CATEGORIA_ESCURO: CoresDaCategoria = {
  video: { fundo: '#3A1A16', texto: '#FFB4A8' },
  musica: { fundo: '#15301C', texto: '#9EDCAE' },
  saude: { fundo: '#3A2A10', texto: '#FFD08A' },
  nuvem: { fundo: '#152A40', texto: '#A9CBF3' },
  compras: { fundo: '#2E1B38', texto: '#DDB8EE' },
  outros: { fundo: '#26252B', texto: '#CFCCD6' },
};

export const CORES_DA_CATEGORIA: CoresDaCategoria = ESQUEMA === 'escuro' ? CATEGORIA_ESCURO : CATEGORIA_CLARO;

export const NOME_DA_CATEGORIA: Record<Categoria, string> = {
  video: 'Vídeo',
  musica: 'Música',
  saude: 'Academia e saúde',
  nuvem: 'Armazenamento',
  compras: 'Compras',
  outros: 'Outros',
};

const NUMERO: TextStyle = { fontVariant: ['tabular-nums'] };

export const tipo = {
  titulo: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4 },
  subtitulo: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  corpo: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  corpoForte: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  apoio: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  legenda: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.2 },
  valor: { fontSize: 16, lineHeight: 22, fontWeight: '600', ...NUMERO },
  /** Valor de uma seção do Início (fatura, empréstimo). */
  valorMedio: { fontSize: 21, lineHeight: 28, fontWeight: '700', ...NUMERO },
  valorGrande: { fontSize: 44, lineHeight: 52, fontWeight: '700', letterSpacing: -1, ...NUMERO },
} satisfies Record<string, TextStyle>;

export type Tipo = keyof typeof tipo;
