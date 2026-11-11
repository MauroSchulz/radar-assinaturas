import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, categoriaDaPessoa } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { LinhaRacha } from '../componentes/LinhaRacha';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { dataCurta } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import type { Saldo } from '../dominio/racha';
import { temPix } from '../estado/cobrar';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { useCotas, useSaldos } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

/** Quantos rostos aparecem empilhados no cartão do total; o resto vira "+N". */
const ROSTOS_NO_TOTAL = 4;
const LADO_DO_ROSTO = 30;

export function Rachar() {
  const saldos = useSaldos();
  const cotas = useCotas();
  const rachas = useRachas((s) => s.rachas);
  const chavePix = useRachas((s) => s.pix.chave);
  const ir = useNavegacao((s) => s.ir);

  // Um pelo outro: quem te deve (saldo positivo) e a quem você deve (negativo).
  const devedores = saldos.filter((s) => s.liquido > 0);
  const credores = saldos.filter((s) => s.liquido < 0);
  const totalDevido = devedores.reduce((s, x) => s + x.liquido, 0);
  const totalVoceDeve = credores.reduce((s, x) => s - x.liquido, 0);
  // Quanto dos rachas já voltou para você: o que foi pago sobre tudo o que os amigos devem.
  const aReceber = cotas.filter((c) => c.direcao === 'teDeve');
  const totalDasCotas = aReceber.reduce((s, c) => s + c.valor, 0);
  const recebido = aReceber.filter((c) => c.pagoEm).reduce((s, c) => s + c.valor, 0);
  const fracaoRecebida = totalDasCotas > 0 ? recebido / totalDasCotas : 0;
  const rachasAbertos = rachas.filter((r) => cotas.some((c) => c.rachaId === r.id && !c.pagoEm)).length;

  return (
    <Tela titulo="Rachar" sobretitulo="Contas divididas com os amigos">
      <View
        style={estilos.total}
        accessible
        accessibilityLabel={
          totalDevido > 0
            ? `Te devem ${dinheiro(totalDevido)}, ${devedores.length} ${devedores.length === 1 ? 'pessoa' : 'pessoas'}.${totalVoceDeve ? ` Você deve ${dinheiro(totalVoceDeve)}.` : ''} Já recebeu ${dinheiro(recebido)} de ${dinheiro(totalDasCotas)}.`
            : 'Ninguém te deve nada agora'
        }
      >
        <Texto variante="corpo" cor={cor.sobreDestaqueSuave}>
          Te devem
        </Texto>
        <Texto variante="valorGrande" cor={cor.sobreDestaque}>
          {dinheiro(totalDevido)}
        </Texto>

        {totalDevido > 0 ? (
          <View style={estilos.quem}>
            <View style={estilos.rostos}>
              {devedores.slice(0, ROSTOS_NO_TOTAL).map(({ pessoa }, i) => (
                <View key={pessoa.id} style={[estilos.rosto, i > 0 && estilos.rostoSobreposto]}>
                  <Avatar nome={pessoa.nome} categoria={categoriaDaPessoa(pessoa.nome)} tamanho={LADO_DO_ROSTO} redondo />
                </View>
              ))}
              {devedores.length > ROSTOS_NO_TOTAL && (
                <View style={[estilos.rosto, estilos.rostoSobreposto, estilos.mais]}>
                  <Texto variante="legenda" cor={cor.sobreDestaque}>{`+${devedores.length - ROSTOS_NO_TOTAL}`}</Texto>
                </View>
              )}
            </View>
            <Texto variante="apoio" cor={cor.sobreDestaqueSuave} style={estilos.quemTexto}>
              {`${devedores.length} ${devedores.length === 1 ? 'pessoa' : 'pessoas'} · ${rachasAbertos} ${rachasAbertos === 1 ? 'racha aberto' : 'rachas abertos'}`}
            </Texto>
          </View>
        ) : (
          <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
            Ninguém te deve nada agora.
          </Texto>
        )}

        {totalVoceDeve > 0 && (
          <Texto variante="apoio" cor={cor.sobreDestaqueSuave} style={estilos.voceDeveTopo}>
            {`E você deve ${dinheiro(totalVoceDeve)} a ${credores.map((c) => c.pessoa.nome).join(' e ')}.`}
          </Texto>
        )}

        {totalDasCotas > 0 && (
          <View style={estilos.progresso}>
            <View style={estilos.progressoTexto}>
              <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
                Já recebido
              </Texto>
              <Texto variante="apoio" cor={cor.sobreDestaque} style={estilos.numero}>
                {`${dinheiro(recebido)} de ${dinheiro(totalDasCotas)}`}
              </Texto>
            </View>
            <View style={estilos.trilho} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={[estilos.cheio, { width: `${Math.round(fracaoRecebida * 100)}%` }]} />
            </View>
          </View>
        )}
      </View>

      <View style={estilos.acao}>
        <Botao variante="primario" icone="add-circle-outline" rotulo="Rachar uma compra" aoTocar={() => ir({ nome: 'escolherCompra' })} />
        <View style={estilos.acoesLado}>
          {devedores.length > 0 && (
            <View style={estilos.metade}>
              <Botao icone="paper-plane-outline" rotulo="Cobrar todos" aoTocar={() => ir({ nome: 'cobrarTodos' })} />
            </View>
          )}
          <View style={estilos.metade}>
            <Botao icone="person-add-outline" rotulo="Alguém pagou" aoTocar={() => ir({ nome: 'novaDespesa' })} />
          </View>
        </View>
      </View>

      {!temPix(chavePix) && (
        <Cartao destaque style={estilos.dica}>
          <View style={estilos.dicaLinha}>
            <Ionicons name="qr-code-outline" size={22} color={cor.destaqueTexto} importantForAccessibility="no" accessibilityElementsHidden />
            <Texto variante="apoio" style={estilos.dicaTexto}>
              Cadastre sua chave Pix e a cobrança já vai com o QR Code e o copia e cola, no valor certo.
            </Texto>
          </View>
          <View style={estilos.dicaAcao}>
            <Botao variante="link" rotulo="Cadastrar chave Pix" aoTocar={() => ir({ nome: 'seuPix' })} />
          </View>
        </Cartao>
      )}

      {devedores.length > 0 && (
        <Secao titulo="Quem te deve">
          <Lista>
            {devedores.map((saldo) => (
              <LinhaPessoa key={saldo.pessoa.id} saldo={saldo} aoTocar={() => ir({ nome: 'cobranca', pessoaId: saldo.pessoa.id })} />
            ))}
          </Lista>
        </Secao>
      )}

      {credores.length > 0 && (
        <Secao titulo="Você deve">
          <Lista>
            {credores.map((saldo) => (
              <LinhaPessoa key={saldo.pessoa.id} saldo={saldo} aoTocar={() => ir({ nome: 'pagarAmigo', pessoaId: saldo.pessoa.id })} />
            ))}
          </Lista>
        </Secao>
      )}

      {rachas.length > 0 && (
        <Secao titulo={`Rachas (${rachas.length})`}>
          <Lista>
            {rachas.map((r) => (
              <LinhaRacha
                key={r.id}
                racha={r}
                cotas={cotas.filter((c) => c.rachaId === r.id)}
                aoTocar={() => ir({ nome: 'racha', id: r.id })}
              />
            ))}
          </Lista>
        </Secao>
      )}

      {temPix(chavePix) && (
        <View style={estilos.rodape}>
          <Botao variante="link" icone="wallet-outline" rotulo="Como você recebe (Pix e transferência)" aoTocar={() => ir({ nome: 'seuPix' })} />
        </View>
      )}
    </Tela>
  );
}

/**
 * Uma pessoa com saldo: se te deve, a linha abre a cobrança; se você deve, abre o "Pagar".
 * O valor é um pelo outro.
 */
function LinhaPessoa({ saldo, aoTocar }: { saldo: Saldo; aoTocar: () => void }) {
  const { pessoa, liquido, devendo, voceDeve, pendentes, desde } = saldo;
  const teDeve = liquido > 0;
  const valor = Math.abs(liquido);
  const quantas = `${pendentes.length} ${pendentes.length === 1 ? 'pendência' : 'pendências'}`;
  // Com as duas direções, mostra o "um pelo outro".
  const detalhe =
    devendo > 0 && voceDeve > 0 ? `te deve ${dinheiro(devendo)}, você deve ${dinheiro(voceDeve)}` : `${quantas} · desde ${dataCurta(desde)}`;
  const acao = teDeve ? 'Cobrar' : 'Pagar';
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${acao} ${pessoa.nome}, ${dinheiro(valor)}, ${detalhe}`}
      style={({ pressed }) => [estilos.linhaPessoa, pressed && estilos.pressionada]}
    >
      <Avatar nome={pessoa.nome} categoria={categoriaDaPessoa(pessoa.nome)} redondo />
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {pessoa.nome}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={1}>
          {detalhe}
        </Texto>
      </View>
      <View style={estilos.fim}>
        <Texto variante="valor">{dinheiro(valor)}</Texto>
        <View style={estilos.pilulaCobrar}>
          <Texto variante="legenda" cor={cor.destaqueTexto}>
            {acao}
          </Texto>
          <Ionicons name="chevron-forward" size={14} color={cor.destaqueTexto} />
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  total: { backgroundColor: cor.destaque, borderRadius: raio.l, padding: espaco.xl, gap: espaco.xs },
  quem: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, marginTop: espaco.xs },
  rostos: { flexDirection: 'row' },
  // Borda da cor do cartão: separa um rosto do outro quando se sobrepõem.
  rosto: { borderRadius: raio.pilula, borderWidth: 2, borderColor: cor.destaque },
  rostoSobreposto: { marginLeft: -espaco.s },
  mais: {
    width: LADO_DO_ROSTO + 4,
    height: LADO_DO_ROSTO + 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cor.trilhoSobreDestaque,
  },
  quemTexto: { flexShrink: 1 },
  progresso: { marginTop: espaco.l, gap: espaco.s },
  progressoTexto: { flexDirection: 'row', justifyContent: 'space-between', gap: espaco.s },
  numero: { fontVariant: ['tabular-nums'] },
  trilho: { height: 6, borderRadius: raio.pilula, backgroundColor: cor.trilhoSobreDestaque, overflow: 'hidden' },
  cheio: { height: '100%', borderRadius: raio.pilula, backgroundColor: cor.sobreDestaque },
  acao: { marginTop: espaco.m, gap: espaco.s },
  acoesLado: { flexDirection: 'row', gap: espaco.s },
  metade: { flex: 1 },
  voceDeveTopo: { marginTop: espaco.xs },
  dica: { marginTop: espaco.m, gap: espaco.xs },
  dicaLinha: { flexDirection: 'row', gap: espaco.m, alignItems: 'flex-start' },
  dicaTexto: { flex: 1 },
  dicaAcao: { alignItems: 'flex-start', marginLeft: -espaco.s },
  linhaPessoa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  meio: { flex: 1, gap: 2 },
  fim: { alignItems: 'flex-end', gap: espaco.xs },
  pilulaCobrar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: espaco.s + 2,
    paddingRight: espaco.xs + 2,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    backgroundColor: cor.destaqueSuave,
  },
  rodape: { marginTop: espaco.l, alignItems: 'center' },
});
