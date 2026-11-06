import { useMemo } from 'react';
import { gerarAlertas } from '../dominio/alertas';
import { hoje } from '../dominio/datas';
import { cotasDoRacha, saldos, suaParteMensal, type Cota, type Racha } from '../dominio/racha';
import { resumir } from '../dominio/resumo';
import type { Assinatura } from '../dominio/tipos';
import { ASSINATURAS, EXTRATO } from './extrato';
import { useLoja } from './loja';
import { useRachas } from './rachas';

/** Liga as regras puras às telas. */
export function useAssinaturas(): Assinatura[] {
  return ASSINATURAS;
}

export function useAssinatura(id: string | null): Assinatura | undefined {
  return id ? ASSINATURAS.find((a) => a.id === id) : undefined;
}

export function useAlertas() {
  const dispensados = useLoja((s) => s.alertasDispensados);
  return useMemo(() => gerarAlertas(ASSINATURAS, hoje(), dispensados), [dispensados]);
}

export function useResumo() {
  const decisoes = useLoja((s) => s.decisoes);
  const rachas = useRachas((s) => s.rachas);
  return useMemo(() => {
    const resumo = resumir(ASSINATURAS, decisoes);
    // Com as divisões: o que sai do seu bolso por mês, já sem a parte dos amigos.
    const suaParte = ASSINATURAS.filter((a) => a.situacao === 'ativa').reduce((s, a) => s + suaParteMensal(a, rachas), 0);
    return { ...resumo, suaParteMensal: suaParte };
  }, [decisoes, rachas]);
}

/** Todas as cotas de todos os rachas. */
export function useCotas(): Cota[] {
  const rachas = useRachas((s) => s.rachas);
  const pagamentos = useRachas((s) => s.pagamentos);
  return useMemo(() => rachas.flatMap((r) => cotasDoRacha(r, ASSINATURAS, pagamentos)), [rachas, pagamentos]);
}

export function useSaldos() {
  const cotas = useCotas();
  const pessoas = useRachas((s) => s.pessoas);
  return useMemo(() => saldos(cotas, pessoas), [cotas, pessoas]);
}

export function useRacha(id: string): Racha | undefined {
  return useRachas((s) => s.rachas.find((r) => r.id === id));
}

export const QUANTAS_TRANSACOES = EXTRATO.length;
