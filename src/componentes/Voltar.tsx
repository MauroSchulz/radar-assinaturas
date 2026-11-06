import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { useNavegacao } from '../estado/navegacao';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';
import { Texto } from './Texto';

export function Voltar() {
  const voltar = useNavegacao((s) => s.voltar);
  return (
    <Pressable
      onPress={voltar}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      style={({ pressed }) => [estilos.voltar, pressed && estilos.pressionado]}
    >
      <Ionicons name="chevron-back" size={24} color={cor.destaqueTexto} />
      <Texto variante="corpoForte" cor={cor.destaqueTexto}>
        Voltar
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: ALVO_MINIMO,
    paddingRight: espaco.m,
    marginLeft: -espaco.xs,
    marginBottom: espaco.s,
  },
  pressionado: { opacity: 0.6 },
});
