import type { Categoria } from './tipos';

/**
 * Serviços que o radar reconhece pelo nome no extrato. Um serviço fora daqui também é
 * detectado (pelo padrão de cobrança); o catálogo só dá nome bonito, categoria,
 * duração do teste grátis e os passos para cancelar.
 */
export interface ServicoConhecido {
  /** Trecho que aparece na descrição do extrato, já em maiúsculas e sem acento. */
  padrao: string;
  /** Sem nome, usa o que vem do extrato (ex.: `Academia Corpo Livre`). */
  nome?: string;
  categoria: Categoria;
  /** Dias de teste grátis, quando o serviço oferece. */
  testeDias?: number;
  /** Preço mensal depois do teste, em centavos. Valor de demonstração. */
  precoReferencia?: number;
  comoCancelar?: string[];
}

export const CATALOGO: ServicoConhecido[] = [
  {
    padrao: 'NETFLIX',
    nome: 'Netflix',
    categoria: 'video',
    comoCancelar: [
      'Entre na sua conta pelo navegador, no site do serviço.',
      'Abra Conta e depois Gerenciar assinatura.',
      'Toque em Cancelar assinatura e confirme.',
    ],
  },
  {
    padrao: 'SPOTIFY',
    nome: 'Spotify',
    categoria: 'musica',
    comoCancelar: [
      'Entre na sua conta pelo navegador (pelo app nem sempre aparece).',
      'Abra Gerenciar seu plano.',
      'Escolha Cancelar plano e confirme. A conta volta a ser gratuita.',
    ],
  },
  {
    padrao: 'DISNEY',
    nome: 'Disney+',
    categoria: 'video',
    testeDias: 7,
    precoReferencia: 3390,
  },
  { padrao: 'GLOBOPLAY', nome: 'Globoplay', categoria: 'video' },
  { padrao: 'YOUTUBE', nome: 'YouTube Premium', categoria: 'video' },
  { padrao: 'DEEZER', nome: 'Deezer', categoria: 'musica' },
  { padrao: 'AMAZON PRIME', nome: 'Amazon Prime', categoria: 'compras' },
  { padrao: 'ICLOUD', nome: 'iCloud+', categoria: 'nuvem' },
  {
    padrao: 'ACADEMIA',
    categoria: 'saude',
    comoCancelar: [
      'Confira no contrato se há multa ou aviso prévio.',
      'Peça o cancelamento por escrito (na recepção ou por e-mail).',
      'Guarde o comprovante: se cobrarem de novo, ele é sua prova.',
    ],
  },
];

export const COMO_CANCELAR_PADRAO = [
  'Procure "assinatura" ou "plano" nas configurações da sua conta no serviço.',
  'Se não achar, peça o cancelamento ao atendimento e anote o protocolo.',
  'Se continuarem cobrando depois disso, conteste a cobrança com o seu banco.',
];

/** Duração assumida para teste grátis de serviço que não está no catálogo. */
export const TESTE_DIAS_PADRAO = 7;
