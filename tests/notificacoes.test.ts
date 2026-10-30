import { describe, expect, it } from 'vitest';
import { conteudoDoPush, inscricaoExpirou, linkSeguro } from '@/lib/notificacoes';

describe('conteúdo da notificação', () => {
  it('limita tamanho e usa o tipo como tag (notificações do mesmo tipo se agrupam)', () => {
    const c = conteudoDoPush({ para: { organizerId: 'x' }, tipo: 'pagamento_informado', titulo: 'T'.repeat(100), corpo: 'C'.repeat(300), link: '/painel/festas/1' });
    expect(c.titulo).toHaveLength(80);
    expect(c.corpo).toHaveLength(240);
    expect(c).toMatchObject({ tag: 'pagamento_informado', link: '/painel/festas/1' });
  });

  it('link só para dentro do app', () => {
    expect(linkSeguro('/painel/notificacoes')).toBe('/painel/notificacoes');
    expect(linkSeguro('https://golpe.com')).toBe('/painel');
    expect(linkSeguro('//golpe.com')).toBe('/painel');
    expect(linkSeguro('/painel/<script>')).toBe('/painel');
    expect(linkSeguro(undefined)).toBe('/painel');
  });

  it('reconhece aparelho que cancelou a inscrição', () => {
    expect(inscricaoExpirou({ statusCode: 410 })).toBe(true);
    expect(inscricaoExpirou({ statusCode: 404 })).toBe(true);
    expect(inscricaoExpirou({ statusCode: 500 })).toBe(false);
    expect(inscricaoExpirou(null)).toBe(false);
  });
});
