import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { LinhaDado } from '../componentes/LinhaDado';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import {
  agenciaValida,
  contaValida,
  erroDoValor,
  NOME_DO_ENVIO,
  PARCELAS_PIX_CREDITO,
  simularPixNoCredito,
  type Envio,
  type TipoEnvio,
} from '../dominio/conta';
import { dataCurta } from '../dominio/datas';
import { dinheiro, lerValor, porcentagem } from '../dominio/formato';
import { NOME_DO_TIPO_DE_CHAVE, normalizarChave } from '../dominio/pix';
import { useConta, useFatura, useSaldoConta } from '../estado/conta';
import { useNavegacao } from '../estado/navegacao';
import { cor, espaco, raio } from '../tema/tokens';

const DICA_DO_MODO: Record<TipoEnvio, string> = {
  pix: 'Na hora, a qualquer hora, sem tarifa. Sai do saldo da sua conta.',
  transferencia: 'Para conta de outro banco, com agência e conta. Sai do saldo da sua conta.',
  pixCredito: 'Manda um Pix usando o limite do cartão, e você paga na fatura, à vista ou parcelado.',
};

/** Fazer um Pix, uma transferência ou um Pix no crédito: preencher, conferir e confirmar. */
export function Enviar({ modo }: { modo: TipoEnvio }) {
  const saldo = useSaldoConta();
  const fatura = useFatura();
  const enviar = useConta((s) => s.enviar);
  const concluir = useNavegacao((s) => s.concluir);

  // Rascunho local: só vira envio ao confirmar.
  const [chave, setChave] = useState('');
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [tentou, setTentou] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const ehPix = modo !== 'transferencia';
  const valor = lerValor(valorTexto);
  const reconhecida = ehPix ? normalizarChave(chave) : null;
  const sim = modo === 'pixCredito' && valor !== null ? simularPixNoCredito(valor, parcelas) : null;

  const erros = {
    chave: !ehPix ? null : !chave.trim() ? 'Escreva a chave Pix de quem vai receber.' : !reconhecida ? 'Não reconheci essa chave. Confira se digitou certinho.' : null,
    nome: !ehPix && !nome.trim() ? 'Escreva o nome de quem vai receber.' : null,
    banco: !ehPix && !banco.trim() ? 'Escreva o banco.' : null,
    agencia: !ehPix && !agenciaValida(agencia) ? 'A agência tem até 5 números, ex.: 0001.' : null,
    conta: !ehPix && !contaValida(conta) ? 'Escreva a conta com o dígito, ex.: 12345-6.' : null,
    valor: erroDoValor(modo, valor, { saldo, limite: fatura.limiteDisponivel }, parcelas),
  };
  const mostrar = (e: string | null) => (tentou ? e : null);
  const temErro = Object.values(erros).some(Boolean);

  const destino = ehPix
    ? reconhecida
      ? `Chave ${NOME_DO_TIPO_DE_CHAVE[reconhecida.tipo].toLowerCase()}: ${reconhecida.chave}`
      : ''
    : `${banco.trim()} · ag. ${agencia.trim()} · conta ${conta.trim()}`;
  const para = nome.trim() || (reconhecida ? reconhecida.chave : '');
  const saiDe = sim ? `Cartão de crédito, ${sim.parcelas}x de ${dinheiro(sim.parcela)}` : 'Saldo da conta';

  const revisar = () => {
    setTentou(true);
    if (!temErro) setRevisando(true);
  };

  const confirmar = () => {
    if (valor === null || temErro) return;
    const envio: Omit<Envio, 'id' | 'data'> = {
      tipo: modo,
      valor,
      para,
      destino,
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(sim ? { credito: { parcelas: sim.parcelas, parcela: sim.parcela, total: sim.total, juros: sim.juros } } : {}),
    };
    const id = enviar(envio);
    concluir('inicio', [{ nome: 'comprovante', id }]);
  };

  const disponivel =
    modo === 'pixCredito' ? `Limite disponível ${dinheiro(fatura.limiteDisponivel)}` : `Saldo em conta ${dinheiro(saldo)}`;

  if (revisando && valor !== null) {
    return (
      <Tela topo={<Voltar />} titulo="Confira antes de enviar" sobretitulo={NOME_DO_ENVIO[modo]}>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`Você vai enviar para ${para}`}
        </Texto>
        <Texto variante="valorGrande">{dinheiro(valor)}</Texto>
        <View style={estilos.resumo}>
          {nome.trim() !== '' && <LinhaDado rotulo="Para" valor={nome.trim()} />}
          <LinhaDado rotulo={ehPix ? 'Chave' : 'Conta'} valor={destino} />
          <LinhaDado rotulo="Sai de" valor={saiDe} />
          {sim && <LinhaDado rotulo="Juros" valor={`+ ${dinheiro(sim.juros)} (${porcentagem(sim.taxaMensal, 2)} ao mês)`} />}
          {sim && <LinhaDado rotulo="Total na fatura" valor={dinheiro(sim.total)} forte />}
          {sim && <LinhaDado rotulo="1ª parcela" valor={`Na fatura que vence em ${dataCurta(fatura.vencimento)}`} />}
          {descricao.trim() !== '' && <LinhaDado rotulo="Descrição" valor={descricao.trim()} />}
          <LinhaDado rotulo="Quando" valor="Agora" />
        </View>
        <View style={estilos.acoes}>
          <Botao variante="primario" icone="paper-plane-outline" rotulo={`Confirmar e enviar ${dinheiro(valor)}`} aoTocar={confirmar} />
          <Botao variante="link" rotulo="Corrigir" aoTocar={() => setRevisando(false)} />
        </View>
        <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.aviso}>
          Demonstração: nenhum dinheiro de verdade é movimentado.
        </Texto>
      </Tela>
    );
  }

  return (
    <Tela topo={<Voltar />} titulo={NOME_DO_ENVIO[modo]} sobretitulo={disponivel}>
      <View style={estilos.dica}>
        <Ionicons
          name={modo === 'transferencia' ? 'swap-horizontal-outline' : modo === 'pixCredito' ? 'card-outline' : 'flash-outline'}
          size={20}
          color={cor.destaqueTexto}
        />
        <Texto variante="apoio" cor={cor.textoSuave} style={estilos.dicaTexto}>
          {DICA_DO_MODO[modo]}
        </Texto>
      </View>

      <Secao titulo="Para quem">
        <View style={estilos.campos}>
          {ehPix ? (
            <>
              <CampoTexto
                rotulo="Chave Pix"
                value={chave}
                onChangeText={setChave}
                placeholder="CPF, celular, e-mail ou aleatória"
                autoCapitalize="none"
                autoCorrect={false}
                erro={mostrar(erros.chave)}
                ajuda={reconhecida ? `Reconhecida: ${NOME_DO_TIPO_DE_CHAVE[reconhecida.tipo]}` : undefined}
              />
              <CampoTexto rotulo="Nome de quem recebe" value={nome} onChangeText={setNome} placeholder="Ex.: Bruno Lima" ajuda="Opcional. Aparece no comprovante." />
            </>
          ) : (
            <>
              <CampoTexto rotulo="Nome de quem recebe" value={nome} onChangeText={setNome} placeholder="Como está no banco" erro={mostrar(erros.nome)} />
              <CampoTexto rotulo="Banco" value={banco} onChangeText={setBanco} placeholder="Nome ou número do banco" erro={mostrar(erros.banco)} />
              <View style={estilos.lado}>
                <View style={estilos.metade}>
                  <CampoTexto rotulo="Agência" value={agencia} onChangeText={setAgencia} placeholder="0001" keyboardType="number-pad" erro={mostrar(erros.agencia)} />
                </View>
                <View style={estilos.metade}>
                  <CampoTexto rotulo="Conta" value={conta} onChangeText={setConta} placeholder="12345-6" erro={mostrar(erros.conta)} />
                </View>
              </View>
            </>
          )}
        </View>
      </Secao>

      <Secao titulo="Quanto">
        <View style={estilos.campos}>
          <CampoTexto rotulo="Valor" value={valorTexto} onChangeText={setValorTexto} placeholder="0,00" keyboardType="decimal-pad" erro={mostrar(erros.valor)} />
          {ehPix && <CampoTexto rotulo="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Ex.: pizza de sexta" ajuda="Opcional." />}
        </View>
      </Secao>

      {modo === 'pixCredito' && (
        <Secao titulo="Em quantas vezes?">
          <View style={estilos.fichas} accessibilityRole="radiogroup">
            {PARCELAS_PIX_CREDITO.map((n) => (
              <Ficha key={n} papel="radio" rotulo={`${n}x`} marcada={n === parcelas} aoTocar={() => setParcelas(n)} />
            ))}
          </View>
          {sim ? (
            <Cartao destaque style={estilos.simulacao}>
              <Texto variante="valorMedio">{`${sim.parcelas}x de ${dinheiro(sim.parcela)}`}</Texto>
              <Texto variante="apoio">
                {`Total na fatura ${dinheiro(sim.total)}, com ${dinheiro(sim.juros)} de juros. Taxa de exemplo de ${porcentagem(sim.taxaMensal, 2)} ao mês.`}
              </Texto>
            </Cartao>
          ) : (
            <Texto variante="apoio" cor={cor.textoSuave} style={estilos.simulacao}>
              Escreva o valor para ver as parcelas.
            </Texto>
          )}
        </Secao>
      )}

      <View style={estilos.acoes}>
        <Botao variante="primario" rotulo="Continuar" aoTocar={revisar} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  dica: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
  dicaTexto: { flex: 1 },
  campos: { gap: espaco.l, marginTop: espaco.s },
  lado: { flexDirection: 'row', gap: espaco.m },
  metade: { flex: 1 },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  simulacao: { marginTop: espaco.m, gap: espaco.xs },
  resumo: { marginTop: espaco.l, paddingHorizontal: espaco.l, paddingVertical: espaco.s, borderRadius: raio.m, borderWidth: 1, borderColor: cor.borda },
  acoes: { marginTop: espaco.xl, gap: espaco.s },
  aviso: { marginTop: espaco.l, textAlign: 'center' },
});
