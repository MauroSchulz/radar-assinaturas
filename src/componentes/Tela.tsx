import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cor, espaco } from '../tema/tokens';
import { espacoParaBarra } from './BarraAbas';
import { FundoDegrade } from './FundoDegrade';
import { Texto } from './Texto';

interface Props {
  titulo?: string;
  sobretitulo?: string;
  /** Fica acima do título (ex.: botão voltar). */
  topo?: ReactNode;
  /** Faixa em degradê de ponta a ponta no topo (tela inicial). O relógio do celular fica branco sobre ela. */
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
      {/* Atrás do relógio e da bateria: o mesmo degradê da faixa, emendado nela. */}
      {faixa && <FundoDegrade />}
      <ScrollView
        style={estilos.rolagem}
        // A barra de abas flutua por cima: sobra espaço embaixo para ela nunca cobrir o último item.
        contentContainerStyle={[estilos.conteudo, { paddingBottom: espacoParaBarra(bottom) }, faixa ? estilos.semRespiroNoTopo : null]}
      >
        {faixa && (
          <View style={estilos.faixa}>
            <FundoDegrade />
            {/* Puxar a tela para baixo no iPhone mostra o degradê, não branco, acima da faixa. */}
            <FundoDegrade style={estilos.faixaAcima} />
            {faixa}
          </View>
        )}
        {/* O conteúdo "sobe" por cima do fim da faixa, com os cantos de cima arredondados. */}
        {faixa && <View style={estilos.bordaDaFaixa} />}
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

const RAIO_DA_BORDA = 24;

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo },
  telaComFaixa: { backgroundColor: cor.faixa },
  rolagem: { flex: 1, backgroundColor: cor.fundo },
  conteudo: { paddingHorizontal: espaco.l, paddingTop: espaco.m, paddingBottom: espaco.xxl },
  semRespiroNoTopo: { paddingTop: 0 },
  faixa: {
    marginHorizontal: -espaco.l,
    paddingHorizontal: espaco.l,
    paddingTop: espaco.m,
    paddingBottom: espaco.xl + RAIO_DA_BORDA,
  },
  bordaDaFaixa: {
    height: RAIO_DA_BORDA,
    marginTop: -RAIO_DA_BORDA,
    marginHorizontal: -espaco.l,
    marginBottom: espaco.l,
    backgroundColor: cor.fundo,
    borderTopLeftRadius: RAIO_DA_BORDA,
    borderTopRightRadius: RAIO_DA_BORDA,
  },
  faixaAcima: { top: -1000, bottom: undefined, height: 1000 },
  cabecalho: { gap: 2, marginBottom: espaco.l },
});
