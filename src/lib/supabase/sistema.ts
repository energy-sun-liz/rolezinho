// Cliente do Supabase com a chave de SISTEMA (passa por cima do RLS).
// Use só no servidor (rotas de API, server actions), nunca em componente de navegador.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function configSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const chaveSistema = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, chaveSistema, configurado: Boolean(url && chaveSistema) };
}

let cliente: SupabaseClient | null = null;

export function supabaseSistema(): SupabaseClient {
  if (typeof window !== 'undefined') throw new Error('supabaseSistema() só pode rodar no servidor.');
  const { url, chaveSistema } = configSupabase();
  if (!url || !chaveSistema) throw new Error('Supabase não configurado (faltam as variáveis de ambiente).');
  cliente ??= createClient(url, chaveSistema, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}
