// =============================================
// KIDS GAMES — a whole playground of games.
//
//  TABLE GAMES (pop-up boards — play alone at home, or with a friend / neighbor):
//    ❌ Tic-Tac-Toe   🔴 Connect Four   🔤 Hangman   🃏 Memory Match
//    🎨 Simon Colors  🔢 Guess the Number   🧠 Kids Trivia   🔀 Word Scramble
//    ✊ Rock-Paper-Scissors (in neighborhood.js)
//
//  STREET GAMES (3D, out on the block with a neighbor kid or school friend):
//    🏃 Tag (neighborhood.js)   🙈 Hide & Seek   🚦 Red Light, Green Light   🏁 Race
//
// Open the list with showGamePicker(who). `who` is the friend you're playing with
// ({ name, role }) or null when you're playing alone at home.
// To add a game: write a start function, add it to KID_GAMES. That's it.
// =============================================

let kg = null;     // the table game being played right now

const KID_GAMES = [
    { id: 'ttt',      name: 'Tic-Tac-Toe',      emoji: '❌', kind: 'table', brain: false, start: () => kgTicTacToe() },
    { id: 'c4',       name: 'Connect Four',     emoji: '🔴', kind: 'table', brain: false, start: () => kgConnectFour() },
    { id: 'hangman',  name: 'Hangman',          emoji: '🔤', kind: 'table', brain: true,  start: () => kgHangman() },
    { id: 'memory',   name: 'Memory Match',     emoji: '🃏', kind: 'table', brain: false, start: () => kgMemory() },
    { id: 'simon',    name: 'Simon Colors',     emoji: '🎨', kind: 'table', brain: false, start: () => kgSimon() },
    { id: 'guess',    name: 'Guess the Number', emoji: '🔢', kind: 'table', brain: true,  start: () => kgGuess() },
    { id: 'trivia',   name: 'Kids Trivia',      emoji: '🧠', kind: 'table', brain: true,  start: () => kgTrivia() },
    { id: 'scramble', name: 'Word Scramble',    emoji: '🔀', kind: 'table', brain: true,  start: () => kgScramble() },
    { id: 'hide',     name: 'Hide & Seek',      emoji: '🙈', kind: 'street', start: () => startHoodGame('hide') },
    { id: 'rlgl',     name: 'Red Light, Green Light', emoji: '🚦', kind: 'street', start: () => startHoodGame('rlgl') },
    { id: 'race',     name: 'Race to the End of the Street', emoji: '🏁', kind: 'street', start: () => startHoodGame('race') }
];

const KG_WORDS = ['apple', 'puppy', 'rocket', 'dragon', 'banana', 'pirate', 'jungle', 'castle', 'rabbit', 'guitar', 'pizza', 'soccer',
                  'turtle', 'monkey', 'spaceship', 'rainbow', 'cookie', 'dolphin', 'unicorn', 'penguin', 'volcano', 'treasure', 'bicycle', 'butterfly',
                  'snowman', 'airplane', 'elephant', 'giraffe', 'popcorn', 'robot'];

const KG_TRIVIA = [
    ['How many legs does a spider have?', '8', ['6', '8', '10', '4']],
    ['What color do you get mixing blue and yellow?', 'Green', ['Green', 'Purple', 'Orange', 'Brown']],
    ['Which planet do we live on?', 'Earth', ['Mars', 'Venus', 'Earth', 'Jupiter']],
    ['What do bees make?', 'Honey', ['Milk', 'Honey', 'Silk', 'Juice']],
    ['How many days are in a week?', '7', ['5', '6', '7', '10']],
    ['What is the biggest animal in the ocean?', 'Blue whale', ['Shark', 'Blue whale', 'Octopus', 'Dolphin']],
    ['Which animal says "moo"?', 'Cow', ['Cow', 'Sheep', 'Duck', 'Horse']],
    ['What is frozen water called?', 'Ice', ['Steam', 'Ice', 'Mud', 'Fog']],
    ['How many colors are in a rainbow?', '7', ['5', '6', '7', '8']],
    ['What do caterpillars turn into?', 'Butterflies', ['Beetles', 'Butterflies', 'Birds', 'Bees']],
    ['Which shape has 3 sides?', 'Triangle', ['Square', 'Circle', 'Triangle', 'Star']],
    ['What do plants need to grow?', 'Sunlight and water', ['Candy', 'Sunlight and water', 'Sand', 'Plastic']],
    ['What is the tallest animal?', 'Giraffe', ['Elephant', 'Giraffe', 'Horse', 'Bear']],
    ['How many minutes are in an hour?', '60', ['30', '50', '60', '100']],
    ['Which season comes after winter?', 'Spring', ['Summer', 'Autumn', 'Spring', 'Winter']],
    ['What is 5 + 7?', '12', ['10', '11', '12', '13']],
    ['What do cows drink... to make milk? (Trick: they drink)', 'Water', ['Milk', 'Juice', 'Water', 'Soda']],
    ['Which is the fastest land animal?', 'Cheetah', ['Lion', 'Cheetah', 'Horse', 'Rabbit']],
    ['What color is a ripe banana?', 'Yellow', ['Blue', 'Red', 'Yellow', 'Green']],
    ['How many wheels does a bicycle have?', '2', ['1', '2', '3', '4']],
    ['What is the opposite of "hot"?', 'Cold', ['Warm', 'Cold', 'Spicy', 'Sunny']],
    ['Which one is a fruit?', 'Strawberry', ['Carrot', 'Strawberry', 'Potato', 'Onion']]
];

function kgShuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

// ---------------------------------------------
// The game list ("what do you want to play?")
// ---------------------------------------------
// who = { name, role } (a friend or neighbor) or null (playing alone)
function showGamePicker(who) {
    removeGameOverlay('kg-picker');
    const el = document.createElement('div');
    el.id = 'kg-picker';
    el.style.cssText = `position:fixed; inset:0; z-index:290; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.6); font-family:Arial; overflow-y:auto; padding:14px;`;
    const canStreet = who && who.role === 'kid' && typeof neighborhood3D !== 'undefined' && neighborhood3D;
    const card = g => `<button onclick="launchKidGame('${g.id}')" style="margin:5px; padding:12px 14px; width:150px; border:2px solid #3498db;
        border-radius:12px; background:#0f3460; color:white; cursor:pointer; font-size:0.9em;">
        <div style="font-size:1.9em;">${g.emoji}</div>${g.name}</button>`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #FFD700; border-radius:16px; padding:20px 24px; text-align:center; max-width:560px;">
            <h2 style="color:#FFD700; margin-bottom:4px;">🎮 What do you want to play?</h2>
            <p style="color:#aaa; margin-bottom:10px;">${who ? `Playing with <b>${who.name}</b>` : 'Playing by yourself'}</p>
            <h3 style="color:#9ab; font-size:0.9em; margin:6px 0 0;">🎲 Table games</h3>
            ${KID_GAMES.filter(g => g.kind === 'table').map(card).join('')}
            ${canStreet ? `<h3 style="color:#9ab; font-size:0.9em; margin:12px 0 0;">🌳 Street games</h3>
            ${KID_GAMES.filter(g => g.kind === 'street').map(card).join('')}` : ''}
            <div style="margin-top:12px;"><button onclick="closeGamePicker()" style="padding:8px 20px; border:none; border-radius:10px; background:#555; color:white; cursor:pointer;">✖ Close</button></div>
        </div>`;
    el.dataset.who = who ? JSON.stringify(who) : '';
    document.body.appendChild(el);
}

function removeGameOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function closeGamePicker() {
    removeGameOverlay('kg-picker');
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D && !neighborhood3D.game) neighborhood3D.menuNpc = null;
}

function launchKidGame(id) {
    const picker = document.getElementById('kg-picker');
    const who = picker && picker.dataset.who ? JSON.parse(picker.dataset.who) : null;
    removeGameOverlay('kg-picker');
    const game = KID_GAMES.find(g => g.id === id);
    if (!game) return;
    kg = { id, who, game, brain: !!game.brain };
    game.start();
}

// ---------------------------------------------
// The shared pop-up and the reward
// ---------------------------------------------
function kgShell(title, bodyHtml) {
    removeGameOverlay('kg-overlay');
    const el = document.createElement('div');
    el.id = 'kg-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.65); font-family:Arial; overflow-y:auto; padding:14px;`;
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #3498db; border-radius:16px; padding:20px 26px; text-align:center; min-width:300px; max-width:96vw;">
            <h2 style="color:#FFD700; margin-bottom:2px;">${kg ? kg.game.emoji : '🎮'} ${title}</h2>
            <p style="color:#aaa; margin-bottom:10px; font-size:0.9em;">${kg && kg.who ? 'You vs ' + kg.who.name : 'Playing by yourself'}</p>
            <div id="kg-body">${bodyHtml}</div>
            <div style="margin-top:12px;"><button onclick="kgQuit()" style="padding:6px 16px; border:none; border-radius:8px; background:#555; color:white; cursor:pointer; font-size:0.85em;">✖ Quit</button></div>
        </div>`;
    document.body.appendChild(el);
}

function kgBody(html) {
    const b = document.getElementById('kg-body');
    if (b) b.innerHTML = html;
}

function kgAlive() {
    return !!document.getElementById('kg-overlay') && kg;
}

function kgQuit() {
    removeGameOverlay('kg-overlay');
    kg = null;
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D && !neighborhood3D.game) neighborhood3D.menuNpc = null;
}

// result: 'win' | 'tie' | 'lose'
function kgFinish(result, message) {
    if (!kg) return;
    const hap = result === 'win' ? 9 : result === 'tie' ? 5 : 4;
    const edu = kg.brain && result === 'win' ? 2 : 0;
    player.happiness = Math.min(100, player.happiness + hap);
    player.education = Math.min(100, player.education + edu);
    updateStats();
    if (kg.who && typeof addFriendship === 'function') addFriendship(kg.who.name, result === 'win' ? 1 : 0.5);
    else saveGame();
    const icon = result === 'win' ? '🎉' : result === 'tie' ? '🤝' : '😄';
    kgBody(`
        <h3 style="color:${result === 'win' ? '#2ecc71' : result === 'tie' ? '#f1c40f' : '#e67e22'}; margin-bottom:6px;">${icon} ${message}</h3>
        <p style="color:#2ecc71;">+${hap} happiness${edu ? ` &nbsp;·&nbsp; +${edu} education 📚` : ''}</p>
        <div style="margin-top:12px;">
            <button onclick="kgPlayAgain()" style="padding:9px 18px; margin:4px; border:none; border-radius:10px; background:#27ae60; color:white; cursor:pointer; font-weight:bold;">🔁 Play again</button>
            <button onclick="kgQuit()" style="padding:9px 18px; margin:4px; border:none; border-radius:10px; background:#3498db; color:white; cursor:pointer; font-weight:bold;">Done</button>
        </div>`);
}

function kgPlayAgain() {
    if (!kg) return;
    const g = kg.game, who = kg.who;
    kg = { id: g.id, who, game: g, brain: !!g.brain };
    g.start();
}

const kgBtn = (onclick, text, extra) => `<button onclick="${onclick}" style="font-size:1.05em; padding:8px 14px; margin:3px; border:2px solid #3498db;
    border-radius:10px; background:#0f3460; color:white; cursor:pointer; ${extra || ''}">${text}</button>`;

// =============================================
// ❌ TIC-TAC-TOE (you are X)
// =============================================
const TTT_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function tttWinner(b) {
    for (const [a, c, d] of TTT_LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    return b.every(Boolean) ? 'tie' : null;
}
function tttAiMove(b) {
    const tryWin = (mark) => { for (const [a, c, d] of TTT_LINES) {
        const cells = [a, c, d], vals = cells.map(i => b[i]);
        if (vals.filter(v => v === mark).length === 2 && vals.includes(null)) return cells[vals.indexOf(null)];
    } return -1; };
    let m = tryWin('O'); if (m < 0) m = tryWin('X');
    if (m < 0 && !b[4]) m = 4;
    if (m < 0) { const corners = [0, 2, 6, 8].filter(i => !b[i]); if (corners.length && Math.random() < 0.7) m = corners[Math.floor(Math.random() * corners.length)]; }
    if (m < 0) { const free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0); m = free[Math.floor(Math.random() * free.length)]; }
    return m;
}
function kgTicTacToe() {
    kg.board = Array(9).fill(null);
    kgShell('Tic-Tac-Toe', '');
    renderTTT('You are ❌ — your turn!');
}
function renderTTT(msg) {
    kgBody(`<p style="color:#d9b99b; margin-bottom:8px;">${msg}</p>
        <div style="display:grid; grid-template-columns:repeat(3,70px); gap:6px; justify-content:center;">
        ${kg.board.map((v, i) => `<button onclick="tttPlay(${i})" ${v ? 'disabled' : ''} style="height:70px; font-size:2em; border:2px solid #3498db; border-radius:10px;
            background:#0f3460; color:white; cursor:${v ? 'default' : 'pointer'};">${v === 'X' ? '❌' : v === 'O' ? '⭕' : ''}</button>`).join('')}</div>`);
}
function tttPlay(i) {
    if (!kgAlive() || kg.board[i]) return;
    kg.board[i] = 'X';
    let w = tttWinner(kg.board);
    if (!w) { kg.board[tttAiMove(kg.board)] = 'O'; w = tttWinner(kg.board); }
    renderTTT('');
    if (w) { setTimeout(() => { if (kgAlive()) kgFinish(w === 'X' ? 'win' : w === 'tie' ? 'tie' : 'lose', w === 'X' ? 'You got three in a row!' : w === 'tie' ? "It's a tie!" : 'Three in a row for ⭕!'); }, 700); }
}

// =============================================
// 🔴 CONNECT FOUR (you are 🔴, the computer 🟡)
// =============================================
function c4Drop(b, col, p) { for (let r = 5; r >= 0; r--) if (!b[r][col]) { b[r][col] = p; return r; } return -1; }
function c4Wins(b, p) {
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
        let k = 0; while (k < 4) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr > 5 || cc < 0 || cc > 6 || b[rr][cc] !== p) break; k++; }
        if (k === 4) return true;
    }
    return false;
}
function kgConnectFour() {
    kg.board = Array.from({ length: 6 }, () => Array(7).fill(null));
    kgShell('Connect Four', '');
    renderC4('You are 🔴 — drop a disc in a column!');
}
function renderC4(msg) {
    kgBody(`<p style="color:#d9b99b; margin-bottom:6px;">${msg}</p>
        <div style="display:grid; grid-template-columns:repeat(7,44px); gap:3px; justify-content:center; background:#1f4e9c; padding:6px; border-radius:10px;">
        ${[0,1,2,3,4,5,6].map(c => `<button onclick="c4Play(${c})" style="height:26px; border:none; border-radius:6px; background:#27ae60; color:white; cursor:pointer;">⬇</button>`).join('')}
        ${kg.board.map(row => row.map(v => `<div style="width:44px; height:44px; border-radius:50%; background:${v === 'R' ? '#e74c3c' : v === 'Y' ? '#f1c40f' : '#16213e'};"></div>`).join('')).join('')}
        </div>`);
}
function c4AiCol(b) {
    const valid = [0,1,2,3,4,5,6].filter(c => !b[0][c]);
    const test = (p, c) => { const copy = b.map(r => r.slice()); c4Drop(copy, c, p); return c4Wins(copy, p); };
    for (const c of valid) if (test('Y', c)) return c;
    for (const c of valid) if (test('R', c)) return c;
    const pref = valid.slice().sort((a, c) => Math.abs(a - 3) - Math.abs(c - 3) + (Math.random() - 0.5) * 2);
    return pref[0];
}
function c4Play(col) {
    if (!kgAlive() || kg.board[0][col] || kg.over) return;
    c4Drop(kg.board, col, 'R');
    if (c4Wins(kg.board, 'R')) { kg.over = true; renderC4('🔴 four in a row!'); setTimeout(() => kgAlive() && kgFinish('win', 'Four in a row — you win!'), 800); return; }
    if (kg.board[0].every(Boolean)) { kg.over = true; renderC4(''); setTimeout(() => kgAlive() && kgFinish('tie', "The board is full — it's a tie!"), 800); return; }
    c4Drop(kg.board, c4AiCol(kg.board), 'Y');
    if (c4Wins(kg.board, 'Y')) { kg.over = true; renderC4('🟡 four in a row!'); setTimeout(() => kgAlive() && kgFinish('lose', 'Yellow got four in a row!'), 800); return; }
    renderC4('Your turn!');
}

// =============================================
// 🔤 HANGMAN
// =============================================
function kgHangman() {
    kg.word = KG_WORDS[Math.floor(Math.random() * KG_WORDS.length)];
    kg.guessed = new Set(); kg.wrong = 0;
    kgShell('Hangman', '');
    renderHangman();
}
function renderHangman() {
    const faces = ['😀', '🙂', '😐', '😟', '😨', '😱', '💀'];
    const shown = kg.word.split('').map(ch => kg.guessed.has(ch) ? ch : '_').join(' ');
    kgBody(`<div style="font-size:2.4em;">${faces[kg.wrong]}</div>
        <p style="color:#e74c3c;">Mistakes: ${kg.wrong} / 6</p>
        <p style="color:#fff; font-size:1.8em; letter-spacing:4px; margin:8px 0; font-family:monospace;">${shown}</p>
        <div>${'abcdefghijklmnopqrstuvwxyz'.split('').map(ch => `<button onclick="hangGuess('${ch}')" ${kg.guessed.has(ch) ? 'disabled' : ''} style="width:34px; height:34px; margin:2px;
            border:2px solid #3498db; border-radius:8px; background:${kg.guessed.has(ch) ? '#333' : '#0f3460'}; color:white; cursor:pointer;">${ch}</button>`).join('')}</div>`);
}
function hangGuess(ch) {
    if (!kgAlive() || kg.guessed.has(ch)) return;
    kg.guessed.add(ch);
    if (!kg.word.includes(ch)) kg.wrong++;
    renderHangman();
    if (kg.word.split('').every(c => kg.guessed.has(c))) setTimeout(() => kgAlive() && kgFinish('win', `You got it: "${kg.word}"!`), 600);
    else if (kg.wrong >= 6) setTimeout(() => kgAlive() && kgFinish('lose', `The word was "${kg.word}".`), 600);
}

// =============================================
// 🃏 MEMORY MATCH
// =============================================
function kgMemory() {
    const icons = kgShuffle(['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐵', '🐰', '🦄', '🐢']).slice(0, 6);
    kg.cards = kgShuffle(icons.concat(icons)).map(e => ({ e, up: false, done: false }));
    kg.first = -1; kg.moves = 0; kg.lock = false;
    kgShell('Memory Match', '');
    renderMemory();
}
function renderMemory() {
    kgBody(`<p style="color:#d9b99b; margin-bottom:8px;">Moves: ${kg.moves} (12 or fewer is a great score!)</p>
        <div style="display:grid; grid-template-columns:repeat(4,64px); gap:6px; justify-content:center;">
        ${kg.cards.map((c, i) => `<button onclick="memFlip(${i})" style="height:64px; font-size:1.9em; border:2px solid #3498db; border-radius:10px;
            background:${c.done ? '#1a7a4a' : c.up ? '#f5f0e6' : '#0f3460'}; cursor:pointer;">${c.up || c.done ? c.e : '❓'}</button>`).join('')}</div>`);
}
function memFlip(i) {
    if (!kgAlive() || kg.lock) return;
    const c = kg.cards[i];
    if (c.up || c.done) return;
    c.up = true;
    if (kg.first < 0) { kg.first = i; renderMemory(); return; }
    const a = kg.cards[kg.first];
    kg.moves++;
    renderMemory();
    if (a.e === c.e) {
        a.done = c.done = true; a.up = c.up = false; kg.first = -1;
        renderMemory();
        if (kg.cards.every(x => x.done)) setTimeout(() => kgAlive() && kgFinish(kg.moves <= 12 ? 'win' : kg.moves <= 18 ? 'tie' : 'lose', `All matched in ${kg.moves} moves!`), 600);
    } else {
        kg.lock = true;
        const first = kg.first; kg.first = -1;
        setTimeout(() => { if (!kgAlive()) return; kg.cards[first].up = false; c.up = false; kg.lock = false; renderMemory(); }, 800);
    }
}

// =============================================
// 🎨 SIMON COLORS — watch the colors, then repeat them
// =============================================
const SIMON_COLORS = [{ n: 'red', c: '#e74c3c', l: '#ff9a8d' }, { n: 'green', c: '#27ae60', l: '#7dffb0' }, { n: 'blue', c: '#2980b9', l: '#8fd0ff' }, { n: 'yellow', c: '#f1c40f', l: '#fff59a' }];
function kgSimon() {
    kg.seq = []; kg.pos = 0; kg.lit = -1; kg.turn = 'watch';
    kgShell('Simon Colors', '');
    simonNextRound();
}
function simonNextRound() {
    kg.seq.push(Math.floor(Math.random() * 4));
    kg.pos = 0; kg.turn = 'watch';
    renderSimon(`Round ${kg.seq.length} of 6 — watch carefully! 👀`);
    kg.seq.forEach((c, i) => {
        setTimeout(() => { if (kgAlive() && kg.turn === 'watch') { kg.lit = c; renderSimon(`Round ${kg.seq.length} of 6 — watch carefully! 👀`); } }, 900 + i * 800);
        setTimeout(() => { if (kgAlive() && kg.turn === 'watch') { kg.lit = -1; renderSimon(`Round ${kg.seq.length} of 6 — watch carefully! 👀`); } }, 900 + i * 800 + 500);
    });
    setTimeout(() => { if (kgAlive()) { kg.turn = 'you'; kg.lit = -1; renderSimon('Your turn! Repeat the colors. 👆'); } }, 900 + kg.seq.length * 800);
}
function renderSimon(msg) {
    kgBody(`<p style="color:#d9b99b; margin-bottom:8px;">${msg}</p>
        <div style="display:grid; grid-template-columns:repeat(2,110px); gap:8px; justify-content:center;">
        ${SIMON_COLORS.map((s, i) => `<button onclick="simonPress(${i})" style="height:90px; border:3px solid #fff; border-radius:14px;
            background:${kg.lit === i ? s.l : s.c}; opacity:${kg.lit === i ? 1 : 0.8}; cursor:pointer;"></button>`).join('')}</div>`);
}
function simonPress(i) {
    if (!kgAlive() || kg.turn !== 'you') return;
    if (kg.seq[kg.pos] !== i) { kg.turn = 'over'; kgFinish('lose', `Oops — wrong color! You got to round ${kg.seq.length}.`); return; }
    kg.pos++;
    if (kg.pos === kg.seq.length) {
        if (kg.seq.length >= 6) { kg.turn = 'over'; kgFinish('win', 'You remembered all 6 rounds!'); return; }
        kg.turn = 'watch'; renderSimon('Great! Get ready... ✨');
        setTimeout(() => kgAlive() && simonNextRound(), 900);
    }
}

// =============================================
// 🔢 GUESS THE NUMBER (1–50, 6 guesses)
// =============================================
function kgGuess() {
    kg.secret = 1 + Math.floor(Math.random() * 50); kg.tries = 0; kg.hint = "I'm thinking of a number from 1 to 50!";
    kgShell('Guess the Number', '');
    renderGuess();
}
function renderGuess() {
    kgBody(`<p style="color:#d9b99b; margin-bottom:6px;">${kg.hint}</p>
        <p style="color:#aaa; margin-bottom:8px;">Guesses used: ${kg.tries} / 6</p>
        <input id="kg-guess-input" type="number" min="1" max="50" style="font-size:1.2em; width:90px; padding:6px; text-align:center; border-radius:8px; border:2px solid #3498db;">
        ${kgBtn('guessTry()', 'Guess!')}`);
    const inp = document.getElementById('kg-guess-input');
    if (inp) { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') guessTry(); }); }
}
function guessTry() {
    if (!kgAlive()) return;
    const inp = document.getElementById('kg-guess-input');
    const g = parseInt(inp && inp.value, 10);
    if (!(g >= 1 && g <= 50)) { kg.hint = 'Pick a number from 1 to 50!'; renderGuess(); return; }
    kg.tries++;
    if (g === kg.secret) { kgFinish('win', `Yes! It was ${kg.secret}! (${kg.tries} ${kg.tries === 1 ? 'guess' : 'guesses'})`); return; }
    if (kg.tries >= 6) { kgFinish('lose', `Out of guesses — it was ${kg.secret}.`); return; }
    kg.hint = g < kg.secret ? `${g} is too LOW ⬆️` : `${g} is too HIGH ⬇️`;
    renderGuess();
}

// =============================================
// 🧠 KIDS TRIVIA (5 questions)
// =============================================
function kgTrivia() {
    kg.qs = kgShuffle(KG_TRIVIA).slice(0, 5); kg.qi = 0; kg.score = 0;
    kgShell('Kids Trivia', '');
    renderTrivia();
}
function renderTrivia() {
    const [q, , choices] = kg.qs[kg.qi];
    kgBody(`<p style="color:#aaa; margin-bottom:4px;">Question ${kg.qi + 1} of 5 &nbsp;·&nbsp; Score ${kg.score}</p>
        <p style="color:#FFD700; font-size:1.15em; margin-bottom:10px; max-width:380px;">${q}</p>
        ${kgShuffle(choices).map(c => kgBtn(`triviaAnswer(this.dataset.a)`, c, 'display:block; width:100%;').replace('<button', `<button data-a="${c.replace(/"/g, '&quot;')}"`)).join('')}`);
}
function triviaAnswer(a) {
    if (!kgAlive()) return;
    const right = kg.qs[kg.qi][1];
    if (a === right) kg.score++;
    kgBody(`<p style="color:${a === right ? '#2ecc71' : '#e74c3c'}; font-size:1.3em;">${a === right ? '✅ Correct!' : '❌ It was: ' + right}</p>`);
    setTimeout(() => {
        if (!kgAlive()) return;
        kg.qi++;
        if (kg.qi >= 5) kgFinish(kg.score >= 4 ? 'win' : kg.score >= 3 ? 'tie' : 'lose', `You got ${kg.score} out of 5!`);
        else renderTrivia();
    }, 900);
}

// =============================================
// 🔀 WORD SCRAMBLE (3 words)
// =============================================
function kgScramble() {
    kg.words = kgShuffle(KG_WORDS).slice(0, 3); kg.wi = 0; kg.score = 0;
    kgShell('Word Scramble', '');
    renderScramble('');
}
function renderScramble(msg) {
    const w = kg.words[kg.wi];
    let s = kgShuffle(w.split('')).join('');
    if (s === w) s = w.split('').reverse().join('');
    kg.shown = kg.shown && kg.shownFor === kg.wi ? kg.shown : s; kg.shownFor = kg.wi;
    kgBody(`<p style="color:#aaa; margin-bottom:4px;">Word ${kg.wi + 1} of 3</p>
        <p style="color:#d9b99b; min-height:1.4em;">${msg}</p>
        <p style="color:#FFD700; font-size:2em; letter-spacing:6px; margin:6px 0 10px; font-family:monospace;">${kg.shown.toUpperCase()}</p>
        <input id="kg-word-input" type="text" autocomplete="off" style="font-size:1.1em; width:170px; padding:6px; text-align:center; border-radius:8px; border:2px solid #3498db;">
        ${kgBtn('scrambleTry()', 'Check')}${kgBtn('scrambleSkip()', 'Skip', 'background:#555;')}`);
    const inp = document.getElementById('kg-word-input');
    if (inp) { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') scrambleTry(); }); }
}
function scrambleNext() {
    kg.wi++; kg.shown = null;
    if (kg.wi >= 3) kgFinish(kg.score >= 2 ? 'win' : kg.score === 1 ? 'tie' : 'lose', `You unscrambled ${kg.score} out of 3!`);
    else renderScramble('');
}
function scrambleTry() {
    if (!kgAlive()) return;
    const v = (document.getElementById('kg-word-input').value || '').trim().toLowerCase();
    if (v === kg.words[kg.wi]) { kg.score++; scrambleNext(); } else renderScramble('Not quite — try again! 🤔');
}
function scrambleSkip() {
    if (!kgAlive()) return;
    scrambleNext();
}
