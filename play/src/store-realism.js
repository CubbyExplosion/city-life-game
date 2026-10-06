// =============================================
// STORE REALISM — makes the grocery store (store.js) feel like a real supermarket.
//
// On top of the 12 shelf sections, this adds:
//   DEPARTMENTS you can shop from (click them, with your cart close by):
//     🥛 Dairy coolers (glass doors)   🥐 Bakery (with an oven)   🥩 Meat & Deli counter (with a deli worker)
//     🍎 Fresh produce tables          🧊 Frozen freezer chests    🧻 Household & drinks end cap
//   PRICE TAGS on every shelf, hanging DEPARTMENT and AISLE signs, a checkered tile floor,
//   a SECURITY GUARD by the door, STORE STAFF restocking shelves, a stack of hand baskets,
//   a wet-floor sign, AUTOMATIC SLIDING DOORS, and now and then a PA ANNOUNCEMENT
//   ("Attention shoppers...").
//
// Called from openGroceryStore() in store.js; its update() runs every frame from updateStore().
// All the extras here are boxes (like everything else in City Life). Never saved.
// =============================================

// What the extra departments sell (the original 12 shelf items are in GROCERY_ITEMS, data.js)
const STORE_DEPT_ITEMS = {
    dairy:   [{ name: 'Yogurt', emoji: '🍦', price: 2, color: 0xFFF3E0 }, { name: 'Butter', emoji: '🧈', price: 4, color: 0xFFE082 }],
    bakery:  [{ name: 'Croissants', emoji: '🥐', price: 3, color: 0xE0A458 }, { name: 'Donuts', emoji: '🍩', price: 5, color: 0xF48FB1 },
              { name: 'Birthday Cake', emoji: '🎂', price: 12, color: 0xF8BBD0 }, { name: 'Baguette', emoji: '🥖', price: 3, color: 0xD7A86E }],
    deli:    [{ name: 'Steak', emoji: '🥩', price: 11, color: 0xC0392B }, { name: 'Sausages', emoji: '🌭', price: 6, color: 0xE59866 },
              { name: 'Fish', emoji: '🐟', price: 9, color: 0x85C1E9 }, { name: 'Ham', emoji: '🍖', price: 7, color: 0xF1948A }],
    produce: [{ name: 'Tomatoes', emoji: '🍅', price: 3, color: 0xE53935 }, { name: 'Lettuce', emoji: '🥬', price: 2, color: 0x7CB342 },
              { name: 'Oranges', emoji: '🍊', price: 4, color: 0xFB8C00 }, { name: 'Grapes', emoji: '🍇', price: 5, color: 0x8E24AA },
              { name: 'Potatoes', emoji: '🥔', price: 3, color: 0xBCAAA4 }, { name: 'Corn', emoji: '🌽', price: 2, color: 0xFDD835 }],
    frozen:  [{ name: 'Ice Cream', emoji: '🍨', price: 6, color: 0xF8BBD0 }, { name: 'Frozen Fries', emoji: '🍟', price: 5, color: 0xFFD54F }],
    extras:  [{ name: 'Water', emoji: '💧', price: 2, color: 0x4FC3F7 }, { name: 'Soda', emoji: '🥤', price: 3, color: 0xE53935 },
              { name: 'Chips', emoji: '🍿', price: 3, color: 0xFFCA28 }, { name: 'Chocolate', emoji: '🍫', price: 3, color: 0x6D4C41 },
              { name: 'Toilet Paper', emoji: '🧻', price: 6, color: 0xFAFAFA }, { name: 'Soap', emoji: '🧼', price: 3, color: 0xCE93D8 }]
};

const STORE_ANNOUNCEMENTS = [
    '📢 Attention shoppers: fresh bread is coming out of the oven in the bakery!',
    '📢 Attention shoppers: ice cream is on special in the frozen section today!',
    '📢 Cleanup in aisle 2, please. Careful — wet floor!',
    '📢 Attention shoppers: the deli has fresh sausages for just $6!',
    '📢 Reminder: checkout lanes 1 to 4 are open. Thank you for shopping with us!',
    '📢 Lost child? Please bring them to the front desk. (Found: one red balloon 🎈)',
    '📢 Attention shoppers: oranges are 2 for $6 in fresh produce!'
];

function addStoreRealism(ctx) {
    const { box, put, block, sections, rects } = ctx;
    const objects = ctx.objects;
    const anim = [];                                             // things that move: { obj, update(t) }

    // A tiny flat-colour mesh helper that goes into the store (and gets cleaned up with it)
    function mesh(geo, color, x, y, z, basic) {
        const m = new THREE.Mesh(geo, basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        scene.add(m); objects.push(m);
        return m;
    }
    const cp = (ctx.chain && ctx.chain.pal) || {};               // this chain's colours (street-styles.js STORE_CHAINS)
    const SKEEP = ['#f1c40f', '#2c3e50', '#34495e', '#2e7d32'];  // price tags & aisle signs keep their look
    const label = (text, opts) => makeLabelSprite(text, (cp.deptBg && opts && SKEEP.indexOf(opts.bg) < 0 && opts.bg !== cp.bannerBg)
        ? Object.assign({}, opts, { bg: cp.deptBg }) : opts);   // store.js's sign maker (department signs take the chain colour)

    // ---- 1. a checkered tile floor (one textured plane, so it's cheap) ----
    {
        const c = document.createElement('canvas'); c.width = 512; c.height = 352;
        const g = c.getContext('2d');
        for (let ix = 0; ix < 16; ix++) for (let iz = 0; iz < 11; iz++) { g.fillStyle = (ix + iz) % 2 ? (cp.tileA || '#E6DFCC') : (cp.tileB || '#F5F1E4'); g.fillRect(ix * 32, iz * 32, 32, 32); }
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 19.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
        floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.012, -4.25);
        scene.add(floor); objects.push(floor);
    }

    // ---- 2. department displays you can click (same trick the shelves use) ----
    function display(x, z, item, w, d, tableColor, goodsColor) {
        const grp = new THREE.Group();
        box(w, 0.8, d, 0, 0.4, 0, tableColor, grp);
        const cols = Math.max(2, Math.floor(w / 0.5));
        for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) box(0.36, 0.28, 0.36, -w / 2 + 0.3 + i * (w - 0.5) / Math.max(1, cols - 1), 0.94, -0.18 + j * 0.36, goodsColor || item.color, grp);
        const tag = label(item.emoji, { w: 128, h: 128, size: 80, bg: '#2c3e50', sw: 1.0, sh: 1.0 });
        tag.position.set(0, 1.9, 0); grp.add(tag);
        const price = label('$' + item.price, { w: 128, h: 64, size: 40, bg: '#f1c40f', fg: '#000', sw: 0.85, sh: 0.42 });
        price.position.set(0, 1.25, d / 2 + 0.2); grp.add(price);
        grp.userData.npcData = { name: item.name, isShelf: true, itemIndex: -1 };
        put(grp, x, 0, z);
        clickableNPCs.push(grp);
        sections.push({ group: grp, x, rowZ: z, item });
        block(x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 - 0.1, z + d / 2 + 0.1);
        return grp;
    }

    // ---- 3. back wall: dairy coolers, bakery, meat & deli ----
    // Dairy: tall coolers with glass doors
    for (let i = 0; i < 4; i++) {
        const x = -12.2 + i * 2.1;
        box(2.0, 2.4, 0.8, x, 1.2, -13.55, 0xECEFF1);
        box(1.8, 2.0, 0.05, x, 1.2, -13.1, 0xB3E5FC);                              // the glass door
        for (let sh = 0; sh < 3; sh++) box(1.6, 0.28, 0.3, x, 0.6 + sh * 0.65, -13.35, [0xFFFFFF, 0xFFF3E0, 0xFFE082, 0xB2EBF2][(i + sh) % 4]);   // milk, yogurt, butter...
        box(0.1, 0.1, 0.1, x + 0.85, 1.2, -13.05, 0x607D8B);                       // door handle
    }
    block(-13.3, -3.9, -14.1, -12.9);
    const dairySign = label('🥛 DAIRY', { w: 256, h: 96, size: 54, bg: '#1565c0', sw: 2.6, sh: 0.9 }); dairySign.position.set(-8.2, 3.5, -13.4); put(dairySign, -8.2, 3.5, -13.4);
    display(-10.4, -12.1, STORE_DEPT_ITEMS.dairy[0], 1.5, 0.7, 0xCFD8DC, 0xFFF3E0);
    display(-8.4, -12.1, STORE_DEPT_ITEMS.dairy[1], 1.5, 0.7, 0xCFD8DC, 0xFFE082);

    // Bakery: display tables and an oven with a warm glow, and a baker
    box(2.2, 1.6, 1.2, -1.2, 0.8, -13.4, 0x4E342E);                                // the oven
    mesh(new THREE.BoxGeometry(1.4, 0.7, 0.05), 0xFF8F00, -1.2, 0.9, -12.78, true);   // its glowing door
    box(0.4, 1.0, 0.4, -1.2, 2.1, -13.4, 0x5D4037);                                // chimney
    block(-2.5, 0.1, -14.1, -12.7);
    const bakerySign = label('🥐 BAKERY', { w: 256, h: 96, size: 54, bg: '#8d6e63', sw: 2.6, sh: 0.9 }); put(bakerySign, 0.6, 3.5, -13.4);
    display(0.9, -12.0, STORE_DEPT_ITEMS.bakery[0], 1.4, 0.8, 0xD7B98A);
    display(2.6, -12.0, STORE_DEPT_ITEMS.bakery[1], 1.4, 0.8, 0xD7B98A);
    display(4.3, -12.0, STORE_DEPT_ITEMS.bakery[3], 1.4, 0.8, 0xD7B98A);
    const baker = makePerson(-1.2, -12.2, 0xFFFFFF, 0x4B2800, 0.85); box(0.32, 0.22, 0.32, 0, 1.78, 0, 0xFFFFFF, baker); put(baker, -1.2, 0, -12.2);

    // Meat & deli: a long counter with a glass case, and a deli worker behind it
    box(6.8, 1.1, 1.2, 9.0, 0.55, -13.1, 0xCFD8DC);
    box(6.6, 0.55, 0.95, 9.0, 1.4, -13.1, 0xB3E5FC);
    for (let i = 0; i < 8; i++) box(0.6, 0.24, 0.5, 6.4 + i * 0.62, 1.32, -13.1, [0xC0392B, 0xE59866, 0xF1948A, 0x85C1E9][i % 4]);
    box(7.0, 0.1, 1.4, 9.0, 1.1, -12.55, 0x90A4AE);
    block(5.5, 12.5, -14.1, -12.3);
    const deliSign = label('🥩 MEAT & DELI', { w: 320, h: 96, size: 50, bg: '#b71c1c', sw: 3.2, sh: 0.9 }); put(deliSign, 9.0, 3.5, -13.4);
    const deliWorker = makePerson(9.0, -13.9, 0xFFFFFF, 0x222222, 0.9); box(0.34, 0.2, 0.34, 0, 1.78, 0, 0xFFFFFF, deliWorker); put(deliWorker, 9.0, 0, -13.9);
    display(12.3, -11.4, STORE_DEPT_ITEMS.deli[0], 1.2, 0.8, 0xCFD8DC);
    display(12.3, -9.6, STORE_DEPT_ITEMS.deli[2], 1.2, 0.8, 0xCFD8DC);

    // ---- 4. fresh produce tables (near the entrance, on the right) ----
    const prodNames = ['produce'];
    [[5.0, 1.4, 0], [6.9, 1.4, 1], [8.2, 1.4, 2]].forEach(([x, z, k]) => {
        display(x, z, STORE_DEPT_ITEMS.produce[k], 1.5, 0.9, 0x8D6E63);
    });
    display(5.0, 3.0, STORE_DEPT_ITEMS.produce[3], 1.5, 0.9, 0x8D6E63);
    display(6.9, 3.0, STORE_DEPT_ITEMS.produce[4], 1.5, 0.9, 0x8D6E63);
    const prodSign = label('🍎 FRESH PRODUCE', { w: 360, h: 96, size: 46, bg: '#2e7d32', sw: 3.4, sh: 0.9 }); put(prodSign, 6.6, 2.7, 2.2);

    // ---- 5. frozen foods: freezer chests with glass lids (near the entrance, on the left) ----
    box(2.2, 0.9, 1.1, -8.8, 0.45, 1.6, 0xFFFFFF); box(2.0, 0.1, 0.95, -8.8, 0.95, 1.6, 0xB3E5FC);
    box(2.2, 0.9, 1.1, -6.6, 0.45, 1.6, 0xFFFFFF); box(2.0, 0.1, 0.95, -6.6, 0.95, 1.6, 0xB3E5FC);
    block(-9.95, -5.45, 1.0, 2.2);
    const frozenSign = label('🧊 FROZEN', { w: 256, h: 96, size: 50, bg: '#0277bd', sw: 2.4, sh: 0.9 }); put(frozenSign, -7.7, 2.7, 1.6);
    display(-8.8, 3.0, STORE_DEPT_ITEMS.frozen[0], 1.5, 0.8, 0xE3F2FD);
    display(-6.9, 3.0, STORE_DEPT_ITEMS.frozen[1], 1.5, 0.8, 0xE3F2FD);

    // ---- 6. household & drinks end caps on the shelf rows ----
    display(-12.0, -6.5, STORE_DEPT_ITEMS.extras[0], 1.2, 0.8, 0x607D8B);
    display(-12.0, -4.6, STORE_DEPT_ITEMS.extras[1], 1.2, 0.8, 0x607D8B);
    display(-12.0, -8.4, STORE_DEPT_ITEMS.extras[2], 1.2, 0.8, 0x607D8B);
    display(12.1, -7.6, STORE_DEPT_ITEMS.extras[4], 1.2, 0.8, 0x607D8B);

    // ---- 7. price tags on every shelf section, and aisle signs ----
    sections.forEach(sec => {
        if (!sec.priceTag && [-10.5, -6.5, -2.5].includes(sec.rowZ)) {          // only the 12 original shelf sections (displays have their own tags)
            const tag = label('$' + sec.item.price, { w: 128, h: 64, size: 40, bg: '#f1c40f', fg: '#000', sw: 0.85, sh: 0.42 });
            tag.position.set(0, 0.95, 0.72);
            sec.group.add(tag); sec.priceTag = true;
        }
    });
    ['Aisle 1 · Everyday', 'Aisle 2 · Breakfast', 'Aisle 3 · Meals & treats'].forEach((txt, i) => {
        const s = label(txt, { w: 384, h: 80, size: 38, bg: '#34495e', sw: 3.0, sh: 0.6 });
        put(s, 0, 2.5, [-10.5, -6.5, -2.5][i] + 0.0);
        s.position.x = -7.9;
        const s2 = label(txt, { w: 384, h: 80, size: 38, bg: '#34495e', sw: 3.0, sh: 0.6 }); put(s2, 7.9, 2.5, [-10.5, -6.5, -2.5][i]);
    });
    const banner = makeLabelSprite(cp.banner || '⭐ WEEKLY SPECIALS ⭐', { w: 512, h: 96, size: 46, bg: cp.bannerBg || '#c62828', sw: 5.0, sh: 0.9 });
    put(banner, 0, 4.2, -13.6);

    // ---- 8. the people: a security guard by the door, staff restocking shelves ----
    const guard = makePerson(-1.9, 4.6, 0x1B2631, 0x222222, 0.95);
    box(0.44, 0.14, 0.44, 0, 1.78, 0, 0x1B2631, guard);                            // a cap
    box(0.3, 0.1, 0.05, 0, 1.0, 0.2, 0xF1C40F, guard);                              // a badge
    put(guard, -1.9, 0, 4.6);
    guard.userData.role = 'guard';
    const staff1 = makePerson(-7.4, -8.5, 0x2E7D32, 0x4B2800, 0.9);                 // green apron, carrying a box
    box(0.5, 0.4, 0.4, 0, 1.55, 0.35, 0xBCAAA4, staff1);
    put(staff1, -7.4, 0, -8.5);
    const staff2 = makePerson(7.4, -4.5, 0x2E7D32, 0x222222, 0.9);
    box(0.5, 0.4, 0.4, 0, 1.55, 0.35, 0xBCAAA4, staff2);
    put(staff2, 7.4, 0, -4.5);
    anim.push({ g: staff1, a: -7.4, b: 7.4, z: -8.5, speed: 0.7, dir: 1 });
    anim.push({ g: staff2, a: -7.4, b: 7.4, z: -4.5, speed: 0.55, dir: -1 });

    // ---- 9. hand baskets by the door, a wet-floor sign, sliding doors ----
    for (let i = 0; i < 3; i++) box(0.7, 0.3, 0.5, 3.6, 0.15 + i * 0.28, 4.7, [0xE53935, 0xE53935, 0xC62828][i]);
    block(3.2, 4.1, 4.4, 5.0);
    box(0.5, 0.7, 0.05, 0.9, 0.35, -0.9, 0xFFEB3B); box(0.5, 0.1, 0.4, 0.9, 0.05, -0.9, 0xFFEB3B);
    const door1 = box(1.35, 2.4, 0.06, -2.0, 1.2, 5.5, 0xB3E5FC);
    const door2 = box(1.35, 2.4, 0.06, 2.0, 1.2, 5.5, 0xB3E5FC);

    // ---- 10. every frame ----
    let lastPA = Date.now(), nextPA = lastPA + 30000 + Math.random() * 30000;
    return {
        update(now) {
            const t = now / 1000;
            anim.forEach(a => {                                                    // staff stroll along their aisle
                a.g.position.x += a.dir * a.speed * 0.016;
                if (a.g.position.x > a.b) a.dir = -1; else if (a.g.position.x < a.a) a.dir = 1;
                a.g.rotation.y = a.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
                a.g.position.y = Math.abs(Math.sin(t * 5 + a.z)) * 0.03;
            });
            const near = Math.abs(playerMesh.position.x) < 3.4 && playerMesh.position.z > 2.5 && playerMesh.position.z < 8.5;
            const open = near ? 1 : 0;                                              // the doors slide apart when you get close
            door1.position.x += ((open ? -3.3 : -1.35) - door1.position.x) * 0.15;
            door2.position.x += ((open ? 3.3 : 1.35) - door2.position.x) * 0.15;
            if (now > nextPA) {
                nextPA = now + 45000 + Math.random() * 45000;
                showEvent('📢', STORE_ANNOUNCEMENTS[Math.floor(Math.random() * STORE_ANNOUNCEMENTS.length)].replace('📢 ', ''));
            }
        },
        guard
    };
}
