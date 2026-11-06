import { Share } from 'react-native';
import { normalizarChave, payloadPix } from '../dominio/pix';
import { mensagemDeCobranca, type Cota, type Pessoa } from '../dominio/racha';
import { useRachas } from './rachas';

/**
 * Abre o "compartilhar" do celular com a mensagem de cobrança pronta. Com chave Pix
 * cadastrada, a mensagem já leva o Pix copia e cola no valor exato do que a pessoa deve.
 */
export async function cobrar(pessoa: Pessoa, cotas: Cota[]): Promise<void> {
  const { rachas, pix } = useRachas.getState();
  const pendentes = cotas.filter((c) => !c.pagoEm);
  if (pendentes.length === 0) return;
  const itens = pendentes.map((c) => ({
    titulo: rachas.find((r) => r.id === c.rachaId)?.titulo ?? 'Racha',
    referente: c.referente,
    valor: c.valor,
  }));
  const total = pendentes.reduce((s, c) => s + c.valor, 0);
  const codigo = normalizarChave(pix.chave) ? payloadPix(pix, total) : null;
  await Share.share({ message: mensagemDeCobranca(pessoa.nome, itens, codigo) });
}

/** Se dá para mandar o Pix junto (chave cadastrada e válida). */
export function temPix(chave: string): boolean {
  return normalizarChave(chave) !== null;
}
