// =============================================
// WORLD — the 3D scene: building rooms/characters, the render loop,
// and turning arrow/WASD key presses into player movement.
// =============================================

const keys = {};
document.addEventListener('keydown', e => { if (e.target.tagName !== 'INPUT') keys[e.key] = true; });
document.addEventListener('keyup',   e => { if (e.target.tagName !== 'INPUT') keys[e.key] = false; });

function initThreeJS() {
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 7, 7);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Click on 3D NPCs using a raycaster
    const raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width)  *  2 - 1,
           -((e.clientY - rect.top)  / rect.height) *  2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(clickableNPCs, true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj && !obj.userData.npcData) obj = obj.parent;
            if (obj && obj.userData.npcData) interactWithNPC(obj.userData.npcData);
        }
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfffde0, 1.0);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;
    scene.add(sun);

    buildHome();
    buildPlayer();
    buildBabyProps();
    animate();
}

// =============================================
// BABY PROPS — milk bottle + diaper (hidden until triggered)
// =============================================

function buildBabyProps() {
    // Milk bottle — cylinder body + yellow top
    const bottleGroup = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.45, 10),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.1, 0.15, 10),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    );
    top.position.y = 0.3;
    bottleGroup.add(body);
    bottleGroup.add(top);
    bottleGroup.position.set(-3, 1.6, 0);
    bottleGroup.visible = false;
    scene.add(bottleGroup);
    milkMesh = bottleGroup;

    // Diaper — white folded shape
    diaperMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.4),
        new THREE.MeshLambertMaterial({ color: 0xEEEEFF })
    );
    diaperMesh.position.set(-3, 1.6, 0);
    diaperMesh.visible = false;
    scene.add(diaperMesh);
}

// =============================================
// BUILD PARENT — returns a moveable group
// =============================================

function buildParent(x, z, shirtColor, hairColor) {
    const group = new THREE.Group();

    function part(w, h, d, px, py, pz, color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px, py, pz);
        m.castShadow = true;
        group.add(m);
    }

    part(0.45, 0.28, 0.38,  0, 0.58, 0, 0x333366);   // legs
    part(0.45, 0.60, 0.38,  0, 0.98, 0, shirtColor);  // body
    part(0.38, 0.38, 0.38,  0, 1.42, 0, 0xFFCBA4);    // head
    part(0.40, 0.18, 0.40,  0, 1.66, 0, hairColor);   // hair

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}


function buildNPC(x, z, shirtColor, hairColor, npcData) {
    const group = new THREE.Group();
    function part(w,h,d,px,py,pz,color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w,h,d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px,py,pz);
        group.add(m);
    }
    part(0.45, 0.28, 0.38,  0, 0.58, 0, 0x333366);     // legs
    part(0.45, 0.60, 0.38,  0, 0.98, 0, shirtColor);    // body
    part(0.38, 0.38, 0.38,  0, 1.42, 0, 0xFFCBA4);      // head
    part(0.40, 0.18, 0.40,  0, 1.66, 0, hairColor);     // hair
    group.userData.npcData = npcData;
    group.position.set(x, 0, z);
    scene.add(group);
    clickableNPCs.push(group);
    return group;
}


function buildPetMesh(x, z, npcData) {
    const group = new THREE.Group();
    function part(w,h,d,px,py,pz,color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w,h,d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px,py,pz);
        group.add(m);
    }
    const fur = 0xE8983A;
    part(0.34, 0.22, 0.55,  0,    0.22,  0,     fur); // body
    part(0.24, 0.24, 0.24,  0,    0.34,  0.32,  fur); // head
    part(0.08, 0.10, 0.02, -0.08, 0.46,  0.42,  fur); // left ear
    part(0.08, 0.10, 0.02,  0.08, 0.46,  0.42,  fur); // right ear
    part(0.06, 0.06, 0.35,  0,    0.28, -0.32,  fur); // tail
    group.userData.npcData = npcData;
    group.position.set(x, 0, z);
    scene.add(group);
    clickableNPCs.push(group);
    return group;
}

// =============================================
// BUILD HOME — living room with parents + crib
// =============================================

function buildHome() {
    // Floor (warm wood)
    addBox(10, 0.2, 10, 0, -0.1, 0, 0x8B6914);
    // Rug in the center
    addBox(5, 0.05, 3.5, 0, 0.02, 0, 0xB85C38);

    // Walls (warm grey-blue living room)
    addBox(10, 3, 0.2,  0, 1.5, -5, 0xB0C4DE); // back wall
    addBox(0.2, 3, 10, -5, 1.5,  0, 0xB0C4DE); // left wall
    addBox(0.2, 3, 10,  5, 1.5,  0, 0xB0C4DE); // right wall
    // no front wall and no ceiling — so the camera can see in from above

    // Window on back wall
    addBox(2, 1.4, 0.12, 0, 2.0, -4.9, 0xADD8E6);
    // Window frame
    addBox(2.2, 1.6, 0.08, 0, 2.0, -4.95, 0xFFFFFF);

    // Door on front wall
    addBox(1.0, 2.2, 0.15, 2, 1.1, 4.92, 0x8B4513);

    // TV on the left wall
    addBox(0.12, 1.1, 1.8, -4.9, 2.1, 0, 0x222222); // screen (dark)
    addBox(0.10, 1.2, 2.0, -4.92, 2.1, 0, 0x444444); // frame
    addBox(0.1, 0.08, 0.5, -4.7, 1.1, 0, 0x555555); // TV stand

    // ---- CRIB (left side of room) ----
    // Base
    addBox(2,   0.8, 1.3, -3, 0.4, 0, 0xDEB887);
    // Four rails
    addBox(2,   0.65, 0.1, -3, 0.9, -0.6, 0xDEB887); // front rail
    addBox(2,   0.65, 0.1, -3, 0.9,  0.6, 0xDEB887); // back rail
    addBox(0.1, 0.65, 1.3, -4, 0.9,  0,   0xDEB887); // left rail
    addBox(0.1, 0.65, 1.3, -2, 0.9,  0,   0xDEB887); // right rail
    // Mattress
    addBox(1.8, 0.1, 1.1, -3, 0.85, 0, 0xFFFFFF);
    // Plushies inside crib
    addBox(0.30, 0.32, 0.28, -3.3, 1.05, -0.2, 0xFF6B6B); // red bear
    addBox(0.26, 0.30, 0.24, -2.8, 1.04,  0.15, 0xFFD700); // yellow duck
    addBox(0.28, 0.30, 0.26, -3.1, 1.04,  0.25, 0x98FB98); // green bunny
    // Baby mobile above crib
    addBox(0.05, 1.0, 0.05, -3, 2.5, 0, 0x888888);  // pole
    addBox(1.6, 0.05, 0.05, -3, 3.0, 0, 0x888888);  // arm
    addBox(0.2, 0.2, 0.2, -2.25, 2.7, 0, 0xFF6B6B); // red star
    addBox(0.2, 0.2, 0.2, -3.75, 2.7, 0, 0xFFD700); // yellow star
    addBox(0.2, 0.2, 0.2, -3.0, 2.7, 0,  0x98FB98); // green star

    // ---- COUCH (right side, facing left toward the baby) ----
    addBox(0.9, 0.45, 2.6,  3.8, 0.22, 0, 0x8B4513); // seat
    addBox(0.4, 1.0,  2.6,  4.3, 0.8,  0, 0x6B3410); // back rest
    addBox(0.9, 0.6,  0.2,  3.8, 0.5, -1.2, 0x6B3410); // left armrest
    addBox(0.9, 0.6,  0.2,  3.8, 0.5,  1.2, 0x6B3410); // right armrest

    // ---- PARENTS (built as moveable groups) ----
    momMesh = buildParent(3.55, -0.55, 0x4169E1, 0x4B2800);
    dadMesh = buildParent(3.55,  0.55, 0xC0392B, 0xFFD700);
    momAI.mesh = momMesh;
    dadAI.mesh = dadMesh;
}

// =============================================
// BUILD PLAYER — rebuilds the mesh for the current age
// =============================================

function buildPlayerMesh() {
    if (playerMesh) scene.remove(playerMesh);

    if (player.age <= 4) {
        // Baby: small pink capsule
        const geo = new THREE.CapsuleGeometry(0.22, 0.4, 4, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0xFFDAB9 });
        playerMesh = new THREE.Mesh(geo, mat);
        playerMesh.castShadow = true;
        playerMesh.position.set(-3, 0.9, 0); // inside crib
    } else {
        // Age 5+: humanoid with body parts, grows with age
        const group = new THREE.Group();
        const skinColor  = 0xFFCBA4;
        const shirtColor = player.gender === 'boy' ? 0x3498DB : 0xE91E8C;
        const hairColor  = player.gender === 'boy' ? 0x4B2800 : 0xCC0066;

        function part(w, h, d, px, py, pz, color) {
            const m = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshLambertMaterial({ color })
            );
            m.position.set(px, py, pz);
            m.castShadow = true;
            group.add(m);
        }

        part(0.45, 0.28, 0.38, 0, 0.58, 0, 0x2c3e50);  // legs (dark jeans)
        part(0.45, 0.60, 0.38, 0, 0.98, 0, shirtColor); // body
        part(0.38, 0.38, 0.38, 0, 1.42, 0, skinColor);  // head
        part(0.40, 0.18, 0.40, 0, 1.66, 0, hairColor);  // hair

        // Grow from 50% at age 5 up to full adult size at age 22+
        const scale = Math.min(1.0, 0.50 + (player.age - 5) * 0.037);
        group.scale.set(scale, scale, scale);
        group.position.set(0, 0, 0); // center of room
        playerMesh = group;
    }

    scene.add(playerMesh);
}


function buildPlayer() {
    buildPlayerMesh();
}

// =============================================
// HELPER: make a box
// =============================================

function addBox(w, h, d, x, y, z, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// =============================================
// GAME LOOP
// =============================================

function animate() {
    animationId = requestAnimationFrame(animate);

    if (player.age >= 3) {
        const speed = 0.06;
        if (keys['ArrowUp']    || keys['w'] || keys['W']) playerMesh.position.z -= speed;
        if (keys['ArrowDown']  || keys['s'] || keys['S']) playerMesh.position.z += speed;
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) playerMesh.position.x -= speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) playerMesh.position.x += speed;
        playerMesh.position.x = Math.max(-4.5, Math.min(4.5, playerMesh.position.x));
        playerMesh.position.z = Math.max(-4.5, Math.min(4.5, playerMesh.position.z));
    }

    // Baby throw arc
    if (throwState.active && playerMesh) {
        throwState.progress += 0.022; // speed — full arc in ~45 frames (~0.75s)
        const t = Math.min(throwState.progress, 1);

        // Straight line on X and Z
        playerMesh.position.x = throwState.from.x + (throwState.to.x - throwState.from.x) * t;
        playerMesh.position.z = throwState.from.z + (throwState.to.z - throwState.from.z) * t;
        // Parabolic arc on Y — Math.sin(t*PI) gives 0 → 1 → 0
        playerMesh.position.y = 0.9 + Math.sin(t * Math.PI) * 4;
        // Spin while in air
        playerMesh.rotation.x += 0.18;

        if (throwState.progress >= 1) {
            throwState.active = false;
            playerMesh.rotation.x = 0;

            if (Math.random() < 0.40) {
                // 40% — MISSED! Baby hits the floor
                playerMesh.position.y = 0.1;
                player.health = Math.max(0, player.health - 30);
                carriedBy = null;
                passCount = 0;
                spawnBlood();
                showEvent('😱', 'Nobody caught you! You hit the floor hard!');
                updateStats();
                saveGame();
                setTimeout(() => goToHospital(), 2500);
            } else {
                // 60% — caught!
                carriedBy = throwState.catcher;
                throwState.catcher.state  = 'wandering';
                throwState.catcher.target = randomRoomPos();
                showEvent('🙌', `${throwState.catcher === momAI ? 'Mom' : 'Dad'} caught you!`);
            }
        }
    }

    // Parent AI brains (only at home)
    if (!inSchool) {
        updateParentAI(momAI, MOM_HOME);
        updateParentAI(dadAI, DAD_HOME);
    }

    // School NPC movement
    if (inSchool) updateSchoolNPCs();

    // Bobbing animation for milk and diaper
    const t = Date.now() * 0.003;
    if (milkMesh && milkMesh.visible) {
        milkMesh.position.y = 1.6 + Math.sin(t) * 0.15;
        milkMesh.rotation.z = Math.sin(t * 0.8) * 0.2;
    }
    if (diaperMesh && diaperMesh.visible) {
        diaperMesh.position.y = 1.6 + Math.sin(t) * 0.1;
    }

    // Camera outside the open front, angled down into the room
    camera.position.x = playerMesh.position.x * 0.2;
    camera.position.z = 12;
    camera.position.y = 10;
    camera.lookAt(playerMesh.position.x * 0.2, 0, -1);
    renderer.render(scene, camera);
}

// =============================================
// RESIZE
// =============================================

window.addEventListener('resize', () => {
    if (!renderer) return;
    const c = document.getElementById('three-container');
    camera.aspect = c.clientWidth / c.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(c.clientWidth, c.clientHeight);
});

