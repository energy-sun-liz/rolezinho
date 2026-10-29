import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { formatarReais } from '@/lib/dinheiro';
import { podeEditar } from '@/lib/periodo';
import { removerCusto } from '../acoes';
import { carregarFesta } from '../carregar';
import { Cabecalho, Passos } from '../Passos';
import { FormCusto, FormPix } from './Formularios';

export const metadata: Metadata = { title: 'Custos e Pix' };

async function Conteudo({ params }: { params: PageProps<'/painel/festas/[id]/custos'>['params'] }) {
  const { id } = await params;
  const f = await carregarFesta(id);
  const editavel = podeEditar(f.status);
  const obrigatorio = f.costs.filter((c) => !c.opcional).reduce((s, c) => s + c.valor_centavos, 0);
  const comTudo = f.costs.reduce((s, c) => s + c.valor_centavos, 0);

  return (
    <>
      <Cabecalho titulo={f.titulo} />
      <Passos id={f.id} atual="custos" />

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Custos por pessoa</h2>
          <p className="text-sm text-anil/70">Valor que cada convidado paga. Os opcionais entram só para quem escolher.</p>
        </div>
        {f.costs.length > 0 ? (
          <ul className="divide-y divide-borda">
            {f.costs.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {c.nome}
                  {c.opcional && <span className="ml-2 rounded-full bg-azul/15 px-2 py-0.5 text-xs font-bold text-sky-800">opcional</span>}
                </span>
                <span className="flex items-center gap-3">
                  <b>{formatarReais(c.valor_centavos)}</b>
                  {editavel && (
                    <form action={removerCusto}>
                      <input type="hidden" name="evento" value={f.id} />
                      <input type="hidden" name="custo" value={c.id} />
                      <button type="submit" aria-label={`Remover ${c.nome}`} className="rounded-full px-2 text-anil/50 hover:bg-rosa/10 hover:text-rosa">✕</button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-lavanda p-3 text-sm text-anil/70">Nenhum custo ainda. Ex.: aluguel do espaço (obrigatório), bebidas (opcional).</p>
        )}
        {f.costs.length > 0 && (
          <p className="rounded-xl bg-lavanda p-3 text-sm">
            Cada convidado paga <b>{formatarReais(obrigatorio)}</b>
            {comTudo > obrigatorio && <> e até <b>{formatarReais(comTudo)}</b> com todos os opcionais</>}.
          </p>
        )}
        {editavel && <FormCusto id={f.id} />}
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Seu Pix para receber</h2>
          <p className="text-sm text-anil/70">O dinheiro vai direto para você. O Rolêzinho não cobra taxa sobre os pagamentos da galera.</p>
        </div>
        {f.pix_chave && (
          <p className="rounded-xl bg-menta/20 p-3 text-sm">
            ✅ Recebendo em <b>{f.pix_nome_recebedor}</b> · chave <span className="font-mono">{f.pix_chave}</span>
            {f.pix_copia_cola_base ? ' (copia e cola)' : ' (digitado)'}
          </p>
        )}
        {editavel && <FormPix id={f.id} temPix={Boolean(f.pix_chave)} />}
      </section>

      <Link href={`/painel/festas/${f.id}`} className="self-end rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite">
        Ver resumo →
      </Link>
    </>
  );
}

export default function CustosDaFesta({ params }: PageProps<'/painel/festas/[id]/custos'>) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<p className="text-anil/60">Carregando…</p>}>
        <Conteudo params={params} />
      </Suspense>
    </div>
  );
}
