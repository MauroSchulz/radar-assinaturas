import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CampoTexto } from '../componentes/CampoTexto';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dinheiro, lerValor, porcentagem } from '../dominio/formato';
import { LIMITE_EMPRESTIMO, simularEmprestimo, TAXA_EMPRESTIMO_MENSAL } from '../dominio/emprestimo';
import { useResumo } from '../estado/radar';
import { cor, espaco } from '../tema/tokens';

const PARCELAS = [6, 12, 18, 24];

function LinhaValor({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <View style={estilos.linhaValor}>
      <Texto variante={forte ? 'corpoForte' : 'corpo'} style={estilos.rotulo}>
        {rotulo}
      </Texto>
      <Texto variante={forte ? 'valor' : 'corpo'} cor={forte ? cor.destaqueTexto : cor.texto}>
        {valor}
      </Texto>
    </View>
  );
}

export function Emprestimo() {
  const resumo = useResumo();
  // Rascunho local: a simulação não sai desta tela.
  const [texto, setTexto] = useState('5.000,00');
  const [parcelas, setParcelas] = useState(12);

  const valor = lerValor(texto);
  const erro =
    valor === null ? 'Escreva só o valor, por exemplo 5000 ou 2.500,00.' : valor > LIMITE_EMPRESTIMO ? `O máximo disponível é ${dinheiro(LIMITE_EMPRESTIMO)}.` : null;
  const sim = valor !== null && !erro ? simularEmprestimo(valor, parcelas) : null;

  // O que o resto do app sabe e o banco não diz: quanto da parcela as assinaturas pagariam.
  const cortavel = resumo.economiaAnual > 0 ? Math.round(resumo.economiaAnual / 12) : resumo.totalMensal;
  const cobre = sim ? Math.min(1, cortavel / sim.parcela) : 0;

  return (
    <Tela topo={<Voltar />} titulo="Empréstimo" sobretitulo={`Valor disponível de até ${dinheiro(LIMITE_EMPRESTIMO)}`}>
      <CampoTexto rotulo="Quanto você precisa?" value={texto} onChangeText={setTexto} keyboardType="decimal-pad" erro={erro} />

      <Secao titulo="Em quantas vezes?">
        <View style={estilos.fichas} accessibilityRole="radiogroup">
          {PARCELAS.map((n) => (
            <Ficha key={n} papel="radio" rotulo={`${n}x`} marcada={n === parcelas} aoTocar={() => setParcelas(n)} />
          ))}
        </View>
      </Secao>

      {sim && (
        <Secao titulo="Como fica">
          <Texto variante="valorGrande">{`${sim.parcelas}x ${dinheiro(sim.parcela)}`}</Texto>
          <View style={estilos.contas}>
            <LinhaValor rotulo="Você recebe" valor={dinheiro(sim.valor)} />
            <LinhaValor rotulo="Juros" valor={`+ ${dinheiro(sim.juros)}`} />
            <LinhaValor rotulo="Total a pagar" valor={dinheiro(sim.total)} forte />
          </View>
          <Texto variante="apoio" cor={cor.textoSuave}>
            {`Taxa de exemplo de ${porcentagem(sim.taxaMensal, 2)} ao mês (${porcentagem(sim.taxaAnual, 1)} ao ano), sem IOF. É uma simulação, não uma oferta de crédito.`}
          </Texto>

          <Cartao destaque style={estilos.destaque}>
            <Texto variante="corpo">
              {resumo.economiaAnual > 0 ? 'Cancelando as assinaturas que você marcou, sobram ' : 'Suas assinaturas somam '}
              <Texto variante="valor" cor={cor.destaqueTexto}>
                {dinheiro(cortavel)}
              </Texto>
              {` por mês: isso paga ${porcentagem(cobre, 0)} dessa parcela.`}
            </Texto>
          </Cartao>
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  contas: { gap: espaco.s, marginVertical: espaco.s },
  linhaValor: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  rotulo: { flex: 1 },
  destaque: { marginTop: espaco.m },
});
