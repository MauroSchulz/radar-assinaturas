jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// A área de transferência é nativa: no teste, só registra o que seria copiado.
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

// Sem o mock, o SafeAreaProvider não desenha nada no teste (espera medir a tela).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
