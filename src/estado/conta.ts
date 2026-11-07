import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { faturaComPixNoCredito, saldoDaConta, type Envio } from '../dominio/conta';
import { hoje } from '../dominio/datas';
import { FATURA } from './extrato';

/** Pix, transferências e Pix no crédito que você "fez" na demonstração. Fica salvo no aparelho. */
interface EstadoConta {
  envios: Envio[];
  /** Registra o envio com a data de hoje e devolve o id (para abrir o comprovante). */
  enviar: (envio: Omit<Envio, 'id' | 'data'>) => string;
  recomecar: () => void;
}

export const useConta = create<EstadoConta>()(
  persist(
    (set) => ({
      envios: [],
      enviar: (envio) => {
        const id = `e${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
        set((s) => ({ envios: [{ ...envio, id, data: hoje() }, ...s.envios] }));
        return id;
      },
      recomecar: () => set({ envios: [] }),
    }),
    {
      name: 'radar.conta.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ envios: s.envios }),
    },
  ),
);

export function useSaldoConta(): number {
  const envios = useConta((s) => s.envios);
  return useMemo(() => saldoDaConta(envios), [envios]);
}

/** A fatura aberta com o Pix no crédito somado (ver `faturaComPixNoCredito`). */
export function useFatura() {
  const envios = useConta((s) => s.envios);
  return useMemo(() => faturaComPixNoCredito(FATURA, envios), [envios]);
}
