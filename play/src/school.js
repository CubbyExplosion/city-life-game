// =============================================
// SCHOOL — enrollment, the school day/periods, homework, quiz
// questions (all 5 subjects), and homeschool.
// =============================================

function showSchoolChoice() {
    const overlay = document.createElement('div');
    overlay.id = 'school-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:200; font-family:Arial;
        background:rgba(10,10,30,0.92);
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; text-align:center; padding:20px;
    `;
    overlay.innerHTML = `
        <div style="font-size:2.5em; margin-bottom:8px;">🏫</div>
        <h2 style="color:#FFD700; font-size:1.8em; margin-bottom:6px;">You turned 5!</h2>
        <p style="color:#aaa; margin-bottom:24px;">Your parents are sending you to school.<br>Which school do you choose?</p>

        <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">

            <!-- SIP INTERNATIONAL -->
            <div onclick="pickSchool('SIP')" style="
                cursor:pointer; background:#0f3460; border:3px solid #FFD700;
                border-radius:16px; padding:24px 28px; width:220px;
                transition:transform 0.15s; hover:transform:scale(1.05);"
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:2.5em; margin-bottom:10px;">🏆</div>
                <h3 style="color:#FFD700; margin-bottom:8px;">SIP International</h3>
                <p style="color:#aaa; font-size:0.85em; margin-bottom:12px;">
                    <em>Super Important Person</em>
                </p>
                <p style="color:#2ecc71; font-size:0.9em;">📚 +8 education per study</p>
                <p style="color:#e74c3c; font-size:0.9em;">😓 -8 happiness (it's hard!)</p>
                <p style="color:#f39c12; font-size:0.85em; margin-top:8px;">
                    💼 Unlocks better jobs later
                </p>
            </div>

            <!-- OHLOR -->
            <div onclick="pickSchool('Ohlor')" style="
                cursor:pointer; background:#0f3460; border:3px solid #3498db;
                border-radius:16px; padding:24px 28px; width:220px;
                transition:transform 0.15s;"
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:2.5em; margin-bottom:10px;">📖</div>
                <h3 style="color:#3498db; margin-bottom:8px;">Ohlor</h3>
                <p style="color:#aaa; font-size:0.85em; margin-bottom:12px;">
                    <em>Good middle school</em>
                </p>
                <p style="color:#2ecc71; font-size:0.9em;">📚 +4 education per study</p>
                <p style="color:#e74c3c; font-size:0.9em;">😊 -3 happiness (not bad)</p>
                <p style="color:#f39c12; font-size:0.85em; margin-top:8px;">
                    💼 Unlocks regular jobs
                </p>
            </div>

            <!-- HOMESCHOOL -->
            <div onclick="pickSchool('Homeschool')" style="
                cursor:pointer; background:#0f3460; border:3px solid #2ecc71;
                border-radius:16px; padding:24px 28px; width:220px;
                transition:transform 0.15s;"
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:2.5em; margin-bottom:10px;">🏠</div>
                <h3 style="color:#2ecc71; margin-bottom:8px;">Homeschool</h3>
                <p style="color:#aaa; font-size:0.85em; margin-bottom:12px;">
                    <em>Learn at your own pace</em>
                </p>
                <p style="color:#2ecc71; font-size:0.9em;">📚 +5 education per study</p>
                <p style="color:#3498db; font-size:0.9em;">😊 +2 happiness (calm & safe)</p>
                <p style="color:#f39c12; font-size:0.85em; margin-top:8px;">
                    💼 Unlocks flexible/self-employed jobs
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}


function pickSchool(name) {
    player.school = name;
    const overlay = document.getElementById('school-overlay');
    if (overlay) overlay.remove();
    if (name === 'Homeschool') {
        showEvent('🏠', "You're being homeschooled! Tap Study to learn all 4 subjects at home.");
    } else {
        const label = name === 'SIP' ? 'SIP International 🏆' : 'Ohlor 📖';
        showEvent('🏫', `You enrolled at ${label}! Tap Study to start learning.`);
    }
    updateActionPanel();
    saveGame();
}


function study() {
    if (Date.now() < studyCooldown) {
        showEvent('😅', 'You just studied! Rest a bit first.');
        return;
    }
    studyCooldown = Date.now() + 5000;
    if (player.school === 'Homeschool') {
        studyAtHome();
    } else {
        enterSchool();
    }
}

// =============================================
// HOMESCHOOL — study session covering all 4 subjects at home
// =============================================

function studyAtHome() {
    if (document.getElementById('math-overlay')) return;
    if (document.getElementById('math-inline')) return;
    homeschoolSubjectIndex = 0;
    askHomeschoolQuestion();
}


function askHomeschoolQuestion() {
    if (document.getElementById('math-overlay')) return;
    if (player.school !== 'Homeschool') return; // session ended (e.g. restart) before this scheduled question fired
    const subject = HOMESCHOOL_SUBJECTS[homeschoolSubjectIndex];

    if (subject === 'PE') {
        startPEChallenge(`🏠 Homeschool — Subject ${homeschoolSubjectIndex + 1} of ${HOMESCHOOL_SUBJECTS.length}`, () => {
            player.education = Math.min(100, player.education + 5);
            player.happiness = Math.min(100, player.happiness + 2);
            showEvent('✅', `Great workout! +5 education, +2 happiness`);
            updateStats(); saveGame();

            homeschoolSubjectIndex++;
            if (homeschoolSubjectIndex < HOMESCHOOL_SUBJECTS.length) {
                setTimeout(askHomeschoolQuestion, 1200);
            } else {
                setTimeout(() => showEvent('🎉', "Homeschool session done for today! Great work!"), 1200);
            }
        });
        return;
    }

    const q = generateClassQuestion(subject);
    currentQuestion = q;
    const emoji = SUBJECT_EMOJI[q.subject] || '📋';

    const overlay = document.createElement('div');
    overlay.id = 'math-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #2ecc71; border-radius:16px;
                    padding:32px 40px; text-align:center; min-width:300px;">
            <p style="color:#aaa; margin-bottom:4px; font-size:0.85em;">🏠 Homeschool — Subject ${homeschoolSubjectIndex + 1} of ${HOMESCHOOL_SUBJECTS.length}</p>
            <p style="color:#aaa; margin-bottom:10px; font-size:1em;">${emoji} Grade ${q.grade} ${q.subject}</p>
            <h2 style="color:#FFD700; font-size:1.8em; margin-bottom:22px;">${q.question}</h2>
            <div>
                ${q.choices.map((c, i) =>
                    `<button onclick="answerHomeschool(${i}, ${q.correctIndex})"
                        style="font-size:1.1em; padding:10px 18px; margin:6px;
                               background:#0f3460; color:white; border:2px solid #2ecc71;
                               border-radius:10px; cursor:pointer;
                               transition:background 0.15s;"
                        onmouseover="this.style.background='#1a6090'"
                        onmouseout="this.style.background='#0f3460'">${c}</button>`
                ).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}


function answerHomeschool(chosenIndex, correctIndex) {
    const overlay = document.getElementById('math-overlay');
    if (overlay) overlay.remove();
    const correctText = currentQuestion ? currentQuestion.choices[correctIndex] : correctIndex;

    if (chosenIndex === correctIndex) {
        player.education = Math.min(100, player.education + 5);
        player.happiness = Math.min(100, player.happiness + 2);
        showEvent('✅', `Correct! +5 education, +2 happiness`);
    } else if (player.parentTemperament === 'strict') {
        const line = STRICT_PARENT_LINES[Math.floor(Math.random() * STRICT_PARENT_LINES.length)];
        player.happiness = Math.max(0, player.happiness - 2);
        showEvent('😠', `${line} -2 happiness`);
    } else {
        showEvent('❌', `Not quite! The answer was ${correctText}.`);
    }
    updateStats(); saveGame();

    homeschoolSubjectIndex++;
    if (homeschoolSubjectIndex < HOMESCHOOL_SUBJECTS.length) {
        setTimeout(askHomeschoolQuestion, 1200);
    } else {
        setTimeout(() => showEvent('🎉', "Homeschool session done for today! Great work!"), 1200);
    }
}

// =============================================
// 3D SCHOOL
// =============================================

function schoolRandomPos(isTeacher) {
    const isSIP = player.school === 'SIP';
    if (isTeacher) {
        const xRange = isSIP ? 10 : 5;
        const zMin   = isSIP ? -4  : -1.5;
        const zRange = isSIP ? 7   : 3;
        return { x: (Math.random() - 0.5) * xRange, z: zMin + Math.random() * zRange };
    }
    return { x: 0, z: 0 }; // classmates don't wander — they stay at desks
}


function buildSchoolRoom() {
    function add(w, h, d, x, y, z, color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        schoolObjects.push(m);
    }
    if (player.school === 'SIP') {
        // ── SIP INTERNATIONAL — Grand VIP Classroom ──
        add(18, 0.2, 16,  0, -0.1,  0, 0xF5F0E8); // ivory marble floor
        add(18, 6,  0.2,  0,  3,   -8, 0xEDE5D5); // front wall
        add(0.2, 6, 16,  -9,  3,    0, 0xEAE0CF); // left wall
        add(0.2, 6, 16,   9,  3,    0, 0xEAE0CF); // right wall

        // Gold-framed whiteboard
        add(9,   3.2, 0.12, 0, 3.4, -7.9, 0xFFD700);  // gold frame
        add(8.4, 2.7, 0.15, 0, 3.4, -7.85, 0xF8F8F8); // white surface

        // Four grand pillars
        [[-7, -4], [7, -4], [-7, 4], [7, 4]].forEach(([x, z]) => {
            add(0.7, 6, 0.7, x, 3,   z, 0xD4C8A8); // pillar body
            add(1.0, 0.3, 1.0, x, 6.1, z, 0xC8B890); // pillar cap
        });

        // Raised teacher platform + fancy desk
        add(8, 0.25, 5.5,  0, 0.12, -5.5, 0xC8B89A);
        add(3,  0.6, 1.4,  0, 0.49, -4.5, 0x8B6340);
        add(3.2, 0.09, 1.6, 0, 0.82, -4.5, 0xA07850);

        // Trophy shelf on left wall
        add(0.15, 0.15, 3.5, -8.9, 2.2, -2, 0x8B6914);
        add(0.3, 0.7, 0.4,  -8.6, 2.6, -3,   0xFFD700);
        add(0.3, 0.6, 0.4,  -8.6, 2.5, -1.5, 0xC0C0C0);
        add(0.3, 0.5, 0.4,  -8.6, 2.4, -0.5, 0xCD7F32);

        // Tall windows on right wall
        [[-4], [0], [4]].forEach(([z]) => {
            add(0.15, 3.3, 2.3, 8.92, 3.5, z, 0xE8E0D0); // frame
            add(0.12, 3,   2,   8.9,  3.5, z, 0xADD8E6); // glass
        });

        // Student desks — 3 rows of 4
        [[-5, 1], [-1.7, 1], [1.7, 1], [5, 1],
         [-5, 3.5], [-1.7, 3.5], [1.7, 3.5], [5, 3.5],
         [-5, 6],   [-1.7, 6],   [1.7, 6],   [5, 6]].forEach(([x, z]) => {
            add(1.5, 0.55, 1.0, x, 0.27, z, 0xC8A878);
            add(1.6, 0.08, 1.1, x, 0.61, z, 0xB09060);
        });

        // Door
        add(0.15, 2.5, 1.2, 8.93, 1.25, 6.5, 0x8B4513);

    } else {
        // ── OHLOR — Standard classroom ──
        add(12, 0.2, 12,  0, -0.1,  0, 0xD4C9B0);
        add(12, 4,  0.2,  0,  2,   -6, 0xF0EDDE);
        add(0.2, 4, 12,  -6,  2,    0, 0xEEEBDA);
        add(0.2, 4, 12,   6,  2,    0, 0xEEEBDA);

        add(6.3, 2.3, 0.1,  0, 2.5, -5.95, 0x5D4037);
        add(6,   2,   0.15, 0, 2.5, -5.9,  0x2d5a27);

        add(2,   0.55, 1,   -0.5, 0.27, -3.5, 0x8B6914);
        add(2.1, 0.07, 1.1, -0.5, 0.60, -3.5, 0xA0785A);

        [[-3, 0.5], [0, 0.5], [3, 0.5], [-2, 2.5], [2, 2.5]].forEach(([x, z]) => {
            add(1.2, 0.55, 0.8, x, 0.27, z, 0xDEB887);
            add(1.3, 0.07, 0.9, x, 0.60, z, 0xC4A265);
        });

        add(0.12, 1.5, 2.5, -5.9, 2.5, -2, 0xADD8E6);
        add(0.12, 1.5, 2.5, -5.9, 2.5,  2, 0xADD8E6);
        add(0.15, 2.2, 1, 5.93, 1.1, 4, 0x8B4513);
    }
}


function spawnSchoolNPCs() {
    const isSIP = player.school === 'SIP';
    const teacherName  = isSIP ? 'Prof. White' : 'Mr. Brown';
    const teacherColor = isSIP ? 0x1a5276 : 0x145a32;
    const teacherStart = isSIP ? { x: 0, z: -3.5 } : { x: -0.5, z: -2 };

    const teacherGroup = buildNPC(teacherStart.x, teacherStart.z, teacherColor, 0x888888, {
        name: teacherName, dialogue: '', happiness: 0, isSchoolNPC: true, npcType: 'teacher'
    });
    schoolNPCList.push({ group: teacherGroup, target: { ...teacherStart }, isTeacher: true, deskPos: null });
    schoolObjects.push(teacherGroup);
    clickableNPCs.push(teacherGroup);

    const colors     = [0x3498DB, 0xE74C3C, 0x27AE60];
    const hairColors = [0x4B2800, 0xCC0066, 0x2c1a00];
    // Classmates sit at the front row of desks, facing the board
    const deskSpots = isSIP
        ? [{ x: -5, z: 1.8 }, { x: -1.7, z: 1.8 }, { x: 1.7, z: 1.8 }]
        : [{ x: -3, z: 1.2 }, { x:  0,   z: 1.2 }, { x:  3,  z: 1.2 }];

    getCurrentClassmates().forEach((c, i) => {
        const desk = deskSpots[i];
        const group = buildNPC(desk.x, desk.z, colors[i], hairColors[i], {
            name: c.name, dialogue: '', happiness: 0, isSchoolNPC: true, npcType: 'classmate'
        });
        const kidScale = Math.min(1.0, 0.50 + (player.age - 5) * 0.037);
        group.scale.set(kidScale, kidScale, kidScale);
        group.rotation.y = Math.PI; // face toward the board
        schoolNPCList.push({ group, target: { ...desk }, isTeacher: false, deskPos: { ...desk } });
        schoolObjects.push(group);
        clickableNPCs.push(group);
    });

    teacherApproachState = 'wandering';
    nextApproachTime = Date.now() + 4000 + Math.random() * 6000; // 4-10s before first question
}


function enterSchool() {
    if (inSchool) return;
    inSchool = true;
    // Exam days: every 10th day of the year (day 10, 20, 30 ... 100)
    isExamDay = player.sleepCount > 0 && player.sleepCount % 10 === 0;
    failedExamToday = false;
    if (isExamDay) {
        showEvent('📝', 'Exam day today! The teacher will test you!');
    } else {
        showEvent('📚', 'Regular school day — chat with classmates!');
    }

    // Missed homework from last time? The teacher notices.
    if (player.homework) {
        const missedSubject = player.homework;
        player.homework = null;
        player.happiness = Math.max(0, player.happiness - 8);
        setTimeout(() => {
            showEvent('😠', `You never finished your ${missedSubject} homework! -8 happiness`);
            updateStats(); saveGame();
        }, 2500);
    }

    // Save and remove all home objects (keep lights and player)
    scene.children.slice().forEach(obj => {
        if (obj !== playerMesh &&
            obj.type !== 'AmbientLight' &&
            obj.type !== 'DirectionalLight') {
            homeSceneObjects.push(obj);
            scene.remove(obj);
        }
    });
    clickableNPCs.length = 0;
    schoolPeriod = 0;
    correctThisPeriod = 0;

    buildSchoolRoom();
    spawnSchoolNPCs();

    const startZ = player.school === 'SIP' ? 6 : 3.5;
    playerMesh.position.set(0, player.age <= 4 ? 0.9 : 0, startZ);
    document.getElementById('location-name').textContent = '🏫 School';
    updateActionPanel();
    showEvent('🏫', 'You walked into school! Click NPCs to interact.');
    setTimeout(() => maybeSpawnBully(), 4000);
}


function pickUpFromSchool() {
    // Spawn a parent at the classroom door who walks to the player
    const parentGroup = buildNPC(5.5, 3.8, 0x4169E1, 0x4B2800, {
        name: 'Mom', dialogue: '', happiness: 0, isSchoolNPC: false
    });
    schoolObjects.push(parentGroup);
    showEvent('👪', 'Mom walked in to pick you up from school!');

    const walk = setInterval(() => {
        const px = playerMesh.position.x;
        const pz = playerMesh.position.z;
        parentGroup.position.x += (px - parentGroup.position.x) * 0.07;
        parentGroup.position.z += (pz - parentGroup.position.z) * 0.07;
        const dist = Math.hypot(px - parentGroup.position.x, pz - parentGroup.position.z);
        if (dist < 1.2) {
            clearInterval(walk);
            setTimeout(leaveSchool3D, 700);
        }
    }, 50);
}


function leaveSchool3D() {
    if (!inSchool) return;
    inSchool = false;
    activeBully = null;

    schoolObjects.forEach(obj => scene.remove(obj));
    schoolObjects.length = 0;
    schoolNPCList.length = 0;
    clickableNPCs.length = 0;

    homeSceneObjects.forEach(obj => scene.add(obj));
    homeSceneObjects.length = 0;

    playerMesh.position.set(0, player.age <= 4 ? 0.9 : 0, 0);
    document.getElementById('location-name').textContent = '🏠 Home';
    updateActionPanel();
    if (failedExamToday) {
        failedExamToday = false;
        setTimeout(() => {
            showEvent('😡', 'Mom and Dad are FURIOUS about your exam! -15 happiness, -10 health!');
            player.happiness = Math.max(0, player.happiness - 15);
            player.health    = Math.max(0, player.health    - 10);
            // Parents rush toward player angrily
            if (momAI) { momAI.state = 'wandering'; momAI.target = { x: 0.8, z: 0 }; }
            if (dadAI) { dadAI.state = 'wandering'; dadAI.target = { x:-0.8, z: 0 }; }
            updateStats(); saveGame();
            // If relatives are visiting, they jump in to defend you!
            if (activeRelatives.length > 0) {
                setTimeout(() => relativesAttackParents(), 1200);
            }
            setTimeout(assignHomework, 3000);
        }, 1500);
    } else {
        showEvent('🏠', 'You\'re home! See you tomorrow!');
        setTimeout(assignHomework, 2500);
    }
}


function assignHomework() {
    if (inSchool) return;
    const subjects = ['Math', 'Reading', 'Science', 'Art'];
    player.homework = subjects[Math.floor(Math.random() * subjects.length)];
    showEvent('📝', `Homework assigned: ${player.homework}! Do it at home before school tomorrow.`);
    updateActionPanel();
    saveGame();
}


function doHomework() {
    if (!player.homework) return;
    if (document.getElementById('math-overlay')) return;
    if (document.getElementById('math-inline')) return;
    const q = generateClassQuestion(player.homework);
    currentQuestion = q;
    const emoji = SUBJECT_EMOJI[q.subject] || '📋';

    const overlay = document.createElement('div');
    overlay.id = 'math-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #FFD700; border-radius:16px;
                    padding:32px 40px; text-align:center; min-width:300px;">
            <p style="color:#aaa; margin-bottom:4px; font-size:0.85em;">${emoji} Grade ${q.grade} ${q.subject} homework</p>
            <p style="color:#aaa; margin-bottom:10px; font-size:1em;">📝 Finish it before school tomorrow!</p>
            <h2 style="color:#FFD700; font-size:1.8em; margin-bottom:22px;">${q.question}</h2>
            <div>
                ${q.choices.map((c, i) =>
                    `<button onclick="answerHomework(${i}, ${q.correctIndex})"
                        style="font-size:1.1em; padding:10px 18px; margin:6px;
                               background:#0f3460; color:white; border:2px solid #3498db;
                               border-radius:10px; cursor:pointer;
                               transition:background 0.15s;"
                        onmouseover="this.style.background='#1a6090'"
                        onmouseout="this.style.background='#0f3460'">${c}</button>`
                ).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}


function answerHomework(chosenIndex, correctIndex) {
    const overlay = document.getElementById('math-overlay');
    if (overlay) overlay.remove();
    const correctText = currentQuestion ? currentQuestion.choices[correctIndex] : correctIndex;

    if (chosenIndex === correctIndex) {
        const eduGain = player.school === 'SIP' ? 5 : 3;
        player.education = Math.min(100, player.education + eduGain);
        player.happiness = Math.min(100, player.happiness + 5);
        player.homework = null;
        showEvent('🎉', `Homework done! +${eduGain} education, +5 happiness!`);
    } else {
        showEvent('❌', `Not quite! The answer was ${correctText}. Try again!`);
    }
    updateStats(); updateActionPanel(); saveGame();
}


function updateSchoolNPCs() {
    const teacherNpc = schoolNPCList.find(n => n.isTeacher);

    // Teacher only approaches during class periods (0, 2, 3, 5, 6) AND on exam days
    const isClassPeriod = [0, 2, 3, 5, 6].includes(schoolPeriod);
    if (teacherNpc && isClassPeriod && isExamDay) {
        if (teacherApproachState === 'wandering' && Date.now() > nextApproachTime) {
            teacherApproachState = 'approaching';
            showEvent('🧑‍🏫', `${teacherNpc.group.userData.npcData.name} is coming over!`);
        }
        if (teacherApproachState === 'approaching') {
            teacherNpc.target = { x: playerMesh.position.x + 1.2, z: playerMesh.position.z };
        }
    }

    schoolNPCList.forEach(npc => {
        // Classmates always return to their desk
        if (!npc.isTeacher && npc.deskPos) npc.target = npc.deskPos;

        const p = npc.group.position;
        p.x += (npc.target.x - p.x) * 0.025;
        p.z += (npc.target.z - p.z) * 0.025;
        const dx = npc.target.x - p.x;
        const dz = npc.target.z - p.z;
        const dist = Math.hypot(dx, dz);

        if (npc.isTeacher) {
            // Rotate teacher to face direction of movement
            if (Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05) {
                npc.group.rotation.y = Math.atan2(dx, dz);
            }
            if (teacherApproachState === 'approaching' && dist < 1.8) {
                // Close enough — ask the question, then go back to wandering
                teacherApproachState = 'wandering';
                nextApproachTime = Date.now() + 7000 + Math.random() * 9000; // 7-16s between questions
                if (!document.getElementById('math-overlay')) {
                    askMathQuestion(npc.group.userData.npcData.name);
                }
            } else if (teacherApproachState === 'wandering' && dist < 0.2) {
                npc.target = schoolRandomPos(true);
            }
        }
    });
}

// =============================================
// SCHOOL SCHEDULE
// =============================================

function advancePeriod() {
    schoolPeriod++;
    correctThisPeriod = 0;
    teacherApproachState = 'wandering';
    updateActionPanel();

    if (schoolPeriod === 1) {
        showFoodBreak('snack');
    } else if (schoolPeriod === 2) {
        showEvent('🔔', 'Snack over! Class 2 starting!');
        nextApproachTime = Date.now() + 3000 + Math.random() * 5000; // 3-8s randomly
    } else if (schoolPeriod === 3) {
        showEvent('🔔', 'Class 3 starting!');
        nextApproachTime = Date.now() + 3000 + Math.random() * 5000; // 3-8s randomly
    } else if (schoolPeriod === 4) {
        showFoodBreak('lunch');
    } else if (schoolPeriod === 5) {
        showEvent('🔔', 'Class 4 starting!');
        nextApproachTime = Date.now() + 3000 + Math.random() * 5000; // 3-8s randomly
    } else if (schoolPeriod === 6) {
        showEvent('🏃', 'Time for PE! Get ready to move!');
        nextApproachTime = Date.now() + 3000 + Math.random() * 5000; // 3-8s randomly
    } else if (schoolPeriod >= 7) {
        showEvent('🎒', 'School day done! Your parent is coming!');
        setTimeout(() => pickUpFromSchool(), 2000);
    }
}


function showFoodBreak(type) {
    const isLunch = type === 'lunch';
    const foods = isLunch
        ? [
            { emoji: '🍕', name: 'Pizza',     hap: 15, health: 5  },
            { emoji: '🥪', name: 'Sandwich',  hap: 10, health: 8  },
            { emoji: '🥗', name: 'Salad',     hap: 8,  health: 12 },
          ]
        : [
            { emoji: '🍎', name: 'Apple',     hap: 8,  health: 5,  cost: 2 },
            { emoji: '🧇', name: 'Crackers',  hap: 10, health: 2,  cost: 3 },
            { emoji: '🧃', name: 'Juice Box', hap: 7,  health: 3,  cost: 2 },
          ];

    // Snack now costs money (lunch stays free). If you can't afford even the
    // cheapest snack, you go hungry instead of getting stuck with no options.
    if (!isLunch && player.money < Math.min(...foods.map(f => f.cost))) {
        player.happiness = Math.max(0, player.happiness - 3);
        updateStats(); saveGame();
        showEvent('😢', "You don't have enough money for a snack! -3 happiness");
        setTimeout(advancePeriod, 1500);
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'food-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid ${isLunch ? '#e74c3c' : '#f39c12'};
                    border-radius:16px; padding:30px 36px; text-align:center; min-width:300px;">
            <h2 style="color:${isLunch ? '#e74c3c' : '#f39c12'}; font-size:1.8em; margin-bottom:6px;">
                ${isLunch ? '🍽️ Lunch Time!' : '🍎 Snack Time!'}
            </h2>
            <p style="color:#aaa; margin-bottom:18px;">
                What do you want? ${!isLunch ? `<br><span style="color:#f1c40f">💰 You have $${player.money}</span>` : ''}
            </p>
            ${foods.map(f => {
                const cost = f.cost || 0;
                const canAfford = player.money >= cost;
                return `
                <button onclick="${canAfford ? `eatFood(${f.hap}, ${f.health}, ${cost})` : ''}" ${canAfford ? '' : 'disabled'}
                    style="display:block; width:100%; margin:8px 0; padding:12px; font-size:1.05em;
                           background:#0f3460; color:white; border:2px solid #3498db;
                           border-radius:10px; text-align:left;
                           ${canAfford ? 'cursor:pointer;' : 'cursor:not-allowed; opacity:0.4;'}"
                    ${canAfford ? `onmouseover="this.style.background='#1a6090'" onmouseout="this.style.background='#0f3460'"` : ''}>
                    ${f.emoji} ${f.name}
                    ${cost > 0 ? `<span style="color:#f1c40f"> 💰$${cost}</span>` : ''}
                    &nbsp; <span style="color:#2ecc71">+${f.hap}😊</span>
                    <span style="color:#e74c3c"> +${f.health}❤️</span>
                </button>`;
            }).join('')}
        </div>
    `;
    document.body.appendChild(overlay);
}


function eatFood(hap, health, cost) {
    const overlay = document.getElementById('food-overlay');
    if (overlay) overlay.remove();
    player.money -= (cost || 0);
    player.happiness = Math.min(100, player.happiness + hap);
    player.health    = Math.min(100, player.health    + health);
    updateStats(); saveGame();
    showEvent('😋', cost ? `Yum! -$${cost}, +${hap} happiness, +${health} health` : `Yum! +${hap} happiness, +${health} health`);
    setTimeout(advancePeriod, 1200);
}

// =============================================
// QUIZ QUESTIONS — Math, Reading, Science, Art, and PE for all 3
// school types (SIP, Ohlor, Homeschool), scaled by grade and city.
// =============================================

function gradeTier(grade) {
    return grade <= 7 ? grade - 1 : 7;
}

// Every city's classmates also teach a handful of city-flavoured facts, mixed into
// whatever grade-tier pool is drawn from — so moving to a new city changes what you learn too.

function withCityFlavor(basePool, subject) {
    const theme = CITY_THEMES[player.city];
    return theme ? [...basePool, ...theme[subject]] : basePool;
}

// Picks one item from a pool and builds 3 wrong-answer choices from the other items in that pool

function pickWithDistractors(pool, key) {
    const item = pool[Math.floor(Math.random() * pool.length)];
    const wrongs = pool.filter(p => p !== item)
                        .map(p => p[key])
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3);
    const choices = [...wrongs, item[key]].sort(() => Math.random() - 0.5);
    return { item, choices, correctIndex: choices.indexOf(item[key]) };
}


function generateMathQuestion() {
    const grade = Math.max(1, player.age - 4);
    let a, b, op, answer;

    if (grade === 1) {
        // Grade 1: single-digit addition only
        a = Math.floor(Math.random() * 8) + 1;
        b = Math.floor(Math.random() * 8) + 1;
        op = '+'; answer = a + b;
    } else if (grade === 2) {
        // Grade 2: add and subtract up to 20
        a = Math.floor(Math.random() * 14) + 5;
        b = Math.floor(Math.random() * 10) + 1;
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '-' && b > a) [a, b] = [b, a];
        answer = op === '+' ? a + b : a - b;
    } else if (grade <= 4) {
        // Grade 3-4: add, subtract and small multiplication
        a = Math.floor(Math.random() * 9) + 2;
        b = Math.floor(Math.random() * 9) + 2;
        op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
        if (op === '-' && b > a) [a, b] = [b, a];
        answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    } else if (grade <= 7) {
        // Grade 5-7: bigger multiplication
        a = Math.floor(Math.random() * 12) + 3;
        b = Math.floor(Math.random() * 12) + 3;
        op = Math.random() < 0.65 ? '×' : '+';
        answer = op === '×' ? a * b : a + b;
    } else {
        // Grade 8+: large numbers
        a = Math.floor(Math.random() * 25) + 10;
        b = Math.floor(Math.random() * 25) + 10;
        op = Math.random() < 0.65 ? '×' : '+';
        answer = op === '×' ? a * b : a + b;
    }

    const wrongs = new Set();
    while (wrongs.size < 3) {
        const offset = Math.floor(Math.random() * 8) - 4;
        const w = answer + (offset === 0 ? 1 : offset);
        if (w !== answer && w >= 0) wrongs.add(w);
    }
    const numChoices = [...wrongs, answer].sort(() => Math.random() - 0.5);

    return { subject: 'Math', question: `${a} ${op} ${b} = ?`, choices: numChoices.map(String), correctIndex: numChoices.indexOf(answer), grade };
}

// ---------------------------------------------
// READING — word meaning quiz
// ---------------------------------------------

function generateReadingQuestion(grade) {
    const pool = withCityFlavor(READING_BANKS[gradeTier(grade)], 'Reading');
    const { item, choices, correctIndex } = pickWithDistractors(pool, 'meaning');
    return { subject: 'Reading', question: `What does "${item.word}" mean?`, choices, correctIndex, grade };
}

// ---------------------------------------------
// SCIENCE — fact quiz
// ---------------------------------------------

function generateScienceQuestion(grade) {
    const pool = withCityFlavor(SCIENCE_BANKS[gradeTier(grade)], 'Science');
    const { item, choices, correctIndex } = pickWithDistractors(pool, 'answer');
    return { subject: 'Science', question: item.q, choices, correctIndex, grade };
}

// ---------------------------------------------
// ART — color & art history quiz
// ---------------------------------------------

function generateArtQuestion(grade) {
    const pool = withCityFlavor(ART_BANKS[gradeTier(grade)], 'Art');
    const { item, choices, correctIndex } = pickWithDistractors(pool, 'answer');
    return { subject: 'Art', question: item.q, choices, correctIndex, grade };
}


function generateClassQuestion(subject) {
    const grade = Math.max(1, player.age - 4);
    if (subject === 'Reading') return generateReadingQuestion(grade);
    if (subject === 'Science') return generateScienceQuestion(grade);
    if (subject === 'Art')     return generateArtQuestion(grade);
    return generateMathQuestion();
}

// ---------------------------------------------
// PE — physical challenge, not a quiz: click fast to complete it
// ---------------------------------------------

function startPEChallenge(introLabel, onComplete) {
    if (document.getElementById('math-overlay')) return;
    if (document.getElementById('math-inline')) return;
    peChallenge = PE_CHALLENGES[Math.floor(Math.random() * PE_CHALLENGES.length)];
    peClicks = 0;
    peOnComplete = onComplete;

    const overlay = document.createElement('div');
    overlay.id = 'math-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #2ecc71; border-radius:16px;
                    padding:32px 40px; text-align:center; min-width:300px;">
            <p style="color:#aaa; margin-bottom:4px; font-size:0.85em;">${introLabel}</p>
            <h2 style="color:#FFD700; font-size:1.6em; margin-bottom:14px;">${peChallenge.emoji} Let's do ${peChallenge.target} ${peChallenge.name}!</h2>
            <p id="pe-count" style="color:#2ecc71; font-size:2em; font-weight:bold; margin-bottom:18px;">0 / ${peChallenge.target}</p>
            <button class="action-btn" onclick="doPEClick()" style="font-size:1.3em; padding:16px 40px;">${peChallenge.emoji} GO!</button>
        </div>
    `;
    document.body.appendChild(overlay);
}


function doPEClick() {
    peClicks++;
    const el = document.getElementById('pe-count');
    if (el) el.textContent = `${peClicks} / ${peChallenge.target}`;
    if (peClicks >= peChallenge.target) {
        const overlay = document.getElementById('math-overlay');
        if (overlay) overlay.remove();
        const cb = peOnComplete;
        peOnComplete = null;
        if (cb) cb();
    }
}


function askMathQuestion(npcName) {
    if (document.getElementById('math-overlay')) return;
    if (document.getElementById('math-inline')) return;
    const subject = SUBJECT_BY_PERIOD[schoolPeriod] || 'Math';

    if (subject === 'PE') {
        startPEChallenge(`🏃 PE — ${npcName} says:`, () => {
            const eduGain = player.school === 'SIP' ? 6 : 4;
            player.education = Math.min(100, player.education + eduGain);
            player.happiness = Math.min(100, player.happiness + 5);
            correctThisPeriod++;
            const left = QUESTIONS_PER_CLASS - correctThisPeriod;
            if (left <= 0) {
                showEvent('🎉', `Great workout! Class done! +${eduGain} education!`);
                setTimeout(advancePeriod, 1500);
            } else {
                showEvent('✅', `Awesome! ${left} more challenge${left > 1 ? 's' : ''} to finish. +${eduGain} edu, +5 happiness!`);
                nextApproachTime = Date.now() + 3000 + Math.random() * 5000;
            }
            updateStats(); saveGame();
        });
        return;
    }

    const q = generateClassQuestion(subject);
    currentQuestion = q;
    const emoji = SUBJECT_EMOJI[q.subject] || '📋';

    // If chat is open, inject question into the chat window instead of a popup
    const chatBox = document.getElementById('chat-messages');
    if (chatBox) {
        const div = document.createElement('div');
        div.id = 'math-inline';
        div.style.cssText = 'margin:8px 0;';
        div.innerHTML = `
            <div style="background:#1a2a10; border:2px solid #FFD700; border-radius:12px; padding:10px 14px;">
                <div style="color:#aaa; font-size:0.8em; margin-bottom:4px;">${emoji} Grade ${q.grade} ${q.subject} — 👨‍🏫 ${npcName} asks:</div>
                <div style="color:#FFD700; font-size:1.25em; font-weight:bold; margin-bottom:8px;">${q.question}</div>
                <div>${q.choices.map((c, i) =>
                    `<button onclick="answerMathInline(${i}, ${q.correctIndex})"
                        style="font-size:0.95em; padding:6px 14px; margin:3px;
                               background:#0f3460; color:white; border:2px solid #3498db;
                               border-radius:8px; cursor:pointer;">${c}</button>`
                ).join('')}</div>
            </div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    // No chat open — use normal popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'math-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #FFD700; border-radius:16px;
                    padding:32px 40px; text-align:center; min-width:300px;">
            <p style="color:#aaa; margin-bottom:4px; font-size:0.85em;">${emoji} Grade ${q.grade} ${q.subject} question</p>
            <p style="color:#aaa; margin-bottom:10px; font-size:1em;">💬 ${npcName} asks:</p>
            <h2 style="color:#FFD700; font-size:1.8em; margin-bottom:22px;">${q.question}</h2>
            <div>
                ${q.choices.map((c, i) =>
                    `<button onclick="answerMath(${i}, ${q.correctIndex})"
                        style="font-size:1.1em; padding:10px 18px; margin:6px;
                               background:#0f3460; color:white; border:2px solid #3498db;
                               border-radius:10px; cursor:pointer;
                               transition:background 0.15s;"
                        onmouseover="this.style.background='#1a6090'"
                        onmouseout="this.style.background='#0f3460'">${c}</button>`
                ).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}


function answerMath(chosen, correct) {
    const overlay = document.getElementById('math-overlay');
    if (overlay) overlay.remove();
    handleMathAnswer(chosen, correct);
}


function answerMathInline(chosen, correct) {
    const inline = document.getElementById('math-inline');
    if (inline) inline.remove();
    handleMathAnswer(chosen, correct);
}


function handleMathAnswer(chosenIndex, correctIndex) {
    const correctText = currentQuestion ? currentQuestion.choices[correctIndex] : correctIndex;
    if (chosenIndex === correctIndex) {
        const eduGain = player.school === 'SIP' ? 6 : 4;
        player.education = Math.min(100, player.education + eduGain);
        player.happiness = Math.min(100, player.happiness + 3);
        correctThisPeriod++;
        const left = QUESTIONS_PER_CLASS - correctThisPeriod;
        if (left <= 0) {
            showEvent('🎉', `Class done! Amazing! +${eduGain} education!`);
            setTimeout(advancePeriod, 1500);
        } else {
            showEvent('✅', `Correct! ${left} more question${left > 1 ? 's' : ''} to finish. +${eduGain} edu!`);
            nextApproachTime = Date.now() + 3000 + Math.random() * 5000;
        }
    } else {
        showEvent('❌', `Not quite! The answer was ${correctText}. Teacher will ask again!`);
        nextApproachTime = Date.now() + 3000 + Math.random() * 5000;
        if (isExamDay) failedExamToday = true;
    }
    updateStats(); saveGame();
}

