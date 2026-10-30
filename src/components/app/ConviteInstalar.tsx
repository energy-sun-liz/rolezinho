'use client';

// Faixa no painel: "instale o Rolêzinho na tela de início". Some se já estiver instalado
// ou se a pessoa dispensar.
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

const CHAVE = 'rolezinho-convite-instalar-dispensado';

function deveMostrar(): boolean {
  try {
    const instalado = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    return !instalado && localStorage.getItem(CHAVE) !== '1';
  } catch {
    return false;
  }
}
const assinar = (avisar: () => void) => {
  window.addEventListener('storage', avisar);
  window.addEventListener('rolezinho-convite', avisar);
  return () => { window.removeEventListener('storage', avisar); window.removeEventListener('rolezinho-convite', avisar); };
};

export function ConviteInstalar() {
  const mostrar = useSyncExternalStore(assinar, deveMostrar, () => false);
  if (!mostrar) return null;
  const dispensar = () => {
    try { localStorage.setItem(CHAVE, '1'); } catch { /* sem armazenamento */ }
    window.dispatchEvent(new Event('rolezinho-convite'));
  };
  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-noite p-4 text-white">
      <span className="text-2xl" aria-hidden="true">📲</span>
      <p className="flex-1 text-sm">
        <b>Instale o Rolêzinho no celular</b> e receba os avisos da festa como um aplicativo.
      </p>
      <Link href="/instalar" className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-4 py-2 text-sm font-bold text-noite">Como?</Link>
      <button type="button" onClick={dispensar} aria-label="Dispensar" className="rounded-full px-2 text-white/60 hover:bg-white/10">✕</button>
    </div>
  );
}
