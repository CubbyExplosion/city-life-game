// =============================================
// STATE — the game's "memory"
// =============================================
// Every other file reads and writes the variables in this file. It's all
// declared with `let`/`const` at the top level (not inside a function), which
// in a plain <script> (not type="module") means every other script tag on
// the page shares this exact same memory — no importing needed, just load
// this file before any file that uses it (see index.html's <script> order).

const player = {
    name: 'Player',
    gender: null,
    age: 1,
    money: 0,
    happiness: 50,
    health: 100,
    education: 0,
    sleepCount: 0,
    school: null,
    city: 'Maple Grove',
    lastMoveAge: 0,
    homework: null,
    parentTemperament: 'calm' // 'calm' or 'strict' — rolled fresh in startGame(), not shown to the player
};

let birthdayMessage = '';

// Day/speed timer
const DAY_MS = 6 * 1000; // 6 seconds per real-life second = 1 in-game day
let lastDayTime = Date.now();
let dayTimerInterval = null;
let daySpeed = 1; // 1 = normal, 2 = 2x faster, 5 = 5x, 10 = 10x, etc.

// Three.js scene objects
let scene, camera, renderer, playerMesh;
let animationId;
let milkMesh = null, diaperMesh = null;
let milkTimer = null, diaperTimer = null;
let momMesh = null, dadMesh = null;
let clickableNPCs = [];   // 3D groups the player can click on
let activeRelatives = []; // relatives currently visiting the house
let activeBully = null;   // bully currently confronting the player at school
let activePet = null;     // missing pet currently hidden at home, waiting to be found
let npcCooldown = 0;

// Parent AI state machines (home)
const momAI = { mesh: null, target: { x: 3.55, z: -0.55 }, state: 'sitting' };
const dadAI = { mesh: null, target: { x: 3.55, z:  0.55 }, state: 'sitting' };
let carriedBy = null; // which parent is holding the baby (null = in crib)
let passCount = 0;    // how many times baby has been thrown this trip

// Throw arc state (baby-toss mini-scene)
const throwState = {
    active:   false,
    from:     { x: 0, z: 0 },
    to:       { x: 0, z: 0 },
    progress: 0,
    catcher:  null,
    catcherHome: null
};

// School / study state
let studyCooldown = 0;
let homeschoolSubjectIndex = 0;
let inSchool = false;
let isExamDay = false;       // true only on days 10,20,30...100 of each year (10 exams/year)
let failedExamToday = false; // set true if player got a wrong answer on exam day
let homeSceneObjects = [];
let schoolObjects = [];
let schoolNPCList = [];
let teacherApproachState = 'wandering';
let nextApproachTime = 0;
let schoolPeriod = 0;        // 0=class1, 1=snack, 2=class2, 3=class3, 4=lunch, 5=class4, 6=PE, 7=done
let correctThisPeriod = 0;
let currentQuestion = null;

// PE challenge state
let peChallenge = null;
let peClicks = 0;
let peOnComplete = null;

// Chat state
let activeChatName = '';
let isSending = false;
let geminiAvailable = false; // disabled until a valid AIza key is added

// Mini-game state
const cooldowns = { milk: 0, diaper: 0 }; // cry() cooldowns
const mg = { recipe: null, added: [], cookInterval: null };       // cooking
const shop = { list: null, added: [], checkoutInterval: null };   // shopping
