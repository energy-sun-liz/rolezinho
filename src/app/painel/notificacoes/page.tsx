import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AtivarNotificacoes } from '@/components/app/AtivarNotificacoes';
import { MarcarComoLidas } from '@/components/app/MarcarComoLidas';
import { organizadorAtual } from '@/lib/organizador';

export const metadata: Metadata = { title: 'Notificações' };

type Notificacao = { id: string; titulo: string; corpo: string; link: string | null; lida_em: string | null; criada_em: string };

const quando = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

async function Lista() {
  const { supabase } = await organizadorAtual();
  const { data } = await supabase
    .from('notificacoes')
    .select('id, titulo, corpo, link, lida_em, criada_em')
    .order('criada_em', { ascending: false })
    .limit(50)
    .returns<Notificacao[]>();
  const lista = data ?? [];
  const temNaoLida = lista.some((n) => !n.lida_em);
  return (
    <section className="flex flex-col gap-2 rounded-3xl bg-white p-5" aria-label="Notificações recebidas">
      {temNaoLida && <MarcarComoLidas />}
      {lista.length === 0 ? (
        <p className="py-6 text-center text-anil/60">Nenhuma notificação ainda. Elas aparecem aqui quando alguém pagar, cumprir missão ou a festa tiver novidade.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda">
          {lista.map((n) => (
            <li key={n.id}>
              <Link href={n.link ?? '/painel'} className="flex gap-3 py-3">
                <span className={`mt-2 size-2.5 shrink-0 rounded-full ${n.lida_em ? 'bg-transparent' : 'bg-rosa'}`} aria-label={n.lida_em ? undefined : 'Não lida'} />
                <span className="flex min-w-0 flex-col">
                  <span className={n.lida_em ? '' : 'font-bold'}>{n.titulo}</span>
                  {n.corpo && <span className="text-sm text-anil/75">{n.corpo}</span>}
                  <span className="text-xs text-anil/50">{quando(n.criada_em)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Notificacoes() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/painel" className="text-sm text-anil/70 hover:text-rosa">← Minhas festas</Link>
        <h1 className="mt-1 text-3xl font-extralight tracking-tight">Notifi<span className="font-bold">cações</span></h1>
      </div>
      <AtivarNotificacoes />
      <Suspense fallback={<p className="text-anil/60">Carregando…</p>}>
        <Lista />
      </Suspense>
    </div>
  );
}
