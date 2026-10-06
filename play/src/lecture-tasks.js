// =============================================
// LECTURE TASKS — university lectures are DOING things, not answering quiz questions.
//
// Every lecture is 4 hands-on exercises in your major (the way jobs are 4 tasks, see work-tasks.js — these use the very same
// mini-games: ⏱️ timing, 👆 mash, 🗂️ sort, 🔢 count, 🧑‍🍳 recipe, 🔍 defect, 🧽 wipe, 🔢 seq, 💵 change). Before each exercise the
// 🧑‍🏫 professor TEACHES one little idea, so you learn it and then use it. Pass 3 of the 4 and the lecture counts (life.js finishLecture,
// unchanged: 6 lectures a year, 3 years, tuition, degree).
//
// runLectureTask(major, index, onDone) is called by life.js nextLectureQuestion(); onDone(true/false) says if you did it.
// =============================================

// a lecture exercise = a work-task (work-tasks.js builders) + what the professor says first
const ltT = (task, teach) => Object.assign({}, task, { teach });

const STUDY_GAMES = {
    medicine: [
        ltT(wtTiming('Take a patient\'s pulse', '🩺', 'Count'), 'A healthy grown-up\'s heart beats about 60 to 100 times a minute. Doctors listen for the rhythm — be ready to catch it!'),
        ltT(wtDefect('Spot the break on the X-ray', '🦴', '💥'), 'On an X-ray, bones show up bright white. A break looks like a dark crack or a jagged line — find the one that doesn\'t belong.'),
        ltT(wtSort('Anatomy: bones or organs?', [['bone', '🦴', 'Bone'], ['organ', '🫀', 'Organ']], [['🦴', 'bone'], ['💀', 'bone'], ['🫀', 'organ'], ['🫁', 'organ'], ['🧠', 'organ'], ['🦷', 'bone']]), 'Bones hold your body up. Organs, like the heart, lungs and brain, do a special job. Sort them!'),
        ltT(wtRecipe('Pack the first-aid kit', ['🩹', '🌡️', '🩺'], ['🩹', '🌡️', '🩺', '🍕', '🎈', '🧪', '💊', '🎮']), 'A first-aid kit needs plasters for cuts, a thermometer for fevers and a stethoscope for listening. Pick the right three.')
    ],
    engineering: [
        ltT(wtSeq('Read the blueprint', '📐'), 'Engineers follow a plan step by step, in order. Tap the numbers in order, just like following the steps on a blueprint.'),
        ltT(wtMash('Stress-test the bridge', '🌉', 16, 5), 'Before a bridge opens, engineers push it again and again to see if it holds. Hammer the test button!'),
        ltT(wtRecipe('Build a simple circuit', ['🔋', '🔌', '💡'], ['🔋', '🔌', '💡', '🧱', '🍌', '🪀', '🔩', '🧲']), 'A circuit is a loop: a battery gives the power, wires carry it, and a bulb lights up. Choose those three parts.'),
        ltT(wtCount('Measure the beams', '📏'), 'Measuring twice saves a lot of mistakes! Count every beam you can see on the plan.')
    ],
    cs: [
        ltT(wtDefect('Debug the code', '💻', '🐛'), 'A bug is a mistake in a program. Programmers look carefully through the code until one line looks different. Find the bug!'),
        ltT(wtSeq('Order the algorithm steps', '🧮'), 'An algorithm is a list of steps done in the right order, like a recipe for the computer. Tap the steps in order.'),
        ltT(wtTiming('Type the program', '⌨️', 'Type'), 'Typing code takes rhythm. Press the key right when the cursor is in the green zone.'),
        ltT(wtSort('Data types: numbers or text?', [['num', '🔢', 'Numbers'], ['txt', '🔤', 'Text']], [['42', 'num'], ['7', 'num'], ['3.14', 'num'], ['cat', 'txt'], ['hello', 'txt'], ['"hi"', 'txt']]), 'Computers treat numbers and text differently — you can add numbers, but "cat" isn\'t one! Sort the data.')
    ],
    business: [
        ltT(wtChange('Run the market stall: give change'), 'In business, change must be exact. Subtract what the customer paid from the price, and count it back.'),
        ltT(wtSort('Income or cost?', [['in', '📈', 'Income'], ['out', '📉', 'Cost']], [['💰', 'in'], ['🛍️', 'in'], ['🏦', 'in'], ['🏠', 'out'], ['⚡', 'out'], ['👷', 'out']]), 'Money coming IN is income; money going OUT is a cost. A business needs income bigger than its costs to make a profit.'),
        ltT(wtCount('Count the stock', '📦'), 'Shops count their stock so they know what to order. Count every box on the shelf.'),
        ltT(wtSeq('Plan the budget', '📊'), 'A budget is a plan for your money, done step by step. Tap the numbers in order to build the plan.')
    ],
    teaching: [
        ltT(wtTiming('Write on the board', '🖊️', 'Write'), 'Good teachers write clearly and at a steady pace. Tap Write when the marker is in the green zone.'),
        ltT(wtDefect('Find the mistake in the essay', '📝', '❌'), 'Marking work means reading carefully for the one thing that\'s wrong. Spot the mistake.'),
        ltT(wtSort('Stories or facts?', [['story', '🧚', 'Story'], ['fact', '🌍', 'Fact']], [['🐉', 'story'], ['🧚', 'story'], ['🦄', 'story'], ['🌋', 'fact'], ['🔭', 'fact'], ['🗺️', 'fact']]), 'Stories are made up; facts are real. Teachers help children tell the difference. Sort them!'),
        ltT(wtMash('Mark the homework pile', '✅', 14, 5), 'Marking a big pile takes stamina. Tick as fast as you can!')
    ],
    law: [
        ltT(wtSort('Is the contract fair?', [['ok', '✅', 'Fair'], ['bad', '⚠️', 'Unfair']], [['🤝', 'ok'], ['📜', 'ok'], ['⚖️', 'ok'], ['🪤', 'bad'], ['💸', 'bad'], ['🕳️', 'bad']]), 'A fair contract is clear and good for both sides. Hidden traps and surprise costs make it unfair. Sort the clauses.'),
        ltT(wtSeq('Order the steps of a trial', '⚖️'), 'A trial has an order: opening, evidence, questions, verdict. Tap the numbers in order.'),
        ltT(wtDefect('Find the wrong law book', '📕', '📙'), 'Lawyers must use the right book. One of these is different — find it!'),
        ltT(wtTiming('Cross-examine the witness', '🎤', 'Ask'), 'Timing matters when you question a witness. Ask when the marker is in the green zone.')
    ],
    science: [
        ltT(wtRecipe('Mix the lab sample', ['🧪', '💧', '🔥'], ['🧪', '💧', '🔥', '🧊', '🧂', '🌿', '🧫', '⚗️']), 'Experiments follow a method: a test tube, the liquid to test, and heat to make it react. Pick those three.'),
        ltT(wtTiming('Focus the microscope', '🔬', 'Focus'), 'To see tiny things you turn the focus knob until the picture is sharp. Stop in the green zone.'),
        ltT(wtDefect('Find the odd sample', '🧫', '🦠'), 'Scientists compare samples to find the one that\'s different — that\'s often the discovery!'),
        ltT(wtSeq('Record the results', '📓'), 'Good scientists write results down in order. Tap the numbers in order.')
    ],
    arts: [
        ltT(wtRecipe('Mix the paint colours', ['🔴', '🔵', '🟡'], ['🔴', '🔵', '🟡', '🟢', '🟣', '⚫', '🟤', '🟠']), 'Red, blue and yellow are the primary colours — you can mix every other colour from them. Pick the three.'),
        ltT(wtTiming('Sketch a portrait', '✏️', 'Draw'), 'Artists draw in confident strokes. Draw when the marker is in the green zone.'),
        ltT(wtDefect('Spot the flaw in the design', '🖼️', '🔳'), 'Designers look closely for the one thing that spoils a picture. Find it.'),
        ltT(wtSeq('Hang the gallery in order', '🖼️'), 'A gallery tells a story left to right. Tap the numbers in order.')
    ]
};

function runLectureTask(major, index, onDone) {
    wtEnd();
    const g = STUDY_GAMES[major.id] && STUDY_GAMES[major.id][index];
    if (!g) { onDone(true); return; }
    workTask = { timers: [], finished: false, g, onDone, okMsg: '✅ Well done — you got it!', failMsg: '❌ Not quite — the professor says: "Good try, keep practising!"' };
    lifePanel(`
        <div style="text-align:center;">
            <p style="color:#aaa; margin-bottom:2px;">${major.emoji} ${major.name} · exercise ${index + 1} of 4 · ✅ ${lecture ? lecture.correct : 0}</p>
            <h3 style="color:#FFD700; margin-bottom:4px;">${g.label}</h3>
            <p style="color:#ddd; font-size:0.88em; margin:2px 0 6px; padding:5px 8px; background:rgba(142,68,173,0.25); border-radius:8px;">🧑‍🏫 <i>${g.teach}</i></p>
            <div id="wt-hint" style="color:#9ab; font-size:0.85em; margin-bottom:6px;"></div>
            <div id="wt-body"></div>
            <div id="wt-msg" style="min-height:1.4em; margin-top:6px; font-weight:bold;"></div>
        </div>`, '#8e44ad');
    const body = document.getElementById('wt-body'), hint = document.getElementById('wt-hint');
    ({ timing: wtStartTiming, mash: wtStartMash, sort: wtStartSort, count: wtStartCount, recipe: wtStartRecipe, defect: wtStartDefect,
       wipe: wtStartWipe, seq: wtStartSeq, change: wtStartChange })[g.kind](g, body, hint);
}
