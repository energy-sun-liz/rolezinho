// Notificações: grava no sino do app e envia para os aparelhos inscritos (Web Push).
// Só roda no servidor (usa a chave de sistema).
import webpush from 'web-push';
import { supabaseSistema } from '@/lib/supabase/sistema';

export type Destino = { organizerId: string } | { guestId: string };

export type NovaNotificacao = {
  para: Destino;
  eventId?: string | null;
  tipo: string;
  titulo: string;
  corpo?: string;
  link?: string;
};

/** O que vai dentro do push (lido pelo public/sw.js). */
export function conteudoDoPush(n: NovaNotificacao) {
  return {
    titulo: n.titulo.slice(0, 80),
    corpo: (n.corpo ?? '').slice(0, 240),
    link: linkSeguro(n.link),
    tag: n.tipo,
  };
}

/** Só caminhos internos; qualquer outra coisa vira /painel. */
export function linkSeguro(link: string | undefined): string {
  if (!link || !link.startsWith('/') || link.startsWith('//') || !/^\/[A-Za-z0-9/_?=&%.-]*$/.test(link)) return '/painel';
  return link;
}

/** 404/410: o aparelho cancelou a inscrição (app desinstalado, permissão revogada). */
export function inscricaoExpirou(erro: unknown): boolean {
  const status = (erro as { statusCode?: number } | null)?.statusCode;
  return status === 404 || status === 410;
}

let vapidPronto: boolean | null = null;
function prepararVapid(): boolean {
  if (vapidPronto !== null) return vapidPronto;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const contato = process.env.VAPID_SUBJECT ?? 'https://rolezinho-chi.vercel.app';
  vapidPronto = Boolean(publica && privada);
  if (vapidPronto) webpush.setVapidDetails(contato, publica!, privada!);
  return vapidPronto;
}

export async function notificar(n: NovaNotificacao): Promise<{ criada: boolean; enviados: number; removidos: number }> {
  const sistema = supabaseSistema();
  const dono = 'organizerId' in n.para ? { organizer_id: n.para.organizerId } : { guest_id: n.para.guestId };
  const conteudo = conteudoDoPush(n);

  const { error } = await sistema.from('notificacoes').insert({
    ...dono,
    event_id: n.eventId ?? null,
    tipo: n.tipo,
    titulo: conteudo.titulo,
    corpo: conteudo.corpo,
    link: conteudo.link,
  });
  if (error) return { criada: false, enviados: 0, removidos: 0 };
  if (!prepararVapid()) return { criada: true, enviados: 0, removidos: 0 };

  const filtro = 'organizer_id' in dono ? sistema.from('push_inscricoes').select('id, endpoint, p256dh, auth').eq('organizer_id', dono.organizer_id)
    : sistema.from('push_inscricoes').select('id, endpoint, p256dh, auth').eq('guest_id', dono.guest_id);
  const { data: aparelhos } = await filtro;

  let enviados = 0;
  const expirados: string[] = [];
  await Promise.all((aparelhos ?? []).map(async (a) => {
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        JSON.stringify(conteudo),
        { TTL: 60 * 60 * 24, urgency: 'high' },
      );
      enviados++;
    } catch (e) {
      if (inscricaoExpirou(e)) expirados.push(a.id);
    }
  }));
  if (expirados.length) await sistema.from('push_inscricoes').delete().in('id', expirados);
  return { criada: true, enviados, removidos: expirados.length };
}
