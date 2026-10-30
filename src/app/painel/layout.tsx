import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ConviteInstalar } from '@/components/app/ConviteInstalar';
import { Sino } from '@/components/app/Sino';
import { Simbolo } from '@/components/marca/Simbolo';
import { organizadorAtual } from '@/lib/organizador';
import { sair } from '../entrar/acoes';

export const metadata: Metadata = { title: { default: 'Painel', template: '%s · Painel Rolêzinho' } };

async function QuemEsta() {
  const { supabase, organizador } = await organizadorAtual();
  const { count } = await supabase.from('notificacoes').select('id', { count: 'exact', head: true }).is('lida_em', null);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden max-w-48 truncate text-white/70 md:inline">{organizador.email}</span>
      <Sino organizerId={organizador.id} naoLidasInicial={count ?? 0} />
      <form action={sair}>
        <button type="submit" className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10">Sair</button>
      </form>
    </div>
  );
}

export default function LayoutPainel({ children }: LayoutProps<'/painel'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-lavanda">
      {/* safe-area: no iPhone com o app instalado, o cabeçalho fica abaixo do relógio */}
      <header className="bg-noite" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/painel" className="flex min-w-0 items-center gap-2 text-white">
            <Simbolo tamanho={36} variante="escuro" id="cab" />
            <span className="font-pincel text-2xl">Rolêzinho</span>
            <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest sm:inline">Organizador</span>
          </Link>
          <Suspense fallback={null}><QuemEsta /></Suspense>
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <ConviteInstalar />
        {children}
      </div>
    </div>
  );
}
