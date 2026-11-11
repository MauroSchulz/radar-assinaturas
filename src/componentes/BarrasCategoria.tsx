import { StyleSheet, View } from 'react-native';
import { porcentagem, dinheiro } from '../dominio/formato';
import type { GastoDaCategoria } from '../dominio/categorias';
import { cor, CORES_DA_CATEGORIA, espaco, NOME_DA_CATEGORIA, raio } from '../tema/tokens';
import { Texto } from './Texto';

/** Altura da barra: fina, como pede o guia de gráficos (a barra não enche a linha). */
const ALTURA = 10;

/**
 * Barras horizontais, da categoria mais cara para a mais barata, numa cor só (a mesma régua para
 * todas): o comprimento é o valor. Nome, valor e porcentagem vêm escritos, então a cor não carrega
 * informação sozinha. O quadradinho ao lado do nome é a cor do avatar da categoria nas listas.
 */
export function BarrasCategoria({ categorias }: { categorias: GastoDaCategoria[] }) {
  const maior = Math.max(1, ...categorias.map((c) => c.mensal));
  return (
    <View style={estilos.lista}>
      {categorias.map((c) => (
        <View
          key={c.categoria}
          style={estilos.linha}
          accessible
          accessibilityLabel={`${NOME_DA_CATEGORIA[c.categoria]}: ${dinheiro(c.mensal)} por mês, ${porcentagem(c.fracao, 0)} do total. ${c.nomes.join(', ')}.`}
        >
          <View style={estilos.topo}>
            <View style={[estilos.marca, { backgroundColor: CORES_DA_CATEGORIA[c.categoria].fundo, borderColor: CORES_DA_CATEGORIA[c.categoria].texto }]} />
            <Texto variante="corpoForte" style={estilos.nome} numberOfLines={1}>
              {NOME_DA_CATEGORIA[c.categoria]}
            </Texto>
            <Texto variante="valor">{dinheiro(c.mensal)}</Texto>
            <Texto variante="apoio" cor={cor.textoSuave} style={estilos.parte}>
              {porcentagem(c.fracao, 0)}
            </Texto>
          </View>
          <View style={estilos.trilho}>
            <View style={[estilos.barra, { width: `${Math.max(2, Math.round((c.mensal / maior) * 100))}%` }]} />
          </View>
          <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={1}>
            {c.nomes.join(' · ')}
          </Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.l, marginTop: espaco.s },
  linha: { gap: espaco.xs },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  marca: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  nome: { flex: 1 },
  parte: { minWidth: 40, textAlign: 'right' },
  trilho: { height: ALTURA, borderRadius: raio.pilula, backgroundColor: cor.superficieSuave, overflow: 'hidden' },
  // Ponta arredondada só no fim, como pede o guia: a base fica reta no começo da régua.
  barra: { height: '100%', borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: cor.barraDestaque },
});
