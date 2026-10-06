// =============================================
// PEOPLE — blocky humans that look and move like real people.
//
// Every person in City Life (you, Mom & Dad, neighbours, classmates, shoppers, cashiers, workers, students...)
// is now built by buildHumanMesh(): separate legs with shoes, a torso, two arms with hands, a neck, a head with
// eyes, eyebrows, a nose and a mouth, and a hairstyle. Skin tones differ from person to person. When someone moves
// their arms and legs SWING; when they stand still they stand still. A soft shadow sits under their feet.
//
// This file is loaded after world.js / store.js and REPLACES their old simple builders (the last definition of a
// global function wins): buildParent, buildNPC, makePerson, buildPlayerMesh. Same names, same arguments.
// =============================================

const SKIN_TONES = [0xFFCBA4, 0xF3C9A0, 0xE8B88A, 0xD9A06D, 0xC68642, 0xA86B3C, 0x8D5524, 0x6B4226];
const PANTS_COLORS = [0x2c3e50, 0x34495e, 0x5d4e37, 0x3b3b52, 0x1f2d3a, 0x6b5b45];
const SHOE_COLORS = [0x2b2b2b, 0x4a3426, 0xf0f0f0, 0x333a4d];

// a repeatable number from a few colours, so the same person always looks the same
function humanSeed(a, b, c) { return ((a | 0) * 31 + (b | 0) * 17 + (c | 0) * 7 + 12345) >>> 0; }

let rlHumanFrame = -1;
const rlTmpV = new THREE.Vector3();

// Called while a person is drawn: swings the limbs depending on how fast the person moved since last frame
function humanAnimate(g) {
    if (typeof rlFrame === 'undefined') return;
    const u = g.userData.human;
    if (!u || u.frame === rlFrame) return;                // once per picture
    const now = Date.now();
    if (u.frame === undefined) { u.frame = rlFrame; u.t = now; g.getWorldPosition(rlTmpV); u.px = rlTmpV.x; u.pz = rlTmpV.z; return; }
    u.frame = rlFrame;
    const dt = Math.max(0.001, Math.min(0.1, (now - u.t) / 1000)); u.t = now;
    g.getWorldPosition(rlTmpV);
    const sp = Math.hypot(rlTmpV.x - u.px, rlTmpV.z - u.pz) / dt / Math.max(0.2, g.scale.x);
    u.px = rlTmpV.x; u.pz = rlTmpV.z;
    const moving = sp > 0.25 && sp < 30;
    u.phase += moving ? Math.min(sp, 6) * dt * 2.4 : 0;
    const amp = moving ? Math.min(0.75, 0.25 + sp * 0.12) : 0;
    u.amp += (amp - u.amp) * 0.25;
    const s = Math.sin(u.phase) * u.amp;
    u.legL.rotation.x = s; u.legR.rotation.x = -s;
    u.armL.rotation.x = -s * 0.9; u.armR.rotation.x = s * 0.9;
    u.body.position.y = u.baseBodyY + Math.abs(Math.cos(u.phase)) * u.amp * 0.035;
    // standing still: breathe, shift the arms a little and glance around
    u.idle += dt;
    const still = 1 - Math.min(1, u.amp * 3);
    if (still > 0.01) {
        u.armL.rotation.x += Math.sin(u.idle * 1.3) * 0.05 * still; u.armR.rotation.x -= Math.sin(u.idle * 1.1 + 1) * 0.05 * still;
        u.body.scale.y = 1 + Math.sin(u.idle * 1.8) * 0.012 * still;
    }
    u.head.rotation.y = Math.sin(u.idle * 0.45 + u.phase) * 0.4 * still * (Math.sin(u.idle * 0.17) > 0.2 ? 1 : 0.2);
}

// opts: { shirt, hair, pants?, skin?, female?, apron?, scale? }
function buildHumanMesh(opts) {
    const g = new THREE.Group();
    const seed = humanSeed(opts.shirt, opts.hair, opts.female ? 1 : 0);
    const skin = opts.skin || SKIN_TONES[seed % SKIN_TONES.length];
    const pants = opts.pants || PANTS_COLORS[(seed >> 3) % PANTS_COLORS.length];
    const shoe = SHOE_COLORS[(seed >> 5) % SHOE_COLORS.length];
    const lm = c => new THREE.MeshLambertMaterial({ color: c });
    const box = (parent, w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lm(c)); m.position.set(x, y, z); parent.add(m); return m; };

    // soft contact shadow on the ground (works even where the sun casts none)
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.015; blob.castShadow = false; blob.receiveShadow = false;
    g.add(blob);

    const body = new THREE.Group(); g.add(body);                 // everything above the legs (bobs a little while walking)
    // legs (pivot at the hip) with shoes
    const mkLeg = x => {
        const leg = new THREE.Group(); leg.position.set(x, 0.68, 0);
        box(leg, 0.19, 0.58, 0.22, 0, -0.34, 0, pants);
        box(leg, 0.2, 0.1, 0.34, 0, -0.63, 0.05, shoe);          // the shoe sticks out in front
        g.add(leg); return leg;
    };
    const legL = mkLeg(-0.115), legR = mkLeg(0.115);
    // torso (+ a belt for the grown-ups' look) and a collar
    box(body, 0.46, 0.6, 0.3, 0, 0.98, 0, opts.shirt);
    box(body, 0.47, 0.06, 0.31, 0, 0.7, 0, 0x2b2118);
    box(body, 0.2, 0.05, 0.12, 0, 1.28, 0.08, skin);             // neck/collar
    if (opts.apron) box(body, 0.34, 0.42, 0.04, 0, 0.9, 0.17, opts.apron);
    // arms (pivot at the shoulder): sleeve then hand
    const mkArm = x => {
        const arm = new THREE.Group(); arm.position.set(x, 1.25, 0);
        box(arm, 0.14, 0.34, 0.17, 0, -0.17, 0, opts.shirt);
        box(arm, 0.12, 0.28, 0.15, 0, -0.44, 0, skin);
        box(arm, 0.13, 0.1, 0.16, 0, -0.62, 0, skin);
        body.add(arm); return arm;
    };
    const armL = mkArm(-0.31), armR = mkArm(0.31);
    // head: skin, eyes, eyebrows, nose, mouth, ears
    const head = new THREE.Group(); head.position.set(0, 1.47, 0); body.add(head);
    box(head, 0.36, 0.38, 0.36, 0, 0, 0, skin);
    [-0.09, 0.09].forEach(x => {
        box(head, 0.075, 0.05, 0.02, x, 0.04, 0.185, 0xffffff);
        box(head, 0.04, 0.045, 0.02, x, 0.04, 0.195, 0x1b1b1b);
        box(head, 0.1, 0.02, 0.02, x, 0.1, 0.188, 0x3d2a1a);
        box(head, 0.05, 0.1, 0.05, x * 2.35, -0.02, 0, skin);       // ears
    });
    box(head, 0.06, 0.07, 0.05, 0, -0.03, 0.2, new THREE.Color(skin).multiplyScalar(0.9).getHex());   // nose
    box(head, 0.12, 0.025, 0.02, 0, -0.11, 0.188, 0x9b3d3d);                                          // mouth
    // hair: a cap on top, a back and, for some, long hair down the back / a fringe
    const style = opts.female ? (seed % 3) + 1 : seed % 3;       // 0 short, 1 medium, 2 spiky/cap, 3 long
    box(head, 0.4, 0.12, 0.4, 0, 0.23, 0, opts.hair);
    box(head, 0.4, 0.22, 0.09, 0, 0.1, -0.16, opts.hair);
    if (style !== 2) box(head, 0.4, 0.07, 0.1, 0, 0.17, 0.17, opts.hair);                     // fringe
    if (style >= 1) { box(head, 0.06, 0.2, 0.3, -0.19, 0.06, -0.02, opts.hair); box(head, 0.06, 0.2, 0.3, 0.19, 0.06, -0.02, opts.hair); }
    if (style === 3) box(head, 0.4, 0.5, 0.1, 0, -0.14, -0.17, opts.hair);                    // long hair

    g.userData.human = { legL, legR, armL, armR, body, head, baseBodyY: 0, phase: Math.random() * 6, amp: 0, idle: Math.random() * 20 };
    // the torso drives the animation (it's drawn every frame the person is visible)
    const driver = body.children[0];
    driver.onBeforeRender = () => humanAnimate(g);
    g.scale.setScalar(opts.scale || 1);
    return g;
}

// ---- the old builders, now with real people ----
function buildParent(x, z, shirtColor, hairColor) {
    const isMom = shirtColor === 0x4169E1;
    const hl = typeof heritageLook === 'function' ? heritageLook(isMom ? 'mom' : 'dad') : null;      // heritage.js: family skin + hair
    const group = buildHumanMesh({ shirt: shirtColor, hair: hl ? hl.hair : hairColor, female: isMom, skin: hl ? hl.skin : undefined });
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function buildNPC(x, z, shirtColor, hairColor, npcData) {
    const group = buildHumanMesh({ shirt: shirtColor, hair: hairColor, female: !!(npcData && (npcData.gender === 'girl')) });
    group.userData.npcData = npcData;
    group.position.set(x, 0, z);
    scene.add(group);
    clickableNPCs.push(group);
    return group;
}

// A standing person that isn't clickable (cashiers, queues, staff, workers, students). Not added to the scene.
function makePerson(x, z, shirt, hair, scale) {
    const g = buildHumanMesh({ shirt, hair, scale: scale || 0.8 });
    g.position.set(x, 0, z);
    return g;
}

// You. Kids are small and grow up to full size by 22. (Babies are still the little capsule.)
function buildPlayerMesh() {
    if (playerMesh) scene.remove(playerMesh);
    if (player.age <= 4) {
        const geo = new THREE.CapsuleGeometry(0.22, 0.4, 4, 8);
        const hlB = typeof heritageLook === 'function' ? heritageLook('player') : null;                // heritage.js: baby skin tone
        const mat = new THREE.MeshLambertMaterial({ color: hlB ? hlB.skin : 0xFFDAB9 });
        playerMesh = new THREE.Mesh(geo, mat);
        playerMesh.castShadow = true;
        playerMesh.position.set(-3, 0.9, 0);                    // inside the crib
    } else {
        const girl = player.gender !== 'boy';
        const scale = Math.min(1.0, 0.50 + (player.age - 5) * 0.037);
        const hl = typeof heritageLook === 'function' ? heritageLook('player') : null;                 // heritage.js: your skin tone + hair
        const group = buildHumanMesh({ shirt: girl ? 0xE91E8C : 0x3498DB, hair: hl ? hl.hair : girl ? 0xCC0066 : 0x4B2800, female: girl, scale, skin: hl ? hl.skin : SKIN_TONES[0], pants: 0x2c3e50 });
        group.position.set(0, 0, 0);
        playerMesh = group;
    }
    scene.add(playerMesh);
}
