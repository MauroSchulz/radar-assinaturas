import { StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta, dataLonga, quando } from '../dominio/datas';
import { dinheiro, NOME_DO_PERIODO, POR_PERIODO } from '../dominio/formato';
import type { Assinatura, Cobranca } from '../dominio/tipos';
import { useLoja } from '../estado/loja';
import { comQuem } from '../componentes/LinhaRacha';
import { simularAportesMensais } from '../dominio/investimentos';
import { rachaDaAssinatura, suaParteMensal } from '../dominio/racha';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { useAssinatura } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, NOME_DA_CATEGORIA, raio } from '../tema/tokens';

/** A frase que resume a situação, logo abaixo do preço. */
function situacaoEmTexto(a: Assinatura): string {
  if (a.situacao === 'teste') {
    return a.valorAtual > 0
      ? `Teste grátis até ${dataLonga(a.proximaCobranca)} (${quando(a.proximaCobranca)}). Depois, ${dinheiro(a.valorAtual)} ${POR_PERIODO[a.periodo]}.`
      : `Teste grátis até ${dataLonga(a.proximaCobranca)} (${quando(a.proximaCobranca)}). Depois começa a cobrar.`;
  }
  if (a.situacao === 'encerrada') {
    return `A última cobrança foi em ${dataLonga(a.ultimaCobranca!)}. Parece que você já cancelou.`;
  }
  return `Próxima cobrança em ${dataLonga(a.proximaCobranca)} (${quando(a.proximaCobranca)}).`;
}

function LinhaCobranca({ cobranca, anterior }: { cobranca: Cobranca; anterior?: Cobranca }) {
  const subiu = anterior !== undefined && !cobranca.duplicada && cobranca.valor > anterior.valor;
  const selo = cobranca.duplicada ? 'Duplicada' : subiu ? 'Aumento' : null;
  return (
    <View style={estilos.cobranca}>
      <Texto variante="corpo" style={estilos.cobrancaData}>
        {dataCurta(cobranca.data)}
      </Texto>
      {selo && (
        <View style={[estilos.selo, { backgroundColor: cobranca.duplicada ? cor.perigoFundo : cor.alertaFundo }]}>
          <Texto variante="legenda" cor={cobranca.duplicada ? cor.perigo : cor.alerta}>
            {selo}
          </Texto>
        </View>
      )}
      <Texto variante="valor">{dinheiro(cobranca.valor)}</Texto>
    </View>
  );
}

export function Detalhe({ id }: { id: string }) {
  const a = useAssinatura(id);
  const decisao = useLoja((s) => s.decisoes[id]);
  const decidir = useLoja((s) => s.decidir);
  const rachas = useRachas((s) => s.rachas);
  const pessoas = useRachas((s) => s.pessoas);
  const ir = useNavegacao((s) => s.ir);
  if (!a) return null;

  const racha = rachaDaAssinatura(a.id, rachas);
  const nomesDoRacha = racha ? racha.pessoas.map((id) => pessoas.find((p) => p.id === id)?.nome ?? '?') : [];

  const encerrada = a.situacao === 'encerrada';
  const vaiCancelar = decisao === 'cancelar' && !encerrada;
  // Do mais recente para o mais antigo, cada uma comparada com a anterior no tempo.
  const historico = a.cobrancas.map((c, i) => ({ c, anterior: a.cobrancas[i - 1] })).reverse();

  return (
    <Tela topo={<Voltar />}>
      <View style={estilos.cabeca}>
        <Avatar nome={a.nome} categoria={a.categoria} tamanho={64} />
        <View style={estilos.cabecaTextos}>
          <Texto variante="titulo" accessibilityRole="header">
            {a.nome}
          </Texto>
          <Texto variante="apoio" cor={cor.textoSobreFundo}>
            {`${NOME_DA_CATEGORIA[a.categoria]} · ${NOME_DO_PERIODO[a.periodo]}`}
          </Texto>
        </View>
      </View>

      <Cartao>
        <Texto variante="valorGrande" cor={encerrada ? cor.textoSuave : cor.texto}>
          {a.situacao === 'teste' && a.valorAtual === 0 ? 'Grátis' : dinheiro(a.valorAtual)}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {POR_PERIODO[a.periodo]}
        </Texto>
        <Texto variante="corpo" style={estilos.frase}>
          {situacaoEmTexto(a)}
        </Texto>
        {!encerrada && a.custoAnual > 0 && a.periodo !== 'anual' && (
          <View style={estilos.ano}>
            <Texto variante="corpo">
              {'Em um ano, isso dá '}
              <Texto variante="valor" cor={cor.destaqueTexto}>
                {dinheiro(a.custoAnual)}
              </Texto>
              .
            </Texto>
          </View>
        )}
      </Cartao>

      {!encerrada && (
        <Secao titulo="Você ainda usa?">
          <View style={estilos.escolha}>
            <View style={estilos.metade}>
              <Botao rotulo="Ainda uso" selecionado={decisao === 'manter'} aoTocar={() => decidir(a.id, 'manter')} />
            </View>
            <View style={estilos.metade}>
              <Botao
                rotulo="Vou cancelar"
                variante={vaiCancelar ? 'secundario' : 'primario'}
                selecionado={vaiCancelar}
                aoTocar={() => decidir(a.id, 'cancelar')}
                dica={vaiCancelar ? 'Toque de novo para desfazer' : 'Mostra como cancelar e quanto você economiza'}
              />
            </View>
          </View>
        </Secao>
      )}

      {a.situacao === 'ativa' && (
        <Secao titulo="Divide com alguém?">
          {racha ? (
            <Cartao destaque style={estilos.divisao}>
              <Texto variante="corpo">
                {`Dividida ${comQuem(nomesDoRacha)}. Sua parte: `}
                <Texto variante="valor">{dinheiro(suaParteMensal(a, rachas))}</Texto>
                {' por mês.'}
              </Texto>
              <View style={estilos.divisaoAcao}>
                <Botao variante="link" rotulo="Ver o racha" aoTocar={() => ir({ nome: 'racha', id: racha.id })} />
              </View>
            </Cartao>
          ) : (
            <Botao
              rotulo="Dividir com amigos"
              aoTocar={() => ir({ nome: 'montarRacha', titulo: a.nome, origem: { tipo: 'assinatura', assinaturaId: a.id, desde: a.ultimaCobranca! } })}
              dica="Cada mês, cada um paga a sua parte"
            />
          )}
        </Secao>
      )}

      {vaiCancelar && (
        <Secao titulo="Como cancelar">
          <Cartao style={estilos.passos}>
            {a.comoCancelar.map((passo, i) => (
              <View key={i} style={estilos.passo}>
                <View style={estilos.numero}>
                  <Texto variante="legenda" cor={cor.sobreDestaque}>
                    {String(i + 1)}
                  </Texto>
                </View>
                <Texto variante="corpo" style={estilos.passoTexto}>
                  {passo}
                </Texto>
              </View>
            ))}
            <Texto variante="apoio" cor={cor.textoSuave}>
              {`Cancelando, você deixa de pagar ${dinheiro(a.custoAnual)} por ano. Os passos podem mudar: na dúvida, confira na ajuda do serviço.`}
            </Texto>
          </Cartao>
          {a.custoMensal > 0 && (
            <Cartao destaque style={estilos.divisao}>
              <Texto variante="corpo">
                {'Investindo essa economia todo mês, em 1 ano você teria '}
                <Texto variante="valor" cor={cor.destaqueTexto}>
                  {dinheiro(simularAportesMensais(a.custoMensal, 12).liquido)}
                </Texto>
                .
              </Texto>
              <View style={estilos.divisaoAcao}>
                <Botao
                  variante="link"
                  rotulo="Guardar numa caixinha"
                  aoTocar={() =>
                    ir({
                      nome: 'novaCaixinha',
                      sugestao: { nome: `Economia: ${a.nome}`, aporteMensal: a.custoMensal, origem: { assinaturaId: a.id, nome: a.nome } },
                    })
                  }
                />
              </View>
            </Cartao>
          )}
        </Secao>
      )}

      {historico.length > 0 && (
        <Secao titulo={`Cobranças no cartão (${historico.length})`}>
          <Lista recuo={espaco.l}>
            {historico.map(({ c, anterior }) => (
              <LinhaCobranca key={c.id} cobranca={c} anterior={anterior} />
            ))}
          </Lista>
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  divisao: { gap: espaco.xs },
  divisaoAcao: { alignItems: 'flex-start', marginLeft: -espaco.s },
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: espaco.l, marginBottom: espaco.l },
  cabecaTextos: { flex: 1 },
  frase: { marginTop: espaco.m },
  ano: { marginTop: espaco.m, paddingTop: espaco.m, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cor.borda },
  escolha: { flexDirection: 'row', gap: espaco.s },
  metade: { flex: 1 },
  passos: { gap: espaco.m },
  passo: { flexDirection: 'row', gap: espaco.m, alignItems: 'flex-start' },
  numero: {
    width: 24,
    height: 24,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoTexto: { flex: 1 },
  cobranca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.s,
    minHeight: ALVO_MINIMO + 4,
    paddingHorizontal: espaco.l,
  },
  cobrancaData: { flex: 1 },
  selo: { paddingHorizontal: espaco.s, paddingVertical: 2, borderRadius: raio.pilula },
});
