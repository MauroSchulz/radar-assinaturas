import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { cobrancasDoMes, type CobrancaNoCalendario, type DiaDoCalendario } from '../dominio/calendario';
import { dataLonga, diaDaSemana, hoje } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { ASSINATURAS } from '../estado/extrato';
import { useLoja } from '../estado/loja';
import { abrirAssinatura } from '../estado/navegacao';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOME_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
/** Quantos meses dá para ir para trás e para a frente a partir do mês de hoje. */
const MESES_ANTES = 6;
const MESES_DEPOIS = 3;

const TEXTO_DO_TIPO: Record<CobrancaNoCalendario['tipo'], string> = {
  cobrada: 'Já cobrada',
  prevista: 'Vai cobrar',
  fimDoTeste: 'Fim do teste grátis: começa a cobrar',
};

function corDoTipo(tipo: CobrancaNoCalendario['tipo']): string {
  return tipo === 'cobrada' ? cor.barraNeutra : tipo === 'fimDoTeste' ? cor.alerta : cor.barraDestaque;
}

function somarMes(ano: number, mes: number, n: number): [number, number] {
  const total = ano * 12 + (mes - 1) + n;
  return [Math.floor(total / 12), (total % 12) + 1];
}

/** O dia que abre selecionado: a próxima cobrança a partir de hoje; num mês passado, a primeira dele. */
function diaInicial(dias: DiaDoCalendario[]): string {
  const h = hoje();
  return (
    dias.find((d) => d.data >= h && d.cobrancas.length) ??
    dias.find((d) => d.cobrancas.length) ??
    dias.find((d) => d.data === h) ??
    dias[0]
  ).data;
}

/** Calendário do mês: em que dia cada assinatura cobra, o que já saiu e o que ainda vai sair. */
export function Calendario() {
  const decisoes = useLoja((s) => s.decisoes);
  const [anoHoje, mesHoje] = hoje().split('-').map(Number);
  const [deslocamento, setDeslocamento] = useState(0);
  const [ano, mes] = somarMes(anoHoje, mesHoje, deslocamento);
  const doMes = useMemo(() => cobrancasDoMes(ASSINATURAS, decisoes, ano, mes, hoje()), [decisoes, ano, mes]);
  const [selecionado, setSelecionado] = useState(() => diaInicial(doMes.dias));
  const dia = doMes.dias.find((d) => d.data === selecionado) ?? doMes.dias[0];
  const nomeDoMes = `${doMes.nome.replace(/^./, (l) => l.toUpperCase())} de ${ano}`;

  const mudarMes = (n: number) => {
    const novo = deslocamento + n;
    setDeslocamento(novo);
    const [a, m] = somarMes(anoHoje, mesHoje, novo);
    setSelecionado(diaInicial(cobrancasDoMes(ASSINATURAS, decisoes, a, m, hoje()).dias));
  };

  return (
    <Tela topo={<Voltar />} titulo="Calendário" sobretitulo="Cobranças das assinaturas">
      <View style={estilos.navegaMes}>
        <Pressable
          onPress={() => mudarMes(-1)}
          disabled={deslocamento <= -MESES_ANTES}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={[estilos.seta, deslocamento <= -MESES_ANTES && estilos.desabilitado]}
        >
          <Ionicons name="chevron-back" size={24} color={cor.destaqueTexto} />
        </Pressable>
        <Texto variante="subtitulo" accessibilityRole="header" accessibilityLiveRegion="polite">
          {nomeDoMes}
        </Texto>
        <Pressable
          onPress={() => mudarMes(1)}
          disabled={deslocamento >= MESES_DEPOIS}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={[estilos.seta, deslocamento >= MESES_DEPOIS && estilos.desabilitado]}
        >
          <Ionicons name="chevron-forward" size={24} color={cor.destaqueTexto} />
        </Pressable>
      </View>

      <View style={estilos.resumo} accessible accessibilityLabel={`${nomeDoMes}: ${dinheiro(doMes.total)} em ${doMes.quantas} cobranças. Já saiu ${dinheiro(doMes.jaCobrado)}, ainda vai sair ${dinheiro(doMes.aCobrar)}.`}>
        <Texto variante="valorGrande">{dinheiro(doMes.total)}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`${doMes.quantas} ${doMes.quantas === 1 ? 'cobrança' : 'cobranças'} · já saiu ${dinheiro(doMes.jaCobrado)} · vai sair ${dinheiro(doMes.aCobrar)}`}
        </Texto>
      </View>

      <View style={estilos.grade}>
        <View style={estilos.linha}>
          {SEMANA.map((l, i) => (
            <Texto key={i} variante="legenda" cor={cor.textoSuave} style={estilos.cabecalho} importantForAccessibility="no">
              {l}
            </Texto>
          ))}
        </View>
        {doMes.semanas.map((semana, i) => (
          <View key={i} style={estilos.linha}>
            {semana.map((d, j) =>
              d ? (
                <Pressable
                  key={d.data}
                  onPress={() => setSelecionado(d.data)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: d.data === dia.data }}
                  accessibilityLabel={`${d.dia} de ${doMes.nome}, ${NOME_DA_SEMANA[j]}${d.data === hoje() ? ', hoje' : ''}: ${
                    d.cobrancas.length ? `${d.cobrancas.length} ${d.cobrancas.length === 1 ? 'cobrança' : 'cobranças'}, ${dinheiro(d.total)}` : 'sem cobrança'
                  }`}
                  style={estilos.celula}
                >
                  <View style={[estilos.numero, d.data === hoje() && estilos.hoje, d.data === dia.data && estilos.escolhido]}>
                    <Texto variante={d.cobrancas.length ? 'corpoForte' : 'corpo'} cor={d.data === dia.data ? cor.sobreDestaque : cor.texto}>
                      {String(d.dia)}
                    </Texto>
                  </View>
                  <View style={estilos.pontos}>
                    {d.cobrancas.slice(0, 3).map((c, k) => (
                      <View key={k} style={[estilos.ponto, { backgroundColor: corDoTipo(c.tipo) }]} />
                    ))}
                  </View>
                </Pressable>
              ) : (
                <View key={`v${j}`} style={estilos.celula} />
              ),
            )}
          </View>
        ))}
      </View>

      <View style={estilos.legenda} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {(['cobrada', 'prevista', 'fimDoTeste'] as const).map((t) => (
          <View key={t} style={estilos.itemLegenda}>
            <View style={[estilos.ponto, { backgroundColor: corDoTipo(t) }]} />
            <Texto variante="legenda" cor={cor.textoSuave}>
              {t === 'cobrada' ? 'Já cobrada' : t === 'prevista' ? 'Vai cobrar' : 'Fim de teste grátis'}
            </Texto>
          </View>
        ))}
      </View>

      <Secao titulo={`${diaDaSemana(dia.data).replace(/^./, (l) => l.toUpperCase())}, ${dataLonga(dia.data)}`}>
        {dia.cobrancas.length === 0 ? (
          <Texto variante="apoio" cor={cor.textoSuave}>
            Nenhuma cobrança neste dia.
          </Texto>
        ) : (
          <Lista>
            {dia.cobrancas.map((c, i) => (
              <Pressable
                key={`${c.assinaturaId}${i}`}
                onPress={() => abrirAssinatura(c.assinaturaId)}
                accessibilityRole="button"
                accessibilityLabel={`${c.nome}, ${dinheiro(c.valor)}, ${TEXTO_DO_TIPO[c.tipo]}${c.vaiCancelar ? ', marcada para cancelar' : ''}`}
                style={({ pressed }) => [estilos.cobranca, pressed && estilos.pressionada]}
              >
                <Avatar nome={c.nome} categoria={c.categoria} />
                <View style={estilos.meio}>
                  <Texto variante="corpoForte">{c.nome}</Texto>
                  <Texto variante="apoio" cor={c.tipo === 'fimDoTeste' ? cor.alerta : cor.textoSuave}>
                    {`${TEXTO_DO_TIPO[c.tipo]}${c.vaiCancelar ? ' · você marcou para cancelar' : ''}`}
                  </Texto>
                </View>
                <Texto variante="valor">{dinheiro(c.valor)}</Texto>
              </Pressable>
            ))}
          </Lista>
        )}
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  navegaMes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seta: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
  desabilitado: { opacity: 0.3 },
  resumo: { marginTop: espaco.s, gap: 2 },
  grade: { marginTop: espaco.l, gap: 2 },
  linha: { flexDirection: 'row' },
  cabecalho: { flex: 1, textAlign: 'center', paddingVertical: espaco.xs },
  celula: { flex: 1, alignItems: 'center', minHeight: ALVO_MINIMO + 8, paddingVertical: 2 },
  numero: { width: 36, height: 36, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  hoje: { borderWidth: 1.5, borderColor: cor.destaqueTexto },
  escolhido: { backgroundColor: cor.destaque, borderWidth: 0 },
  pontos: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center' },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.l, marginTop: espaco.m },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  cobranca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 16,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  meio: { flex: 1, gap: 2 },
});
