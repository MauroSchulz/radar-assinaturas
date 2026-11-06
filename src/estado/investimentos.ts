import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { caixinhasDeDemonstracao } from '../dados/demoInvestimentos';
import { hoje } from '../dominio/datas';
import type { Caixinha } from '../dominio/investimentos';

/**
 * As caixinhas. Ficam salvas no aparelho. Diferente dos rachas, não dependem das datas do
 * extrato de demonstração, então não recomeçam a cada dia: as da demonstração nascem na
 * primeira abertura e daí em diante são da pessoa.
 */
interface EstadoInvestimentos {
  caixinhas: Caixinha[];
  criar: (dados: { nome: string; meta: number | null; aporteMensal: number; primeiroDeposito: number; origem?: Caixinha['origem'] }) => string;
  guardar: (id: string, valor: number) => void;
  resgatar: (id: string, valor: number) => void;
  pararDeGuardarTodoMes: (id: string) => void;
  apagar: (id: string) => void;
}

function novoId(): string {
  return `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function movimento(valor: number) {
  return { id: novoId(), data: hoje(), valor };
}

function alterar(caixinhas: Caixinha[], id: string, mudar: (c: Caixinha) => Caixinha): Caixinha[] {
  return caixinhas.map((c) => (c.id === id ? mudar(c) : c));
}

export const useInvestimentos = create<EstadoInvestimentos>()(
  persist(
    (set) => ({
      caixinhas: caixinhasDeDemonstracao(hoje()),
      criar: ({ nome, meta, aporteMensal, primeiroDeposito, origem }) => {
        const id = novoId();
        const caixinha: Caixinha = {
          id,
          nome: nome.trim(),
          criadaEm: hoje(),
          meta,
          recorrencias: aporteMensal > 0 ? [{ valor: aporteMensal, desde: hoje(), ate: null }] : [],
          movimentos: primeiroDeposito > 0 ? [movimento(primeiroDeposito)] : [],
          ...(origem ? { origem } : {}),
        };
        set((s) => ({ caixinhas: [caixinha, ...s.caixinhas] }));
        return id;
      },
      guardar: (id, valor) =>
        set((s) => ({ caixinhas: alterar(s.caixinhas, id, (c) => ({ ...c, movimentos: [...c.movimentos, movimento(valor)] })) })),
      resgatar: (id, valor) =>
        set((s) => ({ caixinhas: alterar(s.caixinhas, id, (c) => ({ ...c, movimentos: [...c.movimentos, movimento(-valor)] })) })),
      pararDeGuardarTodoMes: (id) =>
        set((s) => ({
          caixinhas: alterar(s.caixinhas, id, (c) => ({
            ...c,
            // Fecha hoje: o depósito de hoje, se já caiu, continua valendo; amanhã em diante, não.
            recorrencias: c.recorrencias.map((r) => (r.ate === null ? { ...r, ate: hoje() } : r)),
          })),
        })),
      apagar: (id) => set((s) => ({ caixinhas: s.caixinhas.filter((c) => c.id !== id) })),
    }),
    {
      name: 'radar.investimentos.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ caixinhas: s.caixinhas }),
    },
  ),
);
