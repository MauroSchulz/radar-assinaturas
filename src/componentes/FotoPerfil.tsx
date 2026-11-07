import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';
import { usePerfil } from '../estado/perfil';
import { cor } from '../tema/tokens';

const FOTO_PADRAO = require('../../assets/perfil.jpg');

/**
 * A foto de quem usa o app, redonda. Decorativa: o nome sempre aparece perto. Sem foto,
 * mostra o ícone de pessoa. `sobreFaixa` é para o topo do Início (fundo translúcido, ícone branco).
 */
export function FotoPerfil({ tamanho = 44, sobreFaixa }: { tamanho?: number; sobreFaixa?: boolean }) {
  const foto = usePerfil((s) => s.foto);
  const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  const fonte = foto.tipo === 'padrao' ? FOTO_PADRAO : foto.tipo === 'escolhida' ? { uri: foto.uri } : null;
  return (
    <View
      style={[estilos.base, estilo, { backgroundColor: sobreFaixa ? cor.vidroSobreFaixa : cor.superficieSuave }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {fonte ? (
        <Image source={fonte} style={estilo} resizeMode="cover" />
      ) : (
        <Ionicons name="person-outline" size={Math.round(tamanho * 0.5)} color={sobreFaixa ? cor.sobreDestaque : cor.textoSuave} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
