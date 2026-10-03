// =============================================
// RANDOM EVENTS — the four surprises that can happen during a life:
// relatives visiting, a bully, a missing pet, and found money.
// interactWithNPC() is the shared dispatcher that routes a click on
// any 3D character to the right handler below.
// =============================================

function relativesAttackParents() {
    if (activeRelatives.length === 0) return;

    const names = activeRelatives.map(r => r.name).join(' & ');
    showEvent('🤬', `${names} SAW THAT! They are FURIOUS and attacking the parents!`);

    // Each relative charges toward the nearest parent
    activeRelatives.forEach(rel => {
        const targets = [momAI, dadAI];
        const target = targets[Math.floor(Math.random() * targets.length)];
        if (!target.mesh) return;

        // Slam the relative toward the parent rapidly
        let t = 0;
        const startX = rel.group.position.x;
        const startZ = rel.group.position.z;
        const chargeInterval = setInterval(() => {
            t += 0.08;
            if (!target.mesh) { clearInterval(chargeInterval); return; }
            rel.group.position.x += (target.mesh.position.x - rel.group.position.x) * 0.18;
            rel.group.position.z += (target.mesh.position.z - rel.group.position.z) * 0.18;
            rel.group.rotation.y += 0.3; // spin angrily while charging
            if (t >= 1) clearInterval(chargeInterval);
        }, 40);

        // Parents flee to random corners
        if (momAI.mesh) { momAI.state = 'wandering'; momAI.target = { x: -4, z: -4 }; }
        if (dadAI.mesh) { dadAI.state = 'wandering'; dadAI.target = { x: -4, z:  4 }; }
    });

    // After 3 seconds, relatives calm down and parents slink back
    setTimeout(() => {
        showEvent('😤', `${names} told the parents off. The parents are ashamed!`);
        player.happiness = Math.min(100, player.happiness + 5); // baby feels protected
        if (momAI.mesh) { momAI.state = 'sitting'; momAI.target = { ...MOM_HOME }; }
        if (dadAI.mesh) { dadAI.state = 'sitting'; dadAI.target = { ...DAD_HOME }; }
        activeRelatives.forEach(rel => { rel.group.rotation.y = 0; });
        updateStats(); saveGame();
    }, 3000);
}


function interactWithNPC(npcData) {
    // Presents and the soccer ball have their own timing — no 3-second wait between clicks
    if (npcData.isGift) { openGift(npcData.giftId); return; }
    if (npcData.isBall) { kickBall(); return; }

    if (Date.now() < npcCooldown) return;
    npcCooldown = Date.now() + 3000;
    if (npcData.isBully) {
        showBullyChoice(npcData.name);
        return;
    }
    if (npcData.isPet) {
        foundMissingPet(npcData);
        return;
    }
    if (npcData.isSchoolNPC) {
        if (npcData.npcType === 'teacher') {
            if (schoolPeriod >= 7) { // recess / end of day — no quizzes, just say hi
                showEvent('🧑‍🏫', `${npcData.name}: "Enjoy your recess!"`);
                return;
            }
            askMathQuestion(npcData.name);
        } else {
            showClassmateChat(npcData.name);
        }
        return;
    }
    showEvent('💬', `${npcData.name}: "${npcData.dialogue}" +${npcData.happiness} happiness!`);
    player.happiness = Math.min(100, player.happiness + npcData.happiness);
    updateStats();
    saveGame();
}


function spawnRelative() {
    if (!scene) return;
    if (inSchool || driving) return; // don't let relatives sneak into school (or into the car!)
    if (activeRelatives.length >= 2) return; // max 2 relatives at once
    const data = RELATIVE_DATA[Math.floor(Math.random() * RELATIVE_DATA.length)];
    const x = (Math.random() - 0.5) * 5;
    const z = (Math.random() - 0.5) * 5;
    const group = buildNPC(x, z, data.shirtColor, data.hairColor, {
        name: data.name, dialogue: data.dialogue, happiness: data.happiness
    });
    activeRelatives.push({ group, name: data.name });
    showEvent('🚪', `${data.name} came to visit! Click on them to say hi!`);
    // Relative leaves after 30 seconds
    setTimeout(() => {
        scene.remove(group);
        const idx = clickableNPCs.indexOf(group);
        if (idx > -1) clickableNPCs.splice(idx, 1);
        const ri = activeRelatives.findIndex(r => r.group === group);
        if (ri > -1) activeRelatives.splice(ri, 1);
    }, 30000);
}

// =============================================
// BULLY — random school confrontation, real choice
// =============================================

function maybeSpawnBully() {
    if (inSchool !== true) return; // must already be in the school scene when this fires
    if (isExamDay || activeBully) return;
    if (Math.random() < 0.15) spawnBully();
}


function spawnBully() {
    if (!scene || !inSchool || activeBully) return;
    const data = BULLY_DATA[Math.floor(Math.random() * BULLY_DATA.length)];
    const x = (Math.random() - 0.5) * 3;
    const z = player.school === 'SIP' ? 5 : 2.5;
    const group = buildNPC(x, z, data.shirtColor, data.hairColor, {
        name: data.name, isBully: true
    });
    schoolObjects.push(group);
    activeBully = { group, name: data.name };
    showEvent('😠', `${data.name} is looking for trouble! Click them to deal with it.`);
    // Wanders off if ignored for 45 seconds
    setTimeout(() => {
        if (!activeBully || activeBully.group !== group) return;
        removeBully();
    }, 45000);
}


function removeBully() {
    if (!activeBully) return;
    if (scene) scene.remove(activeBully.group);
    const idx = clickableNPCs.indexOf(activeBully.group);
    if (idx > -1) clickableNPCs.splice(idx, 1);
    activeBully = null;
}


function showBullyChoice(name) {
    if (document.getElementById('bully-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'bully-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #e74c3c; border-radius:16px;
                    padding:32px 40px; text-align:center; max-width:360px;">
            <h2 style="color:#e74c3c; margin-bottom:14px;">😠 ${name} blocks your way</h2>
            <p style="color:#ddd; margin-bottom:22px;">"Give me your lunch money, or else!"</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button class="action-btn" onclick="bullyChoice('standup')">😤 Stand up to them</button>
                <button class="action-btn" onclick="bullyChoice('walkaway')">🚶 Walk away</button>
                <button class="action-btn" onclick="bullyChoice('teacher')">🙋 Tell the teacher</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}


function bullyChoice(choice) {
    const overlay = document.getElementById('bully-overlay');
    if (overlay) overlay.remove();
    if (!activeBully) return;
    const name = activeBully.name;

    if (choice === 'standup') {
        if (Math.random() < 0.6) {
            showEvent('💪', `You stood your ground! ${name} backed off. +5 happiness`);
            player.happiness = Math.min(100, player.happiness + 5);
        } else {
            showEvent('😢', `${name} shoved you! -5 happiness, -3 health`);
            player.happiness = Math.max(0, player.happiness - 5);
            player.health = Math.max(0, player.health - 3);
        }
    } else if (choice === 'walkaway') {
        showEvent('🚶', `You walked away. ${name} lost interest. -2 happiness`);
        player.happiness = Math.max(0, player.happiness - 2);
    } else if (choice === 'teacher') {
        showEvent('🙋', `A teacher stepped in — ${name} had to apologize! +6 happiness`);
        player.happiness = Math.min(100, player.happiness + 6);
    }

    removeBully();
    updateStats(); saveGame();
}

// =============================================
// MISSING PET — random home search event
// =============================================

function maybeTriggerMissingPet() {
    if (inSchool || driving || activePet) return;
    if (Math.random() < 0.35) {
        setTimeout(() => spawnMissingPet(), 1200);
    }
}


function spawnMissingPet() {
    if (!scene || inSchool || driving || activePet) return;
    const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
    const x = (Math.random() - 0.5) * 5;
    const z = (Math.random() - 0.5) * 5;
    const group = buildPetMesh(x, z, { name, isPet: true });
    activePet = { group, name };
    showEvent('🐾', `${name} the cat is missing! Find her before she wanders off!`);
    // Wanders off if not found within 25 seconds
    setTimeout(() => {
        if (!activePet || activePet.group !== group) return;
        if (scene) scene.remove(group);
        const idx = clickableNPCs.indexOf(group);
        if (idx > -1) clickableNPCs.splice(idx, 1);
        activePet = null;
        showEvent('😿', `${name} wandered off... maybe next time.`);
    }, 25000);
}


function foundMissingPet(npcData) {
    if (!activePet) return;
    if (scene) scene.remove(activePet.group);
    const idx = clickableNPCs.indexOf(activePet.group);
    if (idx > -1) clickableNPCs.splice(idx, 1);
    const reward = 10;
    player.happiness = Math.min(100, player.happiness + 8);
    player.money += reward;
    showEvent('🎉', `You found ${npcData.name}! The owner gives you $${reward} as a thank you!`);
    activePet = null;
    updateStats(); saveGame();
}

// =============================================
// FOUND MONEY — random ethical choice event
// =============================================

function maybeTriggerFoundMoney() {
    if (inSchool || driving) return;
    if (Math.random() < 0.25) {
        setTimeout(() => { if (!driving) showFoundMoney(); }, 1500);
    }
}


function showFoundMoney() {
    if (inSchool) return;
    if (document.getElementById('money-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'money-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #FFD700; border-radius:16px;
                    padding:32px 40px; text-align:center; max-width:360px;">
            <h2 style="color:#FFD700; margin-bottom:14px;">💰 You found a wallet!</h2>
            <p style="color:#ddd; margin-bottom:22px;">There's $15 inside. What do you do?</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button class="action-btn" onclick="foundMoneyChoice('keep')">🤑 Keep it ($15)</button>
                <button class="action-btn" onclick="foundMoneyChoice('return')">😇 Turn it in</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}


function foundMoneyChoice(choice) {
    const overlay = document.getElementById('money-overlay');
    if (overlay) overlay.remove();
    if (choice === 'keep') {
        player.money += 15;
        showEvent('🤑', 'You kept the $15! +$15');
    } else {
        player.money += 5;
        player.happiness = Math.min(100, player.happiness + 8);
        showEvent('😇', 'You returned it! The owner was so grateful — +$5, +8 happiness');
    }
    updateStats(); saveGame();
}

// =============================================
// CITY MOVES — rare random life event
// =============================================

function maybeTriggerCityMove() {
    if (inSchool) return;
    if (player.age < 6) return; // must have started school first
    if (player.age - player.lastMoveAge < 4) return; // cooldown between moves
    if (CITY_DATA.length < 2) return; // need somewhere new to go
    if (Math.random() < 0.08) {
        setTimeout(() => triggerCityMove(), 1800);
    }
}


function triggerCityMove() {
    if (inSchool) return;
    const oldNames = getCurrentClassmates().map(c => c.name).join(', ');
    const otherCities = CITY_DATA.filter(c => c.city !== player.city);
    const newCity = otherCities[Math.floor(Math.random() * otherCities.length)];

    showEvent('📦', `Your family is moving to ${newCity.city}!`);

    setTimeout(() => {
        if (inSchool) return;
        showEvent('😢', `${oldNames} are SO sad to see you go — they'll miss you!`);
        player.happiness = Math.max(0, player.happiness - 10);
        updateStats();

        setTimeout(() => {
            if (inSchool) return;
            // The family drives to the new city (a longer car ride), then you arrive
            function arrive() {
                player.city = newCity.city;
                player.lastMoveAge = player.age;
                showEvent('🏙️', `Welcome to ${newCity.city}! Time to meet new classmates at school.`);
                updateStats();
                saveGame();
            }
            if (!driveTo(`to ${newCity.city}`, '🚚', arrive, { duration: 5500 })) arrive();
        }, 3000);
    }, 2500);
}

