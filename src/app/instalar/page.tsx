import type { Metadata } from 'next';
import Link from 'next/link';
import { Simbolo } from '@/components/marca/Simbolo';
import { BotaoInstalar } from './BotaoInstalar';

export const metadata: Metadata = { title: 'Instalar no celular' };

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rosa text-sm font-bold text-white">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

const iconeCompartilhar = (
  <svg viewBox="0 0 24 24" width="18" height="18" className="inline -mt-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="ícone Compartilhar">
    <path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

export default function Instalar() {
  return (
    <main className="flex flex-1 flex-col bg-noite text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Simbolo tamanho={88} variante="escuro" id="inst" />
          <h1 className="text-3xl font-extralight tracking-tight">Instale o <span className="font-pincel text-4xl">Rolêzinho</span></h1>
          <p className="text-white/75">Fica na tela de início como um aplicativo, abre em tela cheia e recebe os avisos da festa. Não precisa de loja de apps.</p>
        </div>

        <BotaoInstalar />

        <section className="flex flex-col gap-3 rounded-3xl bg-white p-5 text-anil" aria-labelledby="iphone">
          <h2 id="iphone" className="text-lg font-bold">📱 iPhone (Safari)</h2>
          <ol className="flex flex-col gap-3">
            <Passo n={1}>Abra este site no <b>Safari</b> (no Chrome do iPhone também funciona pelo mesmo botão).</Passo>
            <Passo n={2}>Toque em <b>Compartilhar</b> {iconeCompartilhar} na barra de baixo (ou de cima, no iPad).</Passo>
            <Passo n={3}>Role a lista e toque em <b>Adicionar à Tela de Início</b>.</Passo>
            <Passo n={4}>Toque em <b>Adicionar</b>. Pronto: o ícone do Rolêzinho aparece junto dos seus apps.</Passo>
            <Passo n={5}>Abra <b>pelo ícone</b> e ative as notificações em <b>Notificações</b> (sino). No iPhone elas só funcionam com o app aberto pelo ícone (iOS 16.4 ou mais novo).</Passo>
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-white p-5 text-anil" aria-labelledby="android">
          <h2 id="android" className="text-lg font-bold">🤖 Android (Chrome)</h2>
          <ol className="flex flex-col gap-3">
            <Passo n={1}>Toque no botão <b>Instalar o app</b> acima, se ele aparecer.</Passo>
            <Passo n={2}>Ou toque no menu <b>⋮</b> do Chrome e escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</Passo>
            <Passo n={3}>Confirme em <b>Instalar</b>. Abra pelo ícone e ative as notificações no sino.</Passo>
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-white p-5 text-anil" aria-labelledby="pc">
          <h2 id="pc" className="text-lg font-bold">💻 Computador (Chrome ou Edge)</h2>
          <ol className="flex flex-col gap-3">
            <Passo n={1}>Clique no ícone de <b>instalar</b> no canto da barra de endereço, ou use o botão acima.</Passo>
            <Passo n={2}>O Rolêzinho abre numa janela própria e avisa quando chegar notificação.</Passo>
          </ol>
        </section>

        <Link href="/painel" className="self-center rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite">
          Ir para o Rolêzinho
        </Link>
      </div>
    </main>
  );
}
