import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Decisao } from '../dominio/tipos';

/** O que a pessoa decidiu. Fica salvo no aparelho entre uma abertura e outra. */
interface Loja {
  decisoes: Record<string, Decisao>;
  alertasDispensados: string[];
  /** Esconde os valores da tela inicial (o "olho" do topo). */
  ocultarValores: boolean;
  alternarOcultar: () => void;
  /** Escolher a mesma decisão de novo desfaz. */
  decidir: (assinaturaId: string, decisao: Decisao) => void;
  dispensar: (alertaId: string) => void;
  restaurarAlertas: () => void;
  recomecar: () => void;
}

export const useLoja = create<Loja>()(
  persist(
    (set) => ({
      decisoes: {},
      alertasDispensados: [],
      ocultarValores: false,
      alternarOcultar: () => set((s) => ({ ocultarValores: !s.ocultarValores })),
      decidir: (id, decisao) =>
        set((s) => {
          const decisoes = { ...s.decisoes };
          if (decisoes[id] === decisao) delete decisoes[id];
          else decisoes[id] = decisao;
          return { decisoes };
        }),
      dispensar: (id) =>
        set((s) => (s.alertasDispensados.includes(id) ? s : { alertasDispensados: [...s.alertasDispensados, id] })),
      restaurarAlertas: () => set({ alertasDispensados: [] }),
      recomecar: () => set({ decisoes: {}, alertasDispensados: [], ocultarValores: false }),
    }),
    {
      name: 'radar.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ decisoes: s.decisoes, alertasDispensados: s.alertasDispensados, ocultarValores: s.ocultarValores }),
    },
  ),
);
