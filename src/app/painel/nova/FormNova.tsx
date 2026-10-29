'use client';

import { useActionState } from 'react';
import { formatarReais } from '@/lib/dinheiro';
import { criarFesta, type EstadoNova } from './acoes';

export type TipoDeEvento = { id: string; nome: string; exemplos: string; max_convidados: number; preco_centavos: number };

export function FormNova({ tipos }: { tipos: TipoDeEvento[] }) {
  const [estado, acao, enviando] = useActionState(criarFesta, { mensagem: '' } satisfies EstadoNova);
  return (
    <form action={acao} className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase tracking-widest">1. Tipo de evento</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {tipos.map((t, i) => (
            <label key={t.id} className="flex cursor-pointer gap-3 rounded-2xl border-2 border-transparent bg-white p-4 has-[:checked]:border-rosa">
              <input type="radio" name="tipo" value={t.id} defaultChecked={i === 1} className="mt-1 accent-rosa" required />
              <span className="flex flex-1 flex-col">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-bold">{t.nome}</span>
                  <span className="font-bold text-rosa">{formatarReais(t.preco_centavos)}</span>
                </span>
                <span className="text-sm text-anil/70">{t.exemplos}</span>
                <span className="text-xs text-anil/60">Até {t.max_convidados} convidados · pagamento único</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="titulo" className="text-sm font-bold uppercase tracking-widest">2. Nome da festa</label>
        <input
          id="titulo" name="titulo" required maxLength={120} placeholder="Ex.: Aniversário da Lizandra"
          className="rounded-xl border border-borda bg-white px-4 py-3 outline-none focus:border-rosa"
        />
      </div>

      {estado.mensagem && <p role="alert" className="text-sm text-red-700">{estado.mensagem}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-anil/70">A festa fica em <b>rascunho</b>. Você só paga quando for ativar.</p>
        <button type="submit" disabled={enviando} className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite disabled:opacity-60">
          {enviando ? 'Criando…' : 'Continuar →'}
        </button>
      </div>
    </form>
  );
}
