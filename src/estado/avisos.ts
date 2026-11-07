import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { hoje } from '../dominio/datas';
import { lembretesDoRadar, type PreferenciasDeAviso } from '../dominio/lembretes';
import { ASSINATURAS } from './extrato';
import { useLoja } from './loja';

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

const INICIAL = { ativados: false, cobranca: true, teste: true, agendados: 0 };

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
      partialize: (s) => ({ ativados: s.ativados, cobranca: s.cobranca, teste: s.teste }),
    },
  ),
);

/** Os avisos que valem agora, com as preferências e as decisões de hoje. */
export function useLembretes() {
  const cobranca = useAvisos((s) => s.cobranca);
  const teste = useAvisos((s) => s.teste);
  const decisoes = useLoja((s) => s.decisoes);
  return useMemo(() => lembretesDoRadar(ASSINATURAS, decisoes, { cobranca, teste }, hoje()), [cobranca, teste, decisoes]);
}
