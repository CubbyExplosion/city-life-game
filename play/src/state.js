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
    parentTemperament: 'calm', // 'calm' or 'strict' — rolled fresh in startGame(), not shown to the player
    snowYear: false,           // does this year's winter have snow? (rolled every new year — snow closes school)
    toys: [],                  // ids of the toys you own (see TOY_DATA in data.js)
    gifts: [],                 // wrapped presents waiting to be opened: { id, kind: 'birthday' | 'santa' }
    dinnerDay: null,           // the school day we last went out for dinner (age*1000 + day) — we only ask once a day
    friendship: {},            // how well you know each neighbor / friend: name -> 0..10 (see neighborhood.js)
    lastMallDay: -999,         // the last day Mom & Dad offered a mall trip (age*100 + day) — see mall.js
    home: null,                // null = living with Mom & Dad, or { id, deposit } for your own apartment (apartment.js)
    crimeStats: null,          // the city's crime counts: { total, school, grocery, mall, street, solved, reported } — see crime.js
    // Food (food.js)
    fullness: 80,              // 0-100: how full you are (goes down every day)
    fridge: [],                // groceries you bought: [{ name, emoji, exp }] (exp = the day it spoils)
    // Life after school (life.js)
    graduated: false,          // finished school (at 18)
    degree: null,              // a university degree: 'medicine', 'engineering', ...
    uni: null,                 // studying now: { major, year, credits }
    job: null,                 // your job: { id, shifts, good, bad, level }
    loan: 0,                   // student loan you still owe
    overdue: 0,                // unpaid bills carried over
    lastWorkDay: -1,           // the last day you worked (age*100 + day) — one shift a day
    lastUniDay: -1             // the last day you went to a lecture
};

let birthdayMessage = '';

// Day/speed timer
// How long one in-game day lasts in real time. You choose it (3 seconds up to 1 minute) in the day-length menu; it's remembered.
const DAY_LENGTH_CHOICES = [3, 6, 10, 20, 30, 45, 60];   // seconds (60 = the maximum, 1 minute)
let DAY_MS = 10 * 1000;       // the LONGEST a day gets (at old age) — see currentDayMs() in core.js
try { const saved = parseInt(localStorage.getItem('citylife_day_seconds'), 10); if (DAY_LENGTH_CHOICES.includes(saved)) DAY_MS = saved * 1000; } catch (e) {}
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
let schoolPeriod = 0;        // 0=Math, 1=snack, 2=Reading, 3=Science, 4=lunch, 5=Art, 6=PE, 7=recess, 8=done
let correctThisPeriod = 0;
let currentQuestion = null;

// School field (recess happens outside on the grass)
let inField = false;
let recessTimer = null;
let fieldBall = null;        // the soccer ball you can kick at recess

// Car rides (see travel.js)
let driving = false;         // true while a car ride is playing — the day timer pauses
let rideState = null;        // everything about the ride in progress
let pickupInProgress = false;// a parent is already walking over to take you home from school

// Seasons / gifts (see seasons.js and gifts.js)
let snowPoints = null;       // the falling-snow particles (only exist while it's snowing)
let snowGround = null;       // the white ground around the house
let homeExtras = [];         // Christmas tree, gift boxes and toy display — rebuilt by refreshHomeExtras()
let toyPlayedAt = {};        // toy id -> last time you played with it (cooldown, not saved)

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

// Grocery store (see store.js)
let inStore = false;         // true while you're at the grocery store (the day clock pauses)
let store = null;            // everything about the store visit in progress

// Dinner out (see dinner.js)
let inRestaurant = false;    // true while Mom & Dad are asking where to eat, and while you're at the restaurant (the day clock pauses)

// Playing outside on your street (see neighborhood.js)
let inNeighborhood = false;  // true while you're outside with the neighbors (the day clock pauses)

// Shopping at the mall (see mall.js)
let inMall = false;          // true from "want to come to the mall?" until you're back in the car home (the day clock pauses)

// Work and university (see life.js) — like school, the day clock pauses while you're there
let inWork = false;          // true during a work shift
let inUni = false;           // true during a university lecture
