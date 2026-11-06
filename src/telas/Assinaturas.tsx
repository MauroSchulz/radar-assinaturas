import { Secao } from '../componentes/Cartao';
import { LinhaAssinatura } from '../componentes/LinhaAssinatura';
import { Lista } from '../componentes/Lista';
import { Tela } from '../componentes/Tela';
import { Texto } from '../componentes/Texto';
import { dinheiro } from '../dominio/formato';
import type { Assinatura, Situacao } from '../dominio/tipos';
import { useLoja } from '../estado/loja';
import { abrirAssinatura } from '../estado/navegacao';
import { useAssinaturas, useResumo } from '../estado/radar';
import { cor } from '../tema/tokens';

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

  return (
    <Tela titulo="Assinaturas" sobretitulo={`${dinheiro(resumo.totalMensal)} por mês`}>
      <Texto variante="apoio" cor={cor.textoSobreFundo}>
        Tudo o que o radar achou cobrando de tempos em tempos no seu cartão, da mais cara para a mais barata.
      </Texto>
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
