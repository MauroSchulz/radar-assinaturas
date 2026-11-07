import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BarraProgresso } from '../componentes/BarraProgresso';
import { Botao } from '../componentes/Botao';
import { GraficoMeses } from '../componentes/GraficoMeses';
import { Cartao, Secao, SecaoLink } from '../componentes/Cartao';
import { CartaoAlerta } from '../componentes/CartaoAlerta';
import { LinhaAssinatura } from '../componentes/LinhaAssinatura';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { NOME_DO_ENVIO, type Envio, type TipoEnvio } from '../dominio/conta';
import { dataCurta, dataLonga, diaDaSemana, hoje, quando } from '../dominio/datas';
import { LIMITE_EMPRESTIMO } from '../dominio/emprestimo';
import { dinheiro } from '../dominio/formato';
import { resumoDoAno } from '../dominio/gastos';
import { proximasCobrancas } from '../dominio/resumo';
import { useConta, useFatura, useSaldoConta } from '../estado/conta';
import { ANO_ATUAL, GASTOS_DO_ANO } from '../estado/extrato';
import { useLoja } from '../estado/loja';
import { abrirAssinatura, useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { QUANTAS_TRANSACOES, useAlertas, useAssinaturas, useResumo, useSaldos } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

const ALERTAS_NO_INICIO = 3;
const MOVIMENTOS_NO_INICIO = 3;
const OCULTO = '••••';
/** Nome da demonstração, até a pessoa cadastrar o próprio na chave Pix. */
const NOME_PADRAO = 'Mauro';

type Icone = ComponentProps<typeof Ionicons>['name'];

/** As três formas de mandar dinheiro, em destaque dentro da faixa. */
const ACOES_DA_FAIXA: { modo: TipoEnvio; icone: Icone; rotulo: string }[] = [
  { modo: 'pix', icone: 'flash-outline', rotulo: 'Pix' },
  { modo: 'transferencia', icone: 'swap-horizontal-outline', rotulo: 'Transferir' },
  { modo: 'pixCredito', icone: 'card-outline', rotulo: 'Pix no crédito' },
];

/** Faixa do topo, em degradê: quem é, o saldo da conta e os botões de mandar dinheiro. */
function Faixa({ nome, alertas }: { nome: string; alertas: number }) {
  const ocultar = useLoja((s) => s.ocultarValores);
  const alternarOcultar = useLoja((s) => s.alternarOcultar);
  const trocarAba = useNavegacao((s) => s.trocarAba);
  const ir = useNavegacao((s) => s.ir);
  const saldo = useSaldoConta();
  return (
    <View style={estilos.faixa}>
      <View style={estilos.faixaTopo}>
        <View style={estilos.perfil} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name="person-outline" size={22} color={cor.sobreDestaque} />
        </View>
        <View style={estilos.saudacao}>
          <Texto variante="corpoForte" cor={cor.sobreDestaque} accessibilityRole="header" numberOfLines={1}>
            {nome ? `Olá, ${nome}` : 'Olá!'}
          </Texto>
          <Texto variante="apoio" cor={cor.sobreDestaqueSuave} numberOfLines={1}>
            {`Hoje, ${dataLonga(hoje())}`}
          </Texto>
        </View>
        <View style={estilos.faixaIcones}>
          <Pressable
            onPress={alternarOcultar}
            accessibilityRole="button"
            accessibilityLabel={ocultar ? 'Mostrar valores' : 'Esconder valores'}
            style={({ pressed }) => [estilos.iconeTopo, pressed && estilos.pressionado]}
          >
            <Ionicons name={ocultar ? 'eye-off-outline' : 'eye-outline'} size={24} color={cor.sobreDestaque} />
          </Pressable>
          <Pressable
            onPress={() => trocarAba('alertas')}
            accessibilityRole="button"
            accessibilityLabel={alertas ? `Alertas, ${alertas} novos` : 'Alertas'}
            style={({ pressed }) => [estilos.iconeTopo, pressed && estilos.pressionado]}
          >
            <Ionicons name="notifications-outline" size={24} color={cor.sobreDestaque} />
            {alertas > 0 && <View style={estilos.pontoAlerta} />}
          </Pressable>
        </View>
      </View>

      <View accessible accessibilityLabel={ocultar ? 'Saldo em conta. Valor escondido.' : `Saldo em conta ${dinheiro(saldo)}`}>
        <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
          Saldo em conta
        </Texto>
        <Texto variante="valorGrande" cor={cor.sobreDestaque}>
          {ocultar ? OCULTO : dinheiro(saldo)}
        </Texto>
      </View>

      <View style={estilos.acoesFaixa}>
        {ACOES_DA_FAIXA.map((a) => (
          <Pressable
            key={a.modo}
            onPress={() => ir({ nome: 'enviar', modo: a.modo })}
            accessibilityRole="button"
            accessibilityLabel={a.rotulo}
            style={({ pressed }) => [estilos.acaoFaixa, pressed && estilos.pressionado]}
          >
            <Ionicons name={a.icone} size={22} color={cor.sobreDestaque} />
            <Texto variante="legenda" cor={cor.sobreDestaque} numberOfLines={1}>
              {a.rotulo}
            </Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Um Pix ou transferência que você mandou: abre o comprovante. */
function LinhaEnvio({ envio, ocultar }: { envio: Envio; ocultar: boolean }) {
  const ir = useNavegacao((s) => s.ir);
  const icone: Icone = envio.tipo === 'transferencia' ? 'swap-horizontal-outline' : envio.tipo === 'pixCredito' ? 'card-outline' : 'flash-outline';
  const valor = ocultar ? OCULTO : `− ${dinheiro(envio.valor)}`;
  const detalhe = envio.credito ? `${envio.credito.parcelas}x no cartão` : 'da conta';
  return (
    <Pressable
      onPress={() => ir({ nome: 'comprovante', id: envio.id })}
      accessibilityRole="button"
      accessibilityLabel={`${NOME_DO_ENVIO[envio.tipo]} para ${envio.para}, ${quando(envio.data)}, ${ocultar ? 'valor escondido' : dinheiro(envio.valor)}. Abrir comprovante.`}
      style={({ pressed }) => [estilos.envio, pressed && estilos.envioPressionado]}
    >
      <View style={estilos.envioIcone}>
        <Ionicons name={icone} size={20} color={cor.destaqueTexto} />
      </View>
      <View style={estilos.envioMeio}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {`${NOME_DO_ENVIO[envio.tipo]} para ${envio.para}`}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={1}>
          {`${quando(envio.data).replace(/^./, (l) => l.toUpperCase())} · ${detalhe}`}
        </Texto>
      </View>
      <Texto variante="valor">{valor}</Texto>
    </Pressable>
  );
}

/** Quanto saiu do cartão em cada mês do ano, com o mês que mais gastou em destaque. */
function SecaoGastos({ ocultar }: { ocultar: boolean }) {
  const resumo = useMemo(() => resumoDoAno(GASTOS_DO_ANO), []);
  const [mes, setMes] = useState(resumo.maior?.mes ?? Number(hoje().slice(5, 7)));
  const escolhido = GASTOS_DO_ANO[mes - 1];
  const v = (centavos: number) => (ocultar ? OCULTO : dinheiro(centavos));
  const nome = escolhido.nome.replace(/^./, (l) => l.toUpperCase());
  const diferenca = escolhido.total - resumo.media;
  const comparacao =
    escolhido.situacao === 'fechado' && resumo.media > 0 && !ocultar
      ? ` · ${dinheiro(Math.abs(diferenca))} ${diferenca >= 0 ? 'acima' : 'abaixo'} da média`
      : '';

  return (
    <Secao titulo={`Gastos no cartão em ${ANO_ATUAL}`}>
      {resumo.maior && (
        <Texto variante="corpo">
          {'Você gastou mais em '}
          <Texto variante="corpoForte">{resumo.maior.nome}</Texto>
          {': '}
          <Texto variante="valor">{v(resumo.maior.total)}</Texto>
        </Texto>
      )}
      <Texto variante="apoio" cor={cor.textoSuave}>
        {`Média de ${v(resumo.media)} por mês · ${v(resumo.total)} no ano até hoje`}
      </Texto>

      <GraficoMeses meses={GASTOS_DO_ANO} selecionado={mes} maior={resumo.maior?.mes ?? null} aoSelecionar={setMes} ocultar={ocultar} />

      <View style={estilos.mesEscolhido} accessibilityLiveRegion="polite">
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`${nome}${escolhido.situacao === 'atual' ? ' (até hoje)' : ''}${escolhido.mes === resumo.maior?.mes ? ' · o mês que mais gastou' : ''}`}
        </Texto>
        <Texto variante="valorMedio">{v(escolhido.total)}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`${escolhido.compras} ${escolhido.compras === 1 ? 'compra' : 'compras'} · ${v(escolhido.emAssinaturas)} em assinaturas${comparacao}`}
        </Texto>
      </View>
      <Texto variante="legenda" cor={cor.textoSuave} style={estilos.dicaGrafico}>
        Toque num mês para ver o valor.
      </Texto>
    </Secao>
  );
}

/** Botão redondo com rótulo embaixo, na fileira de atalhos. */
function Atalho({ icone, rotulo, aoTocar }: { icone: Icone; rotulo: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.atalho, pressed && estilos.pressionado]}
    >
      <View style={estilos.atalhoCirculo}>
        <Ionicons name={icone} size={26} color={cor.texto} />
      </View>
      <Texto variante="legenda" style={estilos.atalhoRotulo}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

export function Inicio() {
  const assinaturas = useAssinaturas();
  const alertas = useAlertas();
  const resumo = useResumo();
  const decisoes = useLoja((s) => s.decisoes);
  const dispensar = useLoja((s) => s.dispensar);
  const ocultar = useLoja((s) => s.ocultarValores);
  const nomeCompleto = useRachas((s) => s.pix.nome);
  const trocarAba = useNavegacao((s) => s.trocarAba);
  const ir = useNavegacao((s) => s.ir);
  const abrir = abrirAssinatura;
  const proximas = proximasCobrancas(assinaturas);
  const saldos = useSaldos();
  const envios = useConta((s) => s.envios);
  const FATURA = useFatura();
  const totalDevido = saldos.reduce((s, x) => s + x.devendo, 0);
  const nomes = saldos.map((s) => s.pessoa.nome);
  const nomesQueDevem = nomes.length <= 1 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
  const valor = (centavos: number) => (ocultar ? OCULTO : dinheiro(centavos));
  const dividiu = resumo.suaParteMensal < resumo.totalMensal;

  const atalhos: { icone: Icone; rotulo: string; acao: () => void }[] = [
    { icone: 'albums-outline', rotulo: 'Assinaturas', acao: () => trocarAba('assinaturas') },
    { icone: 'people-outline', rotulo: 'Rachar compra', acao: () => ir({ nome: 'escolherCompra' }) },
    { icone: 'cash-outline', rotulo: 'Cobrar', acao: () => trocarAba('rachar') },
    { icone: 'trending-up-outline', rotulo: 'Investir', acao: () => trocarAba('investir') },
    { icone: 'wallet-outline', rotulo: 'Empréstimo', acao: () => ir({ nome: 'emprestimo' }) },
    { icone: 'key-outline', rotulo: 'Chave Pix', acao: () => ir({ nome: 'seuPix' }) },
  ];

  return (
    <Tela faixa={<Faixa nome={nomeCompleto.trim().split(' ')[0] || NOME_PADRAO} alertas={alertas.length} />}>
      <Pressable
        onPress={() => trocarAba('assinaturas')}
        accessibilityRole="button"
        accessibilityLabel={
          ocultar
            ? 'Assinaturas. Valores escondidos.'
            : `Assinaturas: você gasta ${dinheiro(resumo.totalMensal)} por mês, ${dinheiro(resumo.totalAnual)} por ano.${dividiu ? ` Com as divisões, sai do seu bolso ${dinheiro(resumo.suaParteMensal)} por mês.` : ''}`
        }
        style={({ pressed }) => [estilos.conta, pressed && estilos.pressionado]}
      >
        <View style={estilos.contaTitulo}>
          <Texto variante="subtitulo">Assinaturas</Texto>
          <Ionicons name="chevron-forward" size={20} color={cor.textoSuave} />
        </View>
        <Texto variante="apoio" cor={cor.textoSuave}>
          Você gasta por mês
        </Texto>
        <Texto variante="valorGrande">{valor(resumo.totalMensal)}</Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`${valor(resumo.totalAnual)} por ano · ${resumo.ativas} ativas${resumo.emTeste ? ` · ${resumo.emTeste} em teste` : ''}`}
        </Texto>
        {dividiu && (
          <Texto variante="apoio" cor={cor.textoSuave}>
            {'Com as divisões, sai do seu bolso '}
            <Texto variante="valor" cor={cor.destaqueTexto}>
              {valor(resumo.suaParteMensal)}
            </Texto>
            {' por mês.'}
          </Texto>
        )}
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.atalhos} contentContainerStyle={estilos.atalhosConteudo}>
        {atalhos.map((a) => (
          <Atalho key={a.rotulo} icone={a.icone} rotulo={a.rotulo} aoTocar={a.acao} />
        ))}
      </ScrollView>

      {totalDevido > 0 && (
        <Pressable
          onPress={() => trocarAba('rachar')}
          accessibilityRole="button"
          accessibilityLabel={ocultar ? 'Te devem. Valor escondido. Abrir Rachar.' : `Te devem ${dinheiro(totalDevido)}. Abrir Rachar.`}
          style={({ pressed }) => [estilos.devem, pressed && estilos.pressionado]}
        >
          <Ionicons name="people-outline" size={22} color={cor.texto} />
          <Texto variante="corpo" style={estilos.devemTexto}>
            {`${nomesQueDevem} te ${saldos.length === 1 ? 'deve' : 'devem'} `}
            <Texto variante="valor">{valor(totalDevido)}</Texto>
          </Texto>
          <Ionicons name="chevron-forward" size={20} color={cor.textoSuave} />
        </Pressable>
      )}

      {resumo.economiaAnual > 0 && (
        <Cartao destaque style={estilos.economia}>
          <Texto variante="corpo">
            {resumo.marcadas === 1
              ? 'Cancelando a que você marcou, sobram '
              : `Cancelando as ${resumo.marcadas} que você marcou, sobram `}
            <Texto variante="valor" cor={cor.destaqueTexto}>
              {valor(resumo.economiaAnual)}
            </Texto>
            {' por ano.'}
          </Texto>
        </Cartao>
      )}

      <SecaoGastos ocultar={ocultar} />

      {envios.length > 0 && (
        <Secao titulo="Últimas movimentações">
          <Lista>
            {envios.slice(0, MOVIMENTOS_NO_INICIO).map((e) => (
              <LinhaEnvio key={e.id} envio={e} ocultar={ocultar} />
            ))}
          </Lista>
        </Secao>
      )}

      <SecaoLink
        titulo="Cartão de crédito"
        aoTocar={() => ir({ nome: 'fatura' })}
        rotulo={
          ocultar
            ? 'Cartão de crédito. Valores escondidos.'
            : `Cartão de crédito. Fatura atual ${dinheiro(FATURA.total)}, limite disponível de ${dinheiro(FATURA.limiteDisponivel)}. ${dinheiro(FATURA.emAssinaturas)} são assinaturas.`
        }
      >
        <View>
          <Texto variante="corpo">Fatura atual</Texto>
          <Texto variante="valorMedio">{valor(FATURA.total)}</Texto>
        </View>
        <View style={estilos.limite}>
          <BarraProgresso fracao={FATURA.limite > 0 ? 1 - FATURA.limiteDisponivel / FATURA.limite : 0} />
          <Texto variante="apoio" cor={cor.textoSuave}>
            {`Limite disponível de ${valor(FATURA.limiteDisponivel)}`}
          </Texto>
        </View>
        {FATURA.pixNoCredito > 0 && (
          <Texto variante="apoio" cor={cor.textoSuave}>
            {`${valor(FATURA.pixNoCredito)} de Pix no crédito nesta fatura`}
          </Texto>
        )}
        {FATURA.emAssinaturas > 0 && (
          <Texto variante="apoio" cor={cor.destaqueTexto}>
            {`${valor(FATURA.emAssinaturas)} desta fatura são assinaturas`}
          </Texto>
        )}
      </SecaoLink>

      <SecaoLink
        titulo="Empréstimo"
        aoTocar={() => ir({ nome: 'emprestimo' })}
        rotulo={ocultar ? 'Empréstimo. Valor escondido.' : `Empréstimo. Valor disponível de até ${dinheiro(LIMITE_EMPRESTIMO)}.`}
      >
        <View>
          <Texto variante="corpo">Valor disponível de até</Texto>
          <Texto variante="valorMedio">{valor(LIMITE_EMPRESTIMO)}</Texto>
        </View>
      </SecaoLink>

      <SecaoLink
        titulo="Próximo pagamento"
        aoTocar={() => ir({ nome: 'fatura' })}
        rotulo={`Próximo pagamento: fatura do cartão, ${diaDaSemana(FATURA.vencimento)}, ${dataLonga(FATURA.vencimento)}.`}
      >
        <Texto variante="corpo">
          {`${diaDaSemana(FATURA.vencimento).replace(/^./, (l) => l.toUpperCase())}, `}
          <Texto variante="corpoForte">{dataCurta(FATURA.vencimento)}</Texto>
          {' · fatura do cartão'}
        </Texto>
      </SecaoLink>

      <Secao
        titulo="Precisa da sua atenção"
        acao={
          alertas.length > ALERTAS_NO_INICIO ? (
            <Botao variante="link" rotulo={`Ver todos (${alertas.length})`} aoTocar={() => trocarAba('alertas')} />
          ) : undefined
        }
      >
        {alertas.length === 0 ? (
          <Cartao>
            <Texto variante="apoio" cor={cor.textoSuave}>
              Nada fora do normal. O radar avisa quando um teste grátis estiver acabando ou um preço subir.
            </Texto>
          </Cartao>
        ) : (
          alertas.slice(0, ALERTAS_NO_INICIO).map((alerta) => (
            <CartaoAlerta
              key={alerta.id}
              alerta={alerta}
              aoAbrir={() => abrir(alerta.assinaturaId)}
              aoDispensar={() => dispensar(alerta.id)}
            />
          ))
        )}
      </Secao>

      {proximas.length > 0 && (
        <>
          <Secao titulo="Próximos 7 dias">
            <Lista>
              {proximas.map((a) => (
                <LinhaAssinatura key={a.id} assinatura={a} decisao={decisoes[a.id]} aoTocar={() => abrir(a.id)} />
              ))}
            </Lista>
          </Secao>
        </>
      )}

      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.rodape}>
        {`O radar leu ${QUANTAS_TRANSACOES} compras do seu cartão e achou ${assinaturas.length} assinaturas. Dados de demonstração.`}
      </Texto>
    </Tela>
  );
}

const TAMANHO_ATALHO = 64;

const estilos = StyleSheet.create({
  faixa: { gap: espaco.l },
  faixaTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  perfil: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cor.vidroSobreFaixa,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saudacao: { flex: 1 },
  pontoAlerta: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: raio.pilula,
    backgroundColor: cor.selo,
    borderWidth: 1.5,
    borderColor: cor.sobreDestaque,
  },
  acoesFaixa: { flexDirection: 'row', gap: espaco.s, marginTop: espaco.xs },
  acaoFaixa: {
    flex: 1,
    minHeight: 68,
    borderRadius: raio.m,
    backgroundColor: cor.vidroSobreFaixa,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.xs,
  },
  limite: { gap: espaco.s, marginVertical: espaco.xs },
  mesEscolhido: { marginTop: espaco.l, gap: 2 },
  dicaGrafico: { marginTop: espaco.s, fontWeight: '400' },
  envio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 16,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  envioPressionado: { backgroundColor: cor.superficieSuave },
  envioIcone: {
    width: 40,
    height: 40,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaqueSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envioMeio: { flex: 1, gap: 2 },
  faixaIcones: { flexDirection: 'row', gap: espaco.xs },
  iconeTopo: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
  conta: { gap: 2 },
  contaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espaco.xs },
  atalhos: { marginTop: espaco.xl, marginHorizontal: -espaco.l },
  atalhosConteudo: { paddingHorizontal: espaco.l, gap: espaco.m },
  atalho: { width: 76, alignItems: 'center', gap: espaco.s },
  atalhoCirculo: {
    width: TAMANHO_ATALHO,
    height: TAMANHO_ATALHO,
    borderRadius: TAMANHO_ATALHO / 2,
    backgroundColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoRotulo: { textAlign: 'center' },
  devem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 12,
    marginTop: espaco.xl,
    paddingHorizontal: espaco.l,
    borderRadius: raio.m,
    backgroundColor: cor.superficie,
  },
  devemTexto: { flex: 1 },
  pressionado: { opacity: 0.7 },
  economia: { marginTop: espaco.m },
  rodape: { marginTop: espaco.xl, textAlign: 'center' },
});
