/**
 * Tema escolhido no perfil: seguir o celular, sempre claro ou sempre escuro.
 *
 * As cores entram nos estilos uma vez só, quando o app carrega (`tokens.ts`). Por isso a escolha
 * é lida do aparelho **antes** de carregar o app (`index.ts`), e trocar de tema reinicia o app.
 * Este arquivo não importa nada do tema: ele é lido antes dos tokens existirem.
 */
export type PreferenciaDeTema = 'sistema' | 'claro' | 'escuro';

export const CHAVE_DO_TEMA = 'radar.tema';

let atual: PreferenciaDeTema = 'sistema';

export function ehPreferenciaDeTema(valor: unknown): valor is PreferenciaDeTema {
  return valor === 'sistema' || valor === 'claro' || valor === 'escuro';
}

/** Chamado uma vez, antes de carregar o app. */
export function definirPreferenciaInicial(preferencia: PreferenciaDeTema): void {
  atual = preferencia;
}

export function preferenciaDeTema(): PreferenciaDeTema {
  return atual;
}

/** O esquema que vale: a escolha da pessoa, ou o do celular quando ela escolheu segui-lo. */
export function esquemaDe(preferencia: PreferenciaDeTema, doCelular: string | null | undefined): 'claro' | 'escuro' {
  if (preferencia === 'claro' || preferencia === 'escuro') return preferencia;
  return doCelular === 'dark' ? 'escuro' : 'claro';
}
