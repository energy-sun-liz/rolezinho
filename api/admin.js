// Painel da aniversariante — protegido pela variável ADMIN_PASSWORD
import crypto from 'node:crypto';
import { load, save, send, body, id, newCode, randomAvatar, usingDatabase } from './_store.js';

const hash = (v) => crypto.createHash('sha256').update(String(v)).digest();

function authorized(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return crypto.timingSafeEqual(hash(pw), hash(real));
}

const str = (v, n = 200) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  const b = body(req);
  if (!process.env.ADMIN_PASSWORD) return send(res, 500, { error: 'Defina a variável ADMIN_PASSWORD na Vercel.' });
  if (!authorized(b.password)) return send(res, 401, { error: 'Senha incorreta.' });

  try {
    const s = await load();
    const P = (pid) => s.participants.find((p) => p.id === pid);
    const d = b.data || {};

    switch (b.action) {
      case 'load':
        break;
      case 'saveEvent':
        for (const k of ['title', 'subtitle', 'start', 'end', 'place', 'pix', 'info']) {
          if (k in d) s.event[k] = str(d[k], k === 'info' ? 600 : 160);
        }
        break;
      case 'addCost':
        if (!str(d.name)) throw new Error('Dê um nome ao custo.');
        s.costs.push({ id: id(), name: str(d.name, 60), value: Math.max(0, Number(d.value) || 0), optional: Boolean(d.optional) });
        break;
      case 'updateCost': {
        const c = s.costs.find((x) => x.id === d.id);
        if (c) {
          if ('name' in d) c.name = str(d.name, 60);
          if ('value' in d) c.value = Math.max(0, Number(d.value) || 0);
          if ('optional' in d) c.optional = Boolean(d.optional);
        }
        break;
      }
      case 'removeCost':
        s.costs = s.costs.filter((c) => c.id !== d.id);
        break;
      case 'addParticipant': {
        const names = String(d.names || d.name || '').split(/\n|,/).map((n) => str(n, 40)).filter(Boolean);
        if (!names.length) throw new Error('Digite pelo menos um nome.');
        for (const name of names) {
          s.participants.push({
            id: id(), name, nickname: '', code: newCode(s.participants.map((p) => p.code)),
            avatar: randomAvatar(), paid: {}, optIn: {}, createdAt: new Date().toISOString(),
          });
        }
        break;
      }
      case 'updateParticipant': {
        const p = P(d.id);
        if (p && 'name' in d) p.name = str(d.name, 40);
        break;
      }
      case 'removeParticipant':
        s.participants = s.participants.filter((p) => p.id !== d.id);
        s.missions.forEach((m) => (m.doneBy = m.doneBy.filter((x) => x !== d.id)));
        break;
      case 'resetCode': {
        const p = P(d.id);
        if (p) p.code = newCode(s.participants.map((x) => x.code));
        break;
      }
      case 'togglePaid': {
        const p = P(d.id);
        if (p) p.paid = { ...(p.paid || {}), [d.costId]: !p.paid?.[d.costId] };
        break;
      }
      case 'toggleOptIn': {
        const p = P(d.id);
        if (p) p.optIn = { ...(p.optIn || {}), [d.costId]: !p.optIn?.[d.costId] };
        break;
      }
      case 'addUpdate':
        if (!str(d.text)) throw new Error('Escreva o aviso.');
        s.updates.unshift({ id: id(), text: str(d.text, 800), at: new Date().toISOString(), pinned: false });
        break;
      case 'removeUpdate':
        s.updates = s.updates.filter((u) => u.id !== d.id);
        break;
      case 'pinUpdate': {
        const u = s.updates.find((x) => x.id === d.id);
        if (u) u.pinned = !u.pinned;
        break;
      }
      case 'addMission':
        if (!str(d.title)) throw new Error('Escreva a missão.');
        s.missions.push({ id: id(), emoji: str(d.emoji, 8) || '⭐', title: str(d.title, 120), doneBy: [] });
        break;
      case 'removeMission':
        s.missions = s.missions.filter((m) => m.id !== d.id);
        break;
      case 'toggleMission': {
        const m = s.missions.find((x) => x.id === d.missionId);
        if (m) m.doneBy = m.doneBy.includes(d.participantId) ? m.doneBy.filter((x) => x !== d.participantId) : [...m.doneBy, d.participantId];
        break;
      }
      default:
        return send(res, 400, { error: 'Ação desconhecida.' });
    }

    if (b.action !== 'load') await save(s);
    send(res, 200, { state: s, database: usingDatabase() });
  } catch (e) {
    send(res, 400, { error: e.message || 'Erro.' });
  }
}
