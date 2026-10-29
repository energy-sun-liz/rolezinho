// Armazenamento: Upstash Redis (via integração da Vercel) ou memória (teste local)
import crypto from 'node:crypto';

const KEY = 'aniversario:state:v1';
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let memory = null;

export const id = () => crypto.randomBytes(4).toString('hex');

export function newCode(existing = []) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from(crypto.randomBytes(5), (b) => abc[b % abc.length]).join('');
  } while (existing.includes(code));
  return code;
}

export function randomAvatar() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return {
    bg: pick(['#ff2bd6', '#22e4ff', '#ffe14d', '#7c3aed', '#22c55e', '#ff7a18']),
    skin: pick(['#ffe0c7', '#f5c49c', '#d9a066', '#b5774a', '#8d5524', '#5c3a1e']),
    hair: pick(['short', 'long', 'curly', 'bun', 'afro', 'mohawk']),
    hairColor: pick(['#1a1a1a', '#5b3a1e', '#c98b3c', '#f5d77a', '#e2412b', '#ff2bd6']),
    eyes: pick(['dots', 'happy', 'wink']),
    mouth: pick(['smile', 'grin', 'open']),
    acc: pick(['partyhat', 'none', 'crown', 'glasses']),
  };
}

export function defaultState() {
  const now = new Date().toISOString();
  return {
    event: {
      title: 'Aniversário da Lizandra',
      subtitle: 'Fim de semana de festa 🎉',
      start: '2026-11-20T18:00:00-03:00',
      end: '2026-11-22T18:00:00-03:00',
      place: 'Local a confirmar',
      pix: '',
      info: 'Valor por pessoa referente ao aluguel do espaço. Outros custos são opcionais — escolha na sua área.',
    },
    costs: [{ id: 'aluguel', name: 'Aluguel do espaço', value: 120, optional: false }],
    participants: [],
    updates: [{ id: id(), text: 'O app da festa está no ar! Pegue seu código comigo e monte seu avatar 🪩', at: now }],
    missions: [
      { id: id(), emoji: '📸', title: 'Tirar uma selfie com a aniversariante', doneBy: [] },
      { id: id(), emoji: '💃', title: 'Puxar a primeira dança', doneBy: [] },
      { id: id(), emoji: '🎤', title: 'Cantar no karaokê', doneBy: [] },
      { id: id(), emoji: '🥂', title: 'Fazer um brinde surpresa', doneBy: [] },
    ],
  };
}

async function redis(args) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function load() {
  if (!URL || !TOKEN) return (memory ??= defaultState());
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : defaultState();
}

export async function save(state) {
  if (!URL || !TOKEN) {
    memory = state;
    return;
  }
  await redis(['SET', KEY, JSON.stringify(state)]);
}

export const usingDatabase = () => Boolean(URL && TOKEN);

export function publicView(s) {
  return {
    event: s.event,
    costs: s.costs,
    updates: s.updates,
    missions: s.missions,
    participants: s.participants.map(({ code, ...p }) => p),
  };
}

export function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(data);
}

export function body(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}
