// =============================================
// DINNER — after school, your parents take you out to eat.
//
//   1. You get home from school  ->  Mom & Dad ask where to eat. They suggest
//      3 restaurants (a different 3 every day — out of 300, see restaurant-data.js).
//   2. You pick one  ->  a car ride there (travel.js)  ->  the restaurant.
//   3. Everyone orders. Mom & Dad order first, then you.
//   4. The food comes out: Mom's first, then Dad's, YOURS LAST.
//   5. You eat (happiness + health change with what you ordered), your
//      parents pay, and a car ride takes you home.
//
// The restaurant is a real 3D room (dinner-scene.js): you, Mom and Dad at a
// table, a waiter carrying the plates out, other customers behind you. This
// file is the story and the pop-up panels; the day clock pauses the whole
// time (inRestaurant). Called from leaveSchool3D() in school.js (via maybeOfferDinner).
// =============================================

let dinner = null;            // tonight's dinner: { restaurant, pick, order, timers, served }
let dinnerPauseStart = 0;

// A number that's different for every school day (so we only ask once a day).
function dinnerDayKey() {
    return player.age * 1000 + player.sleepCount;
}

// Pause / resume the day clock. Time spent at dinner is given back to the clock.
function setDinnerPause(on) {
    if (typeof inMall !== 'undefined' && inMall) return;   // dinner at the mall: the mall already pauses (and repays) the clock
    if (on && !inRestaurant) {
        inRestaurant = true;
        dinnerPauseStart = Date.now();
    } else if (!on && inRestaurant) {
        inRestaurant = false;
        lastDayTime += Date.now() - dinnerPauseStart;
    }
}

function dinnerOverlayEl() {
    return document.getElementById('dinner-overlay');
}

// Another popup in the way? (found money, a bully, a present...)
function otherPopupOpen() {
    return ['money-overlay', 'bully-overlay', 'math-overlay', 'school-overlay',
            'gift-overlay', 'toy-overlay', 'checkout-overlay', 'minigame-overlay', 'ride-overlay', 'life-overlay']
        .some(id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });
}

// Called after you get home from school. Asks about dinner — once per day.
function maybeOfferDinner(tries) {
    tries = tries || 0;
    if (!scene || inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni) return;
    if (player.age < 5 || player.dinnerDay === dinnerDayKey()) return;
    if (dinnerOverlayEl()) return;
    if (otherPopupOpen()) {                       // wait for the other popup to be dealt with
        if (tries < 6) setTimeout(() => maybeOfferDinner(tries + 1), 3000);
        return;
    }
    showDinnerOffer();
}

function priceSigns(tier) {
    return '$'.repeat(tier);
}

// ---------------------------------------------
// STEP 1 — "Where should we eat?" (3 choices)
// ---------------------------------------------
function showDinnerOffer() {
    const options = dinnerOptionsFor(player.age, player.sleepCount);
    setDinnerPause(true);

    const overlay = document.createElement('div');
    overlay.id = 'dinner-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:280; font-family:Arial;
        background:rgba(10,10,30,0.93); overflow-y:auto;
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; text-align:center; padding:20px;
    `;
    overlay.innerHTML = `
        <div style="font-size:2.4em; margin-bottom:6px;">🍽️</div>
        <h2 style="color:#FFD700; font-size:1.7em; margin-bottom:8px;">Where should we have dinner tonight?</h2>
        <p style="color:#ddd; margin-bottom:4px;">👩 Mom: "Your first day back — you pick!"</p>
        <p style="color:#ddd; margin-bottom:6px;">👨 Dad: "Here are three ideas — all at <b>Utama Mall</b>!" 🛍️</p>
        <p style="color:#9ab; margin-bottom:20px; font-size:0.9em;">(You'll walk to it on the mall's Level 1 restaurant row.)</p>
        <div style="display:flex; gap:18px; flex-wrap:wrap; justify-content:center;">
            ${options.map(r => `
                <div onclick="chooseRestaurant(${r.id})" style="
                    cursor:pointer; background:#0f3460; border:3px solid #f39c12;
                    border-radius:16px; padding:20px 22px; width:210px; transition:transform 0.15s;"
                    onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size:2.6em; margin-bottom:8px;">${r.emoji}</div>
                    <h3 style="color:#FFD700; margin-bottom:4px; font-size:1.1em;">${r.name}</h3>
                    <p style="color:#aaa; font-size:0.85em; margin-bottom:8px;">${r.cuisine}</p>
                    <p style="color:#f1c40f; font-size:0.9em; margin-bottom:6px;">⭐ ${r.rating.toFixed(1)} &nbsp;·&nbsp; <span style="color:#2ecc71">${priceSigns(r.tier)}</span></p>
                    <p style="color:#9ab; font-size:0.78em;">Try: ${r.menu.mains[1].emoji} ${r.menu.mains[1].name}</p>
                </div>`).join('')}
        </div>
        <button onclick="skipDinner()" style="margin-top:22px; background:transparent; color:#9ab;
            border:1px solid #456; border-radius:10px; padding:8px 16px; cursor:pointer; font-size:0.9em;">
            🏠 Skip — eat at home
        </button>
    `;
    document.body.appendChild(overlay);
}

function skipDinner() {
    const o = dinnerOverlayEl();
    if (o) o.remove();
    player.dinnerDay = dinnerDayKey();
    setDinnerPause(false);
    saveGame();
    showEvent('🏠', 'You had dinner at home tonight.');
}

// ---------------------------------------------
// STEP 2 — the ride there
// ---------------------------------------------
function chooseRestaurant(id) {
    const o = dinnerOverlayEl();
    if (o) o.remove();
    const r = getRestaurant(id);
    player.dinnerDay = dinnerDayKey();
    saveGame();
    dinner = { restaurant: r, pick: { main: null, drink: null, dessert: null }, order: null, timers: [], served: { mom: false, dad: false, me: false }, fromMall: false };
    setDinnerPause(false); // the ride pauses the clock by itself
    // All dinners are at Utama Mall now: the 3 suggestions are restaurants on Level 1 (mall.js)
    if (typeof startMallDinner === 'function' && startMallDinner(r, dinnerOptionsFor(player.age, player.sleepCount))) { dinner.fromMall = true; return; }
    const go = () => openRestaurant();
    if (!driveTo('to ' + r.name, '🍽️', go)) go();
}

// ---------------------------------------------
// STEP 3 — at the restaurant: the 3D room (dinner-scene.js) + the menu
// ---------------------------------------------
function myEmoji() {
    return player.gender === 'girl' ? '👧' : '👦';
}

function openRestaurant() {
    if (!dinner) return;
    const r = dinner.restaurant;
    setDinnerPause(true);
    document.getElementById('location-name').textContent = `🍽️ ${r.name}`;
    buildRestaurant3D(r);   // the room, the table, the waiter... (dinner-scene.js)

    // The pop-up only has a name tag, a status line and a bottom panel — the room stays visible.
    const overlay = document.createElement('div');
    overlay.id = 'dinner-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:280; font-family:Arial; pointer-events:none;';
    overlay.innerHTML = `
        <div style="position:absolute; top:10px; left:0; right:0; text-align:center;">
            <span style="display:inline-block; background:rgba(22,33,62,0.9); border:2px solid #f39c12; color:#fff;
                         padding:7px 18px; border-radius:14px; font-size:1.05em;">
                ${r.emoji} <b style="color:#FFD700">${r.name}</b> &nbsp;·&nbsp; ${r.cuisine} &nbsp;·&nbsp; ⭐ ${r.rating.toFixed(1)} &nbsp;·&nbsp; ${priceSigns(r.tier)}
            </span>
        </div>
        <div id="dn-status" style="position:absolute; top:58px; left:0; right:0; text-align:center; color:#FFD700;
             font-size:1.05em; text-shadow:0 2px 4px #000;"></div>
        <div id="dn-panel" style="pointer-events:auto; position:absolute; left:50%; transform:translateX(-50%); bottom:0;
             width:min(780px, 100%); max-height:46vh; overflow-y:auto; box-sizing:border-box; padding:10px 16px 14px;
             background:rgba(22,33,62,0.95); border:2px solid #f39c12; border-bottom:none; border-radius:16px 16px 0 0;"></div>
    `;
    document.body.appendChild(overlay);
    renderMenu();
}

function dishButton(d, kind, i, chosen) {
    const hp = d.health > 0 ? `<span style="color:#2ecc71">+${d.health}❤️</span>`
             : d.health < 0 ? `<span style="color:#e74c3c">${d.health}❤️</span>` : '';
    return `<button onclick="pickDish('${kind}', ${i})" style="
        display:flex; justify-content:space-between; align-items:center; gap:8px; width:100%; margin:3px 0; padding:6px 10px;
        font-size:0.92em; text-align:left; cursor:pointer; color:white; border-radius:9px;
        background:${chosen ? '#1a7a4a' : '#0f3460'}; border:2px solid ${chosen ? '#2ecc71' : '#3498db'};">
        <span>${(typeof foodImg === 'function' ? foodImg(d.emoji, d.name, 28, { force: true }) : d.emoji)} ${d.name}${d.special ? ' <span style="color:#f1c40f; font-size:0.8em;">(special!)</span>' : ''}</span>
        <span style="white-space:nowrap; font-size:0.85em;"><span style="color:#2ecc71">+${d.hap}😊</span> ${hp} <span style="color:#aaa">$${d.price}</span></span>
    </button>`;
}

function renderMenu() {
    const panel = document.getElementById('dn-panel');
    if (!panel || !dinner) return;
    const m = dinner.restaurant.menu, p = dinner.pick;
    const section = (title, kind, list) => `
        <h3 style="color:#FFD700; font-size:0.95em; margin:8px 0 2px;">${title}</h3>
        ${list.map((d, i) => dishButton(d, kind, i, p[kind] === i)).join('')}`;
    panel.innerHTML = `
        <p style="color:#d9b99b; text-align:center; font-size:0.88em; margin-bottom:2px;">
            📖 The menu — Mom &amp; Dad are paying. 💳 Pick a main course, and a drink or dessert if you like.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:0 18px;">
            <div>${section('🍽️ Main courses (pick one)', 'main', m.mains)}</div>
            <div>${section('🥤 Drinks (optional)', 'drink', m.drinks)}${section('🍰 Dessert (optional)', 'dessert', m.desserts)}</div>
        </div>
        <div style="text-align:center; margin-top:10px;">
            <button onclick="placeOrder()" ${p.main === null ? 'disabled' : ''} style="
                font-size:1em; padding:10px 28px; border:none; border-radius:12px; font-weight:bold;
                cursor:${p.main === null ? 'not-allowed' : 'pointer'};
                background:${p.main === null ? '#555' : '#27ae60'}; color:white;">
                ${p.main === null ? 'Pick a main course first' : '🛎️ Order!'}
            </button>
        </div>`;
}

function pickDish(kind, i) {
    if (!dinner || dinner.order) return;
    dinner.pick[kind] = (dinner.pick[kind] === i && kind !== 'main') ? null : i; // drinks & desserts can be un-picked
    renderMenu();
}

// ---------------------------------------------
// STEP 4 — ordering (the waiter comes over; parents first, then you)
// ---------------------------------------------
function dnLater(ms, fn) {
    if (!dinner) return;
    dinner.timers.push(setTimeout(() => { if (dinner && dinnerOverlayEl()) fn(); }, ms));
}

function dnClearTimers() {
    if (dinner) dinner.timers.forEach(clearTimeout);
    if (dinner) dinner.timers = [];
}

function parentOrder(avoidMainIndex) {
    const m = dinner.restaurant.menu;
    let mi = Math.floor(Math.random() * m.mains.length);
    if (mi === avoidMainIndex) mi = (mi + 1) % m.mains.length;       // Mom and Dad don't copy each other
    return {
        mainIndex: mi,
        main: m.mains[mi],
        drink: Math.random() < 0.7 ? m.drinks[Math.floor(Math.random() * m.drinks.length)] : null,
        dessert: Math.random() < 0.35 ? m.desserts[Math.floor(Math.random() * m.desserts.length)] : null
    };
}

function describeOrder(o) {
    return `the ${o.main.name}` + (o.drink ? ` and a ${o.drink.name}` : '') + (o.dessert ? `, plus ${o.dessert.name} for dessert` : '');
}

function placeOrder() {
    if (!dinner || dinner.order || dinner.pick.main === null) return;
    const m = dinner.restaurant.menu, p = dinner.pick;
    const mom = parentOrder(-1);
    const dad = parentOrder(mom.mainIndex);
    const me = { main: m.mains[p.main], drink: p.drink !== null ? m.drinks[p.drink] : null, dessert: p.dessert !== null ? m.desserts[p.dessert] : null };
    dinner.order = { mom, dad, me };

    const panel = document.getElementById('dn-panel');
    panel.innerHTML = `<div id="dn-talk" style="text-align:left; line-height:1.8; min-height:60px;"></div>`;
    waiterVisitTable3D();                                      // the waiter walks over to the table

    const say = (ms, text, who) => dnLater(ms, () => {
        const talk = document.getElementById('dn-talk');
        if (talk) talk.innerHTML += `<div style="color:#fff;">${text}</div>`;
        if (who) speak3D(who);
    });
    say(2400,  `🧑‍🍳 <b>Waiter:</b> Welcome! Who's ordering first?`);
    say(3700,  `👩 <b>Mom:</b> I'll have ${describeOrder(mom)}.`, 'mom');
    say(5100,  `👨 <b>Dad:</b> I'll have ${describeOrder(dad)}.`, 'dad');
    say(6500,  `${myEmoji()} <b>You:</b> I'd like ${describeOrder(me)}, please!`, 'me');
    say(7900,  `🧑‍🍳 <b>Waiter:</b> Lovely! It'll be out soon. 🍽️`);
    dnLater(8600, startWaiting);
}

// ---------------------------------------------
// STEP 5 — waiting: Mom's food, then Dad's, then YOURS (the waiter carries each plate over)
// ---------------------------------------------
function startWaiting() {
    const panel = document.getElementById('dn-panel');
    if (!panel || !dinner) return;
    panel.innerHTML = `
        <div style="text-align:center;">
            <p style="color:#d9b99b; margin-bottom:8px;">👀 The kitchen is busy... Mom &amp; Dad get their food first, then you.</p>
            <button id="dn-skip" onclick="skipWaiting()" style="background:#0f3460; color:#fff; border:2px solid #3498db;
                border-radius:10px; padding:7px 16px; cursor:pointer; font-size:0.95em;">⏭ Skip the wait</button>
        </div>`;
    const status = t => { const s = document.getElementById('dn-status'); if (s) s.textContent = t; };
    status('⏳ Waiting for the food...');
    const o = dinner.order;
    // The waiter does the walking; this runs as each plate lands. The order is ALWAYS Mom, Dad, you.
    startServing3D(o, who => {
        if (!dinner) return;
        dinner.served[who] = true;
        if (who === 'mom') status(`🍽️ The waiter brings Mom's ${o.mom.main.name}!`);
        else if (who === 'dad') status(`🍽️ Dad's ${o.dad.main.name} arrives... and yours isn't here yet! 😋`);
        else { status(`🎉 Finally! Your ${o.me.main.name} arrives!`); showEatButton(); }
    });
}

function skipWaiting() {
    const btn = document.getElementById('dn-skip');
    if (btn) btn.remove();
    speedUpServing3D();   // same order (Mom, Dad, you) — just quicker
}

function showEatButton() {
    const panel = document.getElementById('dn-panel');
    if (!panel) return;
    panel.innerHTML = `
        <div style="text-align:center;">
            <button onclick="eatDinner()" style="font-size:1.1em; padding:11px 34px; border:none; border-radius:12px;
                font-weight:bold; cursor:pointer; background:#e67e22; color:white;">😋 Dig in!</button>
        </div>`;
}

// ---------------------------------------------
// STEP 6 — eating, the bill, and the ride home
// ---------------------------------------------
function eatDinner() {
    if (!dinner || !dinner.order || dinner.eating) return;
    dinner.eating = true;
    const r = dinner.restaurant, o = dinner.order;
    const mine = [o.me.main, o.me.drink, o.me.dessert].filter(Boolean);
    const ratingBonus = r.rating >= 4.5 ? 3 : r.rating >= 4.0 ? 1 : 0;
    const hap = mine.reduce((s, d) => s + d.hap, 0) + ratingBonus;
    const health = mine.reduce((s, d) => s + d.health, 0);
    const bill = [o.mom, o.dad, o.me].reduce((s, who) => s + [who.main, who.drink, who.dessert].filter(Boolean).reduce((a, d) => a + d.price, 0), 0);

    player.happiness = Math.max(0, Math.min(100, player.happiness + hap));
    player.health    = Math.max(0, Math.min(100, player.health + health));
    gainFullness(35 + (o.me.drink ? 5 : 0) + (o.me.dessert ? 10 : 0), true);     // a restaurant meal fills you up (food.js)
    updateStats(); saveGame();

    document.getElementById('dn-panel').innerHTML = '';
    document.getElementById('dn-panel').style.display = 'none';
    const s = document.getElementById('dn-status'); if (s) s.textContent = '😋 Yum yum yum...';

    eat3D(() => {                                      // everyone eats for a few seconds, then:
        if (!dinner) return;
        const panel = document.getElementById('dn-panel');
        if (!panel) return;
        const st = document.getElementById('dn-status'); if (st) st.textContent = '';
        const verdict = health >= 5 ? 'So fresh and healthy!' : health <= -4 ? 'Tasty... but a bit greasy!' : 'Yummy!';
        panel.style.display = 'block';
        panel.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#2ecc71; font-size:1.3em; margin-bottom:6px;">😋 ${verdict}</h3>
                <p style="color:#fff; margin-bottom:2px;">You ate: ${mine.map(d => (typeof foodImg === 'function' ? foodImg(d.emoji, d.name, 26, { force: true }) : d.emoji) + ' ' + d.name).join(', ')}</p>
                <p style="color:#2ecc71; margin:6px 0;">+${hap} happiness ${ratingBonus ? `(${ratingBonus} from the great restaurant!)` : ''}
                    &nbsp;|&nbsp; <span style="color:${health >= 0 ? '#2ecc71' : '#e74c3c'}">${health >= 0 ? '+' : ''}${health} health</span></p>
                <p style="color:#d9b99b; margin-bottom:10px;">🧾 The bill came to $${bill} — Mom &amp; Dad paid.</p>
                <button onclick="leaveRestaurant()" style="font-size:1.05em; padding:10px 30px; border:none; border-radius:12px;
                    font-weight:bold; cursor:pointer; background:#3498db; color:white;">🚗 Ride home</button>
            </div>`;
    });
}

function leaveRestaurant() {
    const o = dinnerOverlayEl();
    if (o) o.remove();
    dnClearTimers();
    teardownRestaurant3D();   // the house (or the mall) comes back
    const fromMall = !!(dinner && dinner.fromMall);
    dinner = null;
    if (fromMall && typeof mall3D !== 'undefined' && mall3D) { onMallDinnerDone(); return; }   // back in the mall, then the ride home
    setDinnerPause(false);
    const home = () => {
        document.getElementById('location-name').textContent = '🏠 Home';
        showEvent('🏠', 'Back home after a yummy dinner!');
        updateActionPanel();
    };
    if (!driveTo('home', '🏠', home)) home();
}

// Called by restartGame() so a dinner in progress never leaks into the next life.
function resetDinner() {
    dnClearTimers();
    dinner = null;
    inRestaurant = false;
    restaurant3D = null;        // the whole scene is thrown away on restart
    const o = dinnerOverlayEl();
    if (o) o.remove();
}
