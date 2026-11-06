import { StyleSheet, View } from 'react-native';
import { cor, raio } from '../tema/tokens';

/**
 * Barra de progresso decorativa (a porcentagem sempre aparece escrita ao lado, para quem
 * usa leitor de tela). `fracao` de 0 a 1; acima de 1 fica cheia.
 */
export function BarraProgresso({ fracao }: { fracao: number }) {
  const largura = `${Math.round(Math.min(1, Math.max(0, fracao)) * 100)}%` as const;
  return (
    <View style={estilos.trilho} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={[estilos.cheio, { width: largura }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: { height: 8, borderRadius: raio.pilula, backgroundColor: cor.superficieSuave, overflow: 'hidden' },
  cheio: { height: '100%', borderRadius: raio.pilula, backgroundColor: cor.destaque },
});
