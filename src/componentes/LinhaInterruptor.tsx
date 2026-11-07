import { StyleSheet, Switch, View } from 'react-native';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';
import { Texto } from './Texto';

/** Liga/desliga com título e explicação ao lado. O título é o nome do interruptor para o leitor de tela. */
export function LinhaInterruptor({
  titulo,
  descricao,
  ligado,
  aoMudar,
  desabilitado,
}: {
  titulo: string;
  descricao?: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  desabilitado?: boolean;
}) {
  return (
    <View style={[estilos.linha, desabilitado && estilos.desabilitada]}>
      <View style={estilos.textos}>
        <Texto variante="corpoForte">{titulo}</Texto>
        {descricao && (
          <Texto variante="apoio" cor={cor.textoSuave}>
            {descricao}
          </Texto>
        )}
      </View>
      <Switch
        value={ligado}
        onValueChange={aoMudar}
        disabled={desabilitado}
        accessibilityLabel={titulo}
        trackColor={{ false: cor.barraNeutra, true: cor.destaque }}
        thumbColor={cor.sobreDestaque}
        ios_backgroundColor={cor.barraNeutra}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: ALVO_MINIMO + 12, paddingVertical: espaco.s },
  textos: { flex: 1, gap: 2 },
  desabilitada: { opacity: 0.5 },
});
