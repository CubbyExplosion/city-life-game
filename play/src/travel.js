// =============================================
// TRAVEL — car rides. You can't go anywhere on your own: a parent
// drives you. A ride is a short 3D cutscene (a convertible on a sunny
// road — or a snowy road in winter). Call driveTo() with a function to
// run when you arrive. The day clock pauses while the car is moving.
// =============================================

const CAR_COLORS = [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71, 0x9B59B6, 0xE67E22];
const RIDE_SPEED = 24;   // how fast the scenery rushes past (units per second)

// Starts a ride. Returns false (and does nothing) if a ride is already
// going, so callers can decide what to do instead.
//   placeText: finishes the sentence "Mom is driving you ..."  (e.g. "to school", "home")
function driveTo(placeText, emoji, onArrive, opts) {
    opts = opts || {};
    if (driving || !scene || !playerMesh) return false;
    driving = true;

    const duration = opts.duration || 4200;
    const driverName = Math.random() < 0.5 ? 'Mom' : 'Dad';
    const snowy = isSnowing();
    const player3D = playerMesh;

    // 1. Put the current scene away (we bring it all back when we arrive)
    const stash = [];
    scene.children.slice().forEach(obj => {
        if (obj.type !== 'AmbientLight' && obj.type !== 'DirectionalLight') {
            stash.push(obj);
            scene.remove(obj);
        }
    });
    const clickables = clickableNPCs.slice();
    clickableNPCs.length = 0; // nothing in the road can be clicked
    const saved = {
        bg: scene.background,
        pos: player3D.position.clone(), rot: player3D.rotation.clone(), scale: player3D.scale.clone()
    };
    scene.background = new THREE.Color(snowy ? 0xcfdcea : 0x87ceeb);

    // 2. Build the road world
    const objects = [];     // everything we add (so endRide() can remove it)
    const scenery = [];     // things that rush past: { obj, drift } — drift = how fast compared to the road
    function box(w, h, d, x, y, z, color, parent) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        (parent || scene).add(m);
        if (!parent) objects.push(m);
        return m;
    }
    box(90, 0.2, 170, 0, -0.2, -30, snowy ? 0xf2f7ff : 0x5DBB4A);   // grass (or snow)
    box(7, 0.2, 170, 0, -0.1, -30, 0x3b3b3b);                        // the road
    box(0.18, 0.21, 170, -3.4, -0.09, -30, 0xdddddd);                // road edges
    box(0.18, 0.21, 170,  3.4, -0.09, -30, 0xdddddd);

    function addScenery(group, drift) {
        scene.add(group);
        objects.push(group);
        scenery.push({ obj: group, drift: drift || 1 });
    }
    // dashes down the middle of the road
    for (let z = -80; z < 30; z += 5) {
        const g = new THREE.Group();
        box(0.25, 0.02, 2.2, 0, 0.01, 0, 0xffffff, g);
        g.position.z = z;
        addScenery(g);
    }
    // trees, houses and street lamps on both sides
    for (let i = 0; i < 16; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const g = new THREE.Group();
        if (i % 4 === 1) { // a house
            const wall = [0xF5CBA7, 0xAED6F1, 0xD7BDE2, 0xF9E79F][i % 4 === 1 ? (i >> 2) % 4 : 0];
            box(3.4, 2.2, 3, 0, 1.1, 0, wall, g);
            box(3.8, 0.5, 3.4, 0, 2.45, 0, snowy ? 0xffffff : 0xB03A2E, g);
            box(0.6, 1.1, 0.1, 0, 0.55, side * -1.55, 0x6D4C41, g);
            g.position.x = side * (9 + Math.random() * 3);
        } else if (i % 4 === 3) { // a street lamp
            box(0.15, 3.2, 0.15, 0, 1.6, 0, 0x555555, g);
            box(0.5, 0.3, 0.5, 0, 3.3, 0, 0xFFF59D, g);
            g.position.x = side * 4.3;
        } else { // a tree
            box(0.5, 1.8, 0.5, 0, 0.9, 0, 0x6D4C41, g);
            box(2.2, 2.0, 2.2, 0, 2.7, 0, snowy ? 0x2E6B3A : 0x2E8B3C, g);
            box(1.4, 1.2, 1.4, 0, 4.0, 0, snowy ? 0xFFFFFF : 0x38A04A, g);
            g.position.x = side * (6 + Math.random() * 7);
        }
        g.position.z = -75 + i * 5.2;
        addScenery(g);
    }
    // clouds (drift slowly) and the sun
    for (let i = 0; i < 7; i++) {
        const g = new THREE.Group();
        box(4 + Math.random() * 3, 0.9, 2, 0, 0, 0, snowy ? 0xe3e9ef : 0xffffff, g);
        g.position.set((Math.random() - 0.5) * 70, 13 + Math.random() * 4, -70 + i * 11);
        addScenery(g, 0.12);
    }
    if (!snowy) {
        const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFE066 }));
        sun.position.set(-22, 22, -55);
        scene.add(sun);
        objects.push(sun);
    }
    let rideSnow = null;
    if (snowy) {
        rideSnow = makeSnowPoints(500, 34, 16, 50);
        rideSnow.position.set(0, 0, -15);
        scene.add(rideSnow);
        objects.push(rideSnow);
    }

    // 3. The car (an open convertible — a roof only when it's snowing)
    const car = new THREE.Group();
    const bodyColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    box(2.2, 0.6, 4.4, 0, 0.55, 0, bodyColor, car);          // the body
    box(2.0, 0.35, 1.4, 0, 0.98, -1.7, bodyColor, car);      // the hood
    box(0.7, 0.45, 0.7, -0.55, 0.95, -0.35, 0x34495E, car);  // front seats
    box(0.7, 0.45, 0.7,  0.55, 0.95, -0.35, 0x34495E, car);
    box(0.7, 0.6, 0.12, -0.55, 1.3, 0.05, 0x34495E, car);    // front seat backs
    box(0.7, 0.6, 0.12,  0.55, 1.3, 0.05, 0x34495E, car);
    box(2.0, 0.45, 0.7, 0, 0.95, 1.1, 0x34495E, car);        // back seat
    box(2.0, 0.7, 0.12, 0, 1.3, 1.5, 0x34495E, car);         // back seat back
    const windshield = box(2.0, 0.7, 0.1, 0, 1.3, -0.95, 0xAEE6FF, car);
    windshield.rotation.x = -0.35;
    box(0.5, 0.05, 0.5, -0.55, 1.35, -0.8, 0x222222, car);   // steering wheel
    box(0.4, 0.2, 0.08,  0.7, 0.62, -2.2, 0xFFF59D, car);    // headlights
    box(0.4, 0.2, 0.08, -0.7, 0.62, -2.2, 0xFFF59D, car);
    box(0.4, 0.2, 0.08,  0.7, 0.62,  2.2, 0xC0392B, car);    // tail lights
    box(0.4, 0.2, 0.08, -0.7, 0.62,  2.2, 0xC0392B, car);
    if (snowy) {
        [[-1.0, -0.9], [1.0, -0.9], [-1.0, 1.5], [1.0, 1.5]].forEach(([x, z]) => box(0.1, 1.0, 0.1, x, 1.5, z, 0x555555, car));
        box(2.4, 0.12, 2.9, 0, 2.05, 0.3, 0xFFFFFF, car);    // snowy roof
    }
    const wheels = [];
    [[-1.15, -1.4], [1.15, -1.4], [-1.15, 1.4], [1.15, 1.4]].forEach(([x, z]) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, 0.42, z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        tire.rotation.z = Math.PI / 2;
        const hub = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.18), new THREE.MeshLambertMaterial({ color: 0xBDC3C7 }));
        pivot.add(tire, hub);
        car.add(pivot);
        wheels.push(pivot);
    });

    // The driver (a parent) and you in the back seat. Everyone's a little smaller so they fit.
    const driver = buildParent(0, 0, driverName === 'Mom' ? 0x4169E1 : 0xC0392B, driverName === 'Mom' ? 0x4B2800 : 0xFFD700);
    scene.remove(driver);
    driver.scale.set(0.7, 0.7, 0.7);
    driver.position.set(-0.55, 0.72, -0.3);
    car.add(driver);

    const isBabyShape = player.age <= 4; // babies are a capsule, bigger kids are a blocky person
    player3D.scale.set(saved.scale.x * (isBabyShape ? 0.8 : 0.7), saved.scale.y * (isBabyShape ? 0.8 : 0.7), saved.scale.z * (isBabyShape ? 0.8 : 0.7));
    player3D.rotation.set(0, 0, 0);
    player3D.position.set(0.5, isBabyShape ? 1.55 : 0.72, 1.1);
    car.add(player3D);

    scene.add(car);
    objects.push(car);

    // 4. The words on top of the screen
    const overlay = document.createElement('div');
    overlay.id = 'ride-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:250; pointer-events:none; font-family:Arial;';
    overlay.innerHTML = `
        <div style="position:absolute; top:70px; left:0; right:0; text-align:center;">
            <span style="display:inline-block; background:rgba(22,33,62,0.88); border:2px solid #f39c12; color:#fff;
                         padding:10px 22px; border-radius:14px; font-size:1.2em;">
                ${emoji} ${driverName} is driving you ${placeText}...
            </span>
        </div>
        <button onclick="endRide()" style="pointer-events:auto; position:absolute; bottom:110px; right:24px;
                background:#0f3460; color:#fff; border:2px solid #3498db; border-radius:10px;
                padding:8px 16px; font-size:1em; cursor:pointer;">⏭ Skip</button>`;
    document.body.appendChild(overlay);

    rideState = {
        player3D, saved, stash, clickables, objects, scenery, wheels, car, rideSnow,
        onArrive, start: Date.now(), duration,
        // A backup timer ends the ride even if the screen isn't being drawn (e.g. a hidden tab)
        timer: setTimeout(endRide, duration)
    };
    return true;
}

// Called every frame from animate() while driving: makes the scenery rush past.
function updateCarRide() {
    const r = rideState;
    if (!r) return;
    const now = Date.now();
    const elapsed = now - r.start;
    const dt = Math.min(0.05, (now - (r.last || now)) / 1000);
    r.last = now;

    // speed up at the start, slow down when we're almost there
    const speedFactor = Math.max(0.08, Math.min(1, elapsed / 600, (r.duration - elapsed) / 700));
    const move = RIDE_SPEED * speedFactor * dt;

    r.scenery.forEach(s => {
        s.obj.position.z += move * s.drift;
        if (s.obj.position.z > 22) s.obj.position.z -= 100;   // loop back to the far distance
    });
    r.wheels.forEach(w => { w.rotation.x -= move / 0.42; });
    r.car.position.y = Math.sin(elapsed * 0.02) * 0.012;      // a little engine bounce

    if (r.rideSnow) {
        const arr = r.rideSnow.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
            arr[i + 1] -= 0.06 + ((i / 3) % 5) * 0.01;
            arr[i + 2] += move * 0.9;                          // the flakes rush past too
            if (arr[i + 1] < 0) arr[i + 1] = 16;
            if (arr[i + 2] > 25) arr[i + 2] -= 50;
        }
        r.rideSnow.geometry.attributes.position.needsUpdate = true;
    }

    const t = elapsed / 1000;
    camera.position.set(7.5 + Math.sin(t * 0.7) * 0.8, 3.4 + Math.sin(t * 1.3) * 0.15, 6.5);
    camera.lookAt(0, 1.0, -0.5);
    renderer.render(scene, camera);
}

// Frees the memory a 3D object uses (we build a fresh road for every ride).
function disposeTree(obj) {
    obj.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
}

// Ends the ride (it finishes on its own, or you press Skip).
function endRide() {
    const r = rideState;
    if (!driving || !r) return;
    rideState = null;
    clearTimeout(r.timer);
    const overlay = document.getElementById('ride-overlay');
    if (overlay) overlay.remove();

    // Take you out of the car FIRST — otherwise cleaning up the car would delete you too
    r.car.remove(r.player3D);
    r.player3D.position.copy(r.saved.pos);
    r.player3D.rotation.copy(r.saved.rot);
    r.player3D.scale.copy(r.saved.scale);

    r.objects.forEach(obj => { scene.remove(obj); disposeTree(obj); });
    scene.background = r.saved.bg;

    // Put the old scene (house, classroom...) back exactly as it was
    r.stash.forEach(obj => scene.add(obj));
    clickableNPCs.length = 0;
    r.clickables.forEach(c => clickableNPCs.push(c));

    lastDayTime += Date.now() - r.start; // the day clock was paused for the whole ride
    driving = false;
    if (r.onArrive) r.onArrive();
}
