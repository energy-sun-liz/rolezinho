// Service worker do Rolêzinho: recebe notificações (Web Push) mesmo com o app fechado
// e abre a tela certa ao tocar. Não guarda páginas em cache (o app sempre mostra dados atuais).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { titulo: 'Rolêzinho', corpo: event.data ? event.data.text() : '' };
  }
  const titulo = dados.titulo || 'Rolêzinho';
  const link = typeof dados.link === 'string' && dados.link.startsWith('/') && !dados.link.startsWith('//') ? dados.link : '/painel';
  event.waitUntil((async () => {
    await self.registration.showNotification(titulo, {
      body: dados.corpo || '',
      icon: '/icones/icone-192.png',
      badge: '/icones/selo-96.png',
      tag: dados.tag || undefined,
      renotify: Boolean(dados.tag),
      vibrate: [80, 40, 80],
      data: { link },
    });
    // Avisa as telas abertas para o sino atualizar na hora.
    const telas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const t of telas) t.postMessage({ tipo: 'rolezinho-notificacao', titulo, corpo: dados.corpo || '', link });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/painel';
  event.waitUntil((async () => {
    const telas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const t of telas) {
      if (new URL(t.url).origin === self.location.origin) {
        await t.focus();
        return t.navigate(link);
      }
    }
    return self.clients.openWindow(link);
  })());
});
