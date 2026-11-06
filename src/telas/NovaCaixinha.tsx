import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Cartao } from '../componentes/Cartao';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dinheiro, lerValor } from '../dominio/formato';
import { mesesParaMeta, simularAportesMensais } from '../dominio/investimentos';
import { useInvestimentos } from '../estado/investimentos';
import { useNavegacao, type SugestaoDeCaixinha } from '../estado/navegacao';
import { cor, espaco } from '../tema/tokens';

/** Centavos para o que aparece no campo: 4490 → "44,90". */
function paraCampo(centavos: number): string {
  return centavos > 0 ? dinheiro(centavos).replace(/^R\$\s/, '') : '';
}

/** "1 mês", "8 meses", "2 anos e 3 meses" */
function duracao(meses: number): string {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const m = resto === 1 ? '1 mês' : `${resto} meses`;
  if (anos === 0) return m;
  const a = anos === 1 ? '1 ano' : `${anos} anos`;
  return resto === 0 ? a : `${a} e ${m}`;
}

export function NovaCaixinha({ sugestao }: { sugestao?: SugestaoDeCaixinha }) {
  const criar = useInvestimentos((s) => s.criar);
  const concluir = useNavegacao((s) => s.concluir);
  // Rascunho local: só vira caixinha ao tocar em Criar.
  const [nome, setNome] = useState(sugestao?.nome ?? '');
  const [meta, setMeta] = useState('');
  const [mensal, setMensal] = useState(paraCampo(sugestao?.aporteMensal ?? 0));
  const [agora, setAgora] = useState('');
  const [tentou, setTentou] = useState(false);

  const valorMeta = meta.trim() ? lerValor(meta) : 0;
  const valorMensal = mensal.trim() ? lerValor(mensal) : 0;
  const valorAgora = agora.trim() ? lerValor(agora) : 0;
  const invalido = (v: number | null) => (v === null ? 'Escreva só o valor, por exemplo 150 ou 44,90.' : null);
  const erroNome = tentou && !nome.trim() ? 'Dê um nome para a caixinha.' : null;
  const erroDinheiro = tentou && !valorMensal && !valorAgora ? 'Guarde algo agora ou todo mês para a caixinha começar.' : null;

  let previsao: string | null = null;
  if (valorMeta && (valorMensal || valorAgora)) {
    const m = mesesParaMeta(valorMeta, valorMensal ?? 0, valorAgora ?? 0);
    previsao = m === null ? 'Nesse ritmo a meta não chega. Tente guardar mais por mês.' : m === 0 ? 'O primeiro depósito já bate a meta.' : `Nesse ritmo, você chega em ${dinheiro(valorMeta)} em ${duracao(m)}.`;
  } else if (valorMensal) {
    previsao = `Guardando ${dinheiro(valorMensal)} por mês, em 1 ano teria ${dinheiro(simularAportesMensais(valorMensal, 12).liquido)} (já descontado o IR).`;
  }

  const salvar = () => {
    setTentou(true);
    if (!nome.trim() || valorMeta === null || valorMensal === null || valorAgora === null) return;
    if (!valorMensal && !valorAgora) return;
    const id = criar({
      nome,
      meta: valorMeta || null,
      aporteMensal: valorMensal,
      primeiroDeposito: valorAgora,
      ...(sugestao?.origem ? { origem: sugestao.origem } : {}),
    });
    concluir('investir', [{ nome: 'caixinha', id }]);
  };

  return (
    <Tela topo={<Voltar />} titulo="Nova caixinha" sobretitulo={sugestao?.origem ? `Com o que sobra sem ${sugestao.origem.nome}` : 'Rende 100% do CDI'}>
      <Cartao style={estilos.form}>
        <CampoTexto rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Viagem, Reserva, Celular novo" erro={erroNome} />
        <CampoTexto
          rotulo="Meta"
          value={meta}
          onChangeText={setMeta}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          ajuda="Opcional"
          erro={invalido(valorMeta)}
        />
        <CampoTexto
          rotulo="Guardar todo mês"
          value={mensal}
          onChangeText={setMensal}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          ajuda="Cai sozinho, todo mês, no dia de hoje"
          erro={invalido(valorMensal) ?? erroDinheiro}
        />
        <CampoTexto
          rotulo="Guardar agora"
          value={agora}
          onChangeText={setAgora}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          ajuda="Opcional"
          erro={invalido(valorAgora)}
        />
      </Cartao>

      {previsao && (
        <Cartao destaque style={estilos.previsao}>
          <Texto variante="corpo">{previsao}</Texto>
        </Cartao>
      )}

      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Criar caixinha" aoTocar={salvar} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  form: { gap: espaco.l },
  previsao: { marginTop: espaco.m },
  acao: { marginTop: espaco.xl },
});
