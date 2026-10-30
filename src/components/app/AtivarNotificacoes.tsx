'use client';

// Liga/desliga as notificações no celular (Web Push) e envia um teste.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { enviarTeste, inscreverAparelho, removerAparelho } from '@/app/painel/notificacoes/acoes';

type Estado = 'carregando' | 'sem-suporte' | 'instalar-iphone' | 'bloqueado' | 'desligado' | 'ligado';

function chaveParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

export function ehIphone() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
export function estaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
function nomeDoAparelho() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Computador Windows';
  if (/Mac/.test(ua)) return 'Mac';
  return 'Navegador';
}

export function AtivarNotificacoes() {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      let novo: Estado;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        novo = ehIphone() && !estaInstalado() ? 'instalar-iphone' : 'sem-suporte';
      } else if (Notification.permission === 'denied') {
        novo = 'bloqueado';
      } else {
        const reg = await navigator.serviceWorker.ready;
        novo = (await reg.pushManager.getSubscription()) ? 'ligado' : 'desligado';
      }
      setEstado(novo);
    })();
  }, []);

  async function ligar() {
    setOcupado(true); setMsg('');
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') { setEstado(permissao === 'denied' ? 'bloqueado' : 'desligado'); return; }
      const reg = await navigator.serviceWorker.ready;
      const inscricao = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const r = await inscreverAparelho(JSON.parse(JSON.stringify(inscricao)), nomeDoAparelho());
      setMsg(r.mensagem);
      setEstado(r.ok ? 'ligado' : 'desligado');
    } catch {
      setMsg('Não foi possível ativar agora. Tente de novo.');
    } finally { setOcupado(false); }
  }

  async function desligar() {
    setOcupado(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const inscricao = await reg.pushManager.getSubscription();
      if (inscricao) { await removerAparelho(inscricao.endpoint); await inscricao.unsubscribe(); }
      setEstado('desligado'); setMsg('Notificações desligadas neste aparelho.');
    } finally { setOcupado(false); }
  }

  async function testar() {
    setOcupado(true); setMsg('');
    try { setMsg((await enviarTeste()).mensagem); } finally { setOcupado(false); }
  }

  const botao = 'rounded-full px-5 py-2.5 font-bold disabled:opacity-60';
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-5" aria-labelledby="titulo-push">
      <h2 id="titulo-push" className="text-lg font-bold">Notificações no celular</h2>
      {estado === 'carregando' && <p className="text-sm text-anil/60">Verificando este aparelho…</p>}
      {estado === 'instalar-iphone' && (
        <p className="text-sm">
          No iPhone, as notificações só funcionam com o Rolêzinho <b>adicionado à tela de início</b>.{' '}
          <Link href="/instalar" className="font-bold text-rosa underline">Veja como instalar</Link> e abra pelo ícone.
        </p>
      )}
      {estado === 'sem-suporte' && <p className="text-sm">Este navegador não recebe notificações. Tente pelo Chrome (Android) ou com o app instalado no iPhone.</p>}
      {estado === 'bloqueado' && (
        <p className="text-sm">As notificações estão <b>bloqueadas</b> para o Rolêzinho neste aparelho. Libere nos ajustes do navegador (ou do iPhone, em Ajustes → Notificações → Rolêzinho) e volte aqui.</p>
      )}
      {estado === 'desligado' && (
        <>
          <p className="text-sm">Receba os avisos mesmo com o app fechado: quando alguém pagar, cumprir missão ou a festa tiver novidade.</p>
          <button type="button" onClick={ligar} disabled={ocupado} className={`${botao} bg-gradient-to-r from-rosa via-laranja to-amarelo text-noite`}>
            {ocupado ? 'Ativando…' : 'Ativar notificações neste aparelho'}
          </button>
        </>
      )}
      {estado === 'ligado' && (
        <>
          <p className="text-sm">✅ Este aparelho recebe as notificações do Rolêzinho.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={testar} disabled={ocupado} className={`${botao} bg-anil text-white`}>Enviar notificação de teste</button>
            <button type="button" onClick={desligar} disabled={ocupado} className={`${botao} border border-borda`}>Desligar</button>
          </div>
        </>
      )}
      {estado !== 'ligado' && estado !== 'carregando' && (
        <button type="button" onClick={testar} disabled={ocupado} className="self-start text-sm text-anil/70 underline">
          Testar só o aviso dentro do app
        </button>
      )}
      {msg && <p role="status" className="text-sm text-emerald-700">{msg}</p>}
    </section>
  );
}
