/**
 * Os avisos que o Radar manda no celular: um dia antes de cada cobrança de assinatura e dois
 * dias antes de um teste grátis virar cobrança. Aqui só se decide **o quê** e **quando**; quem
 * agenda no celular é `servicos/notificacoes.ts`.
 */
import { diasEntre, somarDias, type DataISO } from './datas';
import { dinheiro } from './formato';
import type { Assinatura, Decisao } from './tipos';

export interface PreferenciasDeAviso {
  cobranca: boolean;
  teste: boolean;
}

export interface Lembrete {
  id: string;
  /** Dia do aviso (sai às 9h). */
  data: DataISO;
  titulo: string;
  corpo: string;
  assinaturaId: string;
}

/** Só agenda o que cai nos próximos 45 dias: o app reagenda toda vez que abre. */
export const JANELA_DE_AVISOS_DIAS = 45;
export const HORA_DO_AVISO = 9;

export function lembretesDoRadar(
  assinaturas: Assinatura[],
  decisoes: Readonly<Record<string, Decisao>>,
  prefs: PreferenciasDeAviso,
  dataHoje: DataISO,
): Lembrete[] {
  const lembretes: Lembrete[] = [];
  for (const a of assinaturas) {
    if (a.situacao === 'encerrada') continue;
    const vaiCancelar = decisoes[a.id] === 'cancelar';
    if (a.situacao === 'teste' && prefs.teste) {
      const data = somarDias(a.proximaCobranca, -2);
      const preco = a.valorAtual > 0 ? ` e começa a cobrar ${dinheiro(a.valorAtual)}` : '';
      lembretes.push({
        id: `teste|${a.id}|${a.proximaCobranca}`,
        data,
        titulo: `Teste grátis do ${a.nome} acaba em 2 dias`,
        corpo: `Depois disso ele vira assinatura${preco}. Se não quer, cancele antes.`,
        assinaturaId: a.id,
      });
    }
    if (a.situacao === 'ativa' && prefs.cobranca) {
      const data = somarDias(a.proximaCobranca, -1);
      lembretes.push({
        id: `cobranca|${a.id}|${a.proximaCobranca}`,
        data,
        titulo: `${a.nome} cobra amanhã: ${dinheiro(a.valorAtual)}`,
        corpo: vaiCancelar
          ? 'Você marcou para cancelar. Ainda dá tempo antes da cobrança.'
          : 'Ainda usa? Abra o Radar se quiser cancelar ou dividir com alguém.',
        assinaturaId: a.id,
      });
    }
  }
  return lembretes
    .filter((l) => {
      const n = diasEntre(dataHoje, l.data);
      return n >= 0 && n <= JANELA_DE_AVISOS_DIAS;
    })
    .sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : x.titulo.localeCompare(y.titulo)));
}
