import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Entrada suave de uma tela: aparece e desliza um pouco da direita (220 ms). Quem pediu para
 * reduzir o movimento no celular vê a tela aparecer direto, sem deslizar.
 */
export function Entrada({ children, deslizar = true }: { children: ReactNode; deslizar?: boolean }) {
  const progresso = useRef(new Animated.Value(0)).current;
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => vivo && setReduzir(Boolean(r)))
      .catch(() => {});
    Animated.timing(progresso, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => {
      vivo = false;
    };
  }, [progresso]);

  const deslocamento = deslizar && !reduzir ? progresso.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) : 0;
  return (
    <Animated.View style={{ flex: 1, opacity: reduzir ? 1 : progresso, transform: [{ translateX: deslocamento }] }}>
      {children}
    </Animated.View>
  );
}
