import { cpfValido, crc16, normalizarChave, payloadPix, semAcento } from '../pix';

describe('crc16', () => {
  it('bate o valor de referência do CRC-16/CCITT-FALSE', () => {
    // Vetor de teste clássico do algoritmo: "123456789" → 29B1.
    expect(crc16('123456789')).toBe('29B1');
  });
});

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores certos', () => expect(cpfValido('52998224725')).toBe(true));
  it('recusa dígito verificador errado', () => expect(cpfValido('52998224724')).toBe(false));
  it('recusa números repetidos', () => expect(cpfValido('11111111111')).toBe(false));
});

describe('normalizarChave', () => {
  it.each([
    ['529.982.247-25', { tipo: 'cpf', chave: '52998224725' }],
    ['52998224725', { tipo: 'cpf', chave: '52998224725' }],
    ['12.345.678/0001-95', { tipo: 'cnpj', chave: '12345678000195' }],
    ['(11) 98765-4321', { tipo: 'celular', chave: '+5511987654321' }],
    ['11987654321', { tipo: 'celular', chave: '+5511987654321' }],
    ['+55 11 98765-4321', { tipo: 'celular', chave: '+5511987654321' }],
    ['Mauro@Exemplo.com', { tipo: 'email', chave: 'mauro@exemplo.com' }],
    ['123E4567-E89B-12D3-A456-426614174000', { tipo: 'aleatoria', chave: '123e4567-e89b-12d3-a456-426614174000' }],
  ])('%s', (entrada, esperado) => expect(normalizarChave(entrada)).toEqual(esperado));

  it.each(['', 'abc', '1234', 'mauro@', '(11) 1234'])('recusa "%s"', (entrada) => {
    expect(normalizarChave(entrada)).toBeNull();
  });
});

describe('semAcento', () => {
  it('tira acento e símbolo e põe em maiúsculas', () => expect(semAcento('  São João d’El-Rei ')).toBe('SAO JOAO DELREI'));
});

describe('payloadPix', () => {
  const dados = { chave: '+55 11 98765-4321', nome: 'Mauro Schulz', cidade: 'São Paulo' };

  it('monta o BR Code campo a campo', () => {
    const pix = payloadPix(dados, 12000);
    expect(pix.startsWith('000201')).toBe(true);
    expect(pix).toContain('26360014br.gov.bcb.pix0114+5511987654321');
    expect(pix).toContain('52040000');
    expect(pix).toContain('5303986');
    expect(pix).toContain('5406120.00');
    expect(pix).toContain('5802BR');
    expect(pix).toContain('5912MAURO SCHULZ');
    expect(pix).toContain('6009SAO PAULO');
    expect(pix).toContain('62070503***');
  });

  it('termina com o CRC do próprio texto', () => {
    const pix = payloadPix(dados, 2245);
    const corpo = pix.slice(0, -4);
    expect(corpo.endsWith('6304')).toBe(true);
    expect(pix.slice(-4)).toBe(crc16(corpo));
  });

  it('sem valor, omite o campo 54 (quem paga digita)', () => {
    expect(payloadPix(dados)).not.toContain('5406');
  });

  it('corta nome em 25 e cidade em 15 caracteres', () => {
    const pix = payloadPix({ chave: 'a@b.co', nome: 'Maria Aparecida dos Santos Oliveira', cidade: 'São José dos Campos do Sul' }, 100);
    expect(pix).toContain('5925MARIA APARECIDA DOS SANTO');
    expect(pix).toContain('6015SAO JOSE DOS CA');
  });

  it('recusa chave inválida', () => {
    expect(() => payloadPix({ ...dados, chave: 'nada' }, 100)).toThrow('Chave Pix inválida');
  });
});
