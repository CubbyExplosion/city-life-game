// =============================================
// CORE — game lifecycle: save/load, start/restart, the day timer,
// and the two UI panels (stats bar + action buttons) almost every
// other file calls after changing something.
// =============================================

function showEvent(emoji, message) {
    const banner = document.getElementById('event-banner');
    document.getElementById('event-content').innerHTML =
        `<div class="event-emoji">${emoji}</div><div class="event-text">${message}</div>`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2500);
}

// ---- Save / Load ----
function saveGame() {
    localStorage.setItem('citylife_player',  JSON.stringify(player));
    localStorage.setItem('citylife_lastDay', lastDayTime.toString());
}

function loadSavedGame() {
    const saved = localStorage.getItem('citylife_player');
    const savedTime = localStorage.getItem('citylife_lastDay');
    if (saved && JSON.parse(saved).gender) {
        Object.assign(player, JSON.parse(saved));
        lastDayTime = savedTime ? parseInt(savedTime) : Date.now();
        return true;
    }
    return false;
}

// ---- Start / Continue / Launch ----
function startGame(gender) {
    const nameList = NAMES[gender];
    player.name = nameList[Math.floor(Math.random() * nameList.length)];
    player.gender = gender;
    player.age = 1; player.money = 0; player.sleepCount = 0;
    player.happiness = 50; player.health = 100; player.education = 0;
    player.city = 'Maple Grove'; player.lastMoveAge = 0; player.homework = null;
    player.parentTemperament = Math.random() < 0.5 ? 'strict' : 'calm';
    player.toys = []; player.gifts = [];
    rollSnowYear();
    birthdayMessage = '';
    lastDayTime = Date.now();
    saveGame();
    launchGame();
    setTimeout(() => showEvent('👶', `Your parents named you ${player.name}!`), 800);
}

function continueGame() {
    launchGame();
}

function launchGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    updateStats();
    initThreeJS();
    catchUpDays();
    startDayTimer();
    refreshHomeExtras(); // winter decorations, presents and toys already waiting at home
    setInterval(parentCheckOnBaby, 20000);
    // Parents wander freely every 5 seconds
    setInterval(() => {
        [momAI, dadAI].forEach(ai => {
            if (ai.state === 'sitting' && Math.random() < 0.5) {
                ai.state  = 'wandering';
                ai.target = randomRoomPos();
            }
        });
    }, 5000);
    updateActionPanel();
}

// ---- Day Timer ----
function setSpeed(n) {
    daySpeed = n;
    lastDayTime = Date.now(); // reset so the countdown starts fresh at the new speed
    updateActionPanel();
}

function startDayTimer() {
    if (dayTimerInterval) clearInterval(dayTimerInterval);
    dayTimerInterval = setInterval(() => {
        if (driving || inStore) return; // the clock pauses during car rides and store trips (they put it back when they end)
        const effectiveDayMs = DAY_MS / daySpeed;
        const remaining = effectiveDayMs - (Date.now() - lastDayTime);
        if (remaining <= 0) {
            lastDayTime = Date.now();
            advanceOneDay(false);
            saveGame();
        } else {
            updateCountdown(remaining);
        }
    }, 1000);
}

function updateCountdown(ms) {
    const el = document.getElementById('day-timer');
    if (!el) return;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2,'0')}`;
}

function catchUpDays() {
    const missed = Math.floor((Date.now() - lastDayTime) / DAY_MS);
    for (let i = 0; i < missed; i++) advanceOneDay(true);
    if (missed > 0) { lastDayTime = Date.now(); saveGame(); updateStats(); updateActionPanel(); }
}

function advanceOneDay(silent) {
    birthdayMessage = '';
    player.sleepCount += 1;
    let extrasDirty = false; // did the house need new decorations/presents/snow today?

    if (player.sleepCount >= 100) {
        player.sleepCount = 0;
        player.age += 1;
        player.health = Math.max(0, player.health - 1);
        rollSnowYear();       // a brand-new year: will this winter have snow?
        extrasDirty = true;   // winter is over — the tree and snow come down

        if (!silent && scene) buildPlayerMesh(); // update appearance for new age

        if (player.age > 85) {
            clearInterval(dayTimerInterval);
            alert('You lived to age 85! Starting again...');
            restartGame();
            return;
        }

        if (Math.random() < 0.7) {
            player.happiness = Math.min(100, player.happiness + 10);
            if (!silent) birthdayMessage += '🎂 You got a cake! +10 happiness  ';
        }
        if (giveGift('birthday') && !silent) birthdayMessage += '🎁 A birthday present is waiting for you!  ';
        if (player.age === 5 && !silent) {
            setTimeout(() => showSchoolChoice(), 1500);
        }
        if (!silent) birthdayMessage = `🎉 ${player.name} turned ${player.age} today! ` + birthdayMessage;
        if (!silent) maybeTriggerCityMove();
    }

    // Winter: starts on day 85 (tree goes up), Santa comes on the last day of the year
    if (player.sleepCount === WINTER_START_DAY) { announceWinter(silent); extrasDirty = true; }
    if (player.sleepCount === CHRISTMAS_DAY)    { santaVisit(silent);     extrasDirty = true; }

    // Every 3 days, a relative might visit
    if (!silent && !inSchool && player.sleepCount % 3 === 0 && Math.random() < 0.7) {
        setTimeout(() => spawnRelative(), 1000);
    }

    // Every 5 days, a pet might go missing nearby
    if (!silent && player.sleepCount % 5 === 0) {
        maybeTriggerMissingPet();
    }

    // Every 7 days, you might find something on the ground
    if (!silent && player.sleepCount % 7 === 0) {
        maybeTriggerFoundMoney();
    }

    if (!silent) {
        if (extrasDirty) refreshHomeExtras();
        updateStats(); updateActionPanel();
    }
}

// ---- Action Panel ----
function updateActionPanel() {
    const panel = document.getElementById('action-panel');

    const speedBtns = [1, 2, 5, 10, 15, 20].map(n =>
        `<button class="speed-btn${daySpeed === n ? ' speed-active' : ''}" onclick="setSpeed(${n})">${n}x</button>`
    ).join('');
    const seasonTag = isSnowing() ? '❄️ Snowing &nbsp;|&nbsp; ' : isWinter() ? '🎄 Winter &nbsp;|&nbsp; ' : '';
    const dayInfo = `${seasonTag}☀️ Day <strong>${player.sleepCount}/100</strong> &nbsp;|&nbsp; Next day in: <strong><span id="day-timer">--:--</span></strong> &nbsp;|&nbsp; ⏩ ${speedBtns}`;

    // At the grocery store: show your cart, the crowd, and a button back to the car
    if (inStore && store) {
        const items = store.cart ? store.cart.items : [];
        const total = items.reduce((sum, it) => sum + it.price, 0);
        const hint = !store.cart
            ? '🛒 Walk into a cart by the door to grab it!'
            : items.length === 0
                ? '🛒 Push your cart around — Mom &amp; Dad will add groceries, or click the shelves!'
                : '💳 Push your cart to a CHECKOUT lane (left or right side) when you\'re ready!';
        panel.innerHTML = `
            <div style="color:#aaa;margin-bottom:4px">🛒 Cart: <strong>${items.length}</strong> items ($${total})
                &nbsp;|&nbsp; 👥 <strong>${store.crowdCount}</strong> shoppers — ${crowdLabel(store.crowdCount)}</div>
            <div style="color:#FFD700;margin-bottom:6px">${hint}</div>
            <button class="action-btn" onclick="leaveStore(false)">🚗 Back to the car</button>`;
        return;
    }

    if (inSchool) {
        const isClassPd = [0, 2, 3, 5, 6].includes(schoolPeriod);
        const progress = isClassPd
            ? ` <span style="color:#2ecc71">${correctThisPeriod}/${QUESTIONS_PER_CLASS} ✓</span>` : '';
        panel.innerHTML = `
            <div style="color:#aaa;margin-bottom:4px">${dayInfo}</div>
            <div style="color:#FFD700;font-size:1em;margin-bottom:4px">${PERIOD_LABELS[schoolPeriod] || ''}${progress}</div>
            <button class="action-btn" onclick="pickUpFromSchool()">🏠 Go Home</button>`;
        return;
    }

    const bMsg = birthdayMessage
        ? `<p style="color:#FFD700;margin-bottom:4px">${birthdayMessage}</p>` : '';

    const cookBtn = `<button class="action-btn" onclick="openMiniGame()">🍳 Cook</button>`;
    const toyCount = (player.toys || []).length;
    const toyBtn = toyCount > 0
        ? `<button class="action-btn" onclick="showToyBox()">🧸 Toys (${toyCount})</button>`
        : '';

    if (player.age <= 2) {
        panel.innerHTML = `${bMsg}
            <div style="color:#aaa;margin-bottom:6px">${dayInfo}</div>
            <button class="action-btn" onclick="cry('milk')">😭 Cry for Milk</button>
            <button class="action-btn" onclick="cry('diaper')">😭 Cry for Diaper</button>
            ${toyBtn}`;
    } else {
        const schoolLabel = player.school === 'SIP' ? 'SIP' : player.school === 'Homeschool' ? 'Homeschool' : 'Ohlor';
        // Snow day: the study button turns into a "no school" sign
        const studyBtn = player.age >= 5 && player.school
            ? (isSnowing()
                ? `<button class="action-btn" onclick="study()" style="opacity:0.7">❄️ Snow day — no school!</button>`
                : `<button class="action-btn" onclick="study()">📚 Study (${schoolLabel})</button>`)
            : '';
        const homeworkBtn = player.homework
            ? `<button class="action-btn" onclick="doHomework()">📝 Homework (${player.homework})</button>`
            : '';
        const shopBtn = player.age >= 3
            ? `<button class="action-btn" onclick="openShopping()">🛍️ Go Shopping</button>`
            : '';
        panel.innerHTML = `${bMsg}
            <div style="color:#aaa;margin-bottom:6px">⬆️⬇️⬅️➡️ to walk &nbsp;|&nbsp; ${dayInfo}</div>
            ${cookBtn} ${shopBtn} ${toyBtn} ${studyBtn} ${homeworkBtn}`;
    }
}

// ---- Stats Bar ----
function updateStats() {
    document.getElementById('name-display').textContent   = player.name;
    document.getElementById('city-display').textContent   = player.city;
    document.getElementById('age-display').textContent    = player.age;
    document.getElementById('money-display').textContent  = player.money;
    document.getElementById('happy-display').textContent  = player.happiness;
    document.getElementById('health-display').textContent = player.health;
    document.getElementById('edu-display').textContent    = player.education;

    // Show grade badge only when age 5+
    const gradeEl = document.getElementById('grade-display');
    if (player.age >= 5) {
        const grade = player.age - 4;
        document.getElementById('grade-num').textContent = grade;
        gradeEl.style.display = 'inline';
    } else {
        gradeEl.style.display = 'none';
    }
}

// ---- How To Play overlay ----
function showHowToPlay() {
    document.getElementById('howto-overlay').classList.remove('hidden');
}

function closeHowToPlay() {
    document.getElementById('howto-overlay').classList.add('hidden');
}

// ---- Restart ----
function restartGame() {
    clearInterval(dayTimerInterval);
    cancelAnimationFrame(animationId);
    document.getElementById('three-container').innerHTML = '';
    player.name = 'Player'; player.age = 1; player.money = 0;
    player.sleepCount = 0; player.happiness = 50; player.health = 100;
    player.education = 0; player.gender = null; player.school = null;
    player.city = 'Maple Grove'; player.lastMoveAge = 0; player.homework = null;
    player.parentTemperament = 'calm';
    player.snowYear = false; player.toys = []; player.gifts = [];
    birthdayMessage = '';
    inSchool = false;
    inField = false;
    clearTimeout(recessTimer);
    driving = false;
    rideState = null;
    inStore = false;
    store = null;
    pickupInProgress = false;
    activeRelatives.length = 0;
    activeBully = null;
    activePet = null;
    homeschoolSubjectIndex = 0;
    currentQuestion = null;
    // Remove any dynamically-created popup that might still be open (found money,
    // bully confrontation, a class/homework/homeschool/PE question, school choice,
    // a present being opened, the toy box, a car ride caption)
    ['money-overlay', 'bully-overlay', 'math-overlay', 'school-overlay',
     'gift-overlay', 'toy-overlay', 'ride-overlay', 'checkout-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    localStorage.clear();
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('continue-btn').style.display = 'none';
}
