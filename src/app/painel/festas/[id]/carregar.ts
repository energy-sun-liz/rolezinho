import { notFound } from 'next/navigation';
import { organizadorAtual } from '@/lib/organizador';
import type { StatusEvento } from '@/lib/periodo';

export type Festa = {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  local: string;
  status: StatusEvento;
  festa_inicio: string | null;
  festa_fim: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  relatorio_ate: string | null;
  pix_copia_cola_base: string | null;
  pix_chave: string | null;
  pix_nome_recebedor: string | null;
  pix_cidade: string | null;
  event_types: { nome: string; preco_centavos: number; max_convidados: number } | null;
  costs: Array<{ id: string; nome: string; valor_centavos: number; opcional: boolean }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Festa do organizador logado (o RLS garante que não vem festa de outra pessoa). */
export async function carregarFesta(id: string): Promise<Festa> {
  if (!UUID.test(id)) notFound();
  const { supabase } = await organizadorAtual();
  const { data } = await supabase
    .from('events')
    .select('id, slug, titulo, subtitulo, local, status, festa_inicio, festa_fim, periodo_inicio, periodo_fim, relatorio_ate, pix_copia_cola_base, pix_chave, pix_nome_recebedor, pix_cidade, event_types(nome, preco_centavos, max_convidados), costs(id, nome, valor_centavos, opcional)')
    .eq('id', id)
    .order('criado_em', { referencedTable: 'costs' })
    .maybeSingle<Festa>();
  if (!data || data.status === 'apagado') notFound();
  return data;
}
