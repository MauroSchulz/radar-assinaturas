import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Share, StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { LinhaDado } from '../componentes/LinhaDado';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { codigoDoComprovante, type Envio, type TipoEnvio } from '../dominio/conta';
import { dataLonga } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { useConta } from '../estado/conta';
import { useNavegacao } from '../estado/navegacao';
import { cor, espaco, raio } from '../tema/tokens';

const TITULO: Record<TipoEnvio, string> = {
  pix: 'Pix enviado',
  transferencia: 'Transferência enviada',
  pixCredito: 'Pix no crédito enviado',
};

function saiuDe(e: Envio): string {
  return e.credito ? `Cartão de crédito, ${e.credito.parcelas}x de ${dinheiro(e.credito.parcela)}` : 'Saldo da conta';
}

/** O texto que vai ao compartilhar o comprovante. */
export function textoDoComprovante(e: Envio): string {
  return [
    `${TITULO[e.tipo]} · Radar (demonstração)`,
    `Valor: ${dinheiro(e.valor)}`,
    `Para: ${e.para}`,
    e.destino,
    `Data: ${dataLonga(e.data)}`,
    `Saiu de: ${saiuDe(e)}`,
    ...(e.descricao ? [`Descrição: ${e.descricao}`] : []),
    `Código: ${codigoDoComprovante(e.id, e.data)}`,
  ].join('\n');
}

export function Comprovante({ id }: { id: string }) {
  const envio = useConta((s) => s.envios.find((e) => e.id === id));
  const trocarAba = useNavegacao((s) => s.trocarAba);
  // O "check" cresce com uma mola, como confirmação de que deu certo.
  const escala = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(escala, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [escala]);
  if (!envio) return null;

  return (
    <Tela topo={<Voltar />}>
      <View style={estilos.topo}>
        <Animated.View style={[estilos.selo, { transform: [{ scale: escala }] }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name="checkmark" size={36} color={cor.destaqueTexto} />
        </Animated.View>
        <Texto variante="subtitulo" accessibilityRole="header">
          {TITULO[envio.tipo]}
        </Texto>
        <Texto variante="valorGrande">{dinheiro(envio.valor)}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`para ${envio.para}`}
        </Texto>
      </View>

      <View style={estilos.dados}>
        <LinhaDado rotulo={envio.tipo === 'transferencia' ? 'Conta' : 'Chave'} valor={envio.destino} />
        <LinhaDado rotulo="Data" valor={dataLonga(envio.data)} />
        <LinhaDado rotulo="Saiu de" valor={saiuDe(envio)} />
        {envio.credito && <LinhaDado rotulo="Total na fatura" valor={dinheiro(envio.credito.total)} />}
        {envio.descricao && <LinhaDado rotulo="Descrição" valor={envio.descricao} />}
        <LinhaDado rotulo="Código" valor={codigoDoComprovante(envio.id, envio.data)} />
      </View>

      <View style={estilos.acoes}>
        <Botao icone="share-outline" rotulo="Compartilhar comprovante" aoTocar={() => Share.share({ message: textoDoComprovante(envio) })} />
        <Botao variante="link" rotulo="Voltar ao início" aoTocar={() => trocarAba('inicio')} />
      </View>
      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.aviso}>
        Demonstração: nenhum dinheiro de verdade foi movimentado.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { alignItems: 'center', gap: espaco.xs, marginTop: espaco.m },
  selo: {
    width: 72,
    height: 72,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaqueSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.s,
  },
  dados: { marginTop: espaco.xl, paddingHorizontal: espaco.l, paddingVertical: espaco.s, borderRadius: raio.m, borderWidth: 1, borderColor: cor.borda },
  acoes: { marginTop: espaco.xl, gap: espaco.s },
  aviso: { marginTop: espaco.l, textAlign: 'center' },
});
