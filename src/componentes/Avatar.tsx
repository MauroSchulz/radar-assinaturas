import { StyleSheet, View } from 'react-native';
import type { Categoria } from '../dominio/tipos';
import { CORES_DA_CATEGORIA } from '../tema/tokens';
import { Texto } from './Texto';

/** Pessoas (e compras rachadas) ganham uma cor fixa a partir do nome, para a Ana ser sempre da mesma cor. */
const CORES_DE_PESSOA: Categoria[] = ['nuvem', 'musica', 'saude', 'video', 'compras'];

export function categoriaDaPessoa(nome: string): Categoria {
  // Pela inicial: nomes com letras vizinhas (Ana, Bruno, Carla, Diego) nunca repetem a cor.
  const inicial = nome.trim().normalize('NFD').charAt(0).toUpperCase();
  return CORES_DE_PESSOA[(inicial.charCodeAt(0) || 0) % CORES_DE_PESSOA.length];
}

/**
 * Inicial sobre a cor da categoria. Decorativo: o nome sempre aparece ao lado.
 * Serviço e compra são quadrados de canto arredondado; pessoa (`redondo`) é círculo.
 */
export function Avatar({ nome, categoria, tamanho = 44, redondo }: { nome: string; categoria: Categoria; tamanho?: number; redondo?: boolean }) {
  const cores = CORES_DA_CATEGORIA[categoria];
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[estilos.base, { width: tamanho, height: tamanho, borderRadius: redondo ? tamanho / 2 : tamanho * 0.32, backgroundColor: cores.fundo }]}
    >
      <Texto variante={tamanho > 50 ? 'titulo' : 'subtitulo'} cor={cores.texto}>
        {nome.charAt(0).toUpperCase()}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
