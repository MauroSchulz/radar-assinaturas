import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarraAbas } from './src/componentes/BarraAbas';
import { useAvisos, useLembretes } from './src/estado/avisos';
import { useNavegacao, type Aba, type Rota } from './src/estado/navegacao';
import { usePerfil } from './src/estado/perfil';
import { agendarLembretes, cancelarLembretes, configurarNotificacoes } from './src/servicos/notificacoes';
import { cor, ESQUEMA } from './src/tema/tokens';
import { Alertas } from './src/telas/Alertas';
import { Assinaturas } from './src/telas/Assinaturas';
import { CaixinhaDetalhe } from './src/telas/CaixinhaDetalhe';
import { Cobranca } from './src/telas/Cobranca';
import { Bancos } from './src/telas/Bancos';
import { BoasVindas } from './src/telas/BoasVindas';
import { Calendario } from './src/telas/Calendario';
import { Comprovante } from './src/telas/Comprovante';
import { ConectarBanco } from './src/telas/ConectarBanco';
import { Detalhe } from './src/telas/Detalhe';
import { Emprestimo } from './src/telas/Emprestimo';
import { Enviar } from './src/telas/Enviar';
import { EscolherCompra } from './src/telas/EscolherCompra';
import { Fatura } from './src/telas/Fatura';
import { Inicio } from './src/telas/Inicio';
import { Investir } from './src/telas/Investir';
import { CobrarTodos } from './src/telas/CobrarTodos';
import { MontarRacha } from './src/telas/MontarRacha';
import { NovaDespesa } from './src/telas/NovaDespesa';
import { PagarAmigo } from './src/telas/PagarAmigo';
import { Notificacoes } from './src/telas/Notificacoes';
import { NovaCaixinha } from './src/telas/NovaCaixinha';
import { Perfil } from './src/telas/Perfil';
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
      return <MontarRacha titulo={rota.titulo} origem={rota.origem} pagouId={rota.pagouId} />;
    case 'novaDespesa':
      return <NovaDespesa />;
    case 'pagarAmigo':
      return <PagarAmigo pessoaId={rota.pessoaId} />;
    case 'cobrarTodos':
      return <CobrarTodos />;
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
    case 'enviar':
      return <Enviar modo={rota.modo} preenchido={rota.preenchido} quitar={rota.quitar} />;
    case 'comprovante':
      return <Comprovante id={rota.id} />;
    case 'perfil':
      return <Perfil />;
    case 'bancos':
      return <Bancos />;
    case 'conectarBanco':
      return <ConectarBanco bancoId={rota.bancoId} />;
    case 'notificacoes':
      return <Notificacoes />;
    case 'calendario':
      return <Calendario />;
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

/**
 * Mantém os avisos do celular em dia: ao abrir o app e sempre que mudam as preferências ou as
 * decisões, troca o que está agendado pelos avisos de agora (ou cancela tudo, se desligados).
 */
function SincronizarAvisos() {
  const ativados = useAvisos((s) => s.ativados);
  const registrar = useAvisos((s) => s.registrarAgendados);
  const lembretes = useLembretes();
  useEffect(() => {
    configurarNotificacoes();
  }, []);
  useEffect(() => {
    let vivo = true;
    const tarefa = ativados ? agendarLembretes(lembretes) : cancelarLembretes().then(() => 0);
    tarefa.then((n) => vivo && registrar(n)).catch(() => {});
    return () => {
      vivo = false;
    };
  }, [ativados, lembretes, registrar]);
  return null;
}

/** Se o perfil já foi lido do aparelho: antes disso, não dá para saber se é a primeira abertura. */
function usePerfilCarregado(): boolean {
  const [carregado, setCarregado] = useState(() => usePerfil.persist.hasHydrated());
  useEffect(() => {
    if (usePerfil.persist.hasHydrated()) setCarregado(true);
    return usePerfil.persist.onFinishHydration(() => setCarregado(true));
  }, []);
  return carregado;
}

export default function App() {
  const viuBoasVindas = usePerfil((s) => s.viuBoasVindas);
  const carregado = usePerfilCarregado();
  if (carregado && !viuBoasVindas) {
    return (
      <SafeAreaProvider>
        <BoasVindas />
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <SincronizarAvisos />
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
