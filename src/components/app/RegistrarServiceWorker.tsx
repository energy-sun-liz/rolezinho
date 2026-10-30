'use client';

import { useEffect } from 'react';

/** Registra o service worker (notificações e instalação na tela de início). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // Sem service worker o app funciona normalmente, só não recebe notificação com o app fechado.
    });
  }, []);
  return null;
}
