import { Pressable, StyleSheet, View } from 'react-native';
import { dataCurta, diasEntre, hoje, quando } from '../dominio/datas';
import { dinheiro, POR_PERIODO } from '../dominio/formato';
import type { Assinatura, Decisao } from '../dominio/tipos';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';
import { Avatar } from './Avatar';
import { Texto } from './Texto';

function legenda(a: Assinatura): string {
  if (a.situacao === 'teste') return `Teste grátis até ${dataCurta(a.proximaCobranca)}`;
  if (a.situacao === 'encerrada') return `Última cobrança em ${dataCurta(a.ultimaCobranca!)}`;
  // Perto, "em 2 dias" ajuda mais que a data; longe, só a data cabe e basta.
  if (diasEntre(hoje(), a.proximaCobranca) > 30) return `Próxima em ${dataCurta(a.proximaCobranca)}`;
  return `Próxima ${quando(a.proximaCobranca)} · ${dataCurta(a.proximaCobranca)}`;
}

interface Props {
  assinatura: Assinatura;
  decisao?: Decisao;
  aoTocar: () => void;
}

export function LinhaAssinatura({ assinatura: a, decisao, aoTocar }: Props) {
  const encerrada = a.situacao === 'encerrada';
  const valor = a.situacao === 'teste' && a.valorAtual === 0 ? 'Grátis' : dinheiro(a.valorAtual);
  const vaiCancelar = decisao === 'cancelar' && !encerrada;
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${a.nome}, ${valor} ${POR_PERIODO[a.periodo]}. ${legenda(a)}.${vaiCancelar ? ' Marcada para cancelar.' : ''}`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <View style={encerrada && estilos.apagada}>
        <Avatar nome={a.nome} categoria={a.categoria} />
      </View>
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {a.nome}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={1}>
          {legenda(a)}
        </Texto>
        {vaiCancelar && (
          <View style={estilos.selo}>
            <Texto variante="legenda" cor={cor.perigo}>
              Vou cancelar
            </Texto>
          </View>
        )}
      </View>
      <View style={estilos.fim}>
        <Texto variante="valor" cor={encerrada ? cor.textoSuave : cor.texto}>
          {valor}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {POR_PERIODO[a.periodo]}
        </Texto>
      </View>
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
  apagada: { opacity: 0.5 },
  meio: { flex: 1, gap: 2 },
  fim: { alignItems: 'flex-end' },
  selo: {
    alignSelf: 'flex-start',
    marginTop: espaco.xs,
    paddingHorizontal: espaco.s,
    paddingVertical: 2,
    borderRadius: raio.pilula,
    backgroundColor: cor.perigoFundo,
  },
});
