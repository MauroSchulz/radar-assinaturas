import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cor, espaco } from '../tema/tokens';
import { espacoParaBarra } from './BarraAbas';
import { Texto } from './Texto';

interface Props {
  titulo?: string;
  sobretitulo?: string;
  /** Fica acima do título (ex.: botão voltar). */
  topo?: ReactNode;
  /** Faixa roxa de ponta a ponta no topo (tela inicial). O relógio do celular fica branco sobre ela. */
  faixa?: ReactNode;
  children: ReactNode;
}

export function Tela({ titulo, sobretitulo, topo, faixa, children }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  // O recuo do topo fica fora da rolagem: assim o conteúdo some antes de chegar
  // no relógio e na bateria, em vez de passar por baixo deles.
  return (
    <View style={[estilos.tela, { paddingTop: top }, faixa ? estilos.telaComFaixa : null]}>
      {faixa && <StatusBar style="light" />}
      <ScrollView
        style={estilos.rolagem}
        // A barra de abas flutua por cima: sobra espaço embaixo para ela nunca cobrir o último item.
        contentContainerStyle={[estilos.conteudo, { paddingBottom: espacoParaBarra(bottom) }, faixa ? estilos.semRespiroNoTopo : null]}
      >
        {faixa && (
          <View style={estilos.faixa}>
            {/* Puxar a tela para baixo no iPhone mostra roxo, não branco, acima da faixa. */}
            <View style={estilos.faixaAcima} />
            {faixa}
          </View>
        )}
        {topo}
        {(titulo || sobretitulo) && (
          <View style={estilos.cabecalho}>
            {sobretitulo && (
              <Texto variante="legenda" cor={cor.textoSobreFundo}>
                {sobretitulo}
              </Texto>
            )}
            {titulo && (
              <Texto variante="titulo" accessibilityRole="header">
                {titulo}
              </Texto>
            )}
          </View>
        )}
        {children}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo },
  telaComFaixa: { backgroundColor: cor.faixa },
  rolagem: { flex: 1, backgroundColor: cor.fundo },
  conteudo: { paddingHorizontal: espaco.l, paddingTop: espaco.m, paddingBottom: espaco.xxl },
  semRespiroNoTopo: { paddingTop: 0 },
  faixa: {
    backgroundColor: cor.faixa,
    marginHorizontal: -espaco.l,
    paddingHorizontal: espaco.l,
    paddingTop: espaco.m,
    paddingBottom: espaco.xl,
    marginBottom: espaco.xl,
  },
  faixaAcima: { position: 'absolute', left: 0, right: 0, top: -1000, height: 1000, backgroundColor: cor.faixa },
  cabecalho: { gap: 2, marginBottom: espaco.l },
});
