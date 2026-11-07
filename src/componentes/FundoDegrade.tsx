import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { cor } from '../tema/tokens';

/**
 * Degradê da faixa do topo: verde-esmeralda à esquerda, azul-petróleo à direita. Preenche o
 * pai por inteiro, atrás do conteúdo. É **horizontal** de propósito: assim a faixa, o recuo do
 * relógio e o que aparece ao puxar a tela para baixo se emendam sem costura.
 */
export function FundoDegrade({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="degradeFaixa" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={cor.faixa} />
            <Stop offset="1" stopColor={cor.faixaFim} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#degradeFaixa)" />
      </Svg>
    </View>
  );
}
