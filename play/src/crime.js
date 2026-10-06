// =============================================
// CRIME — a city has crime (kid-friendly: shoplifting, pickpockets, stolen bikes,
// graffiti — never anything violent). It happens in a few places, and ONLY 1 IN
// 100 CRIMES HAPPENS AT YOUR SCHOOL:
//
//     🏫 school 1%   🛒 grocery store 24%   🛍️ mall 30%   🏘️ streets 45%
//
//   * Every day there's a 45% chance something happens somewhere in the city. The place
//     is picked using the percentages above, and counted in the city's crime report.
//   * You only SEE it if you happen to be in that place that day (so you'll almost never
//     see one at school). When you do, you choose what to do:
//        📣 tell a grown-up right away      (safe — 70% the police catch them)
//        🧠 stay back, remember, tell police (safe — 85% caught, takes longer)
//        🙈 do nothing                        (you feel bad about it)
//     (There's never a "chase them" choice — you never chase a criminal. Tell a grown-up!)
//   * Sometimes YOU are the victim (a pickpocket takes some of your money, your lunch money
//     goes missing...). Reporting it can get your things back.
//   * 📰 News (home screen) shows the city's crime report: how many crimes, where, and how
//     many were solved — the percentages come out of the real counts.
//
// Rolled from advanceOneDay() in core.js; witnessed from the places you visit.
// =============================================

const CRIME_DAILY_CHANCE = 0.45;

const CRIME_PLACES = [
    { id: 'school',  name: 'Schools',                emoji: '🏫', weight: 1  },
    { id: 'grocery', name: 'Grocery stores',         emoji: '🛒', weight: 24 },
    { id: 'mall',    name: 'The mall',               emoji: '🛍️', weight: 30 },
    { id: 'street',  name: 'Streets & neighborhoods', emoji: '🏘️', weight: 45 }
];

const CRIME_TYPES = {
    school: [
        { emoji: '🎒', title: 'Missing lunch money', story: 'You notice a kid slipping something out of a classmate\'s backpack while the teacher is turned around. It looks like lunch money!', victim: 'Your lunch money is missing from your backpack!' },
        { emoji: '📱', title: 'A stolen tablet', story: 'Someone grabs a tablet off a desk and hides it in their bag when no one is looking.', victim: 'Your tablet is missing from your desk!' },
        { emoji: '🖍️', title: 'Graffiti in the hallway', story: 'A kid is scribbling on the hallway wall with a marker when no one is around.', victim: null }
    ],
    grocery: [
        { emoji: '🧥', title: 'Shoplifting', story: 'A man in a big coat looks around, then slips a few snacks inside it and heads for the door without paying.', victim: null },
        { emoji: '👛', title: 'A stolen purse', story: 'Someone reaches into a shopper\'s cart and takes a purse, then walks away quickly.', victim: 'Someone took your wallet from the cart!' },
        { emoji: '🛒', title: 'A cart of goods', story: 'A person pushes a full cart of groceries straight past the checkout lanes and out the door!', victim: null }
    ],
    mall: [
        { emoji: '👛', title: 'A pickpocket', story: 'A stranger bumps into a shopper and slips a wallet out of their pocket before they notice.', victim: 'You feel a bump — and your wallet is gone!' },
        { emoji: '🏃', title: 'Shoplifter running out', story: 'A person dashes out of a shop with something hidden under their jacket!', victim: null },
        { emoji: '🖌️', title: 'Graffiti', story: 'Someone is spray-painting a wall near the escalator.', victim: null },
        { emoji: '🛴', title: 'A stolen scooter', story: 'A person hops on a scooter that was left by the entrance and rides off with it.', victim: null }
    ],
    street: [
        { emoji: '📦', title: 'A stolen package', story: 'Someone picks up a package from a neighbor\'s porch and walks off with it.', victim: null },
        { emoji: '🚲', title: 'A stolen bike', story: 'A stranger cuts the lock on a bike outside a house and rides it away.', victim: 'Your bike is gone from the front yard!' },
        { emoji: '🖌️', title: 'Graffiti on a fence', story: 'Someone is spray-painting a neighbor\'s fence in the dark.', victim: null },
        { emoji: '🚗', title: 'A car break-in', story: 'A person is trying the doors of parked cars along the street, one after another.', victim: null }
    ]
};

const CRIME_TELL = {
    school: 'your teacher',
    grocery: 'the security guard',
    mall: 'a mall security guard',
    street: 'a grown-up'
};

let todaysCrime = null;      // what happened somewhere in the city today: { place, type, witnessed }

function crimeStats() {
    if (!player.crimeStats) player.crimeStats = { total: 0, school: 0, grocery: 0, mall: 0, street: 0, solved: 0, reported: 0 };
    return player.crimeStats;
}

function pickCrimePlace() {
    let r = Math.random() * CRIME_PLACES.reduce((s, p) => s + p.weight, 0);
    for (const p of CRIME_PLACES) { if ((r -= p.weight) < 0) return p.id; }
    return 'street';
}

// Every new day: maybe something happens in the city. (silent = the day passed while you were away.)
function rollDailyCrime(silent) {
    // An unseen crime stays "fresh" for 3 in-game days (a day is only 6 seconds at 1x, so a visit takes longer than a day)
    if (todaysCrime && --todaysCrime.daysLeft <= 0) todaysCrime = null;
    if (Math.random() >= CRIME_DAILY_CHANCE) return;
    const place = pickCrimePlace();
    const st = crimeStats();
    st.total++; st[place]++;
    const types = CRIME_TYPES[place];
    if (!silent) todaysCrime = { place, type: types[Math.floor(Math.random() * types.length)], witnessed: false, daysLeft: 3 };
}

function currentCrimePlace() {
    if (typeof inStore !== 'undefined' && inStore) return 'grocery';
    if (typeof mall3D !== 'undefined' && mall3D) return 'mall';
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D) return 'street';
    if (typeof inSchool !== 'undefined' && inSchool) return 'school';
    return null;
}

// Called a few seconds after you arrive somewhere: if today's crime happened HERE, you see it.
function maybeWitnessCrime(placeId, delayMs) {
    setTimeout(() => {
        if (!todaysCrime || todaysCrime.witnessed || todaysCrime.place !== placeId) return;
        if (currentCrimePlace() !== placeId) return;                  // you've already left
        if (document.getElementById('crime-overlay')) return;
        if (typeof otherPopupOpen === 'function' && otherPopupOpen()) { maybeWitnessCrime(placeId, 4000); return; }
        showCrimeScene();
    }, delayMs || 6000);
}

function crimeOverlay(html) {
    const old = document.getElementById('crime-overlay');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'crime-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:320; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.75); font-family:Arial; padding:14px; overflow-y:auto;`;
    el.innerHTML = `<div style="background:#16213e; border:3px solid #c0392b; border-radius:16px; padding:22px 28px; max-width:480px; width:100%; text-align:center;">${html}</div>`;
    document.body.appendChild(el);
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => { if (typeof keys !== 'undefined') keys[k] = false; });
}

function showCrimeScene() {
    const c = todaysCrime;
    c.witnessed = true;
    const t = c.type;
    const money = Math.min(player.money, 3 + Math.floor(Math.random() * 6));
    c.victim = !!(t.victim && Math.random() < 0.45);                    // sometimes it's YOU
    c.lost = c.victim ? money : 0;
    if (c.victim && c.lost > 0) { player.money -= c.lost; updateStats(); saveGame(); }
    const who = CRIME_TELL[c.place];
    const tell = c.victim ? `${who}` : who;
    const btn = (onclick, text, color) => `<button onclick="${onclick}" style="display:block; width:100%; margin:6px 0; padding:11px; border:none; border-radius:10px;
        font-size:1em; font-weight:bold; cursor:pointer; color:white; background:${color};">${text}</button>`;
    crimeOverlay(`
        <div style="font-size:3em;">${t.emoji} 🚨</div>
        <h2 style="color:#e74c3c; margin:6px 0;">${c.victim ? 'Oh no — it happened to YOU!' : 'You saw something wrong!'}</h2>
        <h3 style="color:#FFD700; margin-bottom:6px;">${t.title}</h3>
        <p style="color:#fff; line-height:1.5; margin-bottom:6px;">${c.victim ? t.victim + (c.lost ? ` <b style="color:#e74c3c">(-$${c.lost})</b>` : '') : t.story}</p>
        ${c.place === 'school' ? '<p style="color:#9ab; font-size:0.85em; margin-bottom:6px;">(Only about 1 in 100 crimes happens at school — you were unlucky to see one!)</p>' : ''}
        <p style="color:#aaa; margin-bottom:8px;">What do you do?</p>
        ${btn("resolveCrime('tell')", `📣 Tell ${tell} right away`, '#27ae60')}
        ${btn("resolveCrime('remember')", '🧠 Stay back, remember what you saw, then tell the police', '#2980b9')}
        ${btn("resolveCrime('ignore')", '🙈 Do nothing', '#7f8c8d')}
        <p style="color:#9ab; font-size:0.8em; margin-top:6px;">⚠️ Never chase a criminal — keep yourself safe and tell a grown-up.</p>`);
}

function resolveCrime(choice) {
    const c = todaysCrime;
    if (!c) { const o = document.getElementById('crime-overlay'); if (o) o.remove(); return; }
    const st = crimeStats();
    let hap = 0, edu = 0, msg, solved = false;
    if (choice === 'ignore') {
        hap = -4;
        msg = c.victim ? 'You didn\'t tell anyone, so nothing was done. You feel upset about it.' : 'You looked away and nothing was done. You feel a little guilty... Next time, tell a grown-up!';
    } else {
        st.reported++;
        solved = Math.random() < (choice === 'remember' ? 0.85 : 0.70);
        hap = solved ? 8 : 4;
        edu = solved ? 1 : 0;
        if (solved) st.solved++;
        const who = choice === 'tell' ? CRIME_TELL[c.place].replace(/^a /, 'the ').replace(/^the the /, 'the ') : 'the police';
        msg = (choice === 'tell' ? `You told ${CRIME_TELL[c.place]} right away. ` : 'You stayed safe, remembered everything, and told the police. ')
            + (solved ? '🚔 The police caught the person! You helped save the day!' : '🚔 The police are looking for them. Your report will really help!');
        if (c.victim && c.lost && solved) {
            player.money += c.lost;                                    // you get your money back
            msg += ` You got your $${c.lost} back!`;
        }
    }
    player.happiness = Math.max(0, Math.min(100, player.happiness + hap));
    player.education = Math.min(100, player.education + edu);
    updateStats(); saveGame();
    crimeOverlay(`
        <div style="font-size:3em;">${solved ? '🚔👮✅' : choice === 'ignore' ? '😔' : '🚔👮'}</div>
        <h2 style="color:${solved ? '#2ecc71' : '#f1c40f'}; margin:6px 0;">${solved ? 'Case solved!' : choice === 'ignore' ? 'Hmm...' : 'Reported!'}</h2>
        <p style="color:#fff; line-height:1.5; margin-bottom:8px;">${msg}</p>
        <p style="color:${hap >= 0 ? '#2ecc71' : '#e74c3c'};">${hap >= 0 ? '+' : ''}${hap} happiness${edu ? ' · +' + edu + ' education 📚' : ''}</p>
        <button onclick="closeCrimeOverlay()" style="margin-top:12px; padding:10px 26px; border:none; border-radius:10px; background:#3498db; color:white; font-weight:bold; cursor:pointer;">OK</button>`);
}

function closeCrimeOverlay() {
    const o = document.getElementById('crime-overlay');
    if (o) o.remove();
}

// ---------------------------------------------
// 📰 The city crime report
// ---------------------------------------------
function showCrimeReport() {
    const st = crimeStats();
    const bar = (p) => {
        const pct = st.total ? (st[p.id] / st.total * 100) : p.weight;
        const shown = st.total ? pct.toFixed(pct < 10 ? 1 : 0) : p.weight;
        return `<div style="text-align:left; margin:7px 0;">
            <div style="display:flex; justify-content:space-between; color:#fff; font-size:0.95em;"><span>${p.emoji} ${p.name}</span><span><b>${st.total ? st[p.id] : '—'}</b> · ${shown}%</span></div>
            <div style="background:#0f3460; border-radius:6px; height:12px; overflow:hidden;"><div style="width:${Math.max(1, pct)}%; height:100%; background:${p.id === 'school' ? '#f1c40f' : '#e74c3c'};"></div></div></div>`;
    };
    crimeOverlay(`
        <div style="font-size:2.4em;">📰</div>
        <h2 style="color:#FFD700; margin:4px 0 2px;">${player.city} — Crime Report</h2>
        <p style="color:#aaa; margin-bottom:8px; font-size:0.9em;">${st.total ? `${st.total} crimes reported in the city so far` : 'No crimes recorded yet. Typical city: 45% of days have one.'}</p>
        ${CRIME_PLACES.map(bar).join('')}
        <p style="color:#9ab; font-size:0.85em; margin:8px 0;">🏫 Only about <b>1%</b> of crime happens at schools.</p>
        <p style="color:#fff; margin-bottom:8px;">👮 You reported <b>${st.reported}</b> · solved <b style="color:#2ecc71">${st.solved}</b></p>
        <button onclick="closeCrimeOverlay()" style="padding:10px 26px; border:none; border-radius:10px; background:#3498db; color:white; font-weight:bold; cursor:pointer;">Close</button>`);
}

// Called by restartGame() so crime doesn't leak into the next life.
function resetCrime() {
    todaysCrime = null;
    closeCrimeOverlay();
}
