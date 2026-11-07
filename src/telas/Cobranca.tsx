import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Ficha } from '../componentes/Ficha';
import { Lista } from '../componentes/Lista';
import { QrCode } from '../componentes/QrCode';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { FORMAS_DE_PAGAMENTO, type FormaDePagamento } from '../dominio/racha';
import { useCobranca } from '../estado/cobrar';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

const NOME_DA_FORMA: Record<FormaDePagamento, string> = {
  pixCopiaECola: 'Pix copia e cola',
  chavePix: 'Chave Pix',
  qrCode: 'QR Code',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
};

/** Tamanho do QR na tela: grande o bastante para a câmera ler de longe, sem ocupar a tela inteira. */
const LADO_DO_QR = 232;

export function Cobranca({ pessoaId, rachaId }: { pessoaId: string; rachaId?: string }) {
  const c = useCobranca(pessoaId, rachaId);
  const alternarForma = useRachas((s) => s.alternarForma);
  const marcarRecebido = useRachas((s) => s.marcarRecebido);
  const tituloDoRacha = useRachas((s) => (rachaId ? s.rachas.find((r) => r.id === rachaId)?.titulo : undefined));
  const ir = useNavegacao((s) => s.ir);
  const voltar = useNavegacao((s) => s.voltar);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!c.pessoa) return null;
  const nome = c.pessoa.nome;

  const copiar = async (texto: string, oQue: string) => {
    await Clipboard.setStringAsync(texto);
    setAviso(`${oQue} copiado.`);
  };

  return (
    <Tela
      topo={<Voltar />}
      titulo={`Cobrar ${nome}`}
      sobretitulo={tituloDoRacha ?? `${c.pendentes.length} ${c.pendentes.length === 1 ? 'pendência' : 'pendências'}`}
    >
      <Texto variante="apoio" cor={cor.textoSuave}>
        Total
      </Texto>
      <Texto variante="valorGrande">{dinheiro(c.total)}</Texto>

      {c.total === 0 ? (
        <Cartao destaque style={estilos.bloco}>
          <Texto variante="corpo">{`${nome} não deve nada${tituloDoRacha ? ' neste racha' : ''}. Tudo em dia!`}</Texto>
        </Cartao>
      ) : (
        <>
          <Lista recuo={espaco.l}>
            {c.itens.map((i, n) => (
              <View key={n} style={estilos.item}>
                <Texto variante="corpo" style={estilos.itemNome} numberOfLines={1}>
                  {`${i.titulo} · ${dataCurta(i.referente)}`}
                </Texto>
                <Texto variante="valor">{dinheiro(i.valor)}</Texto>
              </View>
            ))}
          </Lista>

          <Secao titulo="Pix">
            {c.pixCopiaECola ? (
              <View style={estilos.pix}>
                <View style={estilos.moldura}>
                  <QrCode valor={c.pixCopiaECola} tamanho={LADO_DO_QR} rotulo={`QR Code Pix de ${dinheiro(c.total)}`} />
                </View>
                <Texto variante="apoio" cor={cor.textoSuave} style={estilos.centro}>
                  {`Mostre para ${nome} pagar na hora, ou envie o código abaixo.`}
                </Texto>
                <View style={estilos.codigo}>
                  <Texto variante="apoio" numberOfLines={2} ellipsizeMode="middle" selectable>
                    {c.pixCopiaECola}
                  </Texto>
                </View>
                <Botao rotulo="Copiar código Pix" aoTocar={() => copiar(c.pixCopiaECola!, 'Código Pix')} />
              </View>
            ) : (
              <Cartao destaque style={estilos.dica}>
                <Texto variante="corpo">
                  Cadastre sua chave Pix e o QR Code e o copia e cola saem aqui, já com o valor certo.
                </Texto>
                <View style={estilos.link}>
                  <Botao variante="link" rotulo="Cadastrar chave Pix" aoTocar={() => ir({ nome: 'seuPix' })} />
                </View>
              </Cartao>
            )}
          </Secao>

          <Secao titulo="Formas de pagamento na mensagem">
            <View style={estilos.fichas}>
              {FORMAS_DE_PAGAMENTO.map((forma) => (
                <Ficha
                  key={forma}
                  rotulo={NOME_DA_FORMA[forma]}
                  marcada={c.escolhidas.includes(forma)}
                  desabilitada={!c.disponivel[forma]}
                  aoTocar={() => alternarForma(forma)}
                />
              ))}
            </View>
            {(!c.disponivel.chavePix || !c.disponivel.transferencia) && (
              <View style={estilos.link}>
                <Botao
                  variante="link"
                  rotulo={!c.disponivel.chavePix ? 'Cadastrar Pix e transferência' : 'Cadastrar dados de transferência'}
                  aoTocar={() => ir({ nome: 'seuPix' })}
                />
              </View>
            )}
          </Secao>

          <Secao titulo="Mensagem">
            <View style={estilos.mensagem}>
              <Texto variante="apoio" selectable>
                {c.mensagem}
              </Texto>
            </View>
            {aviso && (
              <Texto variante="apoio" cor={cor.destaqueTexto} accessibilityLiveRegion="polite">
                {aviso}
              </Texto>
            )}
            <View style={estilos.acoes}>
              <Botao variante="primario" rotulo="Enviar cobrança" dica="Abre o WhatsApp ou outro app para mandar" aoTocar={() => Share.share({ message: c.mensagem })} />
              <Botao rotulo="Copiar mensagem" aoTocar={() => copiar(c.mensagem, 'Mensagem')} />
              <Botao
                variante="link"
                rotulo={`Já recebi tudo de ${nome}`}
                aoTocar={() => {
                  marcarRecebido(c.pendentes.map((p) => p.chave));
                  voltar();
                }}
              />
            </View>
          </Secao>
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  bloco: { marginTop: espaco.l },
  item: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, minHeight: ALVO_MINIMO, paddingHorizontal: espaco.l },
  itemNome: { flex: 1 },
  pix: { alignItems: 'center', gap: espaco.m },
  // Fundo branco fixo em volta do QR, também no modo escuro.
  moldura: { padding: espaco.m, borderRadius: raio.m, backgroundColor: cor.qrFundo, borderWidth: 1, borderColor: cor.borda },
  centro: { textAlign: 'center' },
  codigo: { alignSelf: 'stretch', padding: espaco.m, borderRadius: raio.s, backgroundColor: cor.superficie },
  dica: { gap: espaco.xs },
  link: { alignItems: 'flex-start', marginLeft: -espaco.s },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  mensagem: { padding: espaco.l, borderRadius: raio.m, borderWidth: 1, borderColor: cor.borda },
  acoes: { gap: espaco.s, marginTop: espaco.s },
});
