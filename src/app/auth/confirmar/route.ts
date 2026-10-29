// Entrada pelo link do e-mail.
// - token_hash (modelo de e-mail do Rolêzinho): funciona em QUALQUER navegador/aparelho,
//   inclusive o navegador interno do app de e-mail no celular.
// - code (modelo padrão do Supabase): só funciona no mesmo navegador que pediu o link.
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseUsuario } from '@/lib/supabase/usuario';
import { destinoSeguro } from '@/lib/destino';

const TIPOS: EmailOtpType[] = ['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change'];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const tipo = (searchParams.get('type') ?? 'email') as EmailOtpType;
  const codigo = searchParams.get('code');
  const proximo = destinoSeguro(searchParams.get('proximo') ?? searchParams.get('next'));
  const supabase = await supabaseUsuario();

  if (tokenHash && TIPOS.includes(tipo)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (!error) return NextResponse.redirect(`${origin}${proximo}`);
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(`${origin}${proximo}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
