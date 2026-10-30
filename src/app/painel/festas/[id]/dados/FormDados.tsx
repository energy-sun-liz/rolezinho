'use client';

import { useActionState } from 'react';
import { TEMAS } from '@/lib/temas';
import { salvarDados, type Estado } from '../acoes';

type Valores = {
  id: string; titulo: string; subtitulo: string; local: string; local_link: string; tema: string;
  festa_inicio: string; festa_fim: string; periodo_inicio: string; hoje: string; travado: boolean; periodoTravado: boolean;
};

const campo = 'rounded-xl border border-borda bg-white px-4 py-3 outline-none focus:border-rosa disabled:bg-lavanda';

export function FormDados(v: Valores) {
  const [estado, acao, enviando] = useActionState(salvarDados, { ok: false, mensagem: '' } satisfies Estado);
  // Em caso de erro, volta o que a pessoa digitou (o React limpa o formulário após enviar).
  const d = { ...v, ...estado.valores };
  return (
    <form action={acao} className="flex flex-col gap-5 rounded-3xl bg-white p-5 sm:p-6">
      <input type="hidden" name="evento" value={v.id} />
      <fieldset disabled={v.travado} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Nome da festa</span>
          <input name="titulo" defaultValue={d.titulo} required maxLength={120} className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Frase de chamada <span className="font-normal text-anil/60">(opcional)</span></span>
          <input name="subtitulo" defaultValue={d.subtitulo} maxLength={160} placeholder="Fim de semana de festa 🎉" className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Local <span className="font-normal text-anil/60">(opcional)</span></span>
          <input name="local" defaultValue={d.local} maxLength={160} placeholder="Chácara, bar, endereço…" className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Link da localização <span className="font-normal text-anil/60">(opcional)</span></span>
          <input name="local_link" type="url" inputMode="url" defaultValue={d.local_link} maxLength={500} placeholder="https://maps.app.goo.gl/…" className={campo} />
          <span className="text-xs text-anil/60">No Google Maps, Waze ou Apple Mapas: Compartilhar → Copiar link. Vira o botão &quot;Como chegar&quot; para a galera.</span>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">Tema da festa</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMAS.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-borda p-3 has-[:checked]:border-rosa">
                <input type="radio" name="tema" value={t.id} defaultChecked={d.tema === t.id} className="accent-rosa" />
                <span className="flex h-10 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10" aria-hidden="true">
                  {t.amostra ? <span className="flex-1" style={{ background: t.amostra }} /> : (
                    <>
                      <span className="flex-1" style={{ background: t.cores.fundo }} />
                      <span className="w-3" style={{ background: t.cores.destaque }} />
                      <span className="w-3" style={{ background: t.cores.destaque2 }} />
                    </>
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="font-bold">{t.nome}</span>
                  <span className="text-xs text-anil/60">{t.descricao}</span>
                </span>
              </label>
            ))}
          </div>
          <span className="text-xs text-anil/60">É o visual da página que os convidados veem. Pode trocar quando quiser.</span>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Começa</span>
            <input type="datetime-local" name="festa_inicio" defaultValue={d.festa_inicio} className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Termina</span>
            <input type="datetime-local" name="festa_fim" defaultValue={d.festa_fim} className={campo} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Início do período de 45 dias</span>
          <input type="date" name="periodo_inicio" defaultValue={d.periodo_inicio} min={v.hoje || undefined} readOnly={v.periodoTravado} className={campo} />
          <span className="text-xs text-anil/60">
            Durante 45 dias a festa fica ativa: convites, pagamentos e missões. A festa precisa acontecer dentro desse
            período. Depois, você tem 4 meses para ver o relatório.
          </span>
        </label>
      </fieldset>
      {estado.mensagem && <p role="alert" className="text-sm text-red-700">{estado.mensagem}</p>}
      {!v.travado && (
        <button type="submit" disabled={enviando} className="self-end rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-3 font-bold text-noite disabled:opacity-60">
          {enviando ? 'Salvando…' : 'Salvar e continuar →'}
        </button>
      )}
    </form>
  );
}
