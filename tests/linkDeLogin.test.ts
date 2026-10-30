import { afterEach, describe, expect, it, vi } from 'vitest';
import { pedirLinkDeLogin } from '@/lib/linkDeLogin';

afterEach(() => vi.unstubAllGlobals());

describe('pedido do link de login', () => {
  it('usa o fluxo que funciona em qualquer navegador (sem PKCE) e volta para /auth/entrando', async () => {
    const chamadas: Array<{ url: string; corpo: Record<string, unknown> }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      chamadas.push({ url: String(url), corpo: JSON.parse(String(init?.body ?? '{}')) });
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    const { error } = await pedirLinkDeLogin('https://exemplo.supabase.co', 'chave-publica', 'ana@x.com', 'https://app.exemplo/auth/entrando');

    expect(error).toBeNull();
    const otp = chamadas.find((c) => c.url.includes('/auth/v1/otp'));
    expect(otp).toBeDefined();
    expect(otp!.corpo.email).toBe('ana@x.com');
    // PKCE mandaria code_challenge: o link só funcionaria no mesmo navegador que pediu.
    expect(otp!.corpo.code_challenge ?? null).toBeNull();
    expect(otp!.url).toContain(encodeURIComponent('https://app.exemplo/auth/entrando'));
  });
});
