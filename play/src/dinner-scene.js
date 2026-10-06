// =============================================
// DINNER SCENE — the 3D restaurant (built out of boxes, like the rest of City Life).
//
// You, Mom and Dad sit at a table. A waiter walks the food out from the kitchen,
// one plate at a time: Mom's, then Dad's, then yours LAST. Dishes appear as big
// emoji floating over the plates. Other customers eat at tables behind you.
//
// dinner.js drives the story (menu, ordering, the bill); this file draws it:
//   buildRestaurant3D(r)       put the old scene away and build the restaurant
//   updateRestaurantScene()    runs every frame from animate() in world.js
//   waiterVisitTable3D(cb)     the waiter walks over to take your order
//   startServing3D(order, fn)  the waiter brings out the food (fn(who) when each plate lands)
//   eat3D(done)                everyone digs in, the food disappears
//   teardownRestaurant3D()     bring the house back
// =============================================

let restaurant3D = null;   // everything about the restaurant scene, or null when we're not in it

// Each kind of food gets its own colour for the stripe on the walls, the lamps and the sign.
const RESTAURANT_ACCENTS = {
    pizza: 0xC0392B, pasta: 0xD35400, burger: 0xE67E22, taco: 0x27AE60, chinese: 0xC0392B,
    sushi: 0x2C3E50, thai: 0x16A085, indian: 0xE67E22, korean: 0x8E44AD, greek: 0x2980B9,
    bbq: 0x6D4C41, seafood: 0x1ABC9C, steak: 0x7B241C, vegan: 0x27AE60, diner: 0x3498DB,
    chicken: 0xF39C12, ramen: 0xE74C3C, deli: 0x8D6E63, french: 0x34495E, hotpot: 0xC0392B
};

// Where everyone sits (the table runs left to right; the camera looks from the front)
const DINER_SEATS = { mom: -2.4, me: 0, dad: 2.4 };
const SEAT_Z = -1.65;          // the chairs, behind the table
const PLATE_Z = -0.75;         // where plates land on the table
const WAITER_HOME = { x: 6.6, z: -6.0 };
const WAITER_LANE_X = 6.6;     // the waiter walks down this side, then along the front of the table
const WAITER_FRONT_Z = 0.95;   // standing in front of the table

// ---- little helpers ----------------------------------------------------

// A flat picture of an emoji that always faces the camera (used for food and speech bubbles).
function makeEmojiSprite(emoji, size) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = '100px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 70);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    sprite.scale.set(size, size, 1);
    return sprite;
}

// A little 3D food model (food-models.js) with the old flat emoji as a fallback. `scale` = overall size;
// the returned object keeps its base size in userData.baseScale (the "eating" shrink uses it).
function makeDishObject(emoji, name, scale, withPlate) {
    if (typeof buildFoodModel === 'function') {
        try {
            const m = buildFoodModel(emoji, name, { plate: !!withPlate });
            m.scale.setScalar(scale);
            m.userData.baseScale = scale;
            return m;
        } catch (e) { /* fall back to the emoji picture below */ }
    }
    const s = makeEmojiSprite(emoji === '⭐' ? '🍽️' : emoji, scale * 1.05);
    s.userData.baseScale = scale * 1.05;
    return s;
}

// The restaurant's sign (name + emoji) drawn on a canvas, then put on a flat panel.
function makeSignPanel(name, emoji, accent) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + accent.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 12; ctx.strokeRect(10, 10, 1004, 236);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name, 560, 135, 800);
    ctx.font = '120px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(emoji, 110, 140);
    return new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
}

// A person sitting on a chair, facing the camera. Arms rest on the table; they can wave and cheer.
function buildSeatedPerson(shirt, hair, scale, skinColor) {
    const g = new THREE.Group();
    const skin = skinColor || 0xFFCBA4, pants = 0x2c3e50;
    function box(w, h, d, x, y, z, color, parent) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true;
        (parent || g).add(m);
        return m;
    }
    box(0.62, 0.22, 0.7, 0, 0.74, 0.38, pants);          // thighs
    box(0.55, 0.68, 0.22, 0, 0.36, 0.72, pants);         // shins
    box(0.55, 0.14, 0.34, 0, 0.07, 0.8, 0x222222);       // shoes
    box(0.7, 0.85, 0.42, 0, 1.2, 0, shirt);              // body
    const head = new THREE.Group();
    head.position.set(0, 1.95, 0);
    g.add(head);
    box(0.52, 0.52, 0.52, 0, 0, 0, skin, head);
    box(0.56, 0.16, 0.56, 0, 0.3, 0, hair, head);        // hair on top
    box(0.56, 0.4, 0.12, 0, 0.05, -0.22, hair, head);    // hair at the back
    box(0.07, 0.09, 0.03, -0.12, 0.05, 0.27, 0x111111, head); // eyes
    box(0.07, 0.09, 0.03,  0.12, 0.05, 0.27, 0x111111, head);
    const mouth = box(0.2, 0.05, 0.03, 0, -0.12, 0.27, 0xAA3333, head);
    function arm(x) {
        const pivot = new THREE.Group();
        pivot.position.set(x, 1.55, 0.05);
        pivot.rotation.x = -1.0;                          // resting forward on the table
        box(0.2, 0.62, 0.2, 0, -0.3, 0, shirt, pivot);
        box(0.18, 0.16, 0.18, 0, -0.66, 0, skin, pivot);  // hand
        g.add(pivot);
        return pivot;
    }
    const armL = arm(-0.46), armR = arm(0.46);
    g.scale.set(scale, scale, scale);
    return { group: g, head, mouth, armL, armR, baseHeadY: 1.95 };
}

// A standing person (the waiter and the chef).
function buildStandingPerson(shirt, hair, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const skin = 0xFFCBA4;
    function box(w, h, d, x, y, z, color, parent) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true;
        (parent || g).add(m);
        return m;
    }
    function leg(x) {
        const pivot = new THREE.Group();
        pivot.position.set(x, 0.85, 0);
        box(0.26, 0.85, 0.3, 0, -0.42, 0, opts.pants || 0x1a1a1a, pivot);
        g.add(pivot);
        return pivot;
    }
    const legL = leg(-0.17), legR = leg(0.17);
    box(0.7, 0.85, 0.42, 0, 1.3, 0, shirt);                  // body
    if (opts.bowtie) box(0.22, 0.12, 0.05, 0, 1.68, 0.23, 0xC0392B);
    box(0.5, 0.5, 0.5, 0, 1.98, 0, skin);                    // head
    box(0.54, 0.14, 0.54, 0, 2.28, 0, hair);
    box(0.07, 0.09, 0.03, -0.12, 2.02, 0.26, 0x111111);
    box(0.07, 0.09, 0.03,  0.12, 2.02, 0.26, 0x111111);
    if (opts.chefHat) {
        box(0.6, 0.14, 0.6, 0, 2.42, 0, 0xffffff);
        box(0.7, 0.45, 0.7, 0, 2.75, 0, 0xffffff);
    }
    const armL = new THREE.Group();
    armL.position.set(-0.46, 1.65, 0);
    box(0.2, 0.7, 0.2, 0, -0.3, 0, shirt, armL);
    g.add(armL);
    const armR = new THREE.Group();
    armR.position.set(0.46, 1.65, 0);
    box(0.2, 0.7, 0.2, 0, -0.3, 0, shirt, armR);
    g.add(armR);
    return { group: g, legL, legR, armL, armR };
}

// ---- building the room -------------------------------------------------

function buildRestaurant3D(r) {
    if (restaurant3D || !scene) return;
    const accent = RESTAURANT_ACCENTS[r.cuisineId] || 0xC0392B;

    // 1. Put the house away (we bring it all back in teardownRestaurant3D)
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') { stash.push(obj); scene.remove(obj); }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0;
    const savedBg = scene.background;
    scene.background = new THREE.Color(0x2b1d14);

    const objs = [];
    function add(obj) { scene.add(obj); objs.push(obj); return obj; }
    function box(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = true; m.receiveShadow = true;
        return add(m);
    }

    // 2. The room: checkered floor, walls with a coloured stripe, windows, a sign
    box(20, 0.2, 16, 0, -0.1, -2, 0xC9A66B);
    for (let ix = -4; ix < 4; ix++) for (let iz = -4; iz < 3; iz++) {
        if ((ix + iz) % 2 === 0) box(2.5, 0.04, 2.5, ix * 2.5 + 1.25, 0.02, iz * 2.5 + 1.25, 0xE8D5B5);
    }
    box(20, 5.4, 0.3, 0, 2.7, -9.2, 0xF3E5CC);              // back wall
    box(20, 1.4, 0.36, 0, 0.7, -9.18, accent);               // stripe
    box(0.3, 5.4, 16, -10, 2.7, -2, 0xF3E5CC);              // side walls
    box(0.3, 5.4, 16,  10, 2.7, -2, 0xF3E5CC);
    box(0.36, 1.4, 16, -9.98, 0.7, -2, accent);
    box(0.36, 1.4, 16,  9.98, 0.7, -2, accent);
    [-6.5, -1.5].forEach(x => {                              // windows on the back wall
        box(2.6, 1.9, 0.1, x, 3.2, -9.0, 0xFFFFFF);
        box(2.3, 1.6, 0.14, x, 3.2, -8.98, 0x9ED8F5);
    });
    [-5, 1].forEach(z => {                                   // windows on the left wall
        box(0.1, 1.9, 2.6, -9.8, 3.2, z, 0xFFFFFF);
        box(0.14, 1.6, 2.3, -9.78, 3.2, z, 0x9ED8F5);
    });
    const sign = makeSignPanel(r.name, r.emoji, accent);
    sign.position.set(-1.5, 4.55, -8.95);
    sign.scale.set(0.85, 0.85, 1);
    add(sign);

    // 3. Hanging lamps
    [-6, -2, 2, 6].forEach(x => {
        box(0.05, 1.1, 0.05, x, 4.7, -3, 0x333333);
        box(0.9, 0.35, 0.9, x, 4.05, -3, accent);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xFFF2B0 }));
        bulb.position.set(x, 3.8, -3);
        add(bulb);
    });
    const glow = new THREE.PointLight(0xFFE2B0, 0.9, 40);
    glow.position.set(0, 4.5, -1);
    add(glow);

    // 4. The kitchen: a counter with a hatch, and the chef
    box(6, 1.1, 1.3, 6.6, 0.55, -7.6, 0x8B5A2B);
    box(6.2, 0.12, 1.5, 6.6, 1.16, -7.6, 0xD7B98A);
    box(4.4, 1.5, 0.1, 6.6, 2.45, -8.95, 0x1b1b1b);          // the dark hatch
    box(0.3, 1.6, 0.3, 4.0, 2.4, -8.9, 0x8B5A2B);
    const chef = buildStandingPerson(0xFFFFFF, 0x4B2800, { chefHat: true, pants: 0x555555 });
    chef.group.position.set(6.6, 0, -8.5);
    chef.group.rotation.y = 0;
    chef.armR.rotation.x = -1.2;
    add(chef.group);
    // a steaming pot on the counter
    box(0.6, 0.45, 0.6, 8.0, 1.45, -7.6, 0x888888);

    // 5. Our table: a white cloth, two pedestals, three chairs
    box(7.6, 0.16, 1.8, 0, 1.05, -0.6, 0xFFFFFF);
    box(7.7, 0.04, 1.9, 0, 0.97, -0.6, accent);
    [-2.2, 2.2].forEach(x => box(0.45, 0.95, 0.45, x, 0.5, -0.6, 0x5a3a1a));
    [-1.2, 1.2].forEach(x => {                               // flower vases
        box(0.18, 0.3, 0.18, x, 1.3, -0.65, 0x3498DB);
        box(0.3, 0.3, 0.3, x, 1.58, -0.65, 0xE91E63);
    });
    Object.keys(DINER_SEATS).forEach(who => {
        const x = DINER_SEATS[who];
        box(1.15, 0.12, 1.0, x, 0.62, SEAT_Z + 0.1, 0x8B4513);   // seat
        box(1.15, 0.95, 0.12, x, 1.15, SEAT_Z - 0.4, 0x8B4513);  // back
        [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.45], [0.5, 0.45]].forEach(([dx, dz]) => box(0.1, 0.6, 0.1, x + dx, 0.3, SEAT_Z + dz, 0x5a3a1a));
        box(1.2, 0.04, 0.8, x, 1.14, PLATE_Z, 0xF5F0E6);         // placemat
        box(0.05, 0.03, 0.4, x - 0.7, 1.15, PLATE_Z, 0xCCCCCC);  // knife
        box(0.05, 0.03, 0.4, x + 0.7, 1.15, PLATE_Z, 0xCCCCCC);  // fork
    });

    // 6. You, Mom and Dad
    const kidScale = Math.min(1.0, 0.5 + (player.age - 5) * 0.037) * 0.5 + 0.5; // a bit smaller than a grown-up
    const hlM = typeof heritageLook === 'function' ? heritageLook('mom') : null, hlD = typeof heritageLook === 'function' ? heritageLook('dad') : null, hlP = typeof heritageLook === 'function' ? heritageLook('player') : null;   // heritage.js
    const diners = {
        mom: buildSeatedPerson(0x4169E1, hlM ? hlM.hair : 0x4B2800, 1, hlM && hlM.skin),
        dad: buildSeatedPerson(0xC0392B, hlD ? hlD.hair : 0xFFD700, 1.05, hlD && hlD.skin),
        me:  buildSeatedPerson(player.gender === 'girl' ? 0xE91E8C : 0x3498DB, hlP ? hlP.hair : player.gender === 'girl' ? 0xCC0066 : 0x4B2800, kidScale, hlP && hlP.skin)
    };
    Object.keys(diners).forEach(who => {
        diners[who].group.position.set(DINER_SEATS[who], who === 'me' ? 0.15 : 0, SEAT_Z);   // you sit up on a cushion
        add(diners[who].group);
    });
    box(1.0, 0.15, 0.9, DINER_SEATS.me, 0.75, SEAT_Z + 0.1, 0xC0392B);                     // your booster cushion

    // 7. Other customers at little round tables behind us
    const patronColors = [0x27AE60, 0xF39C12, 0x8E44AD, 0x16A085, 0xD35400, 0x2980B9];
    const patrons = [];
    [[-6.8, -5.4], [-3, -6.6], [2, -6.6]].forEach(([tx, tz], ti) => {
        const top = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 14), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
        top.position.set(tx, 1.05, tz);
        add(top);
        box(0.3, 1.0, 0.3, tx, 0.5, tz, 0x5a3a1a);
        [-1.1, 1.1].forEach((dx, pi) => {
            box(0.8, 0.1, 0.8, tx + dx, 0.62, tz - 0.4, 0x8B4513);
            const p = buildSeatedPerson(patronColors[(ti * 2 + pi) % patronColors.length], [0x4B2800, 0x222222, 0xCC8844][(ti + pi) % 3], 0.9);
            p.group.position.set(tx + dx, 0, tz - 0.4);
            p.group.rotation.y = dx < 0 ? 0.5 : -0.5;
            add(p.group);
            patrons.push(p);
        });
        const biteEmoji = ['🍕', '🍜', '🥗', '🍔', '🍛', '🥘'][(ti * 2) % 6];
        const bite = makeDishObject(biteEmoji, '', 0.8, true);
        if (bite.isSprite) bite.position.set(tx, 1.55, tz); else bite.position.set(tx, 1.11, tz);
        add(bite);
    });

    // 8. Plants in the corners
    [[-9, -8.2], [9, -4]].forEach(([px, pz]) => {
        box(0.9, 0.8, 0.9, px, 0.4, pz, 0xA0522D);
        box(0.7, 0.7, 0.7, px, 1.2, pz, 0x2E8B3C);
        box(0.5, 0.6, 0.5, px, 1.8, pz, 0x38A04A);
    });

    // 9. The waiter
    const waiter = buildStandingPerson(0xFFFFFF, 0x222222, { bowtie: true });
    waiter.group.position.set(WAITER_HOME.x, 0, WAITER_HOME.z);
    add(waiter.group);
    const tray = new THREE.Group();                          // a tray held up in front
    const trayBoard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.7), new THREE.MeshLambertMaterial({ color: 0x777777 }));
    tray.add(trayBoard);
    tray.position.set(0.1, 1.95, 0.55);
    tray.visible = false;
    waiter.group.add(tray);
    waiter.armR.rotation.x = -1.6;

    restaurant3D = {
        stash, clickables, savedBg, objs, diners, patrons, chef,
        waiter: {
            ...waiter, tray, trayFood: null, state: 'idle', timer: 0, path: [], jobs: [], onServed: null,
            speedMult: 1, who: null, dishEmoji: '🍽️', walkPhase: 0
        },
        plates: {},       // who -> { group, food } once served
        bubbles: {},      // who -> speech bubble sprite
        eating: null,
        cheer: { mom: 0, me: 0, dad: 0 },
        start: Date.now(), last: Date.now()
    };
    camera.position.set(0, 8.4, 9.8);
    camera.lookAt(0, 1.2, -2.4);
    renderer.render(scene, camera);
}

// ---- the story, told in 3D --------------------------------------------

// The waiter walks over to take your order (and stands there until waiterGoHome()).
function waiterVisitTable3D() {
    const r = restaurant3D;
    if (!r) return;
    r.waiter.state = 'visit';
    r.waiter.path = [{ x: WAITER_LANE_X, z: WAITER_FRONT_Z }, { x: 0.8, z: WAITER_FRONT_Z }];
    r.waiter.speedMult = 1;
}

function waiterGoHome3D() {
    const r = restaurant3D;
    if (!r) return;
    r.waiter.state = 'home';
    r.waiter.path = [{ x: WAITER_LANE_X, z: WAITER_FRONT_Z }, { x: WAITER_HOME.x, z: WAITER_HOME.z }];
}

// Someone at the table is talking: a speech bubble pops up over them for a moment.
function speak3D(who) {
    const r = restaurant3D;
    if (!r || !r.diners[who]) return;
    if (r.bubbles[who]) { scene.remove(r.bubbles[who]); }
    const b = makeEmojiSprite('💬', 1.0);
    b.position.set(DINER_SEATS[who] + 0.7, 3.1, SEAT_Z);
    scene.add(b);
    r.bubbles[who] = b;
    r.objs.push(b);
    setTimeout(() => { if (restaurant3D === r && r.bubbles[who] === b) { scene.remove(b); r.bubbles[who] = null; } }, 1500);
}

// The waiter brings out the three plates, always in the order Mom, Dad, YOU.
//   order  = { mom, dad, me } each with a .main dish
//   onServed(who) is called as each plate lands on the table
function startServing3D(order, onServed) {
    const r = restaurant3D;
    if (!r) return;
    const w = r.waiter;
    w.onServed = onServed;
    w.jobs = [
        { who: 'mom', dish: order.mom.main, prep: 1.0 },
        { who: 'dad', dish: order.dad.main, prep: 0.8 },
        { who: 'me',  dish: order.me.main,  prep: 2.6 }   // the kitchen takes longest on yours
    ];
    w.state = 'home';                                      // walk back to the kitchen, then start the first job
    w.path = [{ x: WAITER_LANE_X, z: WAITER_FRONT_Z }, { x: WAITER_HOME.x, z: WAITER_HOME.z }];
}

// "Skip the wait" — everything happens 4x faster, but still in the same order.
function speedUpServing3D() {
    if (restaurant3D) restaurant3D.waiter.speedMult = 4;
}

// Everyone digs in for a few seconds, and the food disappears.
function eat3D(done) {
    const r = restaurant3D;
    if (!r) { done(); return; }
    r.eating = { start: Date.now(), duration: 2800, done };
}

function dropPlate3D(who, dish) {
    const r = restaurant3D;
    const x = DINER_SEATS[who];
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.06, 18), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
    g.add(plate);
    const food = makeDishObject(dish.emoji, dish.name, 1.1, false);
    if (food.isSprite) food.position.set(0, 0.55, 0); else food.position.set(0, 0.03, 0);
    g.add(food);
    g.position.set(x, 1.2, PLATE_Z);
    scene.add(g);
    r.objs.push(g);
    r.plates[who] = { group: g, food };
}

function setTrayFood(w, emoji, name) {
    if (w.trayFood) {
        w.tray.remove(w.trayFood);
        if (!w.trayFood.isSprite && typeof disposeFoodModel === 'function') disposeFoodModel(w.trayFood);
        w.trayFood = null;
    }
    if (emoji) {
        w.trayFood = makeDishObject(emoji, name, 0.7, true);
        if (w.trayFood.isSprite) w.trayFood.position.set(0, 0.55, 0); else w.trayFood.position.set(0, 0.03, 0);
        w.tray.add(w.trayFood);
    }
}

// ---- moving things every frame ----------------------------------------

// Walks the waiter along his path. Returns true when he's arrived.
function waiterWalk(w, dt) {
    if (!w.path.length) { w.legL.rotation.x = w.legR.rotation.x = 0; return true; }
    const target = w.path[0], g = w.group;
    const dx = target.x - g.position.x, dz = target.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    const step = 6.0 * w.speedMult * dt;
    if (dist <= step) {
        g.position.x = target.x; g.position.z = target.z;
        w.path.shift();
    } else {
        g.position.x += dx / dist * step;
        g.position.z += dz / dist * step;
        g.rotation.y = Math.atan2(dx, dz);
        w.walkPhase += dt * 9 * w.speedMult;
        w.legL.rotation.x = Math.sin(w.walkPhase) * 0.6;
        w.legR.rotation.x = -Math.sin(w.walkPhase) * 0.6;
    }
    return !w.path.length;
}

function updateRestaurantScene() {
    const r = restaurant3D;
    if (!r) return;
    const now = Date.now();
    const dt = Math.min(0.05, (now - r.last) / 1000);
    r.last = now;
    const t = (now - r.start) / 1000;
    const w = r.waiter;

    // ---- the waiter's little state machine ----
    if (w.state === 'visit') {
        if (waiterWalk(w, dt)) { w.group.rotation.y = Math.PI; w.state = 'standing'; } // face the table
    } else if (w.state === 'home') {
        if (waiterWalk(w, dt)) {
            w.group.rotation.y = 0;
            setTrayFood(w, null); w.tray.visible = false;
            w.state = w.jobs.length ? 'prep' : 'idle';
            w.timer = w.jobs.length ? w.jobs[0].prep : 0;
        }
    } else if (w.state === 'prep') {                       // the kitchen is cooking
        w.timer -= dt * w.speedMult;
        r.chef.armR.rotation.x = -1.2 + Math.sin(t * 8) * 0.4;
        if (w.timer <= 0) {
            const job = w.jobs[0];
            w.who = job.who;
            w.tray.visible = true;
            setTrayFood(w, job.dish.emoji, job.dish.name);
            w.path = [{ x: WAITER_LANE_X, z: WAITER_FRONT_Z }, { x: DINER_SEATS[job.who], z: WAITER_FRONT_Z }];
            w.state = 'carry';
        }
    } else if (w.state === 'carry') {
        if (waiterWalk(w, dt)) { w.group.rotation.y = Math.PI; w.state = 'place'; w.timer = 0.5; }
    } else if (w.state === 'place') {
        w.timer -= dt * w.speedMult;
        if (w.timer <= 0) {
            const job = w.jobs.shift();
            setTrayFood(w, null); w.tray.visible = false;
            dropPlate3D(job.who, job.dish);
            r.cheer[job.who] = 1.4;
            if (w.onServed) w.onServed(job.who);
            w.path = [{ x: WAITER_LANE_X, z: WAITER_FRONT_Z }, { x: WAITER_HOME.x, z: WAITER_HOME.z }];
            w.state = 'home';
        }
    }
    r.chef.armR.rotation.x = w.state === 'prep' ? r.chef.armR.rotation.x : -1.2;

    // ---- the people at the table ----
    Object.keys(r.diners).forEach(who => {
        const d = r.diners[who];
        const idle = Math.sin(t * 1.6 + DINER_SEATS[who]) * 0.03;
        d.head.position.y = d.baseHeadY + idle;
        if (r.cheer[who] > 0) {                            // food arrived: arms up!
            r.cheer[who] -= dt;
            d.armL.rotation.x = d.armR.rotation.x = 2.7 + Math.sin(t * 12) * 0.2;
            d.mouth.scale.y = 3;
        } else if (r.eating) {                             // eating: bob and munch
            d.head.position.y = d.baseHeadY - Math.abs(Math.sin(t * 9 + DINER_SEATS[who])) * 0.12;
            d.armR.rotation.x = -1.6 + Math.sin(t * 9) * 0.5;
            d.armL.rotation.x = -1.0;
            d.mouth.scale.y = 1 + Math.abs(Math.sin(t * 9)) * 2;
        } else {
            d.armL.rotation.x = d.armR.rotation.x = -1.0;
            d.mouth.scale.y = 1;
        }
    });
    r.patrons.forEach((p, i) => {
        p.head.position.y = p.baseHeadY - Math.abs(Math.sin(t * 2 + i)) * 0.05;
        p.armR.rotation.x = -1.2 + Math.sin(t * 2.5 + i) * 0.25;
    });

    // ---- eating: the food shrinks away ----
    if (r.eating) {
        const k = Math.min(1, (now - r.eating.start) / r.eating.duration);
        Object.values(r.plates).forEach(p => {
            const s = Math.max(0.01, ((p.food.userData && p.food.userData.baseScale) || 1.15) * (1 - k));
            if (p.food.isSprite) p.food.scale.set(s, s, 1); else p.food.scale.setScalar(s);
        });
        if (k >= 1) {
            const done = r.eating.done;
            r.eating = null;
            Object.values(r.plates).forEach(p => { p.food.visible = false; });
            if (done) done();
        }
    }

    // a gentle camera drift so it feels alive
    camera.position.set(Math.sin(t * 0.35) * 0.6, 8.4 + Math.sin(t * 0.5) * 0.1, 9.8);
    camera.lookAt(0, 1.2, -2.4);
    renderer.render(scene, camera);
}

// ---- cleaning up --------------------------------------------------------

function teardownRestaurant3D() {
    const r = restaurant3D;
    if (!r) return;
    restaurant3D = null;
    r.objs.forEach(obj => { scene.remove(obj); disposeTree(obj); });
    scene.background = r.savedBg;
    r.stash.forEach(obj => scene.add(obj));        // the house, exactly as it was
    clickableNPCs.length = 0;
    r.clickables.forEach(c => clickableNPCs.push(c));
}
