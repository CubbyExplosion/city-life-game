// =============================================
// CLASSMATE LIFE — what your classmates can tell you about school.
//
// "Did you fail?", "what did you get on the test?", "is there an exam today?",
// "did you do your homework?", "who got the best score?" ...
//
// THIS FILE IS CITY LIFE ONLY. It reads the game's own state (player, the day
// counter, the exam schedule) and never touches Suin (ai-chatbot/) — the real
// Suin chatbot doesn't know about City Life's school and is not changed by it.
//
// Answers are CONSISTENT, not random: each classmate's exam score is worked out
// from their name + your age + which exam it was, so asking "did you fail?"
// twice gives the same answer, and "who failed?" agrees with it. It changes
// when the next exam happens. Nothing is saved — it's recalculated each time.
//
// Called from getClassmateResponse() in chat.js. Returns a reply string, or
// null when the message isn't a school question (chat.js then carries on).
// =============================================

const EXAM_PASS_MARK = 50; // % needed to pass an exam

// ---------------------------------------------
// OPINIONS — "i hate science", "i love art", "math is boring"...
// The classmates' own tables (data.js) treat the word "hate" as "you think I hate YOU", so "i hate science" got
// "Nobody should hate you!". This answers about the SUBJECT instead. chat.js asks it before anything else.
// Returns a reply string, or null when the message isn't an opinion about a school subject.
// ---------------------------------------------
const OPINION_TOPICS = [
    { re: /\b(science|sciences|experiments?)\b/, hate: ['Science can be tricky! 🔬 What\'s the worst part — the long words or the experiments?', 'Aw, I get it — some science days are boring. Maybe the experiments will be better next time? 🔬', 'Science is hard for lots of us! Want to quiz each other? It makes it more fun 💙'], like: ['Me too! 🔬 The experiments are the best part!', 'Science is so cool! What\'s the best thing you\'ve learned? 🌱'] },
    { re: /\b(math|maths|mathematics|numbers|times tables|multiplication|division)\b/, hate: ['Math can be a pain! 🧮 Which part is the hardest?', 'Ugh, some math days are rough. Try doing a few easy ones first — it gets better! 💙', 'I know, right? Numbers can be sneaky 😅 Want me to quiz you with easy ones?'], like: ['Math is fun when it clicks! 🧮', 'Nice! Want to try a quick one? Ask me "what is 6 times 7"!'] },
    { re: /\b(reading|english|spelling|writing|books?)\b/, hate: ['Reading can feel slow sometimes 📖 Maybe try a book about something you love?', 'Aw, writing is hard work! What part is the worst? 💙'], like: ['Reading is awesome! 📖 What\'s your favorite story?', 'Same! A good book is the best 💙'] },
    { re: /\b(art|drawing|painting|crafts?)\b/, hate: ['Art can be frustrating when it doesn\'t look right 🎨 But there\'s no wrong way to do it!', 'Aw, don\'t worry — everyone\'s drawings look funny sometimes 😄'], like: ['Art is the best! 🎨 What do you like to draw?', 'Same! I love when we get to paint 🖌️'] },
    { re: /\b(pe|gym|sports?|running|p\.e\.)\b/, hate: ['PE can be tiring! 🏃 Do you like any of the games, at least?', 'Aw, running makes me out of breath too 😅'], like: ['PE is the best! 🏃 Races are so fun!', 'Same! I love when we play games outside ⚽'] },
    { re: /\b(homework|home work)\b/, hate: ['Ugh, homework! 😅 Hang in there — it feels so good when it\'s done!', 'I know! Try doing it in little pieces with a break in between 💙'], like: ['Wow, you like homework? That\'s rare! 🌟', 'Nice! That makes it so much easier 😄'] },
    { re: /\b(tests?|exams?|quizzes|quiz)\b/, hate: ['Tests are stressful! 😬 Studying a little each day helps a lot.', 'I get nervous before tests too. Take a deep breath, you\'ve got this! 💙'], like: ['You like tests?! You must be so ready 🌟', 'Nice attitude! 💪'] },
    { re: /\b(school|class|classes|lessons?|teachers?)\b/, hate: ['School can be tough sometimes. What\'s the hardest part? 💙', 'Aw, some days are rough. Tell me what\'s bugging you — I\'m listening 💙'], like: ['School\'s great when you have friends like us! 🎒', 'Same! What\'s your favorite subject? 📚'] }
];
function classmateOpinionReply(name, text) {
    const t = String(text || '').toLowerCase();
    const neg = /\b(i|we)\s+(really\s+|just\s+|so\s+)?(hate|dislike|despise|do not like|dont like|don't like|can not stand|cannot stand|cant stand|can't stand)\b/.test(t) || /\b(is|are)\s+(so\s+|really\s+)?(boring|hard|awful|terrible|the worst|annoying)\b/.test(t);
    const pos = /\b(i|we)\s+(really\s+|just\s+|so\s+)?(love|like|enjoy|adore)\b/.test(t);
    if (!neg && !pos) return null;
    if (/\b(you|myself|me|him|her|them)\b\s*[.!?]*$/.test(t) && !/science|math|school|art|read|homework|test|exam/.test(t)) return null;      // "i hate you", "i hate myself" are handled elsewhere
    const topic = OPINION_TOPICS.find(o => o.re.test(t));
    if (!topic) return null;
    const list = neg ? topic.hate : topic.like;
    return list[Math.floor(Math.random() * list.length)];
}

// A steady "random" number from 0 to 1 for any text — same text, same number.
function classmateHash01(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
}

// Exams happen on every 10th day of the year (see enterSchool in school.js).
function isExamDayNow() {
    return player.sleepCount > 0 && player.sleepCount % 10 === 0;
}

// Days until the next exam (0 = today).
function daysUntilExam() {
    const r = player.sleepCount % 10;
    return (r === 0 && player.sleepCount > 0) ? 0 : 10 - r;
}

// The result of the most recent FINISHED exam for one classmate — or null if
// there hasn't been one yet this year.
function classmateExamResult(name) {
    let block = Math.floor(player.sleepCount / 10);
    if (isExamDayNow()) block -= 1; // today's exam is still going on
    if (block < 1) return null;
    const aptitude = 58 + 32 * classmateHash01(name + '|aptitude');           // some kids are just stronger
    const luck = (classmateHash01(name + '|' + player.age + '|' + block) - 0.5) * 40; // good day / bad day
    const score = Math.max(12, Math.min(100, Math.round(aptitude + luck)));
    return { score, passed: score >= EXAM_PASS_MARK };
}

function classmateDidHomework(name) {
    return classmateHash01(name + '|hw|' + player.age + '|' + player.sleepCount) < 0.75;
}

function classmateStudied(name) {
    return classmateHash01(name + '|study|' + player.age + '|' + Math.floor(player.sleepCount / 10)) < 0.6;
}

function classmateOtherNames(name) {
    return getCurrentClassmates().map(c => c.name).filter(n => n !== name);
}

function examScoreWords(score) {
    if (score >= 90) return 'I totally aced it';
    if (score >= 75) return 'pretty good';
    if (score >= EXAM_PASS_MARK) return 'I only just got through';
    return 'I failed';
}

// ---------------------------------------------
// The one function chat.js calls.
// ---------------------------------------------
function classmateSchoolReply(name, rawText) {
    const t = String(rawText).toLowerCase().replace(/[‘’]/g, "'").replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim();
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const examWord = '(test|exam|quiz|exams|tests|quizzes)';
    const exam = classmateExamResult(name);
    const inProgress = isExamDayNow();

    // ---- You asking about YOURSELF ("did i fail?") ----
    if (/\b(did|do|will|am|have) i\b.*\b(fail|failed|failing|flunk|pass|passed|passing)\b|\bhow (did|am) i (do|doing)\b|\bwhat('s| is| was)? my (grade|score|mark|result)\b/.test(t)) {
        if (inProgress) {
            return failedExamToday
                ? pick(["Hmm, I think you got one wrong already... 😬 but there's still time to do better!", "You missed one, I saw. 😬 Don't give up — keep going!"])
                : pick(["You're doing fine so far! 💪 Keep going!", "No mistakes yet that I saw! 🌟"]);
        }
        return player.education >= GOOD_GRADES_EDU
            ? pick(["I bet you did great — you get good grades! 🌟", "You're one of the smart ones! 📚 I'm sure you passed."])
            : pick(["Hmm, your grades could be better... want to study together? 📚", "I don't think you're failing, but a bit more studying wouldn't hurt! 😄"]);
    }

    // ---- Who failed / who did best (the whole class) ----
    if (/\b(did|has|have) (anyone|anybody|everyone|somebody|someone|any of you|all of you)\b.*\b(fail|failed|flunk)|\bwho (failed|flunked)\b/.test(t)) {
        if (!exam) return inProgress ? "We're taking the exam right now! Ask me after. 😅" : "We haven't had an exam yet this year!";
        const failed = classmateOtherNames(name).filter(n => !classmateExamResult(n).passed);
        if (!exam.passed) failed.unshift('me');
        return failed.length
            ? `Hmm... I think ${failed.join(' and ')} failed. 😞 Don't say I told you!`
            : "Nobody failed! 🎉 Everyone passed.";
    }
    if (/\bwho (got|has|had|did) (the )?(best|highest|top|most)\b|\bwho('s| is) (the )?(smartest|best)\b/.test(t)) {
        if (!exam) return inProgress ? "We're taking the exam right now! Ask me after. 😅" : "We haven't had an exam yet this year!";
        const all = [{ n: 'me', s: exam.score }].concat(classmateOtherNames(name).map(n => ({ n, s: classmateExamResult(n).score })));
        const top = all.sort((a, b) => b.s - a.s)[0];
        return top.n === 'me' ? `Me! 😎 I got ${top.s}%!` : `I think ${top.n} did — ${top.s}%! 🏆`;
    }

    // ---- Did YOU fail / pass? How did you do? ----
    const asksFail = /\b(did|have|do|are|will|would) you (fail|failed|flunk|failing)\b|\byou (fail|failed|flunked)\b/.test(t);
    const asksPass = /\b(did|have|will|do) you pass\b|\byou (pass|passed)\b/.test(t);
    const asksScore = new RegExp(`\\b(how|what)\\b.*\\byou (do|did|get|got|score|scored)\\b|\\byour (score|grade|mark|result|results)\\b|\\bhow (was|is|were) (the |our )?${examWord}\\b|\\bwhat did you (get|score)\\b`).test(t);
    if (asksFail || asksPass || asksScore) {
        if (inProgress) return pick(["We're taking the exam right now! Ask me after. 😅", "Ask me when we're done — I'm still doing it! 😬"]);
        if (!exam) return pick(["We haven't had an exam yet this year!", "No exam yet — I'll tell you after the next one! 📝"]);
        if (asksFail) {
            return exam.passed
                ? pick([`Nope, I passed! 🎉 I got ${exam.score}%.`, `Phew, no! I got ${exam.score}% 😅`])
                : pick([`Yeah... I failed. 😞 Only ${exam.score}%. Don't tell anyone!`, `Ugh, yes. ${exam.score}%. I'm so embarrassed. 😳`]);
        }
        if (asksPass) {
            return exam.passed
                ? pick([`Yes! I passed with ${exam.score}%! 🎉`, `I did! ${exam.score}%! 😄`])
                : pick([`Not this time... only ${exam.score}%. 😞`, `No... I got ${exam.score}%. I need to study more. 😔`]);
        }
        return `I got ${exam.score}% — ${examScoreWords(exam.score)}${exam.passed ? '! 😄' : '. 😞'}`;
    }

    // ---- Is there an exam? ----
    if (new RegExp(`\\b(is|was|are) there (a |an |any )?${examWord}\\b|\\bdo we have (a |an |any )?${examWord}\\b|\\b(is it|when('s| is)) .*\\b(exam|test) ?(day)?\\b|\\bnext ${examWord}\\b`).test(t)) {
        const d = daysUntilExam();
        if (d === 0) return pick(["Yes! It's exam day today! 📝 Good luck!", "Yep, exam today! 😬 I'm nervous!"]);
        if (d === 1) return pick(["Not today, but there's one tomorrow! 📝", "Tomorrow! Better study tonight! 📚"]);
        return /\btomorrow\b/.test(t)
            ? `Not tomorrow — the next exam is in ${d} days. 📅`
            : `Not today! The next exam is in ${d} days. 📅`;
    }

    // ---- Homework ----
    if (/\b(do|did) we have (any )?homework\b|\bis there (any )?homework\b|\bwhat('s| is) the homework\b|\bwhat homework\b/.test(t)) {
        return player.homework
            ? `Yeah, we have ${player.homework} homework! 📝 Do it at home before school tomorrow.`
            : pick(["Nope, I think we don't have any right now! 🎉", "No homework that I know of! 😄"]);
    }
    if (/\b(did|have) you (do|done|finish|finished|complete|completed) (your |the |ur )?homework\b/.test(t)) {
        return classmateDidHomework(name)
            ? pick(["Yep, I finished it last night! 📝", "Yeah, all done! Did you do yours? 😄"])
            : pick(["Uh oh... I forgot! 😬 Please don't tell the teacher!", "Nope! I totally forgot. 😅 Am I in trouble?"]);
    }

    // ---- Studying / feeling ready ----
    if (new RegExp(`\\bdid you study\\b|\\bhave you studied\\b|\\bare you (ready|prepared|nervous|scared|worried)\\b|\\b(ready|prepared) for the ${examWord}\\b`).test(t)) {
        const d = daysUntilExam();
        if (classmateStudied(name)) {
            return d === 0
                ? pick(["I studied a lot! 📚 I'm a little nervous though.", "Yep, I studied! Let's do this! 💪"])
                : pick(["I did study a bit! 📚 You should too!", "Yeah, I've been studying! 😄"]);
        }
        return pick(["Um... not really. 😬 I should have studied!", "I meant to, but I didn't! 😅 Uh oh."]);
    }

    // ---- What's going on in class? ----
    if (/\bwhat grade are you in\b|\bwhat grade are we in\b/.test(t)) {
        return `Grade ${Math.max(1, player.age - 4)} — the same as you! 😄`;
    }
    if (/\bwhat (class|subject|lesson)\b.*\b(is|are|now|this|next)\b|\bwhat('s| is) next\b|\bwhat are we (doing|learning)\b/.test(t)) {
        if (typeof inSchool !== 'undefined' && inSchool && PERIOD_LABELS[schoolPeriod]) {
            const next = PERIOD_LABELS[schoolPeriod + 1];
            return `We're in ${PERIOD_LABELS[schoolPeriod]} right now!` + (next ? ` Next up is ${next}.` : '');
        }
        return "We're not in class right now! 😄";
    }

    return null; // not a school question — chat.js carries on
}
