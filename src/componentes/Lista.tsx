import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { cor, espaco } from '../tema/tokens';

/** Recuo padrão da divisória: começa onde começa o texto, depois do avatar. */
const RECUO_COM_AVATAR = espaco.l + 44 + espaco.m;

/**
 * Linhas soltas no fundo, de uma borda à outra da tela, com divisória fina entre elas.
 * As linhas mantêm o recuo lateral da página por dentro (`paddingHorizontal` de cada uma).
 */
export function Lista({ children, recuo = RECUO_COM_AVATAR }: { children: ReactNode; recuo?: number }) {
  const itens = Children.toArray(children);
  return (
    <View style={estilos.lista}>
      {itens.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={[estilos.divisoria, { marginLeft: recuo }]} />}
          {item}
        </Fragment>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { marginHorizontal: -espaco.l },
  divisoria: { height: StyleSheet.hairlineWidth, backgroundColor: cor.borda },
});
