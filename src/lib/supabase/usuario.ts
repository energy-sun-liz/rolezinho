// Cliente do Supabase em nome do usuário logado (respeita o RLS).
// Usa a chave pública; a sessão vem dos cookies.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function chavesPublicas() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) throw new Error('Supabase não configurado (faltam as variáveis públicas).');
  return { url, chave };
}

export async function supabaseUsuario() {
  const { url, chave } = chavesPublicas();
  const loja = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {
          // Chamado de um Server Component: não dá para gravar cookie aqui.
          // O proxy (src/proxy.ts) renova a sessão a cada requisição.
        }
      },
    },
  });
}
