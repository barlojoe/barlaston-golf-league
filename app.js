// Barlaston Golf League — frontend
let STATE = null;
let activeRoundId = null;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB');

async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('/api' + path, opts);
  return r.json();
}

function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

async function refresh() {
  STATE = await api('/state');
  renderLeaderboard();
  renderWeekly();
  renderPot();
  renderPlayers();
  renderCourse();
  renderSettings();
  renderRoundSelect();
  renderScorecard();
}

/* ---------- Leaderboard ---------- */
function medal(rank) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
}
function renderLeaderboard() {
  const body = $('#standings-body');
  const empty = $('#standings-empty');
  const played = STATE.standings.filter(s => s.weeksPlayed > 0 || STATE.players.length);
  if (!STATE.standings.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  body.innerHTML = STATE.standings.map(s => `
    <tr class="${s.rank === 1 ? 'leader' : ''}">
      <td class="rank-medal">${medal(s.rank)}</td>
      <td class="col-name">${esc(s.name)}</td>
      <td>${s.handicap}</td>
      <td>${s.weeksPlayed}</td>
      <td>${s.stableford}</td>
      <td>${s.bonus}</td>
      <td>${s.birdies}</td>
      <td>${s.eagles}</td>
      <td>${s.weeklyWins}</td>
      <td class="col-pts">${s.points}</td>
    </tr>`).join('');
}

function renderWeekly() {
  const wrap = $('#weekly-list');
  const section = $('#weekly-section');
  const weeks = [...STATE.weekly].filter(w => w.results.length).reverse();
  if (!weeks.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const nameOf = id => (STATE.players.find(p => p.id === id) || {}).name || '?';
  wrap.innerHTML = weeks.map(w => `
    <div class="weekly-card">
      <h4>Week ${w.week}${w.date ? ' · ' + w.date : ''}</h4>
      ${w.results.map(r => `
        <div class="weekly-row">
          <span class="pos">${r.weeklyRank}</span>
          <span class="nm">${esc(nameOf(r.playerId))}</span>
          <span class="pts">${r.weeklyTotal} pts${r.birdies ? ' · '+r.birdies+'🐦' : ''}${r.eagles ? ' · '+r.eagles+'🦅' : ''}</span>
        </div>`).join('')}
    </div>`).join('');
}

function renderPot() {
  const p = STATE.pot;
  $('#pot-current').textContent = money(p.currentPot);
  $('#pot-weekly').textContent = money(p.weeklyPot);
  $('#pot-weeks').textContent = p.weeksPlayed + ' / ' + STATE.config.totalRounds;
  $('#pot-projected').textContent = money(p.projectedPot);
}

/* ---------- Players ---------- */
function renderPlayers() {
  const body = $('#players-body');
  body.innerHTML = STATE.players.map(p => `
    <tr data-id="${p.id}">
      <td><input class="pl-name" value="${esc(p.name)}"></td>
      <td><input class="pl-hcp" type="number" step="0.1" value="${p.handicap}"></td>
      <td><button class="btn small ghost pl-save">Save</button>
          <button class="btn small danger-ghost pl-del">✕</button></td>
    </tr>`).join('');
  $$('#players-body tr').forEach(tr => {
    const id = tr.dataset.id;
    $('.pl-save', tr).onclick = async () => {
      await api('/players/' + id, 'PUT', { name: $('.pl-name', tr).value, handicap: $('.pl-hcp', tr).value });
      toast('Player saved'); refresh();
    };
    $('.pl-del', tr).onclick = async () => {
      if (confirm('Remove this player and their scores?')) { await api('/players/' + id, 'DELETE'); refresh(); }
    };
  });
}

/* ---------- Course ---------- */
function renderCourse() {
  $('#course-name').value = STATE.course.name;
  const body = $('#course-body');
  body.innerHTML = STATE.course.holes.map((h, i) => `
    <tr data-i="${i}">
      <td>${h.hole}</td>
      <td><input class="c-par" type="number" min="3" max="6" value="${h.par}"></td>
      <td><input class="c-si" type="number" min="1" max="18" value="${h.si}"></td>
    </tr>`).join('');
  updateParTotal();
  $$('#course-body .c-par').forEach(inp => inp.oninput = updateParTotal);
}
function updateParTotal() {
  const total = $$('#course-body .c-par').reduce((s, i) => s + (Number(i.value) || 0), 0);
  $('#course-par-total').textContent = total;
}

/* ---------- Settings ---------- */
function renderSettings() {
  const c = STATE.config;
  $('#cfg-stake').value = c.stakePerWeek;
  $('#cfg-rounds').value = c.totalRounds;
  $('#cfg-season').value = c.season;
  $('#cfg-birdie').value = c.bonus.perBirdie;
  $('#cfg-eagle').value = c.bonus.perEagle;
  $('#cfg-win').value = c.bonus.winWeek;
  $('#cfg-second').value = c.bonus.secondWeek;
}

/* ---------- Rounds & scorecard ---------- */
function renderRoundSelect() {
  const sel = $('#round-select');
  sel.innerHTML = STATE.rounds.map(r => `<option value="${r.id}">Week ${r.week}${r.date ? ' · ' + r.date : ''}</option>`).join('');
  if (STATE.rounds.length) {
    if (!activeRoundId || !STATE.rounds.find(r => r.id === activeRoundId)) activeRoundId = STATE.rounds[STATE.rounds.length - 1].id;
    sel.value = activeRoundId;
  }
}

function renderScorecard() {
  const wrap = $('#scorecard-wrap');
  const round = STATE.rounds.find(r => r.id === activeRoundId);
  if (!round) { wrap.innerHTML = '<p class="empty-note">Create a round to start entering scores.</p>'; return; }
  $('#round-week').value = round.week;
  $('#round-date').value = round.date || '';
  if (!STATE.players.length) { wrap.innerHTML = '<p class="empty-note">Add players first (Players tab).</p>'; return; }

  const holes = STATE.course.holes;
  const headHoles = holes.map(h => `<th>${h.hole}</th>`).join('');
  const parRow = holes.map(h => `<td>${h.par}</td>`).join('');
  const siRow = holes.map(h => `<td>${h.si}</td>`).join('');

  wrap.innerHTML = STATE.players.map(pl => {
    const scores = (round.scores && round.scores[pl.id]) || [];
    const inputs = holes.map((h, i) => {
      const v = scores[i] == null ? '' : scores[i];
      return `<td><input class="sc-in" data-pid="${pl.id}" data-h="${i}" type="number" min="1" max="15" value="${v}"></td>`;
    }).join('');
    return `
      <div class="player-card-block" data-pid="${pl.id}">
        <div class="pc-head">
          <h4>${esc(pl.name)} <span style="font-size:13px;color:var(--cream-dim)">(HCP ${pl.handicap})</span></h4>
          <span class="pc-stats" id="stats-${pl.id}"></span>
          <button class="btn small sc-save" data-pid="${pl.id}">Save Card</button>
        </div>
        <div class="scorecard-scroll">
          <table class="scorecard">
            <thead><tr><th class="rowhead">Hole</th>${headHoles}<th class="total-cell">Tot</th></tr></thead>
            <tbody>
              <tr class="par-row"><td class="rowhead">Par</td>${parRow}<td>${STATE.course.par}</td></tr>
              <tr class="par-row"><td class="rowhead">S.I.</td>${siRow}<td></td></tr>
              <tr><td class="rowhead">Score</td>${inputs}<td class="total-cell" id="gtot-${pl.id}">—</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  $$('.sc-in').forEach(inp => inp.oninput = () => liveStats(inp.dataset.pid));
  $$('.sc-save').forEach(btn => btn.onclick = () => saveCard(btn.dataset.pid));
  STATE.players.forEach(pl => liveStats(pl.id));
}

function liveStats(pid) {
  const pl = STATE.players.find(p => p.id === pid);
  const holes = STATE.course.holes;
  let gross = 0, stbl = 0, birds = 0, eagles = 0, played = 0;
  holes.forEach((h, i) => {
    const inp = $(`.sc-in[data-pid="${pid}"][data-h="${i}"]`);
    const g = Number(inp.value);
    if (!g) return;
    played++; gross += g;
    const recv = strokesOnHole(pl.handicap, h.si);
    const net = g - recv;
    stbl += Math.max(0, 2 - (net - h.par));
    const toPar = g - h.par;
    if (toPar <= -2) eagles++; else if (toPar === -1) birds++;
  });
  $(`#gtot-${pid}`).textContent = gross || '—';
  $(`#stats-${pid}`).textContent = played ? `${stbl} Stableford · ${birds}🐦 ${eagles}🦅` : '';
}
function strokesOnHole(hcp, si) {
  const h = Math.round(hcp); let s = Math.floor(h / 18);
  if (si <= (h % 18)) s += 1; return s;
}

async function saveCard(pid) {
  const holes = STATE.course.holes;
  const arr = holes.map((h, i) => $(`.sc-in[data-pid="${pid}"][data-h="${i}"]`).value);
  await api('/rounds/' + activeRoundId + '/scores', 'POST', {
    playerId: pid, holes: arr, date: $('#round-date').value,
  });
  toast('Card saved'); refresh();
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------- Wiring ---------- */
function initTabs() {
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#' + t.dataset.tab).classList.add('active');
  });
}

function init() {
  initTabs();

  $('#add-player-btn').onclick = async () => {
    const name = $('#player-name').value.trim();
    if (!name) return toast('Enter a name');
    await api('/players', 'POST', { name, handicap: $('#player-hcp').value });
    $('#player-name').value = ''; $('#player-hcp').value = '';
    toast('Player added'); refresh();
  };

  $('#new-round-btn').onclick = async () => {
    const r = await api('/rounds', 'POST', { week: STATE.rounds.length + 1 });
    activeRoundId = r.round.id; refresh();
  };
  $('#round-select').onchange = e => { activeRoundId = e.target.value; renderScorecard(); };
  $('#delete-round-btn').onclick = async () => {
    if (!activeRoundId) return;
    if (confirm('Delete this round?')) { await api('/rounds/' + activeRoundId, 'DELETE'); activeRoundId = null; refresh(); }
  };
  $('#round-week').onchange = () => {}; // week saved with card
  $('#round-date').onchange = async () => {
    // persist date even before a card is saved by saving onto first player if exists
  };

  $('#save-course-btn').onclick = async () => {
    const holes = $$('#course-body tr').map((tr, i) => ({
      hole: i + 1,
      par: Number($('.c-par', tr).value) || STATE.course.holes[i].par,
      si: Number($('.c-si', tr).value) || STATE.course.holes[i].si,
    }));
    const par = holes.reduce((s, h) => s + h.par, 0);
    await api('/course', 'POST', { name: $('#course-name').value, holes, par });
    toast('Course saved'); refresh();
  };

  $('#save-config-btn').onclick = async () => {
    await api('/config', 'POST', {
      stakePerWeek: Number($('#cfg-stake').value),
      totalRounds: Number($('#cfg-rounds').value),
      season: $('#cfg-season').value,
      bonus: {
        perBirdie: Number($('#cfg-birdie').value),
        perEagle: Number($('#cfg-eagle').value),
        winWeek: Number($('#cfg-win').value),
        secondWeek: Number($('#cfg-second').value),
      },
    });
    toast('Settings saved'); refresh();
  };

  $('#reset-btn').onclick = async () => {
    if (confirm('This wipes ALL players, rounds and scores. Continue?')) { await api('/reset', 'POST'); activeRoundId = null; refresh(); }
  };

  refresh();
}

document.addEventListener('DOMContentLoaded', init);
