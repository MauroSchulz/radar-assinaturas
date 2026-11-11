import { cancelarLembretes } from '../servicos/notificacoes';
import { useAvisos } from './avisos';
import { useConta } from './conta';
import { useInvestimentos } from './investimentos';
import { useLoja } from './loja';
import { useNavegacao } from './navegacao';
import { usePerfil } from './perfil';
import { useRachas } from './rachas';

/**
 * Volta o app inteiro para o começo da demonstração, como na primeira vez que abriu: sem
 * decisões, Pix enviados, bancos conectados nem avisos, com os rachas e as caixinhas de
 * exemplo, e as boas-vindas aparecem de novo. Útil antes de apresentar.
 */
export async function recomecarDemonstracao(): Promise<void> {
  useLoja.getState().recomecar();
  useRachas.getState().recomecar();
  useInvestimentos.getState().recomecar();
  useConta.getState().recomecar();
  useAvisos.getState().recomecar();
  usePerfil.getState().recomecar();
  useNavegacao.getState().concluir('inicio', []);
  await cancelarLembretes().catch(() => {});
}
