import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Secao } from '../componentes/Cartao';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { NOME_DO_TIPO_DE_CHAVE, normalizarChave } from '../dominio/pix';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { cor, espaco } from '../tema/tokens';

/** Como você recebe nas cobranças: chave Pix e, se quiser, dados para transferência. */
export function SeuPix() {
  const pix = useRachas((s) => s.pix);
  const transferencia = useRachas((s) => s.transferencia);
  const salvarPix = useRachas((s) => s.salvarPix);
  const salvarTransferencia = useRachas((s) => s.salvarTransferencia);
  const voltar = useNavegacao((s) => s.voltar);
  // Rascunho local: só vai para a loja ao tocar em Salvar.
  const [chave, setChave] = useState(pix.chave);
  const [nome, setNome] = useState(pix.nome);
  const [cidade, setCidade] = useState(pix.cidade);
  const [banco, setBanco] = useState(transferencia.banco);
  const [agencia, setAgencia] = useState(transferencia.agencia);
  const [conta, setConta] = useState(transferencia.conta);
  const [tentou, setTentou] = useState(false);

  const reconhecida = normalizarChave(chave);
  // A chave é opcional (dá para receber só por transferência), mas, se escrita, tem que valer.
  const erroChave = tentou && chave.trim() && !reconhecida ? 'Não reconheci essa chave. Confira se digitou certinho.' : null;
  const erroNome = tentou && !nome.trim() ? 'Escreva seu nome: ele aparece para quem vai pagar.' : null;
  const comecouTransferencia = Boolean(banco.trim() || agencia.trim() || conta.trim());
  const faltaNaTransferencia = (v: string) => (tentou && comecouTransferencia && !v.trim() ? 'Preencha para oferecer transferência.' : null);
  const erroGeral = tentou && !chave.trim() && !comecouTransferencia ? 'Cadastre a chave Pix, os dados de transferência ou os dois.' : null;

  const salvar = () => {
    setTentou(true);
    if (!nome.trim() || (chave.trim() && !reconhecida)) return;
    if (!chave.trim() && !comecouTransferencia) return;
    if (comecouTransferencia && !(banco.trim() && agencia.trim() && conta.trim())) return;
    salvarPix({ chave: chave.trim(), nome: nome.trim(), cidade: cidade.trim() });
    salvarTransferencia({ banco: banco.trim(), agencia: agencia.trim(), conta: conta.trim() });
    voltar();
  };

  return (
    <Tela topo={<Voltar />} titulo="Como você recebe">
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        É o que vai na cobrança: com a chave Pix, o QR Code e o copia e cola saem no valor exato. Tudo fica
        guardado só no seu celular.
      </Texto>
      <View style={estilos.campos}>
        <CampoTexto rotulo="Seu nome" value={nome} onChangeText={setNome} placeholder="Como está no banco" erro={erroNome} />
      </View>

      <Secao titulo="Pix">
        <View style={estilos.campos}>
          <CampoTexto
            rotulo="Chave Pix"
            value={chave}
            onChangeText={setChave}
            placeholder="CPF, celular, e-mail ou aleatória"
            autoCapitalize="none"
            autoCorrect={false}
            erro={erroChave}
            ajuda={reconhecida ? `Reconhecida: ${NOME_DO_TIPO_DE_CHAVE[reconhecida.tipo]}` : 'Celular com DDD, ex.: (11) 98765-4321'}
          />
          <CampoTexto rotulo="Cidade" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo" ajuda="Opcional" />
        </View>
      </Secao>

      <Secao titulo="Transferência">
        <Texto variante="apoio" cor={cor.textoSobreFundo}>
          Opcional, para quem prefere transferir. O titular é o seu nome, lá em cima.
        </Texto>
        <View style={estilos.campos}>
          <CampoTexto rotulo="Banco" value={banco} onChangeText={setBanco} placeholder="Nome ou número do banco" erro={faltaNaTransferencia(banco)} />
          <CampoTexto rotulo="Agência" value={agencia} onChangeText={setAgencia} placeholder="0001" keyboardType="number-pad" erro={faltaNaTransferencia(agencia)} />
          <CampoTexto rotulo="Conta" value={conta} onChangeText={setConta} placeholder="12345678-9" erro={faltaNaTransferencia(conta)} />
        </View>
      </Secao>

      {erroGeral && (
        <Texto variante="apoio" cor={cor.perigoSobreFundo} style={estilos.erro}>
          {erroGeral}
        </Texto>
      )}
      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Salvar" aoTocar={salvar} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: espaco.l, marginTop: espaco.s },
  erro: { marginTop: espaco.l },
  acao: { marginTop: espaco.xl },
});
