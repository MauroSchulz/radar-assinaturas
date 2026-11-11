import { View } from 'react-native';
import { BarrasCategoria } from '../componentes/BarrasCategoria';
import { Botao } from '../componentes/Botao';
import { Secao } from '../componentes/Cartao';
import { LinhaAssinatura } from '../componentes/LinhaAssinatura';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { gastosPorCategoria } from '../dominio/categorias';
import { dinheiro } from '../dominio/formato';
import type { Assinatura, Situacao } from '../dominio/tipos';
import { useLoja } from '../estado/loja';
import { abrirAssinatura, useNavegacao } from '../estado/navegacao';
import { useAssinaturas, useResumo } from '../estado/radar';
import { cor, espaco } from '../tema/tokens';

const GRUPOS: { situacao: Situacao; titulo: string }[] = [
  { situacao: 'teste', titulo: 'Em teste grátis' },
  { situacao: 'ativa', titulo: 'Ativas' },
  { situacao: 'encerrada', titulo: 'Pararam de cobrar' },
];

export function Assinaturas() {
  const assinaturas = useAssinaturas();
  const resumo = useResumo();
  const decisoes = useLoja((s) => s.decisoes);
  const abrir = abrirAssinatura;
  const ir = useNavegacao((s) => s.ir);

  return (
    <Tela titulo="Assinaturas" sobretitulo={`${dinheiro(resumo.totalMensal)} por mês`}>
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        Tudo o que o radar achou cobrando de tempos em tempos no seu cartão, da mais cara para a mais barata.
      </Texto>
      <View style={{ marginTop: espaco.m }}>
        <Botao icone="calendar-outline" rotulo="Calendário de cobranças" aoTocar={() => ir({ nome: 'calendario' })} />
      </View>
      <Secao titulo="Para onde vai o dinheiro">
        <Texto variante="apoio" cor={cor.textoSuave}>
          {`As ativas, por categoria: ${dinheiro(resumo.totalMensal)} por mês.`}
        </Texto>
        <BarrasCategoria categorias={gastosPorCategoria(assinaturas)} />
      </Secao>
      {GRUPOS.map(({ situacao, titulo }) => {
        const doGrupo: Assinatura[] = assinaturas.filter((a) => a.situacao === situacao);
        if (doGrupo.length === 0) return null;
        return (
          <Secao key={situacao} titulo={`${titulo} (${doGrupo.length})`}>
            <Lista>
              {doGrupo.map((a) => (
                <LinhaAssinatura key={a.id} assinatura={a} decisao={decisoes[a.id]} aoTocar={() => abrir(a.id)} />
              ))}
            </Lista>
          </Secao>
        );
      })}
    </Tela>
  );
}
