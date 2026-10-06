// =============================================
// HOME WALLS — closes the gaps in your home for first-person view.
//
// The house and the three apartments are built WITHOUT a front wall and WITHOUT a ceiling, so the old
// bird's-eye camera can look down into the room. In first person that shows up as giant gaps (you see the void
// where the front wall and ceiling should be). So every home also gets a front wall (with the door left in it)
// and a ceiling — but they are only SHOWN while first-person view is on and you are at home. Switch first person
// off (V) and the room is open again for the bird's-eye camera.
//
// How: buildHome() (world.js, already wrapped by lights.js) is wrapped once more to add the group; every 100 ms
// hwSync() shows/hides it. Neither piece casts shadows, so the sun still reaches the room.
// =============================================

let hwGroup = null;

function hwWallColor() {
    const id = typeof player !== 'undefined' && player && player.home ? player.home.id : null;
    return id === 'loft' ? 0x8D99AE : id === 'flat' ? 0xF2E3C6 : id === 'studio' ? 0xE8DCC8 : 0xB0C4DE;   // same as the side walls
}

function hwBuild() {
    if (typeof scene === 'undefined' || !scene) return;
    const g = new THREE.Group();
    const wallColor = hwWallColor();
    const add = (w, h, d, x, y, z, color) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        m.castShadow = false; m.receiveShadow = true;
        g.add(m);
    };
    // front wall (z = 5) with a doorway where the door is (x 1.5 .. 2.5, 2.2 high — the door itself is already there)
    add(6.5, 3, 0.2, -1.75, 1.5, 5, wallColor);          // left of the door
    add(2.5, 3, 0.2, 3.75, 1.5, 5, wallColor);           // right of the door
    add(1.0, 0.8, 0.2, 2.0, 2.6, 5, wallColor);          // above the door
    add(10, 0.18, 0.2, 0, 0.09, 4.95, 0xFFFFFF);         // skirting board along the front
    // ceiling
    add(10.2, 0.2, 10.2, 0, 3.1, 0, 0xF4F1EA);
    // a ceiling lamp: white shade + a glowing bulb (its colour makes realism.js treat it as a lamp: halo + a real light that falls off with
    // distance; rlLampK makes it gentler than a street lamp). It goes dark when you switch the lights off (lights.js).
    add(0.9, 0.06, 0.9, 0, 3.03, 0, 0xFFFFFF);
    add(0.5, 0.2, 0.5, 0, 2.93, 0, 0xFAFAFA);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }));
    bulb.position.set(0, 2.82, 0); bulb.castShadow = false; bulb.userData.rlLampK = 0.3;
    if (bulb.userData.rlHalo) bulb.userData.rlHalo.scale.set(1.5, 1.5, 1);          // (a street lamp's glow is much too big for a room)
    g.add(bulb);
    g.visible = false;
    scene.add(g);
    hwGroup = g;
}

// every freshly built home gets the walls (chained after lights.js's wrapper)
if (typeof buildHome === 'function') {
    const hwOrigBuildHome = buildHome;
    buildHome = function () { hwOrigBuildHome.apply(this, arguments); hwBuild(); };
}

// show only for first person at home (house or apartment), hide for the bird's-eye view / school / outdoors
function hwSync() {
    if (!hwGroup) return;
    const want = typeof fpActive === 'function' && fpActive() && typeof lgAtHome === 'function' && lgAtHome();
    if (hwGroup.visible !== want) hwGroup.visible = want;
}
setInterval(hwSync, 100);
