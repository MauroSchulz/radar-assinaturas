import { create } from 'zustand';
import type { TipoEnvio } from '../dominio/conta';
import type { OrigemRacha } from '../dominio/racha';

export type Aba = 'inicio' | 'assinaturas' | 'rachar' | 'investir' | 'alertas';

/** Valores que já chegam preenchidos ao criar uma caixinha (ex.: a economia de uma assinatura). */
export interface SugestaoDeCaixinha {
  nome: string;
  aporteMensal: number;
  origem?: { assinaturaId: string; nome: string };
}

/** Telas que abrem por cima de uma aba, com botão Voltar. */
export type Rota =
  | { nome: 'assinatura'; id: string }
  | { nome: 'racha'; id: string }
  | { nome: 'escolherCompra' }
  | { nome: 'montarRacha'; titulo: string; origem: OrigemRacha }
  | { nome: 'seuPix' }
  | { nome: 'caixinha'; id: string }
  | { nome: 'novaCaixinha'; sugestao?: SugestaoDeCaixinha }
  | { nome: 'fatura' }
  | { nome: 'emprestimo' }
  | { nome: 'cobranca'; pessoaId: string; rachaId?: string }
  | { nome: 'enviar'; modo: TipoEnvio }
  | { nome: 'comprovante'; id: string }
  | { nome: 'perfil' }
  | { nome: 'bancos' }
  | { nome: 'conectarBanco'; bancoId: string }
  | { nome: 'notificacoes' };

/**
 * Cinco abas e, por cima delas, uma pilha de telas. `ir` empilha, `voltar` desempilha,
 * `trocarAba` zera a pilha e `concluir` troca a pilha inteira (ao terminar um fluxo).
 * Não fica salva: o app sempre abre no Início.
 */
interface Navegacao {
  aba: Aba;
  pilha: Rota[];
  trocarAba: (aba: Aba) => void;
  ir: (rota: Rota) => void;
  voltar: () => void;
  concluir: (aba: Aba, pilha: Rota[]) => void;
}

export const useNavegacao = create<Navegacao>()((set) => ({
  aba: 'inicio',
  pilha: [],
  trocarAba: (aba) => set({ aba, pilha: [] }),
  ir: (rota) => set((s) => ({ pilha: [...s.pilha, rota] })),
  voltar: () => set((s) => ({ pilha: s.pilha.slice(0, -1) })),
  concluir: (aba, pilha) => set({ aba, pilha }),
}));

/** Atalho usado em várias telas: abrir o detalhe de uma assinatura. */
export function abrirAssinatura(id: string) {
  useNavegacao.getState().ir({ nome: 'assinatura', id });
}
