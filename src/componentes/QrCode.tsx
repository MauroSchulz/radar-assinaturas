import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { matrizQr } from '../dominio/qrcode';
import { cor } from '../tema/tokens';

/** Margem branca em volta, em quadradinhos: o padrão pede 4 para a câmera achar o código. */
const MARGEM = 4;

interface Props {
  /** O texto codificado (o Pix copia e cola). */
  valor: string;
  /** Lado do desenho, em px. */
  tamanho: number;
  /** O que o leitor de tela fala, ex.: “QR Code Pix de R$ 120,00”. */
  rotulo: string;
}

/**
 * QR Code desenhado em SVG. Sempre preto no fundo branco, inclusive no modo escuro: código
 * invertido nem todo app de banco lê. Cada linha vira um caminho só, com os trechos escuros
 * emendados, para o desenho ficar leve.
 */
export function QrCode({ valor, tamanho, rotulo }: Props) {
  const { lado, caminho } = useMemo(() => {
    const m = matrizQr(valor);
    const partes: string[] = [];
    for (let l = 0; l < m.tamanho; l++) {
      for (let c = 0; c < m.tamanho; c++) {
        if (!m.escuro(l, c)) continue;
        let fim = c;
        while (fim + 1 < m.tamanho && m.escuro(l, fim + 1)) fim++;
        partes.push(`M${c + MARGEM} ${l + MARGEM}h${fim - c + 1}v1h-${fim - c + 1}z`);
        c = fim;
      }
    }
    return { lado: m.tamanho + MARGEM * 2, caminho: partes.join('') };
  }, [valor]);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={rotulo}>
      <Svg width={tamanho} height={tamanho} viewBox={`0 0 ${lado} ${lado}`}>
        <Rect x={0} y={0} width={lado} height={lado} fill={cor.qrFundo} />
        <Path d={caminho} fill={cor.qrModulo} />
      </Svg>
    </View>
  );
}
