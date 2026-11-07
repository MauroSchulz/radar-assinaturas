import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Secao } from '../componentes/Cartao';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { bancoPorId, DADOS_COMPARTILHADOS, PRAZO_DO_CONSENTIMENTO_MESES } from '../dominio/bancos';
import { dataLonga, hoje, somarMeses } from '../dominio/datas';
import { useNavegacao } from '../estado/navegacao';
import { usePerfil } from '../estado/perfil';
import { cor, espaco, raio } from '../tema/tokens';

/** Quanto a "conexão" demora na demonstração; nos testes, nada. */
const DEMORA_MS = process.env.NODE_ENV === 'test' ? 0 : 1600;

const PASSOS = ['Abrindo o ambiente do banco…', 'Confirmando a sua autorização…', 'Lendo as faturas do cartão…'];

/** Consentimento do Open Finance, de mentira: o que vai ser lido, por quanto tempo, e autorizar. */
export function ConectarBanco({ bancoId }: { bancoId: string }) {
  const banco = bancoPorId(bancoId);
  const conectar = usePerfil((s) => s.conectar);
  const voltar = useNavegacao((s) => s.voltar);
  const [passo, setPasso] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!banco) return null;

  const autorizar = () => {
    setPasso(0);
    const etapa = DEMORA_MS / PASSOS.length;
    PASSOS.forEach((_, i) => {
      if (i > 0) timers.current.push(setTimeout(() => setPasso(i), etapa * i));
    });
    timers.current.push(
      setTimeout(() => {
        conectar(banco.id);
        voltar();
      }, DEMORA_MS),
    );
  };

  if (passo !== null) {
    return (
      <Tela>
        <View style={estilos.conectando} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={cor.destaqueTexto} />
          <Texto variante="subtitulo">{`Conectando ${banco.nome}`}</Texto>
          <Texto variante="apoio" cor={cor.textoSuave}>
            {PASSOS[passo]}
          </Texto>
        </View>
      </Tela>
    );
  }

  return (
    <Tela topo={<Voltar />} titulo={`Conectar ${banco.nome}`} sobretitulo="Modo demonstração">
      <View style={estilos.quem}>
        <Avatar nome={banco.nome.replace(/^(Banco|Cooperativa) /, '')} categoria={banco.categoria} tamanho={56} />
        <Ionicons name="swap-horizontal" size={22} color={cor.textoSuave} />
        <View style={estilos.radar}>
          <Ionicons name="radio-outline" size={28} color={cor.sobreDestaque} />
        </View>
      </View>
      <Texto variante="corpo">
        {`O Radar quer ler os seus dados no ${banco.nome} para achar as assinaturas sozinho, sem você digitar nada.`}
      </Texto>

      <Secao titulo="O que vai ser compartilhado">
        <View style={estilos.lista}>
          {DADOS_COMPARTILHADOS.map((d) => (
            <View key={d} style={estilos.item}>
              <Ionicons name="checkmark-circle" size={20} color={cor.destaqueTexto} />
              <Texto variante="corpo" style={estilos.flex}>
                {d}
              </Texto>
            </View>
          ))}
          <View style={estilos.item}>
            <Ionicons name="close-circle" size={20} color={cor.textoSuave} />
            <Texto variante="corpo" style={estilos.flex}>
              Não dá para fazer Pix nem pagamentos: é só leitura.
            </Texto>
          </View>
        </View>
      </Secao>

      <Secao titulo="Por quanto tempo">
        <Texto variante="corpo">
          {`${PRAZO_DO_CONSENTIMENTO_MESES} meses, até ${dataLonga(somarMeses(hoje(), PRAZO_DO_CONSENTIMENTO_MESES))}. Você pode desconectar quando quiser, no seu perfil.`}
        </Texto>
      </Secao>

      <View style={estilos.acoes}>
        <Botao variante="primario" icone="lock-closed-outline" rotulo="Autorizar e conectar" aoTocar={autorizar} />
        <Botao variante="link" rotulo="Agora não" aoTocar={voltar} />
      </View>
      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.aviso}>
        Banco fictício. Nenhum dado de verdade é lido.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  quem: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, marginBottom: espaco.l },
  radar: { width: 56, height: 56, borderRadius: raio.m, backgroundColor: cor.destaque, alignItems: 'center', justifyContent: 'center' },
  lista: { gap: espaco.m, marginTop: espaco.s },
  item: { flexDirection: 'row', gap: espaco.m, alignItems: 'flex-start' },
  flex: { flex: 1 },
  acoes: { marginTop: espaco.xl, gap: espaco.s },
  aviso: { marginTop: espaco.l, textAlign: 'center' },
  conectando: { alignItems: 'center', gap: espaco.m, marginTop: 160 },
});
