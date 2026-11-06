import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Alerta, TipoAlerta } from '../dominio/alertas';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';
import { Texto } from './Texto';

type Icone = ComponentProps<typeof Ionicons>['name'];

const ESTILO: Record<TipoAlerta, { icone: Icone; fundo: string; texto: string }> = {
  fimDoTeste: { icone: 'hourglass-outline', fundo: cor.perigoFundo, texto: cor.perigo },
  duplicada: { icone: 'copy-outline', fundo: cor.perigoFundo, texto: cor.perigo },
  aumento: { icone: 'trending-up', fundo: cor.alertaFundo, texto: cor.alerta },
  cobrancaProxima: { icone: 'calendar-outline', fundo: cor.infoFundo, texto: cor.info },
};

interface Props {
  alerta: Alerta;
  aoAbrir: () => void;
  aoDispensar: () => void;
}

export function CartaoAlerta({ alerta, aoAbrir, aoDispensar }: Props) {
  const estilo = ESTILO[alerta.tipo];
  return (
    <View style={[estilos.cartao, { backgroundColor: estilo.fundo }]}>
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`${alerta.titulo}. ${alerta.detalhe}`}
        accessibilityHint="Abre a assinatura"
        style={({ pressed }) => [estilos.corpo, pressed && estilos.pressionado]}
      >
        <Ionicons name={estilo.icone} size={22} color={estilo.texto} style={estilos.icone} />
        <View style={estilos.textos}>
          <Texto variante="corpoForte" cor={estilo.texto}>
            {alerta.titulo}
          </Texto>
          <Texto variante="apoio" cor={cor.texto}>
            {alerta.detalhe}
          </Texto>
        </View>
      </Pressable>
      <Pressable
        onPress={aoDispensar}
        accessibilityRole="button"
        accessibilityLabel={`Dispensar: ${alerta.titulo}`}
        style={({ pressed }) => [estilos.fechar, pressed && estilos.pressionado]}
      >
        <Ionicons name="close" size={20} color={cor.textoSuave} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', borderRadius: raio.m, alignItems: 'flex-start' },
  corpo: { flex: 1, flexDirection: 'row', gap: espaco.m, padding: espaco.l, paddingRight: 0 },
  icone: { marginTop: 1 },
  textos: { flex: 1, gap: 2 },
  fechar: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center', margin: espaco.xs },
  pressionado: { opacity: 0.6 },
});
