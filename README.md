# Radar de Assinaturas

Trabalho individual: uma funcionalidade que o app do banco não tem, demonstrada num app próprio.

> Projeto acadêmico, sem relação com o Nubank ou qualquer outro banco. O banco é só a referência
> da proposta; o app não usa a marca deles, e todos os dados são de demonstração.

## O problema

Assinatura é fácil de começar e fácil de esquecer. O teste grátis de 7 dias vira cobrança
sem aviso, o streaming sobe o preço e ninguém repara, o serviço cobra duas vezes no mesmo
mês e o estorno nunca é pedido. Tudo isso aparece na fatura do cartão, mas misturado com
Uber, iFood e mercado, e ninguém lê a fatura linha por linha.

O app do banco (usamos o Nubank como referência) mostra cada compra, mas **não junta as que
se repetem nem avisa quando uma delas muda**.

## A proposta

O Radar lê o extrato do cartão e:

1. **Descobre sozinho quais cobranças são assinaturas**, sem a pessoa cadastrar nada.
2. **Mostra quanto elas custam juntas**, por mês e por ano.
3. **Avisa antes de perder dinheiro**: teste grátis acabando, preço que subiu, cobrança
   duplicada, cobrança chegando.
4. **Ajuda a cancelar**: a pessoa marca "vou cancelar", vê o passo a passo e quanto
   economiza por ano.
5. **Racha a conta com os amigos**: divide uma compra do extrato ou uma assinatura (todo
   mês), mostra quem te deve e cobra por Pix.
6. **Faz a economia render**: o que você deixa de gastar vira uma caixinha que rende 100% do
   CDI, e o app mostra quanto suas assinaturas custam de verdade se o dinheiro fosse investido.

## O racha

O segundo problema é parecido: a Netflix é dividida com um amigo, o churrasco foi pago num
cartão só, e no fim ninguém lembra quem deve quanto. O banco mostra a compra inteira como se
fosse toda sua.

- **Parte da compra de verdade.** A pessoa escolhe uma compra do próprio extrato, não digita
  valor nenhum.
- **Assinatura dividida todo mês.** A cada nova cobrança, a parte de cada amigo aparece
  sozinha, e o Início passa a mostrar quanto sai **do seu bolso** de verdade.
- **Cobrança com Pix pronto.** O botão "Cobrar" monta a mensagem com o valor e um **Pix copia
  e cola** de verdade (padrão BR Code do Banco Central, com CRC16), no valor exato que a pessoa
  deve. Ela cola no app do banco e paga. A regra está em [`src/dominio/pix.ts`](src/dominio/pix.ts).
- **Link que copia o Pix.** O WhatsApp não copia texto com um toque, então o copia e cola e o
  QR Code vão na mensagem como links para uma página do projeto
  ([`docs/pix/`](docs/pix/index.html), no GitHub Pages). Ela copia o código ao abrir e desenha o
  QR. O código vai depois do `#`, que o navegador não envia a servidor nenhum
  ([`src/dominio/linkPix.ts`](src/dominio/linkPix.ts)).
- **Sem centavo perdido.** R$ 10,00 em três dá R$ 3,33 + R$ 3,33 + R$ 3,34: o centavo que sobra
  fica com quem criou o racha ([`src/dominio/racha.ts`](src/dominio/racha.ts)).

## Investir

O banco já tem investimento; o que falta é ligar o investimento ao gasto que você pode cortar.

- **Quanto custam suas assinaturas de verdade.** Os R$ 265,30 por mês da demonstração, investidos
  por 5 anos, virariam cerca de R$ 21.600 (já descontado o IR). Dá para ver em 1, 3, 5 e 10 anos.
- **Economia que vira caixinha.** Marcou "vou cancelar" numa assinatura? O valor dela aparece pronto
  para virar uma caixinha que guarda sozinha todo mês.
- **Caixinhas com meta.** Saldo, quanto rendeu, a barra da meta e "nesse ritmo, chega lá em N meses".
  Dá para guardar, resgatar e parar o depósito automático.
- **As contas** ficam em [`src/dominio/investimentos.ts`](src/dominio/investimentos.ts): juros compostos,
  tabela regressiva do IR (22,5% até 6 meses, 20% até 1 ano, 17,5% até 2 anos, 15% depois), cada
  depósito pagando IR pela própria idade. O CDI é um valor de exemplo (`CDI_ANUAL`, 14,15% ao ano):
  troque ali para atualizar o app inteiro.

## Cartão de crédito e empréstimo

- **Fatura atual** calculada do próprio extrato (compras desde o último fechamento), limite disponível
  e o que o banco não mostra: **quanto da fatura é assinatura**. As contas estão em
  [`src/dominio/cartao.ts`](src/dominio/cartao.ts) (fecha dia 25, vence dia 2, limite de R$ 15.000 na demonstração).
- **Empréstimo**: simulador de parcelas fixas pela Tabela Price ([`src/dominio/emprestimo.ts`](src/dominio/emprestimo.ts)),
  com taxa de exemplo de 3,99% ao mês e sem IOF. Mostra quanto da parcela as suas assinaturas pagariam
  se você as cortasse.
- **Próximo pagamento**: o vencimento da fatura, com o dia da semana.

## Como o detector funciona

Fica em [`src/dominio/deteccao.ts`](src/dominio/deteccao.ts) e não depende de tela nenhuma.

| Passo | O que faz | Exemplo |
|---|---|---|
| 1. Agrupar | Limpa a descrição e junta pelo comerciante | `NETFLIX.COM 0412` e `NETFLIX.COM 9981` → `NETFLIX.COM` |
| 2. Ritmo | Mede os dias entre cobranças: perto de 7, 30 ou 365 é semanal, mensal ou anual | Uber cai em dias aleatórios → fica de fora |
| 3. Valor | Assinatura cobra quase sempre o mesmo valor (até 35% de diferença) | Mercado é toda semana, mas R$ 90 numa e R$ 420 na outra → fica de fora |
| 4. Certeza | Mensal precisa de 3 cobranças; anual, de 2 | Duas idas à farmácia com um mês de diferença não são assinatura |
| 5. Situação | Vencimento passou há mais de 10 dias → encerrada. R$ 0,00 sem nada pago depois → teste grátis | |

## Telas

O app segue o tema do celular: claro ou escuro. A barra de baixo flutua sobre o conteúdo, só com
ícones; a aba ativa fica num círculo verde.


- **Início**: total por mês e por ano, os 3 alertas mais urgentes e as cobranças dos próximos 7 dias.
- **Assinaturas**: tudo o que foi detectado, separado em teste grátis, ativas e encerradas.
- **Alertas**: todos os avisos, do mais grave ao mais leve. Dá para dispensar.
- **Detalhe**: preço, custo em um ano, histórico de cobranças (com aumento e duplicada
  marcados), a decisão "ainda uso / vou cancelar", o passo a passo para cancelar e
  "dividir com amigos".
- **Início**: além de assinaturas, atalhos e alertas, as seções Cartão de crédito, Empréstimo e
  Próximo pagamento.
  - **Cartão de crédito**: fatura atual, limite, parte em assinaturas e as compras da fatura.
  - **Empréstimo**: valor, número de parcelas e quanto fica no total.
- **Investir**: total guardado, as caixinhas, a economia das assinaturas marcadas e a simulação.
  - **Caixinha**: saldo, meta, guardar e resgatar, depósito automático e movimentações.
  - **Nova caixinha**: nome, meta, quanto guardar todo mês e agora, com a previsão da meta.
- **Rachar**: quanto te devem, quem deve (com botão Cobrar) e a lista de rachas.
  - **O que vamos rachar?**: compras dos últimos 30 dias e assinaturas.
  - **Montar o racha**: quem entra (você incluído ou não) e a parte de cada um.
  - **Racha**: quem já pagou, por cobrança, com "Recebi" e "Cobrar".
  - **Sua chave Pix**: para a cobrança ir com o copia e cola.

## Limites (o que seria a próxima etapa)

- Os dados são **de demonstração** ([`src/dados/extrato.ts`](src/dados/extrato.ts)). As datas são
  relativas a hoje, então a demonstração nunca envelhece. No app de verdade, o extrato viria
  do banco pelo **Open Finance**.
- O app não cancela nada sozinho: ele mostra o caminho. Cancelar exige entrar no serviço.
- Notificação no celular (fora do app) fica para depois.
- Os rachas da demonstração guardam datas do extrato, que anda junto com "hoje". Por isso
  rachas e pagamentos **recomeçam a cada dia**; amigos e chave Pix ficam salvos. Com extrato
  de verdade, essa regra sai.
- Cartão e empréstimo são de demonstração: limite, datas e taxa são exemplos, e o simulador não
  contrata nada.
- O investimento é simulado: CDI fixo, sem IOF (resgate em menos de 30 dias) e sem dinheiro de
  verdade saindo da conta.
- "Recebi" é marcado à mão. Com Open Finance, daria para reconhecer o Pix chegando.

## Como rodar

```bash
npm install
npx expo start          # QR Code para abrir no Expo Go
npx expo start --web    # no navegador, sem celular
npm test                # testes das regras e das telas
npm run typecheck
```

## Organização

```
src/dominio/     regras puras e testadas: detecção, alertas, resumo, racha, Pix, investimentos, datas, dinheiro
src/dados/       extrato, rachas e caixinhas de demonstração
src/estado/      o que fica salvo no aparelho (decisões, rachas, chave Pix) e navegação
src/tema/        cores, espaços e tipografia
src/componentes/ peças reaproveitadas entre as telas
src/telas/       Início, Assinaturas, Rachar, Investir, Alertas e as telas que abrem por cima delas
docs/pix/        a página que o link de cobrança abre (copia o Pix e mostra o QR Code)
```
