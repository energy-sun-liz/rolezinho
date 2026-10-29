'use server';

import { redirect } from 'next/navigation';
import { gerarSlug, sufixoAleatorio } from '@/lib/festa';
import { mensagemDeErro, organizadorAtual } from '@/lib/organizador';

export type EstadoNova = { mensagem: string };

export async function criarFesta(_: EstadoNova, form: FormData): Promise<EstadoNova> {
  const { supabase, organizador } = await organizadorAtual();
  const titulo = String(form.get('titulo') ?? '').trim().slice(0, 120);
  const tipoId = String(form.get('tipo') ?? '');
  if (!titulo) return { mensagem: 'Dê um nome para a festa.' };
  if (!tipoId) return { mensagem: 'Escolha o tipo de evento.' };

  const tipo = await supabase.from('event_types').select('id').eq('id', tipoId).eq('ativo', true).maybeSingle();
  if (!tipo.data) return { mensagem: 'Tipo de evento inválido.' };

  // Slug com sufixo aleatório; tenta de novo no raro caso de repetir.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { data, error } = await supabase
      .from('events')
      .insert({ organizer_id: organizador.id, event_type_id: tipoId, titulo, slug: gerarSlug(titulo, sufixoAleatorio()) })
      .select('id')
      .single();
    if (data) redirect(`/painel/festas/${data.id}/dados`);
    if (error?.code !== '23505') return { mensagem: mensagemDeErro(error, 'Não foi possível criar a festa.') };
  }
  return { mensagem: 'Não foi possível criar a festa. Tente de novo.' };
}
