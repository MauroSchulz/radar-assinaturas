import { Pressable, StyleSheet, View } from 'react-native';
import { dinheiro, dinheiroCurto } from '../dominio/formato';
import type { GastoDoMes } from '../dominio/gastos';
import { cor, espaco } from '../tema/tokens';
import { Texto } from './Texto';

/** Altura da área das colunas. */
const ALTURA = 132;
/** Colunas finas: nunca ocupam o espaço inteiro do mês, o resto é respiro. */
const LARGURA_DA_COLUNA = 16;
/** Espaço em cima para o rótulo do valor do mês que mais gastou. */
const ESPACO_DO_ROTULO = 22;
const LARGURA_DO_ROTULO = 72;

interface Props {
  meses: GastoDoMes[];
  /** O mês em destaque (1 a 12): a coluna verde. As outras ficam cinza. */
  selecionado: number;
  /** O mês que mais gastou: o único com o valor escrito em cima. */
  maior: number | null;
  aoSelecionar: (mes: number) => void;
  /** Esconde os valores escritos (o "olho" do Início); as colunas continuam. */
  ocultar?: boolean;
}

/**
 * Colunas de gasto por mês, de janeiro a dezembro. Uma cor só para todas (cinza) e o mês
 * escolhido em verde. Tocar numa coluna escolhe o mês. Cada coluna é um botão com o nome do mês
 * e o valor para o leitor de tela; os meses que ainda não chegaram ficam sem coluna.
 */
export function GraficoMeses({ meses, selecionado, maior, aoSelecionar, ocultar }: Props) {
  const topo = Math.max(1, ...meses.map((m) => m.total));
  return (
    <View style={estilos.grafico}>
      {meses.map((m) => {
        const futuro = m.situacao === 'futuro';
        const altura = m.total > 0 ? Math.max(3, Math.round((m.total / topo) * ALTURA)) : 0;
        const escolhido = m.mes === selecionado;
        const ehMaior = m.mes === maior;
        const nome = m.nome.replace(/^./, (l) => l.toUpperCase());
        const rotulo = futuro
          ? `${nome}: ainda não chegou`
          : `${nome}: ${ocultar ? 'valor escondido' : dinheiro(m.total)}${m.situacao === 'atual' ? ', até hoje' : ''}${ehMaior ? ', o mês que mais gastou' : ''}`;
        return (
          <Pressable
            key={m.mes}
            onPress={() => aoSelecionar(m.mes)}
            disabled={futuro}
            accessibilityRole="button"
            accessibilityLabel={rotulo}
            accessibilityState={{ selected: escolhido, disabled: futuro }}
            style={estilos.mes}
          >
            <View style={estilos.area}>
              {ehMaior && !ocultar && (
                // Mais largo que a coluna do mês: o rótulo passa por cima do respiro dos vizinhos.
                <Texto variante="legenda" cor={cor.texto} style={estilos.valor}>
                  {dinheiroCurto(m.total).replace(/^R\$\s/, '')}
                </Texto>
              )}
              {altura > 0 && (
                <View style={[estilos.coluna, { height: altura, backgroundColor: escolhido ? cor.barraDestaque : cor.barraNeutra }]} />
              )}
            </View>
            <View style={estilos.base} />
            <Texto variante="legenda" cor={escolhido ? cor.texto : cor.textoSuave} style={[estilos.nome, !escolhido && estilos.nomeLeve]}>
              {m.nome.slice(0, 3)}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grafico: { flexDirection: 'row', marginTop: espaco.m },
  // A área de toque é a coluna do mês inteira, bem maior que a barra.
  mes: { flex: 1, alignItems: 'center' },
  area: { height: ALTURA + ESPACO_DO_ROTULO, justifyContent: 'flex-end', alignItems: 'center', alignSelf: 'stretch' },
  // Ponta de cima arredondada (4px) e quadrada na base.
  coluna: { width: LARGURA_DA_COLUNA, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  // Centralizado na coluna e mais largo que ela (alignItems: center deixa transbordar igual dos dois lados).
  valor: { width: LARGURA_DO_ROTULO, marginBottom: 4, textAlign: 'center', fontVariant: ['tabular-nums'] },
  base: { alignSelf: 'stretch', height: 1, backgroundColor: cor.borda },
  nome: { marginTop: espaco.xs, fontSize: 11 },
  nomeLeve: { fontWeight: '400' },
});
