import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';
import { Texto } from './Texto';

interface Props {
  rotulo: string;
  marcada: boolean;
  aoTocar: () => void;
  /** `checkbox` para marcar várias (quem entra no racha); `radio` para escolher uma (prazo). */
  papel?: 'checkbox' | 'radio';
}

/** Pílula que marca e desmarca. Marcada, fica roxa com um ✓. */
export function Ficha({ rotulo, marcada, aoTocar, papel = 'checkbox' }: Props) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole={papel}
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.ficha, marcada && estilos.marcada, pressed && estilos.pressionada]}
    >
      {marcada && <Ionicons name="checkmark" size={16} color={cor.sobreDestaque} />}
      <Texto variante="corpoForte" cor={marcada ? cor.sobreDestaque : cor.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  ficha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.l,
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
  },
  marcada: { backgroundColor: cor.destaque, borderColor: cor.destaque },
  pressionada: { opacity: 0.7 },
});
