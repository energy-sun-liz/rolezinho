// Utilidades compartilhadas
window.U = {
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  money: (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  async api(path, body) {
    const opts = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
    const r = await fetch(path, opts);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Algo deu errado.');
    return j;
  },
  owed(p, costs) { return costs.filter((c) => !c.optional || p.optIn?.[c.id]); },
  status(p, costs) {
    const o = U.owed(p, costs);
    const paid = o.filter((c) => p.paid?.[c.id]);
    const sum = (a) => a.reduce((t, c) => t + Number(c.value || 0), 0);
    return { owed: o, paid, all: o.length > 0 && paid.length === o.length, some: paid.length > 0, total: sum(o), paidTotal: sum(paid) };
  },
  toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  },
  copy(text) { navigator.clipboard?.writeText(text).then(() => U.toast('Copiado! ✨'), () => U.toast('Não deu para copiar')); },
  store: {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  },
  dateRange(start, end) {
    const s = new Date(start), e = new Date(end);
    const m = (d) => d.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
    const day = (d) => d.toLocaleDateString('pt-BR', { day: 'numeric', timeZone: 'America/Sao_Paulo' });
    if (isNaN(s)) return '';
    if (isNaN(e) || day(s) === day(e) && m(s) === m(e)) return `${day(s)} de ${m(s)}`;
    return m(s) === m(e) ? `${day(s)} a ${day(e)} de ${m(s)}` : `${day(s)} de ${m(s)} a ${day(e)} de ${m(e)}`;
  },
  ago(iso) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  },
};

// Brilhos flutuantes no fundo
(function sparkles() {
  const c = document.getElementById('sparkles');
  if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  const colors = ['#ff2bd6', '#22e4ff', '#ffe14d', '#a43bff'];
  let W, H, parts;
  const resize = () => {
    W = c.width = innerWidth; H = c.height = innerHeight;
    parts = Array.from({ length: Math.min(70, Math.floor(W / 18)) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + .6,
      vy: Math.random() * .35 + .1, c: colors[Math.floor(Math.random() * 4)], t: Math.random() * 6,
    }));
  };
  resize(); addEventListener('resize', resize);
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.vy; p.t += .03;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.globalAlpha = .35 + Math.sin(p.t) * .3;
      ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x + Math.sin(p.t) * 6, p.y, p.r, 0, 7); ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
})();
