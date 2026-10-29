import type { Metadata } from 'next';
import { Concluir } from './Concluir';

export const metadata: Metadata = { title: 'Entrando…' };

export default function Entrando() {
  return (
    <main className="flex flex-1 items-center justify-center bg-noite px-4 py-10 text-white">
      <Concluir />
    </main>
  );
}
