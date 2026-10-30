'use client';

// Sino do cabeçalho: contador de não lidas + alerta na hora quando chega notificação.
// Recebe pelo Supabase Realtime (app aberto) e pelo service worker (push).
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Alerta = { titulo: string; corpo: string; link: string };

export function Sino({ organizerId, naoLidasInicial }: { organizerId: string; naoLidasInicial: number }) {
  const [naoLidas, setNaoLidas] = useState(naoLidasInicial);
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const ultimo = useRef<{ chave: string; em: number }>({ chave: '', em: 0 });

  useEffect(() => {
    const mostrar = (a: Alerta, contar: boolean) => {
      // Realtime e push podem trazer a mesma notificação: mostra uma vez só.
      const chave = a.titulo + '|' + a.corpo;
      const agora = Date.now();
      const repetida = ultimo.current.chave === chave && agora - ultimo.current.em < 8000;
      ultimo.current = { chave, em: agora };
      if (repetida) return;
      if (contar) setNaoLidas((n) => n + 1);
      setAlerta(a);
      navigator.vibrate?.([60, 30, 60]);
    };

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    );
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let ativo = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo || !session) return;
      supabase.realtime.setAuth(session.access_token);
      canal = supabase
        .channel(`notificacoes-${organizerId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `organizer_id=eq.${organizerId}` },
          (p) => {
            const n = p.new as { titulo: string; corpo: string; link: string | null };
            mostrar({ titulo: n.titulo, corpo: n.corpo, link: n.link ?? '/painel/notificacoes' }, true);
          })
        .subscribe();
    });

    const doServiceWorker = (e: MessageEvent) => {
      if (e.data?.tipo === 'rolezinho-notificacao') mostrar({ titulo: e.data.titulo, corpo: e.data.corpo, link: e.data.link }, false);
    };
    const zerar = () => setNaoLidas(0);
    navigator.serviceWorker?.addEventListener('message', doServiceWorker);
    window.addEventListener('rolezinho-lidas', zerar);
    return () => {
      ativo = false;
      if (canal) supabase.removeChannel(canal);
      navigator.serviceWorker?.removeEventListener('message', doServiceWorker);
      window.removeEventListener('rolezinho-lidas', zerar);
    };
  }, [organizerId]);

  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(() => setAlerta(null), 6000);
    return () => clearTimeout(t);
  }, [alerta]);

  return (
    <>
      <Link href="/painel/notificacoes" aria-label={naoLidas ? `Notificações: ${naoLidas} não lidas` : 'Notificações'}
        className="relative grid size-9 place-items-center rounded-full text-white hover:bg-white/10">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-rosa px-1 text-[11px] font-bold leading-5 text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </Link>
      {alerta && (
        <div role="alert" className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-2xl bg-white p-4 text-anil shadow-2xl ring-1 ring-borda sm:top-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🔔</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{alerta.titulo}</p>
              {alerta.corpo && <p className="text-sm text-anil/80">{alerta.corpo}</p>}
              <Link href={alerta.link} onClick={() => setAlerta(null)} className="mt-1 inline-block text-sm font-bold text-rosa">Ver →</Link>
            </div>
            <button type="button" onClick={() => setAlerta(null)} aria-label="Fechar aviso" className="rounded-full px-2 text-anil/50 hover:bg-lavanda">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
