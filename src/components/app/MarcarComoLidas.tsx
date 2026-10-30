'use client';

import { useEffect } from 'react';
import { marcarTodasLidas } from '@/app/painel/notificacoes/acoes';

/** Ao abrir a tela de notificações, marca tudo como lido e zera o sino. */
export function MarcarComoLidas() {
  useEffect(() => {
    const t = setTimeout(() => {
      marcarTodasLidas().then(() => window.dispatchEvent(new Event('rolezinho-lidas')));
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
