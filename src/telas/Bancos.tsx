import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { BANCOS_DEMO, bancoPorId, situacaoDaConexao } from '../dominio/bancos';
import { dataCurta, hoje } from '../dominio/datas';
import { useNavegacao } from '../estado/navegacao';
import { usePerfil } from '../estado/perfil';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

/** Bancos conectados (demonstração do Open Finance) e os que dá para conectar. */
export function Bancos() {
  const conexoes = usePerfil((s) => s.conexoes);
  const desconectar = usePerfil((s) => s.desconectar);
  const ir = useNavegacao((s) => s.ir);
  const disponiveis = BANCOS_DEMO.filter((b) => !conexoes.some((c) => c.bancoId === b.id));

  return (
    <Tela topo={<Voltar />} titulo="Bancos conectados" sobretitulo="Modo demonstração">
      <Cartao destaque style={estilos.explica}>
        <View style={estilos.explicaLinha}>
          <Ionicons name="shield-checkmark-outline" size={22} color={cor.destaqueTexto} />
          <Texto variante="apoio" style={estilos.flex}>
            No app de verdade, o Radar leria suas faturas pelo Open Finance, com a sua autorização e só para
            leitura. Aqui os bancos são fictícios e nada sai do celular.
          </Texto>
        </View>
      </Cartao>

      {conexoes.length > 0 && (
        <Secao titulo={`Conectados (${conexoes.length})`}>
          <Lista>
            {conexoes.map((c) => {
              const banco = bancoPorId(c.bancoId);
              if (!banco) return null;
              const situacao = situacaoDaConexao(c, hoje());
              return (
                <View key={c.bancoId} style={estilos.linha}>
                  <Avatar nome={banco.nome.replace(/^(Banco|Cooperativa) /, '')} categoria={banco.categoria} />
                  <View style={estilos.flex}>
                    <Texto variante="corpoForte">{banco.nome}</Texto>
                    <Texto variante="apoio" cor={situacao === 'ativa' ? cor.textoSuave : cor.perigoSobreFundo}>
                      {situacao === 'vencida'
                        ? 'Autorização vencida: conecte de novo'
                        : `Lido hoje · autorização até ${dataCurta(c.validoAte)}`}
                    </Texto>
                  </View>
                  <Botao compacto variante="linkPerigo" rotulo="Desconectar" nomeAcessivel={`Desconectar ${banco.nome}`} aoTocar={() => desconectar(c.bancoId)} />
                </View>
              );
            })}
          </Lista>
        </Secao>
      )}

      {disponiveis.length > 0 && (
        <Secao titulo={conexoes.length ? 'Conectar outro banco' : 'Escolha seu banco'}>
          <Lista>
            {disponiveis.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => ir({ nome: 'conectarBanco', bancoId: b.id })}
                accessibilityRole="button"
                accessibilityLabel={`Conectar ${b.nome}`}
                style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
              >
                <Avatar nome={b.nome.replace(/^(Banco|Cooperativa) /, '')} categoria={b.categoria} />
                <View style={estilos.flex}>
                  <Texto variante="corpoForte">{b.nome}</Texto>
                  <Texto variante="apoio" cor={cor.textoSuave}>
                    Fictício · cartão e conta
                  </Texto>
                </View>
                <Ionicons name="chevron-forward" size={20} color={cor.textoSuave} />
              </Pressable>
            ))}
          </Lista>
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  explica: { marginTop: espaco.xs },
  explicaLinha: { flexDirection: 'row', gap: espaco.m, alignItems: 'flex-start' },
  flex: { flex: 1, gap: 2 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
});
