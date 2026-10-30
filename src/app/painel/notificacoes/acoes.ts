'use server';

import { refresh } from 'next/cache';
import { notificar } from '@/lib/notificacoes';
import { organizadorAtual } from '@/lib/organizador';

type Inscricao = { endpoint: string; keys?: { p256dh?: string; auth?: string } };

export async function inscreverAparelho(inscricao: Inscricao, aparelho: string): Promise<{ ok: boolean; mensagem: string }> {
  const { supabase, organizador } = await organizadorAtual();
  const { endpoint, keys } = inscricao ?? {};
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !keys?.p256dh || !keys?.auth) {
    return { ok: false, mensagem: 'Inscrição inválida.' };
  }
  // Mesmo aparelho inscrito de novo: troca pela inscrição nova.
  await supabase.from('push_inscricoes').delete().eq('endpoint', endpoint);
  const { error } = await supabase.from('push_inscricoes').insert({
    organizer_id: organizador.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, aparelho: aparelho.slice(0, 200),
  });
  return error ? { ok: false, mensagem: 'Não foi possível ativar neste aparelho.' } : { ok: true, mensagem: 'Notificações ativadas neste aparelho.' };
}

export async function removerAparelho(endpoint: string): Promise<void> {
  const { supabase } = await organizadorAtual();
  await supabase.from('push_inscricoes').delete().eq('endpoint', endpoint);
}

export async function marcarTodasLidas(): Promise<void> {
  const { supabase, organizador } = await organizadorAtual();
  await supabase.from('notificacoes').update({ lida_em: new Date().toISOString() }).eq('organizer_id', organizador.id).is('lida_em', null);
  refresh();
}

export async function enviarTeste(): Promise<{ ok: boolean; mensagem: string }> {
  const { organizador } = await organizadorAtual();
  const r = await notificar({
    para: { organizerId: organizador.id },
    tipo: 'teste',
    titulo: 'Funcionou! 🎉',
    corpo: 'Assim chegam os avisos do Rolêzinho: pagamento informado, missão cumprida, novidades da festa.',
    link: '/painel/notificacoes',
  });
  if (!r.criada) return { ok: false, mensagem: 'Não foi possível criar a notificação.' };
  return {
    ok: true,
    mensagem: r.enviados > 0
      ? `Enviada para ${r.enviados} aparelho${r.enviados > 1 ? 's' : ''}.`
      : 'Apareceu no sino. Para receber no celular com o app fechado, ative as notificações abaixo.',
  };
}
