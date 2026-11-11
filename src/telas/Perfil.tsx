import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ComponentProps } from 'react';
import { DevSettings, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Ficha } from '../componentes/Ficha';
import { Cartao, Secao } from '../componentes/Cartao';
import { FotoPerfil } from '../componentes/FotoPerfil';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { useAvisos } from '../estado/avisos';
import { useNavegacao, type Rota } from '../estado/navegacao';
import { usePerfil } from '../estado/perfil';
import { useRachas } from '../estado/rachas';
import { recomecarDemonstracao } from '../estado/recomecar';
import { CHAVE_DO_TEMA, preferenciaDeTema, type PreferenciaDeTema } from '../tema/preferencia';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

type Icone = ComponentProps<typeof Ionicons>['name'];

const OPCOES_DE_TEMA: { valor: PreferenciaDeTema; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Seguir o celular' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

/** Recarrega o app para as cores novas entrarem (elas são calculadas quando o app abre). */
function recarregar(): void {
  try {
    if (Platform.OS === 'web') globalThis.location?.reload();
    else DevSettings.reload();
  } catch {
    // Sem como recarregar (ex.: nos testes): a cor nova entra na próxima vez que abrir.
  }
}

function LinhaAjuste({ icone, titulo, detalhe, rota }: { icone: Icone; titulo: string; detalhe: string; rota: Rota }) {
  const ir = useNavegacao((s) => s.ir);
  return (
    <Pressable
      onPress={() => ir(rota)}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}, ${detalhe}`}
      style={({ pressed }) => [estilos.ajuste, pressed && estilos.pressionada]}
    >
      <View style={estilos.icone}>
        <Ionicons name={icone} size={20} color={cor.destaqueTexto} />
      </View>
      <View style={estilos.meio}>
        <Texto variante="corpoForte">{titulo}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {detalhe}
        </Texto>
      </View>
      <Ionicons name="chevron-forward" size={20} color={cor.textoSuave} />
    </Pressable>
  );
}

/** Perfil: foto, nome e os ajustes (bancos, avisos no celular, como você recebe). */
export function Perfil() {
  const nome = usePerfil((s) => s.nome);
  const foto = usePerfil((s) => s.foto);
  const conexoes = usePerfil((s) => s.conexoes);
  const salvarNome = usePerfil((s) => s.salvarNome);
  const trocarFoto = usePerfil((s) => s.trocarFoto);
  const removerFoto = usePerfil((s) => s.removerFoto);
  const usarFotoPadrao = usePerfil((s) => s.usarFotoPadrao);
  const avisosLigados = useAvisos((s) => s.ativados);
  const chavePix = useRachas((s) => s.pix.chave);
  // Rascunho local do nome: só vai para a loja ao salvar.
  const [rascunho, setRascunho] = useState(nome);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [tema, setTema] = useState<PreferenciaDeTema>(preferenciaDeTema());

  const escolherTema = async (valor: PreferenciaDeTema) => {
    if (valor === tema) return;
    setTema(valor);
    await AsyncStorage.setItem(CHAVE_DO_TEMA, valor);
    setAviso('Trocando as cores…');
    recarregar();
  };
  const mudouNome = rascunho.trim() !== nome && rascunho.trim() !== '';

  const escolherFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled && r.assets[0]) {
      trocarFoto(r.assets[0].uri);
      setAviso('Foto trocada.');
    }
  };

  return (
    <Tela topo={<Voltar />}>
      <View style={estilos.topo}>
        <FotoPerfil tamanho={112} />
        <Texto variante="subtitulo" accessibilityRole="header">
          {nome || 'Seu perfil'}
        </Texto>
        <View style={estilos.botoesFoto}>
          <Botao compacto icone="images-outline" rotulo="Trocar foto" aoTocar={escolherFoto} />
          {foto.tipo === 'nenhuma' ? (
            <Botao compacto variante="link" rotulo="Usar a foto de antes" aoTocar={usarFotoPadrao} />
          ) : (
            <Botao compacto variante="link" rotulo="Remover foto" aoTocar={removerFoto} />
          )}
        </View>
        {aviso && (
          <Texto variante="apoio" cor={cor.destaqueTexto} accessibilityLiveRegion="polite">
            {aviso}
          </Texto>
        )}
      </View>

      <Secao titulo="Seus dados">
        <View style={estilos.campos}>
          <CampoTexto rotulo="Nome" value={rascunho} onChangeText={setRascunho} placeholder="Como quer ser chamado" ajuda="O primeiro nome aparece no “Olá” do Início." />
          {mudouNome && (
            <Botao
              variante="primario"
              rotulo="Salvar nome"
              aoTocar={() => {
                salvarNome(rascunho);
                setAviso('Nome salvo.');
              }}
            />
          )}
        </View>
      </Secao>

      <Secao titulo="Ajustes">
        <Lista>
          <LinhaAjuste
            icone="business-outline"
            titulo="Bancos conectados"
            detalhe={conexoes.length === 0 ? 'Nenhum ainda · demonstração' : `${conexoes.length} ${conexoes.length === 1 ? 'banco' : 'bancos'} · demonstração`}
            rota={{ nome: 'bancos' }}
          />
          <LinhaAjuste
            icone="notifications-outline"
            titulo="Avisos no celular"
            detalhe={avisosLigados ? 'Ligados' : 'Desligados'}
            rota={{ nome: 'notificacoes' }}
          />
          <LinhaAjuste
            icone="key-outline"
            titulo="Como você recebe"
            detalhe={chavePix ? 'Chave Pix cadastrada' : 'Cadastre sua chave Pix'}
            rota={{ nome: 'seuPix' }}
          />
        </Lista>
      </Secao>

      <Secao titulo="Aparência">
        <View style={estilos.fichas} accessibilityRole="radiogroup">
          {OPCOES_DE_TEMA.map((o) => (
            <Ficha key={o.valor} papel="radio" rotulo={o.rotulo} marcada={tema === o.valor} aoTocar={() => escolherTema(o.valor)} />
          ))}
        </View>
        <Texto variante="apoio" cor={cor.textoSuave} style={estilos.notaTema}>
          O app reinicia rapidinho para trocar as cores.
        </Texto>
      </Secao>

      <Secao titulo="Demonstração">
        {confirmando ? (
          <Cartao destaque style={estilos.confirmar}>
            <Texto variante="corpo">
              Isso apaga o que você fez no app (Pix enviados, rachas, caixinhas, bancos conectados e avisos) e volta tudo
              para o começo, com as boas-vindas de novo.
            </Texto>
            <View style={estilos.botoesConfirmar}>
              <Botao variante="primario" icone="refresh" rotulo="Sim, recomeçar" aoTocar={() => recomecarDemonstracao()} />
              <Botao variante="link" rotulo="Cancelar" aoTocar={() => setConfirmando(false)} />
            </View>
          </Cartao>
        ) : (
          <View style={estilos.campos}>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Antes de apresentar, volte o app para como ele estava na primeira vez.
            </Texto>
            <Botao icone="refresh" rotulo="Recomeçar demonstração" aoTocar={() => setConfirmando(true)} />
          </View>
        )}
      </Secao>

      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.rodape}>
        Dados de demonstração. Tudo fica salvo só neste celular.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { alignItems: 'center', gap: espaco.s, marginTop: espaco.s },
  botoesFoto: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, marginTop: espaco.xs },
  campos: { gap: espaco.m, marginTop: espaco.s },
  ajuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 16,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  icone: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: cor.destaqueSuave },
  meio: { flex: 1, gap: 2 },
  rodape: { marginTop: espaco.xl, textAlign: 'center' },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  notaTema: { marginTop: espaco.s },
  confirmar: { gap: espaco.m, marginTop: espaco.s },
  botoesConfirmar: { gap: espaco.s },
});
