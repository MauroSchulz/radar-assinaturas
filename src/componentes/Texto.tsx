import { Text, type TextProps } from 'react-native';
import { cor as cores, tipo, type Tipo } from '../tema/tokens';

interface Props extends TextProps {
  variante?: Tipo;
  /** Sempre explícita: no React Native o texto não herda a cor do pai. */
  cor?: string;
}

export function Texto({ variante = 'corpo', cor = cores.texto, style, ...resto }: Props) {
  return <Text {...resto} style={[tipo[variante], { color: cor }, style]} />;
}
