import { connection } from 'next/server';
import { configSupabase, supabaseSistema } from '@/lib/supabase/sistema';

// Diz se o app e o banco estão de pé. Não expõe dados.
export async function GET() {
  await connection(); // sempre na hora, nunca pré-gerado
  let banco: 'ok' | 'nao_configurado' | 'erro' = 'nao_configurado';
  let tiposDeEvento: number | null = null;
  if (configSupabase().configurado) {
    const { count, error } = await supabaseSistema().from('event_types').select('*', { count: 'exact', head: true });
    banco = error ? 'erro' : 'ok';
    tiposDeEvento = error ? null : count;
  }
  return Response.json({ app: 'ok', banco, tiposDeEvento }, { headers: { 'Cache-Control': 'no-store' } });
}
