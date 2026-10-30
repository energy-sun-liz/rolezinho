// Teste de ponta a ponta: app instalável (PWA) + notificações dentro do app.
// Uso: npm run build && npx next start -p 3000, e em outro terminal: npm run e2e:notificacoes
// Cria um organizador temporário e apaga tudo no fim.
import { createClient } from '@supabase/supabase-js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3000';
const SHOTS = process.env.E2E_PRINTS;
const sistema = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let falhas = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ FALHOU: ') + m); if (!c) falhas++; };
const ve = async (loc, timeout = 10000) => { try { await loc.first().waitFor({ timeout }); return true; } catch { return false; } };
const criados = [];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  // ---------- app instalável ----------
  const manifesto = await (await fetch(`${BASE}/manifest.webmanifest`)).json();
  ok(manifesto.name === 'Rolêzinho' && manifesto.display === 'standalone', 'manifesto: nome e abre em tela cheia');
  ok(manifesto.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'), 'manifesto: ícone adaptável (Android)');
  for (const i of manifesto.icons) {
    const r = await fetch(BASE + i.src);
    ok(r.ok && r.headers.get('content-type')?.includes('image/png'), `ícone ${i.src} existe`);
  }
  const sw = await fetch(`${BASE}/sw.js`);
  ok(sw.ok && /no-cache/.test(sw.headers.get('cache-control') ?? ''), 'service worker servido sem cache');
  ok((await fetch(`${BASE}/icones/apple-touch-icon.png`)).ok, 'ícone do iPhone existe');

  const inst = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await inst.goto(`${BASE}/instalar`);
  ok(await ve(inst.getByText('Adicionar à Tela de Início')), 'tela "Como instalar" explica o iPhone');
  ok(await ve(inst.getByText('Instalar app').first()), 'tela "Como instalar" explica o Android');
  if (SHOTS) await inst.screenshot({ path: `${SHOTS}/n-1-instalar.png`, fullPage: true });

  // Instalabilidade: precisa de perfil normal (no modo anônimo nenhum site é instalável).
  const perfil = mkdtempSync(join(tmpdir(), 'rolezinho-perfil-'));
  const normal = await chromium.launchPersistentContext(perfil, { channel: 'msedge', headless: true });
  try {
    const pg = normal.pages()[0] ?? await normal.newPage();
    await pg.goto(`${BASE}/instalar`);
    await pg.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active), null, { timeout: 15000 }).catch(() => {});
    const reg = await pg.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL ?? null);
    ok(Boolean(reg && reg.endsWith('/sw.js')), 'service worker registrado e ativo');
    const cdp = await normal.newCDPSession(pg);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    ok(installabilityErrors.length === 0, `navegador considera o app instalável${installabilityErrors.length ? ': ' + JSON.stringify(installabilityErrors) : ''}`);
  } finally {
    await normal.close();
    rmSync(perfil, { recursive: true, force: true });
  }

  // ---------- notificações dentro do app ----------
  const email = `e2e-notif-${Date.now()}@exemplo.invalid`;
  const u = await sistema.auth.admin.createUser({ email, email_confirm: true });
  criados.push(u.data.user.id);
  const l = await sistema.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${BASE}/auth/entrando` } });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(l.data.properties.action_link);
  await p.waitForURL('**/painel', { timeout: 20000 });
  ok(await ve(p.getByRole('link', { name: /Notificações: 1 não lida/ })), 'primeiro acesso: sino mostra 1 (boas-vindas)');
  ok(await ve(p.getByText('Instale o Rolêzinho no celular')), 'painel convida a instalar o app');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/n-2-painel-sino.png` });

  const org = (await sistema.from('organizers').select('id').eq('auth_user_id', u.data.user.id).single()).data;
  await p.waitForTimeout(2500); // tempo de o Realtime conectar
  await sistema.from('notificacoes').insert({ organizer_id: org.id, tipo: 'pagamento_informado', titulo: '💸 Carla disse que pagou R$ 120,00', corpo: 'Confira no seu banco e confirme.', link: '/painel' });
  ok(await ve(p.getByRole('alert').filter({ hasText: 'Carla disse que pagou' }), 15000), 'notificação nova aparece na hora como alerta dentro do app');
  ok(await ve(p.getByRole('link', { name: /Notificações: 2 não lidas/ })), 'contador do sino sobe para 2 sozinho');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/n-3-alerta.png` });

  await p.getByRole('link', { name: /Notificações: 2/ }).click();
  await p.waitForURL('**/painel/notificacoes');
  ok(await ve(p.getByText('Bem-vindo ao Rolêzinho!')), 'tela de notificações lista as notificações');
  ok(await ve(p.getByRole('link', { name: 'Notificações', exact: true }), 8000), 'ao abrir a lista, o sino zera');
  const lidas = (await sistema.from('notificacoes').select('lida_em').eq('organizer_id', org.id)).data;
  ok(lidas.every((n) => n.lida_em), 'notificações marcadas como lidas no banco');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/n-4-lista.png`, fullPage: true });

  await p.getByRole('button', { name: /Testar só o aviso dentro do app|Enviar notificação de teste/ }).click();
  ok(await ve(p.getByRole('alert').filter({ hasText: 'Funcionou!' }), 15000), 'botão de teste gera o alerta dentro do app');

  // outro organizador não recebe a notificação de ninguém
  const n2 = (await sistema.from('notificacoes').select('id', { count: 'exact', head: true }).eq('organizer_id', org.id)).count;
  ok(n2 === 3, 'três notificações no total (boas-vindas, pagamento, teste)');
} finally {
  await browser.close();
  for (const id of criados) await sistema.auth.admin.deleteUser(id);
  console.log(`(usuários temporários apagados: ${criados.length}) — ${falhas ? falhas + ' falha(s)' : 'tudo certo'}`);
  process.exitCode = falhas ? 1 : 0;
}
