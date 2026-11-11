import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { dataCurta } from '../dominio/datas';
import { dinheiro } from '../dominio/formato';
import type { Cota, Racha } from '../dominio/racha';
import { ASSINATURAS } from '../estado/extrato';
import { useRachas } from '../estado/rachas';
import { ALVO_MINIMO, cor, espaco } from '../tema/tokens';
import { Avatar, categoriaDaPessoa } from './Avatar';
import { BarraProgresso } from './BarraProgresso';
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
  const quando = origem.tipo === 'assinatura' ? 'Todo mês' : dataCurta(origem.data);
  const pagador = racha.pagouId ? pessoas.find((p) => p.id === racha.pagouId)?.nome : undefined;
  const voceDeve = cotas.some((c) => c.direcao === 'voceDeve');
  const pendente = cotas.filter((c) => !c.pagoEm).reduce((s, c) => s + c.valor, 0);
  const pagas = cotas.filter((c) => c.pagoEm).length;
  const status = pendente > 0 ? (voceDeve ? `Você deve ${dinheiro(pendente)}` : `Faltam ${dinheiro(pendente)}`) : 'Quitado';
  const progresso = `${pagas} de ${cotas.length} ${cotas.length === 1 ? 'parte paga' : 'partes pagas'}`;
  // Valor e "faltam" empilhados à direita: em linha, espremiam o nome do racha. O valor fica na
  // cor do texto, não em vermelho: dinheiro a receber não é problema, é só o que falta voltar.

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${racha.titulo}, ${quando}, ${comQuem(nomes)}. ${status}. ${progresso}.`}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionada]}
    >
      <Avatar nome={racha.titulo} categoria={assinatura?.categoria ?? categoriaDaPessoa(racha.titulo)} />
      <View style={estilos.meio}>
        <Texto variante="corpoForte" numberOfLines={2}>
          {racha.titulo}
        </Texto>
        <Texto variante="apoio" cor={cor.textoSuave} numberOfLines={2}>
          {`${quando} · ${pagador ? `${pagador} pagou` : comQuem(nomes)}`}
        </Texto>
        {cotas.length > 0 && (
          <View style={estilos.progresso}>
            <View style={estilos.barra}>
              <BarraProgresso fracao={pagas / cotas.length} />
            </View>
            <Texto variante="legenda" cor={cor.textoSuave}>
              {progresso}
            </Texto>
          </View>
        )}
      </View>
      <View style={estilos.fim}>
        {pendente > 0 ? (
          <>
            <Texto variante="valor">{dinheiro(pendente)}</Texto>
            <Texto variante="apoio" cor={cor.textoSuave}>
              {voceDeve ? 'você deve' : 'faltam'}
            </Texto>
          </>
        ) : (
          <View style={estilos.quitado}>
            <Ionicons name="checkmark-circle" size={16} color={cor.destaqueTexto} />
            <Texto variante="legenda" cor={cor.destaqueTexto}>
              Quitado
            </Texto>
          </View>
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
  progresso: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, marginTop: espaco.xs },
  barra: { flex: 1, maxWidth: 120 },
  fim: { alignItems: 'flex-end', alignSelf: 'flex-start', paddingTop: 2 },
  quitado: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
