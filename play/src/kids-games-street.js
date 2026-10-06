// =============================================
// STREET GAMES — the 3D games you play outside with a neighbor kid or school friend.
//
//   🙈 Hide & Seek           the kid hides in a front yard; find them before time runs out (hot / cold hints)
//   🚦 Red Light, Green Light run to the kid on GREEN, freeze on RED — if you move on red, back to the start!
//   🏁 Race                  race the kid along the sidewalk to the end of the street
//   (🏃 Tag lives in neighborhood.js)
//
// Started from the games list (kids-games.js). Runs inside updateNeighborhood()
// every frame via updateHoodGame(). n.game holds the game in progress (or null).
// =============================================

const STREET_GAME_START_X = -21;
const STREET_GAME_GOAL_X = 21;

function startHoodGame(type) {
    const n = neighborhood3D;
    if (!n || !kg || !kg.who) return;
    const npc = n.npcs.find(x => x.data.name === kg.who.name);
    kg = null;
    if (!npc || n.tag || n.game) return;
    n.menuNpc = npc;                                   // they stand still while we set up
    removeHoodOverlay('hood-menu');
    const orig = { x: npc.group.position.x, z: npc.group.position.z };
    const name = npc.data.name;
    npc.target = null;

    if (type === 'hide') {
        const houses = n.block.houses.filter(h => !h.yours);
        const h = houses[Math.floor(Math.random() * houses.length)];
        const s = h.side === 'S' ? -1 : 1;                           // which way is "toward the street" for this house
        // hiding behind the tree / mailbox in somebody's FRONT yard (somewhere you can actually walk to)
        n.game = { type, npc, orig, name, timeLeft: 50, count: 4, freeze: true,
                   spot: { x: h.x + s * 4.9 + (Math.random() - 0.5), z: h.z + s * 5.9 } };
        npc.group.visible = false;
        showEvent('🙈', `Hide & Seek! Close your eyes and count... ${name} is hiding!`);
    } else if (type === 'rlgl') {
        n.game = { type, npc, orig, name, timeLeft: 70, count: 3, freeze: true, light: 'green', switchIn: 2, grace: 0, prev: null };
        npc.group.position.set(STREET_GAME_GOAL_X, 0, 4.6);
        npc.group.rotation.y = Math.PI / 2;
        playerMesh.position.set(STREET_GAME_START_X, 0, 4.6);
        playerMesh.rotation.y = Math.PI / 2;
        showEvent('🚦', `Red Light, Green Light! Run to ${name} on GREEN, freeze on RED!`);
    } else if (type === 'race') {
        n.game = { type, npc, orig, name, timeLeft: 40, count: 3, freeze: true, started: false };
        npc.group.position.set(STREET_GAME_START_X, 0, 5.1);
        npc.group.rotation.y = Math.PI / 2;
        playerMesh.position.set(STREET_GAME_START_X, 0, 4.2);
        playerMesh.rotation.y = Math.PI / 2;
        showEvent('🏁', `Race ${name} to the end of the street! Get ready...`);
    }
}

function endHoodGame(won, message) {
    const n = neighborhood3D;
    if (!n || !n.game) return;
    const g = n.game;
    n.game = null;
    g.npc.group.visible = true;
    g.npc.group.position.set(g.orig.x, 0, g.orig.z);
    g.npc.wait = 2;
    playerMesh.position.set(g.orig.x - 2.2, 0, g.orig.z);
    resolveHoodCollisions(playerMesh.position, 0.45, n.colliders);
    n.menuNpc = null;
    setHoodHud(`${streetLabel(player.city)} — walk with the arrow keys / WASD, click a person to talk or play!`);
    player.happiness = Math.min(100, player.happiness + (won ? 9 : 4));
    updateStats();
    addFriendship(g.name, won ? 1.5 : 0.5);
    showEvent(won ? '🎉' : '😄', `${message} ${won ? '+9' : '+4'} happiness`);
}

function updateHoodGame(n, dt, t) {
    const g = n.game;
    if (!g) return;
    const p = playerMesh.position, npcPos = g.npc.group.position;

    // "3... 2... 1..." — everything waits
    if (g.count > 0) {
        g.count -= dt;
        setHoodHud(g.type === 'hide' ? `🙈 Counting... <b>${Math.max(1, Math.ceil(g.count))}</b> (eyes closed!)`
                                     : `${g.type === 'race' ? '🏁' : '🚦'} Get ready... <b>${Math.max(1, Math.ceil(g.count))}</b>`);
        if (g.count <= 0) {
            g.freeze = false;
            if (g.type === 'hide') { npcPos.set(g.spot.x, 0, g.spot.z); showEvent('🔎', 'Ready or not, here I come!'); }
            if (g.type === 'race') { g.started = true; showEvent('🏁', 'GO!'); }
            g.prev = { x: p.x, z: p.z };
        }
        return;
    }
    g.timeLeft -= dt;

    if (g.type === 'hide') {
        const dist = Math.hypot(npcPos.x - p.x, npcPos.z - p.z);
        const hint = dist < 6 ? '🔥 <b style="color:#e74c3c">Hot!</b>' : dist < 12 ? '☀️ <b style="color:#f39c12">Warm</b>' : dist < 20 ? '🌤️ Cool' : '🧊 <b style="color:#5dade2">Cold</b>';
        setHoodHud(`🙈 Find <b>${g.name}</b>! ${hint} — <b style="color:#f1c40f">${Math.max(0, Math.ceil(g.timeLeft))}s</b>`);
        if (dist < 2.4) { g.npc.group.visible = true; endHoodGame(true, `Found you, ${g.name}!`); return; }
        if (g.timeLeft <= 0) { endHoodGame(false, `Time's up! ${g.name} was hiding in a front yard.`); return; }
    }

    if (g.type === 'rlgl') {
        g.switchIn -= dt;
        if (g.grace > 0) g.grace -= dt;
        if (g.switchIn <= 0) {
            g.light = g.light === 'green' ? 'red' : 'green';
            g.switchIn = g.light === 'green' ? 1.8 + Math.random() * 2.2 : 1.4 + Math.random() * 1.4;
            g.grace = g.light === 'red' ? 0.45 : 0;                       // a moment to stop
            g.npc.group.rotation.y = g.light === 'red' ? -Math.PI / 2 : Math.PI / 2;   // faces you on red, turns away on green
        }
        if (g.light === 'red' && g.grace <= 0 && g.prev && Math.hypot(p.x - g.prev.x, p.z - g.prev.z) > 0.02) {
            p.set(STREET_GAME_START_X, p.y, 4.6);                         // caught moving! back to the start
            g.light = 'green'; g.switchIn = 2; g.freeze = true; g.penalty = 1.2;
            showEvent('🔴', 'You moved on RED! Back to the start!');
        }
        if (g.penalty > 0) { g.penalty -= dt; if (g.penalty <= 0) g.freeze = false; }
        g.prev = { x: p.x, z: p.z };
        setHoodHud(`${g.light === 'green' ? '🟢 <b style="color:#2ecc71">GREEN — run!</b>' : '🔴 <b style="color:#e74c3c">RED — freeze!</b>'} &nbsp; <b style="color:#f1c40f">${Math.max(0, Math.ceil(g.timeLeft))}s</b>`);
        if (p.x >= STREET_GAME_GOAL_X - 1.5) { endHoodGame(true, `You reached ${g.name}!`); return; }
        if (g.timeLeft <= 0) { endHoodGame(false, `Time's up! ${g.name} wins this one.`); return; }
    }

    if (g.type === 'race') {
        const speed = 3.3 + 0.5 * Math.sin(t * 1.3 + g.npc.phase) + 0.25;     // the kid runs about as fast as you
        npcPos.x += speed * dt;
        npcPos.y = Math.abs(Math.sin(t * 10)) * 0.08;
        setHoodHud(`🏁 Race! You: <b>${Math.max(0, Math.round(p.x - STREET_GAME_START_X))}</b> &nbsp;vs&nbsp; ${g.name}: <b>${Math.max(0, Math.round(npcPos.x - STREET_GAME_START_X))}</b> &nbsp;(finish at ${STREET_GAME_GOAL_X - STREET_GAME_START_X})`);
        if (p.x >= STREET_GAME_GOAL_X) { endHoodGame(true, `You won the race against ${g.name}!`); return; }
        if (npcPos.x >= STREET_GAME_GOAL_X) { endHoodGame(false, `${g.name} won the race!`); return; }
        if (g.timeLeft <= 0) { endHoodGame(false, `Time's up!`); return; }
    }
}
