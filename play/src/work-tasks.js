// =============================================
// WORK TASKS — jobs are DOING things, not answering quiz questions.
//
// Every job has 4 tasks (one per glowing pad in places.js), and every task is a little hands-on mini-game:
//   ⏱️ timing   press STOP when the marker is in the green zone (scanning, chopping, braking...)   — 2 of 3 rounds
//   👆 mash     click as fast as you can before time runs out (unpacking, stirring, loading...)
//   🗂️ sort     pick an item, then the right bin (bagging shopping, recycling, sorting post...)
//   🔢 count    count the things you see (cash, parts, pastries...)
//   🧑‍🍳 recipe   put together the order from the ingredients/tools (a latte, a dish, a prescription...)
//   🔍 defect   find the odd one out (a wrong price tag, a bug, a broken bone...) — 2 tries
//   🧽 wipe     clean up all the spots before the time runs out
//   🔢 seq      tap the numbers in order, fast (filing, routes, reports...)
//   💵 change   give the customer exactly the right change
//
// runWorkTask(job, index, onDone) is called by life.js when you reach a pad; onDone(true/false) says if you did it.
// Pay, promotions and firing stay in life.js (a task done = one point, 4 per shift).
// =============================================

// ---- task builders ----
const wtTiming = (label, icon, verb) => ({ label, kind: 'timing', icon, verb });
const wtMash   = (label, icon, need, secs) => ({ label, kind: 'mash', icon, need, secs });
const wtSort   = (label, bins, items) => ({ label, kind: 'sort', bins, items });
const wtCount  = (label, emoji) => ({ label, kind: 'count', emoji });
const wtRecipe = (label, target, pool) => ({ label, kind: 'recipe', target, pool });
const wtDefect = (label, good, bad) => ({ label, kind: 'defect', good, bad });
const wtWipe   = (label, icon) => ({ label, kind: 'wipe', icon });
const wtSeq    = (label, icon) => ({ label, kind: 'seq', icon });
const wtChange = (label) => ({ label, kind: 'change' });

const WT_COFFEE_POOL = ['☕', '🥛', '🍫', '🍋', '🧊', '🍯', '🍓', '🥤'];
const WT_TOOL_POOL = ['⚙️', '🔩', '🔧', '🪛', '🔌', '🧱', '🔋', '💡'];

const WORK_GAMES = {
    cashier: [wtTiming('Scan the customer\'s groceries', '🛒', 'Scan'), wtChange('Give the right change'),
              wtSort('Bag the shopping', [['cold', '❄️', 'Cold bag'], ['dry', '🛍️', 'Dry bag']], [['🥛', 'cold'], ['🍦', 'cold'], ['🥩', 'cold'], ['🍞', 'dry'], ['🥫', 'dry'], ['🍝', 'dry']]),
              wtDefect('Spot the wrong price tag', '🏷️', '🔖')],
    stocker: [wtMash('Unpack a box of cans', '📦', 14, 5),
              wtSort('Fill the right shelves', [['cold', '❄️', 'Cooler'], ['dry', '🗄️', 'Shelf']], [['🥛', 'cold'], ['🧈', 'cold'], ['🧀', 'cold'], ['🥣', 'dry'], ['🍪', 'dry'], ['🥫', 'dry']]),
              wtDefect('Find the crooked label', '🏷️', '📎'), wtCount('Count the cereal boxes', '🥣')],
    barista: [wtRecipe('Make a latte', ['☕', '🥛'], WT_COFFEE_POOL), wtRecipe('Make a mocha', ['☕', '🥛', '🍫'], WT_COFFEE_POOL),
              wtCount('Count the pastries', '🥐'), wtWipe('Clean the coffee machine', '🫧')],
    janitor: [wtWipe('Mop the lobby floor', '💦'),
              wtSort('Empty the bins', [['rec', '♻️', 'Recycling'], ['bin', '🗑️', 'Rubbish']], [['🍾', 'rec'], ['📰', 'rec'], ['🥫', 'rec'], ['🍌', 'bin'], ['🧻', 'bin'], ['🍕', 'bin']]),
              wtWipe('Wash the windows', '🧽'), wtMash('Refill the soap', '🧴', 12, 5)],
    delivery: [wtMash('Load the van', '📦', 15, 5), wtSeq('Check the parcel list', '📦'), wtSeq('Plan the route', '📍'), wtTiming('Sign for a delivery', '✍️', 'Sign')],
    reception: [wtTiming('Answer the phone', '☎️', 'Pick up'),
                wtSort('Sort the post', [['let', '✉️', 'Letters'], ['par', '📦', 'Parcels']], [['✉️', 'let'], ['💌', 'let'], ['📬', 'let'], ['📦', 'par'], ['🎁', 'par'], ['🧳', 'par']]),
                wtSeq('Book a meeting room', '🗓️'), wtDefect('Find the visitor\'s badge', '🪪', '📛')],
    chef: [wtTiming('Chop the vegetables', '🥕', 'Chop'), wtMash('Stir the soup', '🥄', 16, 5), wtTiming('Check the oven', '🔥', 'Check'),
           wtRecipe('Plate a dish', ['🍝', '🍅', '🌿'], ['🍝', '🍅', '🌿', '🍟', '🍰', '🥩', '🍋', '🧀'])],
    mechanic: [wtMash('Change a tyre', '🛞', 16, 5), wtRecipe('Pick the tools for an oil change', ['🛢️', '🔧'], ['🛢️', '🔧', '🔨', '🪛', '🧪', '🔦', '🧰', '🪜']),
               wtTiming('Test the brakes', '🛑', 'Brake'), wtCount('Count the spare parts for the bill', '🔩')],
    police: [wtSeq('Fill in a report', '📝'), wtDefect('Spot the suspect in the lineup', '🧍', '🕵️'),
             wtSort('Sort the found items', [['keep', '🔒', 'Evidence'], ['ret', '↩️', 'Lost property']], [['🔪', 'keep'], ['👛', 'ret'], ['🧤', 'keep'], ['📱', 'ret'], ['🔑', 'ret'], ['🪙', 'keep']]),
             wtSeq('Study the town map', '🗺️')],
    teacher: [wtTiming('Write on the board', '🖊️', 'Write'), wtDefect('Find the mistake in a student\'s work', '📝', '❌'),
              wtSort('Hand back the tests', [['a', '🅰️', 'Great'], ['b', '🅱️', 'Needs work']], [['💯', 'a'], ['⭐', 'a'], ['😊', 'a'], ['📉', 'b'], ['😟', 'b'], ['❓', 'b']]),
              wtMash('Mark the tests', '✅', 14, 5)],
    designer: [wtRecipe('Pick the colours', ['🔴', '🔵', '🟡'], ['🔴', '🔵', '🟡', '🟢', '🟣', '⚫', '🟤', '🟠']), wtSeq('Fix the layout', '🖼️'),
               wtTiming('Sketch a poster', '✏️', 'Draw'), wtDefect('Spot the flaw in the design', '🖼️', '🔳')],
    accountant: [wtCount('Add up the receipts', '🧾'), wtChange('Balance the cash'),
                 wtSort('File the invoices', [['in', '📥', 'Money in'], ['out', '📤', 'Money out']], [['💰', 'in'], ['💵', 'in'], ['🏦', 'in'], ['🧾', 'out'], ['🏠', 'out'], ['⚡', 'out']]),
                 wtDefect('Find the error in the budget', '🧮', '🧩')],
    scientist: [wtRecipe('Mix the samples', ['🧪', '💧', '🔥'], ['🧪', '💧', '🔥', '🧊', '🧂', '🌿', '🧫', '⚗️']), wtTiming('Look in the microscope', '🔬', 'Focus'),
                wtSeq('Write down the results', '🧫'), wtDefect('Find the odd sample', '🧫', '🦠')],
    engineer: [wtSeq('Read the blueprint', '📐'), wtMash('Test the model', '⚙️', 15, 5), wtCount('Measure the parts', '🔩'),
               wtRecipe('Pick the right parts', ['⚙️', '🔩'], WT_TOOL_POOL)],
    programmer: [wtDefect('Find the bug in the code', '💻', '🐛'), wtTiming('Write a function', '⌨️', 'Type'), wtSeq('Test the program', '🧪'),
                 wtDefect('Find the typo in the code review', '📄', '📃')],
    lawyer: [wtSort('Read the contract', [['ok', '✅', 'Fair'], ['bad', '⚠️', 'Unfair']], [['🤝', 'ok'], ['📜', 'ok'], ['⚖️', 'ok'], ['🪤', 'bad'], ['💸', 'bad'], ['🕳️', 'bad']]),
             wtSeq('Prepare the case', '📁'), wtTiming('Meet a client', '🤝', 'Greet'), wtDefect('Find the wrong law book', '📕', '📙')],
    doctor: [wtTiming('Check a patient', '🩺', 'Listen'), wtDefect('Read the X-ray: spot the break', '🦴', '💥'),
             wtRecipe('Write a prescription', ['💊', '💉'], ['💊', '💉', '🩹', '🌡️', '🧴', '🍬', '🩺', '🧪']),
             wtSort('Visit the ward', [['ok', '😊', 'Doing fine'], ['help', '🚑', 'Needs help']], [['🙂', 'ok'], ['😴', 'ok'], ['🤒', 'help'], ['😷', 'help'], ['😊', 'ok'], ['🤕', 'help']])]
};

// The labels shown on the HUD and in the panel (places.js / life.js read this)
const JOB_TASKS = {};
Object.keys(WORK_GAMES).forEach(id => { JOB_TASKS[id] = WORK_GAMES[id].map(t => t.label); });

// ---------------------------------------------
// the runner
// ---------------------------------------------
let workTask = null;           // the task being played: { timers: [], finished }

function wtClear() {
    if (workTask) { workTask.timers.forEach(t => { clearInterval(t); clearTimeout(t); }); workTask.timers = []; }
}
function wtEnd() { wtClear(); workTask = null; }
function wtShuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function wtRand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
const wtB = (onclick, text, color, extra) => `<button onclick="${onclick}" style="margin:3px; padding:9px 14px; border:none; border-radius:10px; font-size:1.05em; font-weight:bold; cursor:pointer; color:white; background:${color || '#0f3460'}; ${extra || ''}">${text}</button>`;
const wtCell = 'display:inline-block; min-width:46px; padding:6px; margin:3px; border-radius:10px; font-size:1.7em; cursor:pointer; user-select:none;';

function runWorkTask(job, index, onDone) {
    wtEnd();
    const g = WORK_GAMES[job.id] && WORK_GAMES[job.id][index];
    if (!g) { onDone(true); return; }
    workTask = { timers: [], finished: false, g, onDone };
    lifePanel(`
        <div style="text-align:center;">
            <p style="color:#aaa; margin-bottom:2px;">${job.emoji} ${jobTitle()} · task ${index + 1} of 4 · ✅ ${shift ? shift.correct : 0}</p>
            <h3 style="color:#FFD700; margin-bottom:6px;">${g.label}</h3>
            <div id="wt-hint" style="color:#9ab; font-size:0.85em; margin-bottom:6px;"></div>
            <div id="wt-body"></div>
            <div id="wt-msg" style="min-height:1.4em; margin-top:6px; font-weight:bold;"></div>
        </div>`, '#f39c12');
    const body = document.getElementById('wt-body'), hint = document.getElementById('wt-hint');
    ({ timing: wtStartTiming, mash: wtStartMash, sort: wtStartSort, count: wtStartCount, recipe: wtStartRecipe, defect: wtStartDefect,
       wipe: wtStartWipe, seq: wtStartSeq, change: wtStartChange })[g.kind](g, body, hint);
}

function wtFinish(ok) {
    const t = workTask;
    if (!t || t.finished) return;
    t.finished = true;
    wtClear();
    const msg = document.getElementById('wt-msg');
    if (msg) { msg.style.color = ok ? '#2ecc71' : '#e67e22'; msg.textContent = ok ? (t.okMsg || '✅ Nicely done!') : (t.failMsg || '❌ Not quite — the boss sighs.'); }      // (lecture-tasks.js sets its own messages)
    t.timers.push(setTimeout(() => { const cb = t.onDone; workTask = null; cb(ok); }, 900));
}

// ---- ⏱️ timing: stop the marker in the green zone, 3 rounds, 2 hits to pass ----
function wtStartTiming(g, body, hint) {
    const t = workTask; t.round = 0; t.hits = 0;
    function newRound() {
        t.round++;
        if (t.round > 3) { wtFinish(t.hits >= 2); return; }
        const w = 26, z0 = wtRand(8, 100 - w - 8);
        t.pos = 0; t.dir = 1; t.speed = 1.2 + t.round * 0.25; t.zone = [z0, z0 + w];
        hint.textContent = `Round ${t.round} of 3 — press ${g.verb} when the marker is in the green zone!  (hits: ${t.hits})`;
        body.innerHTML = `<div style="font-size:2.2em;">${g.icon}</div>
            <div style="position:relative; height:28px; background:#2c3e50; border-radius:14px; margin:8px 0; overflow:hidden;">
                <div style="position:absolute; left:${z0}%; width:${w}%; top:0; bottom:0; background:#27ae60;"></div>
                <div id="wt-mark" style="position:absolute; left:0; top:0; bottom:0; width:10px; background:#FFD700; border-radius:5px;"></div></div>
            ${wtB('wtTimingStop()', '✋ ' + g.verb + '!', '#c0392b', 'font-size:1.2em; padding:10px 28px;')}`;
        t.timers.push(setInterval(() => {
            t.pos += t.dir * t.speed;
            if (t.pos >= 98) { t.pos = 98; t.dir = -1; } else if (t.pos <= 0) { t.pos = 0; t.dir = 1; }
            const m = document.getElementById('wt-mark'); if (m) m.style.left = t.pos + '%';
        }, 16));
    }
    t.newRound = newRound;
    newRound();
}
function wtTimingStop() {
    const t = workTask; if (!t || t.finished || !t.zone) return;
    clearInterval(t.timers.pop());
    const hit = t.pos + 5 >= t.zone[0] && t.pos <= t.zone[1];
    if (hit) t.hits++;
    const msg = document.getElementById('wt-msg');
    if (msg) { msg.style.color = hit ? '#2ecc71' : '#e67e22'; msg.textContent = hit ? '🎯 Perfect!' : '💨 Missed it!'; }
    t.zone = null;
    t.timers.push(setTimeout(() => { if (msg) msg.textContent = ''; t.newRound(); }, 600));
}

// ---- 👆 mash: click fast ----
function wtStartMash(g, body, hint) {
    const t = workTask; t.clicks = 0; t.started = false;
    hint.textContent = `Click ${g.icon} ${g.need} times in ${g.secs} seconds! (the clock starts on your first click)`;
    body.innerHTML = `<div style="height:16px; background:#2c3e50; border-radius:8px; overflow:hidden; margin:6px 0;"><div id="wt-prog" style="height:100%; width:0; background:#27ae60;"></div></div>
        <div style="height:6px; background:#2c3e50; border-radius:3px; overflow:hidden; margin-bottom:8px;"><div id="wt-time" style="height:100%; width:100%; background:#e67e22;"></div></div>
        <button onclick="wtMashClick()" style="font-size:3em; padding:10px 40px; border:none; border-radius:16px; background:#0f3460; cursor:pointer;">${g.icon}</button>`;
}
function wtMashClick() {
    const t = workTask; if (!t || t.finished) return;
    const g = t.g;
    if (!t.started) {
        t.started = true; const t0 = Date.now();
        t.timers.push(setInterval(() => {
            const left = 1 - (Date.now() - t0) / (g.secs * 1000);
            const el = document.getElementById('wt-time'); if (el) el.style.width = Math.max(0, left * 100) + '%';
            if (left <= 0) wtFinish(t.clicks >= g.need);
        }, 50));
    }
    t.clicks++;
    const p = document.getElementById('wt-prog'); if (p) p.style.width = Math.min(100, t.clicks / g.need * 100) + '%';
    if (t.clicks >= g.need) wtFinish(true);
}

// ---- 🗂️ sort: choose an item, then its bin ----
function wtStartSort(g, body, hint) {
    const t = workTask; t.items = wtShuffle(g.items).map(([e, k], i) => ({ e, k, i, done: false })); t.sel = null; t.mistakes = 0;
    hint.textContent = 'Click an item, then click the bin it belongs in. (Max 1 mistake)';
    wtRenderSort();
}
function wtRenderSort() {
    const t = workTask; if (!t) return;
    const g = t.g, body = document.getElementById('wt-body'); if (!body) return;
    body.innerHTML = `<div>${t.items.map(it => it.done ? '' : `<span onclick="wtSortPick(${it.i})" style="${wtCell} background:${t.sel === it.i ? '#f39c12' : '#0f3460'};">${it.e}</span>`).join('')}</div>
        <div style="margin-top:6px;">${g.bins.map(([k, e, n]) => wtB(`wtSortBin('${k}')`, `${e} ${n}`, '#8e44ad')).join('')}</div>
        <div style="color:#aaa; font-size:0.85em;">Mistakes: ${t.mistakes}</div>`;
}
function wtSortPick(i) { const t = workTask; if (!t || t.finished) return; t.sel = i; wtRenderSort(); }
function wtSortBin(k) {
    const t = workTask; if (!t || t.finished || t.sel === null) return;
    const it = t.items.find(x => x.i === t.sel);
    if (it.k === k) it.done = true; else t.mistakes++;
    t.sel = null;
    if (t.mistakes > 1) { wtRenderSort(); wtFinish(false); return; }
    if (t.items.every(x => x.done)) { wtRenderSort(); wtFinish(true); return; }
    wtRenderSort();
}

// ---- 🔢 count ----
function wtStartCount(g, body, hint) {
    const t = workTask; t.n = wtRand(6, 13); t.guess = 0;
    hint.textContent = `How many ${g.emoji} are there? Count carefully, then press Confirm.`;
    const spots = Array.from({ length: t.n }, () => `<span style="display:inline-block; font-size:1.8em; margin:${wtRand(2, 10)}px ${wtRand(4, 16)}px; transform:rotate(${wtRand(-25, 25)}deg);">${g.emoji}</span>`).join('');
    body.innerHTML = `<div style="background:#0f3460; border-radius:12px; padding:6px; margin-bottom:8px; line-height:1.2;">${spots}</div>
        ${wtB('wtCountAdj(-1)', '➖', '#555')} <span id="wt-guess" style="font-size:1.8em; color:#fff; display:inline-block; min-width:50px;">0</span> ${wtB('wtCountAdj(1)', '➕', '#555')}
        ${wtB('wtCountDone()', '✔️ Confirm', '#27ae60')}`;
}
function wtCountAdj(d) { const t = workTask; if (!t || t.finished) return; t.guess = Math.max(0, Math.min(30, t.guess + d)); document.getElementById('wt-guess').textContent = t.guess; }
function wtCountDone() { const t = workTask; if (!t || t.finished) return; wtFinish(t.guess === t.n); }

// ---- 🧑‍🍳 recipe: put together the order ----
function wtStartRecipe(g, body, hint) {
    const t = workTask; t.tray = [];
    t.pool = wtShuffle(g.pool);
    hint.innerHTML = `Order: <b style="font-size:1.4em;">${g.target.join(' + ')}</b> — click the right things, then Serve!`;
    wtRenderRecipe();
}
function wtRenderRecipe() {
    const t = workTask; if (!t) return;
    const body = document.getElementById('wt-body'); if (!body) return;
    body.innerHTML = `<div style="min-height:50px; background:#0f3460; border-radius:12px; padding:4px; margin-bottom:6px; font-size:1.8em;">${t.tray.map(e => `<span style="margin:0 4px;">${e}</span>`).join('') || '<span style="color:#678; font-size:0.5em;">Your tray is empty</span>'}</div>
        <div>${t.pool.map((e, i) => `<span onclick="wtRecipeAdd(${i})" style="${wtCell} background:#16324f; border:2px solid #3498db;">${e}</span>`).join('')}</div>
        ${wtB('wtRecipeClear()', '↩️ Clear', '#555')} ${wtB('wtRecipeServe()', '🍽️ Serve', '#27ae60')}`;
}
function wtRecipeAdd(i) { const t = workTask; if (!t || t.finished || t.tray.length >= 6) return; t.tray.push(t.pool[i]); wtRenderRecipe(); }
function wtRecipeClear() { const t = workTask; if (!t || t.finished) return; t.tray = []; wtRenderRecipe(); }
function wtRecipeServe() {
    const t = workTask; if (!t || t.finished) return;
    const a = t.tray.slice().sort().join(''), b = t.g.target.slice().sort().join('');
    wtFinish(a === b);
}

// ---- 🔍 defect: find the odd one out ----
function wtStartDefect(g, body, hint) {
    const t = workTask; t.tries = 2; t.odd = wtRand(0, 15);
    hint.textContent = `One of these is different — find it! (${t.tries} tries)`;
    body.innerHTML = `<div style="max-width:340px; margin:0 auto;">${Array.from({ length: 16 }, (_, i) => `<span id="wt-d${i}" onclick="wtDefectPick(${i})" style="${wtCell} background:#0f3460;">${i === t.odd ? g.bad : g.good}</span>`).join('')}</div>`;
}
function wtDefectPick(i) {
    const t = workTask; if (!t || t.finished) return;
    if (i === t.odd) { document.getElementById('wt-d' + i).style.background = '#27ae60'; wtFinish(true); return; }
    t.tries--;
    document.getElementById('wt-d' + i).style.background = '#7f2a2a';
    const hint = document.getElementById('wt-hint'); if (hint) hint.textContent = `Not that one! (${t.tries} ${t.tries === 1 ? 'try' : 'tries'} left)`;
    if (t.tries <= 0) { document.getElementById('wt-d' + t.odd).style.background = '#27ae60'; wtFinish(false); }
}

// ---- 🧽 wipe: clear every spot before time runs out ----
function wtStartWipe(g, body, hint) {
    const t = workTask; t.left = 10; t.secs = 8;
    hint.textContent = `Click all the dirty spots ${g.icon} before the time is up!`;
    const spots = wtShuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, t.left);
    body.innerHTML = `<div style="height:6px; background:#2c3e50; border-radius:3px; overflow:hidden; margin-bottom:8px;"><div id="wt-time" style="height:100%; width:100%; background:#e67e22;"></div></div>
        <div style="max-width:330px; margin:0 auto;">${Array.from({ length: 12 }, (_, i) => spots.includes(i)
            ? `<span id="wt-w${i}" onclick="wtWipeClick(${i})" style="${wtCell} background:#6d5a3a;">${g.icon}</span>`
            : `<span style="${wtCell} background:#16324f; opacity:0.5;">✨</span>`).join('')}</div>`;
    const t0 = Date.now();
    t.timers.push(setInterval(() => {
        const left = 1 - (Date.now() - t0) / (t.secs * 1000);
        const el = document.getElementById('wt-time'); if (el) el.style.width = Math.max(0, left * 100) + '%';
        if (left <= 0) wtFinish(false);
    }, 50));
}
function wtWipeClick(i) {
    const t = workTask; if (!t || t.finished) return;
    const el = document.getElementById('wt-w' + i); if (!el || el.dataset.done) return;
    el.dataset.done = 1; el.innerHTML = '✨'; el.style.background = '#16324f'; el.style.opacity = 0.5;
    t.left--;
    if (t.left <= 0) wtFinish(true);
}

// ---- 🔢 seq: tap the numbers in order ----
function wtStartSeq(g, body, hint) {
    const t = workTask; t.next = 1; t.secs = 9;
    hint.textContent = `Tap ${g.icon} 1, 2, 3 ... 6 in order, as fast as you can!`;
    body.innerHTML = `<div style="height:6px; background:#2c3e50; border-radius:3px; overflow:hidden; margin-bottom:8px;"><div id="wt-time" style="height:100%; width:100%; background:#e67e22;"></div></div>
        <div style="max-width:330px; margin:0 auto;">${wtShuffle([1, 2, 3, 4, 5, 6]).map(n => `<span id="wt-s${n}" onclick="wtSeqClick(${n})" style="${wtCell} background:#0f3460; min-width:70px;">${g.icon}<b style="font-size:0.6em; color:#FFD700;"> ${n}</b></span>`).join('')}</div>`;
    const t0 = Date.now();
    t.timers.push(setInterval(() => {
        const left = 1 - (Date.now() - t0) / (t.secs * 1000);
        const el = document.getElementById('wt-time'); if (el) el.style.width = Math.max(0, left * 100) + '%';
        if (left <= 0) wtFinish(false);
    }, 50));
}
function wtSeqClick(n) {
    const t = workTask; if (!t || t.finished) return;
    if (n !== t.next) { const el = document.getElementById('wt-s' + n); if (el) { el.style.background = '#7f2a2a'; setTimeout(() => { if (el && !el.dataset.done) el.style.background = '#0f3460'; }, 300); } return; }
    const el = document.getElementById('wt-s' + n); el.dataset.done = 1; el.style.background = '#27ae60'; el.style.opacity = 0.6;
    t.next++;
    if (t.next > 6) wtFinish(true);
}

// ---- 💵 change: give exactly the right change ----
function wtStartChange(g, body, hint) {
    const t = workTask;
    const total = wtRand(3, 17), paid = [5, 10, 20].find(p => p > total + 1) || 20;
    t.want = paid - total; t.have = 0; t.given = [];
    hint.innerHTML = `The customer's bill is <b>$${total}</b> and they pay with <b>$${paid}</b>. Give back the exact change!`;
    body.innerHTML = `<div style="font-size:1.8em; color:#fff; margin-bottom:6px;">💵 Change given: <b id="wt-have">$0</b></div>
        ${[1, 2, 5, 10].map(v => wtB(`wtChangeAdd(${v})`, '$' + v, '#16324f', 'border:2px solid #27ae60;')).join('')}
        <div style="margin-top:4px;">${wtB('wtChangeReset()', '↩️ Reset', '#555')} ${wtB('wtChangeGive()', '🤝 Give change', '#27ae60')}</div>`;
}
function wtChangeAdd(v) { const t = workTask; if (!t || t.finished) return; t.have += v; document.getElementById('wt-have').textContent = '$' + t.have; }
function wtChangeReset() { const t = workTask; if (!t || t.finished) return; t.have = 0; document.getElementById('wt-have').textContent = '$0'; }
function wtChangeGive() { const t = workTask; if (!t || t.finished) return; wtFinish(t.have === t.want); }
