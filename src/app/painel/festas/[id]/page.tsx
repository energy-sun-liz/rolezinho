import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SeloStatus } from '@/components/painel/Selo';
import { formatarReais } from '@/lib/dinheiro';
import { calcularPeriodo } from '@/lib/periodo';
import { temaPorId } from '@/lib/temas';
import { apagarRascunho } from './acoes';
import { carregarFesta, type Festa } from './carregar';
import { Cabecalho, Passos } from './Passos';

export const metadata: Metadata = { title: 'Resumo da festa' };

const dataBr = (iso: string) => iso.split('-').reverse().join('/');
const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

function pendencias(f: Festa): string[] {
  const p: string[] = [];
  if (!f.festa_inicio || !f.festa_fim) p.push('Definir quando a festa começa e termina');
  if (!f.periodo_inicio) p.push('Escolher o início do período de 45 dias');
  if (f.costs.length === 0) p.push('Cadastrar pelo menos um custo');
  if (!f.pix_chave) p.push('Cadastrar seu Pix para receber');
  return p;
}

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-lavanda p-4">
      <span className="text-xs font-bold uppercase tracking-widest text-anil/60">{rotulo}</span>
      <span>{children}</span>
    </div>
  );
}

async function Conteudo({ params }: { params: PageProps<'/painel/festas/[id]'>['params'] }) {
  const { id } = await params;
  const f = await carregarFesta(id);
  const falta = pendencias(f);
  const periodo = f.periodo_inicio ? calcularPeriodo(f.periodo_inicio) : null;
  const porPessoa = f.costs.filter((c) => !c.opcional).reduce((s, c) => s + c.valor_centavos, 0);

  return (
    <>
      <Cabecalho titulo={f.titulo} />
      <div className="flex flex-wrap items-center gap-3">
        <SeloStatus status={f.status} />
        <span className="text-sm text-anil/70">{f.event_types?.nome} · até {f.event_types?.max_convidados} convidados</span>
      </div>
      <Passos id={f.id} atual="resumo" />

      <section className="grid gap-3 rounded-3xl bg-white p-5 sm:grid-cols-2 sm:p-6">
        <Item rotulo="Festa">
          {f.festa_inicio && f.festa_fim ? `${dataHora(f.festa_inicio)} até ${dataHora(f.festa_fim)}` : 'A definir'}
        </Item>
        <Item rotulo="Local">
          {f.local || 'A definir'}
          {f.local_link && (
            <a href={f.local_link} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-bold text-rosa underline">📍 Como chegar</a>
          )}
        </Item>
        <Item rotulo="Tema">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-8 overflow-hidden rounded ring-1 ring-black/10" aria-hidden="true">
              <span className="flex-1" style={{ background: temaPorId(f.tema).cores.fundo }} />
              <span className="w-2" style={{ background: temaPorId(f.tema).cores.destaque }} />
              <span className="w-2" style={{ background: temaPorId(f.tema).cores.destaque2 }} />
            </span>
            {temaPorId(f.tema).nome}
          </span>
        </Item>
        <Item rotulo="Período ativo (45 dias)">{periodo ? `${dataBr(periodo.inicio)} a ${dataBr(periodo.fim)}` : 'A definir'}</Item>
        <Item rotulo="Relatório disponível até">{periodo ? dataBr(periodo.relatorioAte) : '—'}</Item>
        <Item rotulo="Cada convidado paga">{f.costs.length ? formatarReais(porPessoa) : '—'}</Item>
        <Item rotulo="Pix">{f.pix_chave ? `${f.pix_nome_recebedor}` : 'Não cadastrado'}</Item>
      </section>

      {f.status === 'rascunho' && (
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 sm:p-6">
          {falta.length > 0 ? (
            <>
              <h2 className="text-lg font-bold">Falta pouco para ativar</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {falta.map((p) => <li key={p}>◻️ {p}</li>)}
              </ul>
            </>
          ) : (
            <h2 className="text-lg font-bold">Tudo pronto ✅</h2>
          )}
          <div className="flex flex-col gap-2 rounded-2xl bg-noite p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/70">Ativar a festa · pagamento único</p>
              <p className="text-2xl font-bold">{f.event_types ? formatarReais(f.event_types.preco_centavos) : '—'}</p>
            </div>
            <button type="button" disabled className="rounded-full bg-white/20 px-6 py-3 font-bold text-white/70" title="Disponível na próxima etapa">
              Pagar e ativar · em breve
            </button>
          </div>
          <form action={apagarRascunho} className="self-end">
            <input type="hidden" name="evento" value={f.id} />
            <button type="submit" className="text-sm text-anil/60 underline hover:text-rosa">Apagar este rascunho</button>
          </form>
        </section>
      )}

      <p className="text-xs text-anil/50">
        Link da festa (ativo depois do pagamento): <span className="font-mono">/e/{f.slug}</span>
      </p>
      <Link href="/painel" className="text-sm text-anil/70 hover:text-rosa">← Voltar para minhas festas</Link>
    </>
  );
}

export default function ResumoDaFesta({ params }: PageProps<'/painel/festas/[id]'>) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<p className="text-anil/60">Carregando…</p>}>
        <Conteudo params={params} />
      </Suspense>
    </div>
  );
}
