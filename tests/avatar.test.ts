import { describe, expect, it } from 'vitest';
import { AVATAR_PADRAO, avatarAleatorio, avatarSvg, normalizarAvatar, OPCOES } from '@/lib/avatar';

describe('avatar', () => {
  it('ignora valores fora das opções (nada do usuário vira código)', () => {
    const a = normalizarAvatar({ bg: '"/><script>alert(1)</script>', hair: 'afro', acc: 'crown' });
    expect(a.bg).toBe(AVATAR_PADRAO.bg);
    expect(a.hair).toBe('afro');
    expect(avatarSvg({ bg: '"/><script>' })).not.toContain('script');
  });
  it('sorteia só valores válidos', () => {
    for (let i = 0; i < 50; i++) {
      const a = avatarAleatorio();
      for (const parte of Object.keys(OPCOES) as (keyof typeof OPCOES)[]) {
        expect(OPCOES[parte]).toContain(a[parte]);
      }
    }
  });
  it('gera um SVG', () => {
    expect(avatarSvg(AVATAR_PADRAO, 48)).toMatch(/^<svg[^>]+width="48"/);
  });
});
