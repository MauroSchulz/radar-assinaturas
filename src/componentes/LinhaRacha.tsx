import { Pressable, StyleSheet, View } from 'react-native';
import { dataCurta } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import type { Cota, Racha } from '../dominio/racha';
import { ASSINATURAS } from '../estado/extrato';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';
import { Avatar } from './Avatar';
import { Texto } from './Texto';

/** "com Ana, Bruno e Carla" */
export function comQuem(nomes: string[]): string {
  if (nomes.length <= 1) return `com ${nomes[0] ?? 'ninguém'}`;
  return `com ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

interface Props {
  racha: Racha;
  cotas: Cota[];
  aoTocar: () => void;
}

export function LinhaRacha({ racha, cotas, aoTocar }: Props) {
  const pessoas = useRachas((s) => s.pessoas);
  const nomes = racha.pessoas.map((id) => pessoas.find((p) => p.id === id)?.nome ?? '?');
  const { origem } = racha;
  const assinatura = origem.tipo === 'assinatura' ? ASSINATURAS.find((a) => a.id === origem.assinaturaId) : undefined;
  const quando = origem.tipo === 'compra' ? dataCurta(origem.data) : 'Todo mês';
  const pendente = cotas.filter((c) => !c.pagoEm).reduce((s, c) => s + c.valor, 0);
  const status = pendente > 0 ? `Faltam ${dinheiro(pendente)}` : 'Quitado';
  // Valor e "faltam" empilhados à direita: em linha, espremiam o nome do racha.

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${racha.titulo}, ${quando}, ${comQuem(nomes)}. ${status}.`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <Avatar nome={racha.titulo} categoria={assinatura?.categoria ?? 'compras'} />
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={2}>
          {racha.titulo}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={2}>
          {`${quando} · ${comQuem(nomes)}`}
        </Texto>
      </View>
      <View style={estilos.fim}>
        {pendente > 0 ? (
          <>
            <Texto variante="valor" cor={cor.perigo}>
              {dinheiro(pendente)}
            </Texto>
            <Texto variante="apoio" cor={cor.textoSuave}>
              faltam
            </Texto>
          </>
        ) : (
          <Texto variante="legenda" cor={cor.textoSuave}>
            Quitado
          </Texto>
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    minHeight: ALVO_MINIMO + 20,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.l,
    backgroundColor: cor.fundo,
  },
  pressionada: { backgroundColor: cor.superficieSuave },
  meio: { flex: 1, gap: 2 },
  fim: { alignItems: 'flex-end' },
});
