import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cor, espaco, raio } from '../tema/tokens';
import { Texto } from './Texto';

/**
 * Bloco de conteúdo. Por padrão é aberto, sem caixa: a separação entre blocos vem das
 * linhas de ponta a ponta das seções. Com `destaque`, vira um quadro verde-claro, para o que
 * merece chamar atenção (economia, dica, previsão).
 */
export function Cartao({ children, style, destaque }: { children: ReactNode; style?: StyleProp<ViewStyle>; destaque?: boolean }) {
  return <View style={[destaque ? estilos.destaque : null, style]}>{children}</View>;
}

/** Seção: linha fina de ponta a ponta em cima, título em negrito e, opcionalmente, uma ação à direita. */
export function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <View style={estilos.cabecalho}>
        <Texto variante="subtitulo" accessibilityRole="header" style={estilos.tituloSecao}>
          {titulo}
        </Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}

/**
 * Seção que abre outra tela: a seção inteira é o botão, com "›" ao lado do título.
 * `rotulo` é o que o leitor de tela fala (o resumo do que está escrito dentro).
 */
export function SecaoLink({ titulo, rotulo, aoTocar, children }: { titulo: string; rotulo: string; aoTocar: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.secao, pressed && estilos.pressionada]}
    >
      <View style={estilos.cabecalho}>
        <Texto variante="subtitulo" style={estilos.tituloSecao}>
          {titulo}
        </Texto>
        <Ionicons name="chevron-forward" size={20} color={cor.textoSuave} />
      </View>
      {children}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pressionada: { backgroundColor: cor.superficie },
  destaque: {
    backgroundColor: cor.destaqueSuave,
    borderRadius: raio.m,
    padding: espaco.l,
  },
  secao: {
    marginTop: espaco.xl,
    paddingTop: espaco.xl,
    // A linha vai de uma borda à outra da tela, por cima do recuo lateral da página.
    marginHorizontal: -espaco.l,
    paddingHorizontal: espaco.l,
    borderTopWidth: 1,
    borderTopColor: cor.borda,
    gap: espaco.s,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
  tituloSecao: { flex: 1 },
});
