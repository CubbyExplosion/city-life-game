// =============================================
// LIFE — after school: university, a job, and paying for your own life.
//
//   🎓 At 18 you FINISH SCHOOL. Mom & Dad say you're an adult now. You choose:
//        UNIVERSITY  pick a major (8 to choose from), go to lectures, pass 3 years, get a DEGREE.
//                    Tuition is free with a scholarship (education 75+) or $100 a year (parents lend it if you're short —
//                    it becomes a LOAN that comes out of your paychecks).
//        A JOB       anyone can start with an entry-level job (from age 16!). With a school diploma you can get better ones,
//                    and with a DEGREE you can become a doctor, engineer, teacher, programmer, lawyer...
//   💼 WORK: once a day, "Go to Work" — a short shift of 4 hands-on tasks (mini-games, see work-tasks.js). Doing them well = better pay.
//        Do well and you get PROMOTED (a raise). Do badly three shifts in a row and you get FIRED.
//   🧾 BILLS: from 18, every 10 days you pay rent, utilities and transport ($65). Groceries and eating out are
//        paid from your own money too (see food.js). Not enough money? You go hungry and your bills pile up.
//   ⏸️ The day clock pauses whenever you're NOT at home — at school, university and work (core.js).
//
// Buttons on the home screen: 💼 Find a Job / Work, 🎓 University, 📋 Life.
// =============================================

const UNI_MAJORS = [
    { id: 'medicine',    name: 'Medicine',          emoji: '🩺', subject: 'Science' },
    { id: 'engineering', name: 'Engineering',       emoji: '🛠️', subject: 'Math' },
    { id: 'cs',          name: 'Computer Science',  emoji: '💻', subject: 'Math' },
    { id: 'business',    name: 'Business',          emoji: '📊', subject: 'Math' },
    { id: 'teaching',    name: 'Teaching',          emoji: '👩‍🏫', subject: 'Reading' },
    { id: 'law',         name: 'Law',               emoji: '⚖️', subject: 'Reading' },
    { id: 'science',     name: 'Science',           emoji: '🔬', subject: 'Science' },
    { id: 'arts',        name: 'Art & Design',      emoji: '🎨', subject: 'Art' }
];

// pay = money per shift. need.level: 0 = anyone (age 16+), 1 = finished school, 2 = any university degree (need.degree is just a hint)
const JOBS = [
    { id: 'cashier',    name: 'Cashier',           emoji: '🛒', pay: 22,  need: { level: 0 }, subject: 'Math' },
    { id: 'barista',    name: 'Barista',           emoji: '☕', pay: 24,  need: { level: 0 }, subject: 'Reading' },
    { id: 'stocker',    name: 'Shelf Stocker',     emoji: '📦', pay: 22,  need: { level: 0 }, subject: 'Science' },
    { id: 'janitor',    name: 'Cleaner',           emoji: '🧹', pay: 20,  need: { level: 0 }, subject: 'Science' },
    { id: 'delivery',   name: 'Delivery Driver',   emoji: '🚚', pay: 30,  need: { level: 1 }, subject: 'Math' },
    { id: 'reception',  name: 'Receptionist',      emoji: '🗂️', pay: 36,  need: { level: 1 }, subject: 'Reading' },
    { id: 'chef',       name: 'Chef',              emoji: '👨‍🍳', pay: 44,  need: { level: 1 }, subject: 'Art' },
    { id: 'mechanic',   name: 'Mechanic',          emoji: '🔧', pay: 46,  need: { level: 1 }, subject: 'Science' },
    { id: 'police',     name: 'Police Officer',    emoji: '👮', pay: 55,  need: { level: 1 }, subject: 'Science' },
    { id: 'teacher',    name: 'Teacher',           emoji: '👩‍🏫', pay: 62,  need: { level: 2, degree: 'teaching' },    subject: 'Reading' },
    { id: 'designer',   name: 'Designer',          emoji: '🎨', pay: 66,  need: { level: 2, degree: 'arts' },        subject: 'Art' },
    { id: 'accountant', name: 'Accountant',        emoji: '📊', pay: 80,  need: { level: 2, degree: 'business' },    subject: 'Math' },
    { id: 'scientist',  name: 'Scientist',         emoji: '🔬', pay: 90,  need: { level: 2, degree: 'science' },     subject: 'Science' },
    { id: 'engineer',   name: 'Engineer',          emoji: '🛠️', pay: 96,  need: { level: 2, degree: 'engineering' }, subject: 'Math' },
    { id: 'programmer', name: 'Programmer',        emoji: '💻', pay: 102, need: { level: 2, degree: 'cs' },          subject: 'Math' },
    { id: 'lawyer',     name: 'Lawyer',            emoji: '⚖️', pay: 110, need: { level: 2, degree: 'law' },         subject: 'Reading' },
    { id: 'doctor',     name: 'Doctor',            emoji: '🩺', pay: 124, need: { level: 2, degree: 'medicine' },    subject: 'Science' }
];

const LIVING_COSTS = { rent: 40, utilities: 15, transport: 10 };       // every 10 days, from age 18
const TUITION = 100;                                                   // per year, unless you have a scholarship
const UNI_YEARS = 3;
const LECTURES_PER_YEAR = 6;
const JOB_MIN_AGE = 16;

function isIndependent() { return player.age >= 18; }
function lifeDay() { return player.age * 100 + player.sleepCount; }
function jobById(id) { return JOBS.find(j => j.id === id); }
function majorById(id) { return UNI_MAJORS.find(m => m.id === id); }

function ensureLifeState() {
    if (player.graduated === undefined) player.graduated = false;
    if (player.loan === undefined) player.loan = 0;
    if (player.overdue === undefined) player.overdue = 0;
    if (player.lastWorkDay === undefined) player.lastWorkDay = -1;
    if (player.lastUniDay === undefined) player.lastUniDay = -1;
}

// Money coming in: 20% goes to pay off a student loan first
function earnMoney(amount) {
    ensureLifeState();
    let note = '';
    if (player.loan > 0) {
        const repay = Math.min(player.loan, Math.ceil(amount * 0.2));
        player.loan -= repay; amount -= repay;
        note = ` ($${repay} went to your student loan)`;
    }
    player.money += amount;
    updateStats(); saveGame();
    return note;
}

function lifeOverlay(html, border) {
    const old = document.getElementById('life-overlay');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'life-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.72); font-family:Arial; padding:14px; overflow-y:auto;`;
    el.innerHTML = `<div style="background:#16213e; border:3px solid ${border || '#3498db'}; border-radius:16px; padding:20px 26px; max-width:620px; width:100%;">${html}</div>`;
    document.body.appendChild(el);
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].forEach(k => { if (typeof keys !== 'undefined') keys[k] = false; });
}

function closeLifeOverlay() {
    const el = document.getElementById('life-overlay');
    if (el) el.remove();
}

const lifeBtn = (onclick, text, color, extra) => `<button onclick="${onclick}" style="margin:4px; padding:10px 18px; border:none; border-radius:10px; font-size:1em; font-weight:bold; cursor:pointer; color:white; background:${color}; ${extra || ''}">${text}</button>`;

// ---------------------------------------------
// every new day (called from advanceOneDay in core.js)
// ---------------------------------------------
function lifeNewDay(silent) {
    ensureLifeState();
    if (player.age >= 18 && typeof apartmentNewDay === 'function') apartmentNewDay();
    if (player.age >= 18 && player.sleepCount % 10 === 0) payBills(silent);
}

// Called when you turn 18 (from advanceOneDay)
function handleGraduation(silent) {
    ensureLifeState();
    if (player.graduated) return;
    player.graduated = true;
    player.school = null;                                // no more school
    player.homework = null;
    if (silent) return;
    setTimeout(showLifeChoice, 2500);
}

// Old saves: someone already past 18 who never graduated
function fixLifeForAge() {
    ensureLifeState();
    if (player.age >= 18 && !player.graduated) { player.graduated = true; player.school = null; }
}

function showLifeChoice() {
    if (document.getElementById('life-overlay')) return;
    lifeOverlay(`
        <div style="text-align:center;">
            <div style="font-size:3em;">🎓🎉</div>
            <h2 style="color:#FFD700; margin:6px 0;">You finished school!</h2>
            <p style="color:#ddd; margin-bottom:6px;">👩 Mom: "We're so proud of you! You're an adult now."</p>
            <p style="color:#ddd; margin-bottom:10px;">👨 Dad: "From now on you pay for your own food and bills — here's the plan: go to <b>university</b> and/or get a <b>job</b>."</p>
            <p style="color:#9ab; font-size:0.9em; margin-bottom:10px;">🧾 You can live with us for just $${PARENT_TRANSPORT} transport every 10 days — or <b>move out</b> into your own apartment (🏠 Move Out button). And groceries aren't free any more!</p>
            ${lifeBtn('showUniMajors()', '🎓 Go to university', '#8e44ad')}
            ${lifeBtn('showJobBoard()', '💼 Find a job', '#27ae60')}
            ${lifeBtn('closeLifeOverlay()', '⏳ Decide later', '#555')}
        </div>`, '#FFD700');
}

// ---------------------------------------------
// 🧾 bills
// ---------------------------------------------
function payBills(silent) {
    const due = livingCostTotal() + (player.overdue || 0);
    if (player.money >= due) {
        player.money -= due; player.overdue = 0;
        if (!silent) showEvent('🧾', `You paid your bills: rent, utilities and transport — $${due}.`);
    } else {
        const paid = Math.max(0, player.money);
        player.money -= paid;
        player.overdue = due - paid;
        player.happiness = Math.max(0, player.happiness - 10);
        player.health = Math.max(0, player.health - 4);
        if (!silent) showEvent('😰', `You couldn't pay your bills! You paid $${paid} and still owe $${player.overdue}. Get a job (or work more)! -10 happiness`);
    }
    if (!silent) { updateStats(); }
}

// ---------------------------------------------
// 💼 jobs
// ---------------------------------------------
function jobLevel() {
    if (player.degree) return 2;
    if (player.graduated) return 1;
    return 0;
}

function canTakeJob(j) {
    if (player.age < JOB_MIN_AGE) return { ok: false, why: `You must be ${JOB_MIN_AGE}` };
    if (j.need.level === 1 && !player.graduated) return { ok: false, why: 'Finish school first' };
    // ANY university degree opens ALL the degree jobs (doctor, lawyer, engineer...)
    if (j.need.level === 2 && !player.degree) return { ok: false, why: player.uni ? 'Finish university first' : 'Needs a university degree' };
    return { ok: true };
}

function showJobBoard() {
    ensureLifeState();
    if (player.age < JOB_MIN_AGE) { showEvent('💼', `You have to be ${JOB_MIN_AGE} to get a job.`); return; }
    const cur = player.job ? jobById(player.job.id) : null;
    lifeOverlay(`
        <h2 style="color:#FFD700; text-align:center;">💼 Job Board</h2>
        ${cur ? `<p style="color:#2ecc71; text-align:center; margin-bottom:6px;">You work as: ${cur.emoji} <b>${jobTitle()}</b> — $${currentPay()} per shift ${lifeBtn('quitJob()', 'Quit', '#c0392b', 'padding:4px 12px; font-size:0.85em;')}</p>` : '<p style="color:#aaa; text-align:center; margin-bottom:6px;">You don\'t have a job yet. Pick one to start!</p>'}
        <p style="color:#9ab; text-align:center; font-size:0.85em; margin-bottom:6px;">${player.degree ? '🎓 Degree: ' + majorById(player.degree).name : player.graduated ? '🏫 You have your school diploma' : '🧒 Entry-level jobs only (finish school and go to university for better ones)'}</p>
        <div style="max-height:52vh; overflow-y:auto;">
        ${JOBS.map(j => {
            const c = canTakeJob(j);
            const mine = cur && cur.id === j.id;
            return `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin:4px 0; padding:8px 12px; border-radius:10px; background:${mine ? '#1a7a4a' : '#0f3460'}; opacity:${c.ok ? 1 : 0.55};">
                <span style="color:#fff;">${j.emoji} <b>${j.name}</b><br><span style="font-size:0.8em; color:#aaa;">${c.ok ? 'Ready to apply!' : '🔒 ' + c.why}</span></span>
                <span style="white-space:nowrap; color:#2ecc71; font-weight:bold;">$${j.pay}/shift ${c.ok && !mine ? lifeBtn(`applyJob('${j.id}')`, 'Apply', '#27ae60', 'padding:5px 12px; font-size:0.85em;') : ''}</span></div>`;
        }).join('')}
        </div>
        <div style="text-align:center; margin-top:8px;">${lifeBtn('closeLifeOverlay()', 'Close', '#555')}</div>`, '#27ae60');
}

function currentPay() {
    const j = player.job && jobById(player.job.id);
    if (!j) return 0;
    return Math.round(j.pay * Math.pow(1.15, player.job.level || 0));
}

function jobTitle() {
    const j = player.job && jobById(player.job.id);
    if (!j) return '';
    const lv = player.job.level || 0;
    return (lv >= 2 ? 'Senior ' : lv === 1 ? 'Experienced ' : '') + j.name;
}

function applyJob(id) {
    const j = jobById(id);
    if (!j || !canTakeJob(j).ok) return;
    player.job = { id, shifts: 0, good: 0, bad: 0, level: 0 };
    saveGame();
    showEvent(j.emoji, `You got the job: ${j.name}! $${j.pay} per shift. Press 💼 Work to go to work.`);
    closeLifeOverlay();
    updateActionPanel();
}

function quitJob() {
    player.job = null;
    saveGame();
    showEvent('👋', 'You quit your job.');
    closeLifeOverlay(); updateActionPanel();
}

// ---- a shift: 4 work questions ----
let shift = null;

function goToWork() {
    ensureLifeState();
    if (!player.job) { showJobBoard(); return; }
    if (typeof inSchool !== 'undefined' && (inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni || place3D)) return;
    if (typeof otherPopupOpen === 'function' && otherPopupOpen()) return;
    if (player.lastWorkDay === lifeDay()) { showEvent('😴', 'You already worked today — come back tomorrow!'); return; }
    const j = jobById(player.job.id);
    inWork = true;                                         // the day clock stands still until you're home again
    const go = () => openWorkplace();                      // places.js: the 3D building
    if (!driveTo('to work', j.emoji, go, { self: isIndependent() })) go();
}

// Called by openWorkplace() once you've arrived: the shift starts (the questions come when you reach each pad)
function startShift() {
    const j = jobById(player.job.id);
    shift = { job: j, i: 0, correct: 0, q: null };
}

// You reached a pad: play that task's little mini-game (work-tasks.js). Doing it well = 1 point of 4.
function nextWorkQuestion() {
    if (!shift) return;
    runWorkTask(shift.job, shift.i, ok => {
        if (!shift) return;
        if (ok) shift.correct++;
        shift.i++;
        closeLifePanel();
        setTimeout(afterWorkTask, 150);
    });
}

// Task done: the next pad lights up (or the shift is over)
function afterWorkTask() {
    if (!shift) return;
    if (shift.i >= 4) { finishShift(); return; }
    const pl = place3D;
    if (pl) { pl.stationIndex = shift.i; refreshPads(pl); pl.busy = false; updateWorkHud(); }
    else nextWorkQuestion();
}

function finishShift() {
    const s = shift, j = s.job;
    shift = null;
    const base = currentPay();
    const pay = Math.round(base * (0.5 + 0.5 * s.correct / 4));
    const tip = s.correct === 4 ? Math.round(base * 0.1) : 0;
    const note = earnMoney(pay + tip);
    player.lastWorkDay = lifeDay();
    const job = player.job;
    job.shifts++;
    let extra = '';
    if (s.correct <= 1) { job.bad++; job.good = 0; } else { job.bad = 0; job.good++; }
    if (job.bad >= 3) {
        extra = `<p style="color:#e74c3c; margin-top:8px;">😞 Your boss says: "This isn't working out. You're fired." You lost your job.</p>`;
        player.job = null;
        player.happiness = Math.max(0, player.happiness - 12);
    } else if (job.good >= 6 && (job.level || 0) < 2) {
        job.level = (job.level || 0) + 1; job.good = 0;
        extra = `<p style="color:#2ecc71; margin-top:8px;">🎉 PROMOTION! You're now a ${jobTitle()} — your pay is now $${currentPay()} per shift!</p>`;
        player.happiness = Math.min(100, player.happiness + 8);
    }
    player.happiness = Math.max(0, Math.min(100, player.happiness + (s.correct >= 3 ? 2 : -2)));
    updateStats(); saveGame();
    removePlaceHud();
    lifeOverlay(`
        <div style="text-align:center;">
            <div style="font-size:3em;">${j.emoji}${s.correct === 4 ? '⭐' : ''}</div>
            <h2 style="color:#FFD700; margin:6px 0;">Shift finished!</h2>
            <p style="color:#fff;">You got <b>${s.correct} of 4</b> tasks right.</p>
            <p style="color:#2ecc71; font-size:1.2em; margin:6px 0;">💰 You earned <b>$${pay}</b>${tip ? ` + $${tip} tip!` : ''}${note}</p>
            ${extra}
            <div style="margin-top:12px;">${lifeBtn('goHomeFrom()', '🚗 Drive home', '#3498db')}</div>
        </div>`, '#2ecc71');
}

// Leave the workplace / campus and drive home (the day clock only starts again once you're home)
function goHomeFrom() {
    closeLifeOverlay();
    leavePlace(() => {
        const home = () => {
            inWork = false; inUni = false;
            document.getElementById('location-name').textContent = '🏠 Home';
            updateStats(); saveGame(); updateActionPanel();
        };
        if (!driveTo('home', '🏠', home, { self: isIndependent() })) home();
    });
}

// ---------------------------------------------
// 🎓 university
// ---------------------------------------------
function showUniMajors() {
    ensureLifeState();
    if (!player.graduated) { showEvent('🎓', 'Finish school first!'); return; }
    if (player.uni) { goToUniversity(); return; }
    if (player.degree) { showEvent('🎓', `You already have your ${majorById(player.degree).name} degree!`); return; }
    const free = player.education >= 75;
    lifeOverlay(`
        <h2 style="color:#FFD700; text-align:center;">🎓 University</h2>
        <p style="color:#aaa; text-align:center; margin-bottom:4px;">${UNI_YEARS} years · ${LECTURES_PER_YEAR} lectures a year · pick a major</p>
        <p style="color:${free ? '#2ecc71' : '#f1c40f'}; text-align:center; margin-bottom:8px;">${free ? '🏅 You have a SCHOLARSHIP — tuition is free!' : `💳 Tuition: $${TUITION} a year (Mom & Dad will lend it as a loan if you're short). Education 75+ = a scholarship!`}</p>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">
            ${UNI_MAJORS.map(m => lifeBtn(`enrollUni('${m.id}')`, `${m.emoji} ${m.name}`, '#8e44ad', 'width:200px;')).join('')}
        </div>
        <div style="text-align:center; margin-top:6px;">${lifeBtn('closeLifeOverlay()', 'Maybe later', '#555')}</div>`, '#8e44ad');
}

function payTuition() {
    if (player.education >= 75) return { cost: 0, text: '🏅 Scholarship — free this year!' };
    if (player.money >= TUITION) { player.money -= TUITION; return { cost: TUITION, text: `💳 You paid $${TUITION} tuition.` }; }
    player.loan += TUITION;
    return { cost: TUITION, text: `💳 You were short, so Mom & Dad lent you $${TUITION} (student loan — 20% of every paycheck pays it back).` };
}

function enrollUni(id) {
    const m = majorById(id);
    if (!m || player.uni) return;
    const t = payTuition();
    player.uni = { major: id, year: 1, credits: 0 };
    saveGame(); updateStats(); updateActionPanel();
    closeLifeOverlay();
    showEvent(m.emoji, `You enrolled to study ${m.name}! ${t.text}`);
}

let lecture = null;

function goToUniversity() {
    ensureLifeState();
    if (!player.uni) { showUniMajors(); return; }
    if (typeof inSchool !== 'undefined' && (inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni || place3D)) return;
    if (typeof otherPopupOpen === 'function' && otherPopupOpen()) return;
    if (player.lastUniDay === lifeDay()) { showEvent('😴', 'You already went to lectures today — come back tomorrow!'); return; }
    inUni = true;                                          // the day clock stands still until you're home again
    const go = () => openCampus();                         // places.js: the 3D campus
    if (!driveTo('to university', '🎓', go, { self: isIndependent() })) go();
}

// You sat at your desk in the lecture hall (places.js calls this)
function beginLecture() {
    const m = majorById(player.uni.major);
    lecture = { m, i: 0, correct: 0, q: null };
    removePlaceHud();
    lifePanel(`
        <div style="text-align:center;">
            <div style="font-size:2.2em;">${m.emoji}</div>
            <h3 style="color:#FFD700; margin:4px 0;">${m.name} — Year ${player.uni.year}</h3>
            <p style="color:#aaa; margin-bottom:4px;">Lecture ${player.uni.credits + 1} of ${LECTURES_PER_YEAR} this year</p>
            <p style="color:#ddd; margin-bottom:10px;">🧑‍🏫 Professor: "Welcome! Today you'll learn four ideas and try each one yourself. Get 3 of 4 right and the lecture counts."</p>
            ${lifeBtn('nextLectureQuestion()', '📖 Start the lecture', '#8e44ad')}
        </div>`, '#8e44ad');
}

function nextLectureQuestion() {
    if (!lecture) return;
    if (lecture.i >= 4) { finishLecture(); return; }
    // hands-on exercises in your major (lecture-tasks.js) — the old quiz below is only a fallback
    if (typeof runLectureTask === 'function' && typeof STUDY_GAMES !== 'undefined' && STUDY_GAMES[lecture.m.id]) {
        lecture.q = null;
        runLectureTask(lecture.m, lecture.i, ok => {
            if (!lecture) return;
            if (ok) lecture.correct++;
            lecture.i++;
            closeLifePanel();
            setTimeout(() => { if (lecture) nextLectureQuestion(); }, 200);
        });
        return;
    }
    const q = generateClassQuestion(lecture.m.subject);
    lecture.q = q;
    lifePanel(`
        <div style="text-align:center;">
            <p style="color:#aaa; margin-bottom:6px;">${lecture.m.emoji} ${lecture.m.name} · question ${lecture.i + 1} of 4 · ✅ ${lecture.correct}</p>
            <h2 style="color:#FFD700; margin-bottom:10px; font-size:1.3em;">${q.question}</h2>
            ${q.choices.map((c, i) => lifeBtn(`answerLecture(${i})`, c, '#0f3460', 'border:2px solid #8e44ad; display:block; width:100%; text-align:left;')).join('')}
        </div>`, '#8e44ad');
}

function answerLecture(i) {
    if (!lecture || !lecture.q) return;
    const q = lecture.q;
    if (i === q.correctIndex) lecture.correct++; else showExplanation(q);
    lecture.i++; lecture.q = null;
    closeLifePanel();
    setTimeout(() => { if (lecture) nextLectureQuestion(); }, 250);
}

function finishLecture() {
    const l = lecture;
    lecture = null;
    closeLifePanel();
    player.lastUniDay = lifeDay();
    const passed = l.correct >= 3;
    let body = '';
    if (passed) {
        player.uni.credits++;
        player.education = Math.min(100, player.education + 2);
        player.happiness = Math.min(100, player.happiness + 3);
        body = `<p style="color:#2ecc71;">✅ You passed the lecture! (${l.correct}/4) +2 education</p>`;
        if (player.uni.credits >= LECTURES_PER_YEAR) {
            player.uni.credits = 0;
            player.uni.year++;
            if (player.uni.year > UNI_YEARS) {
                player.degree = player.uni.major;
                const m = majorById(player.degree);
                player.uni = null;
                player.happiness = Math.min(100, player.happiness + 15);
                body += `<h3 style="color:#FFD700; margin-top:8px;">🎓 YOU GRADUATED! You earned your ${m.name} degree!</h3><p style="color:#fff;">Your degree opens ALL the degree jobs on the 💼 Job Board — doctor, lawyer, engineer, programmer and more!</p>`;
            } else {
                const t = payTuition();
                body += `<p style="color:#FFD700; margin-top:8px;">🎉 Year complete! On to year ${player.uni.year}. ${t.text}</p>`;
            }
        }
    } else {
        body = `<p style="color:#e67e22;">📚 You only got ${l.correct}/4 — that lecture doesn't count. Try again tomorrow!</p>`;
        player.happiness = Math.max(0, player.happiness - 2);
    }
    updateStats(); saveGame();
    lifeOverlay(`<div style="text-align:center;"><div style="font-size:2.4em;">${l.m.emoji}</div><h2 style="color:#FFD700; margin:6px 0;">Lecture over</h2>${body}
        <div style="margin-top:12px;">${lifeBtn('goHomeFrom()', '🚗 Go home', '#3498db')}</div></div>`, '#8e44ad');
}

// ---------------------------------------------
// 📋 life summary + the buttons on the home screen
// ---------------------------------------------
function showLifeStatus() {
    ensureLifeState(); ensureFoodState();
    const job = player.job ? jobById(player.job.id) : null;
    const nextBill = 10 - (player.sleepCount % 10 || 10) + (player.sleepCount % 10 === 0 ? 10 : 0);
    lifeOverlay(`
        <h2 style="color:#FFD700; text-align:center;">📋 My Life</h2>
        <div style="color:#fff; line-height:1.9;">
            <div>💰 Money: <b>$${player.money}</b> ${player.loan ? `· 🏦 Student loan: <b style="color:#e74c3c">$${player.loan}</b>` : ''} ${player.overdue ? `· ⚠️ Overdue bills: <b style="color:#e74c3c">$${player.overdue}</b>` : ''}</div>
            <div>🏫 Education: ${player.graduated ? 'Finished school ✅' : 'Still in school'} · 📚 ${player.education}/100</div>
            <div>🎓 University: ${player.degree ? majorById(player.degree).emoji + ' ' + majorById(player.degree).name + ' degree ✅' : player.uni ? `${majorById(player.uni.major).emoji} ${majorById(player.uni.major).name} — year ${player.uni.year}, lecture ${player.uni.credits}/${LECTURES_PER_YEAR}` : 'Not studying'}</div>
            <div>💼 Job: ${job ? `${job.emoji} ${jobTitle()} — $${currentPay()}/shift · ${player.job.shifts} shifts worked` : 'No job'}</div>
            <div>🍽️ Fullness: ${player.fullness}/100 — ${hungerLabel()} · 🧊 ${player.fridge.filter(f => !HOUSEHOLD_ITEMS.includes(f.name)).length} food items in the fridge</div>
            ${isIndependent() ? `<div>🏠 Home: ${myApartment() ? myApartment().emoji + ' ' + myApartment().name + ' (deposit $' + player.home.deposit + ')' : 'with Mom & Dad'}</div><div>🧾 Next bills in ${nextBill} days: $${livingCostTotal() + (player.overdue || 0)}</div>` : '<div>🧒 Mom & Dad pay the bills until you\'re 18.</div>'}
        </div>
        <div style="text-align:center; margin-top:10px;">${lifeBtn('closeLifeOverlay()', 'Close', '#555')}</div>`, '#FFD700');
}

// The home-screen buttons for this age
function lifeButtons() {
    let h = '';
    if (player.age >= JOB_MIN_AGE) h += player.job
        ? `<button class="action-btn" onclick="goToWork()">${jobById(player.job.id).emoji} Work</button>`
        : `<button class="action-btn" onclick="showJobBoard()">💼 Find a Job</button>`;
    if (player.age >= JOB_MIN_AGE && player.job) h += `<button class="action-btn" onclick="showJobBoard()">📋 Jobs</button>`;
    if (player.graduated && !player.degree) h += player.uni
        ? `<button class="action-btn" onclick="goToUniversity()">🎓 University</button>`
        : `<button class="action-btn" onclick="showUniMajors()">🎓 Enroll</button>`;
    if (player.graduated && player.age >= 18) h += `<button class="action-btn" onclick="showHousing()">${player.home ? '🏠 Housing' : '🏠 Move Out'}</button>`;
    if (player.age >= 16) h += `<button class="action-btn" onclick="showLifeStatus()">📋 Life</button>`;
    return h;
}

function resetLife() {
    shift = null; lecture = null;
    inWork = false; inUni = false;
    if (typeof resetPlaces === 'function') resetPlaces();
    closeLifeOverlay();
}
