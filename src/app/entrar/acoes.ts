'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseUsuario } from '@/lib/supabase/usuario';

export type EstadoEntrar = { ok: boolean; mensagem: string; email?: string };

async function origem(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function enviarLink(_: EstadoEntrar, dados: FormData): Promise<EstadoEntrar> {
  const email = String(dados.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, mensagem: 'Digite um e-mail válido.', email };
  }
  const supabase = await supabaseUsuario();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origem()}/auth/confirmar?proximo=/painel` },
  });
  if (error) {
    const limite = /rate|limit|seconds/i.test(error.message);
    return {
      ok: false,
      email,
      mensagem: limite
        ? 'Muitos pedidos de link em pouco tempo. Espere alguns minutos e tente de novo.'
        : 'Não foi possível enviar o link agora. Tente de novo.',
    };
  }
  return { ok: true, email, mensagem: `Enviamos um link para ${email}. Abra o e-mail (pode ser no celular) e toque no link.` };
}

export async function entrarComGoogle(): Promise<void> {
  const supabase = await supabaseUsuario();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await origem()}/auth/callback?proximo=/painel` },
  });
  if (error || !data.url) redirect('/entrar?erro=google');
  redirect(data.url);
}

export async function sair(): Promise<void> {
  const supabase = await supabaseUsuario();
  await supabase.auth.signOut();
  redirect('/entrar');
}
