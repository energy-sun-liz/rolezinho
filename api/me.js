// Área do participante: entra com o código, edita avatar/apelido e escolhe custos opcionais
import { load, save, send, body } from './_store.js';

const AV_KEYS = ['bg', 'skin', 'hair', 'hairColor', 'eyes', 'mouth', 'acc'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  const b = body(req);
  const code = String(b.code || '').trim().toUpperCase();
  if (!code) return send(res, 400, { error: 'Informe seu código.' });

  try {
    const s = await load();
    const p = s.participants.find((x) => x.code === code);
    if (!p) return send(res, 404, { error: 'Código não encontrado. Confira com a aniversariante.' });

    if (b.action === 'save') {
      if (b.avatar && typeof b.avatar === 'object') {
        const a = {};
        for (const k of AV_KEYS) if (typeof b.avatar[k] === 'string') a[k] = b.avatar[k].slice(0, 20);
        p.avatar = { ...p.avatar, ...a };
      }
      if (typeof b.nickname === 'string') p.nickname = b.nickname.trim().slice(0, 24);
      await save(s);
    } else if (b.action === 'optin') {
      const cost = s.costs.find((c) => c.id === b.costId && c.optional);
      if (!cost) return send(res, 400, { error: 'Custo inválido.' });
      if (p.paid?.[cost.id]) return send(res, 400, { error: 'Esse item já foi pago — fale com a aniversariante para mudar.' });
      p.optIn = { ...(p.optIn || {}), [cost.id]: Boolean(b.value) };
      await save(s);
    }
    send(res, 200, { me: p });
  } catch (e) {
    send(res, 500, { error: 'Erro no servidor. Tente de novo.' });
  }
}
