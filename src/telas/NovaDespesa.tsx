import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { hoje } from '../dominio/datas';
import { lerValor } from '../dominio/formato';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { cor, espaco } from '../tema/tokens';

/**
 * Uma conta que um amigo pagou (não está no seu cartão): o que foi, quanto e quem pagou.
 * Depois, o mesmo "Montar racha" de sempre decide quem entra e como dividir.
 */
export function NovaDespesa() {
  const pessoas = useRachas((s) => s.pessoas);
  const ir = useNavegacao((s) => s.ir);
  const [descricao, setDescricao] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [pagouId, setPagouId] = useState<string | null>(null);
  const [tentou, setTentou] = useState(false);

  const valor = lerValor(valorTexto);
  const erros = {
    descricao: !descricao.trim() ? 'Escreva o que foi, por exemplo “Uber da volta”.' : null,
    valor: valor === null ? 'Escreva o valor, por exemplo 36 ou 120,50.' : null,
    pagou: !pagouId ? 'Escolha quem pagou.' : null,
  };

  const continuar = () => {
    setTentou(true);
    if (erros.descricao || erros.valor || erros.pagou || valor === null || !pagouId) return;
    ir({
      nome: 'montarRacha',
      titulo: descricao.trim(),
      origem: { tipo: 'manual', descricao: descricao.trim(), data: hoje(), valor },
      pagouId,
    });
  };

  return (
    <Tela topo={<Voltar />} titulo="Alguém pagou" sobretitulo="Conta que não passou no seu cartão">
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        Registre o que um amigo pagou por todo mundo. A sua parte entra em “Você deve”, e o que ele te deve é
        descontado na hora de cobrar.
      </Texto>
      <View style={estilos.campos}>
        <CampoTexto rotulo="O que foi" value={descricao} onChangeText={setDescricao} placeholder="Ex.: Uber da volta" erro={tentou ? erros.descricao : null} />
        <CampoTexto rotulo="Valor total" value={valorTexto} onChangeText={setValorTexto} placeholder="0,00" keyboardType="decimal-pad" erro={tentou ? erros.valor : null} />
      </View>
      <Secao titulo="Quem pagou?">
        <View style={estilos.fichas} accessibilityRole="radiogroup">
          {pessoas.map((p) => (
            <Ficha key={p.id} papel="radio" rotulo={p.nome} marcada={pagouId === p.id} aoTocar={() => setPagouId(p.id)} />
          ))}
        </View>
        {tentou && erros.pagou && (
          <Texto variante="apoio" cor={cor.perigoSobreFundo}>
            {erros.pagou}
          </Texto>
        )}
      </Secao>
      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Continuar" aoTocar={continuar} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: espaco.l, marginTop: espaco.l },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  acao: { marginTop: espaco.xl },
});
