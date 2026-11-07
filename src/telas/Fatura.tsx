import { Pressable, StyleSheet, View } from 'react-native';
import { BarraProgresso } from '../componentes/BarraProgresso';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta, dataLonga, diaDaSemana } from '../dominio/datas';
import { chaveDoComerciante, nomeLegivel } from '../dominio/deteccao';
import { dinheiro, porcentagem } from '../dominio/formato';
import type { Transacao } from '../dominio/tipos';
import { useFatura } from '../estado/conta';
import { ASSINATURAS } from '../estado/extrato';
import { abrirAssinatura, useNavegacao } from '../estado/navegacao';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

function LinhaCompra({ compra }: { compra: Transacao }) {
  const assinatura = ASSINATURAS.find((a) => a.id === chaveDoComerciante(compra.descricao));
  const nome = assinatura?.nome ?? nomeLegivel(chaveDoComerciante(compra.descricao));
  const conteudo = (
    <>
      <View style={estilos.meio}>
        <Texto variante="corpo" numberOfLines={1}>
          {nome}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {dataCurta(compra.data)}
        </Texto>
      </View>
      {assinatura && (
        <View style={estilos.selo}>
          <Texto variante="legenda" cor={cor.destaqueTexto}>
            Assinatura
          </Texto>
        </View>
      )}
      <Texto variante="valor" cor={compra.valor < 0 ? cor.textoSuave : cor.texto}>
        {compra.valor < 0 ? `− ${dinheiro(-compra.valor)}` : dinheiro(compra.valor)}
      </Texto>
    </>
  );
  // Só a linha de assinatura abre alguma coisa (o detalhe dela); compra avulsa é só informação.
  if (!assinatura) return <View style={estilos.linha}>{conteudo}</View>;
  return (
    <Pressable
      onPress={() => abrirAssinatura(assinatura.id)}
      accessibilityRole="button"
      accessibilityLabel={`${nome}, assinatura, ${dataCurta(compra.data)}, ${dinheiro(compra.valor)}`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      {conteudo}
    </Pressable>
  );
}

export function Fatura() {
  const trocarAba = useNavegacao((s) => s.trocarAba);
  const f = useFatura();
  const usado = f.limite > 0 ? f.total / f.limite : 0;
  const parteAssinatura = f.total > 0 ? f.emAssinaturas / f.total : 0;

  return (
    <Tela topo={<Voltar />} titulo="Cartão de crédito" sobretitulo={`Fatura aberta · fecha em ${dataCurta(f.fechamento)}`}>
      <Texto variante="apoio" cor={cor.textoSuave}>
        Fatura atual
      </Texto>
      <Texto variante="valorGrande">{dinheiro(f.total)}</Texto>
      <Texto variante="apoio" cor={cor.textoSuave}>
        {`Vence ${diaDaSemana(f.vencimento)}, ${dataLonga(f.vencimento)}`}
      </Texto>

      <View style={estilos.limite}>
        <BarraProgresso fracao={usado} />
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`Limite disponível de ${dinheiro(f.limiteDisponivel)} (de ${dinheiro(f.limite)})`}
        </Texto>
      </View>

      {f.pixNoCredito > 0 && (
        <Texto variante="apoio" cor={cor.textoSuave} style={estilos.pixCredito}>
          {`Inclui ${dinheiro(f.pixNoCredito)} de Pix no crédito (1ª parcela).`}
        </Texto>
      )}

      {f.emAssinaturas > 0 && (
        <Cartao destaque style={estilos.destaque}>
          <Texto variante="corpo">
            {'Desta fatura, '}
            <Texto variante="valor" cor={cor.destaqueTexto}>
              {dinheiro(f.emAssinaturas)}
            </Texto>
            {` (${porcentagem(parteAssinatura, 0)}) são assinaturas.`}
          </Texto>
          <View style={estilos.link}>
            <Botao variante="link" rotulo="Ver assinaturas" aoTocar={() => trocarAba('assinaturas')} />
          </View>
        </Cartao>
      )}

      <Secao titulo={`Compras desde ${dataCurta(f.abertura)} (${f.compras.length})`}>
        <Lista recuo={espaco.l}>
          {f.compras.map((c) => (
            <LinhaCompra key={c.id} compra={c} />
          ))}
        </Lista>
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  limite: { marginTop: espaco.l, gap: espaco.s },
  pixCredito: { marginTop: espaco.s },
  destaque: { marginTop: espaco.l, gap: espaco.xs },
  link: { alignItems: 'flex-start', marginLeft: -espaco.s },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.s,
    minHeight: ALVO_MINIMO + 16,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  meio: { flex: 1, gap: 2 },
  selo: { paddingHorizontal: espaco.s, paddingVertical: 2, borderRadius: raio.pilula, backgroundColor: cor.destaqueSuave },
});
