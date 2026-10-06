// =============================================
// FURNITURE — shop for your own apartment and arrange it.
//
//   Once you have moved out (apartment.js) a 🛋️ Furniture button appears on the home screen. The shop has 16 pieces (armchair, sofa, desk, bookshelf,
//   plants, a floor lamp that really lights up at night, a rug, an aquarium, a piano...) shown with little 3D pictures. Buying a piece puts it in
//   STORAGE; the 🏠 Arrange tab shows your room from above as a 10 x 10 grid: grey squares are things that are already there, click a free spot to
//   place the piece you are holding (↻ rotates it), click a placed piece to pick it up again, or sell it back for half the price.
//   Every few pieces make your home cosier: +1 happiness a day per 8 comfort points (max +3), on top of the apartment's own comfort.
//
//   Furniture belongs to the apartment you are in: when you move to a different place (or back to Mom & Dad) everything goes into storage, and
//   you place it again. Nothing here changes bills or school — it is for decorating and a little happiness.
//
// How: the pieces are built from boxes (furnModel). Where you can put things is worked out from the real room (furnStatic reads the meshes that
// buildApartment made), so the three apartments each get the right free space. buildHome() is wrapped (after lights.js / home-walls.js) so every
// freshly built home also gets your furniture, and furnRebuild() refreshes it live. State: player.furn = { placed: [{id,cx,cz,rot}], storage: [id], home }.
// =============================================

const FURN_CATALOG = [
    // id, name, emoji, price, w, d (cells; the room is 10 x 10), comfort points, flat (walkable-over, like a rug)
    { id: 'beanbag',   name: 'Bean Bag',       emoji: '🟣', price: 22,  w: 1, d: 1, comfort: 1 },
    { id: 'chair',     name: 'Dining Chair',   emoji: '🪑', price: 15,  w: 1, d: 1, comfort: 1 },
    { id: 'armchair',  name: 'Armchair',       emoji: '💺', price: 45,  w: 1, d: 1, comfort: 2 },
    { id: 'sofa2',     name: 'Loveseat',       emoji: '🛋️', price: 90,  w: 2, d: 1, comfort: 3 },
    { id: 'coffee',    name: 'Coffee Table',   emoji: '☕', price: 35,  w: 2, d: 1, comfort: 1 },
    { id: 'dining',    name: 'Dining Table',   emoji: '🍽️', price: 85,  w: 2, d: 2, comfort: 2 },
    { id: 'desk',      name: 'Desk & Monitor', emoji: '🖥️', price: 60,  w: 2, d: 1, comfort: 2 },
    { id: 'bookshelf', name: 'Bookshelf',      emoji: '📚', price: 55,  w: 2, d: 1, comfort: 2 },
    { id: 'dresser',   name: 'Dresser',        emoji: '🗄️', price: 70,  w: 2, d: 1, comfort: 1 },
    { id: 'wardrobe',  name: 'Wardrobe',       emoji: '🚪', price: 95,  w: 2, d: 1, comfort: 1 },
    { id: 'plant',     name: 'House Plant',    emoji: '🪴', price: 18,  w: 1, d: 1, comfort: 1 },
    { id: 'palm',      name: 'Tall Palm',      emoji: '🌴', price: 32,  w: 1, d: 1, comfort: 2 },
    { id: 'lamp',      name: 'Floor Lamp',     emoji: '💡', price: 28,  w: 1, d: 1, comfort: 2 },
    { id: 'rug',       name: 'Big Rug',        emoji: '🟫', price: 45,  w: 3, d: 2, comfort: 2, flat: true },
    { id: 'aquarium',  name: 'Aquarium',       emoji: '🐠', price: 120, w: 2, d: 1, comfort: 3 },
    { id: 'piano',     name: 'Piano',          emoji: '🎹', price: 220, w: 2, d: 1, comfort: 4 }
];
function furnById(id) { return FURN_CATALOG.find(f => f.id === id); }

// ---------- state ----------
function ensureFurn() {
    if (!player.furn || typeof player.furn !== 'object') player.furn = { placed: [], storage: [], home: null };
    if (!Array.isArray(player.furn.placed)) player.furn.placed = [];
    if (!Array.isArray(player.furn.storage)) player.furn.storage = [];
    return player.furn;
}
// everything goes back into storage when you live somewhere else than where it was placed
function furnSync() {
    const f = ensureFurn(), here = player.home ? player.home.id : null;
    if (f.home !== here) {
        f.storage = f.storage.concat(f.placed.map(p => p.id)); f.placed = []; f.home = here;
        try { saveGame(); } catch (e) {}
    }
    return f;
}
function furnComfortPoints() { return ensureFurn().placed.reduce((s, p) => s + ((furnById(p.id) || {}).comfort || 0), 0); }
function furnDailyBonus() { return Math.min(3, Math.floor(furnComfortPoints() / 8)); }

// ---------- 3D pieces (boxes, origin = middle of the footprint on the floor; width along x, depth along z) ----------
function furnModel(id) {
    const def = furnById(id), g = new THREE.Group(), W = def.w - 0.12, D = def.d - 0.12;
    const bx = (w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); g.add(m); return m; };
    const wood = 0x8D6E63, dark = 0x5D4037, light = 0xD7B98A;
    switch (id) {
        case 'beanbag': bx(0.8, 0.45, 0.8, 0, 0.23, 0, 0x8E44AD); bx(0.6, 0.3, 0.6, 0, 0.55, 0, 0x9B59B6); break;
        case 'chair': bx(0.5, 0.06, 0.5, 0, 0.5, 0, wood); bx(0.5, 0.55, 0.06, 0, 0.8, -0.22, wood);
            [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => bx(0.06, 0.5, 0.06, x, 0.25, z, dark)); break;
        case 'armchair': bx(0.8, 0.35, 0.8, 0, 0.3, 0, 0x2E86AB); bx(0.8, 0.6, 0.16, 0, 0.7, -0.32, 0x23708F); bx(0.14, 0.3, 0.8, -0.38, 0.55, 0, 0x23708F); bx(0.14, 0.3, 0.8, 0.38, 0.55, 0, 0x23708F); break;
        case 'sofa2': bx(W, 0.4, D, 0, 0.3, 0, 0xC0392B); bx(W, 0.6, 0.2, 0, 0.7, -D / 2 + 0.1, 0xA93226); bx(0.2, 0.35, D, -W / 2 + 0.1, 0.55, 0, 0xA93226); bx(0.2, 0.35, D, W / 2 - 0.1, 0.55, 0, 0xA93226); break;
        case 'coffee': bx(W, 0.08, D - 0.1, 0, 0.45, 0, light); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(0.08, 0.42, 0.08, a * (W / 2 - 0.1), 0.21, b * (D / 2 - 0.15), dark)); break;
        case 'dining': bx(W, 0.1, D, 0, 0.78, 0, wood); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(0.1, 0.75, 0.1, a * (W / 2 - 0.1), 0.38, b * (D / 2 - 0.1), dark)); break;
        case 'desk': bx(W, 0.08, D, 0, 0.75, 0, light); bx(0.08, 0.72, D - 0.1, -W / 2 + 0.08, 0.36, 0, wood); bx(0.08, 0.72, D - 0.1, W / 2 - 0.08, 0.36, 0, wood);
            bx(0.6, 0.38, 0.05, 0, 1.1, -0.15, 0x1b1b1b); bx(0.1, 0.2, 0.1, 0, 0.88, -0.15, 0x333333); bx(0.5, 0.03, 0.2, 0, 0.8, 0.15, 0x222222); break;
        case 'bookshelf': bx(W, 1.9, 0.4, 0, 0.95, 0, wood);
            [0.35, 0.8, 1.25, 1.7].forEach((y, k) => { for (let i = 0; i < 4; i++) bx(0.22, 0.34, 0.3, -0.7 + i * 0.47, y, 0.08, [0xE74C3C, 0x3498DB, 0xF1C40F, 0x27AE60, 0x9B59B6][(i + k) % 5]); }); break;
        case 'dresser': bx(W, 0.85, D - 0.2, 0, 0.43, 0, wood); [0.2, 0.5, 0.75].forEach(y => bx(W - 0.1, 0.02, 0.02, 0, y, (D - 0.2) / 2 + 0.01, dark)); [-0.5, 0.5].forEach(x => bx(0.1, 0.08, 0.06, x, 0.55, (D - 0.2) / 2 + 0.03, 0xB0A090)); break;
        case 'wardrobe': bx(W, 2.1, D - 0.2, 0, 1.05, 0, 0xA1887F); bx(0.02, 1.9, 0.02, 0, 1.05, (D - 0.2) / 2 + 0.01, dark); [-0.15, 0.15].forEach(x => bx(0.06, 0.2, 0.06, x, 1.05, (D - 0.2) / 2 + 0.03, 0xB0A090)); break;
        case 'plant': bx(0.45, 0.4, 0.45, 0, 0.2, 0, 0xB5651D); bx(0.65, 0.65, 0.65, 0, 0.75, 0, 0x2E8B3C); bx(0.4, 0.4, 0.4, 0.1, 1.2, 0, 0x38A04A); break;
        case 'palm': bx(0.5, 0.35, 0.5, 0, 0.18, 0, 0xB5651D); bx(0.14, 1.5, 0.14, 0, 1.0, 0, 0x6D4C41);
            [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].forEach(([x, z]) => { const m = bx(Math.abs(x) ? 0.7 : 0.14, 0.06, Math.abs(z) ? 0.7 : 0.14, x * 0.6, 1.85, z * 0.6, 0x2E8B3C); m.rotation.z = x ? -Math.sign(x) * 0.3 : 0; m.rotation.x = z ? Math.sign(z) * 0.3 : 0; }); bx(0.3, 0.1, 0.3, 0, 1.9, 0, 0x38A04A); break;
        case 'lamp': bx(0.4, 0.06, 0.4, 0, 0.03, 0, 0x444444); bx(0.07, 1.6, 0.07, 0, 0.85, 0, 0x555555);
            bx(0.5, 0.36, 0.5, 0, 1.75, 0, 0xFFF59D); break;             // 0xFFF59D = a lamp bulb: glows at night + lights the room (realism.js), goes dark with the home lights
        case 'rug': bx(W + 0.1, 0.04, D + 0.1, 0, 0.02, 0, 0x9B2D5F); bx(W - 0.3, 0.05, D - 0.3, 0, 0.025, 0, 0xD4A5C4); break;
        case 'aquarium': bx(W, 0.7, D - 0.2, 0, 0.35, 0, dark); bx(W - 0.1, 0.65, D - 0.3, 0, 1.03, 0, 0x4FC3F7).material.transparent = true;
            [[-0.4, 1.0], [0.1, 1.15], [0.5, 0.95]].forEach(([x, y], i) => bx(0.2, 0.1, 0.06, x, y, 0, [0xFF7043, 0xFFCA28, 0xEC407A][i])); bx(W - 0.1, 0.05, D - 0.3, 0, 1.38, 0, 0x37474F); break;
        case 'piano': bx(W, 0.9, D - 0.15, 0, 0.55, 0, 0x1A1A1A); bx(W - 0.1, 0.05, 0.35, 0, 1.05, 0.1, 0xF5F5F5);
            for (let i = 0; i < 8; i++) bx(0.03, 0.04, 0.2, -0.78 + i * 0.22, 1.1, 0.12, 0x111111); bx(W, 1.0, 0.18, 0, 1.15, -0.28, 0x1A1A1A); break;
    }
    g.userData.furnId = id;
    return g;
}

// ---------- the room as a grid ----------
// Cells: cx, cz = 0..9, covering x = cx-5 .. cx-4 and z = cz-5 .. cz-4. "Static" cells hold things that were already in the room.
let furnGroup = null;
function furnStatic() {
    const blocked = new Set(), tmp = new THREE.Box3();
    const skip = new Set();
    [typeof playerMesh !== 'undefined' ? playerMesh : null, typeof momMesh !== 'undefined' ? momMesh : null, typeof dadMesh !== 'undefined' ? dadMesh : null,
     typeof hwGroup !== 'undefined' ? hwGroup : null, typeof lgSwitch !== 'undefined' ? lgSwitch : null, furnGroup].forEach(o => { if (o) o.traverse(c => skip.add(c)); });
    if (typeof scene !== 'undefined' && scene) scene.traverse(m => {
        if (!m.isMesh || skip.has(m)) return;
        tmp.setFromObject(m);
        if (!isFinite(tmp.min.x) || tmp.max.y < 0.2 || tmp.min.y > 1.3) return;                       // the floor, rugs, and things up on the walls
        if (tmp.max.x - tmp.min.x > 9 || tmp.max.z - tmp.min.z > 9) return;                         // walls
        const x0 = Math.floor(tmp.min.x + 5 + 0.02), x1 = Math.floor(tmp.max.x + 5 - 0.02), z0 = Math.floor(tmp.min.z + 5 + 0.02), z1 = Math.floor(tmp.max.z + 5 - 0.02);
        for (let cx = Math.max(0, x0); cx <= Math.min(9, x1); cx++) for (let cz = Math.max(0, z0); cz <= Math.min(9, z1); cz++) blocked.add(cx + ',' + cz);
    });
    for (let cx = 7; cx <= 8; cx++) for (let cz = 0; cz <= 1; cz++) blocked.add(cx + ',' + cz);        // the Christmas tree's corner
    for (let cx = 0; cx <= 3; cx++) for (let cz = 8; cz <= 9; cz++) blocked.add(cx + ',' + cz);        // the toy rug
    for (let cx = 6; cx <= 7; cx++) { blocked.add(cx + ',9'); blocked.add(cx + ',8'); }                // the front door
    return blocked;
}
function furnFootprint(p) {                                         // the cells a piece covers: [{cx,cz}]
    const def = furnById(p.id), w = p.rot ? def.d : def.w, d = p.rot ? def.w : def.d, out = [];
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push({ cx: p.cx + i, cz: p.cz + j });
    return out;
}
function furnCanPlace(p, ignoreIndex) {
    const def = furnById(p.id), f = ensureFurn(), st = furnStatic(), cells = furnFootprint(p);
    if (cells.some(c => c.cx < 0 || c.cx > 9 || c.cz < 0 || c.cz > 9)) return false;
    if (!def.flat && cells.some(c => st.has(c.cx + ',' + c.cz))) return false;
    if (def.flat) return true;                                      // a rug can go anywhere in the room (it lies under everything)
    return !f.placed.some((o, i) => { if (i === ignoreIndex) return false; const od = furnById(o.id); return !od.flat && furnFootprint(o).some(c => cells.some(k => k.cx === c.cx && k.cz === c.cz)); });
}

// ---------- putting it in the room ----------
function furnRebuild() {
    if (typeof scene === 'undefined' || !scene) return;
    if (furnGroup) { scene.remove(furnGroup); furnGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); furnGroup = null; }
    const f = furnSync();
    if (!player.home || !f.placed.length) return;
    const g = new THREE.Group();
    f.placed.forEach(p => {
        const def = furnById(p.id); if (!def) return;
        const m = furnModel(p.id), w = p.rot ? def.d : def.w, d = p.rot ? def.w : def.d;
        m.rotation.y = p.rot ? Math.PI / 2 : 0;
        m.position.set(p.cx - 5 + w / 2, 0, p.cz - 5 + d / 2);
        g.add(m);
    });
    scene.add(g); furnGroup = g;
}
// every freshly built home gets your furniture (chained after lights.js / home-walls.js)
if (typeof buildHome === 'function') {
    const furnOrigBuildHome = buildHome;
    buildHome = function () { furnOrigBuildHome.apply(this, arguments); furnGroup = null; try { furnRebuild(); } catch (e) { console.warn('furniture', e); } };
}

// ---------- little 3D pictures for the shop ----------
const furnIcons = {};
let furnIconR = null, furnIconScene = null, furnIconCam = null, furnIconFailed = false;
function furnIcon(id) {
    if (id in furnIcons) return furnIcons[id];
    if (furnIconFailed) return null;
    try {
        if (!furnIconR) {
            const cv = document.createElement('canvas'); cv.width = cv.height = 120;
            furnIconR = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
            furnIconR.setPixelRatio(1); furnIconR.setClearColor(0x000000, 0);
            furnIconScene = new THREE.Scene();
            furnIconScene.add(new THREE.HemisphereLight(0xffffff, 0xb8a890, 1.2));
            const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(-2, 4, 3); furnIconScene.add(sun);
            furnIconCam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
        }
        const m = furnModel(id); m.rotation.y = -0.6; furnIconScene.add(m);
        const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sph = box.getBoundingSphere(new THREE.Sphere());
        const dist = Math.max(0.6, sph.radius) / Math.sin(THREE.MathUtils.degToRad(15)) * 1.05, dir = new THREE.Vector3(0.1, 0.7, 1).normalize();
        furnIconCam.position.copy(c).addScaledVector(dir, dist); furnIconCam.lookAt(c);
        furnIconR.setSize(120, 120, false); furnIconR.render(furnIconScene, furnIconCam);
        furnIcons[id] = furnIconR.domElement.toDataURL('image/png');
        furnIconScene.remove(m); m.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    } catch (e) { furnIcons[id] = null; if (!furnIconR) furnIconFailed = true; }
    return furnIcons[id];
}
const furnPic = (id, px) => { const u = furnIcon(id); return u ? `<img src="${u}" width="${px}" height="${px}" style="vertical-align:middle">` : (furnById(id) || {}).emoji || ''; };

// ---------- the shop + arrange panel ----------
let furnTab = 'shop', furnHeld = null;          // furnHeld = { id, rot, fromIndex } — the piece you are about to place
function furnBusy() { return typeof housingBusy === 'function' && housingBusy(); }
function openFurniture() {
    if (!player.home) { showEvent('🛋️', 'Furniture is for your own place — move out first (🏠 Move Out), then come shopping!'); return; }
    if (furnBusy()) return;
    furnSync(); furnTab = 'shop'; furnHeld = null; furnRender();
}
function closeFurniture() { const el = document.getElementById('furn-overlay'); if (el) el.remove(); furnHeld = null; }

function furnRender() {
    const f = furnSync(), cur = myApartment();
    let el = document.getElementById('furn-overlay');
    if (!el) {
        el = document.createElement('div'); el.id = 'furn-overlay';
        el.style.cssText = 'position:fixed; inset:0; z-index:310; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.75); font-family:Arial; padding:10px; overflow-y:auto;';
        el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closeFurniture(); if ((e.key === 'r' || e.key === 'R') && furnHeld) { furnHeld.rot = furnHeld.rot ? 0 : 1; furnRender(); } });
        el.addEventListener('pointerdown', e => e.stopPropagation());
        document.body.appendChild(el);
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => { if (typeof keys !== 'undefined') keys[k] = false; });
    }
    const tabBtn = (t, label) => `<button onclick="furnSetTab('${t}')" style="padding:8px 16px; border:none; border-radius:10px 10px 0 0; font-weight:bold; cursor:pointer; color:#fff; background:${furnTab === t ? '#8e44ad' : '#2c3e50'};">${label}</button>`;
    const body = furnTab === 'shop' ? furnShopHtml(f) : furnArrangeHtml(f);
    el.innerHTML = `<div tabindex="0" style="background:#16213e; border:3px solid #8e44ad; border-radius:16px; padding:16px 20px; max-width:680px; width:100%; color:#fff; max-height:96vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;"><h2 style="margin:0; color:#FFD700;">🛋️ Furniture</h2><span>💰 <b>$${player.money}</b></span></div>
        <div style="color:#aaa; font-size:0.85em; margin:2px 0 8px;">${cur ? cur.emoji + ' ' + cur.name : ''} · ${f.placed.length} placed · ${f.storage.length} in storage · cosy bonus <b>+${furnDailyBonus()}</b> happiness a day (${furnComfortPoints()} comfort points; every 8 = +1, max +3)</div>
        <div style="display:flex; gap:4px;">${tabBtn('shop', '🛒 Shop')}${tabBtn('arrange', '🏠 Arrange room')}</div>
        <div style="background:#0f3460; border-radius:0 12px 12px 12px; padding:12px;">${body}</div>
        <div style="text-align:center; margin-top:10px;">${lifeBtn('closeFurniture()', '✖ Close', '#555')}</div></div>`;
}
function furnSetTab(t) { furnTab = t; if (t === 'shop') furnHeld = null; furnRender(); }

function furnShopHtml() {
    return `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px;">${FURN_CATALOG.map(d => {
        const afford = player.money >= d.price;
        return `<div style="background:#16213e; border-radius:10px; padding:8px; text-align:center;">
            <div>${furnPic(d.id, 84)}</div><div style="font-weight:bold; font-size:0.92em;">${d.name}</div>
            <div style="font-size:0.78em; color:#9ab;">${d.w}×${d.d} · comfort ${d.comfort}</div>
            ${lifeBtn(`furnBuy('${d.id}')`, '$' + d.price, afford ? '#27ae60' : '#555', 'padding:5px 14px; font-size:0.9em; margin:4px 0 0;')}</div>`;
    }).join('')}</div>`;
}
function furnBuy(id) {
    const d = furnById(id), f = ensureFurn();
    if (!d || furnBusy()) return;
    if (player.money < d.price) { showEvent('💸', `You need $${d.price} for the ${d.name}!`); return; }
    player.money -= d.price; f.storage.push(id);
    updateStats(); saveGame();
    furnHeld = { id, rot: 0, fromIndex: -1, storageIndex: f.storage.length - 1 };       // straight on to placing it
    furnTab = 'arrange';
    if (typeof soundClick === 'function') soundClick();
    furnRender();
    showEvent('🚚', `Delivered: ${d.emoji} ${d.name}! Click a free square to place it.`);
}

function furnArrangeHtml(f) {
    const st = furnStatic(), grid = [], cell = 36;
    const placedAt = {};
    f.placed.forEach((p, i) => furnFootprint(p).forEach(c => { const def = furnById(p.id); if (!placedAt[c.cx + ',' + c.cz] || !def.flat) placedAt[c.cx + ',' + c.cz] = { i, def }; }));
    for (let cz = 0; cz < 10; cz++) for (let cx = 0; cx < 10; cx++) {
        const key = cx + ',' + cz, pl = placedAt[key], blocked = st.has(key);
        const bg = pl ? (pl.def.flat ? '#6a3a5a' : '#8e44ad') : blocked ? '#37474f' : '#1f4a6e';
        const content = pl ? `<span style="font-size:15px;">${pl.def.emoji}</span>` : blocked ? '' : '';
        grid.push(`<div class="furn-cell" data-cx="${cx}" data-cz="${cz}" onclick="furnCellClick(${cx},${cz})" onmouseover="furnHover(${cx},${cz})" style="width:${cell}px; height:${cell}px; box-sizing:border-box; border:1px solid #0a1a2a; background:${bg}; display:flex; align-items:center; justify-content:center; cursor:${blocked && !pl ? 'not-allowed' : 'pointer'};">${content}</div>`);
    }
    const storage = f.storage.map((id, i) => `<button onclick="furnPick(${i})" style="margin:3px; padding:4px 8px; border:2px solid ${furnHeld && furnHeld.fromIndex === -1 && furnHeld.id === id && furnHeld.storageIndex === i ? '#f1c40f' : '#3498db'}; border-radius:8px; background:#16213e; color:#fff; cursor:pointer; font-size:0.85em;">${furnPic(id, 34)} ${furnById(id).name}</button>`).join('');
    const held = furnHeld ? `<div style="background:#1a7a4a; border-radius:8px; padding:6px 10px; margin:6px 0;">Holding: <b>${furnById(furnHeld.id).emoji} ${furnById(furnHeld.id).name}</b> — click a free square to place it. ${lifeBtn('furnRotate()', '↻ Rotate (R)', '#2980b9', 'padding:4px 10px; font-size:0.85em; margin:0 4px;')}${lifeBtn('furnStore()', '📦 Put away', '#555', 'padding:4px 10px; font-size:0.85em; margin:0 4px;')}${lifeBtn('furnSell()', '💵 Sell (½)', '#c0392b', 'padding:4px 10px; font-size:0.85em; margin:0 4px;')}</div>`
        : `<div style="color:#9ab; font-size:0.85em; margin:6px 0;">Pick a piece from storage, or click a piece in the room to pick it up and move it. Grey = already there, blue = free.</div>`;
    return `<div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">
        <div><div style="color:#aaa; font-size:0.78em; text-align:center; margin-bottom:2px;">↑ back wall</div>
            <div id="furn-grid" style="display:grid; grid-template-columns:repeat(10, ${cell}px); border:3px solid #ecf0f1; width:max-content;">${grid.join('')}</div>
            <div style="color:#aaa; font-size:0.78em; text-align:center; margin-top:2px;">↓ front door</div></div>
        <div style="flex:1; min-width:200px;"><b>📦 Storage</b><div>${storage || '<span style="color:#9ab; font-size:0.85em;">Empty — buy something in the Shop!</span>'}</div>${held}</div></div>`;
}
function furnPick(i) { const f = ensureFurn(); if (!f.storage[i]) return; furnHeld = { id: f.storage[i], rot: 0, fromIndex: -1, storageIndex: i }; furnRender(); }
function furnRotate() { if (furnHeld) { furnHeld.rot = furnHeld.rot ? 0 : 1; furnRender(); } }
function furnStore() {
    const f = ensureFurn(); if (!furnHeld) return;
    if (furnHeld.fromIndex >= 0) f.storage.push(furnHeld.id);                  // (a piece taken out of the room goes into storage)
    furnHeld = null; saveGame(); furnRebuild(); furnRender();
}
function furnSell() {
    const f = ensureFurn(); if (!furnHeld) return;
    const d = furnById(furnHeld.id), refund = Math.floor(d.price / 2);
    if (furnHeld.fromIndex === -1 && furnHeld.storageIndex !== undefined) f.storage.splice(furnHeld.storageIndex, 1);
    player.money += refund; furnHeld = null; updateStats(); saveGame(); furnRebuild(); furnRender();
    showEvent('💵', `You sold the ${d.name} for $${refund}.`);
}
function furnCellClick(cx, cz) {
    const f = ensureFurn();
    if (!furnHeld) {                                                           // pick up a piece that is in the room
        const i = f.placed.findIndex(p => furnFootprint(p).some(c => c.cx === cx && c.cz === cz) && !furnById(p.id).flat) ;
        const j = i >= 0 ? i : f.placed.findIndex(p => furnFootprint(p).some(c => c.cx === cx && c.cz === cz));
        if (j < 0) return;
        const p = f.placed.splice(j, 1)[0];
        furnHeld = { id: p.id, rot: p.rot, fromIndex: 0 };                     // fromIndex >= 0 = it came from the room
        furnRebuild(); furnRender(); return;
    }
    const p = { id: furnHeld.id, cx, cz, rot: furnHeld.rot };
    if (!furnCanPlace(p)) { showEvent('🚫', 'That doesn\'t fit there — try another spot (or rotate it).'); return; }
    f.placed.push(p);
    if (furnHeld.fromIndex === -1 && furnHeld.storageIndex !== undefined) f.storage.splice(furnHeld.storageIndex, 1);
    furnHeld = null; saveGame(); furnRebuild(); furnRender();
    if (typeof soundClick === 'function') soundClick();
}
// green/red footprint preview under the mouse
function furnHover(cx, cz) {
    if (!furnHeld) return;
    const p = { id: furnHeld.id, cx, cz, rot: furnHeld.rot }, ok = furnCanPlace(p), cells = furnFootprint(p);
    document.querySelectorAll('.furn-cell').forEach(el => { el.style.outline = ''; });
    cells.forEach(c => { const el = document.querySelector(`.furn-cell[data-cx="${c.cx}"][data-cz="${c.cz}"]`); if (el) el.style.outline = `3px solid ${ok ? '#2ecc71' : '#e74c3c'}`; });
}

// ---------- hooks into the rest of the game ----------
if (typeof lifeButtons === 'function') {                                         // the 🛋️ button on the home screen (only when you live in your own place)
    const furnOrigButtons = lifeButtons;
    lifeButtons = function () { return furnOrigButtons.apply(this, arguments) + (player.home ? `<button class="action-btn" onclick="openFurniture()">🛋️ Furniture</button>` : ''); };
}
if (typeof apartmentNewDay === 'function') {                                    // the cosy bonus
    const furnOrigNewDay = apartmentNewDay;
    apartmentNewDay = function () { furnOrigNewDay.apply(this, arguments); const b = player.home ? furnDailyBonus() : 0; if (b) player.happiness = Math.min(100, player.happiness + b); };
}
if (typeof startGame === 'function') {                                          // a new life starts with an empty room
    const furnOrigStart = startGame;
    startGame = function () { player.furn = { placed: [], storage: [], home: null }; return furnOrigStart.apply(this, arguments); };
}
if (typeof restartGame === 'function') { const o = restartGame; restartGame = function () { player.furn = { placed: [], storage: [], home: null }; return o.apply(this, arguments); }; }
