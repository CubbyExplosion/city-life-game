// =============================================
// APARTMENT — moving out of Mom & Dad's house (age 18+, after school).
//
//   🏠 LIVING WITH PARENTS: you only pay transport ($10 every 10 days). Your room is the family house.
//   🏢 YOUR OWN PLACE: pick one of 3 apartments. You pay a DEPOSIT up front (you get it back when you move out),
//      then rent + utilities + transport every 10 days. A nicer place makes you a little happier every day.
//      Your home turns into that apartment (no Mom & Dad in it) — see buildApartment() — and you can upgrade,
//      downgrade, or move back in with your parents any time (button: 🏠 Move Out / Housing).
//
// livingCosts() is what life.js's bills use. player.home = null (parents) or { id, deposit }.
// Everything is boxes, like the rest of City Life.
// =============================================

const APARTMENTS = [
    { id: 'studio', name: 'Cozy Studio', emoji: '🛏️', rent: 35,  utilities: 12, deposit: 35,  comfort: 0, desc: 'One room: bed, sofa and a tiny kitchen.' },
    { id: 'flat',   name: 'Bright Flat', emoji: '🏢', rent: 65,  utilities: 16, deposit: 65,  comfort: 1, desc: 'A proper kitchen, a dining table and a big window. +1 happiness a day.' },
    { id: 'loft',   name: 'City Loft',   emoji: '🌆', rent: 110, utilities: 24, deposit: 110, comfort: 2, desc: 'Posh and modern with a huge TV. +2 happiness a day.' }
];
const PARENT_TRANSPORT = 10;

function apartmentById(id) { return APARTMENTS.find(a => a.id === id); }
function myApartment() { return player.home ? apartmentById(player.home.id) : null; }

// What you pay every 10 days
function livingCosts() {
    const a = myApartment();
    if (!a) return { rent: 0, utilities: 0, transport: PARENT_TRANSPORT };
    return { rent: a.rent, utilities: a.utilities, transport: LIVING_COSTS.transport };
}
function livingCostTotal() { const c = livingCosts(); return c.rent + c.utilities + c.transport; }

// Daily comfort from a nice place (called from lifeNewDay)
function apartmentNewDay() {
    const a = myApartment();
    if (a && a.comfort) player.happiness = Math.min(100, player.happiness + a.comfort);
}

// ---------------------------------------------
// the housing board
// ---------------------------------------------
function showHousing() {
    ensureLifeState();
    if (!player.graduated || player.age < 18) { showEvent('🏠', 'You can move out once you finish school (age 18).'); return; }
    const cur = myApartment();
    lifeOverlay(`
        <h2 style="color:#FFD700; text-align:center;">🏠 Housing</h2>
        <p style="color:#aaa; text-align:center; margin-bottom:6px;">${cur ? `You live in your <b>${cur.name}</b> — bills every 10 days: $${livingCostTotal()}` : `You live with Mom &amp; Dad — bills every 10 days: only $${PARENT_TRANSPORT} for transport.`}</p>
        <p style="color:#9ab; text-align:center; font-size:0.85em; margin-bottom:8px;">💰 You have $${player.money}. A deposit is paid when you move in and given back when you move out.</p>
        ${APARTMENTS.map(a => {
            const mine = cur && cur.id === a.id;
            const refund = cur ? cur.deposit : 0;
            const afford = player.money + refund >= a.deposit;
            return `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin:5px 0; padding:9px 12px; border-radius:10px; background:${mine ? '#1a7a4a' : '#0f3460'};">
                <span style="color:#fff;">${a.emoji} <b>${a.name}</b><br><span style="font-size:0.8em; color:#aaa;">${a.desc}<br>Rent $${a.rent} + utilities $${a.utilities} every 10 days · deposit $${a.deposit}</span></span>
                <span style="white-space:nowrap;">${mine ? '<b style="color:#2ecc71;">You live here</b>' : lifeBtn(`moveInto('${a.id}')`, cur ? 'Move here' : 'Move in', afford ? '#27ae60' : '#555', 'padding:6px 14px; font-size:0.9em;')}</span></div>`;
        }).join('')}
        <div style="text-align:center; margin-top:8px;">
            ${cur ? lifeBtn('moveBackHome()', '👪 Move back in with Mom & Dad', '#8e44ad') : ''}
            ${lifeBtn('closeLifeOverlay()', 'Close', '#555')}
        </div>`, '#27ae60');
}

function housingBusy() {
    return driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni || inSchool || (typeof place3D !== 'undefined' && place3D);
}

function moveInto(id) {
    const a = apartmentById(id);
    if (!a || housingBusy()) return;
    const cur = myApartment();
    if (cur && cur.id === id) return;
    const refund = cur ? cur.deposit : 0;
    if (player.money + refund < a.deposit) { showEvent('💸', `You need $${a.deposit} for the deposit!`); return; }
    player.money += refund - a.deposit;
    player.home = { id, deposit: a.deposit };
    saveGame(); updateStats(); closeLifeOverlay();
    const arrive = () => {
        rebuildHome();
        document.getElementById('location-name').textContent = '🏠 Home';
        updateActionPanel();
        showEvent(a.emoji, cur ? `You moved to the ${a.name}!` : `You moved out! Welcome to your ${a.name}. Rent is $${a.rent} + $${a.utilities} utilities every 10 days. Mom: "Call us any time, sweetheart!"`);
    };
    if (!driveTo('to your new place', a.emoji, arrive, { self: true })) arrive();
}

function moveBackHome() {
    const cur = myApartment();
    if (!cur || housingBusy()) return;
    player.money += cur.deposit;
    player.home = null;
    saveGame(); updateStats(); closeLifeOverlay();
    const arrive = () => {
        rebuildHome();
        document.getElementById('location-name').textContent = '🏠 Home';
        updateActionPanel();
        showEvent('👪', `You moved back in with Mom & Dad. You got your $${cur.deposit} deposit back. Rent is free again!`);
    };
    if (!driveTo('to Mom & Dad\'s', '👪', arrive, { self: true })) arrive();
}

// Throws the old home away and builds the right one (the family house, or your apartment)
function rebuildHome() {
    if (!scene) return;
    const keep = new Set([playerMesh, milkMesh, diaperMesh, snowGround, snowPoints].filter(Boolean));
    scene.children.slice().forEach(o => {
        if (keep.has(o) || /Light/.test(o.type)) return;
        scene.remove(o); disposeTree(o);
    });
    clickableNPCs.length = 0;
    homeExtras = [];
    momMesh = null; dadMesh = null; momAI.mesh = null; dadAI.mesh = null;
    buildHome();                                   // world.js picks the house or the apartment
    if (playerMesh) { playerMesh.position.set(0, playerMesh.position.y > 0.5 ? 0.9 : 0, 2); playerMesh.rotation.y = Math.PI; }
    refreshHomeExtras();
}

// ---------------------------------------------
// 3D: the three apartments (the same 10 x 10 room as the house: no front wall, no ceiling)
// Keep x -4.5..-1 / z 3.4..5 free for the toy rug and x 2..4 / z -5..-2.8 for the Christmas tree.
// ---------------------------------------------
function buildApartment(id) {
    const B = addBox;
    const loft = id === 'loft', flat = id === 'flat';
    const floor = loft ? 0x4E342E : flat ? 0xC9A66B : 0xD7C4A0;
    const wall = loft ? 0x8D99AE : flat ? 0xF2E3C6 : 0xE8DCC8;
    B(10, 0.2, 10, 0, -0.1, 0, floor);
    B(10, 3, 0.2, 0, 1.5, -5, wall); B(0.2, 3, 10, -5, 1.5, 0, wall); B(0.2, 3, 10, 5, 1.5, 0, wall);
    B(10, 0.18, 0.2, 0, 0.09, -4.95, 0xFFFFFF);                                       // skirting
    B(1.0, 2.2, 0.15, 2, 1.1, 4.92, 0x8B4513); B(0.12, 0.12, 0.1, 2.35, 1.1, 4.85, 0xFFD700);   // the front door
    // window with curtains
    B(2.6, 1.6, 0.12, 0, 2.0, -4.9, loft ? 0x9ED8F5 : 0xADD8E6); B(2.8, 1.8, 0.08, 0, 2.0, -4.95, 0xFFFFFF);
    B(0.1, 1.8, 0.1, 0, 2.0, -4.88, 0xFFFFFF);
    if (flat || loft) { B(0.7, 1.9, 0.12, -1.7, 1.95, -4.85, flat ? 0xE67E22 : 0x34495E); B(0.7, 1.9, 0.12, 1.7, 1.95, -4.85, flat ? 0xE67E22 : 0x34495E); }
    B(5, 0.05, 3.2, -0.2, 0.02, 0.4, loft ? 0x37474F : flat ? 0xB85C38 : 0x7FB3D5);   // the rug

    // ---- bed (left wall) ----
    const bx = -3.6, bz = -2.2;
    B(2.2, 0.45, 3.2, bx, 0.25, bz, loft ? 0x3E2723 : 0x8D6E63);
    B(2.0, 0.28, 3.0, bx, 0.6, bz, flat || loft ? 0xFFFFFF : 0xF5F5F5);
    B(2.0, 0.3, 1.5, bx, 0.78, bz + 0.7, loft ? 0x5C6BC0 : flat ? 0x26A69A : 0xEF9A9A);   // the duvet
    B(0.8, 0.2, 0.5, bx - 0.5, 0.82, bz - 1.2, 0xFFFFFF); B(0.8, 0.2, 0.5, bx + 0.5, 0.82, bz - 1.2, 0xFFFFFF);
    B(2.4, loft ? 1.6 : 0.9, 0.2, bx, loft ? 0.8 : 0.45, bz - 1.65, loft ? 0x3E2723 : 0x6D4C41);   // headboard
    B(0.6, 0.6, 0.6, bx + 1.5, 0.3, bz - 1.4, 0x6D4C41); B(0.25, 0.4, 0.25, bx + 1.5, 0.8, bz - 1.4, 0xFFF59D);   // bedside table + lamp

    // ---- the kitchen (back wall, left of the window) ----
    const kx = -1.2 - (flat || loft ? 0.2 : 0);
    B(2.6, 1.0, 0.9, kx - 1.0 + 0.2, 0.5, -4.4, 0xECEFF1); B(2.7, 0.08, 1.0, kx - 0.8, 1.04, -4.4, 0x546E7A);
    B(0.9, 0.9, 0.9, kx + 0.7, 0.5, -4.4, 0x90A4AE); B(0.8, 0.05, 0.8, kx + 0.7, 0.98, -4.4, 0x212121);   // oven + hob
    B(0.9, 0.35, 0.5, kx - 1.6, 2.0, -4.7, 0xFFFFFF); B(0.9, 0.35, 0.5, kx - 0.6, 2.0, -4.7, 0xFFFFFF);   // cupboards
    B(0.7, 1.9, 0.7, kx + 1.9, 0.95, -4.5, 0xCFD8DC);                                                       // fridge
    if (flat || loft) {                                                                                     // dining table + chairs / an island
        if (loft) { B(2.6, 1.0, 0.9, 1.2, 0.5, -1.4, 0x424242); B(2.7, 0.08, 1.0, 1.2, 1.04, -1.4, 0xECEFF1); [-0.7, 0.7].forEach(dx => B(0.5, 0.55, 0.5, 1.2 + dx, 0.3, -0.5, 0x212121)); }
        else { B(1.6, 0.1, 1.0, 1.0, 0.8, -1.4, 0xA0522D); B(0.1, 0.8, 0.1, 0.3, 0.4, -1.4, 0x6D4C41); B(0.1, 0.8, 0.1, 1.7, 0.4, -1.4, 0x6D4C41);
               [[0.4, -0.5], [1.6, -0.5], [0.4, -2.3], [1.6, -2.3]].forEach(([x, z]) => B(0.45, 0.5, 0.45, x, 0.28, z, 0x34495E)); }
    }

    // ---- living area: sofa + TV (right wall) ----
    const sofaC = loft ? 0x37474F : flat ? 0xC0392B : 0x5D8AA8;
    B(0.9, 0.45, loft ? 3.2 : 2.4, 3.8, 0.24, 1.2, sofaC); B(0.35, 1.0, loft ? 3.2 : 2.4, 4.3, 0.7, 1.2, sofaC);
    B(0.9, 0.6, 0.25, 3.8, 0.5, 1.2 - (loft ? 1.6 : 1.2), sofaC); B(0.9, 0.6, 0.25, 3.8, 0.5, 1.2 + (loft ? 1.6 : 1.2), sofaC);
    B(0.7, 0.3, 0.7, 3.5, 0.65, 0.3, loft ? 0xF1C40F : 0xFFD54F);                                           // cushion
    const tvH = loft ? 1.6 : 1.1, tvW = loft ? 3.0 : 1.8;
    B(0.12, tvH, tvW, -4.9, 2.1, 1.8, 0x111111); B(0.1, tvH + 0.1, tvW + 0.2, -4.92, 2.1, 1.8, 0x444444);   // the TV on the left wall
    B(0.5, 0.5, tvW + 0.4, -4.7, 0.25, 1.8, 0x5D4037);                                                      // TV stand
    // ---- decoration ----
    if (flat || loft) {
        B(0.9, 2.3, 0.45, 4.5, 1.15, -3.0, 0x6D4C41);                                                       // bookshelf
        [0.5, 1.0, 1.5, 2.0].forEach((y, k) => { for (let i = 0; i < 3; i++) B(0.2, 0.3, 0.3, 4.4, y + 0.1, -3.0 + (i - 1) * 0.28, [0xE74C3C, 0x3498DB, 0xF1C40F, 0x27AE60][(i + k) % 4]); });
    }
    B(0.5, 0.5, 0.5, -4.4, 0.25, 4.4 - 1.2, 0xB5651D); B(0.8, 0.8, 0.8, -4.4, 0.9, 3.2, 0x2E8B3C); B(0.5, 0.5, 0.5, -4.4, 1.5, 3.2, 0x38A04A);   // a plant
    if (loft) {
        B(0.1, 2.4, 0.1, 2.2, 1.2, 2.8, 0x212121); B(0.8, 0.3, 0.8, 2.2, 2.5, 2.8, 0xFFF59D);              // floor lamp
        B(1.6, 1.1, 0.06, 3.0, 2.0, -4.88, 0xE91E63); B(1.4, 0.9, 0.08, 3.0, 2.0, -4.86, 0xFFC107);          // wall art
    } else if (flat) { B(1.2, 0.8, 0.06, 3.0, 2.0, -4.88, 0x7E57C2); }
    const name = makeNameplateSprite([`${apartmentById(id).emoji} ${apartmentById(id).name}`, 'Home sweet home'], '#2c3e50', 3.6, 0.95);
    name.position.set(0, 3.6, -4.5); scene.add(name);
    momAI.mesh = null; dadAI.mesh = null;                                                                  // no parents here
}

function resetHousing() { /* nothing runtime to clear; player.home is reset by startGame / restartGame */ }
