import { describe, expect, it } from 'vitest';
import { gerarSlug, horaLocalParaIso, isoParaHoraLocal, sufixoAleatorio, validarCusto, validarDadosDaFesta } from '@/lib/festa';
import { destinoSeguro } from '@/lib/destino';

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

describe('slug', () => {
  it('sem acento, minúsculo e com sufixo', () => {
    expect(gerarSlug('Aniversário da Lizandra!', 'x7k2')).toBe('aniversario-da-lizandra-x7k2');
    expect(gerarSlug('   ', 'ab12')).toBe('role-ab12');
    expect(gerarSlug('a'.repeat(80), 'zz99')).toMatch(/^a{50}-zz99$/);
  });
  it('sufixo aleatório só com caracteres seguros', () => {
    expect(sufixoAleatorio()).toMatch(/^[a-hj-km-np-z2-9]{4}$/);
  });
});

describe('datas da festa', () => {
  it('converte para o horário de Brasília e volta', () => {
    expect(horaLocalParaIso('2026-11-20T18:00')).toBe('2026-11-20T18:00:00-03:00');
    expect(isoParaHoraLocal('2026-11-20T21:00:00+00:00')).toBe('2026-11-20T18:00');
    expect(horaLocalParaIso('20/11/2026')).toBeNull();
  });

  it('aceita festa dentro do período de 45 dias', () => {
    const r = validarDadosDaFesta(form({
      titulo: 'Aniversário', festa_inicio: '2026-11-20T18:00', festa_fim: '2026-11-22T18:00', periodo_inicio: '2026-11-01',
    }), '2026-10-29');
    expect(r.erros).toEqual([]);
    expect(r.dados.festa_inicio).toBe('2026-11-20T18:00:00-03:00');
  });

  it('recusa nome vazio, fim antes do começo, período no passado e festa fora do período', () => {
    expect(validarDadosDaFesta(form({ titulo: '' }), '2026-10-29').erros).toContain('Dê um nome para a festa.');
    expect(validarDadosDaFesta(form({ titulo: 'X', festa_inicio: '2026-11-22T18:00', festa_fim: '2026-11-20T18:00' }), '2026-10-29').erros)
      .toContain('O fim da festa não pode ser antes do começo.');
    expect(validarDadosDaFesta(form({ titulo: 'X', periodo_inicio: '2026-10-01' }), '2026-10-29').erros)
      .toContain('O período não pode começar no passado.');
    // festa já ativa: período no passado mas sem mudança é aceito
    expect(validarDadosDaFesta(form({ titulo: 'X', periodo_inicio: '2026-10-01' }), '2026-10-29', '2026-10-01').erros).toEqual([]);
    expect(validarDadosDaFesta(form({
      titulo: 'X', festa_inicio: '2027-01-20T18:00', festa_fim: '2027-01-21T18:00', periodo_inicio: '2026-11-01',
    }), '2026-10-29').erros.join()).toMatch(/precisa acontecer/);
  });
});

describe('custos', () => {
  it('aceita valor em reais e marca opcional', () => {
    expect(validarCusto(form({ nome: 'Bebidas', valor: '45,50', opcional: 'on' }))).toEqual({
      erro: null, custo: { nome: 'Bebidas', valor_centavos: 4550, opcional: true },
    });
  });
  it('recusa sem nome, valor zero ou inválido', () => {
    expect(validarCusto(form({ nome: '', valor: '10' })).erro).toMatch(/nome/);
    expect(validarCusto(form({ nome: 'X', valor: '0' })).erro).toMatch(/maior que zero/);
    expect(validarCusto(form({ nome: 'X', valor: 'abc' })).erro).toMatch(/inválido/);
  });
});

describe('destino depois do login', () => {
  it('só aceita caminhos do painel', () => {
    expect(destinoSeguro('/painel/festas/1')).toBe('/painel/festas/1');
    expect(destinoSeguro('https://golpe.com')).toBe('/painel');
    expect(destinoSeguro('//golpe.com')).toBe('/painel');
    expect(destinoSeguro(null)).toBe('/painel');
  });
});
