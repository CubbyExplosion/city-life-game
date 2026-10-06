// =============================================
// SWITCHABLE LIGHTS — turn the lights in your home on and off.
//
//   There is a light switch on the door frame (right next to the front door) in the family house AND in all
//   three apartments. Press L, click the switch, or use the 💡 button (shown only at home) to flip it.
//   Lights ON: a warm, bright room and the lamps glow at night. Lights OFF: a dark blue room lit only by the
//   moon / sky, lamps dark. In daytime it hardly changes anything — it is a cosy effect, not a gameplay one.
//   (Babies can't reach the switch, so the lights stay on until you are 3.) The choice is remembered.
//
// How: buildHome() (world.js) is wrapped so every freshly built home also gets the switch. The actual dimming is
// done in realism.js (rlBeforeRender / rlNightLights), which asks lgAtHome() / lgOn() each frame.
// =============================================

let lgLightsOn = true;
try { if (localStorage.getItem('citylife_homelights') === '0') lgLightsOn = false; } catch (e) {}
let lgSwitch = null;                 // the switch's 3D group (so clicks can find it)

// Are you standing in your own home right now (not school, not outside, not in a ride / shop / mall / workplace)?
function lgAtHome() {
    if (typeof player === 'undefined' || !player || player.age < 3) return false;
    if (typeof inSchool !== 'undefined' && inSchool) return false;
    if (typeof inField !== 'undefined' && inField) return false;
    if (typeof fpSceneKeyNow === 'function') return fpSceneKeyNow() === 'home';
    return !(typeof driving !== 'undefined' && driving);
}
function lgOn() { return lgLightsOn; }
function lgHomeOff() { return !lgLightsOn && lgAtHome(); }      // realism.js: "should this home be dark?"

function lgToggle() {
    lgLightsOn = !lgLightsOn;
    try { localStorage.setItem('citylife_homelights', lgLightsOn ? '1' : '0'); } catch (e) {}
    lgSyncSwitch();
    if (typeof soundClick === 'function') soundClick();
    lgSyncButton();
}

function lgSyncSwitch() {
    if (!lgSwitch) return;
    const nub = lgSwitch.userData.nub, dot = lgSwitch.userData.dot;
    nub.rotation.x = lgLightsOn ? -0.5 : 0.5;
    dot.material.color.setHex(lgLightsOn ? 0x33cc66 : 0x777777);
}
function lgSyncButton() {
    const b = document.getElementById('lights-toggle');
    if (!b) return;
    b.style.display = lgAtHome() ? 'block' : 'none';
    b.textContent = lgLightsOn ? '💡 Lights: ON (L)' : '🌙 Lights: OFF (L)';
}

// the post, the plate and the little toggle, on the door frame next to the front door (door: x 2, z 4.92)
function lgBuildSwitch() {
    if (typeof scene === 'undefined' || !scene) return;
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), new THREE.MeshLambertMaterial({ color: 0xF2F2F2 }));
    post.position.set(0, 1.15, 0.08);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.03), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
    plate.position.set(0, 1.35, -0.015);
    const nub = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.05), new THREE.MeshLambertMaterial({ color: 0xDDDDDD }));
    nub.position.set(0, 1.35, -0.05);
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0x33cc66 }));   // status light
    dot.position.set(0, 1.5, -0.035);
    [post, plate, nub, dot].forEach(m => g.add(m));
    g.position.set(1.3, 0, 4.78);
    g.userData.lgSwitch = true; g.userData.nub = nub; g.userData.dot = dot;
    scene.add(g);
    lgSwitch = g;
    lgSyncSwitch();
}

// every freshly built home gets the switch (world.js buildHome → house or apartment)
if (typeof buildHome === 'function') {
    const lgOrigBuildHome = buildHome;
    buildHome = function () { lgOrigBuildHome.apply(this, arguments); lgBuildSwitch(); };
}

function installLights() {
    const b = document.createElement('button');
    b.id = 'lights-toggle';
    b.style.cssText = 'display:none; position:fixed; top:132px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
    b.onclick = () => { if (lgAtHome()) lgToggle(); };
    document.body.appendChild(b);
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if ((e.key === 'l' || e.key === 'L') && lgAtHome()) lgToggle();
    });
    // click the switch itself (within arm's reach)
    window.addEventListener('click', e => {
        if (!lgSwitch || typeof renderer === 'undefined' || !renderer || e.target !== renderer.domElement || !lgAtHome()) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
        if (ray.intersectObject(lgSwitch, true).length) {
            const p = playerMesh ? playerMesh.position : null;
            if (!p || Math.hypot(p.x - lgSwitch.position.x, p.z - lgSwitch.position.z) < 4.5) lgToggle();
            else if (typeof showEvent === 'function') showEvent('💡', 'Walk closer to the light switch (or press L).');
        }
    });
    setInterval(lgSyncButton, 400);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLights); else installLights();
