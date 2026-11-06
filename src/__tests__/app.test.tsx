import { fireEvent, render, screen } from '@testing-library/react-native';
import { Share } from 'react-native';
import App from '../../App';
import { simularEmprestimo } from '../dominio/emprestimo';
import { dinheiro } from '../dominio/formato';
import { useLoja } from '../estado/loja';
import { useNavegacao } from '../estado/navegacao';
import { useInvestimentos } from '../estado/investimentos';
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
  });

  it('a demonstração mostra quem deve e quanto', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));
    // Bruno: 120,00 do churrasco + 22,45 da Netflix. Carla: 120,00. A Ana já pagou.
    expect(screen.getByText('R$ 262,45')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobrar Bruno, R\$.142,45/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Cobrar Carla, R\$.120,00/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Cobrar Ana/ })).toBeNull();
  });

  it('o Início e a Netflix mostram a sua parte depois da divisão', async () => {
    await render(<App />);
    expect(screen.getByText(/Com as divisões, sai do seu bolso/)).toBeTruthy();
    expect(screen.getByText('R$ 242,85')).toBeTruthy(); // 265,30 − 22,45 do Bruno
    expect(screen.getByRole('button', { name: /^Te devem R\$.262,45/ })).toBeTruthy();
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

  it('cobra sem Pix e, depois de cadastrar a chave, cobra com o copia e cola', async () => {
    const compartilhar = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<App />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Rachar' }));

    await fireEvent.press(screen.getByRole('button', { name: /^Cobrar Carla/ }));
    expect(compartilhar).toHaveBeenLastCalledWith({ message: expect.stringContaining('Me manda por Pix') });

    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar chave Pix' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText(/Não reconheci essa chave/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Chave Pix'), '(11) 98765-4321');
    await fireEvent.changeText(screen.getByLabelText('Seu nome'), 'Mauro');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await fireEvent.press(screen.getByRole('button', { name: /^Cobrar Carla/ }));
    const mensagem = (compartilhar.mock.calls.at(-1)![0] as { message: string }).message;
    expect(mensagem).toContain('Oi, Carla!');
    expect(mensagem).toContain('Pix copia e cola:\n000201');
    expect(mensagem).toContain('5406120.00'); // o valor exato que a Carla deve
    compartilhar.mockRestore();
  });
});

describe('investir', () => {
  beforeEach(() => {
    useNavegacao.setState({ aba: 'inicio', pilha: [] });
    useLoja.getState().recomecar();
    useRachas.setState(RACHAS_INICIAL, true);
    useInvestimentos.setState(INVESTIMENTOS_INICIAL, true);
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
