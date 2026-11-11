import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundoDegrade } from '../componentes/FundoDegrade';
import { Texto } from '../componentes/Texto';
import { usePerfil } from '../estado/perfil';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

type Icone = ComponentProps<typeof Ionicons>['name'];

const PASSOS: { icone: Icone; titulo: string; texto: string }[] = [
  {
    icone: 'radio-outline',
    titulo: 'Bem-vindo ao Radar',
    texto: 'O Radar lê as compras do seu cartão e acha sozinho tudo o que se repete: as suas assinaturas, com quanto custam por mês e por ano.',
  },
  {
    icone: 'notifications-outline',
    titulo: 'Avisa antes do dinheiro sair',
    texto: 'Teste grátis acabando, preço que subiu, cobrança em dobro e o calendário do mês. E, se você quiser, um aviso no celular um dia antes.',
  },
  {
    icone: 'people-outline',
    titulo: 'Divide a conta e cobra por Pix',
    texto: 'Racha a compra ou a assinatura com os amigos e manda a cobrança com QR Code e Pix no valor certo. Faz Pix, transferência e Pix no crédito.',
  },
];

/** Três telas na primeira abertura (e de novo ao recomeçar a demonstração). */
export function BoasVindas() {
  const marcar = usePerfil((s) => s.marcarBoasVindas);
  const [passo, setPasso] = useState(0);
  const { top, bottom } = useSafeAreaInsets();
  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <View style={[estilos.tela, { paddingTop: top + espaco.l, paddingBottom: bottom + espaco.xl }]}>
      <StatusBar style="light" />
      <FundoDegrade />
      <View style={estilos.topo}>
        {!ultimo && (
          <Pressable onPress={marcar} accessibilityRole="button" accessibilityLabel="Pular" hitSlop={8} style={estilos.pular}>
            <Texto variante="corpoForte" cor={cor.sobreDestaque}>
              Pular
            </Texto>
          </Pressable>
        )}
      </View>

      <View style={estilos.meio} accessibilityLiveRegion="polite">
        <View style={estilos.icone} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name={atual.icone} size={44} color={cor.sobreDestaque} />
        </View>
        <Texto variante="titulo" cor={cor.sobreDestaque} accessibilityRole="header" style={estilos.centro}>
          {atual.titulo}
        </Texto>
        <Texto variante="corpo" cor={cor.sobreDestaqueSuave} style={estilos.centro}>
          {atual.texto}
        </Texto>
      </View>

      <View style={estilos.baixo}>
        <View style={estilos.pontos} accessible accessibilityLabel={`Passo ${passo + 1} de ${PASSOS.length}`}>
          {PASSOS.map((_, i) => (
            <View key={i} style={[estilos.ponto, i === passo && estilos.pontoAtual]} />
          ))}
        </View>
        <Pressable
          onPress={() => (ultimo ? marcar() : setPasso(passo + 1))}
          accessibilityRole="button"
          accessibilityLabel={ultimo ? 'Começar' : 'Continuar'}
          style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado]}
        >
          <Texto variante="corpoForte" cor={cor.destaque}>
            {ultimo ? 'Começar' : 'Continuar'}
          </Texto>
        </Pressable>
        <Texto variante="apoio" cor={cor.sobreDestaqueSuave} style={estilos.centro}>
          Demonstração: os dados são de exemplo.
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, paddingHorizontal: espaco.xl, justifyContent: 'space-between' },
  topo: { alignItems: 'flex-end', minHeight: ALVO_MINIMO },
  pular: { minHeight: ALVO_MINIMO, justifyContent: 'center', paddingHorizontal: espaco.s },
  meio: { alignItems: 'center', gap: espaco.l },
  icone: {
    width: 96,
    height: 96,
    borderRadius: raio.pilula,
    backgroundColor: cor.vidroSobreFaixa,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.s,
  },
  centro: { textAlign: 'center' },
  baixo: { gap: espaco.l },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: espaco.s },
  ponto: { width: 8, height: 8, borderRadius: raio.pilula, backgroundColor: cor.vidroSobreFaixa },
  pontoAtual: { width: 24, backgroundColor: cor.sobreDestaque },
  // Botão branco com texto verde: o único primário da tela, por cima do degradê.
  botao: {
    minHeight: ALVO_MINIMO + 8,
    borderRadius: raio.m,
    backgroundColor: cor.sobreDestaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { opacity: 0.8 },
});
