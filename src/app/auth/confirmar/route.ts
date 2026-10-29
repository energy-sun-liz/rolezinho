// Confirmação por token (modelo de e-mail com {{ .TokenHash }}): funciona mesmo
// se o link for aberto em outro aparelho.
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseUsuario } from '@/lib/supabase/usuario';
import { destinoSeguro } from '@/lib/destino';

const TIPOS: EmailOtpType[] = ['magiclink', 'email', 'signup', 'invite', 'recovery', 'email_change'];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;
  const proximo = destinoSeguro(searchParams.get('proximo') ?? searchParams.get('next'));
  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await supabaseUsuario();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (!error) return NextResponse.redirect(`${origin}${proximo}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
