// =============================================
// PLACES — walkable 3D workplaces and a university campus (the 3D side of life.js).
//
//   💼 WORK: "Work" -> you drive to your job's building -> walk in -> walk to the 4 glowing pads one by one.
//            Each pad is a task (scan the shopping, mop the lobby, change a tyre...) that asks you a work question.
//            There is a different building for each kind of job: shop, café, warehouse, office, kitchen, garage,
//            police station, hospital, school classroom, laboratory. Coworkers walk around, a boss stands in the
//            corner, and a vending machine / coffee machine sells snacks (fullness!).
//   🎓 UNIVERSITY: you drive to the campus (a green quad with a fountain, a library and a cafeteria cart),
//            walk through the lecture-hall door and sit at your glowing desk. The professor stands at the board.
//
// The questions, pay, promotions, degrees... all stay in life.js — this file only builds the 3D places
// and walks you between the pads. Open with openWorkplace() / openCampus() (called after the car ride).
// Everything here is boxes, like the rest of City Life. Nothing is saved.
// =============================================

let place3D = null;                  // everything about the building you're in, or null
const PLACE_SPEED = 4.4;

// Which building each job works in, and the 4 tasks of a shift (one per pad)
const JOB_THEME = {
    cashier: 'store', stocker: 'store', barista: 'cafe', janitor: 'office', delivery: 'warehouse', reception: 'office',
    chef: 'kitchen', mechanic: 'garage', police: 'station', teacher: 'school', designer: 'office', accountant: 'office',
    scientist: 'lab', engineer: 'office', programmer: 'office', lawyer: 'office', doctor: 'hospital'
};
// (the 4 tasks of each job — JOB_TASKS — and their mini-games live in work-tasks.js)

const PLACE_BOUNDS_WORK = { minX: -13.6, maxX: 13.6, minZ: -8.8, maxZ: 17 };
const PLACE_BOUNDS_UNI  = { minX: -27, maxX: 27, minZ: -20, maxZ: 25 };

function placeBox(grp, w, h, d, x, y, z, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    grp.add(m);
    return m;
}

function placeCyl(grp, rt, rb, h, x, y, z, color, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    m.castShadow = true;
    grp.add(m);
    return m;
}

// ---------------------------------------------
// the prop kit (every building is made of these)
// ---------------------------------------------
function makePlaceKit(g, cols) {
    const B = (w, h, d, x, y, z, c) => placeBox(g, w, h, d, x, y, z, c);
    const solid = (x, z, w, d) => cols.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    const kit = { B, solid };
    const goods = [0xE74C3C, 0xF1C40F, 0x3498DB, 0x2ECC71, 0xFFFFFF, 0xE91E63, 0xE67E22];

    kit.desk = (x, z, c) => {                                   // a desk with a computer and a chair
        B(2.2, 0.1, 1.1, x, 0.8, z, c || 0x9C6B3C);
        B(0.1, 0.8, 1.0, x - 1.0, 0.4, z, 0x6D4C41); B(0.1, 0.8, 1.0, x + 1.0, 0.4, z, 0x6D4C41);
        B(0.8, 0.55, 0.08, x, 1.25, z - 0.25, 0x2C3E50); B(0.82, 0.57, 0.04, x, 1.25, z - 0.2, 0x5DADE2);
        B(0.2, 0.2, 0.2, x, 0.95, z - 0.25, 0x555555);
        B(0.6, 0.04, 0.22, x, 0.87, z + 0.2, 0xDDDDDD);
        B(0.7, 0.1, 0.7, x, 0.5, z + 1.15, 0x34495E); B(0.7, 0.7, 0.1, x, 0.95, z + 1.45, 0x34495E);
        solid(x, z, 2.3, 1.2);
    };
    kit.counter = (x, z, w, d, c, top) => {
        B(w, 1.0, d, x, 0.5, z, c || 0x8D6E63);
        B(w + 0.1, 0.1, d + 0.1, x, 1.05, z, top || 0xECEFF1);
        solid(x, z, w, d);
    };
    kit.shelf = (x, z, w, rot, tint) => {                       // a tall shelf unit full of goods (rot: 0 = along x, 1 = along z)
        const sw = rot ? 0.8 : w, sd = rot ? w : 0.8;
        B(sw, 3.2, sd, x, 1.6, z, 0x8E8E93);
        for (let lv = 0; lv < 4; lv++) {
            const n = Math.floor(w / 0.6);
            for (let i = 0; i < n; i++) {
                const off = -w / 2 + 0.35 + i * 0.6;
                const c = tint || goods[(i + lv + Math.floor(x + z)) % goods.length];
                if (rot) B(0.7, 0.45, 0.45, x, 0.4 + lv * 0.75, z + off, c); else B(0.45, 0.45, 0.7, x + off, 0.4 + lv * 0.75, z, c);
            }
        }
        solid(x, z, sw, sd);
    };
    kit.table = (x, z, r, c) => {                               // a round table with 4 chairs
        placeCyl(g, r, r, 0.1, x, 0.85, z, c || 0xA0522D, 18); placeCyl(g, 0.1, 0.1, 0.85, x, 0.42, z, 0x555555, 8);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => B(0.5, 0.5, 0.5, x + dx * (r + 0.55), 0.3, z + dz * (r + 0.55), 0x34495E));
        solid(x, z, r * 2 + 0.4, r * 2 + 0.4);
    };
    kit.plant = (x, z) => {
        B(0.6, 0.6, 0.6, x, 0.3, z, 0xB5651D); B(0.9, 0.9, 0.9, x, 1.1, z, 0x2E8B3C); B(0.5, 0.5, 0.5, x, 1.7, z, 0x38A04A);
        solid(x, z, 0.8, 0.8);
    };
    kit.crate = (x, z, s, c) => { const m = B(s, s, s, x, s / 2, z, c || 0xC8A165); solid(x, z, s, s); return m; };
    kit.rack = (x, z, len, rot) => {                            // warehouse rack with boxes
        const sw = rot ? len : 1.4, sd = rot ? 1.4 : len;
        for (let lv = 0; lv < 3; lv++) B(sw, 0.12, sd, x, 0.3 + lv * 1.1, z, 0x2980B9);
        [-1, 1].forEach(s => B(rot ? 0.12 : 0.12, 3.2, rot ? 0.12 : 0.12, x + (rot ? s * len / 2 : s * 0.65), 1.6, z + (rot ? s * 0.65 : s * len / 2), 0xE67E22));
        for (let lv = 0; lv < 3; lv++) for (let i = 0; i < Math.floor(len / 1.1); i++) {
            const off = -len / 2 + 0.6 + i * 1.1;
            B(rot ? 0.9 : 1.1, 0.8, rot ? 1.1 : 0.9, x + (rot ? off : 0), 0.75 + lv * 1.1, z + (rot ? 0 : off), [0xC8A165, 0xD7B98E, 0xB58B4C][(i + lv) % 3]);
        }
        solid(x, z, sw, sd);
    };
    kit.stove = (x, z) => {
        B(1.8, 1.0, 1.2, x, 0.5, z, 0xB0BEC5); B(1.8, 0.08, 1.2, x, 1.04, z, 0x37474F);
        [-0.4, 0.4].forEach(dx => { placeCyl(g, 0.28, 0.28, 0.05, x + dx, 1.1, z - 0.1, 0x111111, 12); });
        placeCyl(g, 0.25, 0.22, 0.4, x - 0.4, 1.3, z - 0.1, 0xCFD8DC, 12);
        B(1.8, 0.7, 0.5, x, 2.4, z - 0.5, 0x90A4AE);              // hood
        solid(x, z, 1.9, 1.3);
    };
    kit.fridge = (x, z) => { B(1.4, 2.6, 1.2, x, 1.3, z, 0xECEFF1); B(0.05, 0.9, 0.05, x - 0.5, 1.6, z + 0.62, 0x607D8B); solid(x, z, 1.4, 1.2); };
    kit.bed = (x, z) => {                                       // hospital bed (head toward -z)
        B(1.5, 0.5, 2.8, x, 0.5, z, 0xCFD8DC); B(1.3, 0.2, 2.5, x, 0.85, z, 0xFFFFFF); B(0.9, 0.2, 0.6, x, 1.0, z - 0.9, 0xBBDEFB);
        B(1.5, 0.9, 0.1, x, 1.0, z - 1.4, 0x90A4AE); solid(x, z, 1.6, 2.9);
        B(0.1, 2.2, 0.1, x + 1.1, 1.1, z - 1.0, 0xB0BEC5); B(0.3, 0.45, 0.2, x + 1.1, 2.3, z - 1.0, 0xE3F2FD);   // a drip stand
    };
    kit.car = (x, z, color, lifted) => {                        // a car (on a lift when lifted)
        const y0 = lifted ? 1.2 : 0;
        if (lifted) { B(0.3, 1.2, 0.3, x - 1.3, 0.6, z, 0x607D8B); B(0.3, 1.2, 0.3, x + 1.3, 0.6, z, 0x607D8B); }
        B(2.0, 0.6, 4.2, x, y0 + 0.7, z, color); B(1.7, 0.55, 2.0, x, y0 + 1.25, z - 0.1, color); B(1.6, 0.4, 1.8, x, y0 + 1.3, z - 0.1, 0xA9D3E8);
        [[-1.0, -1.4], [1.0, -1.4], [-1.0, 1.4], [1.0, 1.4]].forEach(([dx, dz]) => B(0.25, 0.7, 0.7, x + dx, y0 + 0.35, z + dz, 0x222222));
        solid(x, z, 2.2, 4.4);
    };
    kit.bench = (x, z, w) => {                                  // lab bench with flasks
        kit.counter(x, z, w, 1.3, 0x607D8B, 0x263238);
        for (let i = 0; i < Math.floor(w / 1.4); i++) {
            const fx = x - w / 2 + 0.8 + i * 1.4, c = [0x4FC3F7, 0xAED581, 0xFFB74D, 0xBA68C8][i % 4];
            placeCyl(g, 0.12, 0.28, 0.5, fx, 1.35, z, c, 10); placeCyl(g, 0.07, 0.07, 0.3, fx, 1.75, z, 0xE0F7FA, 8);
        }
    };
    kit.cell = (x, z, w, d) => {                                // jail cell: bars on three sides
        for (let i = 0; i <= Math.floor(w / 0.5); i++) B(0.08, 2.6, 0.08, x - w / 2 + i * 0.5, 1.3, z + d / 2, 0x424242);
        B(w, 0.1, 0.1, x, 2.6, z + d / 2, 0x424242);
        B(0.1, 2.6, d, x - w / 2, 1.3, z, 0x616161); B(0.1, 2.6, d, x + w / 2, 1.3, z, 0x616161);
        B(1.6, 0.5, 0.8, x - w / 2 + 1.1, 0.4, z - d / 2 + 0.7, 0x757575);
        solid(x, z - d / 2 + 0.2, w, 0.4); solid(x - w / 2, z, 0.3, d); solid(x + w / 2, z, 0.3, d);
    };
    kit.truck = (x, z, color) => {
        B(3.6, 2.8, 6.4, x, 1.9, z + 0.8, 0xF5F5F5); B(3.2, 2.0, 1.8, x, 1.4, z - 3.2, color || 0x1565C0); B(2.8, 0.9, 0.1, x, 1.9, z - 4.12, 0x9ED8F5);
        [[-1.8, -2.8], [1.8, -2.8], [-1.8, 2.8], [1.8, 2.8]].forEach(([dx, dz]) => B(0.35, 1.0, 1.0, x + dx, 0.5, z + dz, 0x222222));
        solid(x, z, 3.8, 8.0);
    };
    kit.vending = (x, z, c) => {
        B(1.3, 2.4, 1.0, x, 1.2, z, c || 0xC62828); B(1.0, 1.4, 0.05, x, 1.5, z + 0.52, 0x90CAF9); B(0.9, 0.3, 0.05, x, 0.4, z + 0.52, 0x212121);
        solid(x, z, 1.4, 1.1);
    };
    kit.board = (x, z, w, lines, bg) => {                       // a whiteboard on the back wall with writing
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
        const cx = cv.getContext('2d');
        cx.fillStyle = bg || '#F5F5F5'; cx.fillRect(0, 0, 512, 256);
        cx.fillStyle = '#1a237e'; cx.textAlign = 'left'; cx.font = 'bold 34px Arial';
        (lines || []).forEach((t, i) => cx.fillText(t, 22, 56 + i * 50, 470));
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
        m.position.set(x, 3.0, z); g.add(m);
        B(w + 0.2, w / 2 + 0.2, 0.06, x, 3.0, z - 0.04, 0x90A4AE);
    };
    kit.cooler = (x, z) => { B(0.6, 1.4, 0.6, x, 0.7, z, 0xB3E5FC); B(0.4, 0.5, 0.4, x, 1.65, z, 0x81D4FA); solid(x, z, 0.7, 0.7); };
    kit.lamp = (x, z, c) => { B(0.18, 0.2, 0.18, x, 0.1, z, 0x555555); B(0.1, 4, 0.1, x, 2, z, 0x555555); B(0.5, 0.25, 0.5, x, 4.1, z, c || 0xFFF59D); };
    kit.tree = (x, z) => { B(0.6, 3, 0.6, x, 1.5, z, 0x6D4C41); B(3, 2.6, 3, x, 4, z, 0x2E8B3C); B(1.9, 1.5, 1.9, x, 5.7, z, 0x38A04A); solid(x, z, 1, 1); };
    return kit;
}

// ---------------------------------------------
// people
// ---------------------------------------------
const PLACE_SHIRTS = [0x3498DB, 0xE74C3C, 0x27AE60, 0xF39C12, 0x8E44AD, 0x16A085, 0xE91E8C, 0xD35400];
const PLACE_HAIR = [0x4B2800, 0x222222, 0xCC8844, 0xFFD700, 0x8B0000, 0x888888];

function placePerson(g, x, z, shirt, hair, scale) {
    const p = makePerson(x, z, shirt, hair, scale || 0.9);          // store.js
    g.add(p);
    return p;
}

// Wanderers: coworkers / students / customers who stroll inside a rectangle.
function addWalkers(place, g, n, rect, shirtPool, scale) {
    for (let i = 0; i < n; i++) {
        const x = rect.x0 + Math.random() * (rect.x1 - rect.x0), z = rect.z0 + Math.random() * (rect.z1 - rect.z0);
        const p = placePerson(g, x, z, (shirtPool || PLACE_SHIRTS)[i % (shirtPool || PLACE_SHIRTS).length], PLACE_HAIR[(i * 5) % PLACE_HAIR.length], scale);
        place.walkers.push({ g: p, rect, tx: x, tz: z, wait: Math.random() * 2, speed: 0.9 + Math.random() * 0.8 });
    }
}

// ---------------------------------------------
// the buildings. Each returns { stations: [4 x [x, z]], extras: [...], walkers: [...] , name, emoji, lot }
// All buildings: interior x -14..14, z -9.2..9.4, a low front wall with a door gap at z = 9.4, a parking lot in front.
// ---------------------------------------------
function buildWorkShell(P, theme, name, emoji, accent, floorCol, wallCol) {
    const { g, B, solid } = P;
    B(120, 0.3, 120, 0, -0.35, 10, 0x4C9A3C);                                       // grass all around
    B(62, 0.2, 14, 0, -0.1, 16, 0x4a4a4f);                                           // parking lot
    for (let x = -22; x <= 22; x += 4.4) B(0.14, 0.03, 4.4, x, 0.02, 19, 0xffffff);
    B(62, 0.22, 1.4, 0, -0.08, 10.8, 0xBDBDBD);                                      // pavement along the front
    B(28.8, 0.2, 18.8, 0, -0.1, 0.1, floorCol);                                       // the floor inside
    for (let ix = -6; ix < 6; ix++) for (let iz = -4; iz < 4; iz++) if ((ix + iz) % 2 === 0) B(2.4, 0.02, 2.4, ix * 2.4 + 1.2, 0.03, iz * 2.4 + 1.2, new THREE.Color(floorCol).multiplyScalar(0.93).getHex());
    B(28.8, 5, 0.3, 0, 2.5, -9.4, wallCol);                                           // back wall
    B(0.3, 5, 19, -14.3, 2.5, 0.1, wallCol); B(0.3, 5, 19, 14.3, 2.5, 0.1, wallCol);   // side walls
    B(12, 1.3, 0.3, -8, 0.65, 9.5, wallCol); B(12, 1.3, 0.3, 8, 0.65, 9.5, wallCol);   // low front wall
    solid(-8, 9.5, 12, 0.5); solid(8, 9.5, 12, 0.5);
    solid(0, -9.6, 29, 0.6); solid(-14.4, 0, 0.6, 19.4); solid(14.4, 0, 0.6, 19.4);
    B(4.2, 0.12, 0.34, 0, 1.25, 9.5, accent);                                          // door lintel
    B(0.3, 3.4, 0.3, -2.1, 1.7, 9.5, accent); B(0.3, 3.4, 0.3, 2.1, 1.7, 9.5, accent);
    B(4.6, 1.2, 0.4, 0, 3.8, 9.5, accent);
    const sign = makeNameplateSprite([name, emoji + ' ' + (theme.tagline || '')], '#' + accent.toString(16).padStart(6, '0'), 5.6, 1.3);
    sign.position.set(0, 5.9, 9.6); g.add(sign);
    [-10, -3.3, 3.3, 10].forEach(x => { B(0.5, 0.3, 0.25, x, 3.5, -9.15, 0xFFF59D); B(0.9, 0.08, 0.3, x, 3.35, -9.1, 0x555555); });   // wall lamps (they glow)
    [-4, 4].forEach(z => { B(0.25, 0.3, 0.5, -14.15, 3.5, z, 0xFFF59D); B(0.25, 0.3, 0.5, 14.15, 3.5, z, 0xFFF59D); });
    [-24, 24].forEach(x => P.lamp(x, 12)); [-26, 26].forEach(x => P.tree(x, 3));
    P.tree(-23, -6); P.tree(23, -6);
}

const WORK_THEMES = {
    office(P, job) {
        const { B, g, solid } = P;
        buildWorkShell(P, { tagline: 'Head office' }, 'City Office', '🏢', 0x2C5F8A, 0xC9D6E3, 0xE8EEF4);
        [-9, -3, 3, 9].forEach(x => { P.desk(x, -6.5, 0xA8814F); P.desk(x, -1.4, 0xA8814F); });
        P.counter(-6, 6.4, 6, 1.2, 0x2C5F8A, 0xECEFF1);                                // reception desk
        B(0.9, 0.5, 0.08, -6, 1.5, 6.4, 0x2C3E50);
        P.kit_boss(11, -8, 'Boss');
        P.board(0, -9.1, 6, ['Q3 goals', '- meet the deadline', '- keep customers happy']);
        P.plant(-13, -8); P.plant(13, 7.5); P.plant(-13, 7.5); P.cooler(12.5, 2);
        P.table(9, 5.4, 1.3, 0xE0E0E0);
        if (job === 'janitor') { B(0.9, 0.7, 0.9, 5, 0.35, 5, 0x1565C0); B(0.1, 1.8, 0.1, 5.3, 1.3, 5, 0x8D6E63); }
        return { stations: [[-6, -3.6], [0, -3.6], [6, -3.6], [-6, 4.3]], extras: [{ kind: 'coffee', x: 12.5, z: 5.5 }],
                 walk: { n: 4, rect: { x0: -12, x1: 12, z0: 2.5, z1: 8 } } };
    },
    store(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Everyday low prices' }, 'Corner Market', '🛒', 0xC0392B, 0xEDE7D6, 0xF3E9D2);
        [-9, -3, 3, 9].forEach(x => { P.shelf(x, -7.4, 4, 0); P.shelf(x, -3.2, 4, 0); });
        P.counter(-9, 6, 3.4, 1.1, 0x8D6E63, 0x37474F); P.counter(9, 6, 3.4, 1.1, 0x8D6E63, 0x37474F);
        B(0.6, 0.4, 0.5, -9, 1.3, 6, 0x7F8C8D); B(0.6, 0.4, 0.5, 9, 1.3, 6, 0x7F8C8D);
        P.fridge(-13, -1); P.fridge(-13, 1.4); P.fridge(13, -1);
        P.crate(11.5, 1.2, 1.0, 0xE67E22); P.crate(12.6, 1.2, 1.0, 0xF1C40F);
        P.kit_boss(0, 6.5, 'Manager');
        P.vending(13, 3.8, 0x1565C0);
        return { stations: [[-9, 4.3], [-6, -5.3], [0, -5.3], [9, 4.3]], extras: [{ kind: 'vending', x: 13, z: 4.6 }],
                 walk: { n: 5, rect: { x0: -11, x1: 11, z0: 0, z1: 3.6 } } };
    },
    cafe(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Fresh coffee' }, 'Bean There Café', '☕', 0x6D4C41, 0xD7B98E, 0xF3E5D0);
        P.counter(0, -4.6, 13, 1.4, 0x5D4037, 0xFFF8E1);
        [-4, 0, 4].forEach(x => { B(0.8, 0.6, 0.6, x, 1.4, -4.6, 0x90A4AE); B(0.3, 0.3, 0.3, x + 0.2, 1.85, -4.6, 0xB71C1C); });
        for (let i = 0; i < 4; i++) B(0.9, 0.3, 0.7, -5.4 + i * 1.0, 1.25, -4.2, [0xE0A458, 0xF48FB1, 0xBCAAA4, 0xFFE082][i]);
        B(14, 3.2, 0.5, 0, 1.6, -9.0, 0x5D4037);                                          // shelves wall
        for (let i = 0; i < 12; i++) B(0.5, 0.6, 0.5, -6.4 + i * 1.2, 2.0 + (i % 2) * 0.7, -8.7, [0xFFFFFF, 0xC62828, 0x4E342E][i % 3]);
        [[-9, 1], [-3, 3], [4, 1], [10, 3.2]].forEach(([x, z]) => P.table(x, z, 0.9, 0x8D6E63));
        P.plant(-13, 8); P.plant(13, 8); P.kit_boss(10, -7.5, 'Manager');
        return { stations: [[-4, -7.0], [4, -7.0], [-9, -1.4], [9, -1.0]], extras: [{ kind: 'coffee', x: 11.8, z: -4.6 }],
                 walk: { n: 4, rect: { x0: -12, x1: 12, z0: 5.2, z1: 8.2 } } };
    },
    warehouse(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Parcels & freight' }, 'Fast Freight', '📦', 0xE67E22, 0xB0B0A8, 0xCFCFC8);
        [-10.5, -4.5, 1.5].forEach(x => P.rack(x, -2.2, 12, false));
        P.truck(10.5, -3, 0x1565C0);
        for (let i = 0; i < 4; i++) P.crate(-12 + i * 1.3, 7.4, 1.1, [0xC8A165, 0xD7B98E][i % 2]);
        P.crate(5, 7.5, 1.2); P.crate(6.3, 7.5, 1.2); P.crate(5.6, 7.5, 1.2).position.y += 1.2;
        B(1.2, 0.15, 3.4, 11, 0.08, 6, 0x9E9E9E);                                          // pallet
        P.kit_boss(-13, 5, 'Foreman');
        P.vending(13, 6.5, 0x2E7D32);
        return { stations: [[-7.5, -2.2], [-1.5, -2.2], [8.5, 5.5], [-4, 5.5]], extras: [{ kind: 'vending', x: 13, z: 7.3 }],
                 walk: { n: 3, rect: { x0: -3, x1: 6, z0: 3, z1: 8 } } };
    },
    kitchen(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Restaurant & grill' }, 'The Golden Fork', '🍽️', 0xB7950B, 0xCFD8DC, 0xF5F5F0);
        [-11, -8.5, -6, -3.5].forEach(x => P.stove(x, -8));
        P.counter(1, -2.2, 7, 1.6, 0x90A4AE, 0xCFD8DC);                                     // prep island
        for (let i = 0; i < 5; i++) B(0.4, 0.25, 0.4, -1.5 + i * 1.0, 1.25, -2.2, [0x66BB6A, 0xEF5350, 0xFFA726, 0xFFEE58, 0xAB47BC][i]);
        P.counter(9, 3.4, 7.0, 1.2, 0x5D4037, 0xFFFFFF);                                    // serving window
        for (let i = 0; i < 3; i++) { placeCyl(P.g, 0.4, 0.4, 0.06, 7 + i * 1.6, 1.15, 3.4, 0xFFFFFF, 14); }
        P.fridge(13, -7.5); P.fridge(11.4, -7.5); P.counter(-12.4, 1.5, 1.4, 5, 0x90A4AE, 0xCFD8DC);
        P.kit_boss(5, -7.5, 'Head Chef');
        P.crate(-9, 6.5, 1.0, 0xDEB887);
        return { stations: [[-7, -5.9], [1, 0.1], [9, 5.0], [-10, 2.2]], extras: [{ kind: 'snack', x: -12.4, z: 5.2 }],
                 walk: { n: 3, rect: { x0: -2, x1: 5, z0: 2, z1: 7 } } };
    },
    garage(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Repairs & tyres' }, 'Joe\'s Garage', '🔧', 0x37474F, 0x9E9E9E, 0xB0BEC5);
        P.car(-8, -4.5, 0xC62828, true); P.car(1.5, -4.5, 0x1976D2, true);
        P.counter(11, -7.5, 4.2, 1.2, 0x455A64, 0x263238);
        for (let i = 0; i < 4; i++) B(0.25, 0.5, 0.25, 10 + i * 0.7, 1.4, -7.5, [0xFFCA28, 0xEF5350, 0x29B6F6, 0xFFFFFF][i]);
        for (let i = 0; i < 5; i++) { placeCyl(P.g, 0.55, 0.55, 0.45, 11.5, 0.25 + i * 0.46, 4.5, 0x222222, 14); }
        P.solid(11.5, 4.5, 1.3, 1.3);
        P.crate(-12, 5, 1.1, 0xFFA000); P.crate(-10.8, 5, 1.1, 0xFFA000);
        P.kit_boss(-12.5, -8, 'Mechanic Joe');
        P.vending(-13, 1.4, 0xC62828);
        return { stations: [[-8, -1.4], [1.5, -1.4], [10.8, -5.4], [6.5, 4.5]], extras: [{ kind: 'vending', x: -13, z: 2.3 }],
                 walk: { n: 2, rect: { x0: -6, x1: 8, z0: 1.5, z1: 7 } } };
    },
    station(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Protect & serve' }, 'City Police', '🚓', 0x1A237E, 0xB8C4D0, 0xE3E8EE);
        [-9, -3, 3].forEach(x => P.desk(x, -6.2, 0x78909C)); P.desk(-6, -0.5, 0x78909C); P.desk(0, 0.5, 0x78909C);
        P.cell(10, -6, 6, 5); P.shelf(-12.5, 3, 5, 1, 0x90A4AE);
        P.counter(0, 6.4, 6, 1.1, 0x1A237E, 0xECEFF1);
        B(0.1, 3.4, 0.1, 5.5, 1.7, 7.5, 0xBDBDBD); B(1.6, 1.0, 0.05, 6.3, 3.0, 7.5, 0x1A237E);   // flag
        P.board(-6, -9.1, 5, ['MAP OF THE CITY', 'Patrol A  B  C', 'Wanted: none today']);
        P.kit_boss(8, -1.5, 'Sergeant');
        P.cooler(13, 5);
        return { stations: [[-6, -4.0], [10, -2.4], [-11.2, 0.2], [0, 4.2]], extras: [{ kind: 'coffee', x: 13, z: 5.8 }],
                 walk: { n: 3, rect: { x0: -10, x1: 10, z0: 2, z1: 8 } } };
    },
    hospital(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Caring for the city' }, 'City Hospital', '🏥', 0x00897B, 0xE0F2F1, 0xF4FBFA);
        [-9, -3, 3].forEach(x => { P.bed(x, -6.8); });
        B(0.1, 2.4, 3, -6, 2.1, -4.6, 0xB2DFDB); B(0.1, 2.4, 3, 0, 2.1, -4.6, 0xB2DFDB);     // curtains
        P.counter(9, 6.2, 6, 1.1, 0x00897B, 0xECEFF1);
        B(1.6, 0.9, 2.6, 10, 0.9, -5.5, 0xCFD8DC); B(1.4, 0.15, 2.4, 10, 1.4, -5.5, 0xFFFFFF); P.solid(10, -5.5, 1.8, 2.8);   // surgery table
        P.kit_boss(-12.5, 4, 'Head Nurse');
        P.plant(-13, 8); P.cooler(13, 1.5);
        B(0.9, 0.9, 0.12, 12.9, 3, -3, 0x00897B);                                               // a red cross
        B(0.9, 0.9, 0.12, 12.9, 3, -3, 0xE53935).scale.set(0.3, 1, 1);
        B(0.9, 0.9, 0.12, 12.9, 3, -3, 0xE53935).scale.set(1, 0.3, 1);
        return { stations: [[-9, -4.4], [-3, -4.4], [3, -4.4], [8, 3.9]], extras: [{ kind: 'coffee', x: 13, z: 2.4 }],
                 walk: { n: 4, rect: { x0: -11, x1: 6, z0: 0, z1: 7.5 } } };
    },
    school(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Learning is fun' }, 'Maple Primary', '🏫', 0xD35400, 0xF2D9A6, 0xFFF3D6);
        P.board(0, -9.1, 9, ['Today: fractions', '1/2 + 1/4 = ?', 'Read chapter 3']);
        [-1, 1].forEach(s => [0, 1, 2].forEach(r => [7.5, 10.5].forEach(x => {
            const dx = s * x, dz = -5.6 + r * 3.0;
            B(1.7, 0.1, 0.9, dx, 0.75, dz, 0xD7A86E); B(0.1, 0.75, 0.8, dx - 0.7, 0.37, dz, 0x6D4C41); B(0.1, 0.75, 0.8, dx + 0.7, 0.37, dz, 0x6D4C41);
            B(0.6, 0.1, 0.6, dx, 0.45, dz + 0.9, 0x1565C0);
            P.solid(dx, dz + 0.3, 1.8, 1.9);
            P.pupil(dx, dz + 0.9);
        })));
        P.desk(-12, -7.5, 0x5D4037); P.shelf(-12.8, 4, 5, 1, 0x8D6E63);
        P.kit_boss(-12, -5.5, 'Head Teacher');
        P.plant(12.5, 8);
        return { stations: [[0, -7.0], [0, -2.4], [0, 2.4], [-11.4, 6.2]], extras: [{ kind: 'coffee', x: 12.5, z: 6.5 }],
                 walk: { n: 2, rect: { x0: -4, x1: 4, z0: 4, z1: 8 } } };
    },
    lab(P, job) {
        const { B } = P;
        buildWorkShell(P, { tagline: 'Research & discovery' }, 'Discovery Lab', '🔬', 0x6A1B9A, 0xD6E6F0, 0xEEF3F8);
        P.bench(-8, -6.2, 8); P.bench(2, -6.2, 8); P.bench(-2.5, -0.4, 10);
        P.shelf(12.5, -3, 6, 1, 0xB0BEC5); P.cooler(12.8, 4.2);
        B(2.4, 0.9, 1.3, 10, 0.45, 5.5, 0x37474F); B(2.4, 2.6, 0.6, 10, 2.2, 6.0, 0xCFD8DC); P.solid(10, 5.5, 2.5, 1.5);     // fume hood
        P.board(-5, -9.1, 7, ['H2O  CO2  O2', 'Sample A: pH 7', 'Result: ok!']);
        P.kit_boss(-12.5, 4, 'Dr. Lin');
        P.plant(-13, 8);
        return { stations: [[-8, -4.0], [2, -4.0], [-2.5, 1.6], [7, 5.4]], extras: [{ kind: 'coffee', x: 12.8, z: 5.0 }],
                 walk: { n: 3, rect: { x0: -12, x1: 4, z0: 3.5, z1: 8 } } };
    }
};

// ---------------------------------------------
// the campus
// ---------------------------------------------
function buildCampus(P, major) {
    const { B, g, solid } = P;
    B(160, 0.3, 160, 0, -0.35, 0, 0x4C9A3C);                                             // grass
    B(14, 0.14, 62, 0, -0.04, 6, 0xD8C9A6);                                              // the long path from the gate
    B(46, 0.14, 7, 0, -0.04, 12, 0xD8C9A6); B(46, 0.14, 7, 0, -0.04, 21, 0xD8C9A6);
    B(14, 0.1, 6, 0, -0.04, 25.5, 0x555555);                                             // the road at the gate
    // main gate
    B(1.2, 4.5, 1.2, -4.5, 2.25, 24, 0x8D6E63); B(1.2, 4.5, 1.2, 4.5, 2.25, 24, 0x8D6E63); B(10.2, 0.9, 1.0, 0, 4.4, 24, 0x8D6E63);
    const gate = makeNameplateSprite(['🎓 City University', 'Welcome, students!'], '#6A1B9A', 8, 1.7); gate.position.set(0, 6.4, 24); g.add(gate);
    solid(-4.5, 24, 1.4, 1.4); solid(4.5, 24, 1.4, 1.4);
    // fountain on the quad
    placeCyl(g, 2.6, 2.6, 0.5, 0, 0.25, 12, 0xB0BEC5, 24); placeCyl(g, 2.2, 2.2, 0.15, 0, 0.55, 12, 0x4FC3F7, 24); placeCyl(g, 0.35, 0.5, 1.6, 0, 1.2, 12, 0xCFD8DC, 10);
    solid(0, 12, 5.4, 5.4);
    // the lecture hall: x -14..14, z -20..-4, low front wall at z = -4 with a door gap (x -2..2)
    B(28.8, 0.2, 16.4, 0, -0.1, -12, 0xB9A58A);
    B(28.8, 5.5, 0.4, 0, 2.75, -20.2, 0xC9B79C); B(0.4, 5.5, 16.4, -14.4, 2.75, -12, 0xC9B79C); B(0.4, 5.5, 16.4, 14.4, 2.75, -12, 0xC9B79C);
    B(12.2, 1.3, 0.4, -8.1, 0.65, -3.9, 0xC9B79C); B(12.2, 1.3, 0.4, 8.1, 0.65, -3.9, 0xC9B79C);
    solid(-8.1, -3.9, 12.2, 0.6); solid(8.1, -3.9, 12.2, 0.6); solid(0, -20.4, 29, 0.6); solid(-14.5, -12, 0.6, 16.6); solid(14.5, -12, 0.6, 16.6);
    B(0.5, 3.6, 0.5, -2.2, 1.8, -3.9, 0x6A1B9A); B(0.5, 3.6, 0.5, 2.2, 1.8, -3.9, 0x6A1B9A); B(4.9, 0.6, 0.6, 0, 3.9, -3.9, 0x6A1B9A);
    const hallSign = makeNameplateSprite(['🏛️ Lecture Hall', major.emoji + ' ' + major.name], '#6A1B9A', 7.2, 1.7); hallSign.position.set(0, 7.0, -3.8); g.add(hallSign);
    // board + lectern
    P.board(0, -19.9, 12, ['Today: ' + major.name, major.emoji + ' Listen, then answer!', 'Pass = 3 of 4 right']);
    B(1.8, 1.1, 0.9, 0, 0.55, -17.2, 0x5D4037); solid(0, -17.2, 1.9, 1.0);
    // student desks: 4 rows of 4, with a gap in the aisle; your desk is in row 2
    const seats = [];
    for (let r = 0; r < 4; r++) [-9, -4.5, 4.5, 9].forEach((x, ci) => {
        const z = -14 + r * 2.6;
        B(2.6, 0.1, 1.0, x, 0.8, z, 0xD7A86E); B(0.1, 0.8, 0.9, x - 1.1, 0.4, z, 0x6D4C41); B(0.1, 0.8, 0.9, x + 1.1, 0.4, z, 0x6D4C41);
        B(0.8, 0.1, 0.8, x, 0.5, z + 1.1, 0x34495E);
        solid(x, z, 2.7, 1.1);
        seats.push({ x, z: z + 1.1, row: r, col: ci });
    });
    const mine = seats.find(s => s.row === 1 && s.col === 2);
    // the library (east side of the quad) and the cafeteria cart (west)
    B(12, 6, 8, 20, 3, 6, 0xA1887F); B(12.4, 0.8, 8.4, 20, 6.4, 6, 0x6D4C41); B(2.4, 3, 0.4, 20, 1.5, 10.1, 0x5D4037);
    for (let i = 0; i < 3; i++) B(1.6, 1.4, 0.2, 16.5 + i * 3.5, 3.3, 10.1, 0x9ED8F5);
    solid(20, 6, 12.4, 8.4);
    const libSign = makeNameplateSprite(['📚 Library', 'Study quietly'], '#5D4037', 5.4, 1.4); libSign.position.set(20, 8.4, 10.4); g.add(libSign);
    B(3.4, 1.0, 1.4, -18, 0.5, 12, 0xE67E22); B(3.8, 0.12, 1.8, -18, 1.1, 12, 0xFFF3E0);
    B(0.12, 2.6, 0.12, -19.6, 1.3, 11.4, 0x795548); B(0.12, 2.6, 0.12, -16.4, 1.3, 11.4, 0x795548); B(4.2, 0.3, 2.4, -18, 2.7, 11.6, 0xE53935);
    solid(-18, 12, 3.6, 1.6);
    const cafSign = makeNameplateSprite(['🍔 Cafeteria', 'Hot lunch $5'], '#E67E22', 4.2, 1.2); cafSign.position.set(-18, 4.3, 12); g.add(cafSign);
    // trees, benches, lamps
    [[-12, 20], [12, 20], [-22, 3], [-24, 12], [24, 18], [-24, 22], [24, -2], [-22, -6], [22, -10]].forEach(([x, z]) => P.tree(x, z));
    [[-8, 12], [8, 12], [-6, 18], [6, 18]].forEach(([x, z]) => { B(2.0, 0.15, 0.6, x, 0.5, z, 0x8D6E63); B(2.0, 0.6, 0.1, x, 0.9, z + 0.3, 0x8D6E63); solid(x, z, 2.1, 0.7); });
    [-5, 5].forEach(x => [8, 17].forEach(z => P.lamp(x, z)));
    return { seats, mine, extras: [
        { kind: 'library', x: 20, z: 11.4 },
        { kind: 'cafeteria', x: -18, z: 13.6 }
    ] };
}

function makeKitExtras(P) {
    const g = P.g;
    P.kit_boss = (x, z, title) => {                           // the boss / head of the place (stands still, has a name tag)
        const p = placePerson(g, x, z, 0x37474F, 0x888888, 1.0);
        const tag = makeNameplateSprite(['🧑‍💼 ' + title], '#37474F', 3.0, 0.7);
        tag.position.set(x, 2.7, z); g.add(tag);
        P.cols.push({ minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.45, maxZ: z + 0.45 });
        return p;
    };
    P.pupil = (x, z) => { placePerson(g, x, z - 0.1, PLACE_SHIRTS[Math.floor(Math.abs(x * 7 + z * 3)) % 8], PLACE_HAIR[Math.floor(Math.abs(x + z)) % 6], 0.7); };
}

// What the little extras sell
const PLACE_EXTRAS = {
    vending: { emoji: '🥤', title: 'Vending machine', say: 'A snack machine hums by the wall.', options: [{ label: '🍫 Chocolate bar', cost: 2, full: 8, hap: 2 }, { label: '🥪 Sandwich', cost: 4, full: 20, hap: 2 }, { label: '🥤 Cold drink', cost: 2, full: 5, hap: 2 }] },
    coffee:  { emoji: '☕', title: 'Coffee machine', say: 'A coffee machine and a plate of biscuits.', options: [{ label: '☕ Coffee', cost: 1, full: 3, hap: 3 }, { label: '🍪 Biscuits', cost: 2, full: 8, hap: 2 }] },
    snack:   { emoji: '🍽️', title: 'Staff meal', say: 'The kitchen has staff meals for a few dollars.', options: [{ label: '🍝 Staff pasta', cost: 3, full: 28, hap: 3 }, { label: '🥗 Side salad', cost: 2, full: 10, hap: 1 }] },
    cafeteria: { emoji: '🍔', title: 'Campus cafeteria', say: 'Hot lunch for students!', options: [{ label: '🍛 Hot lunch', cost: 5, full: 34, hap: 4 }, { label: '🥪 Sandwich', cost: 3, full: 18, hap: 2 }, { label: '🧃 Juice', cost: 2, full: 5, hap: 2 }] },
    library: { emoji: '📚', title: 'University library', say: 'Quiet shelves full of books. Study once a day for extra marks.', study: true, options: [{ label: '📖 Study for a while', cost: 0, full: 0, hap: 0, edu: 1 }] }
};

// ---------------------------------------------
// opening / closing a place
// ---------------------------------------------
function enterPlaceScene(kind, build) {
    if (place3D || !scene || !playerMesh) return false;
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj !== playerMesh && obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') { stash.push(obj); scene.remove(obj); }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0;
    const savedBg = scene.background;
    const saved = { pos: playerMesh.position.clone(), rotY: playerMesh.rotation.y };
    scene.background = new THREE.Color(isSnowing() ? 0xcfdcea : 0x9ccfee);

    const root = new THREE.Group();
    scene.add(root);
    const cols = [];
    const P = makePlaceKit(root, cols);
    P.g = root; P.cols = cols;
    makeKitExtras(P);
    const info = build(P);

    // you
    const youMarker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 28), new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; youMarker.add(ring);
    const tag = makeNameplateSprite(['⭐ You'], '#d4a017', 2.2, 0.6); tag.position.set(0, 2.8, 0); youMarker.add(tag);
    const ms = 1 / playerMesh.scale.x; youMarker.scale.set(ms, ms, ms);
    playerMesh.add(youMarker);
    const sky = new THREE.HemisphereLight(0xffffff, 0x998877, 0.6);
    scene.add(sky);

    place3D = Object.assign({ kind, stash, clickables, savedBg, saved, root, sky, cols, youMarker, last: Date.now(), start: Date.now(),
                              walkers: [], busy: false, extraAt: 0, openExtra: null, stationIndex: 0 }, info);
    return true;
}

function leavePlace(done) {
    const pl = place3D;
    if (!pl) { if (done) done(); return; }
    place3D = null;
    closeLifePanel(); removePlaceHud(); closePlaceExtra();
    playerMesh.remove(pl.youMarker); disposeTree(pl.youMarker);
    [pl.root, pl.sky].forEach(o => { scene.remove(o); disposeTree(o); });
    scene.background = pl.savedBg;
    pl.stash.forEach(o => scene.add(o));
    clickableNPCs.length = 0;
    pl.clickables.forEach(c => clickableNPCs.push(c));
    playerMesh.position.copy(pl.saved.pos);
    playerMesh.rotation.y = pl.saved.rotY;
    if (done) done();
}

function removePlaceHud() { const el = document.getElementById('place-hud'); if (el) el.remove(); }

function showPlaceHud(text, sub) {
    let el = document.getElementById('place-hud');
    if (!el) {
        el = document.createElement('div');
        el.id = 'place-hud';
        el.style.cssText = 'position:fixed; top:56px; left:50%; transform:translateX(-50%); z-index:150; background:rgba(22,33,62,0.9); color:#fff; border:2px solid #f39c12; border-radius:12px; padding:8px 18px; font-family:Arial; text-align:center; pointer-events:none; max-width:92vw;';
        document.body.appendChild(el);
    }
    el.innerHTML = `<div style="font-size:1.05em; font-weight:bold;">${text}</div>${sub ? `<div style="font-size:0.85em; color:#cdd;">${sub}</div>` : ''}`;
}

// ---------------------------------------------
// a question panel docked at the bottom, so you can still see the place (life.js uses this)
// ---------------------------------------------
function lifePanel(html, border) {
    closeLifePanel();
    const el = document.createElement('div');
    el.id = 'life-panel';
    el.style.cssText = `position:fixed; left:50%; bottom:90px; transform:translateX(-50%); z-index:300; width:min(640px, 94vw); max-height:60vh; overflow-y:auto; background:#16213e; border:3px solid ${border || '#3498db'}; border-radius:16px; padding:14px 22px; font-family:Arial; box-shadow:0 6px 30px rgba(0,0,0,0.6);`;
    el.innerHTML = html;
    document.body.appendChild(el);
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => { if (typeof keys !== 'undefined') keys[k] = false; });
}
function closeLifePanel() { const el = document.getElementById('life-panel'); if (el) el.remove(); }

// ---------------------------------------------
// markers on the floor: the 4 task pads
// ---------------------------------------------
function addStationPads(P, stations, color) {
    const pads = stations.map(([x, z], i) => {
        const g = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.85 }));
        disc.position.y = 0.06; g.add(disc);
        const num = makeNameplateSprite([String(i + 1)], '#34495e', 0.9, 0.9); num.position.y = 0.9; g.add(num);
        const arrow = makeEmojiSprite('⬇️', 1.4); arrow.position.y = 2.3; arrow.visible = false; g.add(arrow);
        g.position.set(x, 0, z);
        P.g.add(g);
        return { g, disc, arrow, x, z };
    });
    return pads;
}

function refreshPads(pl) {
    const cur = pl.stationIndex;
    pl.pads.forEach((p, i) => {
        p.disc.material.color.setHex(i < cur ? 0x2ecc71 : i === cur ? 0xFFD700 : 0x888888);
        p.arrow.visible = i === cur;
    });
}

// ---------------------------------------------
// movement + the frame loop (animate() in world.js calls updatePlace)
// ---------------------------------------------
function resolvePlaceCollisions(pos, radius, list, b) {
    list.forEach(r => {
        const minX = r.minX - radius, maxX = r.maxX + radius, minZ = r.minZ - radius, maxZ = r.maxZ + radius;
        if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
            const l = pos.x - minX, rr = maxX - pos.x, u = pos.z - minZ, d = maxZ - pos.z, m = Math.min(l, rr, u, d);
            if (m === l) pos.x = minX; else if (m === rr) pos.x = maxX; else if (m === u) pos.z = minZ; else pos.z = maxZ;
        }
    });
    pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x));
    pos.z = Math.max(b.minZ, Math.min(b.maxZ, pos.z));
}

function updatePlace() {
    const pl = place3D;
    if (!pl) return;
    const now = Date.now();
    const dt = Math.min(0.05, (now - pl.last) / 1000);
    pl.last = now;
    const t = (now - pl.start) / 1000;
    const p = playerMesh.position;
    const busy = pl.busy || pl.openExtra;

    if (!busy) {
        let dx = 0, dz = 0;
        { const mv = getMoveInput(); dx = mv.x; dz = mv.z; }
        if (dx || dz) {
            const len = Math.hypot(dx, dz);
            p.x += dx / len * PLACE_SPEED * dt; p.z += dz / len * PLACE_SPEED * dt;
            playerMesh.rotation.y = Math.atan2(dx, dz);
            resolvePlaceCollisions(p, 0.45, pl.cols, pl.bounds);
        }
    }
    p.y = player.age <= 4 ? 0.9 : 0;

    // walkers stroll between random spots
    pl.walkers.forEach(w => {
        const g = w.g;
        if (w.wait > 0) { w.wait -= dt; return; }
        const ddx = w.tx - g.position.x, ddz = w.tz - g.position.z, dist = Math.hypot(ddx, ddz);
        if (dist < 0.2) {
            w.tx = w.rect.x0 + Math.random() * (w.rect.x1 - w.rect.x0); w.tz = w.rect.z0 + Math.random() * (w.rect.z1 - w.rect.z0);
            w.wait = 0.5 + Math.random() * 2.5;
        } else {
            g.position.x += ddx / dist * w.speed * dt; g.position.z += ddz / dist * w.speed * dt;
            g.rotation.y = Math.atan2(ddx, ddz);
            g.position.y = Math.abs(Math.sin(t * 7 + w.speed * 3)) * 0.04;
        }
    });

    if (!busy) {
        // the glowing pad you have to reach next
        if (pl.pads && pl.stationIndex < pl.pads.length) {
            const cur = pl.pads[pl.stationIndex];
            cur.arrow.position.y = 2.3 + Math.sin(t * 4) * 0.3;
            if (Math.hypot(p.x - cur.x, p.z - cur.z) < 1.2 && typeof onPlaceStation === 'function') {
                pl.busy = true;
                onPlaceStation(pl.stationIndex);
            }
        } else if (pl.seat) {
            const s = pl.seat;
            s.arrow.position.y = 2.3 + Math.sin(t * 4) * 0.3;
            if (!pl.seated && Math.hypot(p.x - s.x, p.z - s.z) < 1.1 && typeof onPlaceSeat === 'function') {
                pl.busy = true; pl.seated = true;
                p.x = s.x; p.z = s.z - 0.1; playerMesh.rotation.y = Math.PI;
                onPlaceSeat();
            }
        }
        // little extras (vending machine, coffee, cafeteria, library): walk up to them
        if (now > pl.extraAt && pl.extras) {
            const ex = pl.extras.find(e => Math.hypot(p.x - e.x, p.z - e.z) < 1.9);
            if (ex) openPlaceExtra(ex);
        }
    }

    // the camera follows you from above
    const b = pl.bounds;
    const cx = Math.max(b.minX + 6, Math.min(b.maxX - 6, p.x)), cz = Math.max(b.minZ + 4, Math.min(b.maxZ - 6, p.z));
    camera.position.x += (cx - camera.position.x) * 0.12;
    camera.position.y += (20 - camera.position.y) * 0.12;
    camera.position.z += (cz + 13 - camera.position.z) * 0.12;
    camera.lookAt(camera.position.x, 0, camera.position.z - 12);
    renderer.render(scene, camera);
}

// ---------------------------------------------
// the little extras
// ---------------------------------------------
function openPlaceExtra(ex) {
    const pl = place3D;
    if (!pl || pl.openExtra) return;
    const def = PLACE_EXTRAS[ex.kind];
    if (!def) return;
    pl.openExtra = ex;
    const studied = def.study && player.lastStudyDay === lifeDay();
    lifePanel(`
        <div style="text-align:center;">
            <h3 style="color:#FFD700; margin-bottom:4px;">${def.emoji} ${def.title}</h3>
            <p style="color:#bbb; margin-bottom:8px;">${def.say} <span style="color:#9ab;">You have $${player.money}. 🍽️ Fullness ${player.fullness}/100</span></p>
            ${def.options.map((o, i) => lifeBtn(`buyPlaceExtra(${i})`, `${o.label}${o.cost ? ' — $' + o.cost : ' — free'}`, studied ? '#555' : '#27ae60')).join('')}
            ${lifeBtn('closePlaceExtra()', 'No thanks', '#555')}
        </div>`, '#27ae60');
}

function buyPlaceExtra(i) {
    const pl = place3D;
    if (!pl || !pl.openExtra) return;
    const def = PLACE_EXTRAS[pl.openExtra.kind], o = def.options[i];
    if (def.study) {
        if (player.lastStudyDay === lifeDay()) { showEvent('📚', 'You already studied today — your head is full!'); return; }
        player.lastStudyDay = lifeDay();
        player.education = Math.min(100, player.education + (o.edu || 1));
        showEvent('📚', `You studied in the library! +${o.edu || 1} education`);
    } else {
        if (player.money < o.cost) { showEvent('💸', `You don't have $${o.cost}!`); return; }
        if (player.fullness >= 95) { showEvent('🤢', "You're way too full to eat anything else!"); return; }
        player.money -= o.cost;
        gainFullness(o.full, true);
        player.happiness = Math.min(100, player.happiness + (o.hap || 0));
        showEvent(def.emoji, `You had ${o.label}. 🍽️ Fullness +${o.full}`);
    }
    updateStats(); saveGame();
    closePlaceExtra();
}

function closePlaceExtra() {
    const pl = place3D;
    if (pl) { pl.openExtra = null; pl.extraAt = Date.now() + 8000; }
    if (!pl || !pl.busy) closeLifePanel();
}

// ---------------------------------------------
// 💼 opening a workplace (called after the car ride, from life.js goToWork)
// ---------------------------------------------
function openWorkplace() {
    const j = player.job ? jobById(player.job.id) : null;
    if (!j) { inWork = false; return; }
    const themeName = JOB_THEME[j.id] || 'office';
    const ok = enterPlaceScene('work', P => {
        const th = WORK_THEMES[themeName](P, j.id);
        const pads = addStationPads(P, th.stations, 0xFFD700);
        return Object.assign({ pads, bounds: PLACE_BOUNDS_WORK, theme: themeName, job: j }, th);
    });
    if (!ok) { inWork = false; return; }
    const pl = place3D;
    // coworkers
    if (pl.walk) addWalkers(pl, pl.root, pl.walk.n, pl.walk.rect, null, 0.9);
    playerMesh.position.set(3.5, player.age <= 4 ? 0.9 : 0, 13.5);
    playerMesh.rotation.y = Math.PI;
    camera.position.set(3.5, 20, 26); camera.lookAt(3.5, 0, 14);
    const mycar = buildCarModel(isSnowing()).car;                       // the car you drove in
    mycar.position.set(9, 0, 16); mycar.rotation.y = Math.PI / 2;
    pl.root.add(mycar);
    refreshPads(pl);
    document.getElementById('location-name').textContent = `${j.emoji} ${j.name}`;
    updateActionPanel();
    startShift();                                   // life.js
    updateWorkHud();
    showEvent(j.emoji, `You arrive at work! Walk into the building and follow the glowing pads. Press the arrow keys / WASD.`);
}

function updateWorkHud() {
    const pl = place3D;
    if (!pl || !shift) return;
    const tasks = JOB_TASKS[shift.job.id] || ['Do the task', 'Do the task', 'Do the task', 'Do the task'];
    const i = Math.min(3, shift.i);
    showPlaceHud(`${shift.job.emoji} ${jobTitle()} — task ${Math.min(4, shift.i + 1)} of 4: ${tasks[i]}`, `Walk to the glowing pad ⬇️ · ✅ ${shift.correct} right so far`);
}

// you reached a pad
function onPlaceStation(i) {
    const pl = place3D;
    if (!pl || !shift) return;
    if (pl.kind === 'work') nextWorkQuestion();
}

// ---------------------------------------------
// 🎓 opening the campus (called after the car ride, from life.js goToUniversity)
// ---------------------------------------------
function openCampus() {
    if (!player.uni) { inUni = false; return; }
    const m = majorById(player.uni.major);
    const ok = enterPlaceScene('uni', P => {
        const c = buildCampus(P, m);
        const seatPad = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 24), new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.9 }));
        disc.position.y = 0.06; seatPad.add(disc);
        const arrow = makeEmojiSprite('⬇️', 1.4); arrow.position.y = 2.3; seatPad.add(arrow);
        const lbl = makeNameplateSprite(['🪑 Your desk'], '#d4a017', 2.6, 0.7); lbl.position.y = 3.3; seatPad.add(lbl);
        seatPad.position.set(c.mine.x, 0, c.mine.z);
        P.g.add(seatPad);
        // students sitting at the other desks (everyone but you)
        c.seats.forEach(s => {
            if (s === c.mine || Math.random() < 0.25) return;
            const p = placePerson(P.g, s.x, s.z + 0.15, PLACE_SHIRTS[(s.row * 3 + s.col) % 8], PLACE_HAIR[(s.row + s.col * 2) % 6], 0.85);
            p.rotation.y = Math.PI;
        });
        // the professor at the board
        const prof = placePerson(P.g, 0, -18.6, 0x4A148C, 0xBDBDBD, 1.0);
        const ptag = makeNameplateSprite(['🧑‍🏫 Professor'], '#4A148C', 3.0, 0.7); ptag.position.set(0, 2.7, -18.6); P.g.add(ptag);
        return { bounds: PLACE_BOUNDS_UNI, seat: { x: c.mine.x, z: c.mine.z, arrow, disc }, extras: c.extras, major: m, seated: false, prof };
    });
    if (!ok) { inUni = false; return; }
    const pl = place3D;
    addWalkers(pl, pl.root, 7, { x0: -20, x1: 20, z0: 8, z1: 22 }, null, 0.9);          // students on the quad
    playerMesh.position.set(0, player.age <= 4 ? 0.9 : 0, 22);
    playerMesh.rotation.y = Math.PI;
    camera.position.set(0, 20, 35); camera.lookAt(0, 0, 23);
    document.getElementById('location-name').textContent = '🎓 University';
    updateActionPanel();
    showPlaceHud(`${m.emoji} ${m.name} — Year ${player.uni.year}, lecture ${player.uni.credits + 1} of ${LECTURES_PER_YEAR}`, 'Walk to the 🏛️ Lecture Hall (north) and sit at your glowing desk · the 📚 library and 🍔 cafeteria are on the quad');
    showEvent('🎓', 'Welcome to campus! Walk north to the Lecture Hall and sit at your glowing desk.');
}

function onPlaceSeat() {
    if (place3D && place3D.kind === 'uni') beginLecture();            // life.js
}

// Clears everything (a new life, or the game was restarted)
function resetPlaces() {
    const pl = place3D;
    place3D = null;
    closeLifePanel(); removePlaceHud(); closePlaceExtra();
    if (pl && pl.youMarker && playerMesh) { playerMesh.remove(pl.youMarker); }
}
