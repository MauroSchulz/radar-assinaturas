/**
 * A ponte com as notificações do celular (expo-notifications). Tudo local: o próprio celular
 * agenda e mostra o aviso, sem servidor. Funciona no Expo Go; no navegador, não há suporte.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { HORA_DO_AVISO, type Lembrete } from '../dominio/lembretes';

export const SUPORTA_NOTIFICACOES = Platform.OS === 'ios' || Platform.OS === 'android';

let configurado = false;

/** Mostra o aviso mesmo com o app aberto. */
export function configurarNotificacoes(): void {
  if (configurado || !SUPORTA_NOTIFICACOES) return;
  configurado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export type ResultadoDaPermissao = 'permitido' | 'negado' | 'sem-suporte';

export async function pedirPermissao(): Promise<ResultadoDaPermissao> {
  if (!SUPORTA_NOTIFICACOES) return 'sem-suporte';
  try {
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return 'permitido';
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted ? 'permitido' : 'negado';
  } catch {
    return 'sem-suporte';
  }
}

/** O dia do aviso às 9h, no fuso do celular. */
export function horarioDoAviso(l: Lembrete): Date {
  const [a, m, d] = l.data.split('-').map(Number);
  return new Date(a, m - 1, d, HORA_DO_AVISO, 0, 0);
}

/** Troca tudo o que estava agendado pelos avisos de agora. Devolve quantos ficaram agendados. */
export async function agendarLembretes(lembretes: Lembrete[], agora: Date = new Date()): Promise<number> {
  if (!SUPORTA_NOTIFICACOES) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  let n = 0;
  for (const l of lembretes) {
    const quando = horarioDoAviso(l);
    if (quando <= agora) continue; // o aviso de hoje já passou das 9h
    await Notifications.scheduleNotificationAsync({
      identifier: l.id,
      content: { title: l.titulo, body: l.corpo, data: { assinaturaId: l.assinaturaId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando },
    });
    n += 1;
  }
  return n;
}

export async function cancelarLembretes(): Promise<void> {
  if (!SUPORTA_NOTIFICACOES) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Um aviso de verdade daqui a alguns segundos, para ver como chega. */
export async function testarAgora(l: Pick<Lembrete, 'titulo' | 'corpo'>, segundos = 5): Promise<void> {
  if (!SUPORTA_NOTIFICACOES) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: l.titulo, body: l.corpo },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: segundos },
  });
}
