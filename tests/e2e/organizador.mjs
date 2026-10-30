// Teste de ponta a ponta do Modo Organizador: app rodando + Supabase real.
// Uso: npm run build && npx next start -p 3000, e em outro terminal: npm run e2e
// (porta 3000 porque é a liberada no login do Supabase)
// Precisa das variáveis do .env.local (vercel env pull) e do Microsoft Edge instalado.
// Cria usuários temporários e apaga tudo no fim. Não imprime chaves.
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3000';
const SHOTS = process.env.E2E_PRINTS; // pasta para salvar prints (opcional)
const sistema = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let falhas = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ FALHOU: ') + m); if (!c) falhas++; };

// Pix estático de teste (chave fictícia), com e sem valor
function crc16(t) { let c = 0xffff; for (const b of Buffer.from(t)) { c ^= b << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; } return c.toString(16).toUpperCase().padStart(4, '0'); }
const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
const pix = (valor) => { const s = f('00', '01') + f('26', f('00', 'BR.GOV.BCB.PIX') + f('01', '123e4567-e12b-12d1-a456-426655440000')) + f('52', '0000') + f('53', '986') + (valor ? f('54', valor) : '') + f('58', 'BR') + f('59', 'Fulana de Tal') + f('60', 'SAO PAULO') + f('62', f('05', '***')) + '6304'; return s + crc16(s); };

const ve = async (loc) => { try { await loc.first().waitFor({ timeout: 10000 }); return true; } catch { return false; } };
const criados = [];
async function linkDeEntrada(nome) {
  const email = `e2e-${nome}-${Date.now()}@exemplo.invalid`;
  const u = await sistema.auth.admin.createUser({ email, email_confirm: true });
  criados.push(u.data.user.id);
  const l = await sistema.auth.admin.generateLink({ type: 'magiclink', email });
  return `${BASE}/auth/confirmar?token_hash=${l.data.properties.hashed_token}&type=magiclink`;
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  // Sem login: painel manda para /entrar
  const anon = await browser.newPage();
  await anon.goto(`${BASE}/painel`);
  ok(anon.url().endsWith('/entrar'), 'sem login, /painel redireciona para /entrar');
  ok(await ve(anon.getByText('Área de quem organiza')), 'tela de entrar aparece');
  await anon.goto(`${BASE}/auth/confirmar?token_hash=falso&type=magiclink`);
  ok(anon.url().includes('/entrar?erro=link'), 'link falso/expirado volta para /entrar com aviso');
  ok(await ve(anon.getByText('O link expirou')), 'aviso de link expirado aparece');

  // Link real do e-mail (mesmo caminho do signInWithOtp), aberto num navegador novo de celular
  {
    const email = `e2e-link-${Date.now()}@exemplo.invalid`;
    const u = await sistema.auth.admin.createUser({ email, email_confirm: true });
    criados.push(u.data.user.id);
    const l = await sistema.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${BASE}/auth/entrando` } });
    const cel = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
    await cel.goto(l.data.properties.action_link);
    try { await cel.waitForURL('**/painel', { timeout: 20000 }); } catch {}
    ok(cel.url().endsWith('/painel'), 'link do e-mail aberto em outro navegador (celular) entra no painel');
    await cel.goto(`${BASE}/auth/entrando#error=access_denied&error_code=otp_expired`);
    ok(await ve(cel.getByText('Este link expirou ou já foi usado.')), 'link expirado mostra aviso e botão de pedir outro');
  }

  // Organizadora A (celular)
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const a = await ctxA.newPage();
  await a.goto(await linkDeEntrada('ana'));
  ok(a.url().endsWith('/painel'), 'link mágico entra direto no painel');
  ok(await ve(a.getByText('Nenhuma festa ainda')), 'painel vazio para organizador novo');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/1-minhas-festas-vazio.png`, fullPage: true });

  await a.getByRole('link', { name: '+ Criar festa' }).click();
  await a.waitForURL('**/painel/nova');
  ok(await ve(a.getByText('R$ 39,90')), 'tipos de evento com preço vêm do banco');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/2-criar-festa.png`, fullPage: true });
  await a.getByText('Chácara / fim de semana').click();
  await a.getByLabel('2. Nome da festa').fill('Rolê de Teste na Chácara');
  await a.getByRole('button', { name: 'Continuar →' }).click();
  await a.waitForURL('**/dados');
  const idFesta = a.url().split('/festas/')[1].split('/')[0];
  ok(/^[0-9a-f-]{36}$/.test(idFesta), 'festa criada em rascunho e vai para "Dados e datas"');

  // Dados: festa fora do período deve dar erro
  await a.locator('input[name=festa_inicio]').fill('2027-03-20T18:00');
  await a.locator('input[name=festa_fim]').fill('2027-03-22T18:00');
  await a.locator('input[name=periodo_inicio]').fill('2026-11-01');
  await a.getByRole('button', { name: 'Salvar e continuar →' }).click();
  ok(await ve(a.getByText(/A festa precisa acontecer entre/)), 'recusa festa fora do período de 45 dias');
  ok(await a.locator('input[name=periodo_inicio]').inputValue() === '2026-11-01', 'depois do erro, o formulário mantém o que foi digitado');

  await a.locator('input[name=subtitulo]').fill('Fim de semana de festa 🎉');
  await a.locator('input[name=local]').fill('Chácara Recanto');
  await a.locator('input[name=festa_inicio]').fill('2026-11-20T18:00');
  await a.locator('input[name=festa_fim]').fill('2026-11-22T18:00');
  await a.locator('input[name=local_link]').fill('https://google.com.golpe.io/maps');
  await a.getByText('Neon', { exact: true }).click();
  await a.getByRole('button', { name: 'Salvar e continuar →' }).click();
  ok(await ve(a.getByText(/Use um link do Google Maps, Waze ou Apple Mapas/)), 'recusa link de localização que imita o Google');
  await a.locator('input[name=local_link]').fill('https://maps.app.goo.gl/AbC123xyz');
  ok(await a.locator('input[name=tema][value=neon]').isChecked(), 'depois do erro, o tema escolhido continua marcado');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/3-dados.png`, fullPage: true });
  await a.getByRole('button', { name: 'Salvar e continuar →' }).click();
  await a.waitForURL('**/custos');
  ok(true, 'dados, link do Maps e tema salvos, vai para "Custos e Pix"');

  // Custos
  await a.getByLabel('Nome do custo').fill('Aluguel da chácara');
  await a.getByLabel('Valor por pessoa').fill('120');
  await a.getByRole('button', { name: '+ Adicionar custo' }).click();
  await a.getByText('Aluguel da chácara adicionado.').waitFor();
  await a.getByLabel('Nome do custo').fill('Bebidas');
  await a.getByLabel('Valor por pessoa').fill('45,50');
  await a.getByText('Opcional — cada convidado').click();
  await a.getByRole('button', { name: '+ Adicionar custo' }).click();
  await a.getByText('Bebidas adicionado.').waitFor();
  const resumoCustos = await a.getByText(/^Cada convidado paga R/).textContent();
  ok(/R\$\s?120,00.*R\$\s?165,50/.test(resumoCustos), `soma dos custos certa: "${resumoCustos.trim()}"`);
  await a.getByLabel('Nome do custo').fill('Erro');
  await a.getByLabel('Valor por pessoa').fill('abc');
  await a.getByRole('button', { name: '+ Adicionar custo' }).click();
  await a.getByText('Valor inválido').waitFor();
  ok(true, 'recusa valor inválido no custo');

  // Pix
  await a.locator('#copia_cola').fill(pix('10.00'));
  await a.getByRole('button', { name: 'Salvar Pix' }).click();
  await a.getByText('Esse Pix já tem um valor').waitFor();
  ok(true, 'recusa Pix copia e cola que já tem valor');
  await a.locator('#copia_cola').fill(pix(null).slice(0, -4) + '0000');
  await a.getByRole('button', { name: 'Salvar Pix' }).click();
  await a.getByText('Código Pix inválido').waitFor();
  ok(true, 'recusa Pix com dígito de controle errado');
  await a.locator('#copia_cola').fill(pix(null));
  await a.getByRole('button', { name: 'Salvar Pix' }).click();
  await a.getByText('Pix salvo: Fulana de Tal').waitFor();
  ok(await ve(a.getByText('Recebendo em')), 'Pix sem valor aceito e dados lidos do código');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/4-custos-pix.png`, fullPage: true });

  await a.getByRole('button', { name: 'Remover Bebidas' }).click();
  await a.getByRole('button', { name: 'Remover Bebidas' }).waitFor({ state: 'detached' });
  ok(true, 'remove custo');

  // Resumo
  await a.getByRole('link', { name: 'Ver resumo →' }).click();
  await a.waitForURL(`**/festas/${idFesta}`);
  ok(await ve(a.getByText('Tudo pronto ✅')), 'resumo sem pendências');
  ok(await ve(a.getByText('01/11/2026 a 15/12/2026')), 'período de 45 dias calculado');
  ok(await ve(a.getByText('15/04/2027')), 'relatório disponível por 4 meses');
  ok(await ve(a.getByText('R$ 39,90')), 'preço do tipo Chácara no resumo');
  ok(await ve(a.getByRole('link', { name: '📍 Como chegar' })), 'resumo tem o botão "Como chegar"');
  ok(await ve(a.getByText('Neon', { exact: true })), 'resumo mostra o tema Neon');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/5-resumo.png`, fullPage: true });

  await a.goto(`${BASE}/painel`);
  ok(await ve(a.getByText('Rolê de Teste na Chácara')), 'festa aparece em Minhas festas');
  if (SHOTS) await a.screenshot({ path: `${SHOTS}/6-minhas-festas.png`, fullPage: true });

  // Organizador B não acessa a festa de A
  const b = await (await browser.newContext()).newPage();
  await b.goto(await linkDeEntrada('beto'));
  const resp = await b.goto(`${BASE}/painel/festas/${idFesta}`);
  ok(resp.status() === 404 || (await b.getByText('could not be found').count()) > 0 || (await b.getByText('404').count()) > 0, 'outro organizador recebe 404 na festa alheia');
  ok(await b.getByText('Rolê de Teste na Chácara').count() === 0, 'nada da festa alheia aparece para B');

  // Sair
  await b.goto(`${BASE}/painel`);
  await b.getByRole('button', { name: 'Sair' }).click();
  await b.waitForURL('**/entrar');
  await b.goto(`${BASE}/painel`);
  ok(b.url().endsWith('/entrar'), 'depois de sair, o painel pede login de novo');

  // Apagar rascunho
  await a.goto(`${BASE}/painel/festas/${idFesta}`);
  await a.getByRole('button', { name: 'Apagar este rascunho' }).click();
  await a.waitForURL(/\/painel$/);
  ok(await ve(a.getByText('Nenhuma festa ainda')), 'apaga o rascunho');
} finally {
  await browser.close();
  for (const id of criados) await sistema.auth.admin.deleteUser(id);
  console.log(`(usuários temporários apagados: ${criados.length}) — ${falhas ? falhas + ' falha(s)' : 'tudo certo'}`);
  process.exitCode = falhas ? 1 : 0;
}
