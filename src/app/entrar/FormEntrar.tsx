'use client';

import { useActionState } from 'react';
import { enviarLink, type EstadoEntrar } from './acoes';

const inicial: EstadoEntrar = { ok: false, mensagem: '' };

export function FormEntrar() {
  const [estado, acao, enviando] = useActionState(enviarLink, inicial);

  if (estado.ok) {
    return (
      <div role="status" className="rounded-2xl bg-menta/20 p-5 text-center">
        <p className="text-3xl" aria-hidden="true">📬</p>
        <p className="mt-2 font-bold">Confira seu e-mail</p>
        <p className="mt-1 text-anil/80">{estado.mensagem}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-bold">Seu e-mail</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={estado.email}
        placeholder="voce@email.com"
        className="rounded-xl border border-borda bg-white px-4 py-3 text-base outline-none focus:border-rosa"
      />
      {estado.mensagem && <p role="alert" className="text-sm text-red-700">{estado.mensagem}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Receber link de acesso'}
      </button>
      <p className="text-center text-xs text-anil/60">Sem senha: enviamos um link que entra direto.</p>
    </form>
  );
}
