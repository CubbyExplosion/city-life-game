// =============================================
// NEIGHBORHOOD — go outside and play on your block (age OUTSIDE_AGE and up).
//
// A real 3D street: 8 houses (4 on each side), a road, sidewalks, trees, parked
// cars and mailboxes. A family lives in every house — parents wander their
// front yards, kids play out front. Some of your SCHOOL FRIENDS live on this
// street (which ones depends on your city — see neighborhood-data.js).
//
// Walk with the arrow keys / WASD. Click a person (you have to be close) to:
//   💬 chat with them        — the same chat as school classmates (chat.js)
//   ✊ rock-paper-scissors   — with anyone
//   🏃 play tag               — with the kids: chase them down in 20 seconds!
//   🍪 ask for a snack        — from the parents (once a day each)
// Every time you play, you get to know them better (hearts, saved in player.friendship).
//
// The day clock pauses while you're out (inNeighborhood), like at the store.
// Entered from the 🌳 Go Outside button (core.js); left with 🏠 Go Home.
// =============================================

let neighborhood3D = null;       // everything about the outdoor scene, or null when you're inside
let hoodPauseStart = 0;

const HOOD_WALK_SPEED = 4.0;     // units per second
const HOOD_BOUNDS = { minX: -23.5, maxX: 23.5, minZ: -17.5, maxZ: 17.5 };
const HOOD_CAM_HEIGHT = 22;      // how high the camera floats above the street
const HOOD_CAM_BACK = 13;        // and how far behind you
const TAG_SECONDS = 20;
const TALK_DISTANCE = 4.5;       // how close you have to be to talk to someone

// ---- clock pause (like the grocery store) ----
function setNeighborhoodPause(on) {
    if (on && !inNeighborhood) {
        inNeighborhood = true;
        hoodPauseStart = Date.now();
    } else if (!on && inNeighborhood) {
        inNeighborhood = false;
        lastDayTime += Date.now() - hoodPauseStart;
    }
}

// ---- little drawing helpers ----
function makeNameplateSprite(lines, bg, width, height) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = Math.round(512 * height / width);
    const ctx = c.getContext('2d');
    const r = 28;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(r, 4); ctx.lineTo(c.width - r, 4); ctx.quadraticCurveTo(c.width - 4, 4, c.width - 4, r);
    ctx.lineTo(c.width - 4, c.height - r); ctx.quadraticCurveTo(c.width - 4, c.height - 4, c.width - r, c.height - 4);
    ctx.lineTo(r, c.height - 4); ctx.quadraticCurveTo(4, c.height - 4, 4, c.height - r);
    ctx.lineTo(4, r); ctx.quadraticCurveTo(4, 4, r, 4); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const list = Array.isArray(lines) ? lines : [lines];
    const lineH = c.height / list.length;
    list.forEach((t, i) => {
        ctx.font = (i === 0 ? 'bold 52px' : '40px') + ' "Segoe UI Emoji","Apple Color Emoji",Arial,sans-serif';
        ctx.fillText(t, c.width / 2, lineH * (i + 0.5), c.width - 30);
    });
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
    sprite.scale.set(width, height, 1);
    sprite.renderOrder = 10;
    return sprite;
}

function friendshipOf(name) {
    return (player.friendship && player.friendship[name]) || 0;
}

function heartsText(name) {
    const level = Math.min(5, Math.ceil(friendshipOf(name) / 2));
    return '💛'.repeat(level) + '🤍'.repeat(5 - level);
}

function addFriendship(name, amount) {
    if (!player.friendship) player.friendship = {};
    const before = friendshipOf(name);
    const after = Math.min(10, before + amount);
    player.friendship[name] = after;
    if (before < 5 && after >= 5) showEvent('💛', `You and ${name} are good friends now!`);
    else if (before < 10 && after >= 10) showEvent('💖', `You and ${name} are best friends!`);
    saveGame();
}

// ---------------------------------------------
// GOING OUTSIDE
// ---------------------------------------------
function goPlayOutside() {
    if (player.age < OUTSIDE_AGE) { showEvent('🚪', "You're too little to play outside by yourself!"); return; }
    if (!scene || !playerMesh || neighborhood3D || inSchool || driving || inStore || inRestaurant || inMall) return;
    if (typeof otherPopupOpen === 'function' && otherPopupOpen()) return;
    buildNeighborhood3D();
}

function buildNeighborhood3D() {
    const block = getNeighborhoodBlock(player.city);
    const snowy = isSnowing();

    // 1. Put the house away (we bring it back in leaveNeighborhood) — but keep YOU in the scene
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj !== playerMesh && obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') { stash.push(obj); scene.remove(obj); }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0;
    const savedBg = scene.background;
    const saved = { pos: playerMesh.position.clone(), rotY: playerMesh.rotation.y };
    const style = streetStyleById(block.style);
    scene.background = new THREE.Color(snowy ? style.skySnow : style.sky);

    const objs = [];
    const colliders = [];
    function add(obj) { scene.add(obj); objs.push(obj); return obj; }
    function box(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.receiveShadow = true;
        return add(m);
    }

    // 2. Ground, street, sidewalks
    buildStreetBase(style, { box, add, snowy });          // ground, road, sidewalks, back trees (street-styles.js)

    // 3. Houses
    block.houses.forEach(h => buildHouse3D(h, add, colliders, snowy, style));
    decorateStreet(style, { add, colliders, snowy, block });   // lamps, benches, cars, scenery

    // 4. The people
    const npcs = [];
    block.houses.forEach(h => {
        if (h.yours) return;
        h.people.forEach(p => npcs.push(spawnNeighbor(p, h, objs)));
    });

    // 5. You: standing on your front lawn
    const yours = block.houses[YOUR_HOUSE_INDEX];
    playerMesh.position.set(yours.x, playerMesh.position.y > 0.5 ? 0.9 : 0, yours.z - 5.2);
    playerMesh.rotation.y = Math.PI;                                  // facing the street

    // A yellow ring and a "You" tag so you can always find yourself from up here
    const youMarker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 28), new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12;
    youMarker.add(ring);
    const youTag = makeNameplateSprite(['⭐ You'], '#d4a017', 2.2, 0.6);
    youTag.position.set(0, 2.8, 0);
    youMarker.add(youTag);
    const markerScale = 1 / playerMesh.scale.x;                       // undo how small kids are drawn
    youMarker.scale.set(markerScale, markerScale, markerScale);
    playerMesh.add(youMarker);
    const sky = new THREE.HemisphereLight(0xffffff, 0x99aa88, 0.55);  // brighten the shady sides of the houses
    add(sky);

    neighborhood3D = { stash, clickables, savedBg, saved, objs, colliders, npcs, block, youMarker,
                       menuNpc: null, tag: null, rps: null, snackDay: {}, last: Date.now(), start: Date.now() };
    setNeighborhoodPause(true);
    document.getElementById('location-name').textContent = streetLabel(player.city);
    showHoodHud();
    updateActionPanel();

    const here = block.classmatesHere;
    showEvent('🌳', here.length
        ? `Welcome to ${streetNameFor(player.city)}! ${here.join(' and ')} live${here.length === 1 ? 's' : ''} on this street. Click someone to say hi!`
        : `Welcome to ${streetNameFor(player.city)}! Click a neighbor to say hi!`);
    camera.position.set(playerMesh.position.x, HOOD_CAM_HEIGHT, playerMesh.position.z + HOOD_CAM_BACK);
    camera.lookAt(playerMesh.position.x, 0, playerMesh.position.z - 12);
    maybeWitnessCrime('street', 8000);        // a stolen bike, a stolen package... (crime.js)
}

// One house, built from boxes. Built facing +z, then turned around for the south side of the street.
function buildHouse3D(h, add, colliders, snowy, style) {
    style = style || streetStyleById(h.style);
    const g = new THREE.Group();
    g.position.set(h.x, 0, h.z);
    if (h.side === 'S') g.rotation.y = Math.PI;
    function box(w, hh, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true; m.receiveShadow = true;
        g.add(m);
        return m;
    }
    const s = h.side === 'S' ? -1 : 1;                                  // local -> world direction

    // other house kinds (street-styles.js: apartments, bungalows, stone cottages...) — same footprint, same front door spot
    const custom = h.kind && h.kind !== 'classic' &&
        ssBuildHouse(h.kind, { b: ssBuilder(m => g.add(m)), h, snowy, st: style, wall: h.wall, roof: snowy ? 0xF4F8FB : h.roof, door: h.door });
    if (custom) ssBuildFrontYard(ssBuilder(m => g.add(m)), style, h, snowy);
    else {
    box(7, 3.4, 5.6, 0, 1.7, 0, h.wall);                                // the house
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.4, 4), new THREE.MeshLambertMaterial({ color: snowy ? 0xF4F8FB : h.roof }));
    roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.82); roof.position.set(0, 4.6, 0); roof.castShadow = true;
    g.add(roof);
    box(0.8, 2, 0.8, 2.4, 4.7, -1, 0x8D4B3C);                           // chimney
    box(1.1, 2.1, 0.12, 0, 1.05, 2.86, h.door || 0x6D4C41);             // front door
    box(0.12, 0.12, 0.08, 0.35, 1.05, 2.95, 0xFFD700);                  // door knob
    [-2.3, 2.3].forEach(x => {                                          // windows
        box(1.5, 1.3, 0.1, x, 1.9, 2.82, 0xFFFFFF);
        box(1.3, 1.1, 0.12, x, 1.9, 2.84, 0x9ED8F5);
    });
    box(2.6, 0.25, 1.4, 0, 0.12, 3.5, 0xBDBDBD);                        // porch step
    [-1.6, 1.6].forEach(x => {                                          // flower beds
        box(0.9, 0.3, 0.5, x, 0.15, 3.4, 0x4E9F3D);
        box(0.18, 0.18, 0.18, x - 0.2, 0.4, 3.4, 0xE91E63);
        box(0.18, 0.18, 0.18, x + 0.2, 0.4, 3.4, 0xFFD700);
    });
    box(1.3, 0.05, 4.2, 0, 0.03, 4.9, 0xD0D0D0);                        // path to the sidewalk
    // mailbox by the sidewalk
    box(0.1, 0.9, 0.1, 1.9, 0.45, 6.7, 0x555555);
    box(0.45, 0.32, 0.55, 1.9, 1.0, 6.7, 0x2980B9);
    }
    // a tree in the front yard (the style's own kind of tree)
    if (h.tree) ssTree(ssBuilder(m => g.add(m)), style.treeKinds[h.index % style.treeKinds.length], style, snowy, 4.9, 5.4, true);
    // the garage + driveway (+ a parked car on some)
    if (h.garage) {
        box(3.2, 2.6, 5.0, -4.6, 1.3, 0, h.wall);
        box(3.4, 0.2, 5.2, -4.6, 2.7, 0, snowy ? 0xF4F8FB : h.roof);
        box(2.6, 2.0, 0.1, -4.6, 1.0, 2.52, 0xE0E0E0);
        box(2.8, 0.05, 5.6, -4.6, 0.03, 5.6, 0x9E9E9E);
        if (h.index % 2 === 0) {
            const { car } = buildCarModel(snowy);
            car.position.set(-4.6, 0, 5.4);
            g.add(car);
            colliders.push({ minX: h.x + s * -4.6 - 1.4, maxX: h.x + s * -4.6 + 1.4, minZ: h.z + s * 5.4 - 2.5, maxZ: h.z + s * 5.4 + 2.5 });
        }
        colliders.push({ minX: h.x + s * -4.6 - 1.7, maxX: h.x + s * -4.6 + 1.7, minZ: h.z - 2.9, maxZ: h.z + 2.9 });
    }
    colliders.push({ minX: h.x - 3.6, maxX: h.x + 3.6, minZ: h.z - 2.9, maxZ: h.z + 2.9 });

    add(g);
    // The family's name above the house (and which school friend lives there)
    const kidFriend = h.people.find(p => p.classmate);
    const label = h.yours
        ? makeNameplateSprite(['🏠 Your House', 'Home sweet home'], '#c0392b', 7.5, 1.9)
        : makeNameplateSprite(kidFriend ? [`The ${h.surname} Family`, `🎒 ${kidFriend.name} lives here`] : [`The ${h.surname} Family`], kidFriend ? '#2980b9' : '#5d6d7e', 7.5, kidFriend ? 1.9 : 1.2);
    label.position.set(h.x, 7.4, h.z);
    add(label);
}

// A neighbor (parent or kid) standing in their front yard.
function spawnNeighbor(p, h, objs) {
    registerNeighborPersona(p);
    const s = h.side === 'S' ? 1 : -1;                                  // which way is the street?  N houses: street is +z
    const yardNear = h.side === 'N' ? -9.2 : 4.2;
    const yardFar  = h.side === 'N' ? -4.2 : 9.2;
    const kid = p.role === 'kid';
    const zone = {
        minX: h.x - (h.garage ? 3 : 4.5), maxX: h.x + (h.garage ? 3 : 4.5),
        minZ: kid ? Math.min(yardNear, yardFar) + (h.side === 'N' ? 0 : -2.2) : Math.min(yardNear, yardFar),
        maxZ: kid ? Math.max(yardNear, yardFar) + (h.side === 'N' ? 2.2 : 0) : Math.max(yardNear, yardFar)
    };
    const x = zone.minX + Math.random() * (zone.maxX - zone.minX);
    const z = zone.minZ + Math.random() * (zone.maxZ - zone.minZ);
    const group = buildNPC(x, z, p.shirt, p.hair, {
        isNeighbor: true, name: p.name, role: p.role, classmate: p.classmate, gender: p.gender, houseIndex: h.index, family: h.surname
    });
    const scale = kid ? 0.74 : 1.0;
    group.scale.set(scale, scale, scale);
    const label = makeNameplateSprite(p.classmate ? [p.name + ' 🎒'] : [p.title || p.name], p.classmate ? '#2980b9' : kid ? '#27ae60' : '#8e44ad', 2.6, 0.62);
    label.position.set(0, 2.45, 0);
    label.scale.set(2.6 / scale, 0.62 / scale, 1);
    group.add(label);
    objs.push(group);
    return { group, data: group.userData.npcData, zone, target: null, wait: Math.random() * 3, speed: kid ? 1.8 : 1.1, state: 'wander', phase: Math.random() * 6 };
}

// ---------------------------------------------
// MOVING AROUND (runs every frame from animate() in world.js)
// ---------------------------------------------
function resolveHoodCollisions(pos, radius, colliders) {
    colliders.forEach(r => {
        const minX = r.minX - radius, maxX = r.maxX + radius, minZ = r.minZ - radius, maxZ = r.maxZ + radius;
        if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
            const pushL = pos.x - minX, pushR = maxX - pos.x, pushU = pos.z - minZ, pushD = maxZ - pos.z;
            const m = Math.min(pushL, pushR, pushU, pushD);
            if (m === pushL) pos.x = minX; else if (m === pushR) pos.x = maxX;
            else if (m === pushU) pos.z = minZ; else pos.z = maxZ;
        }
    });
    pos.x = Math.max(HOOD_BOUNDS.minX, Math.min(HOOD_BOUNDS.maxX, pos.x));
    pos.z = Math.max(HOOD_BOUNDS.minZ, Math.min(HOOD_BOUNDS.maxZ, pos.z));
}

function updateNeighborhood() {
    const n = neighborhood3D;
    if (!n) return;
    const now = Date.now();
    const dt = Math.min(0.05, (now - n.last) / 1000);
    n.last = now;
    const t = (now - n.start) / 1000;

    // You
    let dx = 0, dz = 0;
    { const mv = getMoveInput(); dx = mv.x; dz = mv.z; }
    if ((dx || dz) && !(n.game && n.game.freeze)) {
        const len = Math.hypot(dx, dz);
        playerMesh.position.x += dx / len * HOOD_WALK_SPEED * dt;
        playerMesh.position.z += dz / len * HOOD_WALK_SPEED * dt;
        playerMesh.rotation.y = Math.atan2(dx, dz);
        resolveHoodCollisions(playerMesh.position, 0.45, n.colliders);
    }

    // Everyone else
    n.npcs.forEach(npc => {
        const g = npc.group;
        if (n.tag && n.tag.npc === npc) return;                          // being chased: handled below
        if (n.game && n.game.npc === npc) return;                        // in a street game: kids-games-street.js moves them
        if (n.menuNpc === npc) {                                         // talking to you: stop and look at you
            g.rotation.y = Math.atan2(playerMesh.position.x - g.position.x, playerMesh.position.z - g.position.z);
            return;
        }
        if (npc.wait > 0) { npc.wait -= dt; g.position.y = 0; return; }
        if (!npc.target) {
            npc.target = {
                x: npc.zone.minX + Math.random() * (npc.zone.maxX - npc.zone.minX),
                z: npc.zone.minZ + Math.random() * (npc.zone.maxZ - npc.zone.minZ)
            };
        }
        const ddx = npc.target.x - g.position.x, ddz = npc.target.z - g.position.z;
        const dist = Math.hypot(ddx, ddz);
        if (dist < 0.2) { npc.target = null; npc.wait = 1.5 + Math.random() * 4; g.position.y = 0; return; }
        const step = Math.min(dist, npc.speed * dt);
        g.position.x += ddx / dist * step;
        g.position.z += ddz / dist * step;
        g.rotation.y = Math.atan2(ddx, ddz);
        g.position.y = Math.abs(Math.sin(t * 6 + npc.phase)) * 0.06;     // a little walking bounce
    });

    updateTag(n, dt, t);
    if (typeof updateHoodGame === 'function') updateHoodGame(n, dt, t);   // hide & seek, red light, race (kids-games-street.js)

    // The camera follows you from above and behind
    const cx = Math.max(-9, Math.min(9, playerMesh.position.x));
    camera.position.x += (cx - camera.position.x) * 0.1;
    camera.position.y = HOOD_CAM_HEIGHT;
    camera.position.z += (Math.max(-4, Math.min(8, playerMesh.position.z)) + HOOD_CAM_BACK - camera.position.z) * 0.1;
    camera.lookAt(camera.position.x, 0, camera.position.z - HOOD_CAM_BACK + 1);
    renderer.render(scene, camera);
}

// ---------------------------------------------
// HUD + the "what do you want to do?" menu
// ---------------------------------------------
function showHoodHud() {
    removeHoodOverlay('hood-hud');
    const el = document.createElement('div');
    el.id = 'hood-hud';
    el.style.cssText = 'position:fixed; top:56px; left:0; right:0; z-index:240; text-align:center; pointer-events:none; font-family:Arial;';
    el.innerHTML = `<span id="hood-hud-text" style="display:inline-block; background:rgba(22,33,62,0.88); border:2px solid #27ae60; color:#fff;
        padding:7px 18px; border-radius:14px; font-size:1em;">${streetLabel(player.city)} — walk with the arrow keys / WASD, click a person to talk or play!</span>`;
    document.body.appendChild(el);
}

function setHoodHud(text) {
    const el = document.getElementById('hood-hud-text');
    if (el) el.innerHTML = text;
}

function removeHoodOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Called from interactWithNPC (events.js) when you click a neighbor.
function openNeighborMenu(npcData) {
    const n = neighborhood3D;
    if (!n) return;
    const npc = n.npcs.find(x => x.data.name === npcData.name);
    if (!npc) return;
    if (n.tag || n.rps || n.game || document.getElementById('chat-overlay') || document.getElementById('kg-overlay') || document.getElementById('kg-picker')) return;     // busy with something
    const g = npc.group.position, p = playerMesh.position;
    if (Math.hypot(g.x - p.x, g.z - p.z) > TALK_DISTANCE) {
        showEvent('🚶', `Walk closer to ${npcData.name} first!`);
        return;
    }
    removeHoodOverlay('hood-menu');
    n.menuNpc = npc;
    const d = npc.data, kid = d.role === 'kid';
    const snackedToday = n.snackDay[d.name] === dinnerDayKey();
    const role = d.classmate ? '🎒 Your school friend' : kid ? '🧒 Neighbor kid' : `🏡 Lives at the ${d.family} house`;
    const btn = (onclick, text, color, disabled) => `<button onclick="${onclick}" ${disabled ? 'disabled' : ''} style="
        margin:4px; padding:10px 16px; border:none; border-radius:10px; font-size:0.95em; font-weight:bold;
        cursor:${disabled ? 'not-allowed' : 'pointer'}; color:white; background:${disabled ? '#555' : color};">${text}</button>`;

    const el = document.createElement('div');
    el.id = 'hood-menu';
    el.style.cssText = `position:fixed; left:50%; transform:translateX(-50%); bottom:96px; z-index:260; font-family:Arial;
        background:rgba(22,33,62,0.96); border:3px solid #27ae60; border-radius:16px; padding:14px 20px; text-align:center; max-width:94vw;`;
    el.innerHTML = `
        <div style="color:#FFD700; font-size:1.15em; font-weight:bold;">${d.name}</div>
        <div style="color:#aaa; font-size:0.85em; margin-bottom:2px;">${role}</div>
        <div style="margin-bottom:8px;" title="How well you know each other">${heartsText(d.name)}</div>
        ${btn('neighborChat()', '💬 Chat', '#3498db')}
        ${btn('neighborRPS()', '✊ Rock-Paper-Scissors', '#8e44ad')}
        ${btn('neighborGames()', '🎮 More games', '#16a085')}
        ${kid ? btn('neighborTag()', '🏃 Play Tag', '#e67e22') : btn('neighborSnack()', snackedToday ? '🍪 (already had a snack today)' : '🍪 Ask for a snack', '#d35400', snackedToday)}
        ${btn('closeNeighborMenu()', '✖ Close', '#555')}`;
    document.body.appendChild(el);
}

function closeNeighborMenu() {
    removeHoodOverlay('hood-menu');
    if (neighborhood3D) neighborhood3D.menuNpc = null;
}

function neighborChat() {
    const n = neighborhood3D;
    if (!n || !n.menuNpc) return;
    const name = n.menuNpc.data.name;
    removeHoodOverlay('hood-menu');
    showClassmateChat(name);                      // the same chat school classmates use (chat.js)
    addFriendship(name, 0.5);
}

// 🎮 The full list of games (table games with anyone, street games with kids) — kids-games.js
function neighborGames() {
    const n = neighborhood3D;
    if (!n || !n.menuNpc) return;
    const d = n.menuNpc.data;
    removeHoodOverlay('hood-menu');
    showGamePicker({ name: d.name, role: d.role });
}

// ---------------------------------------------
// ✊ ROCK-PAPER-SCISSORS (best of 3)
// ---------------------------------------------
function neighborRPS() {
    const n = neighborhood3D;
    if (!n || !n.menuNpc) return;
    n.rps = { name: n.menuNpc.data.name, you: 0, them: 0, round: 0, log: '' };
    removeHoodOverlay('hood-menu');
    renderRPS();
}

function renderRPS() {
    const n = neighborhood3D;
    if (!n || !n.rps) return;
    const r = n.rps;
    removeHoodOverlay('rps-overlay');
    const el = document.createElement('div');
    el.id = 'rps-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.6); font-family:Arial;`;
    const over = r.you === 2 || r.them === 2;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #8e44ad; border-radius:16px; padding:26px 34px; text-align:center; min-width:300px;">
            <h2 style="color:#FFD700; margin-bottom:4px;">✊✋✌️ Rock-Paper-Scissors</h2>
            <p style="color:#aaa; margin-bottom:10px;">You vs ${r.name} — first to 2 wins!</p>
            <p style="color:#fff; font-size:1.4em; margin-bottom:8px;">You <b style="color:#2ecc71">${r.you}</b> — <b style="color:#e74c3c">${r.them}</b> ${r.name}</p>
            <p style="color:#d9b99b; min-height:2.6em; margin-bottom:12px;">${r.log || 'Ready? Pick one!'}</p>
            ${over ? `
                <h3 style="color:${r.you === 2 ? '#2ecc71' : '#e67e22'}; margin-bottom:10px;">${r.you === 2 ? '🎉 You won!' : `😄 ${r.name} won!`}</h3>
                <button onclick="finishRPS()" style="font-size:1.05em; padding:10px 26px; border:none; border-radius:10px; background:#3498db; color:white; cursor:pointer; font-weight:bold;">Done</button>
            ` : ['✊', '✋', '✌️'].map((e, i) => `
                <button onclick="playRPS(${i})" style="font-size:2.2em; margin:4px; padding:8px 18px; border:2px solid #8e44ad; border-radius:12px;
                    background:#0f3460; cursor:pointer;">${e}</button>`).join('')}
        </div>`;
    document.body.appendChild(el);
}

function playRPS(mine) {
    const n = neighborhood3D;
    if (!n || !n.rps) return;
    const r = n.rps;
    const theirs = Math.floor(Math.random() * 3);
    const icons = ['✊', '✋', '✌️'];
    const result = (mine - theirs + 3) % 3;                 // 0 tie, 1 you win (paper beats rock...), 2 they win
    if (result === 1) r.you++; else if (result === 2) r.them++;
    r.log = `You ${icons[mine]}  vs  ${icons[theirs]} ${r.name} — ` + (result === 0 ? "it's a tie! Go again." : result === 1 ? 'you win this round!' : `${r.name} wins this round!`);
    renderRPS();
}

function finishRPS() {
    const n = neighborhood3D;
    if (!n || !n.rps) return;
    const r = n.rps;
    n.rps = null;
    removeHoodOverlay('rps-overlay');
    n.menuNpc = null;
    player.happiness = Math.min(100, player.happiness + (r.you === 2 ? 8 : 5));
    updateStats();
    addFriendship(r.name, 1);
    showEvent(r.you === 2 ? '🎉' : '😄', r.you === 2 ? `You beat ${r.name}! +8 happiness` : `Good game, ${r.name}! +5 happiness`);
}

// ---------------------------------------------
// 🍪 SNACKS (parents)
// ---------------------------------------------
const NEIGHBOR_SNACKS = [
    { text: 'a warm chocolate-chip cookie 🍪', hap: 6, health: 0 },
    { text: 'a pink frosted cupcake 🧁', hap: 7, health: -1 },
    { text: 'some fresh apple slices 🍎', hap: 4, health: 3 },
    { text: 'a glass of cold milk 🥛', hap: 4, health: 2 },
    { text: 'homemade lemonade 🍋', hap: 5, health: 1 },
    { text: 'a banana-bread slice 🍞', hap: 6, health: 0 }
];

function neighborSnack() {
    const n = neighborhood3D;
    if (!n || !n.menuNpc) return;
    const d = n.menuNpc.data;
    if (n.snackDay[d.name] === dinnerDayKey()) return;
    n.snackDay[d.name] = dinnerDayKey();
    const snack = NEIGHBOR_SNACKS[Math.floor(Math.random() * NEIGHBOR_SNACKS.length)];
    player.happiness = Math.min(100, player.happiness + snack.hap);
    player.health = Math.max(0, Math.min(100, player.health + snack.health));
    updateStats();
    closeNeighborMenu();
    addFriendship(d.name, 1);
    showEvent('🍪', `${d.name} gave you ${snack.text} +${snack.hap} happiness`);
}

// ---------------------------------------------
// 🏃 TAG — chase the kid down before time runs out
// ---------------------------------------------
function neighborTag() {
    const n = neighborhood3D;
    if (!n || !n.menuNpc || n.tag) return;
    const npc = n.menuNpc;
    removeHoodOverlay('hood-menu');
    n.menuNpc = null;
    npc.target = null;
    n.tag = { npc, timeLeft: TAG_SECONDS, headStart: 1.4 };       // they get a head start before the clock begins
    showEvent('🏃', `You're IT! ${npc.data.name} is running — catch them!`);
}

function updateTag(n, dt, t) {
    const tag = n.tag;
    if (!tag) return;
    const g = tag.npc.group, p = playerMesh.position;
    const dx = g.position.x - p.x, dz = g.position.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (tag.headStart > 0) {                                      // "3... 2... 1... GO!" — only they run
        tag.headStart -= dt;
        setHoodHud(`🏃 Get ready... <b>${tag.npc.data.name}</b> is running!`);
    } else {
        tag.timeLeft -= dt;
        setHoodHud(`🏃 Tag! Catch <b>${tag.npc.data.name}</b> — <b style="color:#f1c40f">${Math.max(0, Math.ceil(tag.timeLeft))}s</b> left`);
        if (dist < 1.05) { endTag(true); return; }
        if (tag.timeLeft <= 0) { endTag(false); return; }
    }

    // Run away from you, zig-zagging a little, and steer away from walls so they can't get stuck in a corner
    let ax = dx / (dist || 1), az = dz / (dist || 1);
    const wiggle = Math.sin(t * 3 + tag.npc.phase) * 0.7;
    const rx = ax * Math.cos(wiggle) - az * Math.sin(wiggle), rz = ax * Math.sin(wiggle) + az * Math.cos(wiggle);
    let mx = rx, mz = rz;
    if (g.position.x < HOOD_BOUNDS.minX + 2) mx += 1; if (g.position.x > HOOD_BOUNDS.maxX - 2) mx -= 1;
    if (g.position.z < HOOD_BOUNDS.minZ + 2) mz += 1; if (g.position.z > HOOD_BOUNDS.maxZ - 2) mz -= 1;
    const len = Math.hypot(mx, mz) || 1;
    const speed = 3.6;                 // you run at 4.0, so you CAN catch them — but not right away
    g.position.x += mx / len * speed * dt;
    g.position.z += mz / len * speed * dt;
    resolveHoodCollisions(g.position, 0.4, n.colliders);
    g.rotation.y = Math.atan2(mx, mz);
    g.position.y = Math.abs(Math.sin(t * 10)) * 0.08;
}

function endTag(caught) {
    const n = neighborhood3D;
    if (!n || !n.tag) return;
    const name = n.tag.npc.data.name;
    n.tag.npc.wait = 2;
    n.tag = null;
    setHoodHud(`${streetLabel(player.city)} — walk with the arrow keys / WASD, click a person to talk or play!`);
    player.happiness = Math.min(100, player.happiness + (caught ? 9 : 4));
    updateStats();
    addFriendship(name, caught ? 1.5 : 0.5);
    showEvent(caught ? '🎉' : '😄', caught ? `Tag! You caught ${name}! +9 happiness` : `${name} got away! That was fun anyway. +4 happiness`);
}

// ---------------------------------------------
// GOING HOME
// ---------------------------------------------
function leaveNeighborhood() {
    const n = neighborhood3D;
    if (!n) return;
    if (n.tag) { n.tag = null; }
    ['hood-hud', 'hood-menu', 'rps-overlay', 'chat-overlay', 'kg-overlay', 'kg-picker'].forEach(removeHoodOverlay);
    kg = null;
    neighborhood3D = null;
    playerMesh.remove(n.youMarker); disposeTree(n.youMarker);
    n.objs.forEach(obj => { scene.remove(obj); disposeTree(obj); });
    scene.background = n.savedBg;
    n.stash.forEach(obj => scene.add(obj));                  // the house, exactly as it was
    clickableNPCs.length = 0;
    n.clickables.forEach(c => clickableNPCs.push(c));
    playerMesh.position.copy(n.saved.pos);
    playerMesh.rotation.y = n.saved.rotY;
    setNeighborhoodPause(false);
    document.getElementById('location-name').textContent = '🏠 Home';
    updateActionPanel();
    showEvent('🏠', "You're back home! That was fun.");
}

// Called by restartGame() so being outside never leaks into the next life.
function resetNeighborhood() {
    ['hood-hud', 'hood-menu', 'rps-overlay'].forEach(removeHoodOverlay);
    neighborhood3D = null;
    inNeighborhood = false;
}
