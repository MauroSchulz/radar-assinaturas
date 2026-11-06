import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao, SecaoLink } from '../componentes/Cartao';
import { CartaoAlerta } from '../componentes/CartaoAlerta';
import { LinhaAssinatura } from '../componentes/LinhaAssinatura';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { dataCurta, dataLonga, diaDaSemana, hoje } from '../dominio/datas';
import { LIMITE_EMPRESTIMO } from '../dominio/emprestimo';
import { dinheiro } from '../dominio/formato';
import { proximasCobrancas } from '../dominio/resumo';
import { FATURA } from '../estado/extrato';
import { useLoja } from '../estado/loja';
import { abrirAssinatura, useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { QUANTAS_TRANSACOES, useAlertas, useAssinaturas, useResumo, useSaldos } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

const ALERTAS_NO_INICIO = 3;
const OCULTO = '••••';
/** Nome da demonstração, até a pessoa cadastrar o próprio na chave Pix. */
const NOME_PADRAO = 'Mauro';

type Icone = ComponentProps<typeof Ionicons>['name'];

/** Faixa roxa do topo: quem é, esconder valores, e a saudação. */
function Faixa({ nome, alertas }: { nome: string; alertas: number }) {
  const ocultar = useLoja((s) => s.ocultarValores);
  const alternarOcultar = useLoja((s) => s.alternarOcultar);
  const trocarAba = useNavegacao((s) => s.trocarAba);
  return (
    <View style={estilos.faixa}>
      <View style={estilos.faixaTopo}>
        <View style={estilos.perfil} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Ionicons name="person-outline" size={22} color={cor.sobreDestaque} />
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
          </Pressable>
        </View>
      </View>
      <Texto variante="subtitulo" cor={cor.sobreDestaque} accessibilityRole="header">
        {nome ? `Olá, ${nome}` : 'Olá!'}
      </Texto>
      <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
        {`Hoje, ${dataLonga(hoje())}`}
      </Texto>
    </View>
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
    { icone: 'notifications-outline', rotulo: 'Alertas', acao: () => trocarAba('alertas') },
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
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`Limite disponível de ${valor(FATURA.limiteDisponivel)}`}
        </Texto>
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
  faixa: { gap: espaco.xs },
  faixaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espaco.l },
  perfil: {
    width: 48,
    height: 48,
    borderRadius: raio.pilula,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
