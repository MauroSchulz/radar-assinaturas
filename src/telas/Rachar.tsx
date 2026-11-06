import { StyleSheet, View } from 'react-native';
import { Avatar } from '../componentes/Avatar';
import { Botao } from '../componentes/Botao';
import { Cartao, Secao } from '../componentes/Cartao';
import { Lista } from '../componentes/Lista';
import { LinhaRacha } from '../componentes/LinhaRacha';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { dinheiro } from '../dominio/formato';
import { cobrar, temPix } from '../estado/cobrar';
import { useNavegacao } from '../estado/navegacao';
import { useRachas } from '../estado/rachas';
import { useCotas, useSaldos } from '../estado/radar';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';

export function Rachar() {
  const saldos = useSaldos();
  const cotas = useCotas();
  const rachas = useRachas((s) => s.rachas);
  const chavePix = useRachas((s) => s.pix.chave);
  const ir = useNavegacao((s) => s.ir);
  const totalDevido = saldos.reduce((s, x) => s + x.devendo, 0);

  return (
    <Tela titulo="Rachar" sobretitulo="Contas divididas com os amigos">
      <View
        style={estilos.total}
        accessible
        accessibilityLabel={totalDevido > 0 ? `Te devem ${dinheiro(totalDevido)}` : 'Ninguém te deve nada agora'}
      >
        <Texto variante="corpo" cor={cor.sobreDestaqueSuave}>
          Te devem
        </Texto>
        <Texto variante="valorGrande" cor={cor.sobreDestaque}>
          {dinheiro(totalDevido)}
        </Texto>
        <Texto variante="apoio" cor={cor.sobreDestaqueSuave}>
          {totalDevido > 0
            ? `${saldos.length} ${saldos.length === 1 ? 'pessoa' : 'pessoas'} · ${rachas.length} ${rachas.length === 1 ? 'racha' : 'rachas'}`
            : 'Ninguém te deve nada agora.'}
        </Texto>
      </View>

      <View style={estilos.acao}>
        <Botao variante="primario" rotulo="Rachar uma compra" aoTocar={() => ir({ nome: 'escolherCompra' })} />
      </View>

      {!temPix(chavePix) && (
        <Cartao destaque style={estilos.dica}>
          <Texto variante="apoio">
            Cadastre sua chave Pix e a cobrança já vai com o código copia e cola, no valor certo.
          </Texto>
          <View style={estilos.dicaAcao}>
            <Botao variante="link" rotulo="Cadastrar chave Pix" aoTocar={() => ir({ nome: 'seuPix' })} />
          </View>
        </Cartao>
      )}

      {saldos.length > 0 && (
        <Secao titulo="Quem te deve">
          <Lista>
            {saldos.map(({ pessoa, devendo, pendentes }) => (
              <View key={pessoa.id} style={estilos.linhaPessoa}>
                <Avatar nome={pessoa.nome} categoria="outros" />
                <View style={estilos.meio}>
                  <Texto variante="corpoForte">{pessoa.nome}</Texto>
                  <Texto variante="apoio" cor={cor.textoSuave}>
                    {`${dinheiro(devendo)} · ${pendentes.length} ${pendentes.length === 1 ? 'pendência' : 'pendências'}`}
                  </Texto>
                </View>
                <Botao
                  compacto
                  rotulo="Cobrar"
                  nomeAcessivel={`Cobrar ${pessoa.nome}, ${dinheiro(devendo)}`}
                  aoTocar={() => cobrar(pessoa, cotas.filter((c) => c.pessoaId === pessoa.id))}
                />
              </View>
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
          <Botao variante="link" rotulo="Alterar sua chave Pix" aoTocar={() => ir({ nome: 'seuPix' })} />
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  total: { backgroundColor: cor.destaque, borderRadius: raio.l, padding: espaco.xl, gap: espaco.xs },
  acao: { marginTop: espaco.m },
  dica: { marginTop: espaco.m, gap: espaco.xs },
  dicaAcao: { alignItems: 'flex-start', marginLeft: -espaco.s },
  linhaPessoa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
  },
  meio: { flex: 1, gap: 2 },
  rodape: { marginTop: espaco.l, alignItems: 'center' },
});
