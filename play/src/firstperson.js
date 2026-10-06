// =============================================
// FIRST PERSON — see the world through your own eyes.
//
//   Walk with W/S (or ↑/↓) forward and back, A/D to strafe, and turn with ←/→ (or Q/E) — or click-and-drag
//   on the picture to look around (up/down too). Press V (or the 👁️ button) to switch back to the old
//   bird's-eye view. It works at home, at school, on your street, in the mall, in the grocery store,
//   at work, on campus, and behind the wheel (you look out of the driver's seat).
//   The cutscenes you just watch (kids being driven, the restaurant table) keep their own camera.
//
// How: renderer.render is wrapped, so every scene's own camera code runs as usual and then this file
// moves the camera to your eyes just before the picture is drawn. Scenes read their movement keys through
// getMoveInput(), which turns "forward" into the way you're facing.
// =============================================

let fpv = true;                                  // first person on? (remembered)
try { const v = localStorage.getItem('citylife_fpv'); if (v === '0') fpv = false; } catch (e) {}
let fpYaw = 0, fpPitch = 0;                      // yaw 0 = looking toward -z; +yaw turns right
let fpSceneKey = '', fpWasActive = false, fpLast = Date.now(), fpDragMoved = false, fpHintShown = false;
let fpDown = null;

function fpSceneKeyNow() {
    if (typeof rideState !== 'undefined' && rideState && rideState.manual) return 'drive';
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D) return 'hood';
    if (typeof mall3D !== 'undefined' && mall3D) return 'mall';
    if (typeof place3D !== 'undefined' && place3D) return 'place';
    if (typeof inStore !== 'undefined' && inStore && typeof store !== 'undefined' && store) return 'store';
    if (typeof driving !== 'undefined' && driving) return '';                    // cutscene ride (kids)
    if (typeof restaurant3D !== 'undefined' && restaurant3D) return 'seat';      // seated at the table: you look out of your own chair
    if (typeof player !== 'undefined' && player.age < 3) return '';              // babies stay in the crib view
    return 'home';
}
function fpActive() { return fpv && !!fpSceneKeyNow(); }

// The movement the scenes use: { x, z } in world axes (legacy: -1/0/1 per axis; first person: rotated by where you look)
function getMoveInput() {
    const k = keys;
    const up = !!(k['ArrowUp'] || k['w'] || k['W']), down = !!(k['ArrowDown'] || k['s'] || k['S']);
    const left = !!(k['ArrowLeft'] || k['a'] || k['A']), right = !!(k['ArrowRight'] || k['d'] || k['D']);
    if (!fpActive()) return { x: (right ? 1 : 0) - (left ? 1 : 0), z: (down ? 1 : 0) - (up ? 1 : 0) };
    const fwd = ((k['ArrowUp'] || k['w'] || k['W']) ? 1 : 0) - ((k['ArrowDown'] || k['s'] || k['S']) ? 1 : 0);
    const str = ((k['d'] || k['D']) ? 1 : 0) - ((k['a'] || k['A']) ? 1 : 0);
    const fx = Math.sin(fpYaw), fz = -Math.cos(fpYaw), rx = Math.cos(fpYaw), rz = Math.sin(fpYaw);
    let x = fx * fwd + rx * str, z = fz * fwd + rz * str;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
}

function fpEyeHeight() {
    const a = player.age;
    return a <= 4 ? 0.8 : a <= 8 ? 1.15 : a <= 12 ? 1.4 : 1.62;
}

// Runs right before every picture is drawn
function fpBeforeRender() {
    const now = Date.now(), dt = Math.min(0.05, (now - fpLast) / 1000);
    fpLast = now;
    const key = fpSceneKeyNow();
    const active = fpv && !!key;
    if (!active) {
        if (typeof restaurant3D !== 'undefined' && restaurant3D) fpSeatShow(false);              // first person off: the overhead camera sees the whole table again
        if (typeof rideState !== 'undefined' && rideState && rideState.manual) fpCockpit(rideState, false);
        if (fpWasActive) { fpWasActive = false; fpSceneKey = ''; if (playerMesh) playerMesh.visible = true; if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); } fpSyncButton(); }
        return;
    }
    if (key !== fpSceneKey) {                                    // new place: face the way you're already facing
        fpSceneKey = key;
        fpPitch = 0;
        fpYaw = (key === 'home' || key === 'store' || key === 'drive') ? 0 : Math.PI - (playerMesh ? playerMesh.rotation.y : Math.PI);
        if (key === 'seat') { fpYaw = Math.PI; fpPitch = -0.5; }                   // at the table you face the front of the room, looking down at your plate
        if (key === 'hood' || key === 'place' || key === 'mall') fpYaw = Math.PI - playerMesh.rotation.y;
        if (!fpHintShown && typeof showEvent === 'function') { fpHintShown = true; showEvent('👁️', 'First person! W/S walk, A/D sidestep, ←/→ or Q/E turn, or drag the picture to look around. Press V for the old view.'); }
    }
    if (!fpWasActive) { fpWasActive = true; fpSyncButton(); }
    const wantFov = typeof clsGet === 'function' ? clsGet('fov') : 72;            // ⚙️ Settings: field of view
    if (camera.fov !== wantFov) { camera.fov = wantFov; camera.updateProjectionMatrix(); }

    // turn with ←/→ or Q/E
    const turn = ((keys['ArrowRight'] || keys['e'] || keys['E']) ? 1 : 0) - ((keys['ArrowLeft'] || keys['q'] || keys['Q']) ? 1 : 0);
    if (turn && !(typeof rideState !== 'undefined' && rideState && rideState.manual)) fpYaw += turn * 2.0 * dt;

    if (key === 'seat') {                                        // seated at the restaurant table (dinner-scene.js)
        const r = restaurant3D, me = r.diners.me;
        fpSeatShow(true);
        const v = new THREE.Vector3();
        me.head.getWorldPosition(v);                             // your head (the little you on the cushion); eyes sit a bit forward
        camera.position.set(v.x, v.y + 0.04, v.z + 0.16);
        fpPitch = Math.max(-0.9, Math.min(0.7, fpPitch));
        const cp = Math.cos(fpPitch);
        camera.lookAt(camera.position.x + Math.sin(fpYaw) * cp * 10, camera.position.y + Math.sin(fpPitch) * 10, camera.position.z - Math.cos(fpYaw) * cp * 10);
        return;
    }
    if (key === 'drive') {                                       // behind the wheel: look out of the driver's seat
        const r = rideState;
        fpCockpit(r, true);
        camera.position.set(r.car.position.x - 0.55, 1.62, 0.05);
        fpYaw = Math.max(-1.2, Math.min(1.2, fpYaw)); fpPitch = Math.max(-0.3, Math.min(0.3, fpPitch));
        if (!fpDown) { fpYaw *= 0.94; fpPitch *= 0.94; }                           // let go of the mouse and your eyes go back to the road
        const look = -r.car.rotation.y * 1.2 + fpYaw * 0.35;                     // look a little with the steering (and with a mouse drag)
        camera.lookAt(camera.position.x + Math.sin(look) * 24, 1.28 + Math.sin(fpPitch) * 10, -24);
        if (r.player3D) r.player3D.visible = false;
        return;
    }
    if (playerMesh) playerMesh.visible = false;
    // face the way you look (so the 3D you points the right way if anything shows it)
    const p = playerMesh.position;
    camera.position.set(p.x, p.y + fpEyeHeight(), p.z);
    const cp = Math.cos(fpPitch);
    camera.lookAt(p.x + Math.sin(fpYaw) * cp * 10, p.y + fpEyeHeight() + Math.sin(fpPitch) * 10, p.z - Math.cos(fpYaw) * cp * 10);
}
let fpDragYaw = 0;

// Restaurant: the room has no FRONT wall and no ceiling (the overhead camera looks in from there), which in first person shows as a void.
// So first person adds both (built once, hidden again when first person is off) and hides your own little body so the camera isn't inside it.
function fpSeatShow(on) {
    const r = typeof restaurant3D !== 'undefined' ? restaurant3D : null;
    if (!r) return;
    if (on && !r.fpWalls) {
        const g = new THREE.Group();
        const mk = (w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); m.castShadow = false; g.add(m); };
        mk(20.3, 5.4, 0.3, 0, 2.7, 6.1, 0xF3E5CC);               // front wall
        mk(20.3, 1.4, 0.36, 0, 0.7, 6.08, 0xB0907A);             // its skirting stripe
        mk(20.3, 0.3, 16.4, 0, 5.55, -2, 0xFAF6EE);              // ceiling
        scene.add(g); r.objs.push(g); r.fpWalls = g;              // (objs are removed + disposed when the restaurant is torn down)
    }
    if (r.fpWalls) r.fpWalls.visible = on;
    if (r.diners && r.diners.me && r.diners.me.group.visible === on) r.diners.me.group.visible = !on;
}

// Driver's view: the parts of the car that would block the road are hidden, and a steering wheel + dashboard sit at the bottom of the screen
function fpCockpit(r, on) {
    if (!r || !r.car) return;
    r.car.children.forEach(c => { if (c.userData && c.userData.cockpit) c.visible = !on; });
    if (!r.cockpit) {
        const g = new THREE.Group();
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.55), new THREE.MeshLambertMaterial({ color: 0x1b1b1f }));
        dash.position.set(0, 0.9, -0.82); g.add(dash);
        const wheel = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 22), new THREE.MeshLambertMaterial({ color: 0x111111 }));
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        hub.rotation.x = Math.PI / 2;
        wheel.add(ring, hub);
        [[-0.17, 0], [0.17, 0], [0, -0.17]].forEach(([x, y]) => { const sp = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x) ? 0.16 : 0.03, Math.abs(y) ? 0.16 : 0.03, 0.03), new THREE.MeshLambertMaterial({ color: 0x222222 })); sp.position.set(x / 2, y / 2, 0); wheel.add(sp); });
        wheel.position.set(-0.55, 1.0, -0.5); wheel.rotation.x = -0.75; wheel.scale.setScalar(0.72);
        g.add(wheel); g.userData.wheel = wheel;
        r.car.add(g); r.cockpit = g;
    }
    r.cockpit.visible = on;
    r.cockpit.userData.wheel.rotation.z = -(r.steerNow || 0) * 0.9;
}

function fpSyncButton() {
    const b = document.getElementById('fp-toggle');
    if (b) b.textContent = fpv ? '👁️ 1st person: ON (V)' : '👁️ 1st person: OFF (V)';
}

function toggleFirstPerson() {
    fpv = !fpv;
    try { localStorage.setItem('citylife_fpv', fpv ? '1' : '0'); } catch (e) {}
    fpSceneKey = '';
    if (!fpv && playerMesh) playerMesh.visible = true;
    fpSyncButton();
}

// Called once from initThreeJS (world.js) after the renderer exists
function installFirstPerson() {
    if (!renderer || renderer.__fp) return;
    renderer.__fp = true;
    const orig = renderer.render.bind(renderer);
    renderer.render = (s, c) => { if (typeof rlBeforeRender === 'function') rlBeforeRender(); fpBeforeRender(); orig(s, c); };

    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { fpDown = { x: e.clientX, y: e.clientY, moved: false }; });
    window.addEventListener('pointermove', e => {
        if (!fpDown || !fpActive()) return;
        const dx = e.clientX - fpDown.x, dy = e.clientY - fpDown.y;
        if (!fpDown.moved && Math.hypot(dx, dy) < 5) return;
        fpDown.moved = true; fpDragMoved = true;
        const ls = (typeof clsGet === 'function' ? clsGet('lookSpeed') : 100) / 100;      // ⚙️ Settings: look speed
        fpYaw += dx * 0.005 * ls; fpPitch = Math.max(-0.9, Math.min(0.9, fpPitch - dy * 0.004 * ls));
        fpDown.x = e.clientX; fpDown.y = e.clientY;
    });
    window.addEventListener('pointerup', () => { fpDown = null; });
    cv.addEventListener('click', e => { if (fpDragMoved) { e.stopImmediatePropagation(); fpDragMoved = false; } }, true);
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.key === 'v' || e.key === 'V') toggleFirstPerson();
    });
    if (!document.getElementById('fp-toggle')) {
        const b = document.createElement('button');
        b.id = 'fp-toggle';
        b.style.cssText = 'position:fixed; top:42px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
        b.onclick = toggleFirstPerson;
        document.body.appendChild(b);
    }
    fpSyncButton();
}
