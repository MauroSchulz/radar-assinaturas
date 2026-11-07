import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarraAbas } from './src/componentes/BarraAbas';
import { useNavegacao, type Aba, type Rota } from './src/estado/navegacao';
import { cor, ESQUEMA } from './src/tema/tokens';
import { Alertas } from './src/telas/Alertas';
import { Assinaturas } from './src/telas/Assinaturas';
import { CaixinhaDetalhe } from './src/telas/CaixinhaDetalhe';
import { Cobranca } from './src/telas/Cobranca';
import { Detalhe } from './src/telas/Detalhe';
import { Emprestimo } from './src/telas/Emprestimo';
import { EscolherCompra } from './src/telas/EscolherCompra';
import { Fatura } from './src/telas/Fatura';
import { Inicio } from './src/telas/Inicio';
import { Investir } from './src/telas/Investir';
import { MontarRacha } from './src/telas/MontarRacha';
import { NovaCaixinha } from './src/telas/NovaCaixinha';
import { RachaDetalhe } from './src/telas/RachaDetalhe';
import { Rachar } from './src/telas/Rachar';
import { SeuPix } from './src/telas/SeuPix';

function TelaDaRota({ rota }: { rota: Rota }) {
  switch (rota.nome) {
    case 'assinatura':
      return <Detalhe id={rota.id} />;
    case 'racha':
      return <RachaDetalhe id={rota.id} />;
    case 'escolherCompra':
      return <EscolherCompra />;
    case 'montarRacha':
      return <MontarRacha titulo={rota.titulo} origem={rota.origem} />;
    case 'seuPix':
      return <SeuPix />;
    case 'caixinha':
      return <CaixinhaDetalhe id={rota.id} />;
    case 'novaCaixinha':
      return <NovaCaixinha sugestao={rota.sugestao} />;
    case 'fatura':
      return <Fatura />;
    case 'emprestimo':
      return <Emprestimo />;
    case 'cobranca':
      return <Cobranca pessoaId={rota.pessoaId} rachaId={rota.rachaId} />;
  }
}

const RAIZ: Record<Aba, () => React.JSX.Element> = {
  inicio: Inicio,
  assinaturas: Assinaturas,
  rachar: Rachar,
  investir: Investir,
  alertas: Alertas,
};

function Conteudo() {
  const aba = useNavegacao((s) => s.aba);
  const pilha = useNavegacao((s) => s.pilha);
  const voltar = useNavegacao((s) => s.voltar);
  const topo = pilha[pilha.length - 1];

  // Botão voltar do Android desempilha em vez de sair do app.
  useEffect(() => {
    if (!topo) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      voltar();
      return true;
    });
    return () => assinatura.remove();
  }, [topo, voltar]);

  if (topo) {
    // A chave remonta a tela ao trocar de rota: rascunho de uma não vaza para a outra.
    return <TelaDaRota key={`${pilha.length}-${topo.nome}`} rota={topo} />;
  }
  const Raiz = RAIZ[aba];
  return <Raiz />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style={ESQUEMA === 'escuro' ? 'light' : 'dark'} />
      <View style={estilos.app}>
        <View style={estilos.conteudo}>
          <Conteudo />
        </View>
        <BarraAbas />
      </View>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  app: { flex: 1, backgroundColor: cor.fundo },
  conteudo: { flex: 1 },
});
