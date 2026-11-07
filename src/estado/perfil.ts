import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { novaConexao, type Conexao } from '../dominio/bancos';
import { hoje } from '../dominio/datas';

/**
 * Quem usa o app: nome, foto e os bancos conectados (demonstração). Fica salvo só no celular.
 * A foto `padrao` é a que vem com o app (`assets/perfil.jpg`); `escolhida` é uma da galeria.
 */
export type Foto = { tipo: 'padrao' } | { tipo: 'escolhida'; uri: string } | { tipo: 'nenhuma' };

interface EstadoPerfil {
  nome: string;
  foto: Foto;
  conexoes: Conexao[];
  salvarNome: (nome: string) => void;
  trocarFoto: (uri: string) => void;
  removerFoto: () => void;
  usarFotoPadrao: () => void;
  conectar: (bancoId: string) => void;
  desconectar: (bancoId: string) => void;
  recomecar: () => void;
}

export const NOME_INICIAL = 'Mauro Schulz';

const INICIAL = { nome: NOME_INICIAL, foto: { tipo: 'padrao' } as Foto, conexoes: [] as Conexao[] };

export const usePerfil = create<EstadoPerfil>()(
  persist(
    (set) => ({
      ...INICIAL,
      salvarNome: (nome) => set({ nome: nome.trim() }),
      trocarFoto: (uri) => set({ foto: { tipo: 'escolhida', uri } }),
      removerFoto: () => set({ foto: { tipo: 'nenhuma' } }),
      usarFotoPadrao: () => set({ foto: { tipo: 'padrao' } }),
      conectar: (bancoId) =>
        set((s) => ({ conexoes: [...s.conexoes.filter((c) => c.bancoId !== bancoId), novaConexao(bancoId, hoje())] })),
      desconectar: (bancoId) => set((s) => ({ conexoes: s.conexoes.filter((c) => c.bancoId !== bancoId) })),
      recomecar: () => set(INICIAL),
    }),
    {
      name: 'radar.perfil.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ nome: s.nome, foto: s.foto, conexoes: s.conexoes }),
    },
  ),
);

/** O primeiro nome, para o "Olá" do Início. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}
