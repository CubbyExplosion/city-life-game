// =============================================
// PARENT VISITS — Mom & Dad come to see your apartment.
//
//   When you live in your own place (apartment.js) Mom & Dad drop by now and then ("We're coming over!"), or you can press 📞 Invite Mom & Dad
//   (every few days). They walk in through your front door, look around your (furnished!) home, wander, chat to each other and to you in THEIR
//   voices with speech bubbles (voices.js), and may bring groceries or a little gift. Click one of them for the visit menu:
//     💬 Chat   🤗 Hug (+happiness)   🛋️ Show them around (they comment on your furniture)   🍳 Ask them to cook (uses your fridge's real food)
//     💰 Ask for a little help (only if you're short on money, once a visit)   👋 Say goodbye
//   The visit ends by itself after about 90 seconds (or when you say goodbye): they hug you, maybe leave a gift envelope, and walk out.
//   If you leave the apartment mid-visit they simply head home. It changes no bills or grades — it's family, comfort and a bit of help.
//
// How: the two visitors are ordinary people (buildParent from people.js) that this file moves itself (no parent-AI). They are registered in
// clickableNPCs with npcData.isVisitor so a click reaches visitClick() (interactWithNPC is wrapped). Free floor to wander on comes from furniture.js
// (furnStatic / furnById) when available. advanceOneDay and lifeButtons are wrapped for the surprise visits and the 📞 button.
// State: player.lastParentVisit (the life-day of the last visit).
// =============================================

let visit = null;               // the visit in progress: { mom, dad, state, until, flags, ... }
const VISIT_DURATION_MS = 90000;
const VISIT_COOLDOWN_DAYS = 5;

function visitDay() { return player.age * 100 + player.sleepCount; }
function visitCooldownLeft() { return Math.max(0, VISIT_COOLDOWN_DAYS - (visitDay() - (player.lastParentVisit === undefined ? -999 : player.lastParentVisit))); }
function visitCanStart() {
    if (visit || !player.home || player.age < 18) return false;
    if (typeof housingBusy === 'function' && housingBusy()) return false;
    if (typeof lgAtHome === 'function' && !lgAtHome()) return false;
    return true;
}

// ---------- where they can stand ----------
function visitFreeSpots() {
    const spots = [];
    let st = null, placed = [];
    try { if (typeof furnStatic === 'function') st = furnStatic(); } catch (e) {}
    try { if (typeof ensureFurn === 'function') placed = ensureFurn().placed; } catch (e) {}
    const occupied = new Set();
    placed.forEach(p => { try { if (!furnById(p.id).flat) furnFootprint(p).forEach(c => occupied.add(c.cx + ',' + c.cz)); } catch (e) {} });
    for (let cx = 0; cx < 10; cx++) for (let cz = 0; cz < 8; cz++) {                  // (not the front-door row)
        const k = cx + ',' + cz;
        if (st && st.has(k)) continue;
        if (occupied.has(k)) continue;
        spots.push({ x: cx - 4.5, z: cz - 4.5 });
    }
    if (!spots.length) [[-1, 1], [1, 0], [0, -1], [2, 1]].forEach(p => spots.push({ x: p[0], z: p[1] }));
    return spots;
}
function visitPick(spots, avoid) {
    for (let i = 0; i < 12; i++) { const s = spots[Math.floor(Math.random() * spots.length)]; if (!avoid || Math.hypot(s.x - avoid.x, s.z - avoid.z) > 1.4) return s; }
    return spots[0];
}

// ---------- arriving ----------
function visitStart(reason) {
    if (!visitCanStart()) return false;
    player.lastParentVisit = visitDay();
    const mom = buildParent(2, 5.6, 0x4169E1, 0x4B2800), dad = buildParent(2.6, 5.9, 0xC0392B, 0xFFD700);
    [[mom, 'Mom', 'mom'], [dad, 'Dad', 'dad']].forEach(([g, name, role]) => {
        g.userData.npcData = { name, role, isVisitor: true, dialogue: '', happiness: 0 };
        if (typeof clickableNPCs !== 'undefined') clickableNPCs.push(g);
    });
    visit = { mom: { g: mom, target: null, wait: 0 }, dad: { g: dad, target: null, wait: 1.5 }, state: 'arriving', start: Date.now(), until: Date.now() + VISIT_DURATION_MS,
              flags: {}, nextTalk: Date.now() + 9000, spots: visitFreeSpots() };
    visit.mom.target = { x: 2, z: 3.2 }; visit.dad.target = { x: 2.8, z: 3.5 };
    const H = typeof hgCur === 'function' ? hgCur() : null;
    const hello = H && H.phrases && H.phrases[0] ? ` <i>(${H.phrases[0][0]} — ${H.phrases[0][1]})</i>` : '';
    showEvent('🚪', `Knock knock! Mom & Dad${reason === 'invited' ? ' are here!' : ' came to visit!'}${hello}`);
    saveGame();
    if (!visit.timer) visit.timer = setInterval(visitTick, 60);
    updateActionPanel();
    return true;
}

// ---------- the little brain that moves them ----------
function visitSay(who, line) {
    if (typeof voSayAs === 'function' && typeof voStyle === 'function' && voStyle() !== 'off') voSayAs(who, line);
    else showEvent('💬', `${who}: "${line}"`);
}
function visitFurnitureLine() {
    let placed = [];
    try { placed = ensureFurn().placed.map(p => furnById(p.id)).filter(Boolean); } catch (e) {}
    const names = placed.map(d => d.name.toLowerCase());
    const pick = names.length ? names[Math.floor(Math.random() * names.length)] : null;
    const generic = ["What a lovely place you have!", 'Are you eating enough, sweetheart?', "Don't forget to call us!", 'Is the rent okay?', "We're so proud of you!", 'It smells nice in here.', 'Do you need anything from the store?'];
    const withF = pick ? [`I really like the ${pick}!`, `The ${pick} looks great there.`, `Where did you find that ${pick}?`] : ['It could use a little furniture, dear!'];
    const pool = Math.random() < 0.5 ? withF : generic;
    return pool[Math.floor(Math.random() * pool.length)];
}
function visitTick() {
    if (!visit) return;
    const v = visit, now = Date.now(), dt = 0.06;
    // if you went out (or the room was rebuilt), they head home
    if (visit.state !== 'leaving' && (typeof lgAtHome === 'function' && !lgAtHome())) { visitEnd(true); return; }
    if (v.state === 'arriving' || v.state === 'staying') {
        ['mom', 'dad'].forEach(k => {
            const p = v[k], g = p.g; if (!g.parent) return;
            if (p.wait > 0) { p.wait -= dt; return; }
            if (!p.target) { p.target = visitPick(v.spots, v[k === 'mom' ? 'dad' : 'mom'].target); }
            const dx = p.target.x - g.position.x, dz = p.target.z - g.position.z, d = Math.hypot(dx, dz);
            if (d < 0.12) {
                p.target = null; p.wait = 2.5 + Math.random() * 4;
                if (v.state === 'arriving') { v.arrived = (v.arrived || 0) + 1; }
                const pm = typeof playerMesh !== 'undefined' && playerMesh ? playerMesh.position : null;     // turn toward you when you're close
                if (pm && Math.hypot(pm.x - g.position.x, pm.z - g.position.z) < 4) g.rotation.y = Math.atan2(pm.x - g.position.x, pm.z - g.position.z);
            } else {
                const sp = (v.state === 'arriving' ? 1.7 : 1.1) * dt; g.position.x += dx / d * Math.min(sp, d); g.position.z += dz / d * Math.min(sp, d);
                g.rotation.y = Math.atan2(dx, dz);
            }
        });
        if (v.state === 'arriving' && v.arrived >= 2) {                          // both are inside: say hello and hand over the gifts
            v.state = 'staying'; visitArriveGifts();
        }
        if (v.state === 'staying' && now > v.nextTalk) { v.nextTalk = now + 11000 + Math.random() * 7000; visitSay(Math.random() < 0.5 ? 'Mom' : 'Dad', visitFurnitureLine()); }
        if (now > v.until && v.state === 'staying') visitFarewell();
    } else if (v.state === 'leaving') {
        let allGone = true;
        ['mom', 'dad'].forEach(k => {
            const p = v[k], g = p.g; if (!g.parent) return;
            const dx = 2 - g.position.x, dz = 5.8 - g.position.z, d = Math.hypot(dx, dz);
            if (g.position.z > 5.6 || d < 0.15) { g.visible = false; return; }
            allGone = false;
            const sp = 1.6 * dt; g.position.x += dx / d * Math.min(sp, d); g.position.z += dz / d * Math.min(sp, d); g.rotation.y = Math.atan2(dx, dz);
        });
        if (allGone || now > v.leaveBy) visitEnd(false);
    }
}

function visitArriveGifts() {
    const H = typeof hgCur === 'function' ? hgCur() : null, bits = [];
    visitSay('Mom', H && Math.random() < 0.6 ? `Hello, my ${player.gender === 'girl' ? 'darling' : 'dear'}! We brought you food.` : 'Surprise! We brought you some groceries!');
    try {                                                                                             // groceries into your fridge
        const pool = (typeof STARTER_GROCERIES !== 'undefined' ? STARTER_GROCERIES.filter(g => !HOUSEHOLD_ITEMS.includes(g.name)) : []).slice().sort(() => Math.random() - 0.5).slice(0, 3);
        pool.forEach(addToFridge);
        if (H && typeof hgItem === 'function') H.foods.slice().sort(() => Math.random() - 0.5).slice(0, 2).forEach(n => { const it = hgItem(n); addToFridge({ name: it.name, emoji: it.emoji }); });
        bits.push('🛒 groceries for your fridge');
    } catch (e) {}
    if (Math.random() < 0.35 && player.money < 400) { const gift = 15 + Math.floor(Math.random() * 3) * 10; player.money += gift; bits.push(`💵 $${gift} "for the bills"`); }
    if (typeof ensureFurn === 'function' && Math.random() < 0.25) {                                  // sometimes a little housewarming present
        const f = ensureFurn(), id = ['plant', 'chair', 'beanbag', 'lamp'][Math.floor(Math.random() * 4)]; f.storage.push(id);
        bits.push(`🎁 a ${furnById(id).name.toLowerCase()} (it's in your Furniture storage)`);
    }
    updateStats(); saveGame();
    setTimeout(() => showEvent('🎁', `Mom & Dad brought: ${bits.join(', ')}.`), 2600);
    setTimeout(() => visitSay('Dad', 'Let us have a look around your place!'), 5200);
}

// ---------- leaving ----------
function visitFarewell() {
    if (!visit || visit.state === 'leaving') return;
    visit.state = 'leaving'; visit.leaveBy = Date.now() + 14000;
    closeLifeOverlay();
    visitSay('Mom', "It was so nice to see you. We love you!");
    player.happiness = Math.min(100, player.happiness + 4);
    if (!visit.flags.gift && player.money < 120 && Math.random() < 0.5) { visit.flags.gift = true; player.money += 20; setTimeout(() => showEvent('✉️', 'Mom left an envelope on the table: $20 "for something nice".'), 1500); }
    updateStats(); saveGame(); updateActionPanel();
    setTimeout(() => showEvent('👋', 'Mom & Dad are heading home. +4 happiness from the visit!'), 800);
}
function visitEnd(abrupt) {
    if (!visit) return;
    clearInterval(visit.timer);
    [visit.mom, visit.dad].forEach(p => {
        const g = p.g;
        if (typeof clickableNPCs !== 'undefined') { const i = clickableNPCs.indexOf(g); if (i >= 0) clickableNPCs.splice(i, 1); }
        if (g.parent) g.parent.remove(g);
        try { if (typeof disposeTree === 'function') disposeTree(g); } catch (e) {}
    });
    visit = null;
    closeLifeOverlay();
    if (abrupt) showEvent('👋', 'Mom & Dad headed home.');
    try { updateActionPanel(); } catch (e) {}
}

// ---------- the visit menu ----------
function visitClick(npcData) {
    if (!visit || visit.state !== 'staying') { showEvent('🚪', npcData.name + ' is just coming in — say hi in a moment!'); return; }
    const who = npcData.name, f = visit.flags, hugged = f['hug' + who];
    const b = (fn, label, color, off) => lifeBtn(fn, label, off ? '#555' : color, 'display:block; width:100%; margin:6px 0;' + (off ? 'opacity:0.6;' : ''));
    lifeOverlay(`<div style="text-align:center; color:#fff;">
        <div style="font-size:2.2em;">${who === 'Mom' ? '👩' : '👨'}</div><h3 style="color:#FFD700; margin:2px 0;">${who} is visiting</h3>
        <div style="color:#aaa; font-size:0.85em; margin-bottom:6px;">💰 $${player.money} · 🍽️ ${hungerLabel()} · 😊 ${player.happiness}</div>
        ${b(`visitChat('${who}')`, '💬 Chat', '#2980b9')}
        ${b(`visitHug('${who}')`, hugged ? '🤗 Hugged already' : '🤗 Give ' + who + ' a hug', '#e91e8c', hugged)}
        ${b(`visitTour('${who}')`, f.tour ? '🛋️ Already showed around' : '🛋️ Show ' + who + ' around', '#8e44ad', f.tour)}
        ${b(`visitCook('${who}')`, f.cook ? '🍳 Already cooked' : '🍳 Ask ' + who + ' to cook', '#d35400', f.cook)}
        ${b(`visitHelp('${who}')`, f.help ? '💰 Already helped' : '💰 Ask for a little help', '#27ae60', f.help)}
        ${b('visitGoodbye()', '👋 Say goodbye', '#7f8c8d')}
        ${lifeBtn('closeLifeOverlay()', 'Close', '#555', 'display:block; width:100%; margin:6px 0;')}</div>`, '#e91e8c');
}
function visitChat(who) {
    closeLifeOverlay();
    const lines = ['How is work going?', 'Are you sleeping enough?', 'Remember when you were little? You cried for milk all the time!', "We're so proud of you.", 'Do you need help with anything?', 'Call us on the weekend, okay?'];
    visitSay(who, lines[Math.floor(Math.random() * lines.length)]);
    player.happiness = Math.min(100, player.happiness + 1); updateStats();
}
function visitHug(who) {
    if (!visit || visit.flags['hug' + who]) return;
    visit.flags['hug' + who] = true; closeLifeOverlay();
    player.happiness = Math.min(100, player.happiness + 3); updateStats(); saveGame();
    visitSay(who, 'Come here, give me a big hug!');
    showEvent('🤗', `${who} hugged you tight. +3 happiness`);
}
function visitTour(who) {
    if (!visit || visit.flags.tour) return;
    visit.flags.tour = true; closeLifeOverlay();
    let placed = 0; try { placed = ensureFurn().placed.length; } catch (e) {}
    const gain = Math.min(4, 1 + Math.floor(placed / 2));
    player.happiness = Math.min(100, player.happiness + gain); updateStats(); saveGame();
    visitSay(who, placed >= 6 ? 'This is wonderful! You have made it so cosy.' : placed >= 2 ? 'Very nice! A few more things and it will feel like home.' : 'It is a bit empty, but we love it. Visit the furniture shop soon!');
    showEvent('🛋️', `${who} loved the tour of your ${myApartment() ? myApartment().name : 'home'}. +${gain} happiness`);
}
function visitCook(who) {
    if (!visit || visit.flags.cook) return;
    visit.flags.cook = true; closeLifeOverlay();
    const options = FOOD_RECIPES.filter(canMake).sort((a, b) => (b.heritage ? 1 : 0) - (a.heritage ? 1 : 0) || b.hap - a.hap);
    const meal = options[0];
    if (!meal) {                                                                       // nothing to cook with: they go and buy something
        ['Eggs', 'Bread', 'Cheese'].forEach(n => addToFridge({ name: n, emoji: n === 'Eggs' ? '🥚' : n === 'Bread' ? '🍞' : '🧀' }));
        player.fullness = Math.min(100, player.fullness + 35); updateStats(); saveGame();
        visitSay(who, 'Your fridge is empty! I popped to the shop and made you a sandwich.');
        showEvent('🥪', `${who} made you a sandwich from fresh groceries. Fullness up!`); return;
    }
    meal.need.forEach(takeFromFridge);
    gainFullness(meal.full + 10, true);
    player.health = Math.max(0, Math.min(100, player.health + meal.health)); player.happiness = Math.max(0, Math.min(100, player.happiness + meal.hap + 2));
    updateStats(); saveGame();
    visitSay(who, `I'm making ${meal.name} for you. Eat up!`);
    showEvent(meal.emoji, `${who} cooked ${meal.name} using your food, and cleaned up too! 😋`);
}
function visitHelp(who) {
    if (!visit || visit.flags.help) return;
    visit.flags.help = true; closeLifeOverlay();
    if (player.money >= 150) { visitSay(who, "You're doing fine on your own, sweetheart. Save it for something nice!"); showEvent('💬', `${who} thinks you don't need help right now — you have $${player.money}!`); return; }
    const amt = player.money < 40 ? 50 : 30;
    player.money += amt; updateStats(); saveGame();
    visitSay(who, `Here you go. It's only $${amt}, but it's from the heart.`);
    showEvent('💰', `${who} gave you $${amt} to help out.`);
}
function visitGoodbye() { closeLifeOverlay(); visitFarewell(); }

// ---------- hooks into the rest of the game ----------
if (typeof interactWithNPC === 'function') {                                       // clicking Mom / Dad while they visit
    const visitOrigInteract = interactWithNPC;
    interactWithNPC = function (npcData) { if (npcData && npcData.isVisitor) { visitClick(npcData); return; } return visitOrigInteract.apply(this, arguments); };
}
if (typeof advanceOneDay === 'function') {                                         // a surprise visit now and then
    const visitOrigDay = advanceOneDay;
    advanceOneDay = function (silent) {
        const r = visitOrigDay.apply(this, arguments);
        try { if (!silent && visitCooldownLeft() === 0 && visitCanStart() && Math.random() < 0.22) setTimeout(() => { if (visitCanStart()) { showEvent('📞', 'Mom: "We\'re near your place — we\'re coming over!"'); setTimeout(() => visitStart('surprise'), 2500); } }, 2500); } catch (e) {}
        return r;
    };
}
if (typeof lifeButtons === 'function') {                                           // 📞 Invite Mom & Dad
    const visitOrigButtons = lifeButtons;
    lifeButtons = function () {
        let extra = '';
        if (player.home && player.age >= 18) {
            if (visit) extra = `<button class="action-btn" onclick="visitGoodbye()">👋 Say goodbye to Mom &amp; Dad</button>`;
            else { const left = visitCooldownLeft(); extra = left > 0 ? `<button class="action-btn" style="opacity:0.6" onclick="showEvent('📞','Mom & Dad were just here — try again in ${left} day${left === 1 ? '' : 's'}.')">📞 Invite (in ${left}d)</button>` : `<button class="action-btn" onclick="visitInvite()">📞 Invite Mom &amp; Dad</button>`; }
        }
        return visitOrigButtons.apply(this, arguments) + extra;
    };
}
function visitInvite() {
    if (!visitCanStart()) { showEvent('📞', 'Not right now.'); return; }
    if (visitCooldownLeft() > 0) { showEvent('📞', 'Mom & Dad were just here!'); return; }
    showEvent('📞', 'Mom: "Of course, sweetheart! We\'re on our way!"');
    setTimeout(() => visitStart('invited'), 2200);
}
