import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Share } from 'react-native';
import App from '../../App';
import { simularEmprestimo } from '../dominio/emprestimo';
import { dinheiro } from '../dominio/formato';
import { deBase64url } from '../dominio/linkPix';
import { useLoja } from '../estado/loja';
import { useNavegacao } from '../estado/navegacao';
import { useInvestimentos } from '../estado/investimentos';
import { useConta } from '../estado/conta';
import { useAvisos } from '../estado/avisos';
import { usePerfil } from '../estado/perfil';
import { SALDO_INICIAL_DEMO, simularPixNoCredito } from '../dominio/conta';
import { useRachas } from '../estado/rachas';

const RACHAS_INICIAL = useRachas.getState();
const INVESTIMENTOS_INICIAL = useInvestimentos.getState();

/** Monta o app inteiro e passa pelas telas como uma pessoa faria. */
describe('app', () => {
  beforeEach(() => {
    // Nada montado ainda: não precisa de act.
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
  });

  it('abre no Início com o total e os alertas', async () => {
    await render(<App />);
    expect(screen.getByText('Olá, Mauro')).toBeTruthy();
    expect(screen.getByText('Você gasta por mês')).toBeTruthy();
    expect(screen.getByText('Precisa da sua atenção')).toBeTruthy();
  });

  it('navega pelas cinco abas', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Assinaturas' }));
    expect(screen.getByText('Ativas (7)')).toBeTruthy();
    expect(screen.getByText('Netflix')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    expect(screen.getByText('Te devem')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Investir' }));
    expect(screen.getByText('Guardado nas caixinhas')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: /Alertas/ }));
    expect(screen.getByText(/cobrou duas vezes/)).toBeTruthy();
  });

  it('marcar para cancelar mostra os passos e a economia aparece no Início', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Assinaturas' }));
    await fireEvent.press(screen.getByText('Netflix'));
    expect(screen.getByText('Você ainda usa?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Vou cancelar' }));
    expect(screen.getByText('Como cancelar')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Início' }));
    expect(screen.getByText(/Cancelando a que você marcou, sobram/)).toBeTruthy();
    expect(screen.getByText(/538,80/)).toBeTruthy(); // 44,90 × 12
  });

  it('o olho esconde e mostra os valores do Início', async () => {
    await render(<App />);
    expect(screen.getByText('R$ 265,30')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Esconder valores' }));
    expect(screen.queryByText('R$ 265,30')).toBeNull();
    expect(screen.getAllByText('••••').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar valores' }));
    expect(screen.getByText('R$ 265,30')).toBeTruthy();
  });

  it('dispensar um alerta tira ele da lista', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: /Alertas/ }));
    const antes = screen.getAllByRole('button', { name: /^Dispensar/ }).length;
    await fireEvent.press(screen.getAllByRole('button', { name: /^Dispensar/ })[0]);
    expect(screen.getAllByRole('button', { name: /^Dispensar/ })).toHaveLength(antes - 1);
  });
});

describe('rachar', () => {
  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
  });

  it('a demonstração mostra quem deve e quanto', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    // Bruno: 120,00 do churrasco + 22,45 da Netflix. Carla: 120,00. Júlia: 72,00 da pizza.
    // A Ana já pagou o churrasco e a pizza.
    expect(screen.getByText('R$ 334,45')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobrar Júlia, R\$.72,00/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobrar Bruno, R\$.142,45/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobrar Carla, R\$.120,00/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Cobrar Ana/ })).toBeNull();
  });

  it('o Início e a Netflix mostram a sua parte depois da divisão', async () => {
    await render(<App />);
    expect(screen.getByText(/Com as divisões, sai do seu bolso/)).toBeTruthy();
    expect(screen.getByText('R$ 242,85')).toBeTruthy(); // 265,30 − 22,45 do Bruno
    expect(screen.getByRole('button', { name: /^Te devem R\$.334,45/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Assinaturas' }));
    await fireEvent.press(screen.getByText('Netflix'));
    expect(screen.getByText(/Dividida com Bruno/)).toBeTruthy();
  });

  it('cria um racha de uma compra, recebe e desfaz', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Rachar uma compra' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Livraria Cultura/ }));
    expect(screen.getByRole('button', { name: 'Criar racha' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Ana' }));
    expect(screen.getAllByText('R$ 34,95')).toHaveLength(2); // 69,90 ÷ 2
    await fireEvent.press(screen.getByRole('button', { name: 'Criar racha' }));
    expect(screen.getByText('Livraria Cultura')).toBeTruthy();
    expect(screen.getByText(/34,95 · pendente/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Recebi de Ana' }));
    expect(screen.getByText(/34,95 · pagou em/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Desfazer pagamento de Ana' }));
    expect(screen.getByText(/34,95 · pendente/)).toBeTruthy();
  });

  it('adiciona alguém novo na hora de rachar', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Rachar uma compra' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Livraria Cultura/ }));
    await fireEvent.changeText(screen.getByLabelText('Nome de mais alguém'), 'Diego');
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByRole('checkbox', { name: 'Diego' })).toBeChecked();
  });

  it('a cobrança mostra QR Code, copia e cola e as formas de pagamento, e dá baixa de tudo', async () => {
    const compartilhar = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const copiar = jest.requireMock('expo-clipboard').setStringAsync as jest.Mock;
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Cobrar Carla/ }));
    expect(screen.getByText('Cobrar Carla')).toBeTruthy();

    // Sem chave Pix: sem QR, e a mensagem pede o Pix do jeito de sempre.
    expect(screen.queryByLabelText(/^QR Code Pix/)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar cobrança' }));
    expect(compartilhar).toHaveBeenLastCalledWith({ message: expect.stringContaining('Me manda por Pix') });

    // Cadastra a chave sem sair da cobrança.
    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar chave Pix' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText(/Escreva seu nome/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Chave Pix'), 'nada');
    await fireEvent.changeText(screen.getByLabelText('Seu nome'), 'Mauro');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText(/Não reconheci essa chave/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Chave Pix'), '(11) 98765-4321');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    // De volta à cobrança: QR Code com o valor, copia e cola e chave na mensagem.
    expect(screen.getByLabelText('QR Code Pix de R$ 120,00')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Transferência' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Dinheiro' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar cobrança' }));
    const mensagem = (compartilhar.mock.calls.at(-1)![0] as { message: string }).message;
    expect(mensagem).toContain('Oi, Carla!');
    expect(mensagem).toContain('Como pagar (escolha uma):');
    // Copia e cola e QR Code vão como links para a página do Pix, com o código depois do #.
    const links = [...mensagem.matchAll(/#(copiar|qr)=([A-Za-z0-9_-]+)/g)];
    expect(links.map((l) => l[1])).toEqual(['copiar', 'qr']);
    const codigo = deBase64url(links[0][2]);
    expect(codigo).toMatch(/^000201/);
    expect(codigo).toContain('5406120.00'); // o valor exato que a Carla deve
    expect(deBase64url(links[1][2])).toBe(codigo);
    expect(mensagem).toContain('1) Pix copia e cola (toque no link');
    expect(mensagem).toContain('2) Chave Pix (celular): +5511987654321');
    expect(mensagem).toContain('3) QR Code (para ler com o app do banco):');
    expect(mensagem).toContain('4) Dinheiro');

    await fireEvent.press(screen.getByRole('button', { name: 'Copiar código Pix' }));
    expect(copiar).toHaveBeenLastCalledWith(expect.stringMatching(/^000201.*5406120.00/));
    expect(screen.getByText('Código Pix copiado.')).toBeTruthy();

    // Já recebi tudo: a Carla sai da lista de quem deve.
    await fireEvent.press(screen.getByRole('button', { name: 'Já recebi tudo de Carla' }));
    expect(screen.queryByRole('button', { name: /^Cobrar Carla/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^Cobrar Bruno/ })).toBeTruthy();
    compartilhar.mockRestore();
  });

  it('cobrar pelo racha leva só o que é daquele racha', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Churrascaria Brasa Viva/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cobrar Bruno' }));
    // O Bruno deve R$ 142,45 no total, mas neste racha só R$ 120,00.
    expect(screen.getAllByText('R$ 120,00')).toHaveLength(2); // o total e o único item
    expect(screen.queryByText('R$ 142,45')).toBeNull();
    expect(screen.queryByText(/Netflix/)).toBeNull();
  });
});

describe('investir', () => {
  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
  });

  it('mostra as caixinhas da demonstração e a simulação muda com o prazo', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Investir' }));
    expect(screen.getByText('Viagem de fim de ano')).toBeTruthy();
    expect(screen.getByText('Economia: Deezer')).toBeTruthy();
    expect(screen.getByText('Teria em 5 anos')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: '1 ano' }));
    expect(screen.getByText('Teria em 1 ano')).toBeTruthy();
    expect(screen.getByText('R$ 3.183,60')).toBeTruthy(); // 265,30 × 12 colocados
    expect(screen.getByText(/CDI de 14,15% ao ano/)).toBeTruthy();
  });

  it('a economia de uma assinatura cancelada vira caixinha, e dá para guardar e resgatar', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Assinaturas' }));
    await fireEvent.press(screen.getByText('Netflix'));
    await fireEvent.press(screen.getByRole('button', { name: 'Vou cancelar' }));
    expect(screen.getByText(/Investindo essa economia todo mês/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    await fireEvent.press(screen.getByRole('tab', { name: 'Investir' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar a economia de Netflix numa caixinha' }));
    expect(screen.getByLabelText('Nome').props.value).toBe('Economia: Netflix');
    expect(screen.getByLabelText('Guardar todo mês').props.value).toBe('44,90');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar caixinha' }));

    // Já na caixinha: o primeiro depósito automático cai hoje.
    expect(screen.getByText('Economia: Netflix')).toBeTruthy();
    expect(screen.getByText('Todo mês, R$ 44,90 entram sozinhos aqui.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Valor'), '100');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Guardou R$ 100,00.')).toBeTruthy();
    expect(screen.getAllByText('R$ 144,90').length).toBeGreaterThan(0);
    await fireEvent.changeText(screen.getByLabelText('Valor'), '5000');
    await fireEvent.press(screen.getByRole('button', { name: 'Resgatar' }));
    expect(screen.getByText('Dá para resgatar até R$ 144,90.')).toBeTruthy();

    // De volta ao Investir, a Netflix saiu de "economia que pode render".
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByRole('button', { name: /Guardar a economia de Netflix/ })).toBeNull();
  });

  it('não cria caixinha sem nome nem dinheiro', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Investir' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar caixinha' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar caixinha' }));
    expect(screen.getByText('Dê um nome para a caixinha.')).toBeTruthy();
    expect(screen.getByText(/Guarde algo agora ou todo mês/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Meta'), 'abc');
    expect(screen.getByText(/Escreva só o valor/)).toBeTruthy();
  });
});

describe('cartão de crédito e empréstimo', () => {
  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
  });

  it('o Início mostra cartão, empréstimo e próximo pagamento, e o olho esconde a fatura', async () => {
    await render(<App />);
    expect(screen.getByRole('button', { name: /^Cartão de crédito\. Fatura atual/ })).toBeTruthy();
    expect(screen.getByText('Fatura atual')).toBeTruthy();
    expect(screen.getByText(/desta fatura são assinaturas/)).toBeTruthy();
    expect(screen.getByText('R$ 10.000,00')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Próximo pagamento: fatura do cartão/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Esconder valores' }));
    expect(screen.queryByText('R$ 10.000,00')).toBeNull();
    expect(screen.getByRole('button', { name: 'Cartão de crédito. Valores escondidos.' })).toBeTruthy();
  });

  it('a fatura lista as compras e marca as assinaturas', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: /^Cartão de crédito\. Fatura atual/ }));
    expect(screen.getByText(/^Desta fatura,/)).toBeTruthy();
    expect(screen.getAllByText('Assinatura').length).toBeGreaterThan(0);
    // Tocar numa compra de assinatura abre o detalhe dela.
    await fireEvent.press(screen.getAllByRole('button', { name: /^Netflix, assinatura/ })[0]);
    expect(screen.getByText('Você ainda usa?')).toBeTruthy();
  });

  it('o simulador de empréstimo recalcula com o prazo e recusa valor acima do disponível', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: /^Empréstimo\./ }));
    const em12 = simularEmprestimo(500000, 12);
    expect(screen.getByText(`12x ${dinheiro(em12.parcela)}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: '24x' }));
    expect(screen.getByText(`24x ${dinheiro(simularEmprestimo(500000, 24).parcela)}`)).toBeTruthy();
    expect(screen.getByText(/isso paga \d+% dessa parcela/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Quanto você precisa?'), '20.000');
    expect(screen.getByText(/O máximo disponível é/)).toBeTruthy();
  });
});

describe('Pix, transferência e Pix no crédito', () => {
  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
  });

  it('o gráfico do ano destaca o mês que mais gastou e mostra o mês tocado', async () => {
    await render(<App />);
    expect(screen.getByText(/^Gastos no cartão em \d{4}$/)).toBeTruthy();
    expect(screen.getByText(/^Você gastou mais em/)).toBeTruthy();
    // Os meses que ainda não chegaram não dão para tocar.
    const meses = screen.getAllByRole('button', { name: /^(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro):/ });
    expect(meses).toHaveLength(12);
    const maior = screen.getByRole('button', { name: /o mês que mais gastou$/ });
    expect(maior).toBeSelected();
    const outro = meses.find((m) => m !== maior && !m.props.accessibilityState?.disabled)!;
    await fireEvent.press(outro);
    expect(outro).toBeSelected();
    expect(maior).not.toBeSelected();
  });

  it('o Início mostra o saldo e os três jeitos de mandar dinheiro', async () => {
    await render(<App />);
    expect(screen.getByLabelText(`Saldo em conta ${dinheiro(SALDO_INICIAL_DEMO)}`)).toBeTruthy();
    for (const nome of ['Pix', 'Transferir', 'Pix no crédito']) expect(screen.getByRole('button', { name: nome })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Esconder valores' }));
    expect(screen.getByLabelText('Saldo em conta. Valor escondido.')).toBeTruthy();
  });

  it('Pix: confere, envia, mostra o comprovante e desconta do saldo', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Pix' }));
    // Sem preencher nada, não passa.
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Escreva a chave Pix de quem vai receber.')).toBeTruthy();
    expect(screen.getByText(/Escreva o valor/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Chave Pix'), '(11) 98765-4321');
    await fireEvent.changeText(screen.getByLabelText('Nome de quem recebe'), 'Bruno');
    // Mais que o saldo: recusa.
    await fireEvent.changeText(screen.getByLabelText('Valor'), '9.999.999');
    expect(screen.getByText(/Seu saldo em conta é/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Valor'), '50');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Confira antes de enviar')).toBeTruthy();
    expect(screen.getByLabelText('Sai de: Saldo da conta')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /^Confirmar e enviar R\$.50,00/ }));

    expect(screen.getByText('Pix enviado')).toBeTruthy();
    expect(screen.getByText('para Bruno')).toBeTruthy();
    expect(screen.getByLabelText(/^Código: E\d{8}/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
    expect(screen.getByLabelText(`Saldo em conta ${dinheiro(SALDO_INICIAL_DEMO - 5000)}`)).toBeTruthy();
    expect(screen.getByText('Últimas movimentações')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Pix para Bruno, hoje, R\$.50,00/ })).toBeTruthy();
  });

  it('transferência pede banco, agência e conta válidos', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Transferir' }));
    await fireEvent.changeText(screen.getByLabelText('Nome de quem recebe'), 'Carla Souza');
    await fireEvent.changeText(screen.getByLabelText('Banco'), 'Banco Exemplo');
    await fireEvent.changeText(screen.getByLabelText('Agência'), '123456');
    await fireEvent.changeText(screen.getByLabelText('Conta'), 'abc');
    await fireEvent.changeText(screen.getByLabelText('Valor'), '120,00');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText(/A agência tem até 5 números/)).toBeTruthy();
    expect(screen.getByText(/Escreva a conta com o dígito/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Agência'), '0001');
    await fireEvent.changeText(screen.getByLabelText('Conta'), '12345-6');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Confirmar e enviar/ }));
    expect(screen.getByText('Transferência enviada')).toBeTruthy();
    expect(screen.getByLabelText('Conta: Banco Exemplo · ag. 0001 · conta 12345-6')).toBeTruthy();
  });

  it('Pix no crédito: parcela com juros, não mexe no saldo e entra na fatura', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Pix no crédito' }));
    await fireEvent.changeText(screen.getByLabelText('Chave Pix'), 'carla@exemplo.com');
    await fireEvent.changeText(screen.getByLabelText('Valor'), '600');
    await fireEvent.press(screen.getByRole('radio', { name: '3x' }));
    const sim = simularPixNoCredito(60000, 3);
    expect(screen.getByText(`3x de ${dinheiro(sim.parcela)}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText(`Total na fatura: ${dinheiro(sim.total)}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /^Confirmar e enviar/ }));
    expect(screen.getByText('Pix no crédito enviado')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
    // O saldo da conta fica igual; a 1ª parcela aparece na fatura.
    expect(screen.getByLabelText(`Saldo em conta ${dinheiro(SALDO_INICIAL_DEMO)}`)).toBeTruthy();
    expect(screen.getByText(`${dinheiro(sim.parcela)} de Pix no crédito nesta fatura`)).toBeTruthy();
  });
});

describe('perfil, bancos e avisos no celular', () => {
  const notificacoes = jest.requireMock('expo-notifications') as Record<string, jest.Mock>;

  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
    useConta.getState().recomecar();
    usePerfil.getState().recomecar();
    useAvisos.getState().recomecar();
    Object.values(notificacoes).forEach((f) => typeof f === 'function' && 'mockClear' in f && f.mockClear());
  });

  it('a foto do Início abre o perfil; dá para trocar o nome e a foto', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir perfil' }));
    expect(screen.getByText('Mauro Schulz')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Nome'), 'Mauro S.');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar nome' }));
    expect(screen.getByText('Nome salvo.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Trocar foto' }));
    expect(usePerfil.getState().foto).toEqual({ tipo: 'escolhida', uri: 'file:///galeria/foto.jpg' });
    await fireEvent.press(screen.getByRole('button', { name: 'Remover foto' }));
    expect(usePerfil.getState().foto).toEqual({ tipo: 'nenhuma' });
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('Olá, Mauro')).toBeTruthy();
  });

  it('conecta um banco (demonstração) depois de autorizar, e desconecta', async () => {
    jest.useFakeTimers();
    try {
      await render(<App />);
      await fireEvent.press(screen.getByRole('button', { name: 'Abrir perfil' }));
      await fireEvent.press(screen.getByRole('button', { name: /^Bancos conectados/ }));
      await fireEvent.press(screen.getByRole('button', { name: 'Conectar Banco Aurora' }));
      expect(screen.getByText('O que vai ser compartilhado')).toBeTruthy();
      expect(screen.getByText(/só leitura/)).toBeTruthy();
      await fireEvent.press(screen.getByRole('button', { name: 'Autorizar e conectar' }));
      await act(async () => {
        jest.runAllTimers();
      });
      expect(screen.getByText('Conectados (1)')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Conectar Banco Aurora' })).toBeNull();
      await fireEvent.press(screen.getByRole('button', { name: 'Desconectar Banco Aurora' }));
      expect(screen.queryByText('Conectados (1)')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('liga os avisos: pede permissão, agenda no celular e manda um de teste', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir perfil' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Avisos no celular/ }));
    expect(screen.getByText('Os avisos que você receberia')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Receber avisos'), 'valueChange', true);
    expect(screen.getByText(/Pronto! Os avisos chegam às 9h/)).toBeTruthy();
    expect(useAvisos.getState().ativados).toBe(true);
    expect(notificacoes.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(notificacoes.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ type: 'date' }) }),
    );
    notificacoes.scheduleNotificationAsync.mockClear();
    await fireEvent.press(screen.getByRole('button', { name: 'Testar agora' }));
    expect(notificacoes.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { type: 'timeInterval', seconds: 5 } }),
    );
    expect(screen.getByText(/chega em 5 segundos/)).toBeTruthy();
  });

  it('sem permissão, explica o que fazer e não liga', async () => {
    notificacoes.getPermissionsAsync.mockResolvedValueOnce({ granted: false });
    notificacoes.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir perfil' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Avisos no celular/ }));
    await fireEvent(screen.getByLabelText('Receber avisos'), 'valueChange', true);
    expect(screen.getByText(/O celular não deixou/)).toBeTruthy();
    expect(useAvisos.getState().ativados).toBe(false);
  });
});
