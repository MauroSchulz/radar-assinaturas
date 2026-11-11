import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, categoriaDaPessoa } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { comQuem } from '../componentes/LinhaRacha';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { Voltar } from '../componentes/Voltar';
import { dataCurta, dataLonga } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import { cobrancasDoRacha, dividirPor, type Cota } from '../dominio/racha';
import { ASSINATURAS } from '../estado/extrato';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { useCotas, useRacha } from '../estado/radar';
import { vibrarSucesso } from '../servicos/vibracao';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';

/** A parte de um amigo (te deve) ou a sua (você deve a quem pagou). */
function LinhaCota({ cota, nome }: { cota: Cota; nome: string }) {
  const alternarPago = useRachas((s) => s.alternarPago);
  const ir = useNavegacao((s) => s.ir);
  const voceDeve = cota.direcao === 'voceDeve';
  const titulo = voceDeve ? `Você deve a ${nome}` : nome;
  return (
    <View style={estilos.linha}>
      <View style={estilos.meio}>
        <Texto variante="corpoForte">{titulo}</Texto>
        <Texto variante="apoio" cor={cota.pagoEm ? cor.textoSuave : cor.perigoSobreFundo}>
          {cota.pagoEm
            ? `${dinheiro(cota.valor)} · ${voceDeve ? 'você pagou' : 'pagou'} em ${dataCurta(cota.pagoEm)}`
            : `${dinheiro(cota.valor)} · pendente`}
        </Texto>
      </View>
      {cota.pagoEm ? (
        <Botao
          compacto
          variante="link"
          rotulo="Desfazer"
          nomeAcessivel={voceDeve ? `Desfazer seu pagamento a ${nome}` : `Desfazer pagamento de ${nome}`}
          aoTocar={() => alternarPago(cota.chave)}
        />
      ) : voceDeve ? (
        <View style={estilos.botoes}>
          <Botao compacto variante="link" rotulo="Pagar" nomeAcessivel={`Pagar ${nome}`} aoTocar={() => ir({ nome: 'pagarAmigo', pessoaId: cota.pessoaId })} />
          <Botao compacto rotulo="Já paguei" nomeAcessivel={`Já paguei ${nome}`} aoTocar={() => alternarPago(cota.chave)} />
        </View>
      ) : (
        <View style={estilos.botoes}>
          <Botao
            compacto
            variante="link"
            rotulo="Cobrar"
            nomeAcessivel={`Cobrar ${nome}`}
            aoTocar={() => ir({ nome: 'cobranca', pessoaId: cota.pessoaId, rachaId: cota.rachaId })}
          />
          <Botao
            compacto
            rotulo="Recebi"
            nomeAcessivel={`Recebi de ${nome}`}
            aoTocar={() => {
              alternarPago(cota.chave);
              vibrarSucesso();
            }}
          />
        </View>
      )}
    </View>
  );
}

export function RachaDetalhe({ id }: { id: string }) {
  const racha = useRacha(id);
  const todas = useCotas();
  const pessoas = useRachas((s) => s.pessoas);
  const apagarRacha = useRachas((s) => s.apagarRacha);
  const voltar = useNavegacao((s) => s.voltar);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  if (!racha) return null;

  const nomeDe = (pessoaId: string) => pessoas.find((p) => p.id === pessoaId)?.nome ?? '?';
  const nomes = racha.pessoas.map(nomeDe);
  const cotas = todas.filter((c) => c.rachaId === racha.id);
  const cobrancas = cobrancasDoRacha(racha, ASSINATURAS).reverse(); // mais recente primeiro
  const partes = racha.pessoas.length + (racha.incluiVoce ? 1 : 0);
  const { origem } = racha;
  const assinatura = origem.tipo === 'assinatura' ? ASSINATURAS.find((a) => a.id === origem.assinaturaId) : undefined;
  const valorBase = origem.tipo === 'assinatura' ? (assinatura?.valorAtual ?? 0) : origem.valor;
  const { suaParte } = dividirPor(valorBase, racha.pessoas, racha.incluiVoce, racha.divisao);
  const pagador = racha.pagouId ? nomeDe(racha.pagouId) : null;
  const modo = racha.divisao?.modo ?? 'igual';
  const comoDividiu = modo === 'valor' ? 'Dividido por valor' : modo === 'partes' ? 'Dividido por partes' : `Dividido em ${partes}`;
  const legenda =
    origem.tipo === 'assinatura'
      ? `Toda cobrança, desde ${dataLonga(origem.desde)} · ${comQuem(nomes)}`
      : pagador
        ? `${dataLonga(origem.data)} · ${pagador} pagou${nomes.filter((n) => n !== pagador).length ? ` · ${comQuem(nomes.filter((n) => n !== pagador))}` : ''}`
        : `${dataLonga(origem.data)} · ${comQuem(nomes)}`;

  return (
    <Tela topo={<Voltar />}>
      <View style={estilos.cabeca}>
        <Avatar nome={racha.titulo} categoria={assinatura?.categoria ?? categoriaDaPessoa(racha.titulo)} tamanho={64} />
        <View style={estilos.cabecaTextos}>
          <Texto variante="titulo" accessibilityRole="header">
            {racha.titulo}
          </Texto>
          <Texto variante="apoio" cor={cor.textoSobreFundo}>
            {legenda}
          </Texto>
        </View>
      </View>

      <Cartao>
        <Texto variante="apoio" cor={cor.textoSuave}>
          {origem.tipo === 'assinatura' ? 'Valor por mês' : pagador ? `Total que ${pagador} pagou` : 'Total da compra'}
        </Texto>
        <Texto variante="valorGrande">{dinheiro(valorBase)}</Texto>
        {racha.incluiVoce ? (
          <Texto variante="corpo" style={estilos.frase}>
            {`${comoDividiu}. Sua parte: `}
            <Texto variante="valor">{dinheiro(suaParte)}</Texto>
            {origem.tipo === 'assinatura' ? ' por mês.' : pagador ? `, que você deve a ${pagador}.` : '.'}
          </Texto>
        ) : (
          <Texto variante="corpo" style={estilos.frase}>
            {`Dividido entre ${partes === 1 ? '1 pessoa' : `${partes} pessoas`}. Você não entra na divisão.`}
          </Texto>
        )}
        {modo === 'igual' && racha.incluiVoce && !pagador && valorBase % partes !== 0 && (
          <Texto variante="apoio" cor={cor.textoSuave} style={estilos.frase}>
            Os centavos que sobram da divisão ficam com você.
          </Texto>
        )}
      </Cartao>

      {cobrancas.map((cobranca) => {
        const doDia = cotas.filter((c) => c.referente === cobranca.data);
        if (doDia.length === 0) return null;
        return (
          <Secao
            key={cobranca.data}
            titulo={
              origem.tipo === 'assinatura'
                ? `Cobrança de ${dataCurta(cobranca.data)} · ${dinheiro(cobranca.valor)}`
                : pagador
                  ? 'A sua parte'
                  : 'Quem já pagou'
            }
          >
            <Lista recuo={espaco.l}>
              {doDia.map((c) => (
                <LinhaCota key={c.chave} cota={c} nome={nomeDe(c.pessoaId)} />
              ))}
            </Lista>
          </Secao>
        );
      })}

      <View style={estilos.rodape}>
        <Botao
          variante="linkPerigo"
          rotulo={confirmarApagar ? 'Toque de novo para apagar' : 'Apagar racha'}
          aoTocar={() => {
            if (!confirmarApagar) return setConfirmarApagar(true);
            voltar();
            apagarRacha(racha.id);
          }}
        />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: espaco.l, marginBottom: espaco.l },
  cabecaTextos: { flex: 1 },
  frase: { marginTop: espaco.s },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.s,
    minHeight: ALVO_MINIMO + 16,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.l,
  },
  meio: { flex: 1, gap: 2 },
  botoes: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  rodape: { marginTop: espaco.xl, alignItems: 'center' },
});
