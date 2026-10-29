import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { organizadorAtual } from '@/lib/organizador';
import { FormNova, type TipoDeEvento } from './FormNova';

export const metadata: Metadata = { title: 'Criar festa' };

async function Conteudo() {
  const { supabase } = await organizadorAtual();
  const { data } = await supabase
    .from('event_types')
    .select('id, nome, exemplos, max_convidados, preco_centavos')
    .eq('ativo', true)
    .order('ordem');
  return <FormNova tipos={(data ?? []) as TipoDeEvento[]} />;
}

export default function NovaFesta() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/painel" className="text-sm text-anil/70 hover:text-rosa">← Minhas festas</Link>
        <h1 className="mt-1 text-3xl font-extralight tracking-tight">Criar <span className="font-bold">festa</span></h1>
      </div>
      <Suspense fallback={<p className="text-anil/60">Carregando tipos de evento…</p>}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
