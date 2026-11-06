import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao } from '../componentes/Cartao';
import { CartaoAlerta } from '../componentes/CartaoAlerta';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { useLoja } from '../estado/loja';
import { abrirAssinatura } from '../estado/navegacao';
import { useAlertas } from '../estado/radar';
import { cor, espaco } from '../tema/tokens';

export function Alertas() {
  const alertas = useAlertas();
  const dispensar = useLoja((s) => s.dispensar);
  const dispensados = useLoja((s) => s.alertasDispensados.length);
  const restaurarAlertas = useLoja((s) => s.restaurarAlertas);
  const abrir = abrirAssinatura;

  return (
    <Tela titulo="Alertas" sobretitulo="Testes acabando, aumentos e cobranças repetidas">
      {alertas.length === 0 ? (
        <Cartao style={estilos.vazio}>
          <Ionicons name="checkmark-circle-outline" size={40} color={cor.destaqueTexto} />
          <Texto variante="corpoForte">Tudo em dia</Texto>
          <Texto variante="apoio" cor={cor.textoSuave} style={estilos.centro}>
            Nenhum alerta agora. Quando algo mudar no seu cartão, aparece aqui.
          </Texto>
        </Cartao>
      ) : (
        <View style={estilos.lista}>
          {alertas.map((alerta) => (
            <CartaoAlerta
              key={alerta.id}
              alerta={alerta}
              aoAbrir={() => abrir(alerta.assinaturaId)}
              aoDispensar={() => dispensar(alerta.id)}
            />
          ))}
        </View>
      )}
      {dispensados > 0 && (
        <View style={estilos.rodape}>
          <Botao variante="link" rotulo="Mostrar os dispensados de novo" aoTocar={restaurarAlertas} />
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.s },
  vazio: { alignItems: 'center', gap: espaco.s, paddingVertical: espaco.xxl },
  centro: { textAlign: 'center' },
  rodape: { marginTop: espaco.l, alignItems: 'center' },
});
