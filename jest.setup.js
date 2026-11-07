jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// A área de transferência é nativa: no teste, só registra o que seria copiado.
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

// Notificações e galeria são nativas: no teste, só registram o pedido.
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///galeria/foto.jpg' }] })),
}));

// Sem o mock, o SafeAreaProvider não desenha nada no teste (espera medir a tela).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
