// Volta do link mágico (fluxo padrão do Supabase) e do Google: troca o código pela sessão.
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseUsuario } from '@/lib/supabase/usuario';
import { destinoSeguro } from '@/lib/destino';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get('code');
  const proximo = destinoSeguro(searchParams.get('proximo'));
  if (codigo) {
    const supabase = await supabaseUsuario();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(`${origin}${proximo}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
