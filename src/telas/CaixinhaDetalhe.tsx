import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarraProgresso } from '../componentes/BarraProgresso';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Cartao, Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta, dataLonga } from '../dominio/datas';
import { dinheiro, lerValor, porcentagem } from '../dominio/formato';
import { aporteMensalAtual, extratoDaCaixinha, mesesParaMeta, saldoDaCaixinha } from '../dominio/investimentos';
import { useInvestimentos } from '../estado/investimentos';
import { useNavegacao } from '../estado/navegacao';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

export function CaixinhaDetalhe({ id }: { id: string }) {
  const caixinha = useInvestimentos((s) => s.caixinhas.find((c) => c.id === id));
  const guardar = useInvestimentos((s) => s.guardar);
  const resgatar = useInvestimentos((s) => s.resgatar);
  const pararDeGuardarTodoMes = useInvestimentos((s) => s.pararDeGuardarTodoMes);
  const apagar = useInvestimentos((s) => s.apagar);
  const voltar = useNavegacao((s) => s.voltar);
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  if (!caixinha) return null;

  const { saldo, guardado, rendimento } = saldoDaCaixinha(caixinha);
  const mensal = aporteMensalAtual(caixinha);
  const extrato = extratoDaCaixinha(caixinha);
  const fracao = caixinha.meta ? saldo / caixinha.meta : 0;
  const faltam = caixinha.meta ? mesesParaMeta(caixinha.meta, mensal, saldo) : null;

  const movimentar = (tipo: 'guardar' | 'resgatar') => {
    const centavos = lerValor(valor);
    setAviso(null);
    if (centavos === null) return setErro('Escreva só o valor, por exemplo 150 ou 44,90.');
    if (tipo === 'resgatar' && centavos > saldo) return setErro(`Dá para resgatar até ${dinheiro(saldo)}.`);
    setErro(null);
    if (tipo === 'guardar') guardar(caixinha.id, centavos);
    else resgatar(caixinha.id, centavos);
    setValor('');
    setAviso(tipo === 'guardar' ? `Guardou ${dinheiro(centavos)}.` : `Resgatou ${dinheiro(centavos)}.`);
  };

  return (
    <Tela topo={<Voltar />}>
      <View style={estilos.cabeca}>
        <View style={estilos.icone} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name={caixinha.origem ? 'leaf-outline' : 'wallet-outline'} size={30} color={cor.destaqueTexto} />
        </View>
        <View style={estilos.cabecaTextos}>
          <Texto variante="titulo" accessibilityRole="header">
            {caixinha.nome}
          </Texto>
          <Texto variante="apoio" cor={cor.textoSobreFundo}>
            {caixinha.origem
              ? `Com o que sobra sem ${caixinha.origem.nome} · desde ${dataLonga(caixinha.criadaEm)}`
              : `Desde ${dataLonga(caixinha.criadaEm)}`}
          </Texto>
        </View>
      </View>

      <Cartao style={estilos.saldo}>
        <Texto variante="apoio" cor={cor.textoSuave}>
          Saldo
        </Texto>
        <Texto variante="valorGrande">{dinheiro(saldo)}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`Você guardou ${dinheiro(guardado)} e rendeu ${dinheiro(rendimento)} (antes do IR).`}
        </Texto>
        {caixinha.meta !== null && (
          <View style={estilos.meta}>
            <BarraProgresso fracao={fracao} />
            <Texto variante="apoio">
              {`${porcentagem(Math.min(1, fracao), 0)} da meta de ${dinheiro(caixinha.meta)}`}
            </Texto>
            {fracao < 1 && (
              <Texto variante="apoio" cor={cor.textoSuave}>
                {faltam === null
                  ? 'Sem guardar todo mês, a meta não chega sozinha.'
                  : `Nesse ritmo, chega lá em ${faltam === 1 ? '1 mês' : `${faltam} meses`}.`}
              </Texto>
            )}
          </View>
        )}
      </Cartao>

      <Secao titulo="Guardar ou resgatar">
        <CampoTexto
          rotulo="Valor"
          value={valor}
          onChangeText={(t) => {
            setValor(t);
            setErro(null);
          }}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          erro={erro}
        />
        <View style={estilos.botoes}>
          <View style={estilos.metade}>
            <Botao variante="primario" rotulo="Guardar" aoTocar={() => movimentar('guardar')} />
          </View>
          <View style={estilos.metade}>
            <Botao rotulo="Resgatar" aoTocar={() => movimentar('resgatar')} />
          </View>
        </View>
        {aviso && (
          <Texto variante="apoio" cor={cor.textoSobreFundo} accessibilityLiveRegion="polite">
            {aviso}
          </Texto>
        )}
      </Secao>

      {mensal > 0 && (
        <Cartao destaque style={estilos.todoMes}>
          <Texto variante="corpo">{`Todo mês, ${dinheiro(mensal)} entram sozinhos aqui.`}</Texto>
          <View style={estilos.link}>
            <Botao variante="link" rotulo="Parar de guardar todo mês" aoTocar={() => pararDeGuardarTodoMes(caixinha.id)} />
          </View>
        </Cartao>
      )}

      {extrato.length > 0 && (
        <Secao titulo={`Movimentações (${extrato.length})`}>
          <Lista recuo={espaco.l}>
            {extrato.map((m) => (
              <View key={m.id} style={estilos.movimento}>
                <View style={estilos.movimentoTextos}>
                  <Texto variante="corpo">{m.valor > 0 ? (m.automatico ? 'Guardou (automático)' : 'Guardou') : 'Resgatou'}</Texto>
                  <Texto variante="apoio" cor={cor.textoSuave}>
                    {dataCurta(m.data)}
                  </Texto>
                </View>
                <Texto variante="valor" cor={m.valor > 0 ? cor.texto : cor.perigo}>
                  {m.valor > 0 ? `+ ${dinheiro(m.valor)}` : `− ${dinheiro(-m.valor)}`}
                </Texto>
              </View>
            ))}
          </Lista>
        </Secao>
      )}

      <View style={estilos.rodape}>
        <Botao
          variante="linkPerigo"
          rotulo={confirmarApagar ? 'Toque de novo para apagar' : 'Apagar caixinha'}
          dica="O saldo é resgatado e a caixinha some"
          aoTocar={() => {
            if (!confirmarApagar) return setConfirmarApagar(true);
            voltar();
            apagar(caixinha.id);
          }}
        />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: espaco.l, marginBottom: espaco.l },
  icone: {
    width: 64,
    height: 64,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaqueSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecaTextos: { flex: 1 },
  saldo: { gap: 2 },
  meta: { marginTop: espaco.m, gap: espaco.xs },
  botoes: { flexDirection: 'row', gap: espaco.s },
  metade: { flex: 1 },
  todoMes: { marginTop: espaco.l, gap: espaco.xs },
  link: { alignItems: 'flex-start', marginLeft: -espaco.s },
  movimento: { flexDirection: 'row', alignItems: 'center', minHeight: ALVO_MINIMO + 12, paddingHorizontal: espaco.l, paddingVertical: espaco.s },
  movimentoTextos: { flex: 1 },
  rodape: { marginTop: espaco.xl, alignItems: 'center' },
});
