// =============================================
// TRAVEL — car rides. You can't go anywhere on your own: a parent
// drives you. A ride is a short 3D cutscene (a convertible on a sunny
// road — or a snowy road in winter). Call driveTo() with a function to
// run when you arrive. The day clock pauses while the car is moving.
//
// 🚗 GROWN-UPS DRIVE THEMSELVES FOR REAL (opts.self, set automatically from age 18): W/↑ = gas, S/↓ = brake,
// A/D or ←/→ = steer. Other cars share the road — dodge them or you bump (slows you down and costs happiness).
// Kids are still driven by Mom or Dad in the old cutscene.
// 🚦 Traffic lights cycle green/yellow/red — run a red and the red-light camera fines you $20.
// 👮 Police wait by the road: go over the speed limit when you pass one and the siren starts — brake to a stop to take a $20 ticket,
//    ignore it and the fine is $60 and a bad mood.
// =============================================

const CAR_COLORS = [0xE74C3C, 0x3498DB, 0xF1C40F, 0x2ECC71, 0x9B59B6, 0xE67E22];
const RIDE_SPEED = 24;   // how fast the scenery rushes past (units per second)

// Starts a ride. Returns false (and does nothing) if a ride is already
// going, so callers can decide what to do instead.
//   placeText: finishes the sentence "Mom is driving you ..."  (e.g. "to school", "home")
function driveTo(placeText, emoji, onArrive, opts) {
    opts = opts || {};
    if (driving || inStore || !scene || !playerMesh) return false;
    driving = true;

    const duration = opts.duration || 4200;
    const driverName = Math.random() < 0.5 ? 'Mom' : 'Dad';
    if (opts.self === undefined) opts.self = typeof isIndependent === 'function' && isIndependent();   // grown-ups drive themselves
    const snowy = isSnowing();
    const player3D = playerMesh;
    const manual = !!opts.self;                                   // you are behind the wheel

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
    box(7, 0.2, 170, 0, -0.1, -30, 0x2e2e32);                        // the road (dark asphalt)
    box(1.6, 0.16, 170, -4.5, -0.1, -30, 0x9a9a98); box(1.6, 0.16, 170, 4.5, -0.1, -30, 0x9a9a98);       // pavements
    box(0.3, 0.24, 170, -3.7, -0.04, -30, 0xb8b8b4); box(0.3, 0.24, 170, 3.7, -0.04, -30, 0xb8b8b4);     // curbs
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
    // (the sun, moon and stars now come from the real sky in realism.js)
    let rideSnow = null;
    if (snowy) {
        rideSnow = makeSnowPoints(500, 34, 16, 50);
        rideSnow.position.set(0, 0, -15);
        scene.add(rideSnow);
        objects.push(rideSnow);
    }

    // 3. The car (an open convertible — a roof only when it's snowing)
    const { car, wheels } = buildCarModel(snowy);

    // The driver (a parent) and you in the back seat. Everyone's a little smaller so they fit.
    const driver = buildParent(0, 0, driverName === 'Mom' ? 0x4169E1 : 0xC0392B, driverName === 'Mom' ? 0x4B2800 : 0xFFD700);
    scene.remove(driver);
    driver.scale.set(0.7, 0.7, 0.7);
    driver.position.set(-0.55, 0.72, -0.3);
    if (!manual) car.add(driver);                                 // (nobody else drives when it's you)

    const isBabyShape = player.age <= 4; // babies are a capsule, bigger kids are a blocky person
    player3D.scale.set(saved.scale.x * (isBabyShape ? 0.8 : 0.7), saved.scale.y * (isBabyShape ? 0.8 : 0.7), saved.scale.z * (isBabyShape ? 0.8 : 0.7));
    player3D.rotation.set(0, 0, 0);
    if (manual) player3D.position.set(-0.55, 0.72, -0.3); else player3D.position.set(0.5, isBabyShape ? 1.55 : 0.72, 1.1);
    car.add(player3D);

    scene.add(car);
    objects.push(car);

    // 4. The words on top of the screen
    // Manual driving: other cars on the road (you dodge them)
    const traffic = [];
    let headlight = null;
    if (manual) {
        headlight = new THREE.SpotLight(0xfff2d0, 0, 80, 0.6, 0.55, 1.2);      // headlights (they switch on at night — see realism.js)
        headlight.position.set(0, 0.95, -2.3); headlight.target.position.set(0, 0, -34);
        headlight.castShadow = false;
        car.add(headlight); car.add(headlight.target);
        for (let i = 0; i < 8; i++) {
            const t = buildCarModel(snowy).car;
            t.scale.setScalar(0.78);
            const o = { g: t, x: (i % 2 ? 1 : -1) * (1.2 + Math.random() * 1.0), z: -35 - i * 26 - Math.random() * 14, v: 7 + Math.random() * 6 };
            t.position.set(o.x, 0, o.z);
            t.rotation.y = 0;
            scene.add(t); objects.push(t);
            traffic.push(o);
        }
    }
    // Manual driving: traffic lights (every 60-90 m) and police waiting by the road
    const lights = [], traps = [];
    const target = Math.max(170, RIDE_SPEED * duration / 1000 * 2.2);
    if (manual) {
        const mk = (w, h, d, x, y, z, c, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); parent.add(m); return m; };
        for (let L = 55 + Math.random() * 15; L < target - 40; L += 60 + Math.random() * 30) {
            const g = new THREE.Group();
            mk(0.3, 5.6, 0.3, -4.3, 2.8, 0, 0x555555, g); mk(0.3, 5.6, 0.3, 4.3, 2.8, 0, 0x555555, g); mk(8.9, 0.3, 0.3, 0, 5.6, 0, 0x555555, g);
            mk(7, 0.03, 0.5, 0, 0.03, 2.2, 0xffffff, g);                                   // the stop line
            for (let k = -3; k <= 3; k++) mk(0.55, 0.03, 2.2, k * 0.95, 0.03, -0.4, 0xf2f2f2, g);   // the zebra crossing
            const lamps = [];
            [-1.7, 1.7].forEach(x => {
                mk(0.8, 1.9, 0.4, x, 4.55, 0, 0x222222, g);
                [0xff2a2a, 0xffc400, 0x2aff55].forEach((c, i) => {
                    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.1), new THREE.MeshBasicMaterial({ color: 0x333333 }));
                    lamp.position.set(x, 5.15 - i * 0.55, 0.22); lamp.userData.on = c; g.add(lamp); lamps.push(lamp);
                });
            });
            g.position.set(0, 0, -L);
            scene.add(g); objects.push(g);
            lights.push({ g, lamps, L, offset: Math.random() * 12, passed: false });
        }
        for (let L = 40 + Math.random() * 30; L < target - 30; L += 70 + Math.random() * 50) {
            const cop = buildCarModel(false).car;
            cop.children[0].material.color.setHex(0xF5F5F5);                                    // white body
            const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0x2255ff }));
            bar.position.set(0, 1.9, 0); cop.add(bar);
            cop.scale.setScalar(0.8);
            cop.position.set(L % 2 < 1 ? 5.4 : -5.4, 0, -L);
            scene.add(cop); objects.push(cop);
            traps.push({ g: cop, bar, L, passed: false });
        }
    }
    const overlay = document.createElement('div');
    overlay.id = 'ride-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:250; pointer-events:none; font-family:Arial;';
    overlay.innerHTML = manual ? `
        <div style="position:absolute; top:62px; left:0; right:0; text-align:center;">
            <span style="display:inline-block; background:rgba(22,33,62,0.88); border:2px solid #f39c12; color:#fff; padding:8px 20px; border-radius:14px;">
                ${emoji} You drive ${placeText} &nbsp;·&nbsp; <b>W/↑</b> gas &nbsp; <b>S/↓</b> brake &nbsp; <b>A/D ←/→</b> steer</span>
            <div style="width:min(420px,80vw); height:10px; background:rgba(0,0,0,0.5); border-radius:6px; margin:8px auto 0; overflow:hidden;"><div id="drive-prog" style="height:100%; width:0; background:#2ecc71;"></div></div>
            <div id="drive-info" style="color:#fff; font-weight:bold; margin-top:4px; text-shadow:0 1px 3px #000;">0 km/h</div>
        </div>
        <button onclick="endRide()" style="pointer-events:auto; position:absolute; bottom:110px; right:24px;
                background:#0f3460; color:#fff; border:2px solid #3498db; border-radius:10px;
                padding:8px 16px; font-size:1em; cursor:pointer;">⏭ Skip</button>` : `
        <div style="position:absolute; top:70px; left:0; right:0; text-align:center;">
            <span style="display:inline-block; background:rgba(22,33,62,0.88); border:2px solid #f39c12; color:#fff;
                         padding:10px 22px; border-radius:14px; font-size:1.2em;">
                ${emoji} ${opts.self ? 'You drive' : driverName + ' is driving you'} ${placeText}...
            </span>
        </div>
        <button onclick="endRide()" style="pointer-events:auto; position:absolute; bottom:110px; right:24px;
                background:#0f3460; color:#fff; border:2px solid #3498db; border-radius:10px;
                padding:8px 16px; font-size:1em; cursor:pointer;">⏭ Skip</button>`;
    document.body.appendChild(overlay);

    rideState = {
        player3D, saved, stash, clickables, objects, scenery, wheels, car, rideSnow,
        onArrive, start: Date.now(), duration,
        manual, traffic, lights, traps, headlight, speed: 0, carX: 0, dist: 0, target, crashes: 0, crashCool: 0, shake: 0, chase: null, fines: 0,
        // A backup timer ends the ride even if the screen isn't being drawn (e.g. a hidden tab)
        timer: setTimeout(endRide, manual ? 180000 : duration)
    };
    return true;
}

// Builds a car out of boxes and wheels. Used for the ride (driveTo) and for the car
// parked outside the grocery store (store.js). Returns { car, wheels }.
function buildCarModel(snowy) {
    const car = new THREE.Group();
    function box(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        car.add(m);
        return m;
    }
    const bodyColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    box(2.2, 0.6, 4.4, 0, 0.55, 0, bodyColor);          // the body
    box(2.0, 0.35, 1.4, 0, 0.98, -1.7, bodyColor);      // the hood
    box(0.7, 0.45, 0.7, -0.55, 0.95, -0.35, 0x34495E);  // front seats
    box(0.7, 0.45, 0.7,  0.55, 0.95, -0.35, 0x34495E);
    box(0.7, 0.6, 0.12, -0.55, 1.3, 0.05, 0x34495E);    // front seat backs
    box(0.7, 0.6, 0.12,  0.55, 1.3, 0.05, 0x34495E);
    box(2.0, 0.45, 0.7, 0, 0.95, 1.1, 0x34495E);        // back seat
    box(2.0, 0.7, 0.12, 0, 1.3, 1.5, 0x34495E);         // back seat back
    box(2.0, 0.7, 0.1, 0, 1.3, -0.95, 0xAEE6FF).rotation.x = -0.35;   // windshield
    box(0.5, 0.05, 0.5, -0.55, 1.35, -0.8, 0x222222);   // steering wheel
    box(0.4, 0.2, 0.08,  0.7, 0.62, -2.2, 0xFFF59D);    // headlights
    box(0.4, 0.2, 0.08, -0.7, 0.62, -2.2, 0xFFF59D);
    box(0.4, 0.2, 0.08,  0.7, 0.62,  2.2, 0xC0392B);    // tail lights
    box(0.4, 0.2, 0.08, -0.7, 0.62,  2.2, 0xC0392B);
    if (snowy) {
        [[-1.0, -0.9], [1.0, -0.9], [-1.0, 1.5], [1.0, 1.5]].forEach(([x, z]) => box(0.1, 1.0, 0.1, x, 1.5, z, 0x555555));
        box(2.4, 0.12, 2.9, 0, 2.05, 0.3, 0xFFFFFF);    // snowy roof
    }
    car.children.forEach(c => {                                     // parts that would block the driver's view (hidden in first person)
        const p = c.position;
        if ((p.y === 0.95 && p.z === -0.35) || (p.y === 1.3 && p.z === 0.05) || (p.y === 1.3 && p.z === -0.95) || (p.y === 1.35 && p.z === -0.8)) c.userData.cockpit = true;
    });
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
    return { car, wheels };
}

// Called every frame from animate() while driving: makes the scenery rush past.
function updateCarRide() {
    const r = rideState;
    if (!r) return;
    const now = Date.now();
    const elapsed = now - r.start;
    const dt = Math.min(0.05, (now - (r.last || now)) / 1000);
    r.last = now;

    if (r.manual) { updateManualDrive(r, dt, elapsed); return; }

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

// You're driving: gas, brake, steer. Other cars move slower than you, so you catch up and have to go around.
function updateManualDrive(r, dt, elapsed) {
    const up = keys['ArrowUp'] || keys['w'] || keys['W'], down = keys['ArrowDown'] || keys['s'] || keys['S'];
    const left = keys['ArrowLeft'] || keys['a'] || keys['A'], right = keys['ArrowRight'] || keys['d'] || keys['D'];
    const maxSpeed = isSnowing() ? 24 : 30;
    if (up) r.speed += 15 * dt; else r.speed -= (down ? 32 : 3.5) * dt;
    r.speed = Math.max(0, Math.min(maxSpeed, r.speed));
    const steer = (right ? 1 : 0) - (left ? 1 : 0);
    r.carX += steer * (3.2 + r.speed * 0.1) * dt * (r.speed > 0.5 ? 1 : 0.3);
    r.carX = Math.max(-2.7, Math.min(2.7, r.carX));
    const move = r.speed * dt;
    r.dist += move;
    r.crashCool = Math.max(0, r.crashCool - dt);
    r.shake = Math.max(0, r.shake - dt);

    r.scenery.forEach(s => {
        s.obj.position.z += move * s.drift;
        if (s.obj.position.z > 22) s.obj.position.z -= 100;
    });
    r.wheels.forEach(w => { w.rotation.x -= move / 0.42; });
    r.car.position.x += (r.carX - r.car.position.x) * 0.4;
    r.car.rotation.y += (-steer * 0.18 - r.car.rotation.y) * 0.2;
    r.car.position.y = Math.sin(elapsed * 0.02) * 0.012 * Math.min(1, r.speed / 10);

    // the other cars crawl along; you overtake them
    r.traffic.forEach(o => {
        o.z += (r.speed - o.v) * dt;
        if (o.z > 14) { o.z = -110 - Math.random() * 50; o.x = (Math.random() < 0.5 ? -1 : 1) * (1.0 + Math.random() * 1.4); o.v = 7 + Math.random() * 6; }
        o.g.position.set(o.x, 0, o.z);
        if (!r.crashCool && Math.abs(o.x - r.carX) < 1.75 && Math.abs(o.z) < 3.6) {          // BUMP
            r.crashes++; r.crashCool = 1.0; r.shake = 0.5;
            r.speed = Math.min(r.speed, 3);
            o.z -= 9;
            showEvent('💥', 'Bump! Watch the road!');
        }
    });

    const SPEED_LIMIT = 22;                                              // units/s (= 88 km/h)
    const clock = elapsed / 1000;
    // traffic lights: green 6 s, yellow 1.5 s, red 4.5 s
    r.nextLight = null;
    r.lights.forEach(l => {
        const ph = (clock + l.offset) % 12;
        l.state = ph < 6 ? 'green' : ph < 7.5 ? 'yellow' : 'red';
        l.lamps.forEach(lp => { const i = lp.position.y > 5 ? 0 : lp.position.y > 4.6 ? 1 : 2; const lit = (i === 0 && l.state === 'red') || (i === 1 && l.state === 'yellow') || (i === 2 && l.state === 'green'); lp.material.color.setHex(lit ? lp.userData.on : 0x333333); });
        l.g.position.z = r.dist - l.L;
        if (!l.passed && l.g.position.z > -2.2) {                       // you crossed the stop line
            l.passed = true;
            if (l.state === 'red' && r.speed > 2) {
                const fine = Math.min(20, Math.max(0, player.money));
                player.money -= fine; r.fines += fine;
                if (typeof updateStats === 'function') updateStats();
                showEvent('📸', `You ran a red light! The camera flashed — fine $${fine}.`);
            }
        } else if (!l.passed && !r.nextLight) r.nextLight = l;
    });
    // police by the road
    r.traps.forEach(t => {
        t.g.position.z = r.dist - t.L;
        t.bar.material.color.setHex(Math.floor(clock * 6) % 2 ? 0xff2a2a : 0x2255ff);
        if (!t.passed && t.g.position.z > -3) {
            t.passed = true;
            if (r.speed > SPEED_LIMIT + 1 && !r.chase) {
                r.chase = { t: 6, car: t.g };
                showEvent('🚨', 'Speeding! The police are after you — brake to a stop and pull over!');
            }
        }
    });
    if (r.chase) {
        const c = r.chase;
        c.t -= dt;
        c.car.position.set(r.carX * 0.8, 0, 7 + Math.max(0, c.t) * 0.3);        // right behind you with the siren on
        c.car.rotation.y = 0;
        if (r.speed < 1.5) {
            const fine = Math.min(20, Math.max(0, player.money)); player.money -= fine; r.fines += fine;
            showEvent('👮', `The officer wrote you a speeding ticket: $${fine}. "Drive safely!"`);
            r.chase = null; c.car.position.z = -r.target - 50 + r.dist;
        } else if (c.t <= 0) {
            const fine = Math.min(60, Math.max(0, player.money)); player.money -= fine; r.fines += fine;
            player.happiness = Math.max(0, player.happiness - 5);
            showEvent('🚔', `You didn't pull over! The police caught you: fine $${fine}, and you feel awful.`);
            r.chase = null; c.car.position.z = -r.target - 50 + r.dist;
        }
        if (typeof updateStats === 'function') updateStats();
    }

    if (r.rideSnow) {
        const arr = r.rideSnow.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
            arr[i + 1] -= 0.06 + ((i / 3) % 5) * 0.01;
            arr[i + 2] += move * 0.9;
            if (arr[i + 1] < 0) arr[i + 1] = 16;
            if (arr[i + 2] > 25) arr[i + 2] -= 50;
        }
        r.rideSnow.geometry.attributes.position.needsUpdate = true;
    }

    const prog = document.getElementById('drive-prog');
    if (prog) prog.style.width = Math.min(100, r.dist / r.target * 100) + '%';
    const info = document.getElementById('drive-info');
    if (info) {
        const nl = r.nextLight, ahead = nl ? Math.round(nl.L - r.dist) : 0;
        info.innerHTML = `${Math.round(r.speed * 4)} km/h <span style="opacity:0.8">(limit 88)</span> · ${Math.max(0, Math.round(r.target - r.dist))} m to go${r.crashes ? ' · 💥 ' + r.crashes : ''}`
            + (r.chase ? `<br><span style="color:#ff6b6b">🚨 POLICE! Brake to a stop! ${Math.max(0, Math.ceil(r.chase.t))}s</span>` : nl && ahead < 60 ? `<br>🚦 ${nl.state === 'red' ? '🔴 RED' : nl.state === 'yellow' ? '🟡 yellow' : '🟢 green'} light in ${ahead} m` : '');
    }

    // chase camera behind the car (first person is handled in firstperson.js, which moves the camera to the driver's seat)
    const sh = (typeof clsGet === 'function' && !clsGet('shake') ? 0 : r.shake) * (Math.random() - 0.5) * 0.6;     // ⚙️ Settings: camera shake
    camera.position.set(r.car.position.x * 0.6 + sh, 3.7 + sh * 0.5, 8.2);
    camera.lookAt(r.car.position.x * 0.8, 1.0, -9);
    r.steerNow = (right ? 1 : 0) - (left ? 1 : 0);
    renderer.render(scene, camera);
    if (r.dist >= r.target) endRide();
}

// Frees the memory a 3D object uses (we build a fresh road for every ride).
function disposeTree(obj) {
    obj.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
            if (m.map) m.map.dispose();      // sign textures (store.js)
            m.dispose();
        });
        if (o.isInstancedMesh) o.dispose();  // the store's crowd (store.js)
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
    if (r.manual && r.fines) setTimeout(() => { if (typeof showEvent === 'function') showEvent('🧾', `Fines on this trip: $${r.fines}.`); }, 300);
    if (r.manual && r.crashes) {
        player.happiness = Math.max(0, player.happiness - Math.min(6, r.crashes * 2));
        if (typeof updateStats === 'function') updateStats();
    }
    if (r.onArrive) r.onArrive();
}
