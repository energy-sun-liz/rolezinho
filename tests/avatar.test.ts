import { describe, expect, it } from 'vitest';
import { AVATAR_PADRAO, avatarAleatorio, avatarSvg, NOMES, normalizarAvatar, OPCOES, type ParteAvatar } from '@/lib/avatar';

describe('avatar', () => {
  it('ignora valores fora das opções (nada do usuário vira código)', () => {
    const a = normalizarAvatar({ bg: '"/><script>alert(1)</script>', hair: 'afro', acc: 'crown', extra: 'url(javascript:1)' });
    expect(a.bg).toBe(AVATAR_PADRAO.bg);
    expect(a.hair).toBe('afro');
    expect(a.extra).toBe('none');
    expect(avatarSvg({ bg: '"/><script>' })).not.toContain('script');
  });

  it('avatares antigos (sem "extra") continuam funcionando', () => {
    const antigo = { bg: '#22b8ff', skin: '#8d5524', hair: 'afro', hairColor: '#1a1a1a', eyes: 'shades', mouth: 'cool', acc: 'none' };
    expect(normalizarAvatar(antigo)).toEqual({ ...antigo, extra: 'none' });
  });

  it('sorteia só valores válidos', () => {
    for (let i = 0; i < 50; i++) {
      const a = avatarAleatorio();
      for (const parte of Object.keys(OPCOES) as ParteAvatar[]) expect(OPCOES[parte]).toContain(a[parte]);
    }
  });

  it('cada opção da coleção divos pop gera um SVG sem falhas e tem nome em português', () => {
    for (const parte of Object.keys(OPCOES) as ParteAvatar[]) {
      for (const valor of OPCOES[parte]) {
        const svg = avatarSvg({ ...AVATAR_PADRAO, [parte]: valor }, 48);
        expect(svg).toMatch(/^<svg[^>]+width="48"/);
        expect(svg).not.toMatch(/undefined|NaN|null/);
        if (!valor.startsWith('#')) expect(NOMES[valor], `${parte}: ${valor}`).toBeTruthy();
      }
    }
  });

  it('peruca arco-íris usa o degradê da marca', () => {
    const svg = avatarSvg({ ...AVATAR_PADRAO, hair: 'diva', hairColor: 'arco-iris' });
    expect(svg).toContain('id="rz-arco-iris"');
    expect(svg).toContain('url(#rz-arco-iris)');
  });
});
