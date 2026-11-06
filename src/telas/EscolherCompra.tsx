import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta } from '../dominio/datas';
import { dinheiro, POR_PERIODO } from '../dominio/formato';
import { rachaDaAssinatura, type OrigemRacha } from '../dominio/racha';
import type { Categoria } from '../dominio/tipos';
import { ASSINATURAS, COMPRAS_RECENTES } from '../estado/extrato';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

interface Opcao {
  chave: string;
  titulo: string;
  legenda: string;
  valor: string;
  categoria: Categoria;
  origem: OrigemRacha;
}

function LinhaOpcao({ opcao, aoTocar }: { opcao: Opcao; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${opcao.titulo}, ${opcao.legenda}, ${opcao.valor}`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <Avatar nome={opcao.titulo} categoria={opcao.categoria} />
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {opcao.titulo}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {opcao.legenda}
        </Texto>
      </View>
      <Texto variante="valor">{opcao.valor}</Texto>
    </Pressable>
  );
}

export function EscolherCompra() {
  const rachas = useRachas((s) => s.rachas);
  const ir = useNavegacao((s) => s.ir);

  const jaRachadas = new Set(rachas.flatMap((r) => (r.origem.tipo === 'compra' ? [r.origem.transacaoId] : [])));
  const assinaturas: Opcao[] = ASSINATURAS.filter((a) => a.situacao === 'ativa' && !rachaDaAssinatura(a.id, rachas)).map((a) => ({
    chave: a.id,
    titulo: a.nome,
    legenda: 'Divide todo mês',
    valor: `${dinheiro(a.valorAtual)} ${POR_PERIODO[a.periodo]}`,
    categoria: a.categoria,
    origem: { tipo: 'assinatura', assinaturaId: a.id, desde: a.ultimaCobranca! },
  }));
  const compras: Opcao[] = COMPRAS_RECENTES.filter((t) => !jaRachadas.has(t.id)).map((t) => ({
    chave: t.id,
    titulo: t.nome,
    legenda: dataCurta(t.data),
    valor: dinheiro(t.valor),
    categoria: 'compras',
    origem: { tipo: 'compra', transacaoId: t.id, descricao: t.descricao, data: t.data, valor: t.valor },
  }));
  const escolher = (o: Opcao) => ir({ nome: 'montarRacha', titulo: o.titulo, origem: o.origem });

  return (
    <Tela topo={<Voltar />} titulo="O que vamos rachar?" sobretitulo="Escolha no seu extrato">
      {compras.length > 0 && (
        <Secao titulo="Compras dos últimos 30 dias">
          <Lista>
            {compras.map((o) => (
              <LinhaOpcao key={o.chave} opcao={o} aoTocar={() => escolher(o)} />
            ))}
          </Lista>
        </Secao>
      )}
      {assinaturas.length > 0 && (
        <Secao titulo="Assinaturas">
          <Lista>
            {assinaturas.map((o) => (
              <LinhaOpcao key={o.chave} opcao={o} aoTocar={() => escolher(o)} />
            ))}
          </Lista>
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  meio: { flex: 1, gap: 2 },
});
