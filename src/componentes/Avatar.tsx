import { StyleSheet, View } from 'react-native';
import type { Categoria } from '../dominio/tipos';
import { CORES_DA_CATEGORIA } from '../tema/tokens';
import { Texto } from './Texto';

/** Inicial do serviço sobre a cor da categoria. Decorativo: o nome sempre aparece ao lado. */
export function Avatar({ nome, categoria, tamanho = 44 }: { nome: string; categoria: Categoria; tamanho?: number }) {
  const cores = CORES_DA_CATEGORIA[categoria];
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[estilos.base, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.32, backgroundColor: cores.fundo }]}
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
