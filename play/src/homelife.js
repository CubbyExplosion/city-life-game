// =============================================
// HOME LIFE — baby/toddler stage: crying, the crib, parent AI, the
// baby-toss mini-scene, and the hospital sequence when a throw fails.
// =============================================

function cry(type) {
    const now = Date.now();
    if (now - cooldowns[type] < 5000) {
        showEvent('⏳', 'Wait a moment...');
        return;
    }
    cooldowns[type] = now;

    if (type === 'milk') {
        player.happiness = Math.min(100, player.happiness + 10);
        showEvent('🍼', 'Mom heard you cry and brought you warm milk.');
        if (milkMesh) {
            milkMesh.visible = true;
            if (milkTimer) clearTimeout(milkTimer);
            milkTimer = setTimeout(() => { milkMesh.visible = false; }, 3000);
        }
        momAI.state = 'caring';
        momAI.target = { x: -3, z: 0 };
    } else {
        player.health    = Math.min(100, player.health + 5);
        player.happiness = Math.min(100, player.happiness + 5);
        showEvent('🧷', 'Dad rushed over and changed your diaper. You feel much better.');
        if (diaperMesh) {
            diaperMesh.visible = true;
            if (diaperTimer) clearTimeout(diaperTimer);
            diaperTimer = setTimeout(() => { diaperMesh.visible = false; }, 3000);
        }
        dadAI.state = 'caring';
        dadAI.target = { x: -3, z: 0 };
    }

    updateStats();
    saveGame();
}

// =============================================
// PARENT AI — runs every frame inside animate()
// =============================================

function randomRoomPos() {
    return { x: (Math.random() - 0.5) * 7, z: (Math.random() - 0.5) * 7 };
}


function putBabyInCrib() {
    carriedBy = null;
    passCount = 0;
    if (playerMesh) playerMesh.position.set(-3, 0.9, 0);
    showEvent('🛏️', 'You were gently placed back in your crib.');
}


function throwBaby(thrower, catcher, catcherHome) {
    const myName    = (thrower === momAI) ? 'Mom' : 'Dad';
    const otherName = (thrower === momAI) ? 'Dad' : 'Mom';
    showEvent('🤾', `${myName} threw you to ${otherName}! 😱`);

    throwState.active   = true;
    throwState.progress = 0;
    throwState.from     = { x: thrower.mesh.position.x, z: thrower.mesh.position.z };
    throwState.to       = { x: catcher.mesh.position.x, z: catcher.mesh.position.z };
    throwState.catcher      = catcher;
    throwState.catcherHome  = catcherHome;

    // Relatives watching? They attack!
    if (activeRelatives.length > 0) relativesAttackParents();

    carriedBy      = null; // baby is in the air
    thrower.state  = 'sitting';
    thrower.target = { x: (thrower === momAI ? MOM_HOME.x : DAD_HOME.x),
                       z: (thrower === momAI ? MOM_HOME.z : DAD_HOME.z) };
}


function updateParentAI(ai, homePos) {
    if (!ai.mesh) return;
    const p = ai.mesh.position;

    // Lerp toward target
    p.x += (ai.target.x - p.x) * 0.03;
    p.z += (ai.target.z - p.z) * 0.03;

    // Baby follows whoever is carrying them
    if (carriedBy === ai && playerMesh) {
        playerMesh.position.x = p.x;
        playerMesh.position.z = p.z;
        playerMesh.position.y = p.y + 1.8;
    }

    const dist = Math.hypot(p.x - ai.target.x, p.z - ai.target.z);
    if (dist > 0.15) return; // not at target yet

    if (ai.state === 'caring') {
        // Reached crib — pick up baby and wander
        carriedBy = ai;
        passCount = 0;
        ai.state  = 'wandering';
        ai.target = randomRoomPos();
        showEvent('👶', `${ai === momAI ? 'Mom' : 'Dad'} picked you up out of the crib!`);

    } else if (ai.state === 'wandering' && carriedBy === ai) {
        // Reached random spot while holding baby
        if (passCount < 4 && Math.random() < 0.99) {
            // THROW to the other parent
            const other     = (ai === momAI) ? dadAI : momAI;
            const otherHome = (ai === momAI) ? DAD_HOME : MOM_HOME;
            passCount += 1;
            throwBaby(ai, other, otherHome);
        } else {
            // Put baby back in crib
            ai.state  = 'caring'; // walk back to crib to put down
            ai.target = { x: -3, z: 0 };
            // When they arrive at crib this time, put baby down
            setTimeout(() => {
                putBabyInCrib();
                ai.state  = 'sitting';
                ai.target = { x: homePos.x, z: homePos.z };
            }, 3000);
        }

    } else if (ai.state === 'wandering') {
        // Reached spot without baby — go back home
        ai.state  = 'sitting';
        ai.target = { x: homePos.x, z: homePos.z };
    }
}

// Called automatically every 20 seconds — parents check on baby

function parentCheckOnBaby() {
    if (player.age > 2) return; // only while baby

    // Mom feeds if happiness is low
    if (player.happiness < 40 && momAI.state === 'sitting') {
        player.happiness = Math.min(100, player.happiness + 10);
        showEvent('🍼', 'Mom noticed you were unhappy and brought you some milk.');
        momAI.state  = 'caring';
        momAI.target = { x: -3, z: 0 };
        if (milkMesh) { milkMesh.visible = true; setTimeout(() => { milkMesh.visible = false; }, 3000); }
        updateStats();
        saveGame();
    }

    // Dad changes diaper if health is low
    if (player.health < 80 && dadAI.state === 'sitting') {
        player.health    = Math.min(100, player.health + 5);
        player.happiness = Math.min(100, player.happiness + 5);
        showEvent('🧷', 'Dad could tell something was wrong. He changed your diaper.');
        dadAI.state  = 'caring';
        dadAI.target = { x: -3, z: 0 };
        if (diaperMesh) { diaperMesh.visible = true; setTimeout(() => { diaperMesh.visible = false; }, 3000); }
        updateStats();
        saveGame();
    }
}



function spawnBlood() {
    if (!playerMesh) return;
    const drops = [];
    for (let i = 0; i < 12; i++) {
        const size = 0.05 + Math.random() * 0.1;
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(size, 5, 5),
            new THREE.MeshLambertMaterial({ color: 0xAA0000 })
        );
        m.position.set(
            playerMesh.position.x + (Math.random() - 0.5) * 1.4,
            0.02,
            playerMesh.position.z + (Math.random() - 0.5) * 1.4
        );
        m.scale.y = 0.15;
        scene.add(m);
        drops.push(m);
    }
    setTimeout(() => drops.forEach(m => scene.remove(m)), 3000);
}

// =============================================
// HOSPITAL
// =============================================

// A parent rushes you to the hospital by car, then the operating room opens.
function goToHospital() {
    if (!driveTo('to the hospital', '🏥', openOperatingRoom, { duration: 3200 })) openOperatingRoom();
}

function openOperatingRoom() {
    const overlay = document.createElement('div');
    overlay.id = 'hospital-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:200; font-family:Arial;
        display:flex; flex-direction:column; overflow:hidden;
    `;
    overlay.innerHTML = `
        <!-- All the animations for the operating room live here -->
        <style>
            /* The surgical light glows on and off */
            @keyframes opGlow {
                0%,100% { box-shadow:0 0 40px 10px rgba(255,255,200,0.5); }
                50%     { box-shadow:0 0 70px 25px rgba(255,255,200,0.9); }
            }
            /* The doctor's hands move up and down while operating */
            @keyframes opHands {
                0%,100% { transform:translateY(0) rotate(8deg); }
                50%     { transform:translateY(-14px) rotate(-8deg); }
            }
            /* The heart line scrolls left forever */
            @keyframes ekgScroll {
                from { transform:translateX(0); }
                to   { transform:translateX(-200px); }
            }
            /* The beep number pulses bigger each beat */
            @keyframes beat {
                0%,100% { transform:scale(1); }
                30%     { transform:scale(1.3); }
            }
            /* The doctor jumps for joy when the operation is done */
            @keyframes opCheer {
                0%,100% { transform:translateY(0); }
                50%     { transform:translateY(-22px); }
            }
        </style>

        <!-- TOP BAR -->
        <div style="background:#c0392b; padding:12px; text-align:center; flex-shrink:0;">
            <span style="font-size:1.5em; color:white; font-weight:bold; letter-spacing:3px;">
                ➕ &nbsp; OPERATING ROOM &nbsp; ➕
            </span>
        </div>

        <!-- THE OPERATING ROOM -->
        <div style="flex:1; background:#1f5c6e; display:flex; align-items:center;
                    justify-content:center; position:relative; overflow:hidden;">

            <!-- big round surgical light hanging from ceiling -->
            <div style="position:absolute; top:0; left:50%; transform:translateX(-50%);
                        width:6px; height:50px; background:#0d3540;"></div>
            <div style="position:absolute; top:46px; left:50%; transform:translateX(-50%);
                        width:120px; height:120px; border-radius:50%;
                        background:radial-gradient(circle, #fffde0 30%, #ffe98a 100%);
                        animation:opGlow 1.5s ease-in-out infinite;"></div>

            <!-- HEART MONITOR on the wall -->
            <div style="position:absolute; top:24px; right:30px;
                        width:200px; background:#0a0a0a; border:5px solid #444;
                        border-radius:10px; padding:8px; overflow:hidden;">
                <div style="overflow:hidden; height:50px;">
                    <!-- two copies of the heartbeat line so the scroll never shows a gap -->
                    <div style="width:400px; height:50px; animation:ekgScroll 1s linear infinite;">
                        <svg width="400" height="50" viewBox="0 0 400 50">
                            <polyline fill="none" stroke="#2ecc71" stroke-width="2"
                                points="0,25 40,25 50,25 56,8 62,42 70,25 100,25 140,25 150,25 156,8 162,42 170,25 200,25
                                        200,25 240,25 250,25 256,8 262,42 270,25 300,25 340,25 350,25 356,8 362,42 370,25 400,25"/>
                        </svg>
                    </div>
                </div>
                <div style="color:#2ecc71; font-family:monospace; text-align:right; font-size:1.1em;">
                    ❤️ <span style="display:inline-block; animation:beat 1s ease-in-out infinite;">98</span> bpm
                </div>
            </div>

            <!-- OPERATING TABLE with the baby -->
            <div style="position:relative; margin-top:60px;">
                <!-- table top -->
                <div style="width:230px; height:60px; background:#2c3e50;
                            border-radius:12px; display:flex; align-items:center;
                            justify-content:center; position:relative;
                            box-shadow:0 6px 0 #1a252f;">
                    <!-- green surgical sheet over the baby -->
                    <div style="position:absolute; right:18px; bottom:8px;
                                width:120px; height:44px; background:#27ae60; border-radius:6px;"></div>
                    <!-- baby's head poking out -->
                    <div style="font-size:2.2em; position:absolute; left:28px; bottom:6px;">👶</div>
                </div>
                <!-- table legs -->
                <div style="display:flex; justify-content:space-between; width:200px; margin:0 auto;">
                    <div style="width:12px; height:60px; background:#7f8c8d;"></div>
                    <div style="width:12px; height:60px; background:#7f8c8d;"></div>
                </div>

                <!-- DOCTOR standing over the table, operating -->
                <div id="op-doctor" style="position:absolute; top:-110px; left:-70px;
                            display:flex; flex-direction:column; align-items:center;">
                    <!-- head with surgical mask + cap -->
                    <div style="width:46px; height:46px; border-radius:50%;
                                background:#f5cba7; border-top:14px solid #2e86c1;
                                position:relative;">
                        <!-- mask -->
                        <div style="position:absolute; bottom:6px; left:6px;
                                    width:34px; height:18px; background:#aed6f1; border-radius:4px;"></div>
                        <!-- eyes -->
                        <div style="position:absolute; top:18px; left:11px; font-size:0.6em;">👀</div>
                    </div>
                    <!-- blue scrubs body -->
                    <div style="width:60px; height:64px; background:#2e86c1;
                                border-radius:8px 8px 0 0; position:relative;">
                        <!-- the operating hands + tools, animated -->
                        <div id="op-tools" style="position:absolute; bottom:-26px; left:50%;
                                    transform:translateX(-50%);
                                    animation:opHands 0.6s ease-in-out infinite;
                                    font-size:1.4em; white-space:nowrap;">🧤🔪</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BOTTOM STATUS BAR (changes when the operation finishes) -->
        <div id="op-status" style="background:#1a1a2e; padding:16px; text-align:center; flex-shrink:0;">
            <p style="color:#FFD700; font-size:1.1em; margin-bottom:10px;">
                🩺 Dr. Smith is operating...
            </p>
            <div style="width:80%; max-width:400px; height:20px; margin:0 auto;
                        background:#0f3460; border-radius:10px; overflow:hidden;">
                <div id="op-bar" style="height:100%; width:0%;
                            background:linear-gradient(90deg,#e94560,#27ae60);
                            transition:width 0.1s linear;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Fill the progress bar over about 5 seconds, then show the result.
    const bar = document.getElementById('op-bar');
    let pct = 0;
    const op = setInterval(() => {
        pct += 2;
        if (bar) bar.style.width = pct + '%';
        if (pct >= 100) {
            clearInterval(op);
            finishOperation();
        }
    }, 100);
}


function finishOperation() {
    // Make the doctor celebrate: stop operating, jump for joy, raise hands.
    const doc = document.getElementById('op-doctor');
    const tools = document.getElementById('op-tools');
    if (doc) doc.style.animation = 'opCheer 0.45s ease-in-out infinite';
    if (tools) {
        tools.style.animation = 'none';   // stop the up-down operating motion
        tools.style.bottom = 'auto';
        tools.style.top = '-34px';        // move hands ABOVE his head
        tools.innerHTML = '🙌🎉';          // raised hands + party
    }

    const status = document.getElementById('op-status');
    if (!status) return;
    status.innerHTML = `
        <p style="color:#2ecc71; font-size:1.3em; font-weight:bold; margin-bottom:8px;">
            ✅ Operation successful!
        </p>
        <p style="color:#aaa; font-size:0.95em; margin-bottom:12px;">
            Dr. Smith says: <em style="color:#FFD700;">"All fixed! Try not to fall again!"</em>
        </p>
        <button onclick="leaveHospital()" style="
            font-size:1em; padding:10px 28px;
            background:#27ae60; color:white; border:none;
            border-radius:10px; cursor:pointer; font-weight:bold;">
            🏠 Go Home (healed +40)
        </button>
    `;
}


function leaveHospital() {
    const overlay = document.getElementById('hospital-overlay');
    if (overlay) overlay.remove();
    player.health = Math.min(100, player.health + 40);
    updateStats();
    saveGame();
    // A parent drives you home
    function arriveHome() {
        if (playerMesh) playerMesh.position.set(-3, 0.9, 0);
        showEvent('💉', 'Dr. Smith patched you up. Back home now!');
    }
    if (!driveTo('home', '🏠', arriveHome, { duration: 3200 })) arriveHome();
}

