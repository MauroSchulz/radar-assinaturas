import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { LinhaCaixinha } from '../componentes/LinhaCaixinha';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { dinheiro, porcentagem } from '../dominio/formato';
import { CDI_ANUAL, saldoDaCaixinha, simularAportesMensais } from '../dominio/investimentos';
import { useInvestimentos } from '../estado/investimentos';
import { useLoja } from '../estado/loja';
import { useNavegacao } from '../estado/navegacao';
import { useAssinaturas, useResumo } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

const PRAZOS = [
  { meses: 12, rotulo: '1 ano' },
  { meses: 36, rotulo: '3 anos' },
  { meses: 60, rotulo: '5 anos' },
  { meses: 120, rotulo: '10 anos' },
];

function LinhaValor({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <View style={estilos.linhaValor}>
      <Texto variante={forte ? 'corpoForte' : 'corpo'} style={estilos.linhaValorRotulo}>
        {rotulo}
      </Texto>
      <Texto variante={forte ? 'valor' : 'corpo'} cor={forte ? cor.destaqueTexto : cor.texto}>
        {valor}
      </Texto>
    </View>
  );
}

export function Investir() {
  const caixinhas = useInvestimentos((s) => s.caixinhas);
  const decisoes = useLoja((s) => s.decisoes);
  const assinaturas = useAssinaturas();
  const resumo = useResumo();
  const ir = useNavegacao((s) => s.ir);
  const [meses, setMeses] = useState(60);

  const saldos = caixinhas.map((c) => saldoDaCaixinha(c));
  const total = saldos.reduce((s, x) => s + x.saldo, 0);
  const rendeu = saldos.reduce((s, x) => s + x.rendimento, 0);
  const simulacao = simularAportesMensais(resumo.totalMensal, meses);
  const prazo = PRAZOS.find((p) => p.meses === meses)!.rotulo;

  // Assinaturas marcadas para cancelar que ainda não viraram caixinha.
  const comCaixinha = new Set(caixinhas.flatMap((c) => (c.origem ? [c.origem.assinaturaId] : [])));
  const economias = assinaturas.filter(
    (a) => a.situacao !== 'encerrada' && decisoes[a.id] === 'cancelar' && !comCaixinha.has(a.id) && a.custoMensal > 0,
  );

  return (
    <Tela titulo="Investir" sobretitulo="Caixinhas que rendem 100% do CDI">
      <View style={estilos.total} accessible accessibilityLabel={`Guardado nas caixinhas: ${dinheiro(total)}. Já rendeu ${dinheiro(rendeu)}.`}>
        <Texto variante="corpo" cor={cor.sobreDestaqueSuave}>
          Guardado nas caixinhas
        </Texto>
        <Texto variante="valorGrande" cor={cor.sobreDestaque}>
          {dinheiro(total)}
        </Texto>
        <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
          {`Já rendeu ${dinheiro(rendeu)} · ${caixinhas.length} ${caixinhas.length === 1 ? 'caixinha' : 'caixinhas'}`}
        </Texto>
      </View>

      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Criar caixinha" aoTocar={() => ir({ nome: 'novaCaixinha' })} />
      </View>

      {caixinhas.length > 0 && (
        <Secao titulo="Suas caixinhas">
          <Lista>
            {caixinhas.map((c) => (
              <LinhaCaixinha key={c.id} caixinha={c} aoTocar={() => ir({ nome: 'caixinha', id: c.id })} />
            ))}
          </Lista>
        </Secao>
      )}

      <Secao titulo="Economia que pode render">
        {economias.length === 0 ? (
          <Cartao>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Marque “vou cancelar” numa assinatura e ela aparece aqui, pronta para virar uma caixinha.
            </Texto>
          </Cartao>
        ) : (
          <Lista>
            {economias.map((a) => {
              const emUmAno = simularAportesMensais(a.custoMensal, 12).liquido;
              return (
                <View key={a.id} style={estilos.economia}>
                  <Avatar nome={a.nome} categoria={a.categoria} />
                  <View style={estilos.meio}>
                    <Texto variante="corpoForte">{a.nome}</Texto>
                    <Texto variante="apoio" cor={cor.textoSuave}>
                      {`${dinheiro(a.custoMensal)} por mês viram ${dinheiro(emUmAno)} em 1 ano`}
                    </Texto>
                  </View>
                  <Botao
                    compacto
                    rotulo="Guardar"
                    nomeAcessivel={`Guardar a economia de ${a.nome} numa caixinha`}
                    aoTocar={() =>
                      ir({
                        nome: 'novaCaixinha',
                        sugestao: { nome: `Economia: ${a.nome}`, aporteMensal: a.custoMensal, origem: { assinaturaId: a.id, nome: a.nome } },
                      })
                    }
                  />
                </View>
              );
            })}
          </Lista>
        )}
      </Secao>

      <Secao titulo="Quanto custam suas assinaturas">
        <Texto variante="apoio" cor={cor.textoSobreFundo}>
          {`Se, em vez de pagar as assinaturas, você investisse ${dinheiro(resumo.totalMensal)} todo mês:`}
        </Texto>
        <View style={estilos.prazos} accessibilityRole="radiogroup">
          {PRAZOS.map((p) => (
            <Ficha key={p.meses} papel="radio" rotulo={p.rotulo} marcada={p.meses === meses} aoTocar={() => setMeses(p.meses)} />
          ))}
        </View>
        <Cartao style={estilos.simulacao}>
          <LinhaValor rotulo="Você colocaria" valor={dinheiro(simulacao.aportado)} />
          <LinhaValor rotulo="Renderia" valor={`+ ${dinheiro(simulacao.rendimento)}`} />
          <LinhaValor rotulo="Imposto de renda" valor={`− ${dinheiro(simulacao.imposto)}`} />
          <View style={estilos.separador} />
          <LinhaValor rotulo={`Teria em ${prazo}`} valor={dinheiro(simulacao.liquido)} forte />
        </Cartao>
        <Texto variante="apoio" cor={cor.textoSobreFundo}>
          {`Simulação com CDI de ${porcentagem(CDI_ANUAL, 2)} ao ano (valor de exemplo) e IR da tabela regressiva. Não é promessa de rendimento.`}
        </Texto>
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  total: { backgroundColor: cor.destaque, borderRadius: raio.l, padding: espaco.xl, gap: espaco.xs },
  acao: { marginTop: espaco.m },
  economia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
  },
  meio: { flex: 1, gap: 2 },
  prazos: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  simulacao: { gap: espaco.s },
  linhaValor: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  linhaValorRotulo: { flex: 1 },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: cor.borda, marginVertical: espaco.xs },
});
