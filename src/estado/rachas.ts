import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PESSOAS_DA_DEMO, rachasDeDemonstracao } from '../dados/demoRachas';
import { hoje, type DataISO } from '../dominio/datas';
import type { DadosPix } from '../dominio/pix';
import type { DadosTransferencia, FormaDePagamento, Pessoa, Racha } from '../dominio/racha';
import { ASSINATURAS, EXTRATO } from './extrato';

/**
 * Rachas, amigos, quem pagou e como você recebe (Pix, transferência, formas escolhidas).
 * Fica salvo no aparelho.
 *
 * Os rachas e pagamentos guardam datas do extrato de demonstração, que anda junto com
 * "hoje". Por isso, quando o dia muda, eles voltam para a demonstração do dia; amigos e
 * como você recebe são seus e ficam. Com extrato de verdade, essa regra sai.
 */
interface EstadoRachas {
  dia: DataISO;
  pessoas: Pessoa[];
  rachas: Racha[];
  pagamentos: Record<string, DataISO>;
  pix: DadosPix;
  /** Para quem prefere pagar por transferência (vazio = não oferece). */
  transferencia: DadosTransferencia;
  /** As formas de pagamento que vão na mensagem de cobrança; a última escolha fica salva. */
  formas: FormaDePagamento[];
  adicionarPessoa: (nome: string) => Pessoa;
  criarRacha: (racha: Omit<Racha, 'id' | 'criadoEm'>) => string;
  apagarRacha: (id: string) => void;
  /** Marca como pago hoje, ou desfaz se já estava pago. */
  alternarPago: (chaveDaCota: string) => void;
  salvarPix: (pix: DadosPix) => void;
  salvarTransferencia: (dados: DadosTransferencia) => void;
  alternarForma: (forma: FormaDePagamento) => void;
  /** Dá baixa de uma vez (“já recebi tudo”). Ao contrário de `alternarPago`, nunca desfaz. */
  marcarRecebido: (chavesDasCotas: string[]) => void;
  /** Volta para a demonstração do dia: rachas, pagamentos, amigos e como você recebe. */
  recomecar: () => void;
  /** Quando você mandou a última cobrança para cada amigo (por id). */
  cobradoEm: Record<string, DataISO>;
  registrarCobranca: (pessoaId: string) => void;
}

function novoId(prefixo: string): string {
  return `${prefixo}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function demoDoDia() {
  return { dia: hoje(), cobradoEm: {} as Record<string, DataISO>, ...rachasDeDemonstracao(EXTRATO, ASSINATURAS, hoje()) };
}

function inicial() {
  return {
    ...demoDoDia(),
    pessoas: PESSOAS_DA_DEMO,
    pix: { chave: '', nome: '', cidade: '' },
    transferencia: { banco: '', agencia: '', conta: '' },
    formas: ['pixCopiaECola', 'chavePix', 'qrCode'] as FormaDePagamento[],
  };
}

export const useRachas = create<EstadoRachas>()(
  persist(
    (set, get) => ({
      ...inicial(),
      recomecar: () => set(inicial()),
      registrarCobranca: (pessoaId) => set((s) => ({ cobradoEm: { ...s.cobradoEm, [pessoaId]: hoje() } })),
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
      salvarTransferencia: (transferencia) => set({ transferencia }),
      alternarForma: (forma) =>
        set((s) => ({ formas: s.formas.includes(forma) ? s.formas.filter((f) => f !== forma) : [...s.formas, forma] })),
      marcarRecebido: (chaves) =>
        set((s) => {
          const pagamentos = { ...s.pagamentos };
          for (const chave of chaves) pagamentos[chave] ??= hoje();
          return { pagamentos };
        }),
    }),
    {
      name: 'radar.rachas.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Versão 2: entrou a forma "QR Code". Quem já mandava o copia e cola passa a mandar o QR também.
      // Versão 3: a demonstração ganhou a Júlia e a pizza; os rachas salvos voltam para a demonstração
      // nova (apagando o `dia`, o `merge` trata como outro dia). Amigos e como você recebe ficam.
      // Versão 4: entrou o cinema que a Ana pagou (você deve a ela); a demonstração recomeça de novo.
      version: 4,
      migrate: (salvo, versao) => {
        let s = salvo as Partial<EstadoRachas> | undefined;
        if (!s) return salvo as EstadoRachas;
        if (s.formas && versao < 2 && s.formas.includes('pixCopiaECola') && !s.formas.includes('qrCode')) {
          s = { ...s, formas: [...s.formas, 'qrCode'] };
        }
        if (versao < 4) s = { ...s, dia: '' };
        return s as EstadoRachas;
      },
      partialize: (s) => ({
        dia: s.dia,
        pessoas: s.pessoas,
        rachas: s.rachas,
        pagamentos: s.pagamentos,
        cobradoEm: s.cobradoEm,
        pix: s.pix,
        transferencia: s.transferencia,
        formas: s.formas,
      }),
      merge: (salvo, atual) => {
        const s = salvo as Partial<EstadoRachas> | undefined;
        if (!s) return atual;
        const pessoas = [...PESSOAS_DA_DEMO, ...(s.pessoas ?? []).filter((p) => !PESSOAS_DA_DEMO.some((d) => d.id === p.id))];
        const base = {
          ...atual,
          pessoas,
          pix: s.pix ?? atual.pix,
          transferencia: s.transferencia ?? atual.transferencia,
          formas: s.formas ?? atual.formas,
        };
        // Outro dia: rachas e pagamentos da demonstração recomeçam (ver comentário acima).
        if (s.dia !== hoje()) return base;
        return { ...base, rachas: s.rachas ?? atual.rachas, pagamentos: s.pagamentos ?? atual.pagamentos, cobradoEm: s.cobradoEm ?? {} };
      },
    },
  ),
);
