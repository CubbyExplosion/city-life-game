// =============================================
// LESSONS — at school the teacher TEACHES first, so you understand.
//
//   1. When the teacher comes over for a class for the first time that period, they give
//      a short LESSON: an explanation and a worked example.
//        Math    — how to solve this kind of problem, with a fresh example every time
//                  (and a "show me another example" button).
//        Reading — 4 new words and what they mean.
//        Science — 4 facts.        Art — 4 facts.
//      The questions that follow are mostly about what was just taught.
//   2. If you get a question WRONG, the teacher explains how to get the right answer
//      (step by step for math) before asking again.
//
// Used by school.js: askMathQuestion() shows a lesson first (showLesson), and
// handleMathAnswer() explains mistakes (showExplanation).
// Exam days skip the lesson (an exam is a test), but mistakes are still explained.
// =============================================

let activeLesson = null;          // { subject, items } — what was taught this class (school.js quizzes it)
let lessonTaughtPeriod = -1;      // which period we've already taught this school day

// ---------------------------------------------
// MATH — explain one problem in steps (used for lessons AND for explaining a wrong answer)
// ---------------------------------------------
function explainMathProblem(a, op, b) {
    const tens = n => Math.floor(n / 10) * 10;
    const step = (t) => `<div style="margin:4px 0;">➡️ ${t}</div>`;
    let steps = '', answer;
    if (op === '+') {
        answer = a + b;
        if (a < 10 && b < 10) {
            steps = step(`Start at <b>${a}</b>, then count up <b>${b}</b> more: ` +
                Array.from({ length: b }, (_, i) => a + i + 1).join(', ')) +
                step(`You land on <b>${answer}</b>. Tip: start with the BIGGER number — it's less counting!`);
        } else {
            const t = tens(a) + tens(b), o = (a % 10) + (b % 10);
            steps = step(`Add the TENS: ${tens(a)} + ${tens(b)} = <b>${t}</b>`) +
                    step(`Add the ONES: ${a % 10} + ${b % 10} = <b>${o}</b>`) +
                    step(`Put them together: ${t} + ${o} = <b>${answer}</b>`);
        }
    } else if (op === '-') {
        answer = a - b;
        if (b <= 6) {
            steps = step(`Start at <b>${a}</b>, then count BACK <b>${b}</b>: ` +
                Array.from({ length: b }, (_, i) => a - i - 1).join(', ')) +
                step(`You land on <b>${answer}</b>. Subtracting means "take away".`);
        } else {
            const t = tens(b), o = b % 10, mid = a - t;
            steps = step(`Take away the TENS of ${b} first: ${a} − ${t} = <b>${mid}</b>`) +
                    step(`Then take away the ONES: ${mid} − ${o} = <b>${answer}</b>`);
        }
    } else {
        answer = a * b;
        if (b >= 10 && a >= 10) {
            const p1 = a * tens(b), p2 = a * (b % 10);
            steps = step(`Split ${b} into <b>${tens(b)}</b> and <b>${b % 10}</b>`) +
                    step(`${a} × ${tens(b)} = <b>${p1}</b>`) +
                    step(`${a} × ${b % 10} = <b>${p2}</b>`) +
                    step(`Add them up: ${p1} + ${p2} = <b>${answer}</b>`);
        } else if (a <= 6) {
            steps = step(`${a} × ${b} means <b>${a} groups of ${b}</b>`) +
                    step(Array.from({ length: a }, () => b).join(' + ') + ` = <b>${answer}</b>`);
        } else {
            const base = a >= 11 ? 10 : 5, rest = a - base;
            steps = step(`Break ${a} into <b>${base}</b> and <b>${rest}</b> — easier pieces!`) +
                    step(`${base} × ${b} = <b>${base * b}</b>`) +
                    step(`${rest} × ${b} = <b>${rest * b}</b>`) +
                    step(`Add them up: ${base * b} + ${rest * b} = <b>${answer}</b>`);
        }
    }
    return `<div style="font-size:1.4em; color:#FFD700; margin-bottom:6px;">${a} ${op} ${b} = <b>${answer}</b></div>${steps}`;
}

// A fresh worked example that fits the student's grade.
function mathLessonFor(grade) {
    const r = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
    let title, intro, a, op, b;
    if (grade <= 1) {
        title = 'Adding numbers'; op = '+'; a = r(2, 6); b = r(2, 4);
        intro = '<b>Adding</b> means putting groups together to find how many there are altogether.';
        return { title, intro, picture: '🍎'.repeat(a) + ' ➕ ' + '🍎'.repeat(b), a, op, b };
    }
    if (grade === 2) {
        op = Math.random() < 0.5 ? '+' : '-'; a = r(11, 18); b = r(3, 8); title = op === '+' ? 'Adding to 20' : 'Subtracting (taking away)';
        intro = op === '+' ? '<b>Adding</b> makes numbers bigger. Count up from the first number.'
                           : '<b>Subtracting</b> means taking some away. Count back from the first number.';
        return { title, intro, picture: op === '-' ? '🍪'.repeat(Math.min(a, 18)) : '', a, op, b };
    }
    if (grade <= 4) {
        title = 'Multiplying — groups of things'; op = '×'; a = r(2, 6); b = r(2, 6);
        intro = '<b>Multiplying</b> is a shortcut for adding the same number again and again. <b>3 × 4</b> means 3 groups of 4.';
        return { title, intro, picture: Array.from({ length: a }, () => '🟦'.repeat(b)).join('<br>'), a, op, b };
    }
    if (grade <= 7) {
        title = 'Bigger multiplication — break it apart'; op = '×'; a = r(7, 14); b = r(3, 9);
        intro = 'Big multiplication is easy if you <b>break a number into easy pieces</b> (like 10 and a bit), multiply each, then add.';
        return { title, intro, picture: '', a, op, b };
    }
    title = 'Two-digit multiplication'; op = '×'; a = r(12, 35); b = r(12, 25);
    intro = 'For bigger numbers, <b>split one number into tens and ones</b>, multiply each part, then add the answers.';
    return { title, intro, picture: '', a, op, b };
}

// ---------------------------------------------
// The lesson pop-up
// ---------------------------------------------
function removeLessonOverlay() {
    const o = document.getElementById('lesson-overlay');
    if (o) o.remove();
}

function lessonOverlayOpen() {
    return !!document.getElementById('lesson-overlay') || !!document.getElementById('explain-overlay');
}

function lessonShell(title, teacher, bodyHtml, buttonsHtml) {
    removeLessonOverlay();
    const el = document.createElement('div');
    el.id = 'lesson-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:310; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial; overflow-y:auto; padding:14px;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #2ecc71; border-radius:16px; padding:22px 28px; max-width:520px; width:100%;">
            <p style="color:#aaa; font-size:0.85em; margin-bottom:2px;">🧑‍🏫 ${teacher} is teaching</p>
            <h2 style="color:#2ecc71; margin-bottom:10px;">${title}</h2>
            <div id="lesson-body" style="color:#fff; line-height:1.5;">${bodyHtml}</div>
            <div style="margin-top:14px; text-align:center;">${buttonsHtml}</div>
        </div>`;
    document.body.appendChild(el);
}

// Called by askMathQuestion(): returns true if a lesson was shown (the caller should stop and wait).
function maybeTeachLesson(subject, teacherName) {
    if (isExamDay) return false;                              // exams are tests, no lessons
    if (lessonTaughtPeriod === schoolPeriod) return false;    // already taught this class
    if (subject === 'PE') return false;
    showLesson(subject, teacherName);
    return true;
}

function showLesson(subject, teacherName) {
    const grade = Math.max(1, player.age - 4);
    const emoji = SUBJECT_EMOJI[subject] || '📋';
    const btn = (onclick, text, color) => `<button onclick="${onclick}" style="margin:4px; padding:10px 18px; border:none; border-radius:10px;
        font-size:1em; font-weight:bold; cursor:pointer; color:white; background:${color};">${text}</button>`;
    lessonShell.teacher = teacherName;

    if (subject === 'Math') {
        activeLesson = { subject, items: null, grade };
        renderMathLesson(teacherName);
        return;
    }
    // Reading / Science / Art: teach 4 things from the same pool the questions come from
    const pool = withCityFlavor((subject === 'Reading' ? READING_BANKS : subject === 'Science' ? SCIENCE_BANKS : ART_BANKS)[gradeTier(grade)], subject);
    const items = pool.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    activeLesson = { subject, items, grade };
    const intro = subject === 'Reading'
        ? 'Today we are learning <b>new words</b>. Read each one and its meaning. Tip: if you meet a word you don\'t know, look at the words around it for clues!'
        : subject === 'Science'
        ? 'Science helps us understand <b>how the world works</b>. Here are some facts to learn today:'
        : 'Art is about <b>colors, shapes and the people who made great things</b>. Here is what we\'re learning today:';
    const rows = items.map(it => subject === 'Reading'
        ? `<div style="background:#0f3460; border-radius:10px; padding:8px 12px; margin:6px 0;">📖 <b style="color:#FFD700">${it.word}</b> — ${it.meaning}</div>`
        : `<div style="background:#0f3460; border-radius:10px; padding:8px 12px; margin:6px 0;">💡 ${it.q}<br><b style="color:#2ecc71">✅ ${it.answer}</b></div>`).join('');
    lessonShell(`${emoji} ${subject} lesson — Grade ${grade}`, teacherName,
        `<p style="margin-bottom:8px;">${intro}</p>${rows}<p style="color:#d9b99b; margin-top:8px;">Remember these — I'll ask you about them in a moment! 🧠</p>`,
        btn('finishLesson()', '✅ I understand — ask me!', '#27ae60'));
}

function renderMathLesson(teacherName) {
    const grade = activeLesson.grade;
    const L = mathLessonFor(grade);
    const btn = (onclick, text, color) => `<button onclick="${onclick}" style="margin:4px; padding:10px 18px; border:none; border-radius:10px;
        font-size:1em; font-weight:bold; cursor:pointer; color:white; background:${color};">${text}</button>`;
    lessonShell(`📐 Math lesson — ${L.title}`, teacherName,
        `<p style="margin-bottom:8px;">${L.intro}</p>
         ${L.picture ? `<div style="font-size:1.4em; text-align:center; margin:8px 0; line-height:1.3;">${L.picture}</div>` : ''}
         <div style="background:#0f3460; border-radius:12px; padding:12px 16px;"><div style="color:#aaa; font-size:0.85em; margin-bottom:4px;">Let's work one out together:</div>${explainMathProblem(L.a, L.op, L.b)}</div>
         <p style="color:#d9b99b; margin-top:8px;">Now YOU'LL try some just like it! ✏️</p>`,
        btn('renderMathLesson(lessonShell.teacher)', '🔁 Show me another example', '#8e44ad') +
        btn('finishLesson()', '✅ I understand — ask me!', '#27ae60'));
}

function finishLesson() {
    removeLessonOverlay();
    lessonTaughtPeriod = schoolPeriod;
    player.education = Math.min(100, player.education + 1);     // paying attention counts
    updateStats(); saveGame();
    showEvent('🧑‍🏫', 'Great listening! Now a few questions...');
    setTimeout(() => { if (inSchool && !document.getElementById('math-overlay')) askMathQuestion(lessonShell.teacher || 'Teacher'); }, 900);
}

// ---------------------------------------------
// After a wrong answer: "let me explain"
// ---------------------------------------------
function showExplanation(q) {
    if (!q) return;
    let body;
    if (q.subject === 'Math') {
        const m = String(q.question).match(/(\d+)\s*([+\-×])\s*(\d+)/);
        body = m ? explainMathProblem(+m[1], m[2], +m[3]) : '';
    } else {
        const it = q.item;
        const fact = it ? (q.subject === 'Reading' ? `<b style="color:#FFD700">"${it.word}"</b> means <b style="color:#2ecc71">${it.meaning}</b>.`
                                                    : `${it.q}<br><b style="color:#2ecc71">${it.answer}</b>`)
                        : `The answer is <b style="color:#2ecc71">${q.choices[q.correctIndex]}</b>.`;
        body = `<div style="font-size:1.05em;">${fact}</div>
                <p style="color:#d9b99b; margin-top:8px;">${q.subject === 'Reading' ? 'Try using the words around it for clues next time!' : 'Say it out loud once — that helps you remember! 🗣️'}</p>`;
    }
    const old = document.getElementById('explain-overlay');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'explain-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:315; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); font-family:Arial; overflow-y:auto; padding:14px;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #f39c12; border-radius:16px; padding:22px 28px; max-width:500px; width:100%;">
            <h2 style="color:#f39c12; margin-bottom:6px;">🤔 Not quite — let me show you!</h2>
            <p style="color:#aaa; margin-bottom:8px;">Everyone makes mistakes. Here's how it works:</p>
            <div style="color:#fff; line-height:1.5;">${body}</div>
            <div style="margin-top:14px; text-align:center;">
                <button onclick="closeExplanation()" style="padding:10px 22px; border:none; border-radius:10px; font-size:1em; font-weight:bold; cursor:pointer; background:#27ae60; color:white;">✅ OK, I understand now!</button>
            </div>
        </div>`;
    document.body.appendChild(el);
}

function closeExplanation() {
    const o = document.getElementById('explain-overlay');
    if (o) o.remove();
    player.education = Math.min(100, player.education + 1);    // learning from a mistake counts too
    updateStats(); saveGame();
}
