/**
 * Vibração curta (háptico), como nos apps de banco: um toque leve ao escolher, um "deu certo"
 * ao confirmar dinheiro saindo. No navegador não há vibração; lá, nada acontece.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const TEM_VIBRACAO = Platform.OS === 'ios' || Platform.OS === 'android';

/** Ao escolher algo: aba, ficha, opção. */
export function vibrarEscolha(): void {
  if (TEM_VIBRACAO) Haptics.selectionAsync().catch(() => {});
}

/** Ao concluir algo importante: Pix enviado, racha criado, recebido. */
export function vibrarSucesso(): void {
  if (TEM_VIBRACAO) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
