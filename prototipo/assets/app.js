// Página pública + área do participante
(function () {
  const $ = (s) => document.querySelector(s);
  const { esc, money, api } = U;
  let S = null;          // estado público
  let ME = null;         // participante logado
  let code = null;
  let draft = null;      // avatar em edição
  let editing = false;

  // ---------- Contagem regressiva ----------
  function tick() {
    if (!S) return;
    const el = $('#countdown');
    const now = Date.now();
    const start = new Date(S.event.start).getTime();
    const end = new Date(S.event.end).getTime();
    if (now >= start && (isNaN(end) || now < end)) { el.innerHTML = '<div class="live-msg">🎉 A FESTA ESTÁ ROLANDO! 🎉</div>'; return; }
    if (!isNaN(end) && now >= end) { el.innerHTML = '<div class="live-msg">💖 Obrigada por virem! 💖</div>'; return; }
    let d = Math.max(0, start - now) / 1000;
    const parts = [['dias', 86400], ['horas', 3600], ['min', 60], ['seg', 1]].map(([l, n]) => {
      const v = Math.floor(d / n); d -= v * n; return [l, v];
    });
    el.innerHTML = `<div class="countdown">${parts.map(([l, v]) => `<div class="cd"><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('')}</div>`;
  }

  // ---------- Render público ----------
  function render() {
    const e = S.event;
    document.title = `${e.title} 🎉`;
    $('#title').textContent = e.title;
    $('#subtitle').textContent = e.subtitle || '';
    $('#dates').textContent = U.dateRange(e.start, e.end);
    $('#place').textContent = e.place || 'A confirmar';
    $('#info').textContent = e.info || '';

    const required = S.costs.filter((c) => !c.optional);
    const optional = S.costs.filter((c) => c.optional);
    $('#price').textContent = money(required.reduce((t, c) => t + Number(c.value), 0));
    $('#price-note').textContent = [required.map((c) => c.name).join(' + '), optional.length ? `+ opcionais: ${optional.map((c) => `${c.name} (${money(c.value)})`).join(', ')}` : ''].filter(Boolean).join(' ');

    const people = S.participants;
    const st = people.map((p) => ({ p, s: U.status(p, S.costs) }));
    const done = st.filter((x) => x.s.all).length;
    $('#paid-count').textContent = people.length ? `${done} de ${people.length}` : '—';
    $('#paid-note').textContent = people.length ? (done === people.length ? 'Todo mundo garantido! 🎉' : 'pagamentos completos') : 'Participantes entram em breve';
    $('#bar').style.width = people.length ? `${(done / people.length) * 100}%` : '0';

    // ordena: pagos primeiro
    st.sort((a, b) => (b.s.all - a.s.all) || (b.s.some - a.s.some) || a.p.name.localeCompare(b.p.name));
    $('#people').innerHTML = st.length ? st.map(({ p, s }) => {
      const cls = s.all ? 'paid' : s.some ? 'partial' : 'pending';
      const badge = s.all ? '<span class="badge ok">PAGO ✓</span>' : s.some ? `<span class="badge half">${s.paid.length}/${s.owed.length} pago</span>` : '<span class="badge no">pendente</span>';
      return `<div class="person ${cls}" title="${esc(p.name)}"><div class="av">${Avatar.svg(p.avatar, 76)}</div>
        <div class="nm">${esc(p.name)}</div><div class="nk">${p.nickname ? '“' + esc(p.nickname) + '”' : ''}</div>${badge}</div>`;
    }).join('') : '<div class="empty">Ninguém na lista ainda.</div>';

    const ups = [...S.updates].sort((a, b) => (b.pinned - a.pinned) || b.at.localeCompare(a.at));
    $('#updates').innerHTML = ups.length ? ups.map((u) => `<div class="update ${u.pinned ? 'pinned' : ''}">${u.pinned ? '📌 ' : ''}${esc(u.text)}<time>${U.ago(u.at)}</time></div>`).join('') : '<div class="empty">Sem avisos por enquanto.</div>';

    const byId = Object.fromEntries(people.map((p) => [p.id, p]));
    $('#missions').innerHTML = S.missions.length ? S.missions.map((m) => {
      const who = m.doneBy.map((id) => byId[id]).filter(Boolean);
      const mine = ME && m.doneBy.includes(ME.id);
      return `<div class="mission ${mine ? 'mine' : ''}"><div class="emo">${esc(m.emoji)}</div><div>
        <div class="t">${esc(m.title)}${mine ? ' ✅' : ''}</div>
        ${who.length ? `<div class="who">${who.map((p) => `<span title="${esc(p.name)}">${Avatar.svg(p.avatar, 30)}</span>`).join('')}</div>` : '<div class="none">Ninguém cumpriu ainda</div>'}
      </div></div>`;
    }).join('') : '<div class="empty">As missões serão reveladas em breve…</div>';

    tick();
    renderMe();
  }

  // ---------- Minha área ----------
  function renderMe() {
    const box = $('#me');
    if (!ME) {
      box.innerHTML = `<p style="margin-top:0">Cada convidado recebe um <b>código</b>. Entre para montar seu avatar, ver quanto falta pagar e escolher os extras.</p>
        <form class="login" id="login"><input id="code" maxlength="8" placeholder="SEU CÓDIGO" autocomplete="off" value="${esc(code || '')}"><button>Entrar</button></form>
        <div class="err" id="err"></div>`;
      $('#login').onsubmit = (ev) => { ev.preventDefault(); login($('#code').value); };
      return;
    }
    const s = U.status(ME, S.costs);
    const opts = S.costs.filter((c) => c.optional);
    const myMissions = S.missions.filter((m) => m.doneBy.includes(ME.id));
    const av = editing ? draft : ME.avatar;

    box.innerHTML = `
      <div class="me-head">
        <div class="av-big">${Avatar.svg(av, 120)}</div>
        <div style="flex:1;min-width:200px">
          <h3>Oi, ${esc(ME.name)}! ${s.all ? '🎉' : '👋'}</h3>
          <div style="color:var(--muted)">Seu código: <span class="code">${esc(ME.code)}</span></div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            ${editing ? '<button id="save">Salvar avatar</button><button class="ghost" id="rand">🎲 Aleatório</button><button class="ghost" id="cancel">Cancelar</button>'
                      : '<button id="edit">✏️ Personalizar avatar</button><button class="ghost" id="logout">Sair</button>'}
          </div>
        </div>
      </div>
      ${editing ? editorHTML() : ''}
      <div class="me-cols">
        <div class="card">
          <h3>Meus pagamentos</h3>
          <div class="bill">
            ${S.costs.map((c) => {
              const inBill = !c.optional || ME.optIn?.[c.id];
              const paid = ME.paid?.[c.id];
              return `<div class="bill-row"><div>${esc(c.name)} ${c.optional ? '<span class="opt">(opcional)</span>' : ''}<br>
                ${c.optional && !paid ? `<label class="switch"><input type="checkbox" data-opt="${c.id}" ${inBill ? 'checked' : ''}> quero participar</label>` : ''}</div>
                <div style="text-align:right"><b>${money(c.value)}</b><br>${inBill ? (paid ? '<span class="badge ok">pago ✓</span>' : '<span class="badge no">a pagar</span>') : '<span class="opt">fora</span>'}</div></div>`;
            }).join('')}
            <div class="bill-row total"><span>Falta pagar</span><span style="color:${s.total - s.paidTotal > 0 ? 'var(--pink)' : 'var(--green)'}">${money(s.total - s.paidTotal)}</span></div>
          </div>
          ${S.event.pix && s.total - s.paidTotal > 0 ? `<div class="pix"><code>${esc(S.event.pix)}</code><button class="small" id="copypix">Copiar Pix</button></div>` : ''}
          ${opts.length ? '<small style="display:block;margin-top:10px">Os opcionais só entram na sua conta se você marcar.</small>' : ''}
        </div>
        <div class="card">
          <h3>Meu perfil no game</h3>
          <label style="font-size:13px;color:var(--muted)">Apelido (aparece embaixo do nome)</label>
          <div style="display:flex;gap:8px;margin-top:6px"><input id="nick" maxlength="24" value="${esc(ME.nickname || '')}" placeholder="ex: Rainha do karaokê"><button class="small" id="savenick">Salvar</button></div>
          <h3 style="margin-top:18px">Missões cumpridas: ${myMissions.length}/${S.missions.length}</h3>
          ${myMissions.length ? myMissions.map((m) => `<div>${esc(m.emoji)} ${esc(m.title)}</div>`).join('') : '<small>Nenhuma ainda — a aniversariante marca no dia da festa!</small>'}
        </div>
      </div>`;

    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on('edit', () => { editing = true; draft = { ...ME.avatar }; renderMe(); });
    on('cancel', () => { editing = false; renderMe(); });
    on('rand', () => { draft = Avatar.random(); renderMe(); });
    on('save', () => saveMe({ avatar: draft }, 'Avatar salvo! 🪩'));
    on('savenick', () => saveMe({ nickname: $('#nick').value }, 'Apelido salvo!'));
    on('logout', () => { ME = null; code = null; U.store.set('bday-code', null); render(); });
    on('copypix', () => U.copy(S.event.pix));
    box.querySelectorAll('[data-opt]').forEach((cb) => cb.onchange = async () => {
      try {
        const r = await api('/api/me', { code, action: 'optin', costId: cb.dataset.opt, value: cb.checked });
        ME = r.me; await refresh(); U.toast(cb.checked ? 'Adicionado à sua conta' : 'Removido da sua conta');
      } catch (e) { U.toast(e.message); cb.checked = !cb.checked; }
    });
    box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { draft[b.dataset.k] = b.dataset.v; renderMe(); });
  }

  function editorHTML() {
    const O = Avatar.OPTIONS;
    const isColor = (k) => ['bg', 'skin', 'hairColor'].includes(k);
    return `<div class="editor">${Object.keys(O).map((k) => `<div class="ed-row"><label>${Avatar.LABELS[k]}</label><div class="opts">
      ${O[k].map((v) => `<button class="opt-btn ${draft[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}" title="${v}">
        ${isColor(k) ? `<span class="swatch" style="background:${v}"></span>` : Avatar.svg({ ...draft, [k]: v }, 44)}</button>`).join('')}
    </div></div>`).join('')}</div>`;
  }

  async function saveMe(fields, msg) {
    try {
      const r = await api('/api/me', { code, action: 'save', ...fields });
      ME = r.me; editing = false; await refresh(); U.toast(msg);
    } catch (e) { U.toast(e.message); }
  }

  async function login(c) {
    c = String(c || '').trim().toUpperCase();
    if (!c) return;
    try {
      const r = await api('/api/me', { code: c, action: 'get' });
      ME = r.me; code = c; U.store.set('bday-code', c);
      render();
      if (!location.hash) document.getElementById('eu').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      const err = $('#err'); if (err) err.textContent = e.message;
      U.store.set('bday-code', null);
    }
  }

  async function refresh() {
    try {
      S = await api('/api/state');
      if (ME) { const p = S.participants.find((x) => x.id === ME.id); if (p) ME = { ...p, code: ME.code }; else { ME = null; code = null; } }
      if (!editing) render(); else tick();
    } catch (e) { if (!S) $('#title').textContent = 'Ops, não carregou 😕'; }
  }

  (async function start() {
    const fromUrl = new URLSearchParams(location.search).get('c');
    code = fromUrl || U.store.get('bday-code');
    if (fromUrl) history.replaceState(null, '', location.pathname + '#eu');
    await refresh();
    if (code) await login(code);
    setInterval(tick, 1000);
    setInterval(() => { if (!document.hidden) refresh(); }, 30000);
  })();
})();
