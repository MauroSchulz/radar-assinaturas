import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { dinheiro, porcentagem } from '../dominio/formato';
import { aporteMensalAtual, saldoDaCaixinha, type Caixinha } from '../dominio/investimentos';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';
import { BarraProgresso } from './BarraProgresso';
import { Texto } from './Texto';

export function LinhaCaixinha({ caixinha: c, aoTocar }: { caixinha: Caixinha; aoTocar: () => void }) {
  const { saldo } = saldoDaCaixinha(c);
  const mensal = aporteMensalAtual(c);
  const fracao = c.meta ? saldo / c.meta : 0;
  const legenda = c.meta
    ? `Meta ${dinheiro(c.meta)} · ${porcentagem(Math.min(1, fracao), 0)}`
    : mensal > 0
      ? `Guardando ${dinheiro(mensal)} por mês`
      : 'Sem meta';

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${c.nome}, ${dinheiro(saldo)}. ${legenda}.`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <View style={estilos.icone} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name={c.origem ? 'leaf-outline' : 'wallet-outline'} size={22} color={cor.destaqueTexto} />
      </View>
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={2}>
          {c.nome}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {legenda}
        </Texto>
        {c.meta !== null && <BarraProgresso fracao={fracao} />}
      </View>
      <Texto variante="valor">{dinheiro(saldo)}</Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  icone: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaqueSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meio: { flex: 1, gap: 4 },
});
