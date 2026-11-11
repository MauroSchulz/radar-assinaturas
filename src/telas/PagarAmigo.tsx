import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { useCobranca } from '../estado/cobrar';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

/**
 * Quando você deve a um amigo (ele pagou a conta): quanto, de quê, e pagar com Pix já
 * preenchido ou marcar que já pagou. O que ele te deve é descontado.
 */
export function PagarAmigo({ pessoaId }: { pessoaId: string }) {
  const c = useCobranca(pessoaId);
  const marcarRecebido = useRachas((s) => s.marcarRecebido);
  const ir = useNavegacao((s) => s.ir);
  const voltar = useNavegacao((s) => s.voltar);
  if (!c.pessoa) return null;
  const nome = c.pessoa.nome;
  const devo = -c.total;
  const chaves = c.pendentes.map((p) => p.chave);

  // Um pelo outro, quem deve é a pessoa: o que você deve já sai descontado na cobrança.
  if (devo <= 0) {
    const minhas = c.pendentes.filter((p) => p.direcao === 'voceDeve').map((p) => p.chave);
    return (
      <Tela topo={<Voltar />} titulo={`Pagar ${nome}`} sobretitulo="Um pelo outro">
        <Texto variante="corpo">
          {`Você deve ${dinheiro(c.voceDeve)} a ${nome}, mas ${nome} te deve ${dinheiro(c.teDeve)}. Um pelo outro, quem deve é ${nome}: ${dinheiro(-devo)}. O que você deve já sai descontado na cobrança.`}
        </Texto>
        <View style={estilos.acoes}>
          <Botao variante="primario" icone="paper-plane-outline" rotulo={`Cobrar ${dinheiro(-devo)} de ${nome}`} aoTocar={() => ir({ nome: 'cobranca', pessoaId })} />
          {minhas.length > 0 && (
            <Botao
              rotulo={`Já paguei os ${dinheiro(c.voceDeve)}`}
              aoTocar={() => {
                marcarRecebido(minhas);
                voltar();
              }}
            />
          )}
        </View>
      </Tela>
    );
  }

  return (
    <Tela topo={<Voltar />} titulo={`Pagar ${nome}`} sobretitulo="Você deve">
      <Texto variante="valorGrande">{dinheiro(Math.max(0, devo))}</Texto>
      {c.teDeve > 0 && (
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`Você deve ${dinheiro(c.voceDeve)}, e ${nome} te deve ${dinheiro(c.teDeve)}: um pelo outro, fica ${dinheiro(devo)}.`}
        </Texto>
      )}
      <Lista recuo={espaco.l}>
        {c.itens.map((i, n) => (
          <View key={n} style={estilos.item}>
            <Texto variante="corpo" style={estilos.itemNome} numberOfLines={1}>
              {`${i.titulo} · ${dataCurta(i.referente)}`}
            </Texto>
            <Texto variante="valor" cor={i.valor < 0 ? cor.texto : cor.textoSuave}>
              {i.valor < 0 ? dinheiro(-i.valor) : `− ${dinheiro(i.valor)}`}
            </Texto>
          </View>
        ))}
      </Lista>
      <View style={estilos.acoes}>
        <Botao
          variante="primario"
          icone="flash-outline"
          rotulo={`Pagar ${dinheiro(devo)} com Pix`}
          aoTocar={() => ir({ nome: 'enviar', modo: 'pix', preenchido: { nome, valor: devo }, quitar: chaves })}
        />
        <Botao
          rotulo="Já paguei"
          dica={`Marca como acertado com ${nome}`}
          aoTocar={() => {
            marcarRecebido(chaves);
            voltar();
          }}
        />
      </View>
      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.aviso}>
        No Pix, falta só a chave de quem recebe: o valor e o nome já vão preenchidos.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, minHeight: ALVO_MINIMO, paddingHorizontal: espaco.l },
  itemNome: { flex: 1 },
  acoes: { gap: espaco.s, marginTop: espaco.xl },
  aviso: { marginTop: espaco.l, textAlign: 'center' },
});
