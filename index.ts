import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import { createElement, useEffect, useState, type ComponentType } from 'react';

import { CHAVE_DO_TEMA, definirPreferenciaInicial, ehPreferenciaDeTema } from './src/tema/preferencia';

/**
 * Antes de carregar o app, lê o tema escolhido no perfil (claro, escuro ou o do celular): as
 * cores são calculadas uma vez só, quando o app carrega, então a escolha tem de vir primeiro.
 */
function Iniciar() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(CHAVE_DO_TEMA)
      .catch(() => null)
      .then((salvo) => {
        if (ehPreferenciaDeTema(salvo)) definirPreferenciaInicial(salvo);
        // Só agora o app, e as cores dele, carregam.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const app = require('./App').default as ComponentType;
        setApp(() => app);
      });
  }, []);
  return App ? createElement(App) : null;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Iniciar);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Iniciar);
