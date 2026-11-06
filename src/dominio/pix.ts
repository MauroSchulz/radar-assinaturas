/**
 * Pix "copia e cola" estático, no padrão BR Code do Banco Central (formato EMV).
 *
 * O texto é uma sequência de campos `ID (2 dígitos) + TAMANHO (2 dígitos) + VALOR`,
 * terminada por um CRC16 que o app do banco confere antes de aceitar o código.
 */

export type TipoChave = 'cpf' | 'cnpj' | 'celular' | 'email' | 'aleatoria';

export interface DadosPix {
  chave: string;
  nome: string;
  cidade: string;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), o exigido pelo BR Code. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Nome e cidade vão sem acento e em maiúsculas: nem todo banco lê acento no BR Code. */
export function semAcento(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Confere os dois dígitos verificadores do CPF. */
export function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1{10}$/.test(digitos)) return false;
  const nums = digitos.split('').map(Number);
  for (const posicao of [9, 10]) {
    const soma = nums.slice(0, posicao).reduce((s, n, i) => s + n * (posicao + 1 - i), 0);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== nums[posicao]) return false;
  }
  return true;
}

function celular(digitos: string): { tipo: TipoChave; chave: string } | null {
  const semPais = digitos.startsWith('55') && digitos.length >= 12 ? digitos.slice(2) : digitos;
  if (/^\d{2}9\d{8}$/.test(semPais)) return { tipo: 'celular', chave: `+55${semPais}` };
  return null;
}

/**
 * Reconhece o tipo da chave e devolve como o Pix espera: CPF e CNPJ só com dígitos,
 * celular com +55. Devolve `null` se não parecer uma chave válida.
 * 11 dígitos podem ser CPF ou celular (DDD + 9): vale CPF quando os verificadores batem.
 */
export function normalizarChave(entrada: string): { tipo: TipoChave; chave: string } | null {
  const texto = entrada.trim();
  if (!texto) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) return { tipo: 'email', chave: texto.toLowerCase() };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto)) {
    return { tipo: 'aleatoria', chave: texto.toLowerCase() };
  }
  if (!/^[\d.\-/()+\s]+$/.test(texto)) return null;
  const digitos = texto.replace(/\D/g, '');
  if (texto.startsWith('+') || texto.includes('(')) return celular(digitos);
  if (digitos.length === 14) return { tipo: 'cnpj', chave: digitos };
  if (digitos.length === 11 && cpfValido(digitos)) return { tipo: 'cpf', chave: digitos };
  return celular(digitos);
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

/** Monta o Pix copia e cola. `valor` em centavos; sem valor, quem paga digita. */
export function payloadPix(dados: DadosPix, valor?: number): string {
  const normalizada = normalizarChave(dados.chave);
  if (!normalizada) throw new Error('Chave Pix inválida');
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizada.chave);
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor && valor > 0 ? campo('54', (valor / 100).toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcento(dados.nome).slice(0, 25) || 'RECEBEDOR') +
    campo('60', semAcento(dados.cidade).slice(0, 15) || 'BRASIL') +
    campo('62', campo('05', '***')) +
    '6304';
  return corpo + crc16(corpo);
}
