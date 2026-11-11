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
  /** Lembrar de cobrar quem te deve há uma semana. */
  racha?: boolean;
}

export interface Lembrete {
  id: string;
  /** Dia do aviso (sai às 9h). */
  data: DataISO;
  titulo: string;
  corpo: string;
  /** Vazio nos lembretes de racha. */
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

/** Depois de quantos dias sem pagar o app lembra de cobrar de novo. */
export const DIAS_PARA_LEMBRAR_DE_COBRAR = 7;

export interface Devedor {
  pessoaId: string;
  nome: string;
  /** Quanto te deve, já descontado o que você deve a ela. */
  valor: number;
  /** A pendência mais antiga. */
  desde: DataISO;
  /** A última vez que você mandou a cobrança, se mandou. */
  cobradoEm?: DataISO;
}

/**
 * Um aviso por amigo que te deve: uma semana depois da pendência (ou da última cobrança que
 * você mandou). Se essa semana já passou, o aviso fica para amanhã: nunca no mesmo dia.
 */
export function lembretesDeRacha(devedores: Devedor[], dataHoje: DataISO): Lembrete[] {
  return devedores
    .filter((d) => d.valor > 0)
    .map((d) => {
      const base = d.cobradoEm && d.cobradoEm > d.desde ? d.cobradoEm : d.desde;
      const prevista = somarDias(base, DIAS_PARA_LEMBRAR_DE_COBRAR);
      const amanha = somarDias(dataHoje, 1);
      const data = prevista > amanha ? prevista : amanha;
      const dias = diasEntre(d.desde, data);
      return {
        id: `racha|${d.pessoaId}|${data}`,
        data,
        titulo: `${d.nome} te deve ${dinheiro(d.valor)}`,
        corpo: `Faz ${dias} ${dias === 1 ? 'dia' : 'dias'}. Abra o Radar para mandar um lembrete com o Pix, sem constrangimento.`,
        assinaturaId: '',
      };
    });
}
