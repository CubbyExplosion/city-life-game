// =============================================
// REALISM — makes the blocky world look like real life (it's still all boxes!).
//
// Loaded RIGHT AFTER three.js (before every other file) so it can upgrade THREE itself:
//   🧱 SURFACES   every coloured box gets a fine grain (like painted wood, concrete, cloth, grass) instead of flat colour
//                 — one shared texture, scaled by the box's real size so big floors don't stretch it.
//   🌗 SHADOWS    everything casts and receives soft shadows from the sun (outdoors, at home, at work). The sun follows you.
//   ☀️ DAY & NIGHT a slow day cycle (5 real minutes): warm sunrise, bright noon, orange sunset, dark blue night
//                 — sky colour, sun colour/angle and ambient light all change. Indoors (mall, store, restaurant) stays lit.
//   🌫️ HAZE       distant things fade into the sky colour, like real air.
// Everything is applied just before each picture is drawn (rlBeforeRender, called from firstperson.js's render hook).
// =============================================
(function () {
    if (typeof THREE === 'undefined') return;

    // ---- 1. a fine surface grain (one shared texture) ----
    let grain = null;
    function grainTexture() {
        if (grain) return grain;
        const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
        const g = c.getContext('2d');
        const img = g.createImageData(S, S);
        for (let i = 0; i < S * S; i++) {
            const n = 236 + Math.random() * 19;                        // fine noise, a touch darker than white
            const streak = (Math.sin((i % S) * 0.5) * 0.5 + 0.5) * 6;  // faint vertical grain
            const v = Math.max(215, n - streak);
            img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        for (let k = 0; k < 90; k++) {                                  // a few small flecks and scratches
            g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
            g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1);
        }
        grain = new THREE.CanvasTexture(c);
        grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
        grain.anisotropy = 4;
        grain.dispose = () => {};                                       // shared: never freed by disposeTree()
        return grain;
    }

    // ---- 2. boxes get world-sized texture coordinates ----
    const OrigBox = THREE.BoxGeometry;
    const TILE = 2.0;                                                    // one copy of the grain covers about 2 world units
    class RealBox extends OrigBox {
        constructor(w = 1, h = 1, d = 1, ws = 1, hs = 1, ds = 1) {
            super(w, h, d, ws, hs, ds);
            if (ws !== 1 || hs !== 1 || ds !== 1) return;
            const uv = this.attributes.uv.array;
            const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];       // px nx py ny pz nz
            faces.forEach(([a, b], f) => {
                const su = Math.max(1, a / TILE), sv = Math.max(1, b / TILE);
                for (let v = 0; v < 4; v++) { uv[(f * 4 + v) * 2] *= su; uv[(f * 4 + v) * 2 + 1] *= sv; }
            });
            this.attributes.uv.needsUpdate = true;
        }
    }
    THREE.BoxGeometry = RealBox;

    // ---- 3. every Lambert material gets the grain; every mesh casts + receives shadows ----
    // ---- night lights: which colours are WINDOWS (glow warm at night) and which are lamp BULBS (halo + real light) ----
    const WINDOWS = new Set([0x9ED8F5, 0xADD8E6, 0xB3E5FC, 0x90CAF9]);
    const BULBS = new Set([0xFFF59D, 0xFFB74D, 0xFFD54F, 0xFFF3B0, 0xFFF9C4]);
    window.rlGlowMats = [];                                              // materials that light up at night
    window.rlBulbMeshes = [];                                            // lamp bulbs (the nearest few get a real light)
    let haloTex = null;
    function haloTexture() {
        if (haloTex) return haloTex;
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d');
        const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(255,214,130,0.55)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        haloTex = new THREE.CanvasTexture(c); haloTex.dispose = () => {};
        return haloTex;
    }
    function tagGlow(mat, p) {
        const hex = p && typeof p.color === 'number' ? p.color : (p && p.color && p.color.getHex ? p.color.getHex() : -1);
        const kind = WINDOWS.has(hex) ? 'window' : BULBS.has(hex) ? 'bulb' : null;
        if (!kind) return;
        mat.userData.rlGlow = kind;
        window.rlGlowMats.push(mat);
        const od = mat.dispose.bind(mat);
        mat.dispose = () => { const i = window.rlGlowMats.indexOf(mat); if (i > -1) window.rlGlowMats.splice(i, 1); od(); };
    }

    const OrigLambert = THREE.MeshLambertMaterial;
    class RealLambert extends OrigLambert {
        constructor(p) {
            super(p);
            if (!this.map && !this.alphaMap && !(p && p.wireframe)) this.map = grainTexture();
            tagGlow(this, p);
        }
    }
    THREE.MeshLambertMaterial = RealLambert;
    const OrigBasic = THREE.MeshBasicMaterial;
    class RealBasic extends OrigBasic {
        constructor(p) { super(p); if (p && p.color !== undefined && !p.map && !p.transparent) tagGlow(this, p); }
    }
    THREE.MeshBasicMaterial = RealBasic;

    const OrigMesh = THREE.Mesh;
    class RealMesh extends OrigMesh {
        constructor(g, m) {
            super(g, m);
            this.castShadow = true; this.receiveShadow = true;
            if (m && m.userData && m.userData.rlGlow === 'bulb') {
                const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
                halo.scale.set(3.2, 3.2, 1); halo.userData.rlHalo = true; halo.raycast = () => {};
                this.add(halo);
                this.userData.rlHalo = halo;
                window.rlBulbMeshes.push(this);
            }
        }
    }
    THREE.Mesh = RealMesh;
})();

// ---------------------------------------------
// lighting, sky and haze — run before every picture (see firstperson.js)
// ---------------------------------------------
const RL_CYCLE_SECONDS = 300;                 // one full day (sunrise -> noon -> sunset -> night) in real seconds
let rlFrame = 0, rlLights = null, rlLightsFor = null, rlLightsAge = 0;
const rlSky = new THREE.Color(0x87ceeb);
let rlFog = null, rlFogOn = false, rlSunTarget = null;

let rlForcePhase = null;                      // (testing: set to 0..1 to freeze the time of day)
function rlDayPhase() { if (rlForcePhase !== null) return rlForcePhase; return ((Date.now() / 1000) % RL_CYCLE_SECONDS) / RL_CYCLE_SECONDS; }   // 0..1 (0.25 = noon)

// 0 = deep night ... 1 = bright day, and how close to sunrise/sunset (for the orange glow)
function rlDaylight() {
    const a = rlDayPhase() * Math.PI * 2;
    const h = Math.sin(a);                                   // sun height -1..1
    return { h, light: Math.max(0.1, Math.min(1, h * 1.5 + 0.3)), glow: Math.max(0, 1 - Math.abs(h) * 3.2) };
}

function rlFindLights() {
    if (rlLightsFor === scene && rlLights && ++rlLightsAge < 90) return rlLights;
    rlLightsFor = scene; rlLightsAge = 0;
    const L = { sun: null, amb: null };
    scene.children.forEach(o => { if (o.isDirectionalLight && !L.sun) L.sun = o; else if (o.isAmbientLight && !L.amb) L.amb = o; });
    rlLights = L;
    return L;
}

// ---- night: lit windows, glowing lamp bulbs, and real light pools under the nearest lamps ----
let rlLastHomeOff = -1, rlLastDark = -1, rlLastOut = null, rlLastGlowCount = -1, rlLampLights = null, rlLampTick = 0;
function rlNightLights(d, out) {
    const dark = Math.max(0, Math.min(1, (0.12 - d.h) / 0.3));                // 0 by day ... 1 at night
    const homeOff = typeof lgHomeOff === 'function' && lgHomeOff();            // lights.js: you switched your home lights off
    const bulbOn = homeOff ? 0 : out ? dark : 1;                              // lamps INSIDE (mall, store, restaurant) are always on
    const atHome = typeof lgAtHome === 'function' && lgAtHome();              // lights.js: inside your own home
    const homeState = (atHome ? 1 : 0) + (homeOff ? 2 : 0);
    if (Math.abs(dark - rlLastDark) > 0.01 || rlGlowMats.length !== rlLastGlowCount || out !== rlLastOut || homeState !== rlLastHomeOff) {          // (also when new buildings appeared)
        rlLastDark = dark; rlLastGlowCount = rlGlowMats.length; rlLastOut = out; rlLastHomeOff = homeState;
        rlGlowMats.forEach(m => {
            if (!m.emissive) return;                                          // (flat 'basic' glow materials are always bright)
            if (m.userData.rlGlow === 'window') {
                const lit = (m.id % 3) !== 0;                                  // about 2 in 3 windows have a light on
                if (atHome) { m.emissive.setHex(0x22346b); m.emissiveIntensity = dark * 0.75; return; }      // seen from INSIDE your home a window is the dark night sky, not a lit-up window
                m.emissive.setHex(lit ? 0xffcf75 : 0x000000);
                m.emissiveIntensity = lit ? dark * 0.9 : 0;
            } else if (m.emissive) { m.emissive.setHex(0xffe9a0); m.emissiveIntensity = bulbOn * 1.2; }
        });
        rlBulbMeshes.forEach(b => { if (b.userData.rlHalo) b.userData.rlHalo.material.opacity = bulbOn * 0.85; });
    }
    // three pooled point lights that sit on the lamps nearest to you (always present, so shaders never recompile)
    if (!rlLampLights) {
        rlLampLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffd9a0, 0, 15, 2); l.castShadow = false; return l; });
    }
    rlLampLights.forEach(l => { if (l.parent !== scene) scene.add(l); });
    if (bulbOn <= 0.02) { rlLampLights.forEach(l => { l.intensity = 0; }); return; }
    if (++rlLampTick % 12 === 1 && playerMesh) {
        const p = playerMesh.position, cand = [];
        const v = new THREE.Vector3();
        for (let i = rlBulbMeshes.length - 1; i >= 0; i--) {
            const b = rlBulbMeshes[i];
            let o = b, attached = false;
            while (o) { if (o === scene) { attached = true; break; } o = o.parent; }
            if (!attached) continue;
            b.getWorldPosition(v);
            const dd = Math.hypot(v.x - p.x, v.z - p.z);
            if (dd < 45) cand.push({ x: v.x, y: v.y, z: v.z, dd, k: b.userData.rlLampK || 1 });       // rlLampK: a weaker lamp (a room's ceiling light)
        }
        cand.sort((a, b2) => a.dd - b2.dd);
        rlLampLights.forEach((l, i) => { const c = cand[i]; if (c) { l.position.set(c.x, c.y - 0.2, c.z); l.userData.on = true; l.userData.k = c.k; } else l.userData.on = false; });
    }
    rlLampLights.forEach(l => { l.intensity = l.userData.on ? 55 * bulbOn * (l.userData.k || 1) : 0; });
}

// ---- a real sky: gradient dome, stars at night, a sun and a moon ----
let rlDome = null, rlDomeColors = null, rlStars = null, rlSun = null, rlMoon = null, rlSkyReady = false;
function rlSkyMake() {
    const R = 250;
    const geo = new THREE.SphereGeometry(R, 24, 16);
    rlDomeColors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(rlDomeColors, 3));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
    rlDome = new THREE.Mesh(geo, mat); rlDome.castShadow = false; rlDome.receiveShadow = false; rlDome.renderOrder = -20; rlDome.frustumCulled = false;
    const sp = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
        const u = Math.random(), v = 0.05 + Math.random() * 0.95, th = u * Math.PI * 2, ph = Math.acos(v);
        sp[i * 3] = Math.sin(ph) * Math.cos(th) * 235; sp[i * 3 + 1] = Math.cos(ph) * 235; sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 235;
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    rlStars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    rlStars.frustumCulled = false; rlStars.renderOrder = -19;
    const disc = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, inner); gr.addColorStop(0.35, inner); gr.addColorStop(0.5, outer); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c); t.dispose = () => {}; return t; };
    rlSun = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc('rgba(255,250,225,1)', 'rgba(255,225,150,0.5)'), transparent: true, depthWrite: false, fog: false }));
    rlMoon = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc('rgba(235,240,255,1)', 'rgba(190,205,240,0.35)'), transparent: true, depthWrite: false, fog: false }));
    [rlSun, rlMoon].forEach(s => { s.renderOrder = -18; s.raycast = () => {}; s.frustumCulled = false; });
    rlSkyReady = true;
}
function rlSkyUpdate(out, d, horizon, wet) {
    if (!rlSkyReady) rlSkyMake();
    const parts = [rlDome, rlStars, rlSun, rlMoon];
    if (!out) { parts.forEach(p => { if (p.parent) p.parent.remove(p); }); return; }
    parts.forEach(p => { if (p.parent !== scene) scene.add(p); });
    const cp = camera.position;
    rlDome.position.copy(cp); rlStars.position.copy(cp);
    // gradient: horizon colour at the bottom -> zenith colour overhead
    const zenith = new THREE.Color(0x03060f).lerp(new THREE.Color(0x4a90d9), Math.max(0, Math.min(1, (d.h + 0.15) / 0.5))).lerp(new THREE.Color(0x3b3f7a), d.glow * 0.5);
    if (wet) zenith.lerp(new THREE.Color(0x6b7480), 0.7 * wet);
    const pos = rlDome.geometry.attributes.position, tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const t = Math.max(0, pos.getY(i) / 250);
        tmp.copy(horizon).lerp(zenith, Math.pow(t, 0.55));
        rlDomeColors[i * 3] = tmp.r; rlDomeColors[i * 3 + 1] = tmp.g; rlDomeColors[i * 3 + 2] = tmp.b;
    }
    rlDome.geometry.attributes.color.needsUpdate = true;
    rlStars.material.opacity = Math.max(0, Math.min(1, -d.h * 3 - 0.2)) * (1 - (wet || 0));
    const a = rlDayPhase() * Math.PI * 2;
    const sdir = new THREE.Vector3(Math.cos(a) * 0.8, Math.sin(a), -0.55).normalize();      // the sun rises in the east, sets in the west
    rlSun.position.copy(cp).addScaledVector(sdir, 220); rlSun.scale.setScalar(36); rlSun.visible = d.h > -0.12 && !wet;
    rlMoon.position.copy(cp).addScaledVector(sdir, -220); rlMoon.scale.setScalar(22); rlMoon.visible = d.h < 0.08 && !wet;
    rlSun.material.opacity = Math.max(0, Math.min(1, d.h * 6 + 0.7));
}

// ---- rain on some days ----
let rlRain = null;
function isRaining() {
    if (typeof player === 'undefined' || !player || (typeof isSnowing === 'function' && isSnowing())) return false;
    const day = (player.age || 0) * 100 + (player.sleepCount || 0);
    let h = (day * 2654435761) >>> 0; h ^= h >>> 15;
    return (h % 100) < 20;                                       // roughly 1 day in 5
}
function rlRainUpdate(out, wetNow) {
    if (!rlRain) {
        const N = 1100, arr = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) { arr[i * 3] = (Math.random() - 0.5) * 36; arr[i * 3 + 1] = Math.random() * 18; arr[i * 3 + 2] = (Math.random() - 0.5) * 36; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        rlRain = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbcd0e6, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false }));
        rlRain.frustumCulled = false; rlRain.renderOrder = 5;
    }
    if (!(out && wetNow) || (typeof clsGet === 'function' && !clsGet('rain'))) { if (rlRain.parent) rlRain.parent.remove(rlRain); return; }
    if (rlRain.parent !== scene) scene.add(rlRain);
    const a = rlRain.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { a[i + 1] -= 0.55; a[i] -= 0.04; if (a[i + 1] < 0) { a[i + 1] = 18; a[i] = (Math.random() - 0.5) * 36; a[i + 2] = (Math.random() - 0.5) * 36; } }
    rlRain.geometry.attributes.position.needsUpdate = true;
    rlRain.position.set(camera.position.x, Math.max(0, camera.position.y - 4), camera.position.z);
}

function rlOutdoors() {
    if (typeof rideState !== 'undefined' && rideState) return true;
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D) return true;
    if (typeof mall3D !== 'undefined' && mall3D) return false;
    if (typeof place3D !== 'undefined' && place3D) return true;
    if (typeof inStore !== 'undefined' && inStore) return false;
    if (typeof restaurant3D !== 'undefined' && restaurant3D) return false;
    return true;                                              // at home you see the sky through the open side
}

function rlBeforeRender() {
    rlFrame++;
    if (typeof scene === 'undefined' || !scene || !renderer) return;
    const L = rlFindLights();
    const out = rlOutdoors();
    const d = rlDaylight();

    // sky colour: night blue -> day blue, with an orange glow at sunrise and sunset (snow days are greyer)
    const snowy = typeof isSnowing === 'function' && isSnowing();
    const day = snowy ? new THREE.Color(0xcfdcea) : new THREE.Color(0x87ceeb);
    const night = new THREE.Color(0x121c44), dusk = new THREE.Color(0xf29a62);
    const t = Math.max(0, Math.min(1, (d.h + 0.15) / 0.5));
    rlSky.copy(night).lerp(day, t).lerp(dusk, d.glow * 0.55 * (1 - snowy * 0.5));

    const wet = out && isRaining() ? 1 : 0;
    if (wet) rlSky.lerp(new THREE.Color(0x6f7886).multiplyScalar(0.3 + 0.7 * d.light), 0.8);        // grey rainy sky
    if (out) {
        scene.background = rlSky;
        if (!rlFog) rlFog = new THREE.Fog(rlSky.getHex(), 38, 96);
        rlFog.color.copy(rlSky);
        const driving3 = typeof rideState !== 'undefined' && rideState;
        rlFog.near = driving3 ? 70 : (wet ? 20 : 38); rlFog.far = driving3 ? 230 : (wet ? 60 : 96);
        scene.fog = rlFog; rlFogOn = true;
    } else if (rlFogOn) { scene.fog = null; rlFogOn = false; }
    const horizon = rlSky.clone();
    rlSkyUpdate(out, d, horizon, wet);
    rlRainUpdate(out, wet);
    if (camera.far < 399) { camera.far = 400; camera.updateProjectionMatrix(); }
    if (typeof rideState !== 'undefined' && rideState && rideState.headlight) {        // your headlights come on in the dark / rain
        const dk = Math.max(0, Math.min(1, (0.2 - d.h) / 0.3, 1)) ;
        rideState.headlight.intensity = 90 * Math.max(dk, wet * 0.5);
    }

    if (L.sun) {
        const sun = L.sun;
        const nightish = d.h < 0;
        const warm = new THREE.Color(0xfff2d8).lerp(new THREE.Color(0xff9a4d), d.glow * 0.8);
        const moon = new THREE.Color(0x6f86c9);
        sun.color.copy(nightish ? moon : warm);
        sun.intensity = out ? (nightish ? 0.28 : 0.35 + 0.95 * d.light) * (isRaining() ? 0.6 : 1) : 0.9;
        const a = rlDayPhase() * Math.PI * 2;
        const px = playerMesh ? playerMesh.position.x : 0, pz = playerMesh ? playerMesh.position.z : 0;
        if (!rlSunTarget) rlSunTarget = new THREE.Object3D();
        rlSunTarget.position.set(px, 0, pz); rlSunTarget.updateMatrixWorld();
        sun.target = rlSunTarget;
        const elev = Math.max(0.35, Math.abs(Math.sin(a)));
        sun.position.set(px + Math.cos(a) * 26, 12 + elev * 22, pz + 12);
        // shadows only where it's cheap (not in the huge mall / store)
        const shadowsOk = !(typeof mall3D !== 'undefined' && mall3D) && !(typeof inStore !== 'undefined' && inStore) && (typeof clsGet !== 'function' || clsGet('shadows'));   // ⚙️ Settings: shadows
        if (sun.castShadow !== shadowsOk) sun.castShadow = shadowsOk;
        if (!sun.userData.rlInit) {
            sun.userData.rlInit = true;
            const sc = sun.shadow.camera;
            sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 120;
            sc.updateProjectionMatrix();
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
    }
    rlNightLights(d, out);
    if (L.amb) {
        const amb = L.amb;
        const roomy = out && !(typeof neighborhood3D !== 'undefined' && neighborhood3D) && !(typeof rideState !== 'undefined' && rideState);   // home / work: lamps are on at night
        amb.intensity = out ? Math.max(roomy ? 0.45 : 0.26, 0.2 + 0.42 * d.light) : 0.55;
        amb.color.copy(new THREE.Color(0xffffff).lerp(new THREE.Color(0x8fa5e6), out ? (1 - d.light) * 0.7 : 0));
        if (typeof lgAtHome === 'function' && lgAtHome()) {                      // lights.js: home lights on = warm room, off = dark and blue
            if (lgOn()) { amb.intensity = 0.28 + 0.34 * d.light; amb.color.copy(new THREE.Color(0xfff1d8).lerp(new THREE.Color(0x8fa5e6), (1 - d.light) * 0.2)); }   // lower fill at night so the lamps' pools of light show
            else { amb.intensity = 0.08 + 0.42 * d.light; amb.color.copy(new THREE.Color(0xffffff).lerp(new THREE.Color(0x6f86d8), (1 - d.light) * 0.85)); }
        }
    }
}
