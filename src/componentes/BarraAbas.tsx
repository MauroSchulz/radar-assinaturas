import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavegacao, type Aba } from '../estado/navegacao';
import { useAlertas } from '../estado/radar';
import { cor, espaco, raio } from '../tema/tokens';
import { Texto } from './Texto';

type Icone = ComponentProps<typeof Ionicons>['name'];

const ABAS: { aba: Aba; rotulo: string; icone: Icone; iconeAtivo: Icone }[] = [
  { aba: 'inicio', rotulo: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { aba: 'assinaturas', rotulo: 'Assinaturas', icone: 'albums-outline', iconeAtivo: 'albums' },
  { aba: 'rachar', rotulo: 'Rachar', icone: 'people-outline', iconeAtivo: 'people' },
  { aba: 'investir', rotulo: 'Investir', icone: 'trending-up-outline', iconeAtivo: 'trending-up' },
  { aba: 'alertas', rotulo: 'Alertas', icone: 'notifications-outline', iconeAtivo: 'notifications' },
];

/** Altura de cada botão da barra (acima do mínimo de 44px de toque). */
const BOTAO = 52;
const RESPIRO = 6;
/** Altura total da pílula. */
export const ALTURA_BARRA = BOTAO + RESPIRO * 2;

/** Distância da barra até a borda de baixo da tela (acima da barrinha do iPhone, quando houver). */
export function distanciaDaBorda(insetBaixo: number): number {
  return Math.max(insetBaixo, espaco.m);
}

/** Quanto o conteúdo precisa sobrar embaixo para a barra nunca cobrir o último item. */
export function espacoParaBarra(insetBaixo: number): number {
  return ALTURA_BARRA + distanciaDaBorda(insetBaixo) + espaco.l;
}

/**
 * Barra de abas flutuante: uma pílula sobre o conteúdo, só com ícones. A aba ativa fica num
 * círculo verde. O nome de cada aba continua valendo para o leitor de tela.
 */
export function BarraAbas() {
  const atual = useNavegacao((s) => s.aba);
  const trocarAba = useNavegacao((s) => s.trocarAba);
  const quantosAlertas = useAlertas().length;
  const { bottom } = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[estilos.camada, { bottom: distanciaDaBorda(bottom) }]}>
      <View accessibilityRole="tablist" style={estilos.pilula}>
        {ABAS.map(({ aba, rotulo, icone, iconeAtivo }) => {
          const ativa = aba === atual;
          const contagem = aba === 'alertas' && quantosAlertas > 0 ? quantosAlertas : 0;
          return (
            <Pressable
              key={aba}
              onPress={() => trocarAba(aba)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={contagem ? `${rotulo}, ${contagem} novos` : rotulo}
              style={({ pressed }) => [estilos.aba, ativa && estilos.abaAtiva, pressed && !ativa && estilos.pressionada]}
            >
              <Ionicons name={ativa ? iconeAtivo : icone} size={24} color={ativa ? cor.sobreDestaque : cor.textoSuave} />
              {contagem > 0 && (
                <View style={estilos.contagem}>
                  <Texto variante="legenda" cor={cor.sobreDestaque} style={estilos.contagemTexto}>
                    {String(contagem)}
                  </Texto>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  camada: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pilula: {
    flexDirection: 'row',
    gap: 2,
    padding: RESPIRO,
    borderRadius: raio.pilula,
    backgroundColor: cor.superficie,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.borda,
    shadowColor: cor.sombra,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  aba: { width: BOTAO, height: BOTAO, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  /** A ativa é mais larga e roxa: dá para achar sem depender só da cor do ícone. */
  abaAtiva: { width: BOTAO + 20, backgroundColor: cor.destaque },
  pressionada: { backgroundColor: cor.superficieSuave },
  contagem: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: raio.pilula,
    backgroundColor: cor.selo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contagemTexto: { fontSize: 11, lineHeight: 14 },
});
