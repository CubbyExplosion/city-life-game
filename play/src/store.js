// =============================================
// STORE — the grocery store. A parent drives you there (travel.js), then
// YOU get out of the car in the parking lot, walk into the store, grab a
// shopping cart and push it around with your parents. Your parents put
// groceries in the cart now and then (you can click shelves to add things
// too). The store can have anywhere from 10 to 1000 shoppers! When the cart
// has something in it, push it to a CHECKOUT lane. If you've been getting
// good grades, the cashier gives you a lollipop.
// =============================================

const SHELF_ROWS = [-10.5, -6.5, -2.5];                 // z of each row of shelves (each row has 4 sections)
const SHELF_SECTION_X = [-5.25, -1.75, 1.75, 5.25];    // x of each shelf section in a row
const SHELF_HALF = 7;                                   // shelves run from x=-7 to x=7 (leaving a wide lane down each side)
const STORE_BANDS = [-12.4, -8.5, -4.5, 0.0, 3.2];      // the walkways the crowd strolls along (z)
const BAND_HALF = [1.0, 1.0, 1.0, 1.3, 1.2];            // how wide each walkway is
const LANE_XS = [-12.4, -10.2, 10.2, 12.4];             // the four checkout lanes
const FRONT_Z = 5.5;                                    // z of the store's front wall (the doorway is in it)

// How many shoppers today? Usually a few, sometimes a LOT (10 to 1000).
function rollCrowdSize() {
    const r = Math.random();
    if (r < 0.45) return 10  + Math.floor(Math.random() * 51);    // 10-60:   quiet day
    if (r < 0.75) return 61  + Math.floor(Math.random() * 240);   // 61-300:  busy
    if (r < 0.95) return 301 + Math.floor(Math.random() * 400);   // 301-700: packed
    return 701 + Math.floor(Math.random() * 300);                 // 701-1000: SUPER packed
}

function crowdLabel(n) {
    if (n <= 60)  return '😌 Quiet day';
    if (n <= 300) return '🛒 Busy';
    if (n <= 700) return '😰 Packed!';
    return '🤯 SUPER packed!';
}

// Your report card, based on your education score. A "B" or better is good grades.
function gradeInfo() {
    if (player.age < 5 || !player.school) return { hasGrades: false, letter: '-', good: false };
    const e = player.education;
    const letter = e >= 80 ? 'A' : e >= 60 ? 'B' : e >= 40 ? 'C' : e >= 20 ? 'D' : 'F';
    return { hasGrades: true, letter, good: e >= GOOD_GRADES_EDU };
}

// ---------------------------------------------
// Little builders
// ---------------------------------------------

// A flat sign that always faces the camera (text or an emoji on a colored board).
function makeLabelSprite(text, opts) {
    opts = opts || {};
    const canvas = document.createElement('canvas');
    canvas.width = opts.w || 256;
    canvas.height = opts.h || 128;
    const g = canvas.getContext('2d');
    g.fillStyle = opts.bg || '#c0392b';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6;
    g.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    g.fillStyle = opts.fg || '#ffffff';
    g.font = `bold ${opts.size || 56}px Arial, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
    sprite.scale.set(opts.sw || 2, opts.sh || 1, 1);
    return sprite;
}

// A sign painted flat on the floor (reads right-side-up from the camera, and never blocks the view).
function makeFloorSign(text, w, h, bg) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.max(64, Math.round(512 * h / w));
    const g = canvas.getContext('2d');
    g.fillStyle = bg;
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 8;
    g.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    g.fillStyle = '#ffffff';
    g.font = `bold ${Math.round(canvas.height * 0.55)}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, canvas.width / 2, canvas.height / 2 + 3);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}

// A standing person made of boxes (not clickable). Used for cashiers and the checkout line.
function makePerson(x, z, shirt, hair, scale) {
    const g = new THREE.Group();
    function part(w, h, d, px, py, pz, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(px, py, pz);
        g.add(m);
    }
    part(0.45, 0.28, 0.38, 0, 0.58, 0, 0x333366);   // legs
    part(0.45, 0.60, 0.38, 0, 0.98, 0, shirt);      // body
    part(0.38, 0.38, 0.38, 0, 1.42, 0, 0xFFCBA4);   // head
    part(0.40, 0.18, 0.40, 0, 1.66, 0, hair);       // hair
    g.scale.setScalar(scale || 0.8);
    g.position.set(x, 0, z);
    return g;
}

// A shopping cart (the handle is on its +z side; the cart rolls toward -z).
function buildCartMesh() {
    const g = new THREE.Group();
    function part(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        g.add(m);
    }
    part(0.8, 0.06, 1.0, 0, 0.55, 0, 0xBDC3C7);       // basket floor
    part(0.8, 0.4, 0.05, 0, 0.75, -0.5, 0xCFD8DC);    // front
    part(0.8, 0.4, 0.05, 0, 0.75, 0.5, 0xCFD8DC);     // back
    part(0.05, 0.4, 1.0, -0.4, 0.75, 0, 0xCFD8DC);    // sides
    part(0.05, 0.4, 1.0, 0.4, 0.75, 0, 0xCFD8DC);
    part(0.9, 0.06, 0.06, 0, 1.0, 0.56, 0xE74C3C);    // the red handle
    part(0.06, 0.4, 0.06, -0.4, 0.8, 0.52, 0x7F8C8D); // handle posts
    part(0.06, 0.4, 0.06, 0.4, 0.8, 0.52, 0x7F8C8D);
    [[-0.33, -0.4], [0.33, -0.4], [-0.33, 0.4], [0.33, 0.4]].forEach(([x, z]) => part(0.1, 0.1, 0.1, x, 0.1, z, 0x333333)); // wheels
    part(0.05, 0.3, 0.05, -0.33, 0.35, 0, 0x7F8C8D);  // legs
    part(0.05, 0.3, 0.05, 0.33, 0.35, 0, 0x7F8C8D);
    return g;
}

// ---------------------------------------------
// Walking into the store
// ---------------------------------------------

// Called when the car ride to the store ends: you step out of the car in the parking lot.
// opts.fromMall: you walked in from the mall's concourse (mall.js) — no parking lot, no car, and
// leaving puts you back in the mall instead of driving home.
function openGroceryStore(opts) {
    if (inStore || !scene || !playerMesh) return;
    const fromMall = !!(opts && opts.fromMall);
    inStore = true;
    const snowy = isSnowing();
    const crowdCount = rollCrowdSize();
    const chain = typeof currentStoreChain === 'function' ? currentStoreChain() : null;   // which supermarket chain today (street-styles.js)
    const pal = (chain && chain.pal) || {};
    const P = (k, d) => (pal[k] !== undefined ? pal[k] : d);

    // Put the house away (we bring it back when you leave)
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') { stash.push(obj); scene.remove(obj); }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0;
    const saved = {
        bg: scene.background,
        pos: playerMesh.position.clone(), rot: playerMesh.rotation.clone(), scale: playerMesh.scale.clone()
    };
    scene.background = new THREE.Color(fromMall ? 0x2b2b3d : snowy ? 0xcfdcea : 0x87ceeb);

    const objects = [];     // everything we add (so leaveStore() can clean it up)
    function box(w, h, d, x, y, z, color, parent) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        if (parent) { parent.add(m); } else { scene.add(m); objects.push(m); }
        return m;
    }
    function put(obj, x, y, z) { obj.position.set(x, y, z); scene.add(obj); objects.push(obj); return obj; }

    const rects = [];       // places you can't walk through
    function block(x1, x2, z1, z2) { rects.push({ x1, x2, z1, z2 }); }

    // --- Outside: grass (or snow), the parking lot, the sidewalk ---
    if (fromMall) {
        box(90, 0.2, 70, 0, -0.25, 0, 0xD9CDB8);                       // the mall concourse just outside the shop
        box(46, 0.2, 16, 0, -0.12, 13.5, 0xE8E0D0);
    } else {
        box(90, 0.2, 70, 0, -0.25, 0, snowy ? 0xf2f7ff : 0x5DBB4A);
        box(46, 0.2, 16, 0, -0.12, 13.5, 0x4a4a4f);
        for (let i = -6; i <= 6; i++) box(0.12, 0.03, 4, i * 2.6, 0, 16.5, 0xffffff);
    }
    box(34, 0.22, 2.2, 0, -0.1, 6.6, 0xBDBDBD);

    // --- The store building: floor, tall back/side walls, a low front wall with a doorway ---
    box(28, 0.2, 19.5, 0, -0.1, -4.25, P('floor', 0xEDE7D6));
    box(28.6, 5, 0.3, 0, 2.5, -14.1, P('back', 0xF0E6D2));
    box(0.3, 5, 19.8, -14.1, 2.5, -4.2, P('side', 0xEADFC8));
    box(0.3, 5, 19.8, 14.1, 2.5, -4.2, P('side', 0xEADFC8));
    [-10, -5, 0, 5, 10].forEach(x => box(0.6, 0.3, 0.25, x, 3.7, -13.9, 0xFFF59D));          // wall lamps (they glow)
    [-12, -6, 0].forEach(z => { box(0.25, 0.3, 0.6, -13.9, 3.7, z, 0xFFF59D); box(0.25, 0.3, 0.6, 13.9, 3.7, z, 0xFFF59D); });
    box(11.4, 1.3, 0.3, -8.3, 0.65, FRONT_Z, P('lowWall', 0xD7CCC8));
    box(11.4, 1.3, 0.3, 8.3, 0.65, FRONT_Z, P('lowWall', 0xD7CCC8));
    block(-14, -2.6, FRONT_Z - 0.2, FRONT_Z + 0.2);
    block(2.6, 14, FRONT_Z - 0.2, FRONT_Z + 0.2);
    box(0.3, 4.4, 0.3, -2.7, 2.2, FRONT_Z, P('post', 0x8D6E63));
    box(0.3, 4.4, 0.3, 2.7, 2.2, FRONT_Z, P('post', 0x8D6E63));
    box(5.7, 0.6, 0.3, 0, 4.4, FRONT_Z, P('beam', 0xB03A2E));
    put(makeFloorSign(P('signText', 'GROCERY STORE'), 9, 1.5, P('sign', '#b03a2e')), 0, 0.03, 6.6);   // painted on the sidewalk (a floating sign would block your view)

    // --- Shelves: 3 rows x 4 sections, each section sells one kind of food ---
    const sections = [];
    const products = [];     // every product box on every shelf — drawn together as ONE batch below (much faster)
    SHELF_ROWS.forEach((rowZ, r) => {
        block(-SHELF_HALF, SHELF_HALF, rowZ - 0.62, rowZ + 0.62);
        SHELF_SECTION_X.forEach((sx, c) => {
            const itemIndex = (r * 4 + c) % GROCERY_ITEMS.length;
            const item = GROCERY_ITEMS[itemIndex];
            const sec = new THREE.Group();
            box(3.4, 1.1, 1.1, 0, 0.55, 0, P('shelf', 0xA9B2C0), sec);                      // the shelf unit (low, so you can see over it)
            for (let i = 0; i < 5; i++) {                                         // products on both faces, two tiers
                for (let tier = 0; tier < 2; tier++) {
                    products.push({ x: sx - 1.4 + i * 0.7, y: 0.3 + tier * 0.45, z: rowZ + 0.62, color: item.color });
                    products.push({ x: sx - 1.4 + i * 0.7, y: 0.3 + tier * 0.45, z: rowZ - 0.62, color: item.color });
                }
            }
            const label = makeLabelSprite(item.emoji, { w: 128, h: 128, size: 80, bg: '#2c3e50', sw: 1.1, sh: 1.1 });
            label.position.set(0, 1.7, 0);
            sec.add(label);
            sec.userData.npcData = { name: item.name, isShelf: true, itemIndex };   // click a shelf to add it to your cart
            put(sec, sx, 0, rowZ);
            clickableNPCs.push(sec);
            sections.push({ group: sec, x: sx, rowZ, item });
        });
    });

    // all the products in one "instanced" batch (one draw call instead of 240)
    const prodMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.4, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff }), products.length);
    const prodDummy = new THREE.Object3D(), prodColor = new THREE.Color();
    products.forEach((p, i) => {
        prodDummy.position.set(p.x, p.y, p.z);
        prodDummy.updateMatrix();
        prodMesh.setMatrixAt(i, prodDummy.matrix);
        prodMesh.setColorAt(i, prodColor.setHex(p.color));
    });
    prodMesh.frustumCulled = false;
    scene.add(prodMesh);
    objects.push(prodMesh);

    // a contrasting label stripe + a darker cap on every product, so the boxes read as real packaging
    // (two more instanced batches sharing the same positions — still only 3 draw calls for all the products)
    const labelMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.505, 0.15, 0.206), new THREE.MeshLambertMaterial({ color: 0xffffff }), products.length);
    const capMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.05, 0.15), new THREE.MeshLambertMaterial({ color: 0xffffff }), products.length);
    const labelDummy = new THREE.Object3D(), capDummy = new THREE.Object3D();
    products.forEach((p, i) => {
        prodColor.setHex(p.color);
        const lum = prodColor.r * 0.3 + prodColor.g * 0.59 + prodColor.b * 0.11;
        labelDummy.position.set(p.x, p.y - 0.02, p.z);
        labelDummy.updateMatrix();
        labelMesh.setMatrixAt(i, labelDummy.matrix);
        labelMesh.setColorAt(i, prodColor.setHex(lum > 0.6 ? 0x2C3E50 : 0xFFFFFF));
        capDummy.position.set(p.x, p.y + 0.22, p.z);
        capDummy.updateMatrix();
        capMesh.setMatrixAt(i, capDummy.matrix);
        capMesh.setColorAt(i, prodColor.setHex(p.color).multiplyScalar(0.7));
    });
    [labelMesh, capMesh].forEach(m => { m.frustumCulled = false; scene.add(m); objects.push(m); });

    // --- Checkout center: 4 lanes (2 on each side), each with a belt, register and cashier ---
    const lanes = LANE_XS.map((lx, i) => {
        box(0.9, 0.7, 3.2, lx, 0.35, 2.0, 0x8D6E63);                  // counter
        box(0.7, 0.06, 3.0, lx, 0.73, 2.0, 0x2C3E50);                 // conveyor belt
        box(0.6, 0.5, 0.5, lx, 0.95, 3.8, 0x7F8C8D);                  // register
        box(0.5, 0.3, 0.05, lx, 1.35, 3.65, 0x2ECC71);                // its screen
        block(lx - 0.55, lx + 0.55, 0.4, 4.1);
        const cashierX = lx + (lx < 0 ? (i === 0 ? -0.95 : 1.1) : (i === 3 ? 0.95 : -1.1));
        const cashier = put(makePerson(cashierX, 3.9, 0x1ABC9C, 0x222222, 0.85), cashierX, 0, 3.9);
        put(makeLabelSprite(String(i + 1), { w: 128, h: 128, size: 90, bg: '#2980b9', sw: 0.9, sh: 0.9 }), lx, 3.1, 3.9);
        // people already waiting in line (more when the store is busier)
        const qLen = Math.min(5, Math.floor(crowdCount / 90) + (Math.random() < 0.5 ? 1 : 0));
        const queue = [];
        const shirts = [0xE74C3C, 0x3498DB, 0xF1C40F, 0x9B59B6, 0x2ECC71, 0xE67E22];
        for (let k = 0; k < qLen; k++) {
            const p = put(makePerson(lx, -k * 1.6, shirts[(i + k) % shirts.length], 0x4B2800, 0.8), lx, 0, -k * 1.6);
            p.userData.targetZ = -k * 1.6;
            queue.push(p);
        }
        return { x: lx, queue, cashier, number: i + 1 };
    });
    put(makeFloorSign('CHECKOUT', 4.2, 0.8, P('checkout', '#1f618d')), -11.3, 0.03, -8.6);   // painted at the end of each line
    put(makeFloorSign('CHECKOUT', 4.2, 0.8, P('checkout', '#1f618d')), 11.3, 0.03, -8.6);

    // --- Carts waiting by the door ---
    const corral = [];
    [4.4, 3.5, 2.6].forEach(cz => {
        const c = buildCartMesh();
        c.rotation.y = Math.PI / 2;
        put(c, -4.2, 0, cz);
        corral.push(c);
    });
    put(makeLabelSprite('🛒 CARTS', { w: 256, h: 96, size: 48, bg: '#27ae60', sw: 2.2, sh: 0.8 }), -4.2, 2.3, 3.5);

    // --- The car you came in, parked in the lot ---
    let car = null;
    if (!fromMall) {
        car = buildCarModel(snowy).car;
        put(car, 5.2, 0, 12.8);
        block(3.9, 6.5, 10.4, 15.2);
    }

    // --- Mom, Dad and the crowd ---
    const moms = [
        { name: 'Mom', group: buildParent(0, 0, 0x4169E1, 0x4B2800), delay: 28, side: -0.9 },
        { name: 'Dad', group: buildParent(0, 0, 0xC0392B, 0xFFD700), delay: 52, side: 0.9 }
    ];
    moms.forEach(p => {
        scene.remove(p.group); scene.add(p.group); objects.push(p.group);
        p.state = 'follow';
        p.nextShop = Date.now() + 5000 + Math.random() * 5000;
    });
    const crowd = buildCrowd(crowdCount);
    scene.add(crowd.legs, crowd.body, crowd.head);
    objects.push(crowd.legs, crowd.body, crowd.head);

    // --- Realism: departments, price tags, signs, a guard, staff, sliding doors (store-realism.js) ---
    const realism = typeof addStoreRealism === 'function' ? addStoreRealism({ box, put, block, sections, rects, objects, chain }) : null;
    if (chain && typeof addStoreChainDecor === 'function') addStoreChainDecor(chain, { box, put, label: makeLabelSprite, objects });   // chain props (street-styles.js)

    let snow = null;
    if (snowy && !fromMall) { snow = makeSnowPoints(500, 46, 16, 40); snow.position.set(0, 0, 4); scene.add(snow); objects.push(snow); }

    // --- You and your parents step out of the car (or, from the mall, walk in from the concourse) ---
    const py = player.age <= 4 ? 0.9 : 0;
    playerMesh.rotation.set(0, 0, 0);
    scene.add(playerMesh);   // (the house was put away with you in it — bring just you back)
    if (fromMall) {
        playerMesh.position.set(3.0, py, 9.0);
        moms[0].group.position.set(2.0, 0, 10.4);
        moms[1].group.position.set(4.0, 0, 10.4);
    } else {
        playerMesh.position.set(5.7, 1.2, 13.4);
        moms[0].group.position.set(5.2, 0.9, 12.4);
        moms[1].group.position.set(5.2, 0.9, 12.4);
    }

    store = {
        stash, clickables, saved, objects, rects, sections, lanes, corral, moms, crowd, snow, car, fromMall, realism,
        crowdCount, py, cart: null, cartDir: { x: 0, z: -1 }, dir: { x: 0, z: -1 }, trail: [],
        intro: fromMall ? null : { t: 0, from: { x: 5.7, y: 1.2, z: 13.4 }, to: { x: 3.0, y: py, z: 13.0 } },
        checkout: null, start: Date.now(), lastCrowdMsg: 0, lastEmptyMsg: 0, lastGrabAt: 0, lastFrame: Date.now()
    };

    if (typeof isIndependent === 'function' && isIndependent()) {          // grown-ups shop alone
        store.moms.forEach(p => scene.remove(p.group));
        store.moms = [];
    }
    document.getElementById('location-name').textContent = `🛒 ${chain ? chain.name : 'Grocery Store'}`;
    updateActionPanel();
    showEvent(fromMall ? '🛒' : '🚗', fromMall ? `Welcome to ${chain ? chain.name : 'Utama Grocer'}! Walk into the store and grab a 🛒 cart by the door.` : 'You got out of the car! Walk into the store and grab a 🛒 cart by the door.');
    maybeWitnessCrime('grocery', 7000);       // a shoplifter, a stolen purse... (crime.js)
    setTimeout(() => {
        if (store && store.crowdCount > 300) showEvent('👥', `Wow, ${store.crowdCount} shoppers today! It's ${crowdLabel(store.crowdCount)}`);
    }, 3000);
}

// A crowd of people drawn with 3 "instanced" meshes (one draw call each) so even 1000 people run smoothly.
function buildCrowd(count) {
    const legsGeo = new THREE.BoxGeometry(0.34, 0.5, 0.24);  legsGeo.translate(0, 0.25, 0);
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.55, 0.26); bodyGeo.translate(0, 0.78, 0);
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28); headGeo.translate(0, 1.22, 0);
    const legs = new THREE.InstancedMesh(legsGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
    const body = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
    const head = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), count);
    [legs, body, head].forEach(m => { m.frustumCulled = false; });

    const pants = [0x2C3E50, 0x34495E, 0x1F618D, 0x6E2C00, 0x424949];
    const shirts = [0xE74C3C, 0x3498DB, 0xF1C40F, 0x9B59B6, 0x2ECC71, 0xE67E22, 0xEC7063, 0x48C9B0, 0xF5B7B1, 0xFFFFFF];
    const skins = [0xFFCBA4, 0xE0AC69, 0xC68642, 0x8D5524, 0xF1C27D];
    const c = new THREE.Color();
    const data = {
        count, legs, body, head, frame: 0,
        x: new Float32Array(count), z: new Float32Array(count),
        vx: new Float32Array(count), bz: new Float32Array(count), s: new Float32Array(count)
    };
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        const band = Math.floor(Math.random() * STORE_BANDS.length);
        data.x[i] = (Math.random() - 0.5) * 18.4;
        data.bz[i] = STORE_BANDS[band] + (Math.random() - 0.5) * 2 * BAND_HALF[band];
        data.z[i] = data.bz[i];
        data.vx[i] = (Math.random() < 0.5 ? -1 : 1) * (0.01 + Math.random() * 0.025);
        data.s[i] = 0.55 + Math.random() * 0.3;     // some kids, some grown-ups
        legs.setColorAt(i, c.setHex(pants[i % pants.length]));
        body.setColorAt(i, c.setHex(shirts[Math.floor(Math.random() * shirts.length)]));
        head.setColorAt(i, c.setHex(skins[Math.floor(Math.random() * skins.length)]));
        dummy.position.set(data.x[i], 0, data.z[i]);
        dummy.rotation.y = data.vx[i] > 0 ? Math.PI / 2 : -Math.PI / 2;
        dummy.scale.setScalar(data.s[i]);
        dummy.updateMatrix();
        legs.setMatrixAt(i, dummy.matrix);
        body.setMatrixAt(i, dummy.matrix);
        head.setMatrixAt(i, dummy.matrix);
    }
    data.dummy = dummy;
    return data;
}

// Moves the crowd along the aisles. Returns how many shoppers are right next to you.
function updateCrowd(c, px, pz) {
    const N = c.count;
    const half = N > 400 ? 2 : 1;                 // a huge crowd only moves half of its people per frame
    const phase = (c.frame++) % half;
    const dummy = c.dummy;
    let near = 0;
    for (let i = 0; i < N; i++) {
        let x = c.x[i], z = c.z[i];
        if (i % half === phase) {
            if (Math.abs(c.bz[i] - z) > 0.3) {
                z += Math.sign(c.bz[i] - z) * 0.04 * half;        // stepping over to another aisle
            } else {
                x += c.vx[i] * half;
                if (x > 9.2 || x < -9.2) {                          // end of the aisle: turn around, maybe change aisle
                    x = Math.max(-9.2, Math.min(9.2, x));
                    c.vx[i] = -c.vx[i];
                    if (Math.random() < 0.6) {
                        const band = Math.floor(Math.random() * STORE_BANDS.length);
                        c.bz[i] = STORE_BANDS[band] + (Math.random() - 0.5) * 2 * BAND_HALF[band];
                    }
                } else if (Math.random() < 0.0015 * half) {
                    c.vx[i] = -c.vx[i];                             // changed their mind
                }
            }
            c.x[i] = x; c.z[i] = z;
            dummy.position.set(x, 0, z);
            dummy.rotation.y = c.vx[i] > 0 ? Math.PI / 2 : -Math.PI / 2;
            dummy.scale.setScalar(c.s[i]);
            dummy.updateMatrix();
            c.legs.setMatrixAt(i, dummy.matrix);
            c.body.setMatrixAt(i, dummy.matrix);
            c.head.setMatrixAt(i, dummy.matrix);
        }
        const dx = x - px, dz = z - pz;
        if (dx * dx + dz * dz < 1.3) near++;
    }
    c.legs.instanceMatrix.needsUpdate = true;
    c.body.instanceMatrix.needsUpdate = true;
    c.head.instanceMatrix.needsUpdate = true;
    return near;
}

function blockedAt(rects, x, z, r) {
    for (const k of rects) {
        if (x > k.x1 - r && x < k.x2 + r && z > k.z1 - r && z < k.z2 + r) return true;
    }
    return false;
}

// ---------------------------------------------
// The cart
// ---------------------------------------------

function cartSlot(i) {   // where item number i sits inside the basket
    return { x: -0.25 + (i % 3) * 0.25, y: 0.64 + Math.floor(i / 12) * 0.2, z: -0.36 + (Math.floor(i / 3) % 4) * 0.24 };
}

function addToCart(item, who) {
    const s = store;
    if (!s || !s.cart) return false;
    const i = s.cart.items.length;
    s.cart.items.push(item);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), new THREE.MeshLambertMaterial({ color: item.color }));
    const p = cartSlot(Math.min(i, 35));
    m.position.set(p.x, p.y, p.z);
    s.cart.group.add(m);
    s.cart.meshes.push(m);
    showEvent(item.emoji, `${who} put ${item.name} in the cart!`);
    updateActionPanel();
    return true;
}

// Clicking a shelf adds that food to your cart (if your cart is nearby).
function playerGrabItem(npcData) {
    const s = store;
    if (!s || s.checkout) return;
    if (Date.now() - s.lastGrabAt < 800) return;
    if (!s.cart) { showEvent('🛒', 'Grab a cart by the door first!'); return; }
    const sec = s.sections.find(x => x.item.name === npcData.name);
    const pos = playerMesh.position;
    if (!sec || Math.hypot(sec.x - pos.x, sec.rowZ - pos.z) > 4.5) {
        showEvent('🚶', 'Walk closer to the shelf with your cart!');
        return;
    }
    s.lastGrabAt = Date.now();
    addToCart(sec.item, 'You');
}

// ---------------------------------------------
// The store, every frame
// ---------------------------------------------

function updateStore() {
    const s = store;
    if (!s) return;
    const now = Date.now();
    const pos = playerMesh.position;
    const mvIn = getMoveInput();
    const keyDx = mvIn.x, keyDz = mvIn.z;

    // --- stepping out of the car (you can't move for a second) ---
    if (s.intro) {
        const t = Math.min(1, s.intro.t += 0.03);
        pos.x = s.intro.from.x + (s.intro.to.x - s.intro.from.x) * t;
        pos.z = s.intro.from.z + (s.intro.to.z - s.intro.from.z) * t;
        pos.y = s.intro.from.y + (s.intro.to.y - s.intro.from.y) * t + Math.sin(t * Math.PI) * 0.6;
        s.moms.forEach((p, i) => {
            p.group.position.x = 5.2 + (2.2 - i * 0.7 - 5.2) * t;
            p.group.position.z = 12.4 + ((i ? 14.0 : 12.0) - 12.4) * t;
            p.group.position.y = 0.9 * (1 - t);
        });
        if (t >= 1) { s.intro = null; pos.y = s.py; }
    }

    // --- the crowd (and how many people are bumping into you) ---
    const near = updateCrowd(s.crowd, pos.x, pos.z);
    const crowded = near > 4;
    if (crowded && now - s.lastCrowdMsg > 7000) { s.lastCrowdMsg = now; showEvent('👥', 'So crowded! You move slowly through the people.'); }

    // --- walking / pushing the cart ---
    if (!s.intro && !s.checkout) {
        let dx = keyDx, dz = keyDz;
        if (dx || dz) {
            const len = Math.hypot(dx, dz);
            dx /= len; dz /= len;
            const speed = crowded ? 0.035 : 0.07;
            const nx = pos.x + dx * speed;
            if (!blockedAt(s.rects, nx, pos.z, 0.4)) pos.x = nx;
            const nz = pos.z + dz * speed;
            if (!blockedAt(s.rects, pos.x, nz, 0.4)) pos.z = nz;
            s.dir = { x: dx, z: dz };
        }
        const inside = pos.z < FRONT_Z;
        pos.x = Math.max(inside ? -13.5 : -20, Math.min(inside ? 13.5 : 20, pos.x));
        pos.z = Math.max(-13.4, Math.min(19.5, pos.z));
    }

    // remember where you walked, so your parents can follow the same path
    const last = s.trail[s.trail.length - 1];
    if (!last || Math.hypot(last.x - pos.x, last.z - pos.z) > 0.05) {
        s.trail.push({ x: pos.x, z: pos.z });
        if (s.trail.length > 300) s.trail.shift();
    }

    // --- grabbing a cart by walking into it ---
    if (!s.cart && !s.intro) {
        for (let i = 0; i < s.corral.length; i++) {
            const c = s.corral[i];
            if (Math.hypot(c.position.x - pos.x, c.position.z - pos.z) < 1.4) {
                s.corral.splice(i, 1);
                s.cart = { group: c, items: [], meshes: [] };
                showEvent('🛒', 'You grabbed a cart! Push it with the arrow keys / WASD. Parents will add groceries — or click the shelves!');
                updateActionPanel();
                break;
            }
        }
    }

    // --- the cart rolls in front of you ---
    if (s.cart && !s.checkout) {
        s.cartDir.x += (s.dir.x - s.cartDir.x) * 0.2;
        s.cartDir.z += (s.dir.z - s.cartDir.z) * 0.2;
        const l = Math.hypot(s.cartDir.x, s.cartDir.z) || 1;
        const cx = pos.x + (s.cartDir.x / l) * 1.15, cz = pos.z + (s.cartDir.z / l) * 1.15;
        s.cart.group.position.set(cx, 0, cz);
        s.cart.group.rotation.y = Math.atan2(-s.cartDir.x, -s.cartDir.z);
    }

    // --- your parents follow you, and sometimes put things in the cart ---
    s.moms.forEach(p => updateStoreParent(p, s, pos, now));

    // --- checkout lanes ---
    if (s.checkout) {
        updateCheckout(s, now);
    } else if (s.cart && !s.intro) {
        s.lanes.forEach(lane => {
            if (pos.x > lane.x - 1.1 && pos.x < lane.x + 1.1 && pos.z > -9 && pos.z < 0.9) {
                if (s.cart.items.length === 0) {
                    if (now - s.lastEmptyMsg > 5000) { s.lastEmptyMsg = now; showEvent('🛒', 'Your cart is empty! Get some groceries first.'); }
                } else {
                    beginCheckout(lane);
                }
            }
        });
    }

    // --- snow falling in the parking lot ---
    if (s.snow) animateSnowPoints(s.snow, 0);

    // --- staff walking the aisles, sliding doors, announcements (store-realism.js) ---
    if (s.realism) s.realism.update(now);

    // --- the camera follows you around the store ---
    const camX = Math.max(-7, Math.min(7, pos.x * 0.7));
    camera.position.set(camX, 10.5, pos.z + 6.5);
    camera.lookAt(camX, 0, pos.z - 1);
    renderer.render(scene, camera);
}

// One parent: usually follows you; every so often walks to a shelf and puts something in the cart.
function updateStoreParent(p, s, pos, now) {
    const g = p.group;
    if (s.intro) return;
    const fromTrail = () => {
        const t = s.trail.length > p.delay ? s.trail[s.trail.length - p.delay] : s.trail[0];
        return { x: t.x + p.side * 0.5, z: t.z + 0.7 };
    };
    function stepToward(tx, tz, speed) {
        const dx = tx - g.position.x, dz = tz - g.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.05) {
            const st = Math.min(d, speed);
            g.position.x += (dx / d) * st;
            g.position.z += (dz / d) * st;
            g.rotation.y = Math.atan2(dx, dz);
        }
        return d;
    }

    if (p.state === 'follow') {
        const t = fromTrail();
        const d = Math.hypot(t.x - g.position.x, t.z - g.position.z);
        stepToward(t.x, t.z, Math.min(0.12, 0.02 + d * 0.15));
        if (s.cart && !s.checkout && now > p.nextShop && pos.z < FRONT_Z - 0.5) {
            // pick a shelf in the same aisle (so they don't walk through the shelves)
            let bi = 0, bd = 99;
            STORE_BANDS.forEach((b, i) => { const dd = Math.abs(b - g.position.z); if (dd < bd) { bd = dd; bi = i; } });
            const band = STORE_BANDS[bi];
            const cand = s.sections.filter(x => Math.abs(x.rowZ - band) < 2.6 && Math.abs(x.x - g.position.x) < 7);
            p.nextShop = now + 6000 + Math.random() * 6000;
            if (cand.length) {
                p.sec = cand[Math.floor(Math.random() * cand.length)];
                p.target = { x: p.sec.x, z: p.sec.rowZ + (band > p.sec.rowZ ? 1.15 : -1.15) };
                p.state = 'toShelf';
            }
        }
    } else if (p.state === 'toShelf') {
        const d = stepToward(p.target.x, p.target.z, 0.09);
        if (Math.hypot(pos.x - g.position.x, pos.z - g.position.z) > 16) p.state = 'follow';   // you went far away — catch up
        else if (d < 0.2) { p.state = 'grab'; p.until = now + 700; }
    } else if (p.state === 'grab') {
        if (now > p.until) {
            if (s.cart && !s.checkout) addToCart(p.sec.item, p.name);
            p.state = 'return';
        }
    } else if (p.state === 'return') {
        const t = fromTrail();
        const d = stepToward(t.x, t.z, 0.1);
        if (d < 0.8) p.state = 'follow';
    }
}

// ---------------------------------------------
// Checkout
// ---------------------------------------------

function beginCheckout(lane) {
    const s = store;
    if (!s || s.checkout) return;
    const q = lane.queue.length;
    const slotZ = -q * 1.6;
    s.checkout = { lane, phase: 'queue', next: Date.now() + 900, slotZ, scanned: 0, total: 0 };
    playerMesh.position.set(lane.x, s.py, slotZ);
    playerMesh.rotation.y = 0;
    s.cart.group.position.set(lane.x, 0, slotZ + 1.15);
    s.cart.group.rotation.y = 0;
    s.dir = { x: 0, z: 1 }; s.cartDir = { x: 0, z: 1 };
    showEvent('🧾', q > 0 ? `Waiting in line at checkout ${lane.number}... ${q} ${q === 1 ? 'person' : 'people'} ahead.` : `Your turn at checkout ${lane.number}!`);
    updateActionPanel();
}

function updateCheckout(s, now) {
    const c = s.checkout;
    const lane = c.lane;
    const pos = playerMesh.position;

    if (c.phase === 'queue') {
        if (now >= c.next) {
            if (lane.queue.length) {                        // the person at the front pays and leaves; everyone shuffles forward
                const gone = lane.queue.shift();
                scene.remove(gone);
                lane.queue.forEach(p => { p.userData.targetZ += 1.6; });
                c.slotZ += 1.6;
                c.next = now + 900;
            } else {
                c.phase = 'scan';
                c.next = now + 500;
                showEvent('🧾', "It's your turn! The cashier scans your groceries.");
            }
        }
        lane.queue.forEach(p => { p.position.z += (p.userData.targetZ - p.position.z) * 0.15; });
        pos.z += (c.slotZ - pos.z) * 0.15;
        s.cart.group.position.set(lane.x, 0, pos.z + 1.15);
    } else if (c.phase === 'scan') {
        if (now >= c.next) {
            if (c.scanned < s.cart.items.length) {
                const item = s.cart.items[c.scanned];
                const m = s.cart.meshes[c.scanned];
                if (m) {                                    // the item hops from the cart onto the belt
                    s.cart.group.remove(m);
                    m.position.set(lane.x, 0.84, 0.9 + (c.scanned % 8) * 0.28);
                    scene.add(m);
                    s.objects.push(m);
                }
                c.total += item.price;
                c.scanned++;
                c.next = now + 380;
            } else {
                c.phase = 'pay';
                showReceipt();
            }
        }
    }
}

function showReceipt() {
    const s = store;
    const c = s.checkout;
    // Pay for it and put the food in your fridge: parents pay while you're a kid, you pay from 18 (food.js)
    const paid = typeof processGroceryCheckout === 'function' ? processGroceryCheckout(s.cart.items) : null;
    const items = paid ? paid.items : s.cart.items;
    if (paid) c.total = items.reduce((sum, it) => sum + it.price, 0);
    const counts = {};
    items.forEach(it => { counts[it.name] = counts[it.name] || { item: it, n: 0 }; counts[it.name].n++; });
    const lines = Object.values(counts).map(x => `<div>${x.item.emoji} ${x.item.name} ${x.n > 1 ? '× ' + x.n : ''} <span style="float:right">$${x.item.price * x.n}</span></div>`).join('');
    const payerText = paid ? paid.payerText : `👪 ${Math.random() < 0.5 ? 'Mom' : 'Dad'} paid with a card.`;
    const grades = gradeInfo();

    // A fun trip makes you happy; good grades earn a lollipop!
    let hap = 6 + Math.min(6, Math.floor(items.length / 2));
    let cashier, lollipop = '';
    if (grades.good) {
        hap += 8;
        cashier = `Wow, you have ${grades.letter === 'A' ? 'an A' : 'a B'} in school! That's great — here's a lollipop for your good grades!`;
        lollipop = `<div style="font-size:3.6em; animation:giftPop 0.5s ease-out;">🍭</div>
                    <p style="color:#e91e8c; font-weight:bold; margin-bottom:6px;">You got a lollipop! +8 😊</p>`;
    } else if (!grades.hasGrades) {
        cashier = "Hi there, little one! When you start school and get good grades, you'll get a lollipop here!";
    } else {
        cashier = `Your grades are a ${grades.letter} right now. Study hard and next time you might get a lollipop! 📚`;
    }
    player.happiness = Math.min(100, player.happiness + hap);
    updateStats(); saveGame();

    const overlay = document.createElement('div');
    overlay.id = 'checkout-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial;
    `;
    overlay.innerHTML = `
        <style>@keyframes giftPop { 0% { transform:scale(0.2) rotate(-20deg); } 70% { transform:scale(1.25) rotate(8deg); } 100% { transform:scale(1) rotate(0); } }</style>
        <div style="background:#16213e; border:3px solid #27ae60; border-radius:16px; padding:24px 32px;
                    text-align:center; min-width:300px; max-width:400px; max-height:90vh; overflow-y:auto;">
            <h2 style="color:#2ecc71; margin-bottom:8px;">🧾 Checkout ${c.lane.number}</h2>
            <div style="text-align:left; color:#ddd; background:#0f3460; border-radius:10px; padding:10px 14px; margin-bottom:10px; font-size:0.95em;">
                ${lines || '<i>(nothing)</i>'}
                <hr style="border:0; border-top:1px dashed #666; margin:8px 0;">
                <b>Total <span style="float:right">$${c.total}</span></b>
            </div>
            <p style="color:#aaa; margin-bottom:6px;">${payerText}</p>
            <p style="color:#5dade2; font-size:0.9em; margin-bottom:10px;">🧊 Your groceries went in the fridge — they spoil, so eat them in time!</p>
            <p style="color:#FFD700; margin-bottom:10px;">🧑‍💼 Cashier: "${cashier}"</p>
            ${lollipop}
            <p style="color:#2ecc71; margin-bottom:12px;">Fun shopping trip! +${hap - (grades.good ? 8 : 0)} 😊</p>
            <button class="action-btn" onclick="finishStoreTrip()">🚗 Back to the car</button>
        </div>`;
    document.body.appendChild(overlay);
}

function finishStoreTrip() {
    leaveStore(true);
}

// ---------------------------------------------
// Leaving
// ---------------------------------------------

// Puts the house back and drives you home. done=true when you checked out.
function leaveStore(done) {
    const s = store;
    if (!inStore || !s) return;
    store = null;
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) overlay.remove();

    playerMesh.position.copy(s.saved.pos);
    playerMesh.rotation.copy(s.saved.rot);
    playerMesh.scale.copy(s.saved.scale);

    s.objects.forEach(obj => { scene.remove(obj); disposeTree(obj); });
    scene.background = s.saved.bg;
    s.stash.forEach(obj => scene.add(obj));
    clickableNPCs.length = 0;
    s.clickables.forEach(c => clickableNPCs.push(c));

    if (s.fromMall) {                      // back out into the mall (mall.js keeps the day clock paused)
        inStore = false;
        if (!done) showEvent('🛒', 'You left without checking out — the groceries went back on the shelves.');
        onMallGroceryDone(done);
        return;
    }

    lastDayTime += Date.now() - s.start;   // the day clock was paused while you shopped
    inStore = false;
    document.getElementById('location-name').textContent = '🏠 Home';
    updateActionPanel();
    if (!done) showEvent('🛒', 'You left without checking out — the groceries went back on the shelves.');
    driveTo('home', '🏠', null, { duration: 3200 });   // a parent drives you home
}
