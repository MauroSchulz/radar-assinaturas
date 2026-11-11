import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { LinhaInterruptor } from '../componentes/LinhaInterruptor';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta, quando } from '../dominio/datas';
import { HORA_DO_AVISO } from '../dominio/lembretes';
import { useAvisos, useLembretes } from '../estado/avisos';
import { pedirPermissao, SUPORTA_NOTIFICACOES, testarAgora } from '../servicos/notificacoes';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

const PROXIMOS_NA_TELA = 5;
const SEGUNDOS_DO_TESTE = 5;

/** Avisos no celular: ligar, escolher quais, ver os próximos e mandar um de teste. */
export function Notificacoes() {
  const ativados = useAvisos((s) => s.ativados);
  const cobranca = useAvisos((s) => s.cobranca);
  const teste = useAvisos((s) => s.teste);
  const racha = useAvisos((s) => s.racha);
  const ativar = useAvisos((s) => s.ativar);
  const alternar = useAvisos((s) => s.alternar);
  const lembretes = useLembretes();
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(
    SUPORTA_NOTIFICACOES ? null : { texto: 'No navegador não há avisos. Abra o app no celular, pelo Expo Go, para receber.', erro: true },
  );

  const ligar = async (ligado: boolean) => {
    if (!ligado) {
      ativar(false);
      setMensagem({ texto: 'Avisos desligados. Nada fica agendado no celular.' });
      return;
    }
    const r = await pedirPermissao();
    if (r === 'permitido') {
      ativar(true);
      setMensagem({ texto: 'Pronto! Os avisos chegam às 9h do dia certo, mesmo com o app fechado.' });
    } else if (r === 'negado') {
      setMensagem({ texto: 'O celular não deixou. Permita as notificações do Expo Go nos Ajustes e tente de novo.', erro: true });
    } else {
      setMensagem({ texto: 'Este aparelho não recebe avisos. Abra o app no celular, pelo Expo Go.', erro: true });
    }
  };

  const testar = async () => {
    const r = await pedirPermissao();
    if (r !== 'permitido') {
      setMensagem({ texto: 'Para testar, o celular precisa permitir as notificações do Expo Go.', erro: true });
      return;
    }
    const exemplo = lembretes[0] ?? { titulo: 'Radar de Assinaturas', corpo: 'Assim chega um aviso de cobrança.' };
    await testarAgora(exemplo, SEGUNDOS_DO_TESTE);
    setMensagem({ texto: `Aviso de teste a caminho: chega em ${SEGUNDOS_DO_TESTE} segundos. Pode sair do app para ver.` });
  };

  return (
    <Tela topo={<Voltar />} titulo="Avisos no celular" sobretitulo="Notificações">
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        {`O Radar avisa antes de o dinheiro sair: às ${HORA_DO_AVISO}h, no celular, mesmo com o app fechado.`}
      </Texto>

      <View style={estilos.bloco}>
        <LinhaInterruptor titulo="Receber avisos" descricao={ativados ? 'Ligados' : 'Desligados'} ligado={ativados} aoMudar={ligar} />
        <LinhaInterruptor
          titulo="Um dia antes de cada cobrança"
          descricao="Ex.: “Spotify cobra amanhã: R$ 21,90”"
          ligado={cobranca}
          aoMudar={() => alternar('cobranca')}
          desabilitado={!ativados}
        />
        <LinhaInterruptor
          titulo="Fim de teste grátis"
          descricao="Dois dias antes de virar cobrança"
          ligado={teste}
          aoMudar={() => alternar('teste')}
          desabilitado={!ativados}
        />
        <LinhaInterruptor
          titulo="Lembrar de cobrar quem te deve"
          descricao="Uma semana depois, se ainda não pagou"
          ligado={racha !== false}
          aoMudar={() => alternar('racha')}
          desabilitado={!ativados}
        />
      </View>

      {mensagem && (
        <Texto variante="apoio" cor={mensagem.erro ? cor.perigoSobreFundo : cor.destaqueTexto} accessibilityLiveRegion="polite" style={estilos.mensagem}>
          {mensagem.texto}
        </Texto>
      )}

      <View style={estilos.acao}>
        <Botao icone="paper-plane-outline" rotulo="Testar agora" dica={`Manda um aviso de exemplo em ${SEGUNDOS_DO_TESTE} segundos`} aoTocar={testar} />
      </View>

      <Secao titulo={ativados ? 'Próximos avisos' : 'Os avisos que você receberia'}>
        {lembretes.length === 0 ? (
          <Cartao>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Nenhum aviso nos próximos dias.
            </Texto>
          </Cartao>
        ) : (
          <Lista>
            {lembretes.slice(0, PROXIMOS_NA_TELA).map((l) => (
              <View key={l.id} style={estilos.lembrete} accessible accessibilityLabel={`${quando(l.data)}, ${l.titulo}`}>
                <Ionicons
                  name={l.id.startsWith('teste') ? 'hourglass-outline' : l.id.startsWith('racha') ? 'people-outline' : 'calendar-outline'}
                  size={20}
                  color={cor.destaqueTexto}
                />
                <View style={estilos.flex}>
                  <Texto variante="corpoForte" numberOfLines={2}>
                    {l.titulo}
                  </Texto>
                  <Texto variante="apoio" cor={cor.textoSuave}>
                    {/* A data é a do aviso, não a da cobrança: "cobra amanhã" é o que o aviso vai dizer. */}
                    {`Aviso ${quando(l.data)} · ${dataCurta(l.data)}, ${HORA_DO_AVISO}h`}
                  </Texto>
                </View>
              </View>
            ))}
          </Lista>
        )}
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  bloco: { marginTop: espaco.l },
  mensagem: { marginTop: espaco.m },
  acao: { marginTop: espaco.l },
  lembrete: {
    flexDirection: 'row',
    gap: espaco.m,
    alignItems: 'center',
    minHeight: ALVO_MINIMO + 12,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
  },
  flex: { flex: 1, gap: 2 },
});
