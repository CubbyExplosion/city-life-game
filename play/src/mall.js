// =============================================
// UTAMA MALL — a big two-level walkable mall (inspired by One Utama).
//
//   GROUND FLOOR   a long concourse with a fountain, 24 shops, and the GROCERY STORE
//                  (Utama Grocer) at the west end — it's the grocery from store.js, you just
//                  walk in. A department store fills the east end.
//   LEVEL 1        reached by the ESCALATOR ramps (walk up them): 20 more shops, the FOOD COURT
//                  and the cinema. An open ATRIUM in the middle lets you look down at the fountain.
//
// Two ways to come here:
//   * "Go Shopping" (home)  ->  an ERRAND: walk to the grocery and do the shopping (store.js).
//     You can also wander and shop (with your own money) while you're here.
//   * Mom & Dad sometimes offer a MALL TRIP: you pick 3 of the mall's 100 shops (mall-data.js),
//     get a $30 budget, and visit them ONE BY ONE in the order you picked. (The grocery is optional.)
//
// Mom and Dad follow you around. The day clock pauses the whole time (inMall).
// =============================================

let mall3D = null;               // everything about the 3D mall, or null when you're not in it
let mallTrip = null;             // this visit: { mode: 'trip' | 'errand', ids, budget, index, bought }
let mallPauseStart = 0;

const MALL_NAME = 'Utama Mall';
const MALL_BUDGET = 30;          // what Mom & Dad give you to spend on a trip
const MALL_TRIP_COOLDOWN_DAYS = 7;
const MALL_WALK_SPEED = 4.6;
const LEVEL_H = 8;               // how high level 1 is above the ground floor
const MALL_BOUNDS = { minX: -58.5, maxX: 58.5, minZ: -9.6, maxZ: 9.6 };
const MALL_SLOTS_G = 12;         // shops per side on the ground floor
const MALL_SLOTS_1 = 10;         // shops per side on level 1 (the food court takes the east end)
// The two escalator ramps (walk up them): x range, and which way is "up"
const MALL_RAMPS = [{ x0: -34, x1: -22, up: 1 }, { x0: 22, x1: 34, up: -1 }];
const RAMP_HALF_W = 1.5;

function mallSlotX(i) { return -44 + i * 8; }

function setMallPause(on) {
    if (on && !inMall) {
        inMall = true;
        mallPauseStart = Date.now();
    } else if (!on && inMall) {
        inMall = false;
        lastDayTime += Date.now() - mallPauseStart;
    }
}

function removeMallOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function mallDayKey() {
    return player.age * 100 + player.sleepCount;
}

// ---------------------------------------------
// 1. "Want to come to the mall?"  (called every new day from advanceOneDay)
// ---------------------------------------------
function maybeRollMallTrip() {
    if (player.age < 5 || player.age >= 18) return;              // Mom & Dad's mall trips are for kids (adults go on their own — "Go Shopping")
    if (mallDayKey() - (player.lastMallDay === undefined ? -999 : player.lastMallDay) < MALL_TRIP_COOLDOWN_DAYS) return;
    if (Math.random() < 0.2) setTimeout(() => maybeOfferMall(0), 2500);
}

function maybeOfferMall(tries) {
    tries = tries || 0;
    if (!scene || inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall) return;
    if (document.getElementById('mall-offer') || document.getElementById('mall-pick')) return;
    if (document.getElementById('dinner-overlay') || (typeof otherPopupOpen === 'function' && otherPopupOpen())) {
        if (tries < 6) setTimeout(() => maybeOfferMall(tries + 1), 3000);
        return;
    }
    showMallOffer();
}

function showMallOffer() {
    setMallPause(true);
    removeMallOverlay('mall-offer');
    const el = document.createElement('div');
    el.id = 'mall-offer';
    el.style.cssText = `position:fixed; inset:0; z-index:280; display:flex; align-items:center; justify-content:center;
        background:rgba(10,10,30,0.88); font-family:Arial; text-align:center; padding:20px;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #e91e63; border-radius:16px; padding:28px 34px; max-width:440px;">
            <div style="font-size:3em;">🛍️</div>
            <h2 style="color:#FFD700; margin:6px 0 10px;">We're going to ${MALL_NAME}!</h2>
            <p style="color:#ddd; margin-bottom:4px;">👩 Mom: "Want to come with us?"</p>
            <p style="color:#ddd; margin-bottom:6px;">👨 Dad: "You can pick <b>3 shops</b> out of 100!"</p>
            <p style="color:#2ecc71; margin-bottom:16px;">💳 We'll give you $${MALL_BUDGET} to spend.</p>
            <button onclick="acceptMallTrip()" style="margin:5px; padding:11px 24px; border:none; border-radius:12px; background:#27ae60; color:white; font-size:1.05em; font-weight:bold; cursor:pointer;">🛍️ Yes, let's go!</button>
            <button onclick="declineMallTrip()" style="margin:5px; padding:11px 20px; border:none; border-radius:12px; background:#555; color:white; font-size:1em; cursor:pointer;">Not today</button>
        </div>`;
    document.body.appendChild(el);
}

function declineMallTrip() {
    removeMallOverlay('mall-offer');
    player.lastMallDay = mallDayKey();           // don't nag again right away
    setMallPause(false);
    saveGame();
}

function acceptMallTrip() {
    removeMallOverlay('mall-offer');
    showMallPicker();
}

// "Go Shopping" at home: a grocery ERRAND at the mall (called from openShopping in minigames.js)
function startMallErrand() {
    if (!scene || inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall) return;
    mallTrip = { mode: 'errand', ids: [], budget: 0, index: 0, bought: [] };
    if (!driveTo('to the mall', '🛒', openMall)) openMall();
}

// ---------------------------------------------
// 2. Pick 3 of the 100 shops
// ---------------------------------------------
let mallPick = null;   // { chosen: [ids in order], filter: 'all', search: '' }

function showMallPicker() {
    removeMallOverlay('mall-pick');
    mallPick = { chosen: [], filter: 'all', search: '' };
    const el = document.createElement('div');
    el.id = 'mall-pick';
    el.style.cssText = `position:fixed; inset:0; z-index:285; display:flex; flex-direction:column; align-items:center;
        background:rgba(10,10,30,0.95); font-family:Arial; padding:14px; box-sizing:border-box;`;
    document.body.appendChild(el);
    renderMallPicker();
}

function renderMallPicker() {
    const el = document.getElementById('mall-pick');
    if (!el || !mallPick) return;
    const p = mallPick;
    const q = p.search.trim().toLowerCase();
    const shops = Array.from({ length: MALL_SHOP_COUNT }, (_, i) => getMallShop(i))
        .filter(s => (p.filter === 'all' || s.catId === p.filter) && (!q || s.name.toLowerCase().includes(q) || s.catName.toLowerCase().includes(q)));
    const chip = (id, label) => `<button onclick="mallFilter('${id}')" style="margin:3px; padding:6px 12px; border:2px solid ${p.filter === id ? '#FFD700' : '#3498db'};
        border-radius:16px; background:${p.filter === id ? '#1a6090' : '#0f3460'}; color:white; cursor:pointer; font-size:0.85em;">${label}</button>`;
    el.innerHTML = `
        <h2 style="color:#FFD700; margin:2px 0;">🛍️ Pick 3 shops (${p.chosen.length}/3)</h2>
        <p style="color:#aaa; font-size:0.9em; margin-bottom:6px;">You'll visit them one by one, in the order you pick. Showing ${shops.length} of 100 shops.</p>
        <div style="text-align:center;">${chip('all', '🏬 All')}${MALL_CATEGORIES.map(c => chip(c.id, c.emoji + ' ' + c.name)).join('')}</div>
        <input id="mall-search" type="text" placeholder="🔎 Search shops..." value="${p.search.replace(/"/g, '&quot;')}" oninput="mallSearch(this.value)"
            style="margin:6px 0; padding:7px 12px; width:min(320px,90%); border-radius:10px; border:2px solid #3498db; background:#0f3460; color:white; outline:none;">
        <div style="flex:1; overflow-y:auto; width:100%; max-width:900px; display:flex; flex-wrap:wrap; justify-content:center; align-content:flex-start;">
            ${shops.map(s => {
                const idx = p.chosen.indexOf(s.id);
                const sel = idx >= 0;
                return `<div onclick="toggleMallShop(${s.id})" style="position:relative; cursor:pointer; margin:5px; padding:10px 12px; width:160px; text-align:center; border-radius:12px;
                    background:${sel ? '#1a7a4a' : '#0f3460'}; border:3px solid ${sel ? '#2ecc71' : '#3498db'}; color:white;">
                    ${sel ? `<div style="position:absolute; top:-10px; right:-8px; background:#FFD700; color:#000; font-weight:bold; width:26px; height:26px; border-radius:50%; line-height:26px;">${idx + 1}</div>` : ''}
                    <div style="font-size:1.8em;">${s.emoji}</div>
                    <div style="font-weight:bold; font-size:0.9em; margin:2px 0;">${s.name}</div>
                    <div style="color:#aaa; font-size:0.78em;">${s.catName} · <span style="color:#2ecc71">${'$'.repeat(s.tier)}</span></div>
                    <div style="font-size:1em; margin-top:3px;">${s.items.slice(0, 4).map(i => i.emoji).join(' ')}</div>
                </div>`;
            }).join('')}
        </div>
        <div style="margin-top:8px;">
            <button onclick="startMallTrip()" ${p.chosen.length === 3 ? '' : 'disabled'} style="padding:11px 28px; border:none; border-radius:12px; font-size:1.05em; font-weight:bold;
                cursor:${p.chosen.length === 3 ? 'pointer' : 'not-allowed'}; background:${p.chosen.length === 3 ? '#27ae60' : '#555'}; color:white;">
                ${p.chosen.length === 3 ? '🚗 Go to the mall!' : `Pick ${3 - p.chosen.length} more`}</button>
            <button onclick="cancelMallPicker()" style="margin-left:8px; padding:10px 16px; border:none; border-radius:10px; background:#555; color:white; cursor:pointer;">✖ Cancel</button>
        </div>`;
    const inp = document.getElementById('mall-search');
    if (inp && p.focusSearch) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function mallFilter(id) { if (mallPick) { mallPick.filter = id; mallPick.focusSearch = false; renderMallPicker(); } }
function mallSearch(v) { if (mallPick) { mallPick.search = v; mallPick.focusSearch = true; renderMallPicker(); } }

function toggleMallShop(id) {
    if (!mallPick) return;
    const i = mallPick.chosen.indexOf(id);
    if (i >= 0) mallPick.chosen.splice(i, 1);
    else if (mallPick.chosen.length < 3) mallPick.chosen.push(id);
    renderMallPicker();
}

function cancelMallPicker() {
    removeMallOverlay('mall-pick');
    mallPick = null;
    player.lastMallDay = mallDayKey();
    setMallPause(false);
    saveGame();
}

function startMallTrip() {
    if (!mallPick || mallPick.chosen.length !== 3) return;
    mallTrip = { mode: 'trip', ids: mallPick.chosen.slice(), budget: MALL_BUDGET, index: 0, bought: [] };
    mallPick = null;
    removeMallOverlay('mall-pick');
    player.lastMallDay = mallDayKey();
    saveGame();
    setMallPause(false);                           // the car ride pauses the clock by itself
    if (!driveTo('to the mall', '🛍️', openMall)) openMall();
}

// ---------------------------------------------
// 3. The 3D mall
// ---------------------------------------------
function mallBox(grp, w, h, d, x, y, z, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    m.receiveShadow = true;
    grp.add(m);
    return m;
}

function openMall() {
    if (!mallTrip || mall3D || !scene || !playerMesh) return;
    setMallPause(true);

    // Put the house away (we bring it all back in leaveMall) — but keep YOU in the scene
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj !== playerMesh && obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') { stash.push(obj); scene.remove(obj); }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0;
    const savedBg = scene.background;
    const saved = { pos: playerMesh.position.clone(), rotY: playerMesh.rotation.y };
    scene.background = new THREE.Color(0x2b2b3d);

    const g0 = new THREE.Group(), g1 = new THREE.Group();     // ground floor, level 1
    g1.position.y = LEVEL_H;
    scene.add(g0, g1);
    const groups = [g0, g1];
    const colliders = [[], []];
    const b0 = (w, h, d, x, y, z, c) => mallBox(g0, w, h, d, x, y, z, c);
    const b1 = (w, h, d, x, y, z, c) => mallBox(g1, w, h, d, x, y, z, c);

    const stalls = mallFoodCourtRestaurants().map(r => ({ r }));       // today's 6 food-court restaurants
    buildMallGround(g0, b0, colliders[0]);
    buildMallLevel1(g1, b1, colliders[1], stalls);

    // ---- the shops: 24 on the ground floor, 20 on level 1 ----
    const slots = [];
    for (let level = 0; level < 2; level++) {
        const n = level === 0 ? MALL_SLOTS_G : MALL_SLOTS_1;
        for (let side = -1; side <= 1; side += 2) for (let i = 0; i < n; i++) slots.push({ level, side, i });
    }
    const errand = mallTrip.mode !== 'trip';                                    // errand and dinner: every ordinary shop is open to browse
    const seedKey = errand ? mallTrip.mode : mallTrip.ids.join(',');
    const rngSlots = seededRandom(seedFromText('mallslots|' + seedKey));
    const chosenSlots = errand ? [] : shuffledCopy(slots, rngSlots).slice(0, 3);
    // Dinner: the 3 restaurants Mom & Dad suggested have storefronts on Level 1 (restaurant row)
    const dinnerSlots = mallTrip.mode === 'dinner' ? shuffledCopy(slots.filter(s => s.level === 1), rngSlots).slice(0, 3) : [];
    const otherIds = shuffledCopy(Array.from({ length: MALL_SHOP_COUNT }, (_, k) => k).filter(k => !mallTrip.ids.includes(k)), seededRandom(seedFromText('mallother|' + seedKey)));
    const stores = [];
    let otherK = 0, dinnerStore = null;
    slots.forEach(slot => {
        const di = dinnerSlots.findIndex(c => c.level === slot.level && c.side === slot.side && c.i === slot.i);
        if (di >= 0) {
            const r = mallTrip.options[di];
            const pseudo = { id: 1000 + r.id, name: r.name, emoji: r.emoji, catName: r.cuisine + ' restaurant', color: RESTAURANT_ACCENTS[r.cuisineId] || 0xC0392B, items: [] };
            const isPick = r.id === mallTrip.restaurant.id;
            const st = buildMallStore(pseudo, slot, isPick ? 0 : -1, groups[slot.level], colliders[slot.level]);
            st.restaurant = r;
            if (isPick) dinnerStore = st;
            stores.push(st);
            return;
        }
        const ci = chosenSlots.findIndex(c => c.level === slot.level && c.side === slot.side && c.i === slot.i);
        const shop = ci >= 0 ? getMallShop(mallTrip.ids[ci]) : getMallShop(otherIds[otherK++]);
        stores.push(buildMallStore(shop, slot, ci, groups[slot.level], colliders[slot.level]));
    });
    // shared walls between shops
    [0, 1].forEach(level => {
        const n = level === 0 ? MALL_SLOTS_G : MALL_SLOTS_1;
        [-1, 1].forEach(side => { for (let i = 0; i <= n; i++) {
            const x = mallSlotX(0) - 4 + i * 8;
            mallBox(groups[level], 0.4, 5.6, 4.6, x, 2.8, side * 8.3, 0xC9BFA8);
            colliders[level].push({ minX: x - 0.3, maxX: x + 0.3, minZ: side === -1 ? -10.6 : 6, maxZ: side === -1 ? -6 : 10.6 });
        } });
    });

    // ---- other shoppers, strolling along each floor ----
    const shoppers = [];
    for (let level = 0; level < 2; level++) for (let k = 0; k < 11; k++) {
        const g = buildParent(0, 0, [0x3498DB, 0xE74C3C, 0x27AE60, 0xF39C12, 0x8E44AD, 0x16A085, 0xE91E8C][k % 7], [0x4B2800, 0x222222, 0xCC8844, 0xFFD700][k % 4]);
        groups[level].add(g);                                  // lives on that floor (moves up with it)
        const homeZ = (Math.random() < 0.5 ? -1 : 1) * (3.4 + Math.random() * 2.2);   // stay in the side lanes (clear of the atrium and escalators)
        g.position.set(-50 + Math.random() * 100, 0, homeZ);
        shoppers.push({ g, level, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.8 + Math.random() * 1.0, z: homeZ });
    }

    // ---- Mom and Dad, and you ----
    const mom = buildParent(0, 0, 0x4169E1, 0x4B2800), dad = buildParent(0, 0, 0xC0392B, 0xFFD700);
    const start = { x: 0, z: 4.6 };
    mom.position.set(start.x - 1.2, 0, start.z + 0.8); dad.position.set(start.x - 1.2, 0, start.z - 0.4);
    playerMesh.position.set(start.x, playerMesh.position.y > 0.5 ? 0.9 : 0, start.z);
    playerMesh.rotation.y = Math.PI / 2;
    const youMarker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 28), new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; youMarker.add(ring);
    const tag = makeNameplateSprite(['⭐ You'], '#d4a017', 2.2, 0.6); tag.position.set(0, 2.8, 0); youMarker.add(tag);
    const ms = 1 / playerMesh.scale.x; youMarker.scale.set(ms, ms, ms);
    playerMesh.add(youMarker);
    const sky = new THREE.HemisphereLight(0xffffff, 0x998877, 0.6);
    scene.add(sky);
    scene.add(mom, dad);
    if (typeof isIndependent === 'function' && isIndependent()) { mom.visible = false; dad.visible = false; }   // grown-ups come alone

    mall3D = { stash, clickables, savedBg, saved, objs: [g0, g1, sky, mom, dad], groups, colliders, stores, shoppers, mom, dad, youMarker,
               chosen: [], level: 0, last: Date.now(), start: Date.now(), shopStore: null, groceryAskAt: 0, askOpen: false,
               stalls, dinnerStore, foodStall: null, foodTreat: (typeof isIndependent === 'function' && isIndependent()) ? 0 : 15, meals: 0 };   // adults pay for their own food
    if (mallTrip.mode === 'trip') mallTrip.ids.forEach(id => mall3D.chosen.push(stores.find(s => s.shop.id === id)));
    refreshMallTargets();
    document.getElementById('location-name').textContent = `🛍️ ${MALL_NAME}`;
    showMallHud();
    updateActionPanel();
    showEvent('🛍️', mallTrip.mode === 'dinner'
        ? `Dinner at ${MALL_NAME}! Take the escalator up to Level 1 — your restaurant, ${mallTrip.restaurant.name}, is on the restaurant row.`
        : mallTrip.mode === 'errand'
        ? `Welcome to ${MALL_NAME}! The 🛒 ${currentStoreChain().name} is at the far WEST end of the ground floor.`
        : `Welcome to ${MALL_NAME}! Your first stop: ${mall3D.chosen[0].shop.name}`);
    camera.position.set(playerMesh.position.x, 22, 18);
    camera.lookAt(playerMesh.position.x, 0, 0);
    maybeWitnessCrime('mall', 9000);          // a pickpocket, a shoplifter... (crime.js)
}

// ---- the ground floor: concourse, fountain + atrium, escalators, the grocery (west) and the department store (east) ----
function buildMallGround(g, box, col) {
    box(124, 0.2, 24, 0, -0.1, 0, 0xE8E0D0);                                           // floor
    [-48, -32, -16, 16, 32, 48].forEach(x => [-3.2, 3.2].forEach(z => { box(0.12, 3.4, 0.12, x, 1.7, z, 0x555555); box(0.55, 0.45, 0.55, x, 3.6, z, 0xFFF59D); }));   // lamp stands (they glow)
    for (let ix = -15; ix < 15; ix++) for (let iz = -3; iz < 3; iz++) {
        if ((ix + iz) % 2 === 0) box(4, 0.04, 4, ix * 4 + 2, 0.02, iz * 4 + 2, 0xD9CDB8);
    }
    // the east end: a big department store (closed doors, just for show)
    box(0.5, 6, 24, 60.5, 3, 0, 0x8E6E53);
    const dept = makeNameplateSprite(['GRAND EMPORIUM', '🏬 Department Store'], '#7b241c', 9, 2); dept.position.set(58, 5.2, 0); g.add(dept);
    // the west end: Utama Grocer — a wide open entrance; the end wall has a gap you walk through
    const ch = currentStoreChain();                                                    // today's grocery chain (street-styles.js)
    box(0.5, 6, 6, -60.5, 3, -9, ch.mallWall); box(0.5, 6, 6, -60.5, 3, 9, ch.mallWall);
    box(1.0, 1.6, 12, -59.8, 5.2, 0, ch.mallBeam);
    const gs = makeNameplateSprite([ch.name.toUpperCase(), ch.emoji + ' ' + ch.tagline], ch.mallSign, 10, 2.2); gs.position.set(-56, 5.8, 0); g.add(gs);
    [-3, 0, 3].forEach(z => { box(0.8, 1.2, 1.4, -57.5, 0.6, z, 0x9E9E9E); box(0.7, 0.2, 1.2, -57.5, 1.3, z, ch.mallBeam); });   // carts by the door
    box(8, 0.05, 11, -56, 0.03, 0, ch.mallMat);                                          // green mat at the entrance
    const gHint = makeNameplateSprite(['⬅️ Grocery'], ch.mallSign, 3, 0.8); gHint.position.set(-48, 3, 0); g.add(gHint);
    // the fountain in the atrium
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 20), new THREE.MeshLambertMaterial({ color: 0xBDBDBD })); basin.position.set(0, 0.3, 0); g.add(basin);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.62, 20), new THREE.MeshLambertMaterial({ color: 0x5DADE2 })); water.position.set(0, 0.32, 0); g.add(water);
    box(0.5, 2.4, 0.5, 0, 1.6, 0, 0xBDBDBD);
    col.push({ minX: -2.7, maxX: 2.7, minZ: -2.7, maxZ: 2.7 });
    // benches and plants
    [-18, 18].forEach(x => { box(3, 0.4, 0.9, x, 0.5, -1.2, 0x8B5A2B); box(3, 0.9, 0.2, x, 0.95, -1.6, 0x8B5A2B); col.push({ minX: x - 1.6, maxX: x + 1.6, minZ: -1.8, maxZ: -0.7 }); });
    [-46, -26, -10, 10, 26, 46].forEach((x, i) => {
        const z = i % 2 ? 4.8 : -4.8;
        box(0.9, 0.8, 0.9, x, 0.4, z, 0xA0522D); box(0.7, 0.9, 0.7, x, 1.2, z, 0x2E8B3C); box(0.5, 0.7, 0.5, x, 1.9, z, 0x38A04A);
    });
    // escalator ramps, with a sign at the bottom
    MALL_RAMPS.forEach(r => buildRamp(g, box, col, r, 'Level 1'));
    // wall-to-wall hall columns with ceiling lights
    for (let x = -50; x <= 50; x += 10) { box(0.2, 1.2, 0.2, x, 5.9, 0, 0x555555); box(1.2, 0.2, 1.2, x, 5.3, 0, 0xFFF2B0); }
}

function buildRamp(g, box, col, r, label) {
    const len = r.x1 - r.x0, ang = Math.atan2(LEVEL_H, len), run = Math.hypot(len, LEVEL_H);
    const cx = (r.x0 + r.x1) / 2;
    const ramp = new THREE.Group();
    ramp.position.set(cx, LEVEL_H / 2, 0);
    ramp.rotation.z = r.up === 1 ? ang : -ang;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(run, 0.3, RAMP_HALF_W * 2), new THREE.MeshLambertMaterial({ color: 0x78909C }));
    slab.position.y = -0.15; ramp.add(slab);
    for (let s = 0; s < 24; s++) {                                                     // steps
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, RAMP_HALF_W * 2 - 0.2), new THREE.MeshLambertMaterial({ color: 0xCFD8DC }));
        st.position.set(-run / 2 + 0.3 + s * (run / 24), 0.02, 0); ramp.add(st);
    }
    [-1, 1].forEach(sd => { const rail = new THREE.Mesh(new THREE.BoxGeometry(run, 0.9, 0.12), new THREE.MeshLambertMaterial({ color: 0x455A64 })); rail.position.set(0, 0.45, sd * (RAMP_HALF_W + 0.05)); ramp.add(rail); });
    g.add(ramp);
    [-1, 1].forEach(sd => col.push({ minX: r.x0, maxX: r.x1, minZ: sd * (RAMP_HALF_W + 0.05) - 0.12, maxZ: sd * (RAMP_HALF_W + 0.05) + 0.12 }));
    const bottomX = r.up === 1 ? r.x0 - 3 : r.x1 + 3;
    const sign = makeNameplateSprite([`⬆️ ${label}`, 'Escalator'], '#1565c0', 4.5, 1.3);
    sign.position.set(bottomX, 3.4, 0); g.add(sign);
}

// ---- level 1: floor with the atrium void and escalator holes, the food court, the cinema ----
function buildMallLevel1(g, box, col, stalls) {
    const F = (x1, x2, z1, z2) => box(x2 - x1, 0.2, z2 - z1, (x1 + x2) / 2, -0.1, (z1 + z2) / 2, 0xE9E3D6);
    F(-60, 60, -12, -3); F(-60, 60, 3, 12);                                              // the two big side strips
    F(-60, -34, -3, 3); F(-22, -12, -3, 3); F(12, 22, -3, 3); F(34, 60, -3, 3);         // the walkway ends
    F(-34, -22, 1.5, 3); F(-34, -22, -3, -1.5); F(22, 34, 1.5, 3); F(22, 34, -3, -1.5); // beside the escalators
    for (let ix = -15; ix < 15; ix++) for (let iz = -3; iz < 3; iz++) {
        const x = ix * 4 + 2, z = iz * 4 + 2;
        const inVoid = Math.abs(x) < 14 && Math.abs(z) < 4, inEsc = (Math.abs(x) > 20 && Math.abs(x) < 36) && Math.abs(z) < 3;
        if ((ix + iz) % 2 === 0 && !inVoid && !inEsc) box(4, 0.04, 4, x, 0.02, z, 0xD6CCB6);
    }
    // the atrium: a glass railing around the open void, so you can see the fountain below
    [[0, -3, 24, 0.2], [0, 3, 24, 0.2]].forEach(([x, z, w, d]) => box(w, 1.1, d, x, 0.55, z, 0x90CAF9));
    [-12, 12].forEach(x => box(0.2, 1.1, 6, x, 0.55, 0, 0x90CAF9));
    col.push({ minX: -12.3, maxX: 12.3, minZ: -3.3, maxZ: 3.3 });
    // escalator holes: rails on both sides (the ramps themselves are in the ground-floor group)
    MALL_RAMPS.forEach(r => [-1, 1].forEach(sd => {
        box(r.x1 - r.x0, 1.0, 0.2, (r.x0 + r.x1) / 2, 0.5, sd * (RAMP_HALF_W + 0.05), 0x455A64);
        col.push({ minX: r.x0, maxX: r.x1, minZ: sd * (RAMP_HALF_W + 0.05) - 0.12, maxZ: sd * (RAMP_HALF_W + 0.05) + 0.12 });
    }));
    // the west end: the cinema (closed doors, just for show)
    box(0.5, 6, 24, -60.5, 3, 0, 0x4A235A);
    const cin = makeNameplateSprite(['UTAMA CINEMAS', '🎬 Now showing'], '#4a235a', 9, 2); cin.position.set(-58, 5.2, 0); g.add(cin);
    // the east end: the FOOD COURT — tables, chairs and food stalls
    box(0.5, 6, 24, 60.5, 3, 0, 0xB9770E);
    const fc = makeNameplateSprite(['FOOD COURT', '🍜 🍕 🍔 🍦'], '#b9770e', 9, 2); fc.position.set(57, 5.2, 0); g.add(fc);
    [[40, -6.5], [40, 6.5], [46, -6.5], [46, 6.5], [52, -6.5], [52, 6.5]].forEach(([x, z], k) => {
        box(1.8, 0.12, 1.8, x, 1.0, z, 0xFFFFFF); box(0.3, 0.95, 0.3, x, 0.5, z, 0x555555);
        [[-1.4, 0], [1.4, 0]].forEach(([dx]) => box(0.7, 0.6, 0.7, x + dx, 0.35, z, [0xE74C3C, 0x3498DB, 0xF1C40F][k % 3]));
        col.push({ minX: x - 1.3, maxX: x + 1.3, minZ: z - 1.1, maxZ: z + 1.1 });
        const food = makeEmojiSprite(['🍜', '🍕', '🍔', '🍛', '🍦', '🥗'][k], 0.9); food.position.set(x, 1.7, z); g.add(food);
    });
    // the 6 food stalls along the walls — real restaurants from the 300 (a different 6 every day). Walk up to one to eat!
    stalls.forEach((st, idx) => {
        const z = idx < 3 ? -9.5 : 9.5, x = [38, 46, 54][idx % 3];
        st.x = x; st.z = z; st.side = z < 0 ? -1 : 1;
        const accent = RESTAURANT_ACCENTS[st.r.cuisineId] || 0xC0392B;
        box(5, 1.2, 1.4, x, 0.6, z, 0x6D4C41); box(5.4, 0.3, 1.8, x, 3.2, z, accent);
        box(5, 0.1, 0.9, x, 1.25, z - st.side * 0.1, 0xD7B98A);
        const sign = makeNameplateSprite([st.r.name, st.r.emoji + ' ' + st.r.cuisine], '#' + accent.toString(16).padStart(6, '0'), 5.2, 1.3);
        sign.position.set(x, 4.4, z * 0.9); g.add(sign);
        const food = makeEmojiSprite(st.r.menu.mains[1].emoji, 1.0); food.position.set(x, 2.0, z - st.side * 0.3); g.add(food);
        col.push({ minX: x - 2.6, maxX: x + 2.6, minZ: z < 0 ? -10.2 : 8.6, maxZ: z < 0 ? -8.6 : 10.2 });
    });
    // ceiling beams (the glass roof frame)
    for (let x = -50; x <= 50; x += 10) box(0.3, 0.3, 24, x, 8, 0, 0x777777);
}

// One shop: back wall, shelves, counter, a sign. Returns { shop, level, x, side, rope, marker, blocker, done }.
function buildMallStore(shop, slot, chosenIndex, grp, col) {
    const x = mallSlotX(slot.i), s = slot.side;           // s = -1 north side, +1 south side
    const tint = shop.color;
    const box = (w, h, d, bx, by, bz, c) => mallBox(grp, w, h, d, bx, by, bz, c);
    box(7.4, 0.05, 4.6, x, 0.03, s * 8.3, 0xF2EBDD);                       // shop floor
    box(7.6, 5.6, 0.3, x, 2.8, s * 10.6, tint);                            // back wall
    [1.0, 2.2, 3.4].forEach((y, k) => {                                    // shelves with goods
        box(6.4, 0.18, 0.7, x, y, s * 10.1, 0x8B5A2B);
        for (let g = 0; g < 7; g++) box(0.5, 0.6, 0.4, x - 2.9 + g * 0.97, y + 0.4, s * 10.1, [0xE74C3C, 0xF1C40F, 0x3498DB, 0x2ECC71, 0xFFFFFF, 0xE91E63][(g + k + slot.i) % 6]);
    });
    box(2.8, 1.1, 0.9, x + 1.8, 0.55, s * 8.6, 0x6D4C41);                  // counter
    box(7.6, 1.4, 0.5, x, 5.0, s * 6.1, tint);                             // the beam above the entrance
    const sign = makeNameplateSprite([shop.name, shop.emoji + ' ' + shop.catName], '#' + tint.toString(16).padStart(6, '0'), 6.4, 1.5);
    sign.position.set(x, 6.7, s * 6.1);
    grp.add(sign);
    decorateMallStore(shop, x, s, slot, grp, box);                           // facade, awning and window displays by category
    const rope = box(7.2, 0.7, 0.12, x, 0.6, s * 6.4, 0xC0392B);           // a rope across the door while it's closed to you
    const blocker = { minX: x - 3.7, maxX: x + 3.7, minZ: s === -1 ? -10.6 : 6.3, maxZ: s === -1 ? -6.3 : 10.6, disabled: false };
    col.push(blocker);
    let marker = null;
    if (chosenIndex >= 0) {                                                // your trip's shops get a bouncing arrow
        marker = makeEmojiSprite('⬇️', 1.6);
        marker.position.set(x, 4.0, s * 4.8);
        marker.visible = false;
        grp.add(marker);
    }
    const store = { shop, level: slot.level, x, side: s, rope, marker, blocker, done: false, chosenIndex, bought: [] };
    blocker.store = store;
    return store;
}

// Each kind of shop gets its own front: pillars + awning style, a topper above the sign, and props inside
// (mannequins, screens, cake stand, bookshelves...). Purely decorative — slots, blockers and markers are untouched.
const MALL_FACADES = {
    toys:    { pier: 0xC0392B, awn: ['stripe', 0xE74C3C, 0xFFEB3B], floor: 0xFFF3C4 },
    clothes: { pier: 0x6C3483, awn: ['flat', 0x9B59B6, 0xE8DAEF], floor: 0xF4ECF7 },
    shoes:   { pier: 0x1F618D, awn: ['slope', 0x2980B9, 0xFFFFFF], floor: 0xD6EAF8 },
    books:   { pier: 0x6E4B2A, awn: ['flat', 0x117864, 0xD4AC0D], floor: 0xE8D5B0 },
    games:   { pier: 0x17202A, awn: ['none', 0x34495E, 0x00E5FF], floor: 0x2C3E50 },
    sports:  { pier: 0x1E8449, awn: ['slope', 0x27AE60, 0xFFFFFF], floor: 0xD5F5E3 },
    candy:   { pier: 0xE91E63, awn: ['scallop', 0xF48FB1, 0xFFFFFF], floor: 0xFCE4EC },
    pets:    { pier: 0xA04000, awn: ['stripe', 0xD35400, 0xFAD7A0], floor: 0xF6DDCC },
    art:     { pier: 0xB9770E, awn: ['scallop', 0xF39C12, 0x5DADE2], floor: 0xFEF9E7 },
    snacks:  { pier: 0x138D75, awn: ['stripe', 0x1ABC9C, 0xFFFFFF], floor: 0xD1F2EB }
};

function decorateMallStore(shop, x, s, slot, grp, box) {
    const st = MALL_FACADES[shop.catId];
    if (!st) return;                                              // restaurants keep the plain front
    const Z = d => s * d;
    const mesh = (geo, c, px, py, pz, basic) => {
        const m = new THREE.Mesh(geo, basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshLambertMaterial({ color: c }));
        m.position.set(px, py, pz); grp.add(m); return m;
    };
    const sph = (r, px, py, pz, c) => mesh(new THREE.SphereGeometry(r, 10, 8), c, px, py, pz);
    const cyl = (r, h, px, py, pz, c) => mesh(new THREE.CylinderGeometry(r, r, h, 10), c, px, py, pz);
    const cone = (r, h, px, py, pz, c) => mesh(new THREE.ConeGeometry(r, h, 10), c, px, py, pz);
    // pillars, a coloured shop floor, and the awning
    [-3.55, 3.55].forEach(dx => box(0.4, 5.0, 0.4, x + dx, 2.5, Z(6.15), st.pier));
    box(7.2, 0.04, 4.4, x, 0.08, Z(8.3), st.floor);
    const [kind, c1, c2] = st.awn;
    if (kind === 'stripe') { for (let i = 0; i < 8; i++) box(0.9, 0.1, 1.0, x - 3.15 + i * 0.9, 3.9, Z(5.65), i % 2 ? c1 : c2).rotation.x = s * 0.4; }
    else if (kind === 'scallop') { box(7.4, 0.14, 0.9, x, 4.0, Z(5.7), c1); for (let i = 0; i < 9; i++) cyl(0.3, 0.12, x - 3.2 + i * 0.8, 3.85, Z(5.2), i % 2 ? c1 : c2).rotation.x = Math.PI / 2; }
    else if (kind === 'slope') { box(7.4, 0.12, 1.1, x, 3.95, Z(5.6), c1).rotation.x = s * 0.45; box(7.4, 0.08, 0.1, x, 3.55, Z(5.25), c2); }
    else if (kind === 'flat') { box(7.6, 0.2, 1.0, x, 4.0, Z(5.7), c1); box(7.6, 0.08, 0.1, x, 3.85, Z(5.2), c2); }
    else { mesh(new THREE.BoxGeometry(7.6, 0.12, 0.3), c2, x, 4.2, Z(5.9), true); }       // 'none': the games shop has a neon strip instead
    switch (shop.catId) {
        case 'toys':
            sph(0.55, x - 2.9, 0.9, Z(7.2), 0xB5651D); sph(0.4, x - 2.9, 1.65, Z(7.2), 0xB5651D); sph(0.14, x - 3.2, 1.95, Z(7.2), 0xB5651D); sph(0.14, x - 2.6, 1.95, Z(7.2), 0xB5651D);
            for (let i = 0; i < 6; i++) box(0.5, 0.5, 0.5, x - 2.0 + (i % 3) * 0.55, 0.35 + Math.floor(i / 3) * 0.55, Z(7.0), [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71, 0x9B59B6, 0xFF9800][i]);
            [-1, 0, 1].forEach((k, i) => { cyl(0.03, 1.6, x - 1.0 + k * 0.6, 1.3, Z(9.4), 0xDDDDDD); sph(0.32, x - 1.0 + k * 0.6, 2.3, Z(9.4), [0xE74C3C, 0x3498DB, 0xF1C40F][i]); });
            for (let i = 0; i < 4; i++) box(0.55, 0.55, 0.12, x - 2.4 + i * 1.6, 7.9, Z(6.1), [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71][i]);   // ABC blocks above the sign
            break;
        case 'clothes':
            [-3.0, -1.6, -0.3].forEach((dx, i) => {                                       // mannequins
                cyl(0.04, 1.0, x + dx, 0.55, Z(7.0), 0x888888); box(0.7, 0.9, 0.35, x + dx, 1.5, Z(7.0), [0xE91E63, 0x3498DB, 0xF1C40F][i]);
                sph(0.2, x + dx, 2.2, Z(7.0), 0xEEEEEE); box(0.6, 0.05, 0.6, x + dx, 0.08, Z(7.0), 0x333333);
            });
            box(4.8, 0.08, 0.08, x - 0.4, 2.4, Z(9.2), 0xB0BEC5);                           // clothes rail
            for (let i = 0; i < 8; i++) box(0.35, 0.8, 0.12, x - 2.5 + i * 0.6, 1.9, Z(9.2), [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71, 0xFFFFFF, 0x9B59B6][i % 6]);
            box(1.6, 0.5, 0.12, x, 7.7, Z(6.1), 0xF8BBD0);
            break;
        case 'shoes':
            [0, 1, 2].forEach(i => box(2.0 - i * 0.5, 0.35, 1.0, x - 2.2, 0.2 + i * 0.35, Z(7.2), 0xECEFF1));   // display steps
            [0, 1, 2].forEach(i => box(0.7, 0.28, 0.3, x - 2.0 - i * 0.2, 0.55 + i * 0.35, Z(7.2), [0xE74C3C, 0x2ECC71, 0xF1C40F][i]));
            box(1.4, 0.6, 0.6, x - 0.4, 0.4, Z(7.0), 0xFFFFFF); box(0.7, 0.5, 0.58, x - 0.1, 0.8, Z(7.0), 0xE74C3C);   // a giant sneaker
            for (let i = 0; i < 5; i++) box(0.7, 0.4, 0.5, x - 2.0 + i * 0.8, 0.25, Z(9.6), [0x8D6E63, 0xFFFFFF, 0x2980B9][i % 3]);
            box(2.0, 0.7, 0.14, x, 7.8, Z(6.1), 0x2980B9);
            break;
        case 'books':
            [-1, 1].forEach(sd => {
                box(0.5, 4.2, 3.4, x + sd * 3.35, 2.1, Z(8.3), 0x6E4B2A);
                for (let i = 0; i < 12; i++) box(0.4, 0.5, 0.14, x + sd * 3.2, 0.6 + Math.floor(i / 4) * 1.3, Z(6.9 + (i % 4) * 0.8), [0xC0392B, 0x2980B9, 0x27AE60, 0xF1C40F, 0x8E44AD][i % 5]);
            });
            box(1.1, 0.7, 1.0, x - 1.8, 0.45, Z(7.6), 0xB03A2E); box(1.1, 0.9, 0.2, x - 1.8, 1.0, Z(8.1), 0xB03A2E);   // reading armchair
            cyl(0.04, 1.6, x - 0.7, 0.9, Z(8.3), 0x555555); cone(0.35, 0.35, x - 0.7, 1.8, Z(8.3), 0xFFE082);
            box(1.4, 0.15, 1.0, x - 0.8, 7.9, Z(6.1), 0xF5F5DC).rotation.z = 0.2; box(1.4, 0.15, 1.0, x + 0.6, 7.9, Z(6.1), 0xF5F5DC).rotation.z = -0.2;   // open book topper
            break;
        case 'games':
            [0, 1, 2, 3].forEach(i => { box(1.3, 0.9, 0.1, x - 3.0 + i * 1.6, 3.4, Z(10.35), 0x111111); mesh(new THREE.BoxGeometry(1.1, 0.7, 0.06), [0x00E5FF, 0xFF4081, 0x76FF03, 0xFFEA00][i], x - 3.0 + i * 1.6, 3.4, Z(10.28), true); });
            [-3.0, -1.4].forEach(dx => { box(1.2, 0.8, 0.8, x + dx, 0.4, Z(7.4), 0x263238); mesh(new THREE.BoxGeometry(1.0, 0.6, 0.06), 0x40C4FF, x + dx, 1.3, Z(7.0), true); });
            [0x00E5FF, 0xFF4081].forEach((c, i) => mesh(new THREE.BoxGeometry(3.4, 0.14, 0.14), c, x - 1.8 + i * 3.6, 4.6, Z(6.1), true));   // neon strips
            box(2.4, 0.9, 0.2, x, 7.8, Z(6.1), 0x111111); mesh(new THREE.BoxGeometry(2.2, 0.7, 0.1), 0x76FF03, x, 7.8, Z(6.0), true);
            break;
        case 'sports':
            [[0xFF9800, 0.4], [0xFFFFFF, 0.35], [0xCDDC39, 0.2], [0xE74C3C, 0.4]].forEach(([c, r], i) => sph(r, x - 3.0 + i * 0.8, 0.5 + (i % 2) * 0.3, Z(7.0), c));
            box(2.6, 0.12, 0.7, x - 2.0, 0.9, Z(7.0), 0x7F8C8D);
            [0, 1].forEach(i => mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 14), 0x222222, x - 1.0 + i * 1.1, 1.9, Z(9.7)));   // a bike hanging on the wall
            box(1.3, 0.06, 0.06, x - 0.45, 2.0, Z(9.7), 0xE74C3C);
            [0, 1, 2].forEach(i => sph(0.4, x - 1.6 + i * 1.6, 8.0, Z(6.1), [0xFF9800, 0xFFFFFF, 0xCDDC39][i]));
            break;
        case 'candy':
            [0, 1, 2].forEach(i => { cyl(0.35, 0.9, x - 3.0 + i * 0.9, 0.55, Z(7.0), 0xE1F5FE); sph(0.3, x - 3.0 + i * 0.9, 1.1, Z(7.0), [0xE91E63, 0xFFEB3B, 0x4CAF50][i]); });   // candy jars
            cyl(0.9, 0.5, x - 1.2, 0.35, Z(7.8), 0xFFFFFF); cyl(0.65, 0.45, x - 1.2, 0.85, Z(7.8), 0xF8BBD0); sph(0.15, x - 1.2, 1.2, Z(7.8), 0xD50000);   // a layer cake
            cyl(0.05, 2.0, x - 3.2, 1.2, Z(9.2), 0xFFFFFF); sph(0.5, x - 3.2, 2.4, Z(9.2), 0xE91E63);                                                 // giant lollipop
            sph(0.45, x - 1.2, 8.0, Z(6.1), 0xE91E63); sph(0.45, x + 0.2, 8.0, Z(6.1), 0xFFEB3B); sph(0.45, x + 1.6, 8.0, Z(6.1), 0x4CAF50);
            break;
        case 'pets':
            box(1.8, 1.0, 0.8, x - 2.4, 0.9, Z(7.6), 0x80DEEA); box(1.6, 0.8, 0.7, x - 2.4, 0.9, Z(7.6), 0x29B6F6);                                   // aquarium
            [0, 1, 2].forEach(i => box(0.2, 0.1, 0.1, x - 2.9 + i * 0.5, 0.8 + (i % 2) * 0.25, Z(7.6), 0xFF9800));
            box(0.9, 0.4, 0.9, x - 1.0, 0.3, Z(8.6), 0xFFCC80);                                                                                         // dog bed
            for (let i = 0; i < 3; i++) box(0.7, 0.6, 0.12, x - 2.4 + i * 1.0, 3.0, Z(10.3), 0x78909C);                                                   // cages
            sph(0.4, x - 0.6, 7.9, Z(6.1), 0x8D4B1A); [-0.5, -0.17, 0.17, 0.5].forEach(dx => sph(0.15, x - 0.6 + dx * 1.2, 8.45, Z(6.1), 0x8D4B1A));   // a paw
            break;
        case 'art':
            [-3.0, -1.7].forEach((dx, i) => { [-0.35, 0.35].forEach(l => box(0.07, 1.7, 0.07, x + dx + l, 0.85, Z(7.2), 0x8D6E63)); box(0.9, 1.0, 0.07, x + dx, 1.5, Z(6.95), 0xFFFFFF); box(0.5, 0.4, 0.08, x + dx - 0.1, 1.5, Z(6.9), [0xE74C3C, 0x3498DB][i]); });   // easels
            cyl(0.5, 0.06, x - 0.4, 0.9, Z(7.5), 0xD7B98A); [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71].forEach((c, i) => sph(0.1, x - 0.6 + (i % 2) * 0.35, 0.98, Z(7.4 + (i > 1 ? 0.3 : 0)), c));   // a paint palette
            [0xE74C3C, 0x3498DB, 0xF1C40F].forEach((c, i) => sph(0.35, x - 1.8 + i * 1.5, 8.0, Z(6.1), c));
            break;
        case 'snacks':
            [-3.0, -2.0, -1.0].forEach(dx => { cyl(0.2, 0.08, x + dx, 0.9, Z(7.3), 0xFFFFFF); cyl(0.04, 0.9, x + dx, 0.45, Z(7.3), 0x888888); });   // stools
            box(1.0, 1.2, 0.1, x - 3.2, 1.8, Z(9.8), 0x2C3E50); box(0.8, 0.9, 0.12, x - 3.2, 1.8, Z(9.75), 0xFFFFFF);                                    // menu board
            cone(0.55, 1.2, x, 7.8, Z(6.1), 0xE8B87D).rotation.x = Math.PI; sph(0.5, x, 8.6, Z(6.1), 0xF8BBD0); sph(0.25, x, 9.1, Z(6.1), 0xD50000);      // ice-cream cone topper
            break;
    }
}

function currentMallStore() {
    return mall3D && mallTrip && mallTrip.mode === 'trip' && mallTrip.index < 3 ? mall3D.chosen[mallTrip.index] : null;
}

// Trip: only the shop it's your turn for is open. Errand: every shop is open to browse.
function refreshMallTargets() {
    const cur = currentMallStore();
    const m = mall3D, mode = mallTrip.mode;
    m.stores.forEach(st => {
        // restaurants are only open if they're tonight's pick; ordinary shops: all open (errand/dinner) or just your current one (trip)
        const open = st.restaurant ? st === m.dinnerStore : (mode === 'trip' ? st === cur : true);
        st.rope.visible = !open;
        st.blocker.disabled = open;
        if (st.marker) st.marker.visible = mode === 'dinner' ? st === m.dinnerStore : st === cur;
    });
}

// Today's 6 food-court restaurants (a different 6 every day, always 6 different kinds of food)
function mallFoodCourtRestaurants() {
    const rng = seededRandom(seedFromText('foodcourt|' + mallDayKey()));
    return shuffledCopy(CUISINES.map((c, i) => i), rng).slice(0, 6)
        .map(c => getRestaurant(c + CUISINES.length * Math.floor(rng() * RESTAURANTS_PER_CUISINE)));
}

// Dinner: Mom & Dad drive you to the mall; your restaurant is on Level 1 (called from dinner.js)
function startMallDinner(r, options) {
    if (!scene || driving || inMall) return false;
    mallTrip = { mode: 'dinner', ids: [], budget: 0, index: 0, bought: [], restaurant: r, options };
    if (!driveTo('to ' + MALL_NAME, '🍽️', openMall)) openMall();
    return true;
}

// Called by leaveRestaurant() in dinner.js: dinner is over, you're back in the mall
function onMallDinnerDone() {
    const m = mall3D;
    if (!m) { driveTo('home', '🏠', null, { duration: 3200 }); return; }
    m.last = Date.now();
    m.level = 1;
    document.getElementById('location-name').textContent = `🛍️ ${MALL_NAME}`;
    updateMallHud(); updateActionPanel();
    showEvent('🏠', 'That was a yummy dinner! Mom & Dad say it\'s time to head home.');
    setTimeout(() => { if (mall3D) leaveMall(); }, 1800);
}

function showMallHud() {
    removeMallOverlay('mall-hud');
    const el = document.createElement('div');
    el.id = 'mall-hud';
    el.style.cssText = 'position:fixed; top:56px; left:0; right:0; z-index:240; text-align:center; pointer-events:none; font-family:Arial;';
    el.innerHTML = '<span id="mall-hud-text" style="display:inline-block; background:rgba(22,33,62,0.9); border:2px solid #e91e63; color:#fff; padding:7px 18px; border-radius:14px;"></span>';
    document.body.appendChild(el);
    updateMallHud();
}

function updateMallHud() {
    const el = document.getElementById('mall-hud-text');
    if (!el || !mallTrip) return;
    const lvl = mall3D ? (mall3D.level === 1 ? '⬆️ Level 1' : 'Ground floor') : '';
    if (mallTrip.mode === 'errand') {
        el.innerHTML = `🛒 Errand: walk WEST to <b style="color:#2ecc71">${currentStoreChain().name}</b> and do the shopping &nbsp;|&nbsp; ${lvl} &nbsp;|&nbsp; 💰 $${player.money}`;
        return;
    }
    if (mallTrip.mode === 'dinner') {
        const r = mallTrip.restaurant;
        el.innerHTML = `🍽️ Dinner: walk to <b style="color:#FFD700">${r.emoji} ${r.name}</b> on <b>Level 1</b> (take the escalator!) — follow the ⬇️ &nbsp;|&nbsp; ${lvl} &nbsp;|&nbsp; 🍜 Food court on Level 1 too`;
        return;
    }
    const cur = currentMallStore();
    el.innerHTML = cur
        ? `🛍️ Shop <b>${mallTrip.index + 1} of 3</b>: <b style="color:#FFD700">${cur.shop.emoji} ${cur.shop.name}</b> (${cur.level === 1 ? 'Level 1' : 'Ground floor'}) — follow the ⬇️ &nbsp;|&nbsp; ${lvl} &nbsp;|&nbsp; 💳 <b style="color:#2ecc71">$${mallTrip.budget}</b>`
        : '🎉 All 3 shops done! Time to go home.';
}

// ---------------------------------------------
// Moving around (runs every frame from animate() in world.js)
// ---------------------------------------------
function mallRampAt(x, z) {
    if (Math.abs(z) > RAMP_HALF_W - 0.1) return null;
    return MALL_RAMPS.find(r => x >= r.x0 && x <= r.x1) || null;
}

function resolveMallCollisions(pos, radius, list) {
    list.forEach(r => {
        if (r.disabled) return;
        const minX = r.minX - radius, maxX = r.maxX + radius, minZ = r.minZ - radius, maxZ = r.maxZ + radius;
        if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
            const l = pos.x - minX, rr = maxX - pos.x, u = pos.z - minZ, d = maxZ - pos.z, m = Math.min(l, rr, u, d);
            if (m === l) pos.x = minX; else if (m === rr) pos.x = maxX; else if (m === u) pos.z = minZ; else pos.z = maxZ;
        }
    });
    pos.x = Math.max(MALL_BOUNDS.minX, Math.min(MALL_BOUNDS.maxX, pos.x));
    pos.z = Math.max(MALL_BOUNDS.minZ, Math.min(MALL_BOUNDS.maxZ, pos.z));
}

function updateMall() {
    const m = mall3D;
    if (!m) return;
    const now = Date.now();
    const dt = Math.min(0.05, (now - m.last) / 1000);
    m.last = now;
    const t = (now - m.start) / 1000;
    const p = playerMesh.position;
    const busy = m.shopStore || m.askOpen || m.foodStall;

    if (!busy) {
        let dx = 0, dz = 0;
        { const mv = getMoveInput(); dx = mv.x; dz = mv.z; }       // (first person turns this into where you look: firstperson.js)
        if (dx || dz) {
            const len = Math.hypot(dx, dz);
            p.x += dx / len * MALL_WALK_SPEED * dt;
            p.z += dz / len * MALL_WALK_SPEED * dt;
            playerMesh.rotation.y = Math.atan2(dx, dz);
            resolveMallCollisions(p, 0.45, m.colliders[m.level]);
        }
    }

    // Escalator ramps: your height follows the slope; at the ends you're on a floor
    const ramp = mallRampAt(p.x, p.z);
    let y;
    if (ramp) {
        const tt = ramp.up === 1 ? (p.x - ramp.x0) / (ramp.x1 - ramp.x0) : (ramp.x1 - p.x) / (ramp.x1 - ramp.x0);
        y = LEVEL_H * Math.max(0, Math.min(1, tt));
        m.rampY = y; m.wasRamp = true;
    } else {
        if (m.wasRamp) { m.level = m.rampY > LEVEL_H / 2 ? 1 : 0; m.wasRamp = false; }   // stepped off the ramp: whichever end you left from
        y = m.level * LEVEL_H;
    }
    p.y = y + (player.age <= 4 ? 0.9 : 0);
    const prevVis = m.groups[1].visible;
    m.groups[1].visible = m.level === 1 || y > 3;
    if (prevVis !== m.groups[1].visible || m.lastLevel !== m.level) { m.lastLevel = m.level; updateMallHud(); }

    // Walking into a shop opens it (a trip: only your current shop; an errand: any shop)
    if (!busy && !ramp) {
        const free = mallTrip.mode !== 'trip';
        const cur = currentMallStore();
        const inside = s => s.level === m.level && Math.abs(p.x - s.x) < 3.2 && (s.side === -1 ? p.z < -6.8 : p.z > 6.8);
        const target = free ? m.stores.find(inside) : (cur && inside(cur) ? cur : null);
        if (target) { if (target.restaurant) enterMallRestaurant(target); else openMallShop(target); }
        // a food-court stall: walk up to the counter
        if (m.level === 1 && now > (m.foodAskAt || 0)) {
            const st = m.stalls.find(s => Math.abs(p.x - s.x) < 2.8 && s.side * p.z > 6.6);
            if (st) openFoodStall(st);
        }
        // the grocery store at the west end of the ground floor
        if (m.level === 0 && p.x < -55.5 && Math.abs(p.z) < 5.5 && now > m.groceryAskAt) askGrocery();
    }

    // Mom and Dad follow, a step or two behind (and up the escalator with you)
    [[m.mom, -1.6, 1.0], [m.dad, -1.6, -1.0]].forEach(([g, ox, oz]) => {
        const tx = p.x + ox, tz = p.z + oz, ddx = tx - g.position.x, ddz = tz - g.position.z, dist = Math.hypot(ddx, ddz);
        if (dist > 1.2) {
            const step = Math.min(dist, 4.4 * dt * Math.min(2.2, dist / 1.5));
            g.position.x += ddx / dist * step; g.position.z += ddz / dist * step;
            g.rotation.y = Math.atan2(ddx, ddz);
        }
        g.position.y += (y - g.position.y) * 0.25 + Math.abs(Math.sin(t * 8)) * 0.01;
        if (Math.abs(g.position.z) < RAMP_HALF_W && !mallRampAt(g.position.x, g.position.z)) { /* in the open lane — fine */ }
    });

    // Other shoppers stroll along their floor
    m.shoppers.forEach(sh => {
        sh.g.position.x += sh.dir * sh.speed * dt;
        sh.g.position.z = sh.z + Math.sin(t * 0.7 + sh.speed * 5) * 0.5;
        if (sh.g.position.x > 57 || sh.g.position.x < -57) sh.dir *= -1;
        sh.g.rotation.y = sh.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    });

    const cur2 = currentMallStore();
    if (cur2 && cur2.marker) cur2.marker.position.y = 4.0 + Math.sin(t * 4) * 0.35;

    // The camera follows you, down the concourse and up the escalators
    const cx = Math.max(-46, Math.min(46, p.x));
    camera.position.x += (cx - camera.position.x) * 0.12;
    camera.position.y += (22 + y - camera.position.y) * 0.12;
    camera.position.z = 18;
    camera.lookAt(camera.position.x, camera.position.y - 22, 0);
    renderer.render(scene, camera);
}

// ---------------------------------------------
// The grocery store (it's in the mall!)
// ---------------------------------------------
function askGrocery() {
    const m = mall3D;
    if (!m || m.askOpen || inStore) return;
    // on an errand, go straight in; on a trip, ask first
    if (mallTrip.mode === 'errand') { enterMallGrocery(); return; }
    m.askOpen = true;
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => keys[k] = false);
    const el = document.createElement('div');
    el.id = 'mall-grocery-ask';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); font-family:Arial;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #2e7d32; border-radius:16px; padding:24px 30px; text-align:center; max-width:380px;">
            <div style="font-size:2.4em;">🛒</div>
            <h2 style="color:#FFD700; margin:4px 0 8px;">${currentStoreChain().name}</h2>
            <p style="color:#ddd; margin-bottom:14px;">👩 Mom: "While we're here, can we pick up a few groceries?"</p>
            <button onclick="answerGrocery(true)" style="margin:4px; padding:10px 22px; border:none; border-radius:10px; background:#27ae60; color:white; font-weight:bold; cursor:pointer;">🛒 Sure!</button>
            <button onclick="answerGrocery(false)" style="margin:4px; padding:10px 20px; border:none; border-radius:10px; background:#555; color:white; cursor:pointer;">Not now</button>
        </div>`;
    document.body.appendChild(el);
}

function answerGrocery(yes) {
    removeMallOverlay('mall-grocery-ask');
    const m = mall3D;
    if (!m) return;
    m.askOpen = false;
    if (yes) enterMallGrocery();
    else { m.groceryAskAt = Date.now() + 15000; playerMesh.position.x = -50; }
}

function enterMallGrocery() {
    const m = mall3D;
    if (!m || inStore) return;
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => keys[k] = false);
    const hud = document.getElementById('mall-hud'); if (hud) hud.style.display = 'none';   // the mall banner would sit on top of the store
    openGroceryStore({ fromMall: true });          // store.js — the grocery, entered from the concourse
}

// Called by leaveStore() in store.js when you finish (or leave) the grocery
function onMallGroceryDone(done) {
    const m = mall3D;
    if (!m) { driveTo('home', '🏠', null, { duration: 3200 }); return; }
    m.last = Date.now();
    m.groceryAskAt = Date.now() + 20000;
    m.level = 0;
    const hud = document.getElementById('mall-hud'); if (hud) hud.style.display = '';
    playerMesh.position.set(-50, 0, 0);
    document.getElementById('location-name').textContent = `🛍️ ${MALL_NAME}`;
    updateMallHud(); updateActionPanel();
    if (mallTrip && mallTrip.mode === 'errand') {
        showEvent('🛒', done ? 'Groceries done! Mom & Dad say it\'s time to head home.' : 'Back in the mall. Time to head home!');
        setTimeout(() => { if (mall3D) leaveMall(); }, 1800);
    } else {
        showEvent('🛍️', 'Back in the mall!');
    }
}

// ---------------------------------------------
// 4. Inside a shop: buy things
// ---------------------------------------------
function openMallShop(store) {
    const m = mall3D;
    if (!m || m.shopStore) return;
    m.shopStore = store;
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => keys[k] = false);
    renderMallShop(store);
}

function renderMallShop(store) {
    removeMallOverlay('mall-shop');
    const shop = store.shop;
    const el = document.createElement('div');
    el.id = 'mall-shop';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial; overflow-y:auto; padding:14px;`;
    const budget = mallTrip.budget, money = player.money, trip = mallTrip.mode === 'trip';
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #${shop.color.toString(16).padStart(6, '0')}; border-radius:16px; padding:20px 26px; max-width:620px; width:100%; text-align:center;">
            <div style="font-size:2.2em;">${shop.emoji}</div>
            <h2 style="color:#FFD700; margin:2px 0;">${shop.name}</h2>
            <p style="color:#aaa; margin-bottom:6px;">${trip ? `Shop ${mallTrip.index + 1} of 3 · ` : ''}${shop.catName}</p>
            <p style="color:#2ecc71; margin-bottom:10px;">${trip ? `💳 Parents' budget: <b>$${budget}</b> &nbsp;|&nbsp; ` : ''}💰 Your money: <b>$${money}</b></p>
            <div style="display:flex; flex-wrap:wrap; justify-content:center;">
                ${shop.items.map((it, i) => {
                    const owned = store.bought.includes(i);
                    const can = !owned && (it.price <= budget || it.price - budget <= money);
                    const fx = [`<span style="color:#2ecc71">+${it.hap}😊</span>`,
                                it.health ? `<span style="color:${it.health > 0 ? '#2ecc71' : '#e74c3c'}">${it.health > 0 ? '+' : ''}${it.health}❤️</span>` : '',
                                it.edu ? `<span style="color:#5dade2">+${it.edu}📚</span>` : ''].join(' ');
                    return `<button onclick="buyMallItem(${i})" ${can ? '' : 'disabled'} style="margin:5px; padding:10px; width:170px; border-radius:12px; border:2px solid ${owned ? '#2ecc71' : '#3498db'};
                        background:${owned ? '#1a7a4a' : can ? '#0f3460' : '#2a2a3a'}; color:white; cursor:${can ? 'pointer' : 'not-allowed'}; opacity:${can || owned ? 1 : 0.55};">
                        <div style="font-size:1.8em;">${(shop.catId === 'candy' || shop.catId === 'snacks') && typeof foodImg === 'function' ? foodImg(it.emoji, it.name, 48, { force: true }) : it.emoji}</div>
                        <div style="font-size:0.9em; font-weight:bold;">${it.name}</div>
                        <div style="font-size:0.85em; margin-top:2px;">${owned ? '✅ Bought!' : '$' + it.price}</div>
                        <div style="font-size:0.78em; margin-top:2px;">${fx}</div></button>`;
                }).join('')}
            </div>
            <p style="color:#d9b99b; margin:8px 0; min-height:1.3em;">${store.bought.length ? 'In your bag: ' + store.bought.map(i => shop.items[i].emoji).join(' ') : "You don't have to buy anything — just looking is fine too!"}</p>
            <button onclick="finishMallShop()" style="padding:11px 26px; border:none; border-radius:12px; background:#3498db; color:white; font-size:1.05em; font-weight:bold; cursor:pointer;">
                ${trip ? (mallTrip.index < 2 ? '➡️ Next shop' : '🏠 That was my last shop!') : '🚪 Leave the shop'}</button>
        </div>`;
    document.body.appendChild(el);
}

function buyMallItem(i) {
    const m = mall3D;
    const store = m && m.shopStore;
    if (!store) return;
    const it = store.shop.items[i];
    if (store.bought.includes(i)) return;
    const fromBudget = Math.min(mallTrip.budget, it.price), fromMoney = it.price - fromBudget;
    if (fromMoney > player.money) return;
    mallTrip.budget -= fromBudget;
    player.money -= fromMoney;
    store.bought.push(i);
    mallTrip.bought.push(it);
    player.happiness = Math.min(100, player.happiness + it.hap);
    player.health = Math.max(0, Math.min(100, player.health + it.health));
    player.education = Math.min(100, player.education + it.edu);
    updateStats(); saveGame();
    updateMallHud();
    showEvent(it.emoji, `You bought ${it.name}! +${it.hap} happiness${it.edu ? `, +${it.edu} education` : ''}${fromMoney ? ` ($${fromMoney} was yours)` : ''}`);
    renderMallShop(store);
}

function finishMallShop() {
    const m = mall3D;
    const store = m && m.shopStore;
    removeMallOverlay('mall-shop');
    if (!store) return;
    m.shopStore = null;
    playerMesh.position.z = store.side * 4.6;            // step back out onto the concourse
    if (mallTrip.mode === 'trip' && store === currentMallStore()) {
        store.done = true;
        mallTrip.index++;
        refreshMallTargets();
        updateMallHud();
        const next = currentMallStore();
        if (next) showEvent('🚶', `Next stop: ${next.shop.name} (${next.level === 1 ? 'Level 1 — take the escalator up!' : 'ground floor'})`);
        else {
            showEvent('🎉', 'All 3 shops done! Mom & Dad say it\'s time to head home.');
            setTimeout(() => { if (mall3D) leaveMall(); }, 2200);
        }
    }
    updateActionPanel();
}

// ---------------------------------------------
// Dinner: walking into tonight's restaurant opens the full 3D restaurant (dinner.js / dinner-scene.js)
// ---------------------------------------------
function enterMallRestaurant(store) {
    const m = mall3D;
    if (!m || m.shopStore || inStore || restaurant3D || !dinner) return;
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => keys[k] = false);
    m.askOpen = false;
    openRestaurant();            // the waiter, the table, Mom & Dad order first and yours comes last
}

// ---------------------------------------------
// The FOOD COURT (Level 1, east end): real meals from real restaurants
// ---------------------------------------------
function openFoodStall(st) {
    const m = mall3D;
    if (!m || m.foodStall || m.shopStore) return;
    if (m.meals >= 2) {
        showEvent('🤰', "You're too full to eat anything else — two meals is plenty!");
        m.foodAskAt = Date.now() + 6000;
        playerMesh.position.z = st.side * 5.0;
        return;
    }
    m.foodStall = st;
    st.pick = { main: null, drink: null, dessert: null };
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => keys[k] = false);
    renderFoodStall(st);
}

function foodStallTotal(st) {
    const mn = st.r.menu, p = st.pick;
    return (p.main !== null ? mn.mains[p.main].price : 0) + (p.drink !== null ? mn.drinks[p.drink].price : 0) + (p.dessert !== null ? mn.desserts[p.dessert].price : 0);
}

function renderFoodStall(st) {
    removeMallOverlay('mall-food');
    const r = st.r, m = mall3D, p = st.pick;
    const total = foodStallTotal(st), have = m.foodTreat + player.money, can = p.main !== null && total <= have;
    const dish = (d, kind, i) => `<button onclick="foodPick('${kind}', ${i})" style="display:flex; justify-content:space-between; align-items:center; gap:8px; width:100%; margin:3px 0; padding:7px 10px;
        font-size:0.92em; text-align:left; cursor:pointer; color:white; border-radius:9px; background:${p[kind] === i ? '#1a7a4a' : '#0f3460'}; border:2px solid ${p[kind] === i ? '#2ecc71' : '#3498db'};">
        <span>${(typeof foodImg === 'function' ? foodImg(d.emoji, d.name, 28, { force: true }) : d.emoji)} ${d.name}${d.special ? ' <span style="color:#f1c40f; font-size:0.8em;">(special!)</span>' : ''}</span>
        <span style="white-space:nowrap; font-size:0.85em;"><span style="color:#2ecc71">+${d.hap}😊</span> ${d.health ? `<span style="color:${d.health > 0 ? '#2ecc71' : '#e74c3c'}">${d.health > 0 ? '+' : ''}${d.health}❤️</span>` : ''} <span style="color:#aaa">$${d.price}</span></span></button>`;
    const el = document.createElement('div');
    el.id = 'mall-food';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); font-family:Arial; overflow-y:auto; padding:14px;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #f39c12; border-radius:16px; padding:18px 24px; max-width:640px; width:100%;">
            <div style="text-align:center;">
                <div style="font-size:2em;">${r.emoji}</div>
                <h2 style="color:#FFD700; margin:2px 0;">${r.name}</h2>
                <p style="color:#aaa; margin-bottom:4px;">🍜 Food court · ${r.cuisine} · ⭐ ${r.rating.toFixed(1)} · <span style="color:#2ecc71">${'$'.repeat(r.tier)}</span></p>
                <p style="color:#2ecc71; margin-bottom:6px;">🍽️ Parents' treat: <b>$${m.foodTreat}</b> &nbsp;|&nbsp; 💰 Your money: <b>$${player.money}</b></p>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:0 16px;">
                <div><h3 style="color:#FFD700; font-size:0.95em; margin:6px 0 2px;">🍽️ Meals (pick one)</h3>${r.menu.mains.map((d, i) => dish(d, 'main', i)).join('')}</div>
                <div><h3 style="color:#FFD700; font-size:0.95em; margin:6px 0 2px;">🥤 Drinks</h3>${r.menu.drinks.map((d, i) => dish(d, 'drink', i)).join('')}
                     <h3 style="color:#FFD700; font-size:0.95em; margin:6px 0 2px;">🍰 Dessert</h3>${r.menu.desserts.map((d, i) => dish(d, 'dessert', i)).join('')}</div>
            </div>
            <div style="text-align:center; margin-top:10px;">
                <p style="color:#d9b99b; margin-bottom:6px;">Total: <b>$${total}</b> ${total > have ? '<span style="color:#e74c3c">(not enough money!)</span>' : ''}</p>
                <button onclick="eatAtStall()" ${can ? '' : 'disabled'} style="padding:10px 26px; border:none; border-radius:12px; font-weight:bold; font-size:1.05em; color:white;
                    cursor:${can ? 'pointer' : 'not-allowed'}; background:${can ? '#e67e22' : '#555'};">${p.main === null ? 'Pick a meal first' : '😋 Pay & eat!'}</button>
                <button onclick="closeFoodStall()" style="margin-left:8px; padding:9px 16px; border:none; border-radius:10px; background:#555; color:white; cursor:pointer;">✖ No thanks</button>
            </div>
        </div>`;
    document.body.appendChild(el);
}

function foodPick(kind, i) {
    const st = mall3D && mall3D.foodStall;
    if (!st) return;
    st.pick[kind] = (st.pick[kind] === i && kind !== 'main') ? null : i;
    renderFoodStall(st);
}

function closeFoodStall() {
    removeMallOverlay('mall-food');
    const m = mall3D;
    if (!m || !m.foodStall) return;
    playerMesh.position.z = m.foodStall.side * 5.0;      // step back from the counter
    m.foodAskAt = Date.now() + 3000;
    m.foodStall = null;
}

function eatAtStall() {
    const m = mall3D, st = m && m.foodStall;
    if (!st || st.pick.main === null) return;
    const r = st.r, mn = r.menu, p = st.pick;
    const items = [mn.mains[p.main], p.drink !== null ? mn.drinks[p.drink] : null, p.dessert !== null ? mn.desserts[p.dessert] : null].filter(Boolean);
    const total = items.reduce((s, d) => s + d.price, 0);
    if (total > m.foodTreat + player.money) return;
    const fromTreat = Math.min(m.foodTreat, total), fromMoney = total - fromTreat;
    m.foodTreat -= fromTreat; player.money -= fromMoney;
    const ratingBonus = r.rating >= 4.5 ? 3 : r.rating >= 4.0 ? 1 : 0;
    const hap = items.reduce((s, d) => s + d.hap, 0) + ratingBonus;
    const health = items.reduce((s, d) => s + d.health, 0);
    player.happiness = Math.max(0, Math.min(100, player.happiness + hap));
    player.health = Math.max(0, Math.min(100, player.health + health));
    gainFullness(35 + (p.drink !== null ? 5 : 0) + (p.dessert !== null ? 10 : 0), true);   // a food-court meal fills you up (food.js)
    m.meals++;
    updateStats(); saveGame();
    removeMallOverlay('mall-food');
    const el = document.createElement('div');
    el.id = 'mall-food';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); font-family:Arial;`;
    el.innerHTML = `<div style="background:#16213e; border:3px solid #f39c12; border-radius:16px; padding:26px 34px; text-align:center; max-width:420px;">
        <div style="font-size:2.6em;">${items.map(d => (typeof foodImg === 'function' ? foodImg(d.emoji, d.name, 56, { force: true }) : d.emoji)).join(' ')}</div>
        <h2 style="color:#FFD700; margin:8px 0;">😋 You sit at a table and eat...</h2>
        <p style="color:#fff;">${items.map(d => d.name).join(', ')}</p>
        <p id="food-result" style="color:#aaa; margin:10px 0;">Yum yum yum...</p></div>`;
    document.body.appendChild(el);
    setTimeout(() => {
        const box = document.getElementById('mall-food');
        if (!box) return;
        const verdict = health >= 5 ? 'So fresh and healthy!' : health <= -4 ? 'Tasty... but a bit greasy!' : 'Yummy!';
        box.firstElementChild.innerHTML = `
            <div style="font-size:2.4em;">😋</div>
            <h2 style="color:#2ecc71; margin:6px 0;">${verdict}</h2>
            <p style="color:#2ecc71;">+${hap} happiness &nbsp;|&nbsp; <span style="color:${health >= 0 ? '#2ecc71' : '#e74c3c'}">${health >= 0 ? '+' : ''}${health} health</span></p>
            <p style="color:#d9b99b; margin:8px 0;">🧾 $${total}${fromTreat ? ` — Mom & Dad paid $${fromTreat}` : ''}${fromMoney ? `, you paid $${fromMoney}` : ''}</p>
            <button onclick="closeFoodStall()" style="padding:10px 26px; border:none; border-radius:12px; background:#3498db; color:white; font-weight:bold; cursor:pointer;">Back to the mall</button>`;
    }, 2300);
}

// ---------------------------------------------
// 5. Ride home
// ---------------------------------------------
function leaveMall() {
    const m = mall3D;
    if (!m || inStore || restaurant3D) return;
    ['mall-shop', 'mall-hud', 'mall-offer', 'mall-pick', 'mall-grocery-ask', 'mall-food'].forEach(removeMallOverlay);
    mall3D = null;
    playerMesh.remove(m.youMarker); disposeTree(m.youMarker);
    m.objs.forEach(o => { scene.remove(o); disposeTree(o); });
    scene.background = m.savedBg;
    m.stash.forEach(o => scene.add(o));               // the house, exactly as it was
    clickableNPCs.length = 0;
    m.clickables.forEach(c => clickableNPCs.push(c));
    playerMesh.position.copy(m.saved.pos);
    playerMesh.rotation.y = m.saved.rotY;
    const bought = mallTrip ? mallTrip.bought : [];
    mallTrip = null;
    setMallPause(false);
    const home = () => {
        document.getElementById('location-name').textContent = '🏠 Home';
        updateActionPanel();
        showEvent('🏠', bought.length ? `Home from the mall! You bought ${bought.length} thing${bought.length > 1 ? 's' : ''}: ${bought.map(b => b.emoji).join(' ')}` : 'Home from the mall!');
    };
    if (!driveTo('home', '🏠', home)) home();
}

// Called by restartGame() so a mall trip never leaks into the next life.
function resetMall() {
    ['mall-shop', 'mall-hud', 'mall-offer', 'mall-pick', 'mall-grocery-ask', 'mall-food'].forEach(removeMallOverlay);
    mall3D = null; mallTrip = null; mallPick = null;
    inMall = false;
}
