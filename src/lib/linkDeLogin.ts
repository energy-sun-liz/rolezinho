// Pede ao Supabase o e-mail com o link de login.
//
// Usa o cliente simples do supabase-js com fluxo IMPLÍCITO de propósito: o link do
// e-mail devolve a sessão no próprio link (#access_token) e /auth/entrando conclui o
// login em qualquer navegador — inclusive o do app de e-mail no celular.
// O cliente do @supabase/ssr força PKCE, que só funciona no mesmo navegador que pediu.
import { createClient } from '@supabase/supabase-js';

export async function pedirLinkDeLogin(url: string, chavePublica: string, email: string, voltarPara: string) {
  const supabase = createClient(url, chavePublica, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: voltarPara, shouldCreateUser: true } });
}
