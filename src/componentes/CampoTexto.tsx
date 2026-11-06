import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ALVO_MINIMO, cor, espaco, raio, tipo } from '../tema/tokens';
import { Texto } from './Texto';

interface Props extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  ajuda?: string;
  erro?: string | null;
}

/** Campo com rótulo em cima. O rótulo é o nome do campo para o leitor de tela. */
export function CampoTexto({ rotulo, ajuda, erro, ...resto }: Props) {
  return (
    <View style={estilos.campo}>
      <Texto variante="corpoForte">{rotulo}</Texto>
      <TextInput
        {...resto}
        accessibilityLabel={rotulo}
        accessibilityHint={erro ?? ajuda}
        placeholderTextColor={cor.textoSuave}
        style={[estilos.entrada, erro ? estilos.entradaComErro : null]}
      />
      {erro ? (
        <Texto variante="apoio" cor={cor.perigo}>
          {erro}
        </Texto>
      ) : ajuda ? (
        <Texto variante="apoio" cor={cor.textoSuave}>
          {ajuda}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: espaco.xs },
  entrada: {
    ...tipo.corpo,
    color: cor.texto,
    minHeight: ALVO_MINIMO + 4,
    paddingHorizontal: espaco.m,
    borderRadius: raio.s,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.fundo,
  },
  entradaComErro: { borderColor: cor.perigo },
});
