import { describe, expect, it } from 'vitest';
import {
  calcularPeriodo, hojeNoBrasil, podeEditar, somarMeses, statusPelasDatas, validarDataDaFesta, validarInicio,
} from '@/lib/periodo';

describe('período do evento', () => {
  it('45 dias contando o dia de início e relatório por 4 meses', () => {
    expect(calcularPeriodo('2026-11-01')).toEqual({ inicio: '2026-11-01', fim: '2026-12-15', relatorioAte: '2027-04-15' });
  });
  it('soma de meses respeita o fim do mês', () => {
    expect(somarMeses('2026-10-31', 4)).toBe('2027-02-28');
    expect(somarMeses('2027-10-31', 4)).toBe('2028-02-29');
  });
  it('início entre a compra e 90 dias depois', () => {
    expect(validarInicio('2026-11-01', '2026-10-29')).toBeNull();
    expect(validarInicio('2026-10-28', '2026-10-29')).toMatch(/antes da compra/);
    expect(validarInicio('2027-01-28', '2026-10-29')).toMatch(/90 dias/);
  });
  it('a festa precisa caber no período', () => {
    expect(validarDataDaFesta('2026-11-20', '2026-11-22', '2026-11-01')).toBeNull();
    expect(validarDataDaFesta('2026-12-15', '2026-12-16', '2026-11-01')).toMatch(/precisa acontecer/);
    expect(validarDataDaFesta('2026-11-22', '2026-11-20', '2026-11-01')).toMatch(/antes do começo/);
  });
});

describe('status pelas datas', () => {
  const e = { pago: true, periodoInicio: '2026-11-01' };
  it('rascunho, agendado, ativo, encerrado e apagado', () => {
    expect(statusPelasDatas({ pago: false, periodoInicio: null }, '2026-11-05')).toBe('rascunho');
    expect(statusPelasDatas({ pago: true, periodoInicio: null }, '2026-11-05')).toBe('agendado');
    expect(statusPelasDatas(e, '2026-10-31')).toBe('agendado');
    expect(statusPelasDatas(e, '2026-11-01')).toBe('ativo');
    expect(statusPelasDatas(e, '2026-12-15')).toBe('ativo');
    expect(statusPelasDatas(e, '2026-12-16')).toBe('encerrado');
    expect(statusPelasDatas(e, '2027-04-15')).toBe('encerrado');
    expect(statusPelasDatas(e, '2027-04-16')).toBe('apagado');
  });
  it('só edita antes de encerrar', () => {
    expect(podeEditar('ativo')).toBe(true);
    expect(podeEditar('encerrado')).toBe(false);
  });
  it('"hoje" usa o fuso de Brasília', () => {
    // 29/10/2026 às 01:00 UTC ainda é dia 28 em Brasília
    expect(hojeNoBrasil(new Date('2026-10-29T01:00:00Z'))).toBe('2026-10-28');
  });
});
