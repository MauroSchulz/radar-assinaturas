import { Pressable, StyleSheet } from 'react-native';
import { ALVO_MINIMO, cor, espaco, raio } from '../tema/tokens';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'link' | 'linkPerigo';

interface Props {
  rotulo: string;
  aoTocar: () => void;
  variante?: Variante;
  /** Para botões que funcionam como escolha (ex.: "Ainda uso"). */
  selecionado?: boolean;
  desabilitado?: boolean;
  /** Menor, para caber numa linha de lista (continua com 44px de altura). */
  compacto?: boolean;
  dica?: string;
  /** Nome para leitor de tela, quando o rótulo sozinho é ambíguo (ex.: "Cobrar Ana"). */
  nomeAcessivel?: string;
}

const COR_DO_TEXTO: Record<Variante, string> = {
  primario: cor.sobreDestaque,
  secundario: cor.texto,
  link: cor.destaqueTexto,
  // Usado direto no fundo (ex.: "Apagar racha").
  linkPerigo: cor.perigoSobreFundo,
};

export function Botao({ rotulo, aoTocar, variante = 'secundario', selecionado, desabilitado, compacto, dica, nomeAcessivel }: Props) {
  const ehLink = variante === 'link' || variante === 'linkPerigo';
  return (
    <Pressable
      onPress={aoTocar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={nomeAcessivel}
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      accessibilityHint={dica}
      hitSlop={ehLink ? 8 : undefined}
      style={({ pressed }) => [
        estilos.base,
        ehLink ? estilos.link : estilos[variante as 'primario' | 'secundario'],
        compacto && estilos.compacto,
        selecionado && estilos.selecionado,
        desabilitado && estilos.desabilitado,
        pressed && estilos.pressionado,
      ]}
    >
      <Texto variante={compacto ? 'legenda' : 'corpoForte'} cor={selecionado ? cor.destaqueTexto : COR_DO_TEXTO[variante]}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: ALVO_MINIMO + 4,
    borderRadius: raio.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.l,
  },
  primario: { backgroundColor: cor.destaque },
  secundario: { backgroundColor: cor.superficie, borderWidth: 1, borderColor: cor.borda },
  link: { minHeight: ALVO_MINIMO, paddingHorizontal: espaco.s },
  compacto: { minHeight: ALVO_MINIMO, paddingHorizontal: espaco.m, borderRadius: raio.pilula },
  selecionado: { backgroundColor: cor.destaqueSuave, borderColor: cor.destaque },
  desabilitado: { opacity: 0.4 },
  pressionado: { opacity: 0.7 },
});
