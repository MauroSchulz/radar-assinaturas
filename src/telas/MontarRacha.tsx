import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataLonga } from '../dominio/datas';
import { dinheiro, lerValor } from '../dominio/formato';
import { dividirPor, erroDaDivisao, VOCE, type Divisao, type ModoDeDivisao, type OrigemRacha } from '../dominio/racha';
import { ASSINATURAS } from '../estado/extrato';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { vibrarSucesso } from '../servicos/vibracao';
import { ALVO_MINIMO, cor, espaco, raio, tipo } from '../tema/tokens';

const NOME_DO_MODO: Record<ModoDeDivisao, string> = { igual: 'Igual', valor: 'Por valor', partes: 'Por partes' };
const DICA_DO_MODO: Record<ModoDeDivisao, string> = {
  igual: 'Todo mundo paga o mesmo.',
  valor: 'Cada um paga um valor: quem pediu mais, paga mais. Tem que fechar o total.',
  partes: 'Quem levou acompanhante ou comeu em dobro conta 2 partes.',
};

/**
 * Montar o racha: quem entra, quem pagou (você, ou um amigo, numa despesa fora do seu cartão)
 * e como dividir (igual, por valor ou por partes).
 */
export function MontarRacha({ titulo, origem, pagouId }: { titulo: string; origem: OrigemRacha; pagouId?: string }) {
  const pessoas = useRachas((s) => s.pessoas);
  const adicionarPessoa = useRachas((s) => s.adicionarPessoa);
  const criarRacha = useRachas((s) => s.criarRacha);
  const concluir = useNavegacao((s) => s.concluir);
  // Quem pagou já entra na divisão.
  const [marcadas, setMarcadas] = useState<string[]>(pagouId ? [pagouId] : []);
  const [incluiVoce, setIncluiVoce] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [modo, setModo] = useState<ModoDeDivisao>('igual');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [partes, setPartes] = useState<Record<string, number>>({});

  const assinatura = origem.tipo === 'assinatura' ? ASSINATURAS.find((a) => a.id === origem.assinaturaId) : undefined;
  const valor = origem.tipo === 'assinatura' ? (assinatura?.valorAtual ?? 0) : origem.valor;
  const pagador = pagouId ? pessoas.find((p) => p.id === pagouId) : undefined;
  // Valor fixo por pessoa não serve para assinatura: o preço muda e a conta deixaria de fechar.
  const modos: ModoDeDivisao[] = origem.tipo === 'assinatura' ? ['igual', 'partes'] : ['igual', 'valor', 'partes'];

  const divisao: Divisao =
    modo === 'valor'
      ? { modo, valores: Object.fromEntries(Object.entries(valores).map(([id, t]) => [id, lerValor(t) ?? 0])) }
      : modo === 'partes'
        ? { modo, partes }
        : { modo };
  const erro = marcadas.length ? erroDaDivisao(valor, marcadas, incluiVoce, divisao) : null;
  const { suaParte, partes: valoresDasPartes } = dividirPor(valor, marcadas, incluiVoce, divisao);
  const alternar = (id: string) => {
    if (id === pagouId) return; // quem pagou não sai da divisão
    setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };
  const nomeDe = (id: string) => (id === VOCE ? 'Você' : (pessoas.find((p) => p.id === id)?.nome ?? '?'));
  const participantes = [...(incluiVoce ? [VOCE] : []), ...marcadas];
  const valorDe = (id: string) => (id === VOCE ? suaParte : (valoresDasPartes[marcadas.indexOf(id)] ?? 0));

  const adicionar = () => {
    if (!novoNome.trim()) return;
    const pessoa = adicionarPessoa(novoNome);
    setMarcadas((m) => (m.includes(pessoa.id) ? m : [...m, pessoa.id]));
    setNovoNome('');
  };

  const podeCriar = marcadas.length > 0 && !erro && (!pagouId || incluiVoce);
  const criar = () => {
    if (!podeCriar) return;
    const id = criarRacha({
      titulo,
      pessoas: marcadas,
      incluiVoce,
      origem,
      ...(modo !== 'igual' ? { divisao } : {}),
      ...(pagouId ? { pagouId } : {}),
    });
    vibrarSucesso();
    concluir('rachar', [{ nome: 'racha', id }]);
  };

  return (
    <Tela
      topo={<Voltar />}
      titulo={titulo}
      sobretitulo={
        origem.tipo === 'assinatura'
          ? `${dinheiro(valor)} por mês · divide toda cobrança daqui pra frente`
          : `${dinheiro(valor)} em ${dataLonga(origem.data)}${pagador ? ` · ${pagador.nome} pagou` : ''}`
      }
    >
      <Secao titulo="Quem entra na divisão?">
        <View style={estilos.fichas}>
          <Ficha rotulo="Você" marcada={incluiVoce} aoTocar={() => setIncluiVoce((v) => !v)} />
          {pessoas.map((p) => (
            <Ficha key={p.id} rotulo={p.id === pagouId ? `${p.nome} (pagou)` : p.nome} marcada={marcadas.includes(p.id)} aoTocar={() => alternar(p.id)} />
          ))}
        </View>
        <View style={estilos.novaPessoa}>
          <TextInput
            value={novoNome}
            onChangeText={setNovoNome}
            onSubmitEditing={adicionar}
            placeholder="Nome de mais alguém"
            placeholderTextColor={cor.textoSuave}
            accessibilityLabel="Nome de mais alguém"
            returnKeyType="done"
            style={estilos.entrada}
          />
          <Botao rotulo="Adicionar" aoTocar={adicionar} desabilitado={!novoNome.trim()} />
        </View>
        {pagouId && !incluiVoce && (
          <Texto variante="apoio" cor={cor.perigoSobreFundo}>
            {`Se você não entra, não deve nada a ${pagador?.nome ?? 'quem pagou'}: marque “Você”.`}
          </Texto>
        )}
      </Secao>

      <Secao titulo="Como dividir">
        <View style={estilos.fichas} accessibilityRole="radiogroup">
          {modos.map((m) => (
            <Ficha key={m} papel="radio" rotulo={NOME_DO_MODO[m]} marcada={modo === m} aoTocar={() => setModo(m)} />
          ))}
        </View>
        <Texto variante="apoio" cor={cor.textoSuave} style={estilos.dica}>
          {DICA_DO_MODO[modo]}
        </Texto>

        {marcadas.length === 0 ? (
          <Cartao>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Marque pelo menos um amigo para ver a parte de cada um.
            </Texto>
          </Cartao>
        ) : (
          <Lista recuo={espaco.l}>
            {participantes.map((id) => (
              <View key={id} style={estilos.parte}>
                <Texto variante="corpo" style={estilos.parteNome}>
                  {nomeDe(id)}
                </Texto>
                {modo === 'valor' ? (
                  <TextInput
                    value={valores[id] ?? ''}
                    onChangeText={(t) => setValores((v) => ({ ...v, [id]: t }))}
                    placeholder="0,00"
                    placeholderTextColor={cor.textoSuave}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`Valor de ${nomeDe(id)}`}
                    style={[estilos.entrada, estilos.entradaValor]}
                  />
                ) : modo === 'partes' ? (
                  <View style={estilos.contador}>
                    <Pressable
                      onPress={() => setPartes((p) => ({ ...p, [id]: Math.max(1, (p[id] ?? 1) - 1) }))}
                      accessibilityRole="button"
                      accessibilityLabel={`Menos uma parte para ${nomeDe(id)}`}
                      style={estilos.botaoContador}
                    >
                      <Ionicons name="remove" size={18} color={cor.texto} />
                    </Pressable>
                    <Texto variante="corpoForte" style={estilos.numeroPartes} accessibilityLabel={`${nomeDe(id)}: ${partes[id] ?? 1} partes`}>
                      {String(partes[id] ?? 1)}
                    </Texto>
                    <Pressable
                      onPress={() => setPartes((p) => ({ ...p, [id]: (p[id] ?? 1) + 1 }))}
                      accessibilityRole="button"
                      accessibilityLabel={`Mais uma parte para ${nomeDe(id)}`}
                      style={estilos.botaoContador}
                    >
                      <Ionicons name="add" size={18} color={cor.texto} />
                    </Pressable>
                    <Texto variante="valor" style={estilos.valorParte}>
                      {dinheiro(valorDe(id))}
                    </Texto>
                  </View>
                ) : (
                  <Texto variante="valor">{dinheiro(valorDe(id))}</Texto>
                )}
              </View>
            ))}
          </Lista>
        )}
        {erro ? (
          <Texto variante="apoio" cor={cor.perigoSobreFundo} accessibilityLiveRegion="polite">
            {erro}
          </Texto>
        ) : modo === 'valor' && marcadas.length > 0 ? (
          <Texto variante="apoio" cor={cor.destaqueTexto}>
            {`Fechou certinho: ${dinheiro(valor)}.`}
          </Texto>
        ) : modo === 'igual' && incluiVoce && marcadas.length > 0 && valor % (marcadas.length + 1) !== 0 ? (
          <Texto variante="apoio" cor={cor.textoSobreFundo}>
            Os centavos que sobram da divisão ficam com você.
          </Texto>
        ) : null}
        {pagador && incluiVoce && marcadas.length > 0 && !erro && (
          <Cartao destaque style={estilos.resumoDivida}>
            <Texto variante="corpo">
              {`Você vai dever `}
              <Texto variante="valor">{dinheiro(suaParte)}</Texto>
              {` a ${pagador.nome}.`}
            </Texto>
          </Cartao>
        )}
      </Secao>

      <View style={estilos.acao}>
        <Botao
          variante="primario"
          rotulo="Criar racha"
          aoTocar={criar}
          desabilitado={!podeCriar}
          dica={marcadas.length === 0 ? 'Marque pelo menos um amigo' : (erro ?? undefined)}
        />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  dica: { marginTop: espaco.s },
  novaPessoa: { flexDirection: 'row', gap: espaco.s, marginTop: espaco.s },
  entrada: {
    ...tipo.corpo,
    flex: 1,
    color: cor.texto,
    minHeight: ALVO_MINIMO + 4,
    paddingHorizontal: espaco.m,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
  },
  entradaValor: { flex: 0, width: 120, textAlign: 'right' },
  parte: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, minHeight: ALVO_MINIMO + 8, paddingHorizontal: espaco.l, paddingVertical: espaco.xs },
  parteNome: { flex: 1 },
  contador: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  botaoContador: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cor.superficie,
    borderWidth: 1,
    borderColor: cor.borda,
  },
  numeroPartes: { minWidth: 20, textAlign: 'center' },
  valorParte: { minWidth: 88, textAlign: 'right' },
  resumoDivida: { marginTop: espaco.m },
  acao: { marginTop: espaco.xl },
});
