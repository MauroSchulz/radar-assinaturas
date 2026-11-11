import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { Avatar, categoriaDaPessoa } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { diasEntre, hoje, quando } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { DIAS_PARA_LEMBRAR_DE_COBRAR } from '../dominio/lembretes';
import { montarCobranca, temPix, useContextoDeCobranca } from '../estado/cobrar';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { useSaldos } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

/**
 * Cobrar todo mundo que te deve, uma mensagem por pessoa (o WhatsApp manda uma de cada vez).
 * Quem já foi cobrado recebe a mensagem de lembrete, mais gentil.
 */
export function CobrarTodos() {
  const ctx = useContextoDeCobranca();
  const saldos = useSaldos();
  const registrar = useRachas((s) => s.registrarCobranca);
  const ir = useNavegacao((s) => s.ir);
  const devedores = saldos.filter((s) => s.liquido > 0);
  const total = devedores.reduce((s, d) => s + d.liquido, 0);
  const faltam = devedores.filter((d) => ctx.cobradoEm[d.pessoa.id] !== hoje()).length;

  const enviar = async (pessoaId: string) => {
    const c = montarCobranca(ctx, pessoaId);
    if (!c.mensagem) return;
    await Share.share({ message: c.mensagem });
    registrar(pessoaId);
  };

  return (
    <Tela topo={<Voltar />} titulo="Cobrar todos" sobretitulo={`${devedores.length} ${devedores.length === 1 ? 'pessoa' : 'pessoas'} te devem`}>
      <Texto variante="valorGrande">{dinheiro(total)}</Texto>
      <Texto variante="apoio" cor={cor.textoSuave}>
        {faltam === 0 ? 'Todo mundo já foi cobrado hoje.' : `Toque em Enviar em cada um: ${faltam === 1 ? 'falta 1' : `faltam ${faltam}`} para hoje.`}
      </Texto>

      {!temPix(ctx.pix.chave) && (
        <Cartao destaque style={estilos.dica}>
          <Texto variante="apoio">Cadastre sua chave Pix e cada mensagem já vai com o QR Code e o código no valor certo.</Texto>
          <View style={estilos.link}>
            <Botao variante="link" rotulo="Cadastrar chave Pix" aoTocar={() => ir({ nome: 'seuPix' })} />
          </View>
        </Cartao>
      )}

      <Lista>
        {devedores.map((d) => {
          const cobrado = ctx.cobradoEm[d.pessoa.id];
          const hojeSim = cobrado === hoje();
          const atrasado = !cobrado && diasEntre(d.desde, hoje()) >= DIAS_PARA_LEMBRAR_DE_COBRAR;
          const situacao = hojeSim
            ? 'Cobrado hoje'
            : cobrado
              ? `Cobrado ${quando(cobrado)} · vai como lembrete`
              : atrasado
                ? `Deve há ${diasEntre(d.desde, hoje())} dias · ainda não cobrado`
                : 'Ainda não cobrado';
          return (
            <View key={d.pessoa.id} style={estilos.linha}>
              <Avatar nome={d.pessoa.nome} categoria={categoriaDaPessoa(d.pessoa.nome)} redondo />
              <Pressable
                onPress={() => ir({ nome: 'cobranca', pessoaId: d.pessoa.id })}
                accessibilityRole="button"
                accessibilityLabel={`Ver cobrança de ${d.pessoa.nome}, ${dinheiro(d.liquido)}`}
                style={estilos.meio}
              >
                <Texto variante="corpoForte">{d.pessoa.nome}</Texto>
                <Texto variante="apoio" cor={atrasado ? cor.alerta : cor.textoSuave}>
                  {situacao}
                </Texto>
              </Pressable>
              <View style={estilos.fim}>
                <Texto variante="valor">{dinheiro(d.liquido)}</Texto>
                {hojeSim ? (
                  <View style={estilos.enviado} accessible accessibilityLabel={`${d.pessoa.nome}: cobrança enviada hoje`}>
                    <Ionicons name="checkmark-circle" size={16} color={cor.destaqueTexto} />
                    <Texto variante="legenda" cor={cor.destaqueTexto}>
                      Enviada
                    </Texto>
                  </View>
                ) : (
                  <Botao compacto variante="primario" rotulo="Enviar" nomeAcessivel={`Enviar cobrança para ${d.pessoa.nome}`} aoTocar={() => enviar(d.pessoa.id)} />
                )}
              </View>
            </View>
          );
        })}
      </Lista>
      <Texto variante="apoio" cor={cor.textoSobreFundo} style={estilos.rodape}>
        {`Se alguém não pagar em ${DIAS_PARA_LEMBRAR_DE_COBRAR} dias, o Radar te lembra no celular (com os avisos ligados).`}
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  dica: { marginTop: espaco.l, gap: espaco.xs },
  link: { alignItems: 'flex-start', marginLeft: -espaco.s },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 24,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
  },
  meio: { flex: 1, gap: 2, minHeight: ALVO_MINIMO, justifyContent: 'center' },
  fim: { alignItems: 'flex-end', gap: espaco.xs },
  enviado: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: ALVO_MINIMO, paddingHorizontal: espaco.s, borderRadius: raio.pilula },
  rodape: { marginTop: espaco.xl, textAlign: 'center' },
});
