import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Cartao } from '../componentes/Cartao';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { normalizarChave, type TipoChave } from '../dominio/pix';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { cor, espaco } from '../tema/tokens';

const NOME_DO_TIPO: Record<TipoChave, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  celular: 'Celular',
  email: 'E-mail',
  aleatoria: 'Chave aleatória',
};

export function SeuPix() {
  const salvo = useRachas((s) => s.pix);
  const salvarPix = useRachas((s) => s.salvarPix);
  const voltar = useNavegacao((s) => s.voltar);
  // Rascunho local: só vai para a loja ao tocar em Salvar.
  const [chave, setChave] = useState(salvo.chave);
  const [nome, setNome] = useState(salvo.nome);
  const [cidade, setCidade] = useState(salvo.cidade);
  const [tentou, setTentou] = useState(false);

  const reconhecida = normalizarChave(chave);
  const erroChave = tentou && !reconhecida ? 'Não reconheci essa chave. Confira se digitou certinho.' : null;
  const erroNome = tentou && !nome.trim() ? 'Escreva seu nome: ele aparece para quem vai pagar.' : null;

  const salvar = () => {
    setTentou(true);
    if (!reconhecida || !nome.trim()) return;
    salvarPix({ chave: chave.trim(), nome: nome.trim(), cidade: cidade.trim() });
    voltar();
  };

  return (
    <Tela topo={<Voltar />} titulo="Sua chave Pix">
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        Com ela, a cobrança já vai com o Pix copia e cola no valor exato. Quem recebe só cola no app do banco e
        paga. A chave fica guardada só no seu celular.
      </Texto>
      <Cartao style={estilos.form}>
        <CampoTexto
          rotulo="Chave Pix"
          value={chave}
          onChangeText={setChave}
          placeholder="CPF, celular, e-mail ou aleatória"
          autoCapitalize="none"
          autoCorrect={false}
          erro={erroChave}
          ajuda={reconhecida ? `Reconhecida: ${NOME_DO_TIPO[reconhecida.tipo]}` : 'Celular com DDD, ex.: (11) 98765-4321'}
        />
        <CampoTexto rotulo="Seu nome" value={nome} onChangeText={setNome} placeholder="Como está no banco" erro={erroNome} />
        <CampoTexto rotulo="Cidade" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo" ajuda="Opcional" />
      </Cartao>
      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Salvar" aoTocar={salvar} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  form: { marginTop: espaco.l, gap: espaco.l },
  acao: { marginTop: espaco.xl },
});
