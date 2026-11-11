import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { hoje } from '../dominio/datas';
import { lembretesDeRacha, lembretesDoRadar, type PreferenciasDeAviso } from '../dominio/lembretes';
import { ASSINATURAS } from './extrato';
import { useLoja } from './loja';
import { useRachas } from './rachas';
import { useSaldos } from './radar';

/** Se a pessoa quer avisos no celular, e de quais tipos. Fica salvo no aparelho. */
interface EstadoAvisos extends PreferenciasDeAviso {
  ativados: boolean;
  /** Quantos avisos ficaram agendados na última vez (para mostrar na tela). */
  agendados: number;
  ativar: (ativados: boolean) => void;
  alternar: (tipo: keyof PreferenciasDeAviso) => void;
  registrarAgendados: (n: number) => void;
  recomecar: () => void;
}

const INICIAL = { ativados: false, cobranca: true, teste: true, racha: true, agendados: 0 };

export const useAvisos = create<EstadoAvisos>()(
  persist(
    (set) => ({
      ...INICIAL,
      ativar: (ativados) => set({ ativados }),
      alternar: (tipo) => set((s) => ({ [tipo]: !s[tipo] }) as Partial<EstadoAvisos>),
      registrarAgendados: (agendados) => set({ agendados }),
      recomecar: () => set(INICIAL),
    }),
    {
      name: 'radar.avisos.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ ativados: s.ativados, cobranca: s.cobranca, teste: s.teste, racha: s.racha }),
    },
  ),
);

/** Os avisos que valem agora, com as preferências, as decisões e quem te deve hoje. */
export function useLembretes() {
  const cobranca = useAvisos((s) => s.cobranca);
  const teste = useAvisos((s) => s.teste);
  const racha = useAvisos((s) => s.racha);
  const decisoes = useLoja((s) => s.decisoes);
  const saldos = useSaldos();
  const cobradoEm = useRachas((s) => s.cobradoEm);
  return useMemo(() => {
    const dasAssinaturas = lembretesDoRadar(ASSINATURAS, decisoes, { cobranca, teste }, hoje());
    const doRacha =
      racha === false
        ? []
        : lembretesDeRacha(
            saldos.map((s) => ({ pessoaId: s.pessoa.id, nome: s.pessoa.nome, valor: s.liquido, desde: s.desde, cobradoEm: cobradoEm[s.pessoa.id] })),
            hoje(),
          );
    return [...dasAssinaturas, ...doRacha].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.titulo.localeCompare(b.titulo)));
  }, [cobranca, teste, racha, decisoes, saldos, cobradoEm]);
}
