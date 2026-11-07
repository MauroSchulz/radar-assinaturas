# Radar de Assinaturas: instruções para o Claude Code

Trabalho individual do Mauro. **Sem nenhuma ligação com outros projetos dele** (em especial o do
Scrum/Jira em grupo): não leia, não edite e não cite nada de lá.

Leia o `README.md` primeiro. Responda sempre em português do Brasil.

## Regras

- **Regra mora em `src/dominio/`**, pura e testada. Tela só mostra. Mudou regra, mudou o teste junto.
- **Valores em centavos (inteiro).** Dinheiro na tela só por `dinheiro()` de `src/dominio/formato.ts`
  (nunca `toLocaleString`: o Hermes não traz os dados de idioma completos).
- **Datas como `AAAA-MM-DD`** e só pelas funções de `src/dominio/datas.ts`. "Hoje" é `hoje()`.
- **Cor e medida só de `src/tema/tokens.ts`.** Visual de conceito "como seria dentro do app do
  banco" (pedido do Mauro): verde-esmeralda `#047857` nos destaques (o roxo saiu em
  07/11/2026 por lembrar demais o Nubank) e, na faixa do topo do Início, um degradê horizontal
  esmeralda → azul-petróleo `#0E7490` (`FundoDegrade`, tokens `faixa` e `faixaFim`),
  fundo branco. **Sem caixas cinzas**: conteúdo em seções separadas por linha fina de ponta a ponta
  (`Secao`), listas soltas no fundo (`Lista`), e quadro verde-claro só para destaque (`<Cartao destaque>`).
  **Sem logo e sem o nome do banco na interface**:
  o app continua sendo o Radar, e o banco é só a referência da apresentação.
- **Dois temas** (`CLARO` e `ESCURO` em `tokens.ts`, mesmas chaves): o app segue o tema do celular **ao abrir**.
  Verde de fundo é `cor.destaque`; verde de texto e ícone é `cor.destaqueTexto` (no escuro são diferentes).
  Cor nova entra nas duas paletas e no par certo de `src/tema/__tests__/contraste.test.ts`.
- **Barra de abas flutuante** (`BarraAbas`): fica por cima do conteúdo. A `Tela` já reserva o espaço
  embaixo (`espacoParaBarra`); tela que não usar `Tela` precisa reservar também.
- **Texto sempre com cor explícita**: use o componente `Texto`.
- **Seletor do zustand nunca cria objeto novo** (`s => s.x ?? []` trava em loop). Use constante fora.
- Navegação é de propósito simples (`src/estado/navegacao.ts`): 5 abas e uma pilha de telas por cima.
  `ir` empilha, `voltar` desempilha, `trocarAba` zera, `concluir` troca a pilha ao fim de um fluxo.
  Tela nova entra na união `Rota` e no `TelaDaRota` do `App.tsx`. O `AGENTS.md` do template sugere
  Expo Router; aqui não se usa.
- **Pix** (`src/dominio/pix.ts`) segue o BR Code do Banco Central. Não mexa no formato sem
  rodar `pix.test.ts`: um campo errado e o app do banco recusa o código.
- **Cartão** (`src/dominio/cartao.ts`) e **empréstimo** (`src/dominio/emprestimo.ts`) são de demonstração:
  `CARTAO_DEMO`, `LIMITE_EMPRESTIMO` e `TAXA_EMPRESTIMO_MENSAL` são os valores de exemplo.
- **Investimentos** (`src/dominio/investimentos.ts`) são simulação: o CDI é a constante `CDI_ANUAL`.
  Caixinhas não dependem do extrato e **não** recomeçam a cada dia.
- Rachas e pagamentos guardam datas do extrato de demonstração e **recomeçam a cada dia**
  (`merge` em `src/estado/rachas.ts`). Amigos e chave Pix ficam.
- Área de toque nunca menor que 44px.
- Instalar pacote: `npx expo install <pacote>` (escolhe a versão certa para o SDK).

## Antes de dar algo por pronto

```bash
npm test
npm run typecheck
```
