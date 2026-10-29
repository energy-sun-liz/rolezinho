// Renova a sessão do Supabase (cookies) antes das páginas do organizador.
// Não é a trava de segurança: quem protege os dados é o RLS e a checagem em cada página.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && request.nextUrl.pathname.startsWith('/painel')) {
    const entrar = request.nextUrl.clone();
    entrar.pathname = '/entrar';
    entrar.search = '';
    return NextResponse.redirect(entrar);
  }
  return resposta;
}

export const config = {
  matcher: ['/painel/:path*', '/entrar', '/auth/:path*'],
};
