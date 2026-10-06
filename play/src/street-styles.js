// =============================================
// STREET STYLES — every city has its OWN kind of street (and the grocery chains live here too).
//
//   suburb    green lawns, cottages, mailboxes           (the original look)
//   downtown  grey pavement, brick apartment blocks with shops, awnings, lamps, crosswalk, bus stop
//   seaside   sand + a strip of blue sea, palms, bungalows on stilts, beach umbrellas, boardwalk
//   village   stone cottages with thatch/tile roofs, picket fences, hay bales, a well, a dirt road
//   hills     colourful terraced row houses with stairs and flower pots, a church tower on the hillside
//   desert    adobe + cacti, dusty road, mesas, a water tower
//
// streetStyleFor(city) picks one from the city's name (always the same one, and the game's own cities
// get different styles). Houses get a KIND per style (cottage, row house, apartment, bungalow...), all
// built from boxes/cones inside the same 7 x 5.6 footprint the original house used, with the front door
// at local z = +2.86 (houses are built facing +z; the south side is turned around).
//
// Used by neighborhood-data.js (assignHouseLook) and neighborhood.js (buildStreetBase, ssBuildHouse,
// decorateStreet). Nothing here is saved. Plain global functions (no modules).
//
// Also: STORE_CHAINS + currentStoreChain() — the grocery chains (store.js / store-realism.js / mall.js).
// =============================================

const STREET_STYLE_IDS = ['suburb', 'downtown', 'seaside', 'village', 'hills', 'desert'];

const STREET_STYLES = {
    suburb: {
        id: 'suburb', emoji: '🌳', name: 'Suburb',
        sky: 0x87ceeb, skySnow: 0xcfdcea, ground: 0x5DBB4A, groundSnow: 0xEAF2F8,
        road: 0x3b3b3b, lane: 'dash', laneColor: 0xF1C40F, sidewalk: 0xC8C8C8,
        trunk: 0x6D4C41, leaf: 0x2E8B3C, leaf2: 0x38A04A, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['oak'], walls: null, roofs: null, kinds: ['classic', 'classic', 'twostorey', 'classic', 'modern'],
        lamp: 'classic', doors: [0x6D4C41]
    },
    downtown: {
        id: 'downtown', emoji: '🏙️', name: 'Downtown',
        sky: 0xA9C4D8, skySnow: 0xcfdcea, ground: 0x8E9196, groundSnow: 0xDDE3E8,
        road: 0x2F3033, lane: 'white', laneColor: 0xFFFFFF, sidewalk: 0xB9B9B9,
        trunk: 0x5D4037, leaf: 0x3F9B4B, leaf2: 0x56B35F, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['poplar'],
        walls: [0xA65E44, 0x8E4B3A, 0xB5B0A8, 0x7D8791, 0xC98B5B, 0x6D7B8A, 0xD8C3A5, 0x9A6A52],
        roofs: [0x4A4A4A, 0x5D6D7E, 0x3E3E3E, 0x6B4A3A],
        kinds: ['apartment', 'shopblock', 'apartment', 'glassblock', 'rowhouse', 'shopblock'],
        lamp: 'modern', doors: [0x2C3E50, 0x7B241C, 0x1B4F72, 0x145A32], awnings: [0xC0392B, 0x1E8449, 0x2471A3, 0xD68910, 0x884EA0]
    },
    seaside: {
        id: 'seaside', emoji: '🏖️', name: 'Seaside',
        sky: 0x7FD6F5, skySnow: 0xcfdcea, ground: 0xF0DDA8, groundSnow: 0xF4F1E8,
        road: 0x555B61, lane: 'white', laneColor: 0xFFFFFF, sidewalk: 0xC9A66B,
        trunk: 0x8D6E63, leaf: 0x2E9E4F, leaf2: 0x43B864, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['palm'],
        walls: [0xFFFFFF, 0xFFE0B2, 0xB3E5FC, 0xF8BBD0, 0xC8E6C9, 0xFFF59D, 0xFFCCBC, 0xB2DFDB],
        roofs: [0x00ACC1, 0xE57373, 0x5C6BC0, 0xFFB74D, 0x26A69A],
        kinds: ['bungalow', 'villa', 'shack', 'bungalow', 'villa'],
        lamp: 'tiki', doors: [0x00838F, 0xE64A19, 0x6A1B9A, 0x1565C0]
    },
    village: {
        id: 'village', emoji: '🏡', name: 'Village',
        sky: 0xA6D8F0, skySnow: 0xcfdcea, ground: 0x6FA84E, groundSnow: 0xEAF2F8,
        road: 0x8B6B4A, lane: 'none', laneColor: 0x6F5439, sidewalk: 0xA89F8D,
        trunk: 0x5D4037, leaf: 0x2F7D3A, leaf2: 0x3E9449, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['oak', 'pine', 'oak'],
        walls: [0xBDB5A6, 0xA9A292, 0xC9BFA9, 0xD8CDB4, 0x9E9786, 0xE6DCC3],
        roofs: [0xC9A24D, 0x8D5A3B, 0xA0522D, 0x6B4A32, 0xB5651D],
        kinds: ['stone', 'timber', 'stone', 'stone', 'timber'],
        lamp: 'lantern', doors: [0x5D4037, 0x3E5C2E, 0x7B3F2A]
    },
    hills: {
        id: 'hills', emoji: '⛰️', name: 'Hillside',
        sky: 0x9BDBF5, skySnow: 0xcfdcea, ground: 0x78B857, groundSnow: 0xEAF2F8,
        road: 0x6C625A, lane: 'dash', laneColor: 0xF5E6B3, sidewalk: 0xD2C4A8,
        trunk: 0x6D4C41, leaf: 0x2E7D32, leaf2: 0x43A047, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['pine', 'oak', 'poplar'],
        walls: [0xF4A6A0, 0xF7D46B, 0x8EC9E8, 0xA8D8A0, 0xE8A0C8, 0xF5B97A, 0xB7A4E0, 0x7FD1C5],
        roofs: [0xB5523A, 0x8C4A32, 0x6B5B95, 0xC0672F],
        kinds: ['terrace', 'terrace', 'terrace', 'rowhouse'],
        lamp: 'wrought', doors: [0x5D4037, 0x1565C0, 0x2E7D32, 0xB71C1C]
    },
    desert: {
        id: 'desert', emoji: '🌵', name: 'Desert Town',
        sky: 0xA8D8F0, skySnow: 0xdcdfe6, ground: 0xE2C58D, groundSnow: 0xF1ECDD,
        road: 0xA88F63, lane: 'dash', laneColor: 0xE8D8A8, sidewalk: 0xD9BF8A,
        trunk: 0x8D6E63, leaf: 0x3C8D40, leaf2: 0x4FA352, leafSnow: 0xDCE9DF, leafSnow2: 0xF4F8FB,
        treeKinds: ['cactus', 'cactus', 'bush'],
        walls: [0xD9A66B, 0xE3B982, 0xCF9863, 0xEAC896, 0xC98A5A, 0xF0D2A0],
        roofs: [0xA0522D, 0xB5651D, 0x8B4513, 0xC26B3A],
        kinds: ['adobe', 'adobe', 'hacienda'],
        lamp: 'lantern', doors: [0x3AA8C1, 0x2E8B8B, 0xC0392B]
    }
};

// ---------------------------------------------
// Picking a style (deterministic) + names
// ---------------------------------------------
const _ssCache = {};

// The game's own cities are handed out one by one (a hash with "next free" probing), so they always end up
// with DIFFERENT styles. Any other city name just uses its hash.
function streetStyleFor(city) {
    if (_ssCache[city]) return _ssCache[city];
    const N = STREET_STYLE_IDS.length;
    const names = (typeof CITY_DATA !== 'undefined') ? CITY_DATA.map(c => c.city) : [];
    let idx = -1;
    if (names.indexOf(city) >= 0 && names.length <= N) {
        const taken = {};
        names.forEach(n => {
            let i = seedFromText('street|' + n) % N;
            while (taken[i]) i = (i + 1) % N;
            taken[i] = true;
            if (n === city) idx = i;
        });
    }
    if (idx < 0) idx = seedFromText('street|' + city) % N;
    return (_ssCache[city] = STREET_STYLES[STREET_STYLE_IDS[idx]]);
}

function streetStyleById(id) {
    return STREET_STYLES[id] || STREET_STYLES.suburb;
}

// "Maple Grove Lane", "Main Street", "Ocean Drive", "Old Mill Road", "Hillside Terrace", "Cactus Canyon Road"
function streetNameFor(city) {
    const st = streetStyleFor(city);
    switch (st.id) {
        case 'downtown': return 'Main Street';
        case 'seaside': return 'Ocean Drive';
        case 'village': return 'Old Mill Road';
        case 'hills': return 'Hillside Terrace';
        case 'desert': return 'Cactus Canyon Road';
        default: return `${city} Lane`;
    }
}

// "🌳 Maple Grove Lane" — used in the location name, welcome and HUD texts
function streetLabel(city) {
    return `${streetStyleFor(city).emoji} ${streetNameFor(city)}`;
}

// Gives a house its KIND (and, for styles with their own palette, wall/roof colours).
// Uses its own rng, so the families and people of a street never change.
function assignHouseLook(style, h, rng) {
    const kind = style.kinds[Math.floor(rng() * style.kinds.length)];
    h.kind = kind;
    if (style.walls) h.wall = style.walls[Math.floor(rng() * style.walls.length)];
    if (style.roofs) h.roof = style.roofs[Math.floor(rng() * style.roofs.length)];
    h.door = style.doors[Math.floor(rng() * style.doors.length)];
    if (SS_NO_GARAGE[kind]) h.garage = false;
    h.style = style.id;
}
const SS_NO_GARAGE = { apartment: 1, glassblock: 1, shopblock: 1, rowhouse: 1, terrace: 1, bungalow: 1, shack: 1 };

// ---------------------------------------------
// A tiny mesh builder: everything goes through put(mesh)
// ---------------------------------------------
function ssBuilder(put) {
    const mat = c => new THREE.MeshLambertMaterial({ color: c });
    const place = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; put(m); return m; };
    return {
        box: (w, h, d, x, y, z, c) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)), x, y, z),
        cyl: (rt, rb, h, x, y, z, c, seg) => place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 8), mat(c)), x, y, z),
        cone: (r, h, x, y, z, c, seg) => place(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 8), mat(c)), x, y, z),
        sph: (r, x, y, z, c) => place(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(c)), x, y, z),
        glow: (w, h, d, x, y, z, c) => place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })), x, y, z)
    };
}

// ---------------------------------------------
// TREES (b = builder, x/z = where, sc = size, small = the little front-yard version of the oak)
// ---------------------------------------------
function ssTree(b, kind, st, snowy, x, z, small) {
    const leaf = snowy ? st.leafSnow : st.leaf, leaf2 = snowy ? st.leafSnow2 : st.leaf2;
    const k = small ? 0.62 : 1;
    switch (kind) {
        case 'pine':
            b.box(0.4 * k, 1.4 * k, 0.4 * k, x, 0.7 * k, z, st.trunk);
            b.cone(1.7 * k, 2.2 * k, x, 2.4 * k, z, leaf, 7);
            b.cone(1.35 * k, 2.0 * k, x, 3.7 * k, z, leaf2, 7);
            b.cone(0.9 * k, 1.8 * k, x, 4.9 * k, z, leaf, 7);
            break;
        case 'palm': {
            const tc = st.trunk;
            b.box(0.45 * k, 1.6 * k, 0.45 * k, x, 0.8 * k, z, tc);
            b.box(0.4 * k, 1.6 * k, 0.4 * k, x + 0.15 * k, 2.4 * k, z, 0x9E7B66);
            b.box(0.36 * k, 1.5 * k, 0.36 * k, x + 0.3 * k, 3.95 * k, z, tc);
            const tx = x + 0.3 * k, ty = 4.8 * k;
            [-1, 1].forEach(sg => {
                b.box(2.4 * k, 0.1, 0.7 * k, tx + sg * 1.0 * k, ty, z, leaf).rotation.z = -sg * 0.45;
                b.box(0.7 * k, 0.1, 2.4 * k, tx, ty, z + sg * 1.0 * k, leaf2).rotation.x = sg * 0.45;
            });
            b.sph(0.45 * k, tx, ty + 0.1, z, leaf2);
            b.sph(0.18 * k, tx + 0.25 * k, ty - 0.3, z + 0.2 * k, 0x6D4C41);
            b.sph(0.18 * k, tx - 0.2 * k, ty - 0.3, z - 0.2 * k, 0x6D4C41);
            break;
        }
        case 'cactus': {
            const c = snowy ? 0x6FAF7A : 0x3C8D40;
            b.cyl(0.38 * k, 0.42 * k, 2.6 * k, x, 1.3 * k, z, c, 8);
            b.box(0.95 * k, 0.28 * k, 0.28 * k, x - 0.6 * k, 1.5 * k, z, c);
            b.box(0.28 * k, 0.9 * k, 0.28 * k, x - 1.05 * k, 1.95 * k, z, c);
            b.box(0.95 * k, 0.28 * k, 0.28 * k, x + 0.6 * k, 1.1 * k, z, c);
            b.box(0.28 * k, 0.8 * k, 0.28 * k, x + 1.05 * k, 1.5 * k, z, c);
            if (snowy) b.box(0.6 * k, 0.15, 0.6 * k, x, 2.65 * k, z, 0xF4F8FB);
            else b.sph(0.12 * k, x, 2.7 * k, z, 0xE91E63);
            break;
        }
        case 'bush':
            b.sph(0.8 * k, x, 0.6 * k, z, snowy ? 0xCFE0D2 : 0x7A9B4E);
            b.sph(0.6 * k, x + 0.7 * k, 0.45 * k, z + 0.2 * k, snowy ? 0xE6EEE8 : 0x8FAE5A);
            break;
        case 'poplar':
            b.box(0.5 * k, 1.6 * k, 0.5 * k, x, 0.8 * k, z, st.trunk);
            b.box(1.5 * k, 3.6 * k, 1.5 * k, x, 3.4 * k, z, leaf);
            b.box(1.0 * k, 1.8 * k, 1.0 * k, x, 5.9 * k, z, leaf2);
            break;
        default:   // 'oak' — exactly the original tree
            if (small) {
                b.box(0.5, 1.8, 0.5, x, 0.9, z, st.trunk);
                b.box(2.2, 2.0, 2.2, x, 2.7, z, leaf);
                b.box(1.4, 1.2, 1.4, x, 4.0, z, leaf2);
            } else {
                b.box(0.7, 3.6, 0.7, x, 1.8, z, st.trunk);
                b.box(3.4, 3.0, 3.4, x, 4.8, z, leaf);
                b.box(2.2, 1.8, 2.2, x, 6.8, z, leaf2);
            }
    }
}

// ---------------------------------------------
// STREET FURNITURE
// ---------------------------------------------
function ssLamp(b, kind, x, z, snowy) {
    switch (kind) {
        case 'tiki':
            b.cyl(0.08, 0.11, 2.5, x, 1.25, z, 0x6D4C41, 6);
            b.cyl(0.2, 0.14, 0.3, x, 2.6, z, 0x4E342E, 6);
            b.glow(0.2, 0.22, 0.2, x, 2.85, z, 0xFFB74D);
            break;
        case 'lantern':
            b.box(0.14, 2.6, 0.14, x, 1.3, z, 0x5D4037);
            b.box(0.7, 0.08, 0.08, x + 0.3, 2.5, z, 0x5D4037);
            b.box(0.3, 0.4, 0.3, x + 0.62, 2.28, z, 0x3E2723);
            b.glow(0.2, 0.28, 0.2, x + 0.62, 2.28, z, 0xFFD54F);
            break;
        case 'wrought':
            b.cyl(0.06, 0.1, 3.0, x, 1.5, z, 0x263238, 6);
            b.box(0.4, 0.4, 0.4, x, 3.2, z, 0x263238);
            b.glow(0.26, 0.3, 0.26, x, 3.2, z, 0xFFF3B0);
            b.box(0.5, 0.08, 0.5, x, 3.5, z, 0x263238);
            break;
        case 'modern':
            b.cyl(0.07, 0.09, 3.6, x, 1.8, z, 0x546E7A, 6);
            b.box(1.1, 0.1, 0.18, x + 0.4, 3.65, z, 0x546E7A);
            b.glow(0.5, 0.08, 0.2, x + 0.75, 3.58, z, 0xFFF9C4);
            break;
        default:
            b.cyl(0.07, 0.09, 3.2, x, 1.6, z, 0x4A4A4A, 6);
            b.glow(0.34, 0.34, 0.34, x, 3.3, z, 0xFFF3B0);
    }
}

function ssBench(b, x, z, rot) {   // rot: which way the seat faces (0 = +z)
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rot || 0;
    const gb = ssBuilder(m => { g.add(m); });
    gb.box(1.6, 0.12, 0.5, 0, 0.5, 0, 0x8B5A2B);
    gb.box(1.6, 0.5, 0.1, 0, 0.85, -0.22, 0x8B5A2B);
    gb.box(0.1, 0.5, 0.45, -0.7, 0.25, 0, 0x37474F);
    gb.box(0.1, 0.5, 0.45, 0.7, 0.25, 0, 0x37474F);
    return g;
}

function ssHydrant(b, x, z) {
    b.cyl(0.16, 0.2, 0.7, x, 0.35, z, 0xC62828, 8);
    b.sph(0.17, x, 0.75, z, 0xC62828);
    b.box(0.4, 0.1, 0.1, x, 0.5, z, 0xB71C1C);
}

function ssParkedCar(c, x, z, dir) {      // along the curb; keeps clear of the sidewalk (z=4.2..5.1) the street games use
    if (typeof buildCarModel !== 'function') return;
    const { car } = buildCarModel(c.snowy);
    car.scale.setScalar(0.85);
    car.position.set(x, 0, z);
    car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    c.add(car);
    c.colliders.push({ minX: x - 1.95, maxX: x + 1.95, minZ: z - 1.0, maxZ: z + 1.0 });
}

// ---------------------------------------------
// GROUND, ROAD, SIDEWALKS and the trees along the back (called instead of the old section 2)
// c = { box, add, snowy }
// ---------------------------------------------
function buildStreetBase(st, c) {
    const box = c.box, snowy = c.snowy;
    const b = ssBuilder(c.add);
    box(70, 0.2, 48, 0, -0.1, 0, snowy ? st.groundSnow : st.ground);
    box(60, 0.14, 8.2, 0, 0.0, 0, st.road);
    if (st.lane === 'dash' || st.lane === 'white') for (let x = -28; x <= 28; x += 4) box(2, 0.02, 0.22, x, 0.08, 0, st.laneColor);
    if (st.lane === 'none') {                                               // dirt road: wheel ruts and a few stones
        [-1.3, 1.3].forEach(z => box(60, 0.02, 0.5, 0, 0.08, z, st.laneColor));
        for (let x = -27; x <= 27; x += 5.5) box(0.5, 0.05, 0.4, x, 0.09, (x * 3) % 3.2 - 1.6, 0x7D7D7D);
    }
    if (st.id === 'downtown' || st.id === 'hills') {                        // road edges
        [-3.9, 3.9].forEach(z => box(60, 0.02, 0.12, 0, 0.08, z, 0xFFFFFF));
    }
    [-4.7, 4.7].forEach(z => box(60, 0.16, 1.4, 0, 0.03, z, st.sidewalk));
    if (st.id === 'seaside') {                                              // boardwalk planks
        for (let x = -29.5; x <= 29.5; x += 1.5) [-4.7, 4.7].forEach(z => box(0.06, 0.02, 1.4, x, 0.12, z, 0xA9854F));
    }
    if (st.id === 'village') {                                              // cobbles
        for (let x = -29; x <= 29; x += 2) [-4.7, 4.7].forEach(z => { box(0.9, 0.02, 0.5, x, 0.12, z + ((x * 7) % 3 - 1) * 0.3, 0x948B7A); });
    }
    // trees along the back of the lots
    let i = 0;
    for (let x = -26; x <= 26; x += 6.5, i++) {
        [-19.5, 19.5].forEach((z, zi) => {
            const kind = st.treeKinds[(i + zi) % st.treeKinds.length];
            if (st.id === 'seaside' && z < 0) return;                       // the sea is on the north side
            if (st.id === 'downtown' && z < 0) return;                      // the skyline is on the north side
            if (st.id === 'desert' && (i + zi) % 2 === 1) return;           // sparse
            ssTree(b, kind, st, snowy, x, z, false);
        });
    }
}

// ---------------------------------------------
// HOUSES — ssBuildHouse(kind, c) builds the body, door, windows, step and path for one kind.
// c = { b (builder into the house group), h, snowy, st, wall, roof (snow-adjusted), door }
// Returns true when the kind was built (false -> buildHouse3D draws the original cottage).
// ---------------------------------------------
function ssDoor(b, color, y0) {
    y0 = y0 || 0;
    b.box(1.1, 2.1, 0.12, 0, y0 + 1.05, 2.86, color);
    b.box(0.12, 0.12, 0.08, 0.35, y0 + 1.05, 2.95, 0xFFD700);
}
function ssWindow(b, x, y, w, h, z, glass, frame) {
    b.box(w, h, 0.1, x, y, z - 0.04, frame === undefined ? 0xFFFFFF : frame);
    b.box(w - 0.2, h - 0.2, 0.12, x, y, z - 0.02, glass === undefined ? 0x9ED8F5 : glass);
}
function ssPath(b, color, w) { b.box(w || 1.3, 0.05, 4.2, 0, 0.03, 4.9, color || 0xD0D0D0); }
function ssStep(b, color) { b.box(2.6, 0.25, 1.4, 0, 0.12, 3.5, color || 0xBDBDBD); }
function ssBeds(b, y) {
    [-1.6, 1.6].forEach(x => {
        b.box(0.9, 0.3, 0.5, x, 0.15, 3.4, 0x4E9F3D);
        b.box(0.18, 0.18, 0.18, x - 0.2, 0.4, 3.4, 0xE91E63);
        b.box(0.18, 0.18, 0.18, x + 0.2, 0.4, 3.4, 0xFFD700);
    });
}
function ssPot(b, x, y, z, flower) {
    b.box(0.34, 0.3, 0.34, x, y + 0.15, z, 0xB5651D);
    b.sph(0.2, x, y + 0.45, z, flower);
}
function ssRoofCone(b, c, r, hgt, y, zscale) {
    const m = b.cone(r, hgt, 0, y, 0, c, 4);
    m.rotation.y = Math.PI / 4; m.scale.set(1.0, 1, zscale || 0.82);
    return m;
}

function ssBuildHouse(kind, c) {
    const b = c.b, h = c.h, wall = c.wall, roof = c.roof, door = c.door || 0x6D4C41, snowy = c.snowy, st = c.st;
    const snowC = 0xF4F8FB;
    switch (kind) {

        case 'twostorey': {
            b.box(7, 3.2, 5.6, 0, 1.6, 0, wall);
            b.box(6.2, 2.2, 5.0, 0, 4.3, -0.1, wall);
            b.box(6.6, 0.15, 5.4, 0, 3.25, 0, 0xFFFFFF);
            ssRoofCone(b, roof, 5.0, 1.8, 6.3, 0.82);
            b.box(0.8, 2, 0.8, 2.4, 6.0, -1, 0x8D4B3C);
            ssDoor(b, door);
            [-2.3, 2.3].forEach(x => ssWindow(b, x, 1.9, 1.5, 1.3, 2.86));
            [-2.0, 0, 2.0].forEach(x => ssWindow(b, x, 4.4, 1.2, 1.2, 2.5));
            ssStep(b); ssBeds(b); ssPath(b);
            return true;
        }

        case 'modern': {
            b.box(7, 3.0, 5.6, 0, 1.5, 0, wall);
            b.box(4.6, 1.9, 4.6, 1.2, 3.95, -0.4, 0x455A64);
            b.box(7.3, 0.25, 5.9, 0, 3.1, 0, snowy ? snowC : roof);
            b.box(5.0, 0.2, 5.0, 1.2, 5.0, -0.4, snowy ? snowC : roof);
            b.glow(3.0, 1.8, 0.08, -1.5, 1.7, 2.84, 0x8ECDE8).material.color.set(0x8ECDE8);
            [-3.0, -0.0].forEach(x => b.box(0.1, 1.8, 0.14, x, 1.7, 2.86, 0x263238));
            ssWindow(b, 1.2, 4.0, 3.2, 1.0, 2.0, 0x8ECDE8, 0x263238);
            for (let i = 0; i < 5; i++) b.box(0.18, 1.9, 0.12, 1.6 + i * 0.3, 1.0, 2.86, 0xA67C52);   // wooden slats beside the door
            ssDoor(b, door); ssStep(b, 0xAAAAAA);
            b.box(1.6, 0.9, 0.12, 2.6, 0.45, 3.9, 0x37474F);
            ssPath(b, 0xB0B0B0);
            return true;
        }

        case 'rowhouse': {
            b.box(6.6, 5.2, 5.4, 0, 2.6, 0, wall);
            b.box(6.9, 0.35, 5.7, 0, 5.3, 0, 0xFFFFFF);                                      // cornice
            b.box(6.2, 0.9, 5.0, 0, 5.9, 0, snowy ? snowC : roof);                          // mansard top
            b.box(0.7, 1.4, 0.7, 2.2, 6.4, -1, 0x8D4B3C);
            b.box(1.5, 0.3, 0.3, 0, 2.35, 2.86, 0xFFFFFF);                                  // lintel over the door
            ssDoor(b, door);
            [-2.0, 2.0].forEach(x => { ssWindow(b, x, 1.9, 1.2, 1.4, 2.7); ssWindow(b, x, 3.9, 1.2, 1.4, 2.7); });
            ssWindow(b, 0, 3.9, 1.0, 1.4, 2.7);
            [0, 1, 2].forEach(i => b.box(2.0 - i * 0.1, 0.18, 0.5, 0, 0.09 + i * 0.1, 3.2 + (2 - i) * 0.4, 0xBDBDBD));
            ssPot(b, -1.4, 0, 3.2, 0xE91E63); ssPot(b, 1.4, 0, 3.2, 0xFFD700);
            ssPath(b, 0xA9A9A9);
            return true;
        }

        case 'apartment': {                                                                  // brick block with a shop on the ground floor
            b.box(7, 6.2, 5.6, 0, 3.1, 0, wall);
            b.box(7.2, 0.25, 5.8, 0, 6.3, 0, 0x3E3E3E);
            b.box(1.6, 1.1, 1.6, -2.0, 7.0, 0.2, 0x607D8B);                                 // roof water tank
            b.cyl(0.5, 0.5, 0.9, 2.2, 6.95, -0.5, 0x8D6E63, 8);
            b.box(7.1, 0.12, 5.7, 0, 2.85, 0, 0xE0E0E0);                                    // ledge above the shop
            [-2.3, 2.3].forEach(x => b.box(2.2, 1.7, 0.1, x, 1.35, 2.84, 0xAEE6F5));       // shop windows
            ssDoor(b, door);
            const awn = (st.awnings || [0xC0392B])[h.index % (st.awnings || [1]).length];
            b.box(6.6, 0.14, 1.2, 0, 2.55, 3.35, awn).rotation.x = 0.28;
            [3.5, 4.6, 5.6].forEach(y => [-2.5, -0.85, 0.85, 2.5].forEach(x => ssWindow(b, x, y, 0.95, 0.75, 2.86, 0xFFE9A8, 0xEEEEEE)));
            b.box(1.5, 0.45, 0.12, 0, 2.55, 3.0, 0xFFD54F);                                 // shop sign
            ssPath(b, 0xB5B5B5, 2.2);
            return true;
        }

        case 'glassblock': {                                                                // dark glass office-style apartments
            b.box(7, 6.0, 5.6, 0, 3.0, 0, 0x37474F);
            [1.5, 2.9, 4.3, 5.4].forEach(y => b.box(6.6, 0.8, 0.1, 0, y, 2.84, 0x80D8FF));
            b.box(7.2, 0.3, 5.8, 0, 6.1, 0, wall);
            b.box(3.0, 0.8, 2.0, 1.4, 6.65, -0.5, 0x546E7A);
            b.box(0.1, 1.2, 0.1, -2.5, 6.9, 0, 0xB0BEC5);
            ssDoor(b, 0x263238);
            b.box(2.4, 0.15, 1.1, 0, 2.5, 3.3, 0x90A4AE);                                  // canopy over the entrance
            ssStep(b, 0x9E9E9E); ssPath(b, 0x9E9E9E, 2.0);
            return true;
        }

        case 'shopblock': {                                                                 // two storeys: big shop window, sign, flower boxes
            b.box(7, 4.6, 5.6, 0, 2.3, 0, wall);
            b.box(7.2, 0.3, 5.8, 0, 4.7, 0, snowy ? snowC : roof);
            b.box(2.0, 0.9, 1.4, -2.2, 5.3, -0.5, wall);
            b.box(2.8, 1.6, 0.1, -1.9, 1.3, 2.84, 0xAEE6F5);
            ssDoor(b, door);
            b.box(2.6, 0.5, 0.12, 0, 2.7, 2.88, (st.awnings || [0xC0392B])[(h.index + 1) % (st.awnings || [1]).length]);
            [-2.0, 0, 2.0].forEach((x, i) => { ssWindow(b, x, 3.8, 1.1, 1.0, 2.86); b.box(1.1, 0.25, 0.3, x, 3.2, 3.0, 0x6D4C41); b.box(0.9, 0.2, 0.2, x, 3.4, 3.0, [0xE91E63, 0xFFD700, 0xFF7043][i]); });
            b.box(6.4, 0.14, 1.0, 0, 3.05, 3.35, 0xFFFFFF).rotation.x = 0.25;
            ssPot(b, 2.4, 0, 3.4, 0xFF7043);
            ssPath(b, 0xB5B5B5, 2.0);
            return true;
        }

        case 'bungalow': {                                                                  // up on stilts
            [[-3.1, -2.4], [3.1, -2.4], [-3.1, 2.4], [3.1, 2.4], [0, 2.4], [0, -2.4]].forEach(([x, z]) => b.cyl(0.18, 0.2, 1.0, x, 0.5, z, 0x8D6E63, 6));
            b.box(7.0, 0.2, 5.6, 0, 1.05, 0, 0xB08D57);                                     // deck
            b.box(6.4, 2.5, 5.0, 0, 2.4, -0.1, wall);
            ssRoofCone(b, roof, 5.2, 1.5, 4.4, 0.8);
            b.box(6.2, 0.14, 1.4, 0, 1.15, 3.5, 0xB08D57);                                  // veranda
            [-3.0, 3.0].forEach(x => b.box(0.14, 1.9, 0.14, x, 2.1, 4.1, 0x8D6E63));
            b.box(6.2, 0.1, 0.1, 0, 2.55, 4.1, 0x8D6E63);
            b.box(6.2, 0.7, 0.06, 0, 1.55, 4.18, 0xFFFFFF);                                 // railing
            ssDoor(b, door, 1.15);
            [-2.2, 2.2].forEach(x => ssWindow(b, x, 2.7, 1.3, 1.0, 2.5, 0x9ED8F5, 0xFFFFFF));
            [0, 1, 2, 3].forEach(i => b.box(1.5, 0.18, 0.4, 0, 0.9 - i * 0.22, 4.5 + i * 0.4, 0xB08D57));   // stairs down to the sand
            ssPath(b, 0xE6D6A2, 1.3);
            b.box(0.3, 1.0, 0.12, 2.3, 0.5, 4.6, 0xFF7043);                                 // a surfboard
            return true;
        }

        case 'villa': {                                                                     // white box, blue trim, roof terrace
            b.box(7, 3.2, 5.6, 0, 1.6, 0, wall);
            b.box(7.3, 0.25, 5.9, 0, 3.3, 0, snowy ? snowC : roof);
            b.box(4.2, 1.7, 3.8, -1.2, 4.3, -0.6, wall);
            b.box(4.5, 0.2, 4.1, -1.2, 5.25, -0.6, snowy ? snowC : roof);
            b.box(2.2, 0.8, 0.1, 2.3, 3.85, 2.8, 0x1E88E5);                                  // terrace rail
            ssDoor(b, door);
            [-2.3, 2.3].forEach(x => { ssWindow(b, x, 1.9, 1.3, 1.3, 2.86, 0x80DEEA, 0xFFFFFF); b.box(0.3, 1.3, 0.1, x - 0.95, 1.9, 2.9, 0x1E88E5); b.box(0.3, 1.3, 0.1, x + 0.95, 1.9, 2.9, 0x1E88E5); });
            ssWindow(b, -1.2, 4.3, 1.8, 1.0, 1.3, 0x80DEEA, 0xFFFFFF);
            b.box(6.6, 0.14, 1.0, 0, 2.8, 3.3, 0x1E88E5).rotation.x = 0.2;
            ssStep(b, 0xF5F5F5); ssPot(b, -1.6, 0, 3.4, 0xE91E63); ssPot(b, 1.6, 0, 3.4, 0xFFEB3B);
            ssPath(b, 0xF1E3B0);
            return true;
        }

        case 'shack': {                                                                     // surf shack: small, big striped awning
            b.box(5.6, 2.4, 4.4, 0, 1.2, 0, wall);
            b.box(6.6, 0.2, 5.6, 0, 2.65, 0.1, snowy ? snowC : roof).rotation.x = -0.12;
            for (let i = 0; i < 6; i++) b.box(1.0, 0.1, 1.5, -2.5 + i * 1.0, 2.15, 3.3, i % 2 ? 0xFFFFFF : 0xE53935).rotation.x = 0.35;
            ssDoor(b, door);
            [-2.0, 2.0].forEach(x => ssWindow(b, x, 1.5, 1.0, 0.9, 2.2, 0x9ED8F5));
            [[-2.9, 0xFF7043], [-2.55, 0x29B6F6], [2.9, 0xFFEB3B]].forEach(([x, c], i) => { const m = b.box(0.35, 2.2, 0.1, x, 1.2, 3.0 + i * 0.05, c); m.rotation.z = (x < 0 ? 1 : -1) * 0.12; });
            ssStep(b, 0xD7C28A); ssPath(b, 0xE6D6A2, 1.1);
            return true;
        }

        case 'stone': {                                                                     // stone cottage: thatch (or tile) roof
            b.box(7, 3.0, 5.6, 0, 1.5, 0, wall);
            [[-3.5, -2.8], [3.5, -2.8], [-3.5, 2.8], [3.5, 2.8]].forEach(([x, z]) => b.box(0.5, 3.0, 0.5, x, 1.5, z, 0x8D8677));   // corner stones
            b.box(7.1, 0.3, 5.7, 0, 0.15, 0, 0x7B746A);                                     // stone foot
            const thatch = h.index % 2 === 0;
            const rc = snowy ? snowC : thatch ? 0xC9A24D : roof;
            ssRoofCone(b, rc, thatch ? 5.8 : 5.4, thatch ? 3.0 : 2.5, thatch ? 4.5 : 4.3, 0.82);
            if (thatch) b.box(6.2, 0.5, 0.3, 0, 3.15, 2.95, snowy ? snowC : 0xB89A45);       // the thatch overhangs the door
            b.box(0.9, 2.4, 0.9, 2.5, 4.5, -1, 0x8D8677);
            ssDoor(b, door);
            b.box(1.3, 0.2, 0.3, 0, 2.2, 2.9, 0x5D4037);
            [-2.3, 2.3].forEach(x => { ssWindow(b, x, 1.8, 1.0, 1.0, 2.86, 0xFFE9A8, 0x5D4037); b.box(0.35, 1.1, 0.1, x - 0.75, 1.8, 2.9, 0x3E7C4A); b.box(0.35, 1.1, 0.1, x + 0.75, 1.8, 2.9, 0x3E7C4A); b.box(1.2, 0.2, 0.3, x, 1.1, 3.0, 0x6D4C41); b.sph(0.18, x - 0.3, 1.35, 3.0, 0xE91E63); b.sph(0.18, x + 0.3, 1.35, 3.0, 0xFFEB3B); });
            ssStep(b, 0x9E9788); ssPath(b, 0xA39A87, 1.2);
            return true;
        }

        case 'timber': {                                                                    // half-timbered, with an overhanging top floor
            b.box(7, 2.8, 5.6, 0, 1.4, 0, 0xF1E6CC);
            b.box(7.3, 1.8, 5.9, 0, 3.7, 0, wall === 0xF1E6CC ? 0xE6DCC3 : 0xF1E6CC);
            [-3.4, -1.2, 1.2, 3.4].forEach(x => { b.box(0.22, 2.8, 0.14, x, 1.4, 2.82, 0x5D4037); b.box(0.22, 1.8, 0.14, x, 3.7, 3.0, 0x5D4037); });
            [0.1, 2.8, 4.6].forEach(y => b.box(7.2, 0.2, 0.14, 0, y, y > 2.7 ? 3.0 : 2.82, 0x5D4037));
            b.box(1.2, 0.1, 0.14, 0, 3.7, 3.0, 0x5D4037);
            ssRoofCone(b, snowy ? snowC : roof, 5.6, 2.2, 5.9, 0.82);
            b.box(0.8, 2, 0.8, -2.4, 5.8, -1, 0x7B746A);
            ssDoor(b, door);
            [-2.2, 2.2].forEach(x => { ssWindow(b, x, 1.8, 1.1, 1.0, 2.86, 0xFFE9A8, 0x5D4037); });
            [-1.8, 1.8].forEach(x => ssWindow(b, x, 3.8, 1.0, 0.9, 3.06, 0xFFE9A8, 0x5D4037));
            ssStep(b, 0x9E9788); ssPath(b, 0xA39A87, 1.2);
            return true;
        }

        case 'terrace': {                                                                   // colourful narrow house on a stone plinth, with stairs
            b.box(7, 0.7, 5.6, 0, 0.35, 0, 0x9E9788);
            b.box(6.2, 4.5, 5.2, 0, 2.95, 0, wall);
            b.box(6.6, 0.3, 5.6, 0, 5.35, 0, 0xFFFFFF);
            const sl = b.box(6.6, 0.3, 5.8, 0, 5.75, 0, snowy ? snowC : roof);
            sl.rotation.x = 0.0;
            b.box(5.0, 0.7, 0.3, 0, 5.8, 2.7, wall);                                        // stepped front gable
            b.box(3.0, 0.6, 0.3, 0, 6.3, 2.7, wall);
            ssDoor(b, door, 0.7);
            b.box(1.5, 0.2, 0.4, 0, 3.05, 2.9, 0xFFFFFF);
            [-2.0, 2.0].forEach(x => { ssWindow(b, x, 2.1, 1.0, 1.4, 2.66, 0x9ED8F5, 0xFFFFFF); ssWindow(b, x, 4.2, 1.0, 1.4, 2.66, 0x9ED8F5, 0xFFFFFF);
                b.box(0.3, 1.4, 0.08, x - 0.75, 4.2, 2.72, 0x2E7D32); b.box(0.3, 1.4, 0.08, x + 0.75, 4.2, 2.72, 0x2E7D32); });
            ssWindow(b, 0, 4.2, 0.9, 1.4, 2.66, 0x9ED8F5, 0xFFFFFF);
            [0, 1, 2].forEach(i => b.box(2.2, 0.25, 0.5, 0, 0.55 - i * 0.2, 3.2 + i * 0.5, 0xBDBDBD));   // stairs up to the door
            ssPot(b, -1.5, 0.7, 3.0, 0xFF5252); ssPot(b, 1.5, 0.7, 3.0, 0xFFEB3B);
            [-2.0, 2.0].forEach(x => { b.box(1.0, 0.18, 0.3, x, 3.3, 2.86, 0x6D4C41); b.sph(0.14, x - 0.25, 3.5, 2.9, 0xE91E63); b.sph(0.14, x + 0.25, 3.5, 2.9, 0xFFEB3B); });
            ssPath(b, 0xBDB39C, 1.5);
            return true;
        }

        case 'adobe': {                                                                     // stepped adobe with vigas and a blue door
            b.box(7, 2.8, 5.6, 0, 1.4, 0, wall);
            b.box(4.4, 1.3, 3.8, h.index % 2 ? 1.2 : -1.2, 3.45, -0.4, wall);
            b.box(7.3, 0.3, 5.9, 0, 2.9, 0, wall);
            for (let i = 0; i < 4; i++) { const m = b.cyl(0.12, 0.12, 0.9, -2.4 + i * 1.6, 2.5, 3.0, 0x6D4C41, 6); m.rotation.x = Math.PI / 2; }   // vigas
            ssDoor(b, door);
            b.box(1.5, 0.2, 0.2, 0, 2.3, 2.9, 0x6D4C41);
            [-2.3, 2.3].forEach(x => ssWindow(b, x, 1.8, 1.1, 1.0, 2.86, 0x80DEEA, 0x3AA8C1));
            [[-0.9, 1.5], [0.9, 1.5]].forEach(([x, y]) => { b.box(0.12, 0.8, 0.1, x, y, 2.95, 0xC62828); b.box(0.12, 0.6, 0.1, x + 0.12, y - 0.05, 2.95, 0xE53935); });
            ssPot(b, -1.6, 0, 3.4, 0x2E7D32); ssPot(b, 1.6, 0, 3.4, 0xFF7043);
            ssStep(b, 0xC9A66B); ssPath(b, 0xD9BF8A, 1.2);
            return true;
        }

        case 'hacienda': {                                                                  // whitewashed, red tile roof, porch with posts
            b.box(7, 2.8, 5.6, 0, 1.4, 0, 0xF5E9D3);
            const tile = snowy ? snowC : roof;
            ssRoofCone(b, tile, 5.4, 1.5, 3.55, 0.82);
            b.box(6.4, 0.15, 1.4, 0, 2.95, 3.5, tile);                                      // porch roof
            [-3.0, -1.0, 1.0, 3.0].forEach(x => b.box(0.18, 2.8, 0.18, x, 1.4, 4.1, 0x6D4C41));
            ssDoor(b, door);
            [-2.3, 2.3].forEach(x => ssWindow(b, x, 1.8, 1.1, 1.1, 2.86, 0x80DEEA, 0x6D4C41));
            b.box(0.7, 1.8, 0.7, 2.6, 3.7, -1.2, 0xF5E9D3);
            ssPot(b, -1.8, 0, 3.4, 0xE91E63); ssPot(b, 1.8, 0, 3.4, 0xFF7043);
            ssStep(b, 0xC9A66B); ssPath(b, 0xD9BF8A, 1.2);
            return true;
        }
    }
    return false;
}

// The tree/mailbox/fence bits in front of the house, per style (local coordinates; the street is at +z).
// 'classic' keeps its own flower beds and mailbox in neighborhood.js.
function ssBuildFrontYard(b, st, h, snowy) {
    switch (st.id) {
        case 'downtown':
            b.box(0.5, 1.0, 0.5, 1.9, 0.5, 6.5, 0x1565C0);                                   // newspaper box
            b.box(0.7, 0.55, 0.5, -2.3, 0.28, 5.0, 0x5D4037); b.sph(0.35, -2.3, 0.75, 5.0, snowy ? 0xDCE9DF : 0x3F9B4B);   // planter
            break;
        case 'seaside':
            b.cyl(0.08, 0.1, 0.9, 1.9, 0.45, 6.6, 0x8D6E63, 6); b.box(0.5, 0.3, 0.4, 1.9, 1.0, 6.6, 0xFF7043);   // driftwood post + box
            b.sph(0.3, -2.2, 0.3, 5.6, 0xFF5252);                                              // beach ball
            b.box(0.8, 0.08, 0.5, 2.6, 0.06, 5.2, [0xFF7043, 0x29B6F6, 0xFFEB3B][h.index % 3]);   // a towel
            break;
        case 'village': {
            [[-3.4, -0.8], [0.8, 3.4]].forEach(([a, c]) => {                                   // picket fence with a gap at the path
                const n = Math.round((c - a) / 0.5);
                for (let i = 0; i <= n; i++) b.box(0.14, 0.9, 0.1, a + i * (c - a) / n, 0.45, 6.3, 0xFFFFFF);
                b.box(c - a, 0.1, 0.06, (a + c) / 2, 0.35, 6.3, 0xF0F0F0);
                b.box(c - a, 0.1, 0.06, (a + c) / 2, 0.7, 6.3, 0xF0F0F0);
            });
            b.box(0.1, 0.9, 0.1, 0.8, 0.45, 6.3, 0x8D6E63); b.box(0.1, 0.9, 0.1, -0.8, 0.45, 6.3, 0x8D6E63);
            if (h.index % 2 === 0) { b.cyl(0.55, 0.55, 0.6, -2.7, 0.3, 4.9, snowy ? 0xF4F8FB : 0xD9B84A, 8).rotation.z = Math.PI / 2; }   // hay bale
            b.box(0.12, 0.8, 0.12, 1.9, 0.4, 5.6, 0x6D4C41); b.box(0.5, 0.3, 0.35, 1.9, 0.9, 5.6, 0x5D4037);
            break;
        }
        case 'hills':
            [-3.0, -2.4, 2.4, 3.0].forEach((x, i) => ssPot(b, x, 0, 5.0 + (i % 2) * 0.3, [0xFF5252, 0xFFEB3B, 0xE040FB, 0xFF9800][i]));
            b.box(0.1, 0.9, 0.1, 1.9, 0.45, 6.4, 0x555555); b.box(0.45, 0.32, 0.55, 1.9, 1.0, 6.4, 0xC62828);
            break;
        case 'desert':
            b.box(0.12, 0.9, 0.12, 1.9, 0.45, 6.5, 0x6D4C41); b.box(0.5, 0.3, 0.4, 1.9, 1.0, 6.5, 0x8D6E63);
            b.cyl(0.4, 0.4, 0.08, -2.9, 0.4, 5.6, 0x6D4C41, 10).rotation.x = Math.PI / 2;      // a wagon wheel
            b.sph(0.3, 2.9, 0.3, 5.2, snowy ? 0xE8E8E0 : 0xB89B5E);                            // a tumbleweed
            break;
    }
}

// ---------------------------------------------
// STREET DECORATIONS (lamps, benches, cars, scenery) — c = { add, colliders, snowy, block }
// ---------------------------------------------
function decorateStreet(st, c) {
    const b = ssBuilder(c.add), snowy = c.snowy;
    const lampXs = [-20, -8, 8, 20];
    switch (st.id) {
        case 'downtown': {
            lampXs.forEach(x => { ssLamp(b, st.lamp, x, -5.35, snowy); ssLamp(b, st.lamp, x + 4, 5.45, snowy); });
            for (let z = -3.4; z <= 3.5; z += 1.0) b.box(2.6, 0.02, 0.5, 2.0, 0.09, z, 0xFFFFFF);                        // zebra crossing
            ssParkedCar(c, -13, -2.7, 1); ssParkedCar(c, -3, -2.7, 1); ssParkedCar(c, 13, -2.7, 1);
            ssParkedCar(c, -15, 2.6, -1); ssParkedCar(c, 8, 2.6, -1);
            ssHydrant(b, -21.5, 5.2); ssHydrant(b, 10.5, -5.0);
            c.add(ssBench(b, 12, -5.2, Math.PI)); c.add(ssBench(b, -3.2, 5.8, 0));
            // bus stop on the north sidewalk
            b.box(3.0, 0.12, 1.4, -13.5, 2.6, -5.0, 0x37474F); b.box(0.1, 2.5, 0.1, -14.9, 1.3, -4.4, 0x546E7A); b.box(0.1, 2.5, 0.1, -12.1, 1.3, -4.4, 0x546E7A);
            b.box(2.9, 1.6, 0.06, -13.5, 1.5, -5.65, 0xB3E5FC); b.box(1.8, 0.1, 0.4, -13.5, 0.5, -5.3, 0x8B5A2B);
            b.box(0.8, 0.8, 0.1, -15.4, 2.9, -4.4, 0x1565C0);
            c.colliders.push({ minX: -15.0, maxX: -12.0, minZ: -5.9, maxZ: -5.5 });
            // traffic light at the crosswalk
            [[3.6, 5.5], [0.4, -5.5]].forEach(([x, z]) => { b.box(0.12, 3.4, 0.12, x, 1.7, z, 0x37474F); b.box(0.34, 0.9, 0.3, x, 3.5, z, 0x212121); b.glow(0.2, 0.2, 0.05, x, 3.75, z + 0.16, 0xE53935); b.glow(0.2, 0.2, 0.05, x, 3.45, z + 0.16, 0x2ECC71); });
            [-24, -17.5, -9.5, 0, 8.5, 17].forEach((x, i) => {                                                          // the skyline behind
                const w = 5 + (i % 3) * 1.4, hh = 9 + ((i * 5) % 7) * 1.5;
                b.box(w, hh, 4.5, x, hh / 2, -22, [0x78909C, 0x90A4AE, 0x8D6E63, 0x607D8B][i % 4]);
                for (let r = 0; r < Math.floor(hh / 2.2); r++) b.box(w - 0.8, 0.5, 0.06, x, 1.3 + r * 2.2, -19.7, 0xFFE9A8);
            });
            break;
        }
        case 'seaside': {
            b.box(60, 0.12, 1.6, 0, 0.06, -16.6, 0xB08D57);                                                            // boardwalk behind the north houses
            for (let x = -29; x <= 29; x += 1.2) b.box(0.05, 0.02, 1.6, x, 0.13, -16.6, 0x946F3A);
            b.box(70, 0.06, 3.8, 0, 0.0, -22.1, snowy ? 0xB9CDD8 : 0x29A9E0);                                          // the sea
            b.box(70, 0.04, 0.5, 0, 0.04, -20.4, 0xFFFFFF);                                                            // foam
            for (let x = -26; x <= 26; x += 5.2) b.box(1.6, 0.03, 0.2, x, 0.05, -22.0 + ((x * 3) % 2) * 0.9, 0xBDE9FA);   // waves
            [-23, -6, 12].forEach((x, i) => {                                                                          // beach umbrellas + towels
                b.cyl(0.05, 0.05, 2.2, x, 1.1, -18.6, 0xEEEEEE, 6);
                b.cone(1.3, 0.6, x, 2.3, -18.6, [0xFF5252, 0x29B6F6, 0xFFEB3B][i % 3], 8);
                b.box(1.4, 0.04, 0.8, x + 0.3, 0.05, -17.9, [0xFFEB3B, 0xFF5252, 0x66BB6A][i % 3]);
            });
            [-14, 3, 20].forEach((x, i) => { b.box(0.14, 2.0, 0.14, x, 1.0, -18.4, 0xEEEEEE); b.box(0.9, 0.2, 0.6, x + 0.3, 0.1, -18.0, 0xFFA726); });
            b.box(1.6, 0.4, 3.0, 17, 0.5, -20.9, 0xFFFFFF); b.box(1.4, 0.8, 0.1, 17, 1.0, -20.9, 0xE53935);              // a little boat
            b.box(0.1, 2.6, 0.1, 17, 1.9, -20.9, 0x8D6E63);
            b.box(2.0, 2.6, 1.8, -25.5, 1.3 + 0.9, -17.8, 0xFFFFFF); [[-25.5 - 0.8, -17.8 - 0.8], [-25.5 + 0.8, -17.8 - 0.8], [-25.5 - 0.8, -17.8 + 0.8], [-25.5 + 0.8, -17.8 + 0.8]].forEach(([x, z]) => b.box(0.15, 0.9, 0.15, x, 0.45, z, 0x8D6E63));   // lifeguard tower
            b.box(2.2, 0.15, 2.0, -25.5, 3.3, -17.8, 0xE53935);
            lampXs.forEach(x => { ssLamp(b, st.lamp, x - 2, -5.4, snowy); ssLamp(b, st.lamp, x + 2, 5.5, snowy); });
            c.add(ssBench(b, -12, -5.2, Math.PI)); c.add(ssBench(b, 14, 5.8, 0));
            ssParkedCar(c, -9, -2.7, 1); ssParkedCar(c, 17, 2.6, -1);
            [-8, 8].forEach(x => b.box(0.1, 2.4, 0.1, x, 1.2, -16.0, 0x8D6E63));                                       // a volleyball net
            b.box(16.2, 0.9, 0.04, 0, 1.9, -16.0, 0xFAFAFA);
            break;
        }
        case 'village': {
            // the well (in the gap between two north front yards)
            b.cyl(0.9, 0.95, 0.9, 0.2, 0.45, -7.4, 0x9E9788, 10);
            b.cyl(0.65, 0.65, 0.05, 0.2, 0.92, -7.4, 0x3B6E8F, 10);
            b.box(0.12, 1.8, 0.12, -0.55, 1.8, -7.4, 0x5D4037); b.box(0.12, 1.8, 0.12, 0.95, 1.8, -7.4, 0x5D4037);
            b.box(1.9, 0.12, 1.5, 0.2, 2.75, -7.4, snowy ? 0xF4F8FB : 0x8D5A3B).rotation.z = 0.0;
            c.colliders.push({ minX: -0.8, maxX: 1.2, minZ: -8.4, maxZ: -6.4 });
            for (let i = 0; i < 4; i++) { b.cyl(0.5, 0.5, 0.55, 14 + (i % 2) * 1.0, 0.28 + (i > 1 ? 0.5 : 0), -6.5 + (i % 2) * 0.1, snowy ? 0xF4F8FB : 0xD9B84A, 8).rotation.z = Math.PI / 2; }   // hay bales
            lampXs.forEach(x => { ssLamp(b, st.lamp, x, -5.45, snowy); ssLamp(b, st.lamp, x - 3, 5.55, snowy); });
            c.add(ssBench(b, 4, -5.2, Math.PI)); c.add(ssBench(b, -12, 5.8, 0));
            // a windmill at the back, a stone wall, and a cart
            b.cyl(1.0, 1.7, 6.0, 21, 3.0, -21, 0xE6DCC3, 8); b.cone(1.5, 1.8, 21, 6.9, -21, 0x8D5A3B, 8);
            [0, 1, 2, 3].forEach(i => { const bl = b.box(0.3, 4.2, 0.1, 21, 5.6, -19.8, 0xFFFFFF); bl.rotation.z = i * Math.PI / 2 + 0.4; });
            for (let x = -28; x <= -10; x += 1.1) b.box(1.0, 0.7, 0.5, x, 0.35, -17.2, 0x8D8677);
            b.box(1.8, 0.4, 1.0, -22, 0.7, 8.6, 0x8D5A3B); [-0.7, 0.7].forEach(dx => { const w = b.cyl(0.42, 0.42, 0.1, -22 + dx, 0.42, 9.15, 0x5D4037, 10); w.rotation.x = Math.PI / 2; });
            break;
        }
        case 'hills': {
            // the terraced hillside behind the north houses, with the church on top
            [[-17.8, 0.5, 0x6FB357], [-20.4, 1.2, 0x5FA64B], [-23, 1.9, 0x4F9740]].forEach(([z, hh, col]) => b.box(70, hh, 2.6, 0, hh / 2, z, snowy ? 0xEAF2F8 : col));
            [[-24, 3.0, 0xF4A6A0], [-18, 3.0, 0xF7D46B], [-7, 3.0, 0x8EC9E8], [22, 3.0, 0xE8A0C8], [14, 3.0, 0xA8D8A0]].forEach(([x, , col], i) => {
                const z = i % 2 ? -20.4 : -23, base = i % 2 ? 1.2 : 1.9;
                b.box(2.6, 1.8, 2.0, x, base + 0.9, z, col); b.cone(1.9, 1.0, x, base + 2.3, z, snowy ? 0xF4F8FB : 0xB5523A, 4).rotation.y = Math.PI / 4;
            });
            // church
            const cx = 5, cz = -22.6, base = 1.9;
            b.box(5.5, 3.0, 3.6, cx - 3.6, base + 1.5, cz, 0xEDE3CF);
            b.box(5.7, 0.4, 3.8, cx - 3.6, base + 3.2, cz, snowy ? 0xF4F8FB : 0x8C4A32);
            b.box(2.4, 6.5, 2.4, cx, base + 3.25, cz, 0xEDE3CF);
            b.box(1.4, 1.3, 0.12, cx, base + 5.4, cz + 1.25, 0x37474F);                                                // belfry opening
            b.cone(1.9, 2.8, cx, base + 7.9, cz, snowy ? 0xF4F8FB : 0x8C4A32, 4).rotation.y = Math.PI / 4;
            b.box(0.12, 0.9, 0.12, cx, base + 9.7, cz, 0xFFD54F); b.box(0.5, 0.12, 0.12, cx, base + 9.65, cz, 0xFFD54F);
            b.box(1.0, 1.8, 0.1, cx - 3.6, base + 0.9, cz + 1.85, 0x5D4037);
            lampXs.forEach(x => { ssLamp(b, st.lamp, x, -5.35, snowy); ssLamp(b, st.lamp, x + 3, 5.5, snowy); });
            // public stairs between yards + flower planters along the curb
            for (let x = -24; x <= 24; x += 8) [[-5.7, 0], [5.75, 0]].forEach(([z]) => { b.box(1.2, 0.35, 0.4, x + (z < 0 ? 0 : 3), 0.2, z, 0x8D6E63); b.sph(0.3, x + (z < 0 ? 0 : 3), 0.6, z, [0xFF5252, 0xFFEB3B, 0xE040FB][((x + 24) / 8) % 3]); });
            c.add(ssBench(b, -13, -5.2, Math.PI));
            ssParkedCar(c, -2, -2.7, 1);
            break;
        }
        case 'desert': {
            // far mesas, a water tower, rocks and a few cacti out in the dust
            [[-20, 7, 9], [-6, 5, 6], [10, 9, 10], [24, 6, 7]].forEach(([x, hh, w]) => { b.box(w, hh, 5, x, hh / 2, -23, snowy ? 0xD7B8A5 : 0xC1693C); b.box(w - 1.2, 0.5, 4.2, x, hh + 0.25, -23, snowy ? 0xF4F8FB : 0xD98250); });
            [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([dx, dz]) => b.box(0.18, 5, 0.18, -22 + dx, 2.5, -17.8 + dz, 0x6D4C41));
            b.cyl(1.7, 1.7, 2.4, -22, 6.2, -17.8, 0x8D6E63, 10); b.cone(1.8, 0.9, -22, 7.8, -17.8, 0x5D4037, 10);
            [[-12, 18.4], [-3, -17.1], [9, 18.2], [24, 17.6], [-26, -16.9]].forEach(([x, z], i) => b.sph(0.6 + (i % 2) * 0.3, x, 0.35, z, [0x9E8A6A, 0x8D7B5C][i % 2]));
            [-19, 5].forEach(x => { b.sph(0.4, x, 0.4, 5.9, snowy ? 0xE8E8E0 : 0xB89B5E); });
            lampXs.forEach(x => { ssLamp(b, st.lamp, x, -5.45, snowy); ssLamp(b, st.lamp, x - 3, 5.55, snowy); });
            c.add(ssBench(b, 8, -5.2, Math.PI));
            ssParkedCar(c, -14, -2.7, 1);
            [-27, -24.5].forEach(x => b.box(0.3, 1.2, 0.3, x, 0.6, 6.0, 0x6D4C41)); b.box(3.0, 0.2, 0.2, -25.7, 1.0, 6.0, 0x6D4C41);   // hitching post
            break;
        }
        default:
            break;   // suburb: the original quiet street (mailboxes and yards are part of the houses)
    }
}

// =============================================
// GROCERY CHAINS — which supermarket you land in (the mall's grocery, store.js).
// One chain per mall day (see mallDayKey in mall.js), so the same visit always looks the same.
// pal = colours for store.js / store-realism.js. decor() adds the extra props (called from store.js).
// =============================================
const STORE_CHAINS = [
    { id: 'utama', name: 'Utama Grocer', tagline: 'Fresh food & everyday needs', emoji: '🛒',
      pal: {}, mallWall: 0x4E9F3D, mallBeam: 0x2E7D32, mallSign: '#2e7d32', mallMat: 0xC8E6C9 },
    { id: 'fresh', name: 'Fresh Basket Market', tagline: 'Farm-fresh, picked this morning', emoji: '🧺',
      mallWall: 0x8D6E63, mallBeam: 0x558B2F, mallSign: '#558b2f', mallMat: 0xDCEDC8,
      pal: { floor: 0xD9B98A, tileA: '#D2AE7A', tileB: '#E4C99A', back: 0xE8D3A8, side: 0xD9BF8E, lowWall: 0x8D6E63, post: 0x5D4037, beam: 0x2E7D32, sign: '#2e7d32',
             signText: 'FRESH BASKET MARKET', shelf: 0x9C6B3C, shelfTag: '#4e342e', deptBg: '#33691e', banner: '🌿 FRESH & LOCAL 🌿', bannerBg: '#33691e', checkout: '#33691e' } },
    { id: 'valuemart', name: 'ValueMart', tagline: 'Big savings, every day', emoji: '📦',
      mallWall: 0x455A64, mallBeam: 0xEF6C00, mallSign: '#1565c0', mallMat: 0xCFD8DC,
      pal: { floor: 0x9E9E9E, tileA: '#8E9195', tileB: '#A5A8AC', back: 0xB0B7BC, side: 0xA2AAB0, lowWall: 0x78909C, post: 0x37474F, beam: 0xEF6C00, sign: '#1565c0',
             signText: 'VALUEMART', shelf: 0x1E5FA8, shelfTag: '#e65100', deptBg: '#1565c0', banner: '💥 LOW PRICES EVERY DAY 💥', bannerBg: '#ef6c00', checkout: '#ef6c00' } },
    { id: 'mini', name: 'Corner Mini-Mart', tagline: 'Open late, snacks galore', emoji: '🏪',
      mallWall: 0xFF7043, mallBeam: 0xFFC107, mallSign: '#e53935', mallMat: 0xFFF3C4,
      pal: { floor: 0xFFF3C4, tileA: '#FFE9A0', tileB: '#FFFBEA', back: 0xFFF3C4, side: 0xFFE9A0, lowWall: 0xFF7043, post: 0xE53935, beam: 0xE53935, sign: '#e53935',
             signText: 'CORNER MINI-MART', shelf: 0xFF8A65, shelfTag: '#c62828', deptBg: '#e53935', banner: '🍭 OPEN LATE 🍭', bannerBg: '#e53935', checkout: '#e53935' } }
];

// Today's chain (always the same for the same day).
function currentStoreChain() {
    const key = (typeof mallDayKey === 'function' && typeof player !== 'undefined' && player) ? mallDayKey() : 0;
    return STORE_CHAINS[seedFromText('chain|' + key) % STORE_CHAINS.length];
}

// Extra props that make each chain feel different. b = { box, put, label }.
// Everything sits high up (ceiling) or flat against the side/back walls so no walkways are blocked.
function addStoreChainDecor(chain, c) {
    const box = c.box, put = c.put, label = c.label, objects = c.objects;
    const glow = (w, h, d, x, y, z, color) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
        m.position.set(x, y, z); scene.add(m); objects.push(m); return m;
    };
    if (chain.id === 'fresh') {
        // green-and-white striped awning over the doorway + wooden crates of fruit against the side walls + chalkboards
        for (let i = 0; i < 10; i++) box(1.1, 0.12, 1.6, -4.95 + i * 1.1, 3.6, 6.1, i % 2 ? 0xFFFFFF : 0x2E7D32).rotation.x = 0.35;
        const fruit = [0xE53935, 0xFB8C00, 0x7CB342, 0xFDD835, 0x8E24AA, 0xFF7043];
        for (let k = 0; k < 6; k++) [-1, 1].forEach(sd => {
            const x = sd * 13.55, z = -12 + k * 1.9;
            box(0.7, 0.5, 1.5, x, 0.25, z, 0xA67C52);
            for (let f = 0; f < 3; f++) box(0.5, 0.2, 0.4, x - sd * 0.02, 0.58, z - 0.45 + f * 0.45, fruit[(k + f + (sd > 0 ? 3 : 0)) % fruit.length]);
        });
        const chalk1 = label('Today: Apples $3 🍎', { w: 384, h: 192, size: 40, bg: '#2b3a2e', sw: 2.6, sh: 1.3 }); put(chalk1, -3.3, 1.4, 5.0);
        const chalk2 = label('Eggs & Milk 🥚 Fresh!', { w: 384, h: 192, size: 38, bg: '#2b3a2e', sw: 2.6, sh: 1.3 }); put(chalk2, 3.3, 1.4, 5.0);
        [-9, -3, 3, 9].forEach(x => { box(0.05, 1.2, 0.05, x, 4.3, -7, 0x5D4037); box(0.9, 0.5, 0.5, x, 3.6, -7, 0x6D4C41); box(0.7, 0.45, 0.45, x, 4.0, -7, 0x43A047); });   // hanging plant baskets
        box(28, 0.2, 0.2, 0, 4.7, -7, 0x5D4037);                                              // wooden beam
        [-9, 0, 9].forEach(x => box(0.2, 0.2, 18, x, 4.85, -4.2, 0x8D6E63));                  // ceiling beams
    } else if (chain.id === 'valuemart') {
        // warehouse: steel racks with orange/blue pallets along the side walls and bare bulbs hanging from steel beams
        for (let k = 0; k < 4; k++) [-1, 1].forEach(sd => {
            const x = sd * 13.6, z = -12.6 + k * 2.4;
            [-1.0, 1.0].forEach(dz => box(0.12, 3.4, 0.12, x, 1.7, z + dz, 0x607D8B));
            [0.9, 1.9, 2.9].forEach(y => box(0.5, 0.1, 2.1, x, y, z, 0xEF6C00));
            [0.9, 1.9, 2.9].forEach((y, i) => box(0.4, 0.5, 1.8, x - sd * 0.02, y + 0.3, z, [0x1565C0, 0xEF6C00, 0xFFFFFF][(i + k) % 3]));
        });
        [-10, -5, 0, 5, 10].forEach(x => box(0.3, 0.3, 19.6, x, 4.9, -4.25, 0x546E7A));    // steel ceiling beams
        for (let ix = -1; ix <= 1; ix++) for (let iz = 0; iz < 4; iz++) {
            const x = ix * 7, z = -12 + iz * 5;
            box(0.04, 0.5, 0.04, x, 4.6, z, 0x212121);
            glow(0.3, 0.3, 0.3, x, 4.3, z, 0xFFF9C4);
        }
        put(label('📦 BULK SAVINGS 📦', { w: 384, h: 96, size: 44, bg: '#1565c0', sw: 3.6, sh: 0.9 }), -8.2, 4.1, 5.0);
        put(label('MEMBERS SAVE MORE', { w: 384, h: 96, size: 40, bg: '#ef6c00', sw: 3.6, sh: 0.9 }), 8.2, 4.1, 5.0);
    } else if (chain.id === 'mini') {
        // bright neon-and-candy mini-mart: neon OPEN sign, slush machine, striped ceiling strips, snack towers
        const neon = glow(1.6, 0.5, 0.06, 0, 3.3, 5.35, 0xFF1744);
        put(label('OPEN 24H', { w: 256, h: 96, size: 54, bg: '#111111', fg: '#ff5252', sw: 2.4, sh: 0.9 }), 0, 3.3, 5.6);
        [-9, -3, 3, 9].forEach((x, i) => glow(0.25, 0.1, 18, x, 4.9, -4.2, [0xFFEB3B, 0xFF5252, 0x40C4FF, 0x69F0AE][i]));
        // slush machine + hot-dog roller + candy towers against the right wall (clear of the lanes)
        [[-13.55, -10.4, 0x29B6F6], [-13.55, -9.8, 0xE91E63], [-13.55, -9.2, 0x76FF03]].forEach(([x, z, col]) => { box(0.5, 0.9, 0.5, x, 1.5, z, col); box(0.52, 0.12, 0.52, x, 2.0, z, 0x212121); });
        box(0.8, 1.0, 2.4, -13.5, 0.5, -9.8, 0xECEFF1);
        [-1, 1].forEach(sd => { for (let k = 0; k < 5; k++) box(0.5, 0.5 + (k % 2) * 0.3, 0.5, sd * 13.6, 0.4, -12.8 + k * 0.7 + (sd > 0 ? 6 : 0), [0xFF5252, 0xFFEB3B, 0x40C4FF, 0x69F0AE, 0xE040FB][k]); });
        [-1, 1].forEach(sd => box(0.1, 1.8, 0.8, sd * 13.95, 2.6, -2.2, 0xFFEB3B));
        put(label('🍦 ICE COLD DRINKS 🥤', { w: 384, h: 96, size: 40, bg: '#0277bd', sw: 3.4, sh: 0.9 }), -8.2, 4.1, 5.0);
        put(label('🍿 SNACKS & CANDY 🍬', { w: 384, h: 96, size: 40, bg: '#e53935', sw: 3.4, sh: 0.9 }), 8.2, 4.1, 5.0);
        void neon;
    }
}
