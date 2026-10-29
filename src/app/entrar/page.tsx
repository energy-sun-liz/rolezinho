import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Logo } from '@/components/marca/Logo';
import { entrarComGoogle } from './acoes';
import { FormEntrar } from './FormEntrar';

export const metadata: Metadata = { title: 'Entrar' };

const googleLigado = process.env.NEXT_PUBLIC_LOGIN_GOOGLE === '1';

async function AvisoDeErro({ busca }: { busca: PageProps<'/entrar'>['searchParams'] }) {
  const { erro } = await busca;
  if (!erro) return null;
  const texto = erro === 'google'
    ? 'Não foi possível entrar com o Google agora.'
    : 'O link expirou ou já foi usado. Peça um novo abaixo.';
  return <p role="alert" className="rounded-xl bg-rosa/10 p-3 text-sm text-red-700">{texto}</p>;
}

export default function Entrar({ searchParams }: PageProps<'/entrar'>) {
  return (
    <main className="flex flex-1 items-center justify-center bg-noite px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-papel p-6 shadow-xl">
        <div className="flex justify-center"><Logo tamanho="p" id="entrar" /></div>
        <h1 className="mt-4 text-center text-xl font-bold">Área de quem organiza</h1>
        <p className="mb-5 mt-1 text-center text-sm text-anil/70">Crie e acompanhe seus rolês.</p>
        <div className="flex flex-col gap-4">
          <Suspense fallback={null}><AvisoDeErro busca={searchParams} /></Suspense>
          <FormEntrar />
          {googleLigado && (
            <form action={entrarComGoogle}>
              <button type="submit" className="w-full rounded-full border border-borda bg-white px-6 py-3 font-bold">
                Entrar com Google
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-anil/60">
          Convidado não precisa entrar aqui: use o link que o organizador mandou.
        </p>
      </div>
    </main>
  );
}
