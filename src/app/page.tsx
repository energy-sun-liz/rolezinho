import { AvatarRolezinho } from '@/components/AvatarRolezinho';
import { Logo } from '@/components/marca/Logo';
import type { Avatar } from '@/lib/avatar';

const GALERA: Array<{ nome: string; avatar: Avatar }> = [
  { nome: 'Ana', avatar: { bg: '#ff2d87', skin: '#f5c49c', hair: 'long', hairColor: '#5b3a1e', eyes: 'happy', mouth: 'grin', acc: 'crown' } },
  { nome: 'Beto', avatar: { bg: '#22b8ff', skin: '#8d5524', hair: 'afro', hairColor: '#1a1a1a', eyes: 'shades', mouth: 'cool', acc: 'none' } },
  { nome: 'Carla', avatar: { bg: '#ffc21a', skin: '#ffe0c7', hair: 'bun', hairColor: '#e2412b', eyes: 'wink', mouth: 'smile', acc: 'bow' } },
  { nome: 'Davi', avatar: { bg: '#8b3dff', skin: '#d9a066', hair: 'mohawk', hairColor: '#ff2d87', eyes: 'stars', mouth: 'tongue', acc: 'headphones' } },
  { nome: 'Edu', avatar: { bg: '#ff8a1a', skin: '#b5774a', hair: 'curly', hairColor: '#1a1a1a', eyes: 'dots', mouth: 'open', acc: 'partyhat' } },
];

const PILARES = [
  { icone: '👯', titulo: 'Amigos juntos', texto: 'Lista de convidados, presença e avisos num lugar só.' },
  { icone: '💸', titulo: 'Divide os custos', texto: 'Cada um vê quanto deve e paga no Pix com o valor certinho.' },
  { icone: '🎮', titulo: 'Jogo e diversão', texto: 'Avatar, missões, ranking e selfies no formato story.' },
  { icone: '📍', titulo: 'Sem app e sem conta', texto: 'O convidado entra pelo link do WhatsApp. Só isso.' },
];

const PASSOS = [
  { n: '1', titulo: 'Crie o rolê', texto: 'Escolha o tipo de evento, as datas e os custos.' },
  { n: '2', titulo: 'Chame a galera', texto: 'Mande o convite pronto no WhatsApp, com o código de cada um.' },
  { n: '3', titulo: 'Receba sem cobrar ninguém', texto: 'O app mostra quem pagou. Você só confirma.' },
];

export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 bg-noite px-6 pb-16 pt-12 text-center text-white">
        <Logo tema="escuro" id="topo" />
        <p className="text-sm font-bold uppercase tracking-[0.25em]">Seu rolê, sem complicação.</p>
        <p className="max-w-xl text-lg text-white/80">
          Organize aniversário, churrasco ou viagem com a galera. Divida os custos, receba no Pix e transforme a
          festa num jogo.
        </p>
        <div className="flex -space-x-3" aria-label="Galera do rolê">
          {GALERA.map((p) => (
            <AvatarRolezinho key={p.nome} avatar={p.avatar} tamanho={56} titulo={p.nome} className="ring-4 ring-noite" />
          ))}
        </div>
        <span className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite">
          Em breve: crie seu rolê
        </span>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {PILARES.map((p) => (
          <div key={p.titulo} className="rounded-2xl bg-lavanda p-5">
            <div className="text-3xl" aria-hidden="true">{p.icone}</div>
            <h2 className="mt-2 text-sm font-bold uppercase tracking-widest">{p.titulo}</h2>
            <p className="mt-1 text-anil/80">{p.texto}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-16">
        <h2 className="font-pincel -rotate-2 text-center text-4xl">Seu próximo rolê começa aqui!</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {PASSOS.map((p) => (
            <li key={p.n} className="rounded-2xl border border-borda p-5">
              <span className="text-4xl font-extralight text-rosa">{p.n}</span>
              <h3 className="mt-1 font-bold">{p.titulo}</h3>
              <p className="text-anil/80">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto border-t border-borda px-6 py-6 text-center text-sm text-anil/60">
        Rolêzinho © 2026 · Em construção
      </footer>
    </main>
  );
}
