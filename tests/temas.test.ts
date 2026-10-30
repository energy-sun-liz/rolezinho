import { describe, expect, it } from 'vitest';
import { temaPorId, TEMAS, validarLinkLocal } from '@/lib/temas';

describe('link da localização', () => {
  it('aceita links de Google Maps, Waze e Apple Mapas', () => {
    for (const l of [
      'https://maps.app.goo.gl/AbC123xyz',
      'https://www.google.com/maps/place/Chácara+Recanto/@-23.1,-46.5,15z',
      'https://google.com.br/maps?q=-23.1,-46.5',
      'https://goo.gl/maps/xyz',
      'https://waze.com/ul?ll=-23.1,-46.5',
      'https://www.waze.com/pt-BR/live-map/directions?to=ll.-23.1',
      'https://maps.apple.com/?ll=-23.1,-46.5',
    ]) expect(validarLinkLocal(l)).toEqual({ link: l, erro: null });
  });
  it('vazio é permitido (link opcional)', () => {
    expect(validarLinkLocal('  ')).toEqual({ link: null, erro: null });
  });
  it('recusa outros sites, http e imitações', () => {
    for (const l of ['http://maps.app.goo.gl/x', 'https://golpe.com/maps', 'https://maps.app.goo.gl.golpe.com/x', 'https://google.com.golpe.io/maps', 'javascript:alert(1)']) {
      expect(validarLinkLocal(l).erro).toMatch(/Google Maps/);
    }
  });
});

describe('temas', () => {
  it('cinco temas com cores e fonte, e Rolêzinho é o padrão', () => {
    expect(TEMAS.map((t) => t.id)).toEqual(['rolezinho', 'neon', 'pastel', 'dourado', 'arcade']);
    expect(temaPorId('neon').nome).toBe('Neon');
    expect(temaPorId('inventado').id).toBe('rolezinho');
  });
});
