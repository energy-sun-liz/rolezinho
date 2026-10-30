'use client';

// Conclui o login do link do e-mail. A sessão chega no fragmento da URL (#access_token=…),
// que só o navegador enxerga; o cliente do Supabase lê, grava nos cookies e seguimos ao painel.
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function mensagemDoLink(hash: string, tinhaCodigo: boolean): string {
  const p = new URLSearchParams(hash.slice(1));
  if (p.get('error_code') === 'otp_expired') return 'Este link expirou ou já foi usado.';
  if (p.get('error')) return 'Não foi possível entrar com este link.';
  if (tinhaCodigo) return 'Este link é de um formato antigo e precisa ser aberto no mesmo navegador em que foi pedido. Peça um link novo.';
  return 'Não encontramos o login neste link.';
}

export function Concluir() {
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const hashOriginal = window.location.hash;
    const p = new URLSearchParams(hashOriginal.slice(1));
    const access_token = p.get('access_token');
    const refresh_token = p.get('refresh_token');
    // Links do formato antigo (?code=) só funcionam no mesmo navegador que pediu o link.
    const codigo = new URLSearchParams(window.location.search).get('code');
    // Tira os tokens da barra de endereço (e do histórico) antes de qualquer coisa.
    window.history.replaceState(null, '', window.location.pathname);

    // O @supabase/ssr força o fluxo PKCE no navegador e não lê o #access_token sozinho;
    // por isso entregamos a sessão manualmente. setSession confere o token no Supabase
    // e grava a sessão nos cookies, que o servidor do app enxerga.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      { auth: { detectSessionInUrl: false } },
    );
    let ativo = true;
    const concluir = access_token && refresh_token
      ? supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => !error && Boolean(data.session))
      : codigo
        ? supabase.auth.exchangeCodeForSession(codigo).then(({ data, error }) => !error && Boolean(data.session))
        : Promise.resolve(false);
    concluir.then((entrou) => {
      if (!ativo) return;
      if (entrou) window.location.replace('/painel');
      else setErro(mensagemDoLink(hashOriginal, Boolean(codigo)));
    });
    return () => { ativo = false; };
  }, []);

  if (erro) {
    return (
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-4xl" aria-hidden="true">😕</p>
        <p role="alert" className="font-bold">{erro}</p>
        <Link href="/entrar" className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite">
          Pedir um link novo
        </Link>
      </div>
    );
  }
  return (
    <p role="status" className="text-lg">
      Entrando no Rolêzinho… <span aria-hidden="true">🎉</span>
    </p>
  );
}
