'use client';

import { useActionState, useState } from 'react';
import { adicionarCusto, salvarPix, type Estado } from '../acoes';

const campo = 'rounded-xl border border-borda bg-white px-4 py-3 outline-none focus:border-rosa';
const inicial: Estado = { ok: false, mensagem: '' };

function Aviso({ estado }: { estado: Estado }) {
  if (!estado.mensagem) return null;
  return <p role={estado.ok ? 'status' : 'alert'} className={`text-sm ${estado.ok ? 'text-emerald-700' : 'text-red-700'}`}>{estado.mensagem}</p>;
}

export function FormCusto({ id }: { id: string }) {
  const [estado, acao, enviando] = useActionState(adicionarCusto, inicial);
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="evento" value={id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <input name="nome" required maxLength={60} defaultValue={estado.valores?.nome} placeholder="Ex.: Aluguel da chácara" aria-label="Nome do custo" className={campo} />
        <input name="valor" required inputMode="decimal" defaultValue={estado.valores?.valor} placeholder="R$ 120,00" aria-label="Valor por pessoa" className={campo} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="opcional" defaultChecked={estado.valores?.opcional === 'on'} className="size-4 accent-rosa" />
        Opcional — cada convidado escolhe se entra (ex.: bebidas, churrasco)
      </label>
      <Aviso estado={estado} />
      <button type="submit" disabled={enviando} className="self-start rounded-full bg-anil px-5 py-2 font-bold text-white disabled:opacity-60">
        {enviando ? 'Adicionando…' : '+ Adicionar custo'}
      </button>
    </form>
  );
}

export function FormPix({ id, temPix }: { id: string; temPix: boolean }) {
  const [estado, acao, enviando] = useActionState(salvarPix, inicial);
  const [modo, setModo] = useState<'colar' | 'digitar'>('colar');
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="evento" value={id} />
      <input type="hidden" name="modo" value={modo} />
      {modo === 'colar' ? (
        <>
          <label htmlFor="copia_cola" className="text-sm">
            No app do seu banco, gere um <b>Pix copia e cola sem valor</b> (receber/cobrar → sem definir valor) e cole aqui.
            O Rolêzinho coloca o valor certo de cada convidado.
          </label>
          <textarea id="copia_cola" name="copia_cola" defaultValue={estado.valores?.copia_cola} rows={4} spellCheck={false} placeholder="00020126580014BR.GOV.BCB.PIX…" className={`${campo} font-mono text-xs`} />
          <button type="button" onClick={() => setModo('digitar')} className="self-start text-sm text-anil/70 underline">
            Meu banco não gera copia e cola sem valor
          </button>
        </>
      ) : (
        <>
          <p className="text-sm">Digite os dados da sua chave Pix:</p>
          <input name="chave" required defaultValue={estado.valores?.chave} placeholder="Chave Pix (CPF, e-mail, celular ou aleatória)" className={campo} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="nome" required maxLength={60} defaultValue={estado.valores?.nome} placeholder="Seu nome (como no banco)" className={campo} />
            <input name="cidade" required defaultValue={estado.valores?.cidade} maxLength={40} placeholder="Cidade" className={campo} />
          </div>
          <button type="button" onClick={() => setModo('colar')} className="self-start text-sm text-anil/70 underline">
            Voltar para colar o copia e cola
          </button>
        </>
      )}
      <Aviso estado={estado} />
      <button type="submit" disabled={enviando} className="self-start rounded-full bg-anil px-5 py-2 font-bold text-white disabled:opacity-60">
        {enviando ? 'Conferindo…' : temPix ? 'Trocar Pix' : 'Salvar Pix'}
      </button>
    </form>
  );
}
