// =============================================
// NATURE — swaying trees and birds.
//
//   🌳 TREES sway in the wind: every tree built by ssTree() (street-styles.js — street trees and front-yard trees, all
//      street styles) is recorded, and its upper parts drift a little with a gusty wind. The higher a part is, the more it
//      moves; the trunk base stays put. Palms and poplars sway too; cacti and bushes stay still. Rainy days are windier.
//   🐦 BIRDS: a few blocky birds with flapping wings circle in the sky while you are outside (your street, driving, the school
//      field) in the daytime when it isn't raining. In the morning/at home you also hear birdsong (soundChirp in sound.js).
//   ⚙️ Settings → "Moving trees & birds" turns the animation off; "Birds" sets the birdsong volume.
//
// How: ssTree is wrapped so each tree's meshes are collected; one requestAnimationFrame loop here offsets them every frame.
// Meshes are held by WeakRef so trees that were thrown away (a street rebuilt) don't leak. Nothing here is saved or affects play.
// =============================================

const natTrees = [];                     // { parts: [{ref, bx, by, bz, f}], ph, amp, root: WeakRef, attached, checked }
let natWasOn = true, natFrame = 0;

// ---- collect every tree ssTree() builds ----
if (typeof ssTree === 'function') {
    const natOrigTree = ssTree;
    ssTree = function (b, kind, st, snowy, x, z, small) {
        const rec = [], w = {};
        ['box', 'cyl', 'cone', 'sph', 'glow'].forEach(k => { w[k] = function () { const m = b[k].apply(b, arguments); rec.push(m); return m; }; });
        const r = natOrigTree.call(this, w, kind, st, snowy, x, z, small);
        try { natRegister(rec, kind, small); } catch (e) { /* never break building a street */ }
        return r;
    };
}
function natRegister(meshes, kind, small) {
    if (kind === 'cactus' || kind === 'bush' || !meshes.length) return;                      // those stay still
    let top = 0; meshes.forEach(m => { top = Math.max(top, m.position.y); });
    if (top < 2) return;
    const parts = [];
    meshes.forEach(m => {
        const f = m.position.y / top;
        if (f < 0.25) return;                                                              // the bottom of the trunk doesn't move
        parts.push({ ref: new WeakRef(m), bx: m.position.x, by: m.position.y, bz: m.position.z, f: Math.pow(f, 1.6) });
    });
    if (!parts.length) return;
    natTrees.push({ parts, ph: Math.random() * 6.28, amp: 0.17 * Math.min(1.3, top / 6) * (kind === 'palm' ? 1.3 : kind === 'poplar' ? 1.15 : 1), root: parts[0].ref, attached: false, checked: -99 });
}
function natAttached(m) { for (let o = m; o; o = o.parent) if (typeof scene !== 'undefined' && o === scene) return true; return false; }

// ---- wind: gusty, stronger in the rain ----
function natWind(t) {
    const rain = typeof isRaining === 'function' && isRaining() ? 1.6 : 1;
    return Math.max(0.15, (0.55 + 0.35 * Math.sin(t * 0.31) + 0.2 * Math.sin(t * 0.83 + 1.7)) * rain);
}

function natUpdateTrees(t, on) {
    const wind = on ? natWind(t) : 0;
    for (let i = natTrees.length - 1; i >= 0; i--) {
        const tr = natTrees[i], root = tr.root.deref();
        if (!root) { natTrees.splice(i, 1); continue; }                                     // thrown away
        if (natFrame - tr.checked > 20) { tr.attached = natAttached(root); tr.checked = natFrame; }
        if (!tr.attached) continue;
        const sx = on ? Math.sin(t * 1.35 + tr.ph) : 0, sz = on ? Math.sin(t * 1.05 + tr.ph * 1.7) * 0.5 : 0;
        tr.parts.forEach(p => {
            const m = p.ref.deref(); if (!m) return;
            const a = tr.amp * p.f * wind;
            m.position.x = p.bx + a * sx; m.position.z = p.bz + a * sz;
        });
    }
}

// ---- birds ----
let natBirds = null, natBirdScene = null, natChirpAt = 0;
const NAT_BIRD_COLORS = [0x37474F, 0x6D4C41, 0xECEFF1, 0x546E7A, 0x8D6E63, 0xB0BEC5];
function natBuildBirds() {
    const g = new THREE.Group(); g.userData.natBirds = true;
    const list = [];
    for (let i = 0; i < 7; i++) {
        const bird = new THREE.Group(), col = NAT_BIRD_COLORS[i % NAT_BIRD_COLORS.length];
        const mk = (w, h, d, x, y, z, c, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false; (parent || bird).add(m); return m; };
        mk(0.5, 0.4, 1.1, 0, 0, 0, col);                                                     // body
        mk(0.34, 0.32, 0.34, 0, 0.14, -0.62, col);                                           // head (it flies toward -z)
        mk(0.12, 0.1, 0.3, 0, 0.1, -0.9, 0xF57C00);                                          // beak
        mk(0.3, 0.06, 0.45, 0, 0.02, 0.7, col);                                              // tail
        const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(-0.25, 0.1, 0); wr.position.set(0.25, 0.1, 0);
        mk(1.1, 0.06, 0.55, -0.55, 0, 0, col, wl); mk(1.1, 0.06, 0.55, 0.55, 0, 0, col, wr);
        bird.add(wl, wr);
        bird.scale.setScalar(1.7);
        g.add(bird);
        list.push({ bird, wl, wr, r: 14 + Math.random() * 18, h: 8 + Math.random() * 9, a: Math.random() * 6.28, sp: (0.07 + Math.random() * 0.07) * (Math.random() < 0.5 ? 1 : -1), ph: Math.random() * 6.28, fl: 9 + Math.random() * 4 });
    }
    return { group: g, list };
}
function natBirdsWanted() {
    if (typeof clsGet === 'function' && !clsGet('nature')) return false;
    const scn = typeof rideState !== 'undefined' && rideState ? 'drive'
        : typeof neighborhood3D !== 'undefined' && neighborhood3D ? 'hood'
        : typeof inSchool !== 'undefined' && inSchool && typeof inField !== 'undefined' && inField ? 'field' : '';
    if (!scn) return false;
    if (typeof isRaining === 'function' && isRaining()) return false;
    return natDaylight() > 0.1;
}
function natDaylight() { return typeof rlDaylight === 'function' ? rlDaylight().h : 1; }

function natUpdateBirds(t, dt) {
    const want = natBirdsWanted();
    if (!natBirds) { if (!want) return; natBirds = natBuildBirds(); }
    const g = natBirds.group;
    if (want && typeof scene !== 'undefined' && scene && typeof camera !== 'undefined' && camera) {
        if (g.parent !== scene) scene.add(g);
        const cx = camera.position.x, cz = camera.position.z;
        natBirds.list.forEach(o => {
            o.a += o.sp * dt;
            const x = cx + Math.cos(o.a) * o.r, z = cz + Math.sin(o.a) * o.r, y = o.h + Math.sin(t * 0.7 + o.ph) * 1.2;
            o.bird.position.set(x, y, z);
            const sg = o.sp > 0 ? 1 : -1;
            o.bird.rotation.y = Math.atan2(sg * Math.sin(o.a), -sg * Math.cos(o.a));            // beak points along the circle (-z is "forward")
            o.bird.rotation.z = Math.sin(t * 0.7 + o.ph) * 0.12;
            const flap = Math.sin(t * o.fl + o.ph) * 0.75, glide = Math.sin(t * 0.35 + o.ph) > 0.55 ? 0.15 : 1;       // sometimes it glides
            o.wl.rotation.z = flap * glide; o.wr.rotation.z = -flap * glide;
        });
    } else if (g.parent) g.parent.remove(g);

    // birdsong
    const home = typeof lgAtHome === 'function' && lgAtHome();
    const day = natDaylight() > 0.1 && !(typeof isRaining === 'function' && isRaining()) && !(typeof clsGet === 'function' && !clsGet('nature'));
    if (day && (want || home) && t > natChirpAt && typeof soundChirp === 'function') {
        soundChirp(home ? 0.45 : 1);
        natChirpAt = t + 1.2 + Math.random() * 4.5;
    }
}

// ---- one animation loop ----
let natLast = performance.now();
function natLoop(now) {
    requestAnimationFrame(natLoop);
    const dt = Math.min(0.1, (now - natLast) / 1000); natLast = now;
    natFrame++;
    const on = !(typeof clsGet === 'function' && !clsGet('nature'));
    if (!on && !natWasOn) return;                                                          // off, and already reset
    natUpdateTrees(now / 1000, on); natWasOn = on;
    natUpdateBirds(now / 1000, dt);
}
requestAnimationFrame(natLoop);
