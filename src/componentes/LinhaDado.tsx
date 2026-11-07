import { StyleSheet, View } from 'react-native';
import { cor, espaco } from '../tema/tokens';
import { Texto } from './Texto';

/** "Rótulo ........ valor", para resumo de envio e comprovante. O valor quebra linha à direita. */
export function LinhaDado({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Texto variante="apoio" cor={cor.textoSuave} style={estilos.rotulo}>
        {rotulo}
      </Texto>
      <Texto variante={forte ? 'valor' : 'corpo'} cor={forte ? cor.destaqueTexto : cor.texto} style={estilos.valor}>
        {valor}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.m, paddingVertical: espaco.s },
  rotulo: { width: 110, paddingTop: 1 },
  valor: { flex: 1, textAlign: 'right' },
});
