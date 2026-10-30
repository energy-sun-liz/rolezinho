'use client';

// Botão "Instalar o app" (Android/computador, onde o navegador permite) e aviso de "já instalado".
// No iPhone não existe botão: o passo a passo abaixo explica o caminho pelo Compartilhar.
import { useEffect, useState } from 'react';

type PedidoDeInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export function BotaoInstalar() {
  const [pedido, setPedido] = useState<PedidoDeInstalacao | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [iphone, setIphone] = useState(false);

  useEffect(() => {
    const ja = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const ehIphone = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const guardar = (e: Event) => { e.preventDefault(); setPedido(e as PedidoDeInstalacao); };
    const fim = () => { setInstalado(true); setPedido(null); };
    window.addEventListener('beforeinstallprompt', guardar);
    window.addEventListener('appinstalled', fim);
    queueMicrotask(() => { setInstalado(ja); setIphone(ehIphone); });
    return () => { window.removeEventListener('beforeinstallprompt', guardar); window.removeEventListener('appinstalled', fim); };
  }, []);

  if (instalado) {
    return <p role="status" className="rounded-2xl bg-menta/20 p-4 text-center font-bold">✅ O Rolêzinho já está instalado neste aparelho.</p>;
  }
  if (pedido) {
    return (
      <button
        type="button"
        onClick={async () => { await pedido.prompt(); const { outcome } = await pedido.userChoice; if (outcome === 'accepted') setInstalado(true); setPedido(null); }}
        className="rounded-full bg-gradient-to-r from-rosa via-laranja to-amarelo px-6 py-4 text-lg font-bold text-noite"
      >
        📲 Instalar o app
      </button>
    );
  }
  if (iphone) {
    return <p className="rounded-2xl bg-white/10 p-4 text-center text-sm">No iPhone a instalação é pelo botão <b>Compartilhar</b> do Safari. Veja o passo a passo abaixo.</p>;
  }
  return null;
}
