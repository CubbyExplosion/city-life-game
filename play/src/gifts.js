// =============================================
// GIFTS — birthday presents, Santa's presents, and the toys inside them.
// A present is just a little record in player.gifts until you click its
// 3D box in the house to open it. Toys you win go into player.toys, show
// up on the toy rug in your room, and can be played with from the Toys button.
// =============================================

function toyById(id) {
    return TOY_DATA.find(t => t.id === id);
}

// Adds a wrapped present to the pile (returns false if the pile is full).
function giveGift(kind) {
    if (!player.gifts) player.gifts = [];
    if (player.gifts.length >= MAX_PENDING_GIFTS) return false;
    player.gifts.push({ id: 'g' + Date.now() + '_' + Math.floor(Math.random() * 100000), kind });
    return true;
}

// Same present = same wrapping paper every time the room is rebuilt.
function giftColorFor(gift) {
    let h = 0;
    for (const ch of gift.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const palette = gift.kind === 'santa'
        ? [0xC0392B, 0x1E8449, 0xD4AC0D, 0x2874A6]
        : [0xE74C3C, 0x3498DB, 0x9B59B6, 0xF39C12, 0x1ABC9C, 0xE91E8C];
    return palette[h % palette.length];
}

// =============================================
// THE HOUSE EXTRAS — everything the house shows that changes over time
// =============================================

// Rebuilds the tree, the presents and the toy rug. Safe to call any time —
// it throws away the old ones first so nothing is ever doubled.
function refreshHomeExtras() {
    if (!scene || inSchool || driving || inStore) return;
    homeExtras.forEach(obj => {
        scene.remove(obj);
        const i = clickableNPCs.indexOf(obj);
        if (i > -1) clickableNPCs.splice(i, 1);
    });
    homeExtras = [];

    if (isWinter()) buildChristmasTree();
    buildGiftBoxes();
    buildToyDisplay();
    syncWeather();
}

function buildChristmasTree() {
    const tree = new THREE.Group();
    function part(geo, color, x, y, z) {
        const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true;
        tree.add(m);
    }
    part(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), 0x6D4C41, 0, 0.3, 0);   // trunk
    part(new THREE.ConeGeometry(1.1, 1.3, 10),  0x1E8449, 0, 1.2, 0);            // bottom layer
    part(new THREE.ConeGeometry(0.85, 1.1, 10), 0x239B56, 0, 1.95, 0);           // middle layer
    part(new THREE.ConeGeometry(0.55, 0.9, 10), 0x28B463, 0, 2.6, 0);            // top layer
    part(new THREE.OctahedronGeometry(0.2), 0xFFD700, 0, 3.15, 0);               // the star
    [[0.7, 1.0, 0.3, 0xE74C3C], [-0.6, 1.3, 0.5, 0x3498DB], [0.3, 1.8, -0.5, 0xF1C40F],
     [-0.4, 2.0, 0.4, 0xE91E8C], [0.2, 2.5, 0.35, 0xE74C3C], [-0.25, 2.7, -0.2, 0x3498DB]]
        .forEach(([x, y, z, c]) => part(new THREE.SphereGeometry(0.1, 8, 8), c, x, y, z)); // ornaments
    tree.position.set(3.0, 0, -3.9);
    scene.add(tree);
    homeExtras.push(tree);
}

function buildGiftMesh(gift, slot) {
    const group = new THREE.Group();
    const wrap = giftColorFor(gift);
    const ribbon = gift.kind === 'santa' ? 0xFFD700 : 0xFFFFFF;
    function part(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true;
        group.add(m);
        return m;
    }
    part(0.8, 0.6, 0.8, 0, 0.3, 0, wrap);          // the box
    part(0.14, 0.62, 0.82, 0, 0.3, 0, ribbon);     // ribbon one way
    part(0.82, 0.62, 0.14, 0, 0.3, 0, ribbon);     // ribbon the other way
    part(0.28, 0.14, 0.14, 0, 0.67, 0, ribbon).rotation.y = 0.8;   // the bow
    part(0.28, 0.14, 0.14, 0, 0.67, 0, ribbon).rotation.y = -0.8;

    if (gift.kind === 'santa') {
        group.position.set(2.0 + (slot % 3) * 0.75, 0, -3.1 + Math.floor(slot / 3) * 0.8); // under the tree
    } else {
        group.position.set(-1.8 + (slot % 5) * 0.95, 0, 2.3 + Math.floor(slot / 5) * 0.9);  // front of the room
    }
    group.userData.npcData = { name: 'Gift', isGift: true, giftId: gift.id }; // clicking it opens it
    group.userData.phase = Math.random() * 6;
    return group;
}

function buildGiftBoxes() {
    let birthdaySlot = 0, santaSlot = 0;
    (player.gifts || []).forEach(gift => {
        const slot = gift.kind === 'santa' ? santaSlot++ : birthdaySlot++;
        const mesh = buildGiftMesh(gift, slot);
        scene.add(mesh);
        homeExtras.push(mesh);
        clickableNPCs.push(mesh);
    });
}

// A purple play-rug in the front-left corner with every toy you own on it.
function buildToyDisplay() {
    const toys = (player.toys || []).slice(0, 24);
    if (!toys.length) return;

    const rug = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 0.04, 1.9),
        new THREE.MeshLambertMaterial({ color: 0x6C5CE7 })
    );
    rug.position.set(-2.4, 0.03, 4.0);
    scene.add(rug);
    homeExtras.push(rug);

    toys.forEach((id, i) => {
        const toy = toyById(id);
        if (!toy) return;
        const mat = new THREE.MeshLambertMaterial({ color: toy.color });
        const group = new THREE.Group();
        if (toy.shape === 'ball') {
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), mat);
            m.position.y = 0.24;
            group.add(m);
        } else if (toy.shape === 'tall') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.4, 0.22), mat);
            body.position.y = 0.24;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat);
            head.position.y = 0.55;
            group.add(body, head);
        } else {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.32), mat);
            m.position.y = 0.19;
            group.add(m);
        }
        group.position.set(-4.5 + (i % 8) * 0.55, 0, 3.5 + Math.floor(i / 8) * 0.6);
        scene.add(group);
        homeExtras.push(group);
    });
}

// Called every frame from animate(): presents hop a little so you notice them.
function animateHomeExtras() {
    if (!homeExtras.length || inSchool || driving || inStore) return;
    const t = Date.now() * 0.004;
    homeExtras.forEach(obj => {
        if (obj.userData.npcData && obj.userData.npcData.isGift) {
            obj.position.y = Math.abs(Math.sin(t + obj.userData.phase)) * 0.12;
        }
    });
}

// =============================================
// OPENING A PRESENT
// =============================================

// What's inside? Birthday presents are mostly toys (sometimes a card with money).
// Santa's presents are always toys, and often a special Santa-only one.
function rollGiftReward(kind) {
    if (kind === 'birthday' && Math.random() < 0.3) {
        const amount = [5, 10, 15][Math.floor(Math.random() * 3)];
        return { type: 'cash', amount };
    }
    const owned = player.toys || [];
    const eligible = TOY_DATA.filter(t => t.minAge <= Math.max(player.age, 1) && !owned.includes(t.id));
    const special = eligible.filter(t => t.santa);
    const regular = eligible.filter(t => !t.santa);

    let pool = regular;
    if (kind === 'santa') {
        pool = (special.length && Math.random() < 0.6) ? special : (regular.length ? regular : special);
    }
    if (!pool.length) return { type: 'cash', amount: 10 }; // you own every toy — here's a gift card instead!
    return { type: 'toy', toy: pool[Math.floor(Math.random() * pool.length)] };
}

function openGift(giftId) {
    if (document.getElementById('gift-overlay')) return;
    const list = player.gifts || [];
    const idx = list.findIndex(g => g.id === giftId);
    if (idx < 0) return;
    const gift = list.splice(idx, 1)[0];
    const fromSanta = gift.kind === 'santa';
    const reward = rollGiftReward(gift.kind);

    let emoji, title, line;
    if (reward.type === 'toy') {
        if (!player.toys) player.toys = [];
        player.toys.push(reward.toy.id);
        const hap = fromSanta ? 12 : 8;
        player.happiness = Math.min(100, player.happiness + hap);
        emoji = reward.toy.emoji;
        title = `You got a ${reward.toy.name}!`;
        line = `+${hap} 😊 — it's in your 🧸 Toys now!` + (reward.toy.santa ? ' ⭐ A special Santa toy!' : '');
    } else {
        player.money += reward.amount;
        player.happiness = Math.min(100, player.happiness + 4);
        emoji = '💌';
        title = `A card with $${reward.amount} inside!`;
        line = `+$${reward.amount}, +4 😊`;
    }

    updateStats(); updateActionPanel(); saveGame();
    refreshHomeExtras(); // the opened box disappears and the toy appears on the rug
    showGiftReveal(fromSanta, emoji, title, line);
}

function showGiftReveal(fromSanta, emoji, title, line) {
    const color = fromSanta ? '#e74c3c' : '#f39c12';
    const overlay = document.createElement('div');
    overlay.id = 'gift-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial;
    `;
    overlay.innerHTML = `
        <style>
            @keyframes giftPop { 0% { transform:scale(0.2) rotate(-20deg); } 70% { transform:scale(1.25) rotate(8deg); } 100% { transform:scale(1) rotate(0); } }
        </style>
        <div style="background:#16213e; border:3px solid ${color}; border-radius:16px;
                    padding:30px 40px; text-align:center; min-width:300px;">
            <p style="color:${color}; font-size:1.1em; margin-bottom:6px;">
                ${fromSanta ? '🎅 A present from Santa!' : '🎁 A birthday present!'}
            </p>
            <div style="font-size:4.5em; animation:giftPop 0.5s ease-out;">${emoji}</div>
            <h2 style="color:#FFD700; margin:10px 0 6px;">${title}</h2>
            <p style="color:#2ecc71; margin-bottom:18px;">${line}</p>
            <button class="action-btn" onclick="closeGiftReveal()">Yay! 🎉</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeGiftReveal() {
    const overlay = document.getElementById('gift-overlay');
    if (overlay) overlay.remove();
}

// =============================================
// SANTA — visits on the last day of every year
// =============================================

function santaVisit(silent) {
    const nice = player.happiness >= 50;          // a happy kid gets two presents
    const count = nice ? 2 : 1;
    let given = 0;
    for (let i = 0; i < count; i++) if (giveGift('santa')) given++;
    if (silent || given === 0) return;
    showEvent('🎅', nice
        ? 'Ho ho ho! Santa left you 2 presents under the tree!'
        : 'Ho ho ho! Santa left you a present under the tree!');
    spawnSanta();
}

// Santa himself stops by for a few seconds (only if you're home to see him).
function spawnSanta() {
    if (!scene || inSchool || driving || inStore) return;
    const santa = buildNPC(1.8, -2.4, 0xC0392B, 0xFFFFFF, {
        name: 'Santa', dialogue: 'Ho ho ho! Merry Christmas! 🎅', happiness: 10
    });
    function part(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        santa.add(m);
    }
    part(0.34, 0.3, 0.08, 0, 1.3, 0.2, 0xFFFFFF);    // beard
    part(0.5, 0.1, 0.5, 0, 1.78, 0, 0xFFFFFF);       // white hat fluff
    part(0.44, 0.24, 0.44, 0, 1.92, 0, 0xC0392B);    // red hat
    part(0.14, 0.14, 0.14, 0, 2.1, 0, 0xFFFFFF);     // pom-pom
    setTimeout(() => {
        scene.remove(santa);
        const i = clickableNPCs.indexOf(santa);
        if (i > -1) clickableNPCs.splice(i, 1);
    }, 9000);
}

// =============================================
// THE TOY BOX — see and play with the toys you own
// =============================================

function showToyBox() {
    if (document.getElementById('toy-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'toy-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial;
    `;
    document.body.appendChild(overlay);
    renderToyBox();
}

function renderToyBox() {
    const overlay = document.getElementById('toy-overlay');
    if (!overlay) return;
    const toys = (player.toys || []).map(toyById).filter(Boolean);
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #6C5CE7; border-radius:16px; padding:24px 30px;
                    text-align:center; min-width:320px; max-width:560px; max-height:80vh; overflow-y:auto;">
            <h2 style="color:#FFD700; margin-bottom:4px;">🧸 My Toys</h2>
            <p style="color:#aaa; margin-bottom:14px;">${toys.length} of ${TOY_DATA.length} collected — tap a toy to play!</p>
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
                ${toys.map(t => `
                    <button onclick="playWithToy('${t.id}')"
                        style="width:120px; padding:10px 6px; background:#0f3460; color:white;
                               border:2px solid ${t.santa ? '#e74c3c' : '#3498db'}; border-radius:12px; cursor:pointer;">
                        <div style="font-size:2.2em;">${t.emoji}</div>
                        <div style="font-size:0.85em; margin:4px 0;">${t.name}</div>
                        <div style="color:#2ecc71; font-size:0.8em;">+${t.play} 😊 to play</div>
                    </button>`).join('')}
            </div>
            <button class="action-btn" onclick="closeToyBox()" style="margin-top:16px">✖ Close</button>
        </div>
    `;
}

function closeToyBox() {
    const overlay = document.getElementById('toy-overlay');
    if (overlay) overlay.remove();
}

function playWithToy(id) {
    const toy = toyById(id);
    if (!toy) return;
    if (Date.now() - (toyPlayedAt[id] || 0) < 15000) {
        showEvent('😴', `You just played with your ${toy.name}! Try a different toy.`);
        return;
    }
    toyPlayedAt[id] = Date.now();
    player.happiness = Math.min(100, player.happiness + toy.play);
    updateStats(); saveGame();
    showEvent(toy.emoji, `You played with your ${toy.name}! +${toy.play} happiness`);
}
