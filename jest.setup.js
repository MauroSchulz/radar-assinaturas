jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Sem o mock, o SafeAreaProvider não desenha nada no teste (espera medir a tela).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
