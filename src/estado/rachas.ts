import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PESSOAS_DA_DEMO, rachasDeDemonstracao } from '../dados/demoRachas';
import { hoje, type DataISO } from '../dominio/datas';
import type { DadosPix } from '../dominio/pix';
import type { Pessoa, Racha } from '../dominio/racha';
import { ASSINATURAS, EXTRATO } from './extrato';

/**
 * Rachas, amigos, quem pagou e a sua chave Pix. Fica salvo no aparelho.
 *
 * Os rachas e pagamentos guardam datas do extrato de demonstração, que anda junto com
 * "hoje". Por isso, quando o dia muda, eles voltam para a demonstração do dia; amigos e
 * chave Pix são seus e ficam. Com extrato de verdade, essa regra sai.
 */
interface EstadoRachas {
  dia: DataISO;
  pessoas: Pessoa[];
  rachas: Racha[];
  pagamentos: Record<string, DataISO>;
  pix: DadosPix;
  adicionarPessoa: (nome: string) => Pessoa;
  criarRacha: (racha: Omit<Racha, 'id' | 'criadoEm'>) => string;
  apagarRacha: (id: string) => void;
  /** Marca como pago hoje, ou desfaz se já estava pago. */
  alternarPago: (chaveDaCota: string) => void;
  salvarPix: (pix: DadosPix) => void;
}

function novoId(prefixo: string): string {
  return `${prefixo}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function demoDoDia() {
  return { dia: hoje(), ...rachasDeDemonstracao(EXTRATO, ASSINATURAS, hoje()) };
}

export const useRachas = create<EstadoRachas>()(
  persist(
    (set, get) => ({
      ...demoDoDia(),
      pessoas: PESSOAS_DA_DEMO,
      pix: { chave: '', nome: '', cidade: '' },
      adicionarPessoa: (nome) => {
        const limpo = nome.trim();
        const existente = get().pessoas.find((p) => p.nome.toLowerCase() === limpo.toLowerCase());
        if (existente) return existente;
        const pessoa = { id: novoId('p'), nome: limpo };
        set((s) => ({ pessoas: [...s.pessoas, pessoa] }));
        return pessoa;
      },
      criarRacha: (dados) => {
        const id = novoId('r');
        set((s) => ({ rachas: [{ ...dados, id, criadoEm: hoje() }, ...s.rachas] }));
        return id;
      },
      apagarRacha: (id) =>
        set((s) => ({
          rachas: s.rachas.filter((r) => r.id !== id),
          pagamentos: Object.fromEntries(Object.entries(s.pagamentos).filter(([chave]) => !chave.startsWith(`${id}|`))),
        })),
      alternarPago: (chave) =>
        set((s) => {
          const pagamentos = { ...s.pagamentos };
          if (pagamentos[chave]) delete pagamentos[chave];
          else pagamentos[chave] = hoje();
          return { pagamentos };
        }),
      salvarPix: (pix) => set({ pix }),
    }),
    {
      name: 'radar.rachas.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ dia: s.dia, pessoas: s.pessoas, rachas: s.rachas, pagamentos: s.pagamentos, pix: s.pix }),
      merge: (salvo, atual) => {
        const s = salvo as Partial<EstadoRachas> | undefined;
        if (!s) return atual;
        const pessoas = [...PESSOAS_DA_DEMO, ...(s.pessoas ?? []).filter((p) => !PESSOAS_DA_DEMO.some((d) => d.id === p.id))];
        const base = { ...atual, pessoas, pix: s.pix ?? atual.pix };
        // Outro dia: rachas e pagamentos da demonstração recomeçam (ver comentário acima).
        if (s.dia !== hoje()) return base;
        return { ...base, rachas: s.rachas ?? atual.rachas, pagamentos: s.pagamentos ?? atual.pagamentos };
      },
    },
  ),
);
