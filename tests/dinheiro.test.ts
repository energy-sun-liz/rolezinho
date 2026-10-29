import { describe, expect, it } from 'vitest';
import {
  formatarReais, mudarStatus, podeMudar, reaisParaCentavos, situacaoDoConvidado, valorDevido, valorDoNovoTicket,
} from '@/lib/dinheiro';

const custos = [
  { id: 'aluguel', valorCentavos: 12000, opcional: false },
  { id: 'bebidas', valorCentavos: 4550, opcional: true },
  { id: 'churrasco', valorCentavos: 3000, opcional: true },
];

describe('valor devido', () => {
  it('soma obrigatórios e só os opcionais em que o convidado entrou', () => {
    expect(valorDevido(custos, {})).toBe(12000);
    expect(valorDevido(custos, { bebidas: true })).toBe(16550);
    expect(valorDevido(custos, { bebidas: true, churrasco: true })).toBe(19550);
    expect(valorDevido(custos, { bebidas: false, churrasco: true })).toBe(15000);
  });

  it('recusa valor quebrado ou negativo', () => {
    expect(() => valorDevido([{ id: 'x', valorCentavos: 10.5, opcional: false }], {})).toThrow();
    expect(() => valorDevido([{ id: 'x', valorCentavos: -1, opcional: false }], {})).toThrow();
  });
});

describe('formatos', () => {
  it('converte reais digitados em centavos sem erro de arredondamento', () => {
    expect(reaisParaCentavos('120')).toBe(12000);
    expect(reaisParaCentavos('45,50')).toBe(4550);
    expect(reaisParaCentavos('R$ 1.234,56')).toBe(123456);
    expect(reaisParaCentavos('0,1')).toBe(10);
    expect(reaisParaCentavos('19,99')).toBe(1999);
    expect(() => reaisParaCentavos('abc')).toThrow();
    expect(() => reaisParaCentavos('')).toThrow();
  });
  it('mostra em reais', () => {
    expect(formatarReais(16550).replace(/\s/g, ' ')).toBe('R$ 165,50');
  });
});

describe('tickets de pagamento', () => {
  it('convidado informa, organizador confirma', () => {
    expect(mudarStatus('convidado', 'pendente', 'informado')).toBe('informado');
    expect(mudarStatus('organizador', 'informado', 'confirmado')).toBe('confirmado');
  });
  it('organizador contesta e convidado reenvia', () => {
    expect(mudarStatus('organizador', 'informado', 'contestado')).toBe('contestado');
    expect(mudarStatus('convidado', 'contestado', 'informado')).toBe('informado');
  });
  it('convidado não confirma o próprio pagamento', () => {
    expect(podeMudar('convidado', 'informado', 'confirmado')).toBe(false);
    expect(() => mudarStatus('convidado', 'pendente', 'confirmado')).toThrow();
  });
  it('organizador não marca "informado" no lugar do convidado', () => {
    expect(podeMudar('organizador', 'pendente', 'informado')).toBe(false);
  });
  it('organizador pode confirmar pagamento feito por fora e desfazer', () => {
    expect(podeMudar('organizador', 'pendente', 'confirmado')).toBe(true);
    expect(podeMudar('organizador', 'confirmado', 'informado')).toBe(true);
  });
});

describe('situação do convidado', () => {
  it('pendente, aguardando, parcial e pago', () => {
    expect(situacaoDoConvidado(12000, []).situacao).toBe('pendente');
    expect(situacaoDoConvidado(12000, [{ valorCentavos: 12000, status: 'informado' }]).situacao).toBe('aguardando');
    expect(situacaoDoConvidado(16550, [{ valorCentavos: 12000, status: 'confirmado' }])).toMatchObject({ situacao: 'parcial', falta: 4550 });
    expect(situacaoDoConvidado(12000, [{ valorCentavos: 12000, status: 'confirmado' }])).toMatchObject({ situacao: 'pago', falta: 0 });
  });
  it('contestado não conta como pago', () => {
    expect(situacaoDoConvidado(12000, [{ valorCentavos: 12000, status: 'contestado' }]).situacao).toBe('pendente');
  });
  it('quem não deve nada aparece como pago', () => {
    expect(situacaoDoConvidado(0, []).situacao).toBe('pago');
  });
});

describe('novo ticket quando o valor muda', () => {
  it('cobra só a diferença depois de entrar num opcional', () => {
    expect(valorDoNovoTicket(16550, [{ valorCentavos: 12000, status: 'confirmado' }])).toBe(4550);
  });
  it('desconta o que está aguardando conferência', () => {
    expect(valorDoNovoTicket(16550, [{ valorCentavos: 12000, status: 'informado' }])).toBe(4550);
  });
  it('não cria ticket se já está coberto', () => {
    expect(valorDoNovoTicket(12000, [{ valorCentavos: 16550, status: 'confirmado' }])).toBe(0);
  });
});
