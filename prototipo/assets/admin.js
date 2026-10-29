// Painel admin
(function () {
  const app = document.getElementById('app');
  const { esc, money } = U;
  let pw = null;
  try { pw = sessionStorage.getItem('bday-admin'); } catch {}
  let S = null, DB = true;

  async function act(action, data) {
    const r = await U.api('/api/admin', { password: pw, action, data });
    S = r.state; DB = r.database;
    return r;
  }
  async function run(action, data, msg) {
    try { await act(action, data); render(); if (msg) U.toast(msg); }
    catch (e) { U.toast(e.message); if (/senha/i.test(e.message)) logout(); }
  }
  function logout() { pw = null; try { sessionStorage.removeItem('bday-admin'); } catch {} loginView(); }

  function loginView(err = '') {
    app.innerHTML = `<div class="me-box" style="max-width:460px;margin:40px auto">
      <h2>Entrar</h2><form class="login" id="f"><input type="password" id="pw" placeholder="Senha" style="text-transform:none;letter-spacing:normal"><button>Entrar</button></form>
      <div class="err">${esc(err)}</div></div>`;
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault(); pw = document.getElementById('pw').value;
      try { await act('load'); try { sessionStorage.setItem('bday-admin', pw); } catch {} render(); }
      catch (er) { pw = null; loginView(er.message); }
    };
  }

  const toLocal = (iso) => {
    const d = new Date(iso); if (isNaN(d)) return '';
    const sp = new Date(d.getTime() - 3 * 3600e3); // horário de Brasília
    return sp.toISOString().slice(0, 16);
  };
  const fromLocal = (v) => (v ? `${v}:00-03:00` : '');

  function inviteText(p) {
    return `Oi ${p.name}! 🎉 Este é o app do meu aniversário (${U.dateRange(S.event.start, S.event.end)}).\nSeu código: ${p.code}\nEntre aqui e monte seu avatar: ${location.origin}/?c=${p.code}`;
  }

  function render() {
    const e = S.event;
    const people = S.participants;
    const sts = people.map((p) => U.status(p, S.costs));
    const totalOwed = sts.reduce((t, s) => t + s.total, 0);
    const totalPaid = sts.reduce((t, s) => t + s.paidTotal, 0);

    app.innerHTML = `
      ${DB ? '' : '<div class="warn">⚠️ Banco de dados não conectado: as alterações somem quando o servidor reinicia. Conecte o Upstash Redis na Vercel (veja o README).</div>'}
      <div class="stats" style="margin-top:16px">
        <div class="card"><h3>Participantes</h3><div class="big">${people.length}</div></div>
        <div class="card"><h3>Tudo pago</h3><div class="big">${sts.filter((s) => s.all).length}</div></div>
        <div class="card"><h3>Recebido</h3><div class="big pink">${money(totalPaid)}</div><small>de ${money(totalOwed)}</small></div>
        <div class="card"><h3>Falta receber</h3><div class="big">${money(totalOwed - totalPaid)}</div></div>
      </div>

      <div class="card">
        <h2>👥 Participantes</h2>
        <div class="row"><textarea id="names" rows="2" placeholder="Nomes — um por linha ou separados por vírgula" style="flex:1;min-width:220px"></textarea><button id="addp">Adicionar</button></div>
        <div class="tbl-wrap" style="margin-top:14px">${people.length ? `<table>
          <tr><th></th><th>Nome</th><th>Código</th>${S.costs.map((c) => `<th>${esc(c.name)}<br><span style="text-transform:none">${money(c.value)}${c.optional ? ' · opc.' : ''}</span></th>`).join('')}<th>Falta</th><th></th></tr>
          ${people.map((p, i) => `<tr>
            <td>${Avatar.svg(p.avatar, 40)}</td>
            <td><b>${esc(p.name)}</b>${p.nickname ? `<br><small>“${esc(p.nickname)}”</small>` : ''}</td>
            <td><span class="codecell">${esc(p.code)}</span></td>
            ${S.costs.map((c) => {
              const inBill = !c.optional || p.optIn?.[c.id];
              const paid = p.paid?.[c.id];
              return `<td><button class="pay ${paid ? 'on' : ''} ${inBill ? '' : 'off-opt'}" data-pay="${p.id}" data-cost="${c.id}" title="Clique para marcar/desmarcar pago">${paid ? 'pago ✓' : inBill ? 'pendente' : 'não aderiu'}</button>
                ${c.optional && !paid ? `<br><a href="#" data-opt="${p.id}" data-cost="${c.id}" style="font-size:11px">${inBill ? 'tirar' : 'incluir'}</a>` : ''}</td>`;
            }).join('')}
            <td>${money(sts[i].total - sts[i].paidTotal)}</td>
            <td class="row" style="flex-wrap:nowrap">
              <button class="small" data-invite="${p.id}" title="Copiar mensagem com código e link">📋 Convite</button>
              <button class="small ghost" data-rename="${p.id}" title="Renomear">✏️</button>
              <button class="small ghost" data-reset="${p.id}" title="Gerar novo código">🔄</button>
              <button class="small ghost" data-del="${p.id}" title="Remover">🗑️</button>
            </td></tr>`).join('')}
        </table>` : '<div class="empty">Adicione os convidados acima. Cada um ganha um código e um avatar aleatório.</div>'}</div>
      </div>

      <div class="card">
        <h2>📣 Avisos</h2>
        <div class="row"><textarea id="upd" rows="2" placeholder="Ex: Confirmado! A chácara tem piscina, levem roupa de banho 🏊" style="flex:1;min-width:220px"></textarea><button id="addu">Publicar</button></div>
        <div style="margin-top:12px;display:grid;gap:8px">${S.updates.map((u) => `<div class="update ${u.pinned ? 'pinned' : ''}" style="display:flex;gap:10px;justify-content:space-between">
          <div>${u.pinned ? '📌 ' : ''}${esc(u.text)}<time>${U.ago(u.at)}</time></div>
          <div class="row" style="flex-wrap:nowrap;align-self:start"><button class="small ghost" data-pin="${u.id}">${u.pinned ? 'Desafixar' : '📌 Fixar'}</button><button class="small ghost" data-delu="${u.id}">🗑️</button></div></div>`).join('')}</div>
      </div>

      <div class="card">
        <h2>🎯 Missões</h2>
        <div class="row"><input id="memo" placeholder="🎯" style="width:70px"><input id="mtitle" placeholder="Nova missão" style="flex:1;min-width:200px"><button id="addm">Adicionar</button></div>
        <p style="color:var(--muted);font-size:14px">Toque no nome de quem cumpriu a missão.</p>
        ${S.missions.map((m) => `<div class="m-item">
          <div class="row" style="justify-content:space-between"><b>${esc(m.emoji)} ${esc(m.title)} <span style="color:var(--muted);font-weight:400">· ${m.doneBy.length}</span></b><button class="small ghost" data-delm="${m.id}">🗑️</button></div>
          <div class="row" style="margin-top:8px">${people.map((p) => `<button class="chip ${m.doneBy.includes(p.id) ? 'on' : ''}" data-mis="${m.id}" data-pid="${p.id}">${Avatar.svg(p.avatar, 24)}${esc(p.name)}</button>`).join('') || '<small>Adicione participantes primeiro.</small>'}</div>
        </div>`).join('')}
      </div>

      <div class="card">
        <h2>💸 Custos</h2>
        <p style="color:var(--muted);font-size:14px;margin-top:0">Obrigatórios entram para todos. Opcionais (ex: bebidas, churrasco) só para quem aderir.</p>
        ${S.costs.map((c) => `<div class="row" style="margin-bottom:8px">
          <input data-cname="${c.id}" value="${esc(c.name)}" style="flex:1;min-width:160px">
          <input data-cval="${c.id}" type="number" min="0" step="0.01" value="${c.value}" style="width:120px">
          <label class="switch"><input type="checkbox" data-copt="${c.id}" ${c.optional ? 'checked' : ''}> opcional</label>
          <button class="small ghost" data-csave="${c.id}">Salvar</button><button class="small ghost" data-cdel="${c.id}">🗑️</button></div>`).join('')}
        <div class="row" style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)">
          <input id="cname" placeholder="Novo custo (ex: Bebidas)" style="flex:1;min-width:160px"><input id="cval" type="number" min="0" step="0.01" placeholder="R$" style="width:120px">
          <label class="switch"><input type="checkbox" id="copt" checked> opcional</label><button id="addc">Adicionar</button></div>
      </div>

      <div class="card">
        <h2>🎉 Dados da festa</h2>
        <div class="form-grid">
          <div><label>Título</label><input id="e-title" value="${esc(e.title)}"></div>
          <div><label>Subtítulo</label><input id="e-subtitle" value="${esc(e.subtitle)}"></div>
          <div><label>Início (horário de Brasília)</label><input id="e-start" type="datetime-local" value="${toLocal(e.start)}"></div>
          <div><label>Fim</label><input id="e-end" type="datetime-local" value="${toLocal(e.end)}"></div>
          <div><label>Local</label><input id="e-place" value="${esc(e.place)}"></div>
          <div><label>Chave Pix</label><input id="e-pix" value="${esc(e.pix)}" placeholder="aparece para quem tem pagamento pendente"></div>
        </div>
        <div style="margin-top:12px"><label class="lbl">Observação</label><textarea id="e-info" rows="2">${esc(e.info)}</textarea></div>
        <div style="margin-top:12px"><button id="savee">Salvar dados</button></div>
      </div>

      <p style="text-align:center;margin-top:30px"><button class="ghost" id="logout">Sair do painel</button></p>`;

    bind();
  }

  function bind() {
    const $ = (id) => document.getElementById(id);
    const all = (sel, fn) => app.querySelectorAll(sel).forEach((el) => (el.onclick = (ev) => { ev.preventDefault(); fn(el.dataset, el); }));
    const P = (id) => S.participants.find((p) => p.id === id);

    $('addp').onclick = () => run('addParticipant', { names: $('names').value }, 'Participantes adicionados!');
    $('addu').onclick = () => run('addUpdate', { text: $('upd').value }, 'Aviso publicado! 📣');
    $('addm').onclick = () => run('addMission', { emoji: $('memo').value, title: $('mtitle').value }, 'Missão criada!');
    $('addc').onclick = () => run('addCost', { name: $('cname').value, value: $('cval').value, optional: $('copt').checked }, 'Custo adicionado!');
    $('savee').onclick = () => run('saveEvent', {
      title: $('e-title').value, subtitle: $('e-subtitle').value, start: fromLocal($('e-start').value), end: fromLocal($('e-end').value),
      place: $('e-place').value, pix: $('e-pix').value, info: $('e-info').value,
    }, 'Dados salvos!');
    $('logout').onclick = logout;

    all('[data-pay]', (d) => run('togglePaid', { id: d.pay, costId: d.cost }));
    all('[data-opt]', (d) => run('toggleOptIn', { id: d.opt, costId: d.cost }));
    all('[data-invite]', (d) => U.copy(inviteText(P(d.invite))));
    all('[data-rename]', (d) => { const n = prompt('Novo nome:', P(d.rename).name); if (n) run('updateParticipant', { id: d.rename, name: n }, 'Renomeado!'); });
    all('[data-reset]', (d) => { if (confirm(`Gerar novo código para ${P(d.reset).name}? O código antigo para de funcionar.`)) run('resetCode', { id: d.reset }, 'Novo código gerado'); });
    all('[data-del]', (d) => { if (confirm(`Remover ${P(d.del).name}?`)) run('removeParticipant', { id: d.del }, 'Removido'); });
    all('[data-pin]', (d) => run('pinUpdate', { id: d.pin }));
    all('[data-delu]', (d) => { if (confirm('Apagar este aviso?')) run('removeUpdate', { id: d.delu }, 'Aviso apagado'); });
    all('[data-delm]', (d) => { if (confirm('Apagar esta missão?')) run('removeMission', { id: d.delm }, 'Missão apagada'); });
    all('[data-mis]', (d) => run('toggleMission', { missionId: d.mis, participantId: d.pid }));
    all('[data-csave]', (d) => run('updateCost', {
      id: d.csave,
      name: app.querySelector(`[data-cname="${d.csave}"]`).value,
      value: app.querySelector(`[data-cval="${d.csave}"]`).value,
      optional: app.querySelector(`[data-copt="${d.csave}"]`).checked,
    }, 'Custo salvo!'));
    all('[data-cdel]', (d) => { if (confirm('Apagar este custo?')) run('removeCost', { id: d.cdel }, 'Custo apagado'); });
  }

  if (pw) act('load').then(render).catch(() => logout()); else loginView();
})();
