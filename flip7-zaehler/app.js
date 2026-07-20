/* Flip 7 Punktezähler
 * Regelbasis:
 * - Rundenscore = (Summe Zahlenkarten, x2 falls Modifikator) + Boni (+2..+10) + 15 (Flip-7-Bonus bei 7 einzigartigen Zahlenkarten)
 * - Bust (doppelte Zahl gezogen) = 0 Punkte für die Runde
 * - Sieg bei Erreichen der Zielpunktzahl (Standard 200) am Ende einer Runde
 */

const STORAGE_KEY = 'flip7-state-v1';
const MODIFIER_OPTIONS = [2, 4, 6, 8, 10];

let state = loadState();
let activeRoundDraft = null; // { [playerId]: { sum, x2, modifiers:Set, bonus, bust } }
let activePlayerTabId = null;

function loadState() {
  let s = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) s = JSON.parse(raw);
  } catch (e) { console.warn('State konnte nicht geladen werden', e); }
  if (!s) s = { players: [], rounds: [], targetScore: 200, nextPlayerId: 1 };
  // Migration: ältere Speicherstände hatten noch kein Regelwerk / Brutal Mode
  if (!s.ruleset) s.ruleset = 'classic';
  if (typeof s.brutalMode !== 'boolean') s.brutalMode = false;
  return s;
}

const RULESET_LABELS = {
  classic: 'Klassisch',
  vengeance: 'With a Vengeance',
  combined: 'Kombiniert',
};
const RULESET_HINTS = {
  classic: 'Original-Regeln: Modifikatoren +2 bis +10 und x2-Karte.',
  vengeance: 'Erweiterung "With a Vengeance": −2 bis −10, ÷2-Karte und Null-Karte statt der Original-Modifikatoren.',
  combined: 'Beide Kartensets gemischt im Spiel – alle Modifikatoren stehen zur Auswahl.',
};

function showsClassicModifiers() { return state.ruleset === 'classic' || state.ruleset === 'combined'; }
function showsVengeanceModifiers() { return state.ruleset === 'vengeance' || state.ruleset === 'combined'; }

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.warn('State konnte nicht gespeichert werden', e); }
}

function uid() { return 'p' + (state.nextPlayerId++); }

function totalFor(playerId) {
  let total = 0;
  for (const round of state.rounds) {
    const entry = round.scores[playerId];
    if (entry) total += entry.total;
  }
  return total;
}

// Rundenwert OHNE Flip-7-Bonus, aber inkl. aller Zahlen- und Modifikator-Effekte.
// Reihenfolge folgt den offiziellen Regeln: Null-Karte übersteuert alles, dann x2,
// dann ÷2 (abrunden), dann +/- Modifikatoren, danach Deckelung bei 0 (außer Brutal Mode).
function calcBaseScore(entry) {
  if (entry.bust) return 0;
  if (entry.zero) return 0;
  let base = entry.sum || 0;
  if (entry.x2) base *= 2;
  if (entry.divide2) base = Math.floor(base / 2);
  const posSum = (entry.modifiers || []).reduce((a, b) => a + b, 0);
  const negSum = (entry.negModifiers || []).reduce((a, b) => a + b, 0);
  base = base + posSum - negSum;
  if (base < 0 && !state.brutalMode) base = 0;
  return base;
}

// Eigener Rundenscore inkl. Flip-7-Bonus, aber OHNE Effekt eines evtl. verschenkten
// Bonus (der wird erst beim Speichern dem Zielspieler abgezogen).
function calcEntryTotal(entry) {
  if (entry.bust) return 0;
  const base = calcBaseScore(entry);
  const keepsBonusForSelf = entry.bonus && !(state.brutalMode && entry.bonusChoice === 'steal');
  return base + (keepsBonusForSelf ? 15 : 0);
}

/* ---------------- Rendering: Standings ---------------- */

function render() {
  renderStandings();
  renderRulesetBadge();
  saveState();
}

function renderRulesetBadge() {
  const badge = document.getElementById('ruleset-badge');
  if (!badge) return;
  badge.textContent = RULESET_LABELS[state.ruleset] + (state.brutalMode ? ' · Brutal' : '');
  badge.className = 'ruleset-badge ' +
    (state.ruleset === 'classic' ? 'mode-classic' : state.ruleset === 'combined' ? 'mode-combined' : '');
}

function renderStandings() {
  const container = document.getElementById('standings');
  const emptyState = document.getElementById('empty-state');
  const fab = document.getElementById('btn-new-round');

  if (state.players.length === 0) {
    container.innerHTML = '';
    emptyState.hidden = false;
    fab.hidden = true;
    return;
  }
  emptyState.hidden = true;
  fab.hidden = false;

  const withTotals = state.players.map(p => ({ ...p, total: totalFor(p.id) }));
  withTotals.sort((a, b) => b.total - a.total);

  const colors = ['#F2B705', '#2DD4BF', '#E5484D', '#7C9CF2', '#F28B05', '#A98DF2'];

  container.innerHTML = withTotals.map((p, i) => {
    const pct = Math.max(0, Math.min(100, (p.total / state.targetScore) * 100));
    const isLeader = i === 0 && p.total > 0;
    const color = colors[i % colors.length];
    return `
      <div class="player-card ${isLeader ? 'leader' : ''}" style="--rank-color:${color}" data-player-id="${p.id}">
        <div class="rank-badge">${i + 1}</div>
        <div class="name-block">
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="sub">${state.rounds.length} ${state.rounds.length === 1 ? 'Runde' : 'Runden'} gespielt</div>
        </div>
        <div class="score" data-score-for="${p.id}">${p.total}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function flipScoreAnimation(playerId) {
  const el = document.querySelector(`[data-score-for="${playerId}"]`);
  if (!el) return;
  el.classList.remove('flipping');
  void el.offsetWidth;
  el.classList.add('flipping');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
}

/* ---------------- Player management ---------------- */

function renderPlayerList() {
  const list = document.getElementById('player-list');
  if (state.players.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);justify-content:center;">Noch keine Spieler</li>';
    return;
  }
  list.innerHTML = state.players.map(p => `
    <li data-player-id="${p.id}">
      <input type="text" value="${escapeHtml(p.name)}" data-rename="${p.id}" maxlength="20">
      <button class="remove-btn icon-btn" data-remove="${p.id}" aria-label="Spieler entfernen">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </li>
  `).join('');

  list.querySelectorAll('[data-rename]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.rename;
      const player = state.players.find(p => p.id === id);
      if (player) {
        player.name = input.value.trim() || player.name;
        input.value = player.name;
        render();
      }
    });
  });
  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.remove;
      const player = state.players.find(p => p.id === id);
      if (!player) return;
      if (state.rounds.length > 0) {
        if (!confirm(`${player.name} entfernen? Bisherige Rundenpunkte dieses Spielers gehen verloren.`)) return;
        state.rounds.forEach(r => delete r.scores[id]);
      }
      state.players = state.players.filter(p => p.id !== id);
      renderPlayerList();
      render();
    });
  });
}

function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  state.players.push({ id: uid(), name: trimmed });
  renderPlayerList();
  render();
}

/* ---------------- Round entry ---------------- */

function openRoundModal() {
  if (state.players.length === 0) return;
  activeRoundDraft = {};
  state.players.forEach(p => {
    activeRoundDraft[p.id] = {
      sum: 0, x2: false, modifiers: [], bonus: false, bust: false,
      zero: false, divide2: false, negModifiers: [], bonusChoice: 'self', bonusTarget: null,
    };
  });
  activePlayerTabId = state.players[0].id;
  document.getElementById('round-number').textContent = state.rounds.length + 1;
  renderPlayerTabs();
  renderScoreForms();
  document.getElementById('round-modal').hidden = false;
}

function closeRoundModal() {
  document.getElementById('round-modal').hidden = true;
  activeRoundDraft = null;
}

function renderPlayerTabs() {
  const tabs = document.getElementById('player-tabs');
  tabs.innerHTML = state.players.map(p => {
    const d = activeRoundDraft[p.id];
    const filled = d.bust || d.sum > 0 || d.modifiers.length > 0 || d.negModifiers.length > 0 || d.bonus || d.zero || d.divide2;
    const cls = ['player-tab'];
    if (p.id === activePlayerTabId) cls.push('active');
    if (d.bust) cls.push('bust'); else if (filled) cls.push('done');
    return `<button class="${cls.join(' ')}" data-tab="${p.id}">${escapeHtml(p.name)}</button>`;
  }).join('');
  tabs.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePlayerTabId = btn.dataset.tab;
      renderPlayerTabs();
      renderScoreForms();
    });
  });
}

function renderScoreForms() {
  const container = document.getElementById('player-score-forms');
  const showClassic = showsClassicModifiers();
  const showVengeance = showsVengeanceModifiers();

  container.innerHTML = state.players.map(p => {
    const d = activeRoundDraft[p.id];
    const total = calcEntryTotal(d);
    const otherPlayers = state.players.filter(o => o.id !== p.id);

    return `
      <div class="score-form ${p.id === activePlayerTabId ? 'active' : ''}" data-form="${p.id}">
        <button class="bust-btn ${d.bust ? 'active' : ''}" data-bust="${p.id}">
          ${d.bust ? 'Bust – 0 Punkte diese Runde' : 'Als Bust markieren (doppelte Zahl gezogen)'}
        </button>

        <div class="bust-hideable" data-bust-hide="${p.id}" style="${d.bust ? 'display:none' : ''}">

          ${showVengeance ? `
          <div class="toggle-row">
            <div>
              <div class="toggle-label">Null-Karte</div>
              <div class="toggle-sub">Score wird 0, außer durch Flip-7-Bonus</div>
            </div>
            <div class="switch ${d.zero ? 'on' : ''}" data-zero="${p.id}"></div>
          </div>
          ` : ''}

          <div style="margin-top:16px; ${d.zero ? 'opacity:0.4;' : ''}">
            <span class="field-label">Summe der Zahlenkarten</span>
            <div class="number-input-row">
              <button class="stepper-btn" data-step="-1" data-player="${p.id}" ${d.zero ? 'disabled' : ''}>−</button>
              <input type="number" inputmode="numeric" min="0" value="${d.sum}" data-sum="${p.id}" ${d.zero ? 'disabled' : ''}>
              <button class="stepper-btn" data-step="1" data-player="${p.id}" ${d.zero ? 'disabled' : ''}>+</button>
            </div>
          </div>

          ${d.zero ? '<div class="zero-note">Null-Karte aktiv: Zahlenkarten &amp; Modifikatoren zählen nicht, nur der Flip-7-Bonus kann noch Punkte bringen.</div>' : `

          ${showClassic ? `
          <div style="margin-top:16px;">
            <span class="field-label">Modifikator-Karten (+)</span>
            <div class="chip-row">
              ${MODIFIER_OPTIONS.map(m => `
                <button class="chip ${d.modifiers.includes(m) ? 'selected' : ''}" data-mod="${m}" data-player="${p.id}">+${m}</button>
              `).join('')}
            </div>
          </div>
          <div class="toggle-row" style="margin-top:12px;">
            <div>
              <div class="toggle-label">x2-Karte</div>
              <div class="toggle-sub">Verdoppelt nur die Zahlenkarten-Summe</div>
            </div>
            <div class="switch ${d.x2 ? 'on' : ''}" data-x2="${p.id}"></div>
          </div>
          ` : ''}

          ${showVengeance ? `
          <div style="margin-top:16px;">
            <span class="field-label">Abzug-Karten (−)</span>
            <div class="chip-row">
              ${MODIFIER_OPTIONS.map(m => `
                <button class="chip negative ${d.negModifiers.includes(m) ? 'selected' : ''}" data-negmod="${m}" data-player="${p.id}">−${m}</button>
              `).join('')}
            </div>
          </div>
          <div class="toggle-row" style="margin-top:12px;">
            <div>
              <div class="toggle-label">÷2-Karte</div>
              <div class="toggle-sub">Halbiert die Zahlenkarten-Summe (abgerundet), vor +/− Modifikatoren</div>
            </div>
            <div class="switch ${d.divide2 ? 'on' : ''}" data-divide2="${p.id}"></div>
          </div>
          ` : ''}
          `}

          <div class="toggle-row" style="margin-top:16px;">
            <div>
              <div class="toggle-label">Flip-7-Bonus (+15)</div>
              <div class="toggle-sub">7 verschiedene Zahlenkarten erreicht</div>
            </div>
            <div class="switch ${d.bonus ? 'on' : ''}" data-bonus="${p.id}"></div>
          </div>

          ${d.bonus && state.brutalMode && otherPlayers.length > 0 ? `
          <div class="bonus-choice">
            <div class="bonus-choice-options">
              <button class="bonus-radio ${d.bonusChoice !== 'steal' ? 'active' : ''}" data-bonus-choice="self" data-player="${p.id}">Ich behalte die 15 Punkte</button>
              <button class="bonus-radio ${d.bonusChoice === 'steal' ? 'active' : ''}" data-bonus-choice="steal" data-player="${p.id}">15 Punkte abziehen bei…</button>
            </div>
            ${d.bonusChoice === 'steal' ? `
            <select class="bonus-target-select" data-bonus-target="${p.id}">
              ${otherPlayers.map(o => `<option value="${o.id}" ${d.bonusTarget === o.id ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
            </select>
            ` : ''}
          </div>
          ` : ''}

          <div class="round-total-preview" style="margin-top:16px;">
            <span class="value" data-preview="${p.id}">${total}</span>
            <span class="label">Punkte diese Runde${d.bonusChoice === 'steal' && d.bonus && state.brutalMode ? ' (Bonus geht an Gegner)' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachFormListeners();
}

function attachFormListeners() {
  const container = document.getElementById('player-score-forms');

  container.querySelectorAll('[data-bust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.bust;
      const d = activeRoundDraft[id];
      d.bust = !d.bust;
      if (d.bust) {
        // Ein Bust wirft alle Karten ab – Runde zählt garantiert 0 Punkte
        d.sum = 0; d.x2 = false; d.modifiers = []; d.negModifiers = [];
        d.zero = false; d.divide2 = false; d.bonus = false; d.bonusChoice = 'self'; d.bonusTarget = null;
      }
      renderPlayerTabs();
      renderScoreForms();
    });
  });

  container.querySelectorAll('[data-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.player;
      const delta = parseInt(btn.dataset.step, 10);
      const d = activeRoundDraft[id];
      d.sum = Math.max(0, (d.sum || 0) + delta);
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-sum]').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.sum;
      const val = parseInt(input.value, 10);
      activeRoundDraft[id].sum = isNaN(val) ? 0 : Math.max(0, val);
      updatePreviewOnly(id);
      renderPlayerTabs();
    });
  });

  container.querySelectorAll('[data-mod]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.player;
      const val = parseInt(btn.dataset.mod, 10);
      const d = activeRoundDraft[id];
      const idx = d.modifiers.indexOf(val);
      if (idx >= 0) d.modifiers.splice(idx, 1); else d.modifiers.push(val);
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-x2]').forEach(sw => {
    sw.addEventListener('click', () => {
      const id = sw.dataset.x2;
      activeRoundDraft[id].x2 = !activeRoundDraft[id].x2;
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-bonus]').forEach(sw => {
    sw.addEventListener('click', () => {
      const id = sw.dataset.bonus;
      activeRoundDraft[id].bonus = !activeRoundDraft[id].bonus;
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-zero]').forEach(sw => {
    sw.addEventListener('click', () => {
      const id = sw.dataset.zero;
      activeRoundDraft[id].zero = !activeRoundDraft[id].zero;
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-divide2]').forEach(sw => {
    sw.addEventListener('click', () => {
      const id = sw.dataset.divide2;
      activeRoundDraft[id].divide2 = !activeRoundDraft[id].divide2;
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-negmod]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.player;
      const val = parseInt(btn.dataset.negmod, 10);
      const d = activeRoundDraft[id];
      const idx = d.negModifiers.indexOf(val);
      if (idx >= 0) d.negModifiers.splice(idx, 1); else d.negModifiers.push(val);
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-bonus-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.player;
      const d = activeRoundDraft[id];
      d.bonusChoice = btn.dataset.bonusChoice;
      if (d.bonusChoice === 'steal' && !d.bonusTarget) {
        const other = state.players.find(o => o.id !== id);
        d.bonusTarget = other ? other.id : null;
      }
      updateFormPartial(id);
    });
  });

  container.querySelectorAll('[data-bonus-target]').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = sel.dataset.bonusTarget;
      activeRoundDraft[id].bonusTarget = sel.value;
      updatePreviewOnly(id);
    });
  });
}

function updateFormPartial(playerId) {
  renderScoreForms();
  renderPlayerTabs();
}

function updatePreviewOnly(playerId) {
  const preview = document.querySelector(`[data-preview="${playerId}"]`);
  if (preview) preview.textContent = calcEntryTotal(activeRoundDraft[playerId]);
}

function saveRound() {
  const scores = {};
  Object.keys(activeRoundDraft).forEach(id => {
    const d = activeRoundDraft[id];
    const stealsBonus = !d.bust && d.bonus && state.brutalMode && d.bonusChoice === 'steal' && d.bonusTarget;
    scores[id] = {
      sum: d.sum || 0,
      x2: !!d.x2,
      modifiers: [...d.modifiers],
      negModifiers: [...(d.negModifiers || [])],
      zero: !!d.zero,
      divide2: !!d.divide2,
      bonus: !!d.bonus,
      bonusChoice: d.bonusChoice || 'self',
      bonusTarget: stealsBonus ? d.bonusTarget : null,
      bust: !!d.bust,
      total: calcEntryTotal(d),
    };
  });

  // Gestohlene Flip-7-Boni: 15 Punkte werden dem Zielspieler abgezogen (nur Brutal Mode)
  Object.values(scores).forEach(entry => {
    if (entry.bonusTarget && scores[entry.bonusTarget]) {
      scores[entry.bonusTarget].total -= 15;
    }
  });

  state.rounds.push({ scores, timestamp: Date.now() });
  closeRoundModal();
  render();

  // Flip-Animation für alle Spieler
  state.players.forEach(p => flipScoreAnimation(p.id));

  checkForWinner();
}

function checkForWinner() {
  const withTotals = state.players.map(p => ({ ...p, total: totalFor(p.id) }));
  const qualifiers = withTotals.filter(p => p.total >= state.targetScore);
  if (qualifiers.length === 0) return;
  qualifiers.sort((a, b) => b.total - a.total);
  const winner = qualifiers[0];
  const topScore = winner.total;
  const tiedLeaders = qualifiers.filter(p => p.total === topScore);

  document.getElementById('winner-name').textContent =
    tiedLeaders.length > 1 ? tiedLeaders.map(p => p.name).join(' & ') : winner.name;
  document.getElementById('winner-score').textContent = topScore;
  document.getElementById('winner-overlay').hidden = false;
}

/* ---------------- History ---------------- */

function renderHistory() {
  const container = document.getElementById('history-content');
  if (state.rounds.length === 0) {
    container.innerHTML = '<div class="history-empty">Noch keine Runden gespielt.</div>';
    return;
  }
  const playerById = Object.fromEntries(state.players.map(p => [p.id, p.name]));
  container.innerHTML = state.rounds.map((round, i) => {
    const stolenFrom = {};
    Object.values(round.scores).forEach(s => {
      if (s.bonusTarget) stolenFrom[s.bonusTarget] = (stolenFrom[s.bonusTarget] || 0) + 15;
    });
    const rows = Object.entries(round.scores).map(([pid, s]) => {
      const name = playerById[pid] || '(entfernt)';
      let breakdown;
      if (s.bust) {
        breakdown = 'Bust';
      } else if (s.zero) {
        breakdown = s.bonus ? 'Null-Karte · +15 Flip7' : 'Null-Karte';
      } else {
        const parts = [`${s.sum} Zahlen`];
        if (s.x2) parts.push('×2');
        if (s.divide2) parts.push('÷2');
        if (s.modifiers && s.modifiers.length) parts.push(`+${s.modifiers.reduce((a, b) => a + b, 0)} Mod.`);
        if (s.negModifiers && s.negModifiers.length) parts.push(`−${s.negModifiers.reduce((a, b) => a + b, 0)} Mod.`);
        if (s.bonus && s.bonusTarget) parts.push('Flip7-Bonus abgegeben');
        else if (s.bonus) parts.push('+15 Flip7');
        breakdown = parts.join(' · ');
      }
      if (stolenFrom[pid]) {
        breakdown += (breakdown ? ' · ' : '') + `−${stolenFrom[pid]} (Bonus gestohlen)`;
      }
      return `
        <div class="history-row">
          <div>
            <div>${escapeHtml(name)}</div>
            <div class="breakdown">${breakdown}</div>
          </div>
          <div class="val ${s.bust ? 'bust' : ''}">${s.total}</div>
        </div>
      `;
    }).join('');
    return `
      <div class="history-round">
        <div class="history-round-header"><span>Runde ${i + 1}</span></div>
        ${rows}
      </div>
    `;
  }).reverse().join('');
}

function renderRulesetPicker() {
  document.querySelectorAll('#ruleset-picker [data-ruleset]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ruleset === state.ruleset);
  });
  document.getElementById('ruleset-hint').textContent = RULESET_HINTS[state.ruleset];
}

function renderBrutalModeSwitch() {
  const sw = document.getElementById('brutal-mode-switch');
  const row = document.getElementById('brutal-mode-row');
  sw.classList.toggle('on', state.brutalMode);
  const disabled = state.ruleset === 'classic';
  row.style.opacity = disabled ? '0.4' : '1';
  row.style.pointerEvents = disabled ? 'none' : 'auto';
}

/* ---------------- Wiring ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('target-value').textContent = state.targetScore;

  document.getElementById('btn-new-round').addEventListener('click', openRoundModal);
  document.getElementById('close-round-modal').addEventListener('click', closeRoundModal);
  document.getElementById('close-round-modal-2').addEventListener('click', closeRoundModal);
  document.getElementById('btn-save-round').addEventListener('click', saveRound);

  document.getElementById('btn-players').addEventListener('click', () => {
    renderPlayerList();
    document.getElementById('players-modal').hidden = false;
  });
  document.getElementById('close-players-modal').addEventListener('click', () => {
    document.getElementById('players-modal').hidden = true;
  });
  document.getElementById('btn-empty-add').addEventListener('click', () => {
    renderPlayerList();
    document.getElementById('players-modal').hidden = false;
    document.getElementById('new-player-name').focus();
  });
  document.getElementById('btn-add-player').addEventListener('click', () => {
    const input = document.getElementById('new-player-name');
    addPlayer(input.value);
    input.value = '';
    input.focus();
  });
  document.getElementById('new-player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-add-player').click();
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    if (!confirm('Neues Spiel starten? Alle Spieler und Runden werden gelöscht.')) return;
    state = { players: [], rounds: [], targetScore: state.targetScore, nextPlayerId: 1 };
    render();
    renderPlayerList();
    document.getElementById('players-modal').hidden = true;
    showToast('Neues Spiel gestartet');
  });

  document.getElementById('btn-history').addEventListener('click', () => {
    renderHistory();
    document.getElementById('history-modal').hidden = false;
  });
  document.getElementById('close-history-modal').addEventListener('click', () => {
    document.getElementById('history-modal').hidden = true;
  });

  function openSettingsModal() {
    document.getElementById('target-input').value = state.targetScore;
    renderRulesetPicker();
    renderBrutalModeSwitch();
    document.getElementById('target-modal').hidden = false;
  }
  document.getElementById('btn-edit-target').addEventListener('click', openSettingsModal);
  document.getElementById('btn-settings').addEventListener('click', openSettingsModal);

  document.getElementById('close-target-modal').addEventListener('click', () => {
    document.getElementById('target-modal').hidden = true;
  });
  document.getElementById('btn-save-target').addEventListener('click', () => {
    const val = parseInt(document.getElementById('target-input').value, 10);
    if (!isNaN(val) && val > 0) {
      state.targetScore = val;
      document.getElementById('target-value').textContent = val;
      render();
    }
    document.getElementById('target-modal').hidden = true;
  });

  document.getElementById('ruleset-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ruleset]');
    if (!btn) return;
    state.ruleset = btn.dataset.ruleset;
    if (state.ruleset === 'classic') state.brutalMode = false;
    renderRulesetPicker();
    renderBrutalModeSwitch();
    render();
  });

  document.getElementById('brutal-mode-switch').addEventListener('click', () => {
    if (state.ruleset === 'classic') return;
    state.brutalMode = !state.brutalMode;
    renderBrutalModeSwitch();
    render();
  });

  document.getElementById('btn-winner-close').addEventListener('click', () => {
    document.getElementById('winner-overlay').hidden = true;
  });

  // Klick auf Overlay schließt Modal (außer Winner-Overlay: bewusst erzwungene Bestätigung)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'winner-overlay') {
        overlay.hidden = true;
        if (overlay.id === 'round-modal') activeRoundDraft = null;
      }
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
});
