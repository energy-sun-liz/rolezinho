import { describe, expect, it } from 'vitest';
import { crc16, crcConfere, lerPixEstatico, montarPix, pixDoConvidado, pixPorDadosDigitados, PixInvalido } from '@/lib/pix';

// Código de exemplo (chave e nome fictícios), no mesmo formato que o Nubank gera.
const CHAVE = '123e4567-e12b-12d1-a456-426655440000';
const base = montarPix({ chave: CHAVE, nome: 'Fulana de Tal', cidade: 'SAO PAULO' }, 1, 'x');
// Versão "sem valor" do mesmo código: remove o campo 54 e refaz o CRC.
const semValor = (() => {
  const s = base.replace(/5404\d\.\d\d/, '').slice(0, -4);
  return s + crc16(s);
})();

describe('Pix copia-e-cola', () => {
  it('confere o CRC de um código real de exemplo do Banco Central', () => {
    const exemplo = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';
    expect(crcConfere(exemplo)).toBe(true);
  });

  it('lê chave, nome e cidade do código estático sem valor', () => {
    const dados = lerPixEstatico(semValor);
    expect(dados).toMatchObject({ chave: CHAVE, nome: 'Fulana de Tal', cidade: 'SAO PAULO' });
    expect(dados.valor).toBeUndefined();
  });

  it('gera o Pix do convidado com valor exato e identificador', () => {
    const codigo = pixDoConvidado(semValor, 12000, 'ROLE-ANA7K');
    expect(crcConfere(codigo)).toBe(true);
    const lido = lerPixEstatico(codigo);
    expect(lido).toMatchObject({ chave: CHAVE, valor: '120.00', identificador: 'ROLEANA7K' });
  });

  it('valores com centavos saem com duas casas', () => {
    expect(lerPixEstatico(pixDoConvidado(semValor, 5, 'A')).valor).toBe('0.05');
    expect(lerPixEstatico(pixDoConvidado(semValor, 3333, 'A')).valor).toBe('33.33');
  });

  it('recusa código com CRC errado', () => {
    expect(() => lerPixEstatico(semValor.slice(0, -4) + '0000')).toThrow(PixInvalido);
  });

  it('recusa Pix dinâmico (link de cobrança)', () => {
    const f = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v;
    const conta = f('00', 'BR.GOV.BCB.PIX') + f('25', 'pix.example.com/qr/v2/abc123');
    const s = f('00', '01') + f('01', '12') + f('26', conta) + f('52', '0000') + f('53', '986') + f('58', 'BR') +
      f('59', 'Fulano de Tal') + f('60', 'BRASILIA') + f('62', f('05', '***')) + '6304';
    expect(() => lerPixEstatico(s + crc16(s))).toThrow(/dinâmico/);
  });

  it('recusa valor zero ou quebrado', () => {
    expect(() => pixDoConvidado(semValor, 0, 'A')).toThrow();
    expect(() => pixDoConvidado(semValor, 10.5, 'A')).toThrow();
  });

  it('plano B: monta a partir de dados digitados, sem acento e no tamanho certo', () => {
    const codigo = pixPorDadosDigitados('fulana@email.com', 'Fulána de Tál com um nome bem comprido', 'São José dos Campos', 2500, 'ROLE1');
    const lido = lerPixEstatico(codigo);
    expect(lido.nome).toBe('FULANA DE TAL COM UM NOME');
    expect(lido.cidade).toBe('SAO JOSE DOS CA');
    expect(lido.valor).toBe('25.00');
  });
});
