import Link from 'next/link';
import { Suspense } from 'react';
import { SeloStatus } from '@/components/painel/Selo';
import { formatarReais } from '@/lib/dinheiro';
import { organizadorAtual } from '@/lib/organizador';
import { calcularPeriodo, type StatusEvento } from '@/lib/periodo';

type Linha = {
  id: string;
  titulo: string;
  status: StatusEvento;
  festa_inicio: string | null;
  periodo_inicio: string | null;
  event_types: { nome: string; preco_centavos: number } | null;
};

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });

async function ListaDeFestas() {
  const { supabase, organizador } = await organizadorAtual();
  const { data, error } = await supabase
    .from('events')
    .select('id, titulo, status, festa_inicio, periodo_inicio, event_types(nome, preco_centavos)')
    .neq('status', 'apagado')
    .order('criado_em', { ascending: false })
    .returns<Linha[]>();

  if (error) return <p role="alert" className="text-red-700">Não foi possível carregar suas festas.</p>;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-anil/70">Oi, {organizador.nome} 👋</p>
          <h1 className="text-3xl font-extralight tracking-tight">Minhas <span className="font-bold">festas</span></h1>
        </div>
        <Link href="/painel/nova" className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-5 py-2.5 font-bold text-noite">
          + Criar festa
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center">
          <p className="text-4xl" aria-hidden="true">🎉</p>
          <p className="mt-2 font-bold">Nenhuma festa ainda</p>
          <p className="text-anil/70">Crie a primeira: leva uns 3 minutos.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {data.map((e) => (
            <li key={e.id}>
              <Link href={`/painel/festas/${e.id}`} className="flex h-full flex-col gap-2 rounded-2xl bg-white p-5 transition hover:ring-2 hover:ring-rosa/40">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold">{e.titulo}</h2>
                  <SeloStatus status={e.status} />
                </div>
                <p className="text-sm text-anil/70">
                  {e.event_types?.nome}
                  {e.event_types && e.status === 'rascunho' && ` · ${formatarReais(e.event_types.preco_centavos)}`}
                </p>
                <p className="mt-auto text-sm text-anil/70">
                  {e.festa_inicio ? `🗓️ Festa em ${dataCurta(e.festa_inicio)}` : '🗓️ Data da festa a definir'}
                  {e.periodo_inicio && ` · período até ${calcularPeriodo(e.periodo_inicio).fim.split('-').reverse().join('/')}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function MinhasFestas() {
  return (
    <Suspense fallback={<p className="text-anil/60">Carregando suas festas…</p>}>
      <ListaDeFestas />
    </Suspense>
  );
}
