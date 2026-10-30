import type { Metadata } from 'next';
import { Suspense } from 'react';
import { isoParaHoraLocal } from '@/lib/festa';
import { hojeNoBrasil, podeEditar } from '@/lib/periodo';
import { carregarFesta } from '../carregar';
import { Cabecalho, Passos } from '../Passos';
import { FormDados } from './FormDados';

export const metadata: Metadata = { title: 'Dados da festa' };

async function Conteudo({ params }: { params: PageProps<'/painel/festas/[id]/dados'>['params'] }) {
  const { id } = await params;
  const f = await carregarFesta(id);
  // A data de início do período não muda depois que ele começou (trava no banco também).
  const periodoTravado = !(f.status === 'rascunho' || f.status === 'agendado');
  return (
    <>
      <Cabecalho titulo={f.titulo} />
      <Passos id={f.id} atual="dados" />
      <FormDados
        id={f.id}
        titulo={f.titulo}
        subtitulo={f.subtitulo}
        local={f.local}
        local_link={f.local_link ?? ''}
        tema={f.tema}
        festa_inicio={isoParaHoraLocal(f.festa_inicio)}
        festa_fim={isoParaHoraLocal(f.festa_fim)}
        periodo_inicio={f.periodo_inicio ?? ''}
        hoje={periodoTravado ? '' : hojeNoBrasil()}
        travado={!podeEditar(f.status)}
        periodoTravado={periodoTravado}
      />
    </>
  );
}

export default function DadosDaFesta({ params }: PageProps<'/painel/festas/[id]/dados'>) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<p className="text-anil/60">Carregando…</p>}>
        <Conteudo params={params} />
      </Suspense>
    </div>
  );
}
