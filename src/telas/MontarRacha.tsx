import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataLonga } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { dividir, type OrigemRacha } from '../dominio/racha';
import { ASSINATURAS } from '../estado/extrato';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco, raio, tipo } from '../tema/tokens';

export function MontarRacha({ titulo, origem }: { titulo: string; origem: OrigemRacha }) {
  const pessoas = useRachas((s) => s.pessoas);
  const adicionarPessoa = useRachas((s) => s.adicionarPessoa);
  const criarRacha = useRachas((s) => s.criarRacha);
  const concluir = useNavegacao((s) => s.concluir);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [incluiVoce, setIncluiVoce] = useState(true);
  const [novoNome, setNovoNome] = useState('');

  const assinatura = origem.tipo === 'assinatura' ? ASSINATURAS.find((a) => a.id === origem.assinaturaId) : undefined;
  const valor = origem.tipo === 'compra' ? origem.valor : (assinatura?.valorAtual ?? 0);
  const { suaParte, partes } = dividir(valor, marcadas.length, incluiVoce);
  const alternar = (id: string) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const adicionar = () => {
    if (!novoNome.trim()) return;
    const pessoa = adicionarPessoa(novoNome);
    setMarcadas((m) => (m.includes(pessoa.id) ? m : [...m, pessoa.id]));
    setNovoNome('');
  };

  const criar = () => {
    const id = criarRacha({ titulo, pessoas: marcadas, incluiVoce, origem });
    concluir('rachar', [{ nome: 'racha', id }]);
  };

  return (
    <Tela
      topo={<Voltar />}
      titulo={titulo}
      sobretitulo={
        origem.tipo === 'compra'
          ? `${dinheiro(valor)} em ${dataLonga(origem.data)}`
          : `${dinheiro(valor)} por mês · divide toda cobrança daqui pra frente`
      }
    >
      <Secao titulo="Quem entra na divisão?">
        <View style={estilos.fichas}>
          <Ficha rotulo="Você" marcada={incluiVoce} aoTocar={() => setIncluiVoce((v) => !v)} />
          {pessoas.map((p) => (
            <Ficha key={p.id} rotulo={p.nome} marcada={marcadas.includes(p.id)} aoTocar={() => alternar(p.id)} />
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
      </Secao>

      <Secao titulo="Como fica">
        {marcadas.length === 0 ? (
          <Cartao>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Marque pelo menos um amigo para ver a parte de cada um.
            </Texto>
          </Cartao>
        ) : (
          <Lista recuo={espaco.l}>
            {incluiVoce && <LinhaParte nome="Você" valor={suaParte} />}
            {marcadas.map((id, i) => (
              <LinhaParte key={id} nome={pessoas.find((p) => p.id === id)?.nome ?? '?'} valor={partes[i]} />
            ))}
          </Lista>
        )}
        {incluiVoce && marcadas.length > 0 && valor % (marcadas.length + 1) !== 0 && (
          <Texto variante="apoio" cor={cor.textoSobreFundo}>
            Os centavos que sobram da divisão ficam com você.
          </Texto>
        )}
      </Secao>

      <View style={estilos.acao}>
        <Botao
          variante="primario"
          rotulo="Criar racha"
          aoTocar={criar}
          desabilitado={marcadas.length === 0}
          dica={marcadas.length === 0 ? 'Marque pelo menos um amigo' : undefined}
        />
      </View>
    </Tela>
  );
}

function LinhaParte({ nome, valor }: { nome: string; valor: number }) {
  return (
    <View style={estilos.parte}>
      <Texto variante="corpo" style={estilos.parteNome}>
        {nome}
      </Texto>
      <Texto variante="valor">{dinheiro(valor)}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
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
  parte: { flexDirection: 'row', alignItems: 'center', minHeight: ALVO_MINIMO + 4, paddingHorizontal: espaco.l },
  parteNome: { flex: 1 },
  acao: { marginTop: espaco.xl },
});
