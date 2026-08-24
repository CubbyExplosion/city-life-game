// =============================================
// GEMINI AI KEY — paste your key between the quotes below
// =============================================
const GEMINI_KEY = ''; // paste your own key here for local testing only — never commit a real key, this file ships to every player's browser

const CLASSMATE_PERSONALITIES = {
    'Jake': 'You are Jake, a 10-year-old boy at school. You love football and video games. Reply in 1-2 short sentences like a kid. Be fun and enthusiastic. Use emojis sometimes.',
    'Mia':  'You are Mia, a 10-year-old girl at school. You love drawing and animals. Reply in 1-2 short sentences like a kid. Be kind and sweet. Use emojis sometimes.',
    'Sam':  'You are Sam, a 10-year-old at school. You love racing and gaming. Reply in 1-2 short sentences like a kid. Be energetic and funny. Use emojis sometimes.'
};

async function askGemini(name, userMsg) {
    const personality = CLASSMATE_PERSONALITIES[name] || 'You are a friendly 10-year-old classmate. Reply in 1 sentence.';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: personality }] },
            contents: [{ parts: [{ text: userMsg }] }]
        })
    });
    const data = await res.json();
    console.log('Gemini response:', data);
    if (!data.candidates) throw new Error(JSON.stringify(data));
    return data.candidates[0].content.parts[0].text;
}

// =============================================
// PLAYER DATA
// =============================================
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

// =============================================
// IDLE TIMER — 1 day = 20 real minutes
// =============================================
const DAY_MS = 6 * 1000; // 6 seconds per day = 6,000 milliseconds
let lastDayTime = Date.now();
let dayTimerInterval = null;
let daySpeed = 1; // 1 = normal, 2 = 2x faster, 5 = 5x, 10 = 10x

// =============================================
// THREE.JS
// =============================================
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

// =============================================
// NPC DATA
// =============================================
const RELATIVE_DATA = [
    { name:'Grandma',   shirtColor:0x9B59B6, hairColor:0xEEEEEE, dialogue:"My darling! Give grandma a hug! 🤗",      happiness:12 },
    { name:'Grandpa',   shirtColor:0x7F8C8D, hairColor:0xDDDDDD, dialogue:"How's my favourite grandchild? 😄",       happiness:12 },
    { name:'Aunt Lisa', shirtColor:0xE91E8C, hairColor:0x8B0000, dialogue:"Look how big you've gotten! 😍",          happiness:8  },
    { name:'Uncle Tom', shirtColor:0x2980B9, hairColor:0x4B2800, dialogue:"Hey sport! I brought you a treat! 🎉",   happiness:10 },
];

const BULLY_DATA = [
    { name:'Duke', shirtColor:0x4A4A4A, hairColor:0x1A1A1A },
    { name:'Rex',  shirtColor:0x5A2D2D, hairColor:0x2A1A0A },
];

const PET_NAMES = ['Whiskers', 'Biscuit', 'Shadow', 'Peanut'];

// Shown only when player.parentTemperament === 'strict' — the player never sees the label itself,
// only finds out the hard way when a homeschool question goes wrong.
const STRICT_PARENT_LINES = [
    "Mom snaps: \"What is WRONG with you?! Try again!\"",
    "Dad barks: \"How do you not know this?!\"",
    "Mom sighs loudly: \"Seriously? Focus!\"",
    "Dad mutters: \"We don't have time for this.\"",
];

const CITY_DATA = [
    { city: 'Maple Grove', classmates: [
        { name:'Jake', dialogue:"Want to sit together at lunch? 🥪",          happiness:8  },
        { name:'Mia',  dialogue:"Can we be project partners? 📝",              happiness:8  },
        { name:'Sam',  dialogue:"You're so cool! Wanna play after school? ⚽", happiness:10 },
    ]},
    { city: 'Bayside Cove', classmates: [
        { name:'Ella',  dialogue:"Want to read together at break? 📚",     happiness:8  },
        { name:'Noah',  dialogue:"I'll teach you a song on guitar! 🎸",    happiness:8  },
        { name:'Priya', dialogue:"Come skate with me after school! 🛹",    happiness:10 },
    ]},
    { city: 'Rockford Hills', classmates: [
        { name:'Theo',    dialogue:"Wanna play chess at lunch? ♟️",         happiness:8  },
        { name:'Zara',    dialogue:"I'm teaching a dance — join in! 💃",    happiness:8  },
        { name:'Deshawn', dialogue:"Got a joke that'll crack you up! 😂",   happiness:10 },
    ]},
];

function getCurrentClassmates() {
    return (CITY_DATA.find(c => c.city === player.city) || CITY_DATA[0]).classmates;
}

// Keyword-based response system — each friend has their own personality
const FRIEND_RESPONSES = {
    'Jake': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Hey! How's it going? 😄","What's up! You good? 😊","Heyyy! Good to see you! 👋"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Nice! Same honestly 😄","That's good to hear! 😊","Glad you're doing well! 👊"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Aw no! What happened? 😟","Don't be sad! I'm here! 💙","Want to talk about it? 🤗"] },
            { words:['why','how come','reason'],
              says:["Hmm good question! I wonder too 🤔","I actually have no idea! 😂","Because that's just how it is I guess! 🤷"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Cool! 😊","Nice one! 👊","Sounds good to me! 😄"] },
            { words:['no','nope','nah','never'],
              says:["Seriously?! 😮","Aww come on! 😄","No way really?! 🤣"] },
            { words:['what','huh','really','seriously'],
              says:["Yeah for real! 😄","I know right?! 😂","Exactly what I said! 🤣"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Hahaha 😂","I can't stop laughing! 😂","So funny omg 🤣"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Bye! See you tomorrow! 👋","Later! 😄","See ya! ✊"] },
            { words:['football','soccer','match','goal','sport'],
              says:["Football is the BEST! ⚽ Want to play at break?","Did you see the match? That goal was insane! 🤩","I want to be a footballer when I grow up! 🏆"] },
            { words:['game','gaming','play','video'],
              says:["What games do you play? 🎮","We should game together after school! 🎮","I got a new game last week, it's SO good! 🎮"] },
            { words:['homework','maths','math','class','school'],
              says:["Ugh homework is SO hard 😅","I barely did any of it 😂","Maths is the worst! How do you do it?"] },
            { words:['friend','friends','best','mates'],
              says:["You're my best friend here! 💙","Friends forever! ✊","So glad we're friends! 😄"] },
            { words:['food','lunch','eat','hungry','snack','sandwich','pizza','burger','chip'],
              says:["I'm starving! Lunch can't come soon enough 😋","I brought sandwiches! 🥪","What did you bring for lunch? 🍱"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Ice cream is literally the BEST 🍦","I could eat ice cream every day! 🍦","Chocolate ice cream > everything else 🍫"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Right?! Exactly! 😄","We think alike! 👊","Haha yes!! 😂"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What do YOU like best? 😄","Same! What's your favourite? 😊","Tell me more! 👊"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["Right?! So cool! 😎","I know! 😄","That's what I thought! 👊"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same, no idea! 😂","We'll figure it out! 😄","Honestly same 🤷"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["Nah I don't hate you, you're my friend! 💙","If someone's being mean tell me! ✊","You're one of the best people here! 👊"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 💙","You're not alone, I'm always here! 👊","We're mates! You've always got me! ✊"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["You've got this! 💪","Don't worry! I'll be with you! 👊","Breathe! It'll be fine! 😄"] },
        ],
        defaults:["Haha what?! 😂","Umm ok! 😄","Sure! 👊","That's a new one 😮","I have no clue lol 😂","Ok then! 😄"]
    },
    'Mia': {
        keys: [
            { words:['hi','hello','hey','sup','hiya','hii','hiii'],
              says:["Hi! 😊 How are you?","Hey! So happy to see you! 🌸","Hiii! 😄"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Yay that makes me happy! 🌸","That's wonderful! 😊","So glad! You deserve it! 💙"] },
            { words:['bad','tired','bored','sad','upset'],
              says:["Oh no! Are you okay? 🌸","Group hug! 🤗","I'll draw you something to cheer you up! 🎨"] },
            { words:['why','how come','reason'],
              says:["That's such a deep question! 🤔","Hmm I wonder why too! 🌸","Maybe just because! 😄"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Yay! 🌸","Okay! 😊","Sounds perfect! 💙"] },
            { words:['no','nope','nah','never'],
              says:["Aww really? 🌸","Are you sure? 😊","Nooo! 😮"] },
            { words:['what','huh','really','seriously'],
              says:["I know right?! 😮","Yeah for real! 🌸","Exactly! 😊"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Hahaha 😄","So funny!! 😂","You always make me laugh! 🌸"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Bye!! 🌸","See you soon! 😊","Byeee! 💙"] },
            { words:['draw','drawing','art','paint','colour','color','sketch'],
              says:["I love drawing! What do you like to draw? 🎨","Art is my favourite thing! 🎨","I'm working on a dragon right now! 🐉"] },
            { words:['animal','pet','dog','cat','panda','dolphin','bunny'],
              says:["I LOVE animals! Pandas are so cute! 🐼","Do you have a pet? 🐾","My favourite animal is a dolphin! 🐬"] },
            { words:['friend','friends','best'],
              says:["You're such a great friend! 💙","Best friends! 🌸","I'm so happy we're friends! 😊"] },
            { words:['cool','nice','awesome','pretty','cute','beautiful'],
              says:["Aww thank you! 🌸","That's so sweet! 💙","You're so kind! 😊"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Omg ice cream is my FAVOURITE 🍦","I like strawberry ice cream the most! 🍓","Can we get ice cream after school?! 🍦"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Yay we agree! 🌸","Same!! 😄","I knew we'd think alike! 💙"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What's your favourite? 🌸","I love so many things! What do you love? 😊","Tell me! 💙"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["That's okay! 🌸","Me neither honestly 😄","We can figure it out together! 💙"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["No way I hate you! You're amazing! 🌸","If anyone's being mean to you tell me! 💙","You're one of the kindest people I know! 😊"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 🌸","You'll never be alone while I'm around! 💙","Come sit with me! 😊"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's okay! I'll be right next to you! 🌸","You're braver than you think! 💙","Deep breath! You've got this! 😊"] },
            { words:['sticker','stickers'],
              says:["Let's swap stickers! ⭐","I have the BEST sticker collection! 🌟","Stickers make everything better! ⭐"] },
            { words:['homework','project','work','class'],
              says:["Can we do it together? 📝 We'd be amazing!","I love working with you! 🌟","Let's do our project on animals! 🐾"] },
        ],
        defaults:["Haha what?! 😄","Umm okay! 🌸","That's a new one! 😮","I have no idea what that means lol 😄","Ok then! 💙","Interesting choice of words! 😊"]
    },
    'Sam': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["HEY! So glad you're here! 😄","What's up! You good? 👋","Hey hey hey! 😄"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Let's gooo! 🎉","Yesss! Same! 😄","That's what I like to hear! 💙"] },
            { words:['bad','tired','bored','sad','upset'],
              says:["Hey! Don't be sad! 💙","Want to race? It'll cheer you up! 🏃","I'm always here for you! ✊"] },
            { words:['why','how come','reason'],
              says:["That's a great question! 🤔","Honestly no idea! 😂","Because why not?! 😄"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["YESSS! 🎉","Let's go! 💙","Say less! 😄"] },
            { words:['no','nope','nah','never'],
              says:["Nooo! 😮","Come onnnn! 😄","For real?! 🤣"] },
            { words:['what','huh','really','seriously'],
              says:["I KNOW RIGHT?! 😂","For real!! 😄","That's exactly what I said! 🤣"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["HAHAHA 🤣","Dead 💀😂","Too funny omg! 🤣"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["BYEEE! 👋","Later!! 🎉","See you tomorrow! 😄"] },
            { words:['race','fast','run','tag','chase','speed'],
              says:["Think you can beat me?! Challenge accepted! 💨","I'm the FASTEST in school! 🏃","Let's race at break! I'll totally win! 💨"] },
            { words:['game','gaming','play','video','console'],
              says:["I got a new adventure game! It's SO good! 🎮","Gaming is life! What do you play? 🎮","We should game together! 🎮"] },
            { words:['friend','friends','best'],
              says:["You're literally my favourite person! 💙","Best friends no question! ✊","I'm so glad we're friends! 🎉"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["SO COOL! 😎","I know right?! 🎉","That's sick! 💙"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["BRO ice cream is EVERYTHING 🍦","Chocolate all the way! 🍫","I'd eat ice cream for every meal if I could 🍦"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["EXACTLY! 🎉","We are literally the same person 😂","That's what I'm saying!! 💙"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What do YOU like? 😄","Same question back at you! 🎉","I like loads of stuff! What about you? 😊"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same lol 😂","We'll never know! 😄","Honestly same 🤷"] },
            { words:['homework','maths','math','school','class'],
              says:["School is so long today 😅","I just want break time! 🏃","When is lunch?! I'm starving! 😋"] },
            { words:['food','lunch','eat','hungry','crisp','chips'],
              says:["I'm SO hungry right now 😋","I brought crisps today! 🎉","Lunch is the best part of school! 🍕"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["Whoa I don't hate you! You're my friend! 💙","Nobody should hate you! You're awesome! 💪","If anyone's mean to you just tell me! ✊"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! You've got me 💙","You're never alone! ✊","We're friends, I got you! 🎉"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's okay! You've got this! 💪","Don't worry, I believe in you! ✊","We can face it together! 💙"] },
        ],
        defaults:["Haha what?! 😂","Umm okay! 😄","Sure why not! 🎉","I have no idea what that means lol 😂","Ok then! 😄","That's a new one! 😮"]
    },
    'Ella': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Hi there! 📚 Good to see you!","Hey! 😊 I was just reading!","Hiii! 😄"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["That's lovely to hear! 📚","So glad! 😊","Yay, happy for you! 💙"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Oh no, want to sit and read together? 📚","I'm sorry 💙 want to talk about it?","That sounds tough. I'm here 🤗"] },
            { words:['why','how come','reason'],
              says:["Ooh good question, let's find out! 🔬","I actually looked that up once! 🤔","Hmm, I wonder too! 📚"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Okay! 😊","Sounds good! 📚","Great! 💙"] },
            { words:['no','nope','nah','never'],
              says:["Oh, really? 😮","Are you sure? 📚","Hmm, okay then! 😊"] },
            { words:['what','huh','really','seriously'],
              says:["I know, surprising right? 😮","Yeah for real! 📚","Exactly! 😊"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Hehe 😄","That's funny! 📚","Haha okay that got me! 😂"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Bye! See you tomorrow! 📚","Later! 😊","Bye bye! 💙"] },
            { words:['book','books','read','reading','story','library'],
              says:["I just finished the BEST book! 📖 Want to borrow it?","The library is my favourite place! 📚","I could read all day! 📖"] },
            { words:['science','experiment','space','discover','planet','star'],
              says:["Did you know octopuses have three hearts?! 🐙","I want to be a scientist one day! 🔬","Space is SO cool, I want to see Saturn's rings! 🪐"] },
            { words:['friend','friends','best','mates'],
              says:["You're a wonderful friend! 💙","I'm glad we're friends! 📚","Friends who read together stay together! 😊"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["That's really neat! 😊","Wow, I love that! 📚","So cool! 💙"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["I like vanilla with sprinkles! 🍦","Ice cream and a good book, perfect combo! 📚🍦","Yum, that sounds lovely! 🍨"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Snap! We think alike! 📚","Yay, same! 😊","Ikr! 💙"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What's your favourite? 📚","I love so many things, tell me yours! 😊","Ooh tell me more! 💙"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["That's okay, we can look it up! 🔬","Me neither, honestly! 😊","We'll figure it out together! 📚"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["No way, you're wonderful! 💙","If someone's mean to you, tell a teacher, okay? 📚","You don't deserve that. I've got you! 🤗"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 📚","You're never alone, come sit with me! 💙","We can read together whenever you want! 😊"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's okay to feel scared, I'll stay with you 💙","You're braver than you know! 📚","Take a deep breath, you've got this! 😊"] },
            { words:['homework','maths','math','class','school','project'],
              says:["I love homework, it's like a puzzle! 📚","Want to study together? 🔬","I'll help you if you want! 😊"] },
        ],
        defaults:["Hmm, interesting! 📚","Oh I see! 😊","That's a new one to me! 😮","Not sure what that means! 📚","Okay! 😄","Tell me more! 💙"]
    },
    'Noah': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Hey! 🎸 What's up?","Yo! 😄","Hiii, good to see you! 🎵"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Nice, that's my vibe too! 🎸","Sweet, glad to hear it! 😄","That's the tune I like to hear! 🎵"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Aw man, want me to play you a song? 🎸","That's rough, I'm here 💙","Music always helps me feel better 🎵"] },
            { words:['why','how come','reason'],
              says:["Hmm not sure honestly! 🤔","Good question! 🎸","No idea, but let's find out! 🎵"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Cool cool 🎸","Sounds good! 😄","Alright! 🎵"] },
            { words:['no','nope','nah','never'],
              says:["Aw really? 😮","No way! 🎸","Hmm, okay! 😄"] },
            { words:['what','huh','really','seriously'],
              says:["For real! 😄","Yeah I know right?! 🎸","Exactly! 🎵"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Haha 😂","That's a good one! 🎸","Lol true! 😄"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Later! 🎸","Bye, catch you tomorrow! 😄","See ya! 🎵"] },
            { words:['music','song','guitar','sing','singing'],
              says:["I'm learning a new song on guitar! 🎸","Music is basically my whole life! 🎵","Want me to teach you a chord? 🎸"] },
            { words:['band','instrument','drum','piano','concert'],
              says:["I want to start a band someday! 🥁","Piano is fun too but guitar's my favourite! 🎹","Going to a concert would be amazing! 🎤"] },
            { words:['friend','friends','best','mates'],
              says:["You're a solid friend! 🎸","Glad we're friends! 😄","Friends who jam together! 🎵"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["So cool! 🎸","That's awesome! 😄","Love it! 🎵"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Ice cream after music practice is the best! 🎸🍦","Chocolate chip is my go-to! 🍫","Yesss, let's get some! 🍦"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Haha same! 🎸","We're on the same wavelength! 🎵","Ikr! 😄"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What's your favourite? 🎸","I love a lot of stuff, what about you? 🎵","Tell me! 😄"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same honestly! 🎸","No clue, but that's ok! 😄","We'll jam it out! 🎵"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["Nah, you're cool with me! 🎸","If someone's mean, tell someone, ok? 💙","Don't let it get you down! 🎵"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm here, you've got a friend in me! 🎸","You're not alone! 💙","Come hang out, I'll play you something 🎵"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's ok, take a breath 💙","You've got this! 🎸","I believe in you! 🎵"] },
            { words:['homework','maths','math','class','school','project'],
              says:["Homework's rough, but we can push through 🎸","Let's team up on it! 😄","Almost break time though! 🎵"] },
        ],
        defaults:["Haha, interesting! 🎸","Hmm, not sure! 😄","That's new to me! 🎵","Okay then! 😄","Huh, cool! 🎸","Tell me more! 🎵"]
    },
    'Priya': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Heyyy! 🛹 What's up?!","Yo! Ready for an adventure? 😄","Hiii! 🛹"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Let's gooo! 🛹","Yesss, love that energy! 😄","Awesome!! 💨"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Aw, want to go skate it off? 🛹","That's tough, I'm here for you 💙","Let's go do something fun to cheer up! 😄"] },
            { words:['why','how come','reason'],
              says:["Honestly no clue! 😂","Good question! 🛹","Let's go find out! 💨"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Let's go! 🛹","Yesss! 😄","Say less! 💨"] },
            { words:['no','nope','nah','never'],
              says:["Nooo really? 😮","Aw come on! 🛹","For real?! 😄"] },
            { words:['what','huh','really','seriously'],
              says:["I know right?! 😮","For real!! 🛹","Exactly! 😄"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["HAHA 🤣","Dead 💀😂","So funny! 🛹"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Bye!! See ya tomorrow! 🛹","Later!! 💨","Bye bye! 😄"] },
            { words:['skate','skateboard','trick','ramp','ollie'],
              says:["I landed a new trick yesterday! 🛹","Come skate with me, it's SO fun! 🛹","I'm practicing ollies, wanna watch? 💨"] },
            { words:['adventure','explore','climb','outside','forest','hike'],
              says:["Let's go explore the park after school! 🌳","I LOVE being outside! 💨","Climbing trees is the best! 🧗"] },
            { words:['friend','friends','best','mates'],
              says:["You're my adventure buddy! 🛹","Friends forever! 💨","So glad we're friends! 😄"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["SO cool! 😎","Love that! 🛹","That's sick! 💨"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Ice cream after skating is the BEST combo! 🛹🍦","Mango flavour all the way! 🍧","Let's get some after school! 🍦"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["EXACTLY! 🛹","Same!! 💨","We're basically twins! 😄"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What do YOU like? 🛹","I like so much stuff, tell me yours! 💨","Ooh tell me! 😄"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same lol 😂","No idea, let's just go find out! 🛹","We'll figure it out! 💨"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["No way, you're awesome! 🛹","If someone's mean, tell someone, okay? 💙","I've got your back! 💨"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 🛹","You're never alone, come hang with me! 💨","We're friends, always! 😄"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's ok to be scared, I'll go first! 🛹","You've totally got this! 💨","I believe in you! 😄"] },
            { words:['homework','maths','math','class','school','project'],
              says:["Ugh homework, let's get it done fast so we can play! 🛹","I just want break time! 💨","Almost done with school today!"] },
        ],
        defaults:["Haha what?! 😂","Umm okay! 🛹","That's new! 😮","No clue lol 😂","Ok then! 😄","Interesting! 💨"]
    },
    'Theo': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Hey there! ♟️","Hello! 😊","Hi! Good to see you! 🧠"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Excellent! ♟️","That's great to hear! 😊","Glad you're doing well! 🧠"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["I'm sorry to hear that. Want to play a calm game of chess? ♟️","That sounds hard, I'm here 💙","Let's think it through together 🧠"] },
            { words:['why','how come','reason'],
              says:["Let's think about it logically 🧠","A very good question ♟️","Hmm, let me consider that 🤔"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Very well! ♟️","Okay, sounds good 😊","Agreed! 🧠"] },
            { words:['no','nope','nah','never'],
              says:["Interesting, I disagree slightly ♟️","Are you certain? 😊","Hmm, okay then 🧠"] },
            { words:['what','huh','really','seriously'],
              says:["Indeed, surprising! 😮","Yes, truly! ♟️","Exactly so! 🧠"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Ha, good one! 😄","That's clever! ♟️","Amusing! 🧠"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Farewell, see you tomorrow! ♟️","Bye! 😊","Until next time! 🧠"] },
            { words:['chess','puzzle','strategy','checkmate','board game'],
              says:["I'm working on a new opening move! ♟️","Chess is all about thinking three steps ahead 🧠","Want a match at lunch? ♟️"] },
            { words:['smart','think','brain','plan','clever'],
              says:["I love a good challenge! 🧠","Thinking it through carefully always helps ♟️","Let's make a plan! 🧠"] },
            { words:['friend','friends','best','mates'],
              says:["A true and valued friend! ♟️","I'm glad we're friends 😊","Friends make the best teammates 🧠"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["Quite impressive! ♟️","That is excellent! 😊","Remarkable! 🧠"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Mint chip, a logical choice! ♟️🍦","Ice cream is a great reward after a good match! 🍨","I do enjoy dessert! 🍦"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Indeed, we agree! ♟️","Precisely! 🧠","Same here! 😊"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What is your favourite? ♟️","I enjoy many things, tell me yours 🧠","Do share! 😊"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["That's alright, we'll work it out ♟️","Not sure either, honestly 😊","We can reason it out together 🧠"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["Certainly not, you're a fine friend ♟️","If someone is unkind, please tell a teacher 💙","You deserve respect 🧠"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here ♟️","You are not alone, come sit with me 💙","We can play together anytime 🧠"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's alright to feel that way 💙","Take a breath, think it through, you'll be fine ♟️","You are capable of more than you think 🧠"] },
            { words:['homework','maths','math','class','school','project'],
              says:["I rather enjoy homework, like a puzzle ♟️","Would you like to study together? 🧠","Mathematics is quite satisfying! 📐"] },
        ],
        defaults:["A curious statement! ♟️","I see! 🧠","Hmm, noted! 😊","Not quite sure what that means! ♟️","Interesting! 🧠","Very well! 😊"]
    },
    'Zara': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Heyyy! 💃 So good to see you!","Hi hi! 😄","Hey! Ready to dance? 🎶"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Yasss love that! 💃","So happy for you! 😄","That's amazing! 🎶"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Aw no, let's dance it out, it always helps! 💃","I'm here for you 💙","Want to talk about it? 😊"] },
            { words:['why','how come','reason'],
              says:["Ooh good question! 🤔","Honestly not sure! 💃","Let's find out! 🎶"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Yay! 💃","Perfect! 😄","Love it! 🎶"] },
            { words:['no','nope','nah','never'],
              says:["Aww really? 😮","No way! 💃","Hmm okay! 😄"] },
            { words:['what','huh','really','seriously'],
              says:["I know right?! 😮","For real! 💃","Exactly! 🎶"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["Hahaha 😂","So funny! 💃","I'm dying 🤣"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["Byeee! 💃","See you tomorrow! 😄","Later! 🎶"] },
            { words:['dance','dancing','move','spin','routine'],
              says:["I'm learning a new routine, wanna see?! 💃","Dancing makes me SO happy! 🎶","Come join my dance crew! 💃"] },
            { words:['outfit','fashion','style','clothes','dress'],
              says:["I love picking out fun outfits! 👗","Your style is great! 💃","Fashion is basically art! 🎨"] },
            { words:['friend','friends','best','mates'],
              says:["You're an amazing friend! 💃","Best friends! 😄","So glad we're friends! 🎶"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["SO cool! 😎","Love it! 💃","Amazing! 🎶"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Strawberry is my go-to! 🍓","Ice cream after dance practice is the best! 💃🍦","Yesss let's get some! 🍨"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["Yesss same! 💃","We match! 🎶","Ikr!! 😄"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What's your favourite? 💃","I love so many things! 🎶","Tell me! 😄"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same honestly! 💃","No idea lol 😄","We'll figure it out! 🎶"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["No way, you're wonderful! 💃","If someone's mean, please tell someone, okay? 💙","You deserve kindness! 🎶"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 💃","You're never alone, come dance with me! 🎶","We're friends always! 😄"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's okay to feel nervous 💙","You've totally got this! 💃","I believe in you! 🎶"] },
            { words:['homework','maths','math','class','school','project'],
              says:["Ugh homework, let's get it done so we can dance! 💃","Almost break time! 🎶","We can study together!"] },
        ],
        defaults:["Haha what?! 😄","Umm okay! 💃","That's new! 😮","No clue lol 😂","Ok then! 🎶","Interesting! 😄"]
    },
    'Deshawn': {
        keys: [
            { words:['hi','hello','hey','sup','yo','hiya','hii','hiii'],
              says:["Heyyy! 😂 Got a joke for ya!","Yo! What's cracking? 🎉","Hii! 😄"] },
            { words:['good','great','fine','awesome','amazing','well'],
              says:["Let's gooo! 🎉","Nice, love that! 😄","Same here honestly! 😂"] },
            { words:['bad','tired','bored','sad','upset','stressed'],
              says:["Aw no, let me tell you a joke to cheer you up! 😂","I'm here for you 💙","Want to laugh it off? 🎉"] },
            { words:['why','how come','reason'],
              says:["Honestly no idea! 😂","Good question! 🤔","Because bananas, that's why! 🍌😂"] },
            { words:['ok','okay','sure','alright','k','yep','yeah','yes'],
              says:["Heck yes! 🎉","Say less! 😄","Let's go! 😂"] },
            { words:['no','nope','nah','never'],
              says:["Nooo way?! 😮","Come onnn! 😂","For real?! 🎉"] },
            { words:['what','huh','really','seriously'],
              says:["I KNOW RIGHT?! 😂","For real!! 🎉","That's what I said! 🤣"] },
            { words:['lol','haha','hehe','ha ha','he ha','he he','lmao','funny'],
              says:["HAHAHA 🤣","Dead 💀😂","I'm crying, too funny! 🤣"] },
            { words:['bye','cya','see you','later','goodbye'],
              says:["BYEEE! 😂","Later!! 🎉","See ya, don't laugh too much without me! 😄"] },
            { words:['joke','jokes','prank','funny story','laugh'],
              says:["Why did the math book look sad? It had too many problems! 😂","I've got a hundred more jokes! 🎉","Wanna hear my best prank idea?! 😂"] },
            { words:['comic','cartoon','meme','show','tv'],
              says:["Have you seen that new cartoon?! 😂","Memes are basically my hobby! 🎉","Let's watch something funny after school! 📺"] },
            { words:['friend','friends','best','mates'],
              says:["You're my favourite person to crack jokes with! 😂","Best friends forever! 🎉","So glad we're friends! 😄"] },
            { words:['cool','nice','awesome','great','wow'],
              says:["SO cool! 😎","I know right?! 🎉","That's awesome! 😂"] },
            { words:['ice cream','icecream','cream','chocolate','candy','sweet','cookie','dessert','cake'],
              says:["Bro ice cream is EVERYTHING 🍦","I'd trade my homework for ice cream any day! 😂","Chocolate all the way! 🍫"] },
            { words:['me too','me to','same','same here','ikr','i know'],
              says:["EXACTLY! 🎉","We're basically the same person! 😂","That's what I'm saying! 💙"] },
            { words:['like','love','favourite','favorite','enjoy','prefer'],
              says:["What do YOU like? 😄","I like tons of stuff, what about you? 🎉","Tell me! 😂"] },
            { words:['idk','dunno','not sure','maybe','i don'],
              says:["Same lol 😂","No clue, but that's funny! 🎉","We'll never know! 😄"] },
            { words:['hate','hate me','angry','mad','annoyed','mean','bully'],
              says:["Whoa, no way, you're awesome! 💙","If someone's mean, tell someone, for real 💪","Nobody should treat you like that! ✊"] },
            { words:['miss','lonely','alone','left out','nobody'],
              says:["I'm right here! 😂","You're never alone, I got you! 💙","We're friends, always! 🎉"] },
            { words:['scared','nervous','worried','anxious','afraid'],
              says:["It's ok, I'll crack a joke to help! 😂","You've got this! 💪","We can face it together! 🎉"] },
            { words:['homework','maths','math','class','school','project'],
              says:["Homework's rough but I'll make it fun! 😂","Race you to finish it! 🎉","Almost break time! 😄"] },
        ],
        defaults:["Haha what?! 😂","Umm okay! 😄","Sure why not! 🎉","No idea what that means lol 😂","Ok then! 😄","That's a new one! 😮"]
    }
};

function getClassmateResponse(name, msg) {
    const data = FRIEND_RESPONSES[name];
    if (!data) return "...";
    const m = msg.toLowerCase();
    for (const entry of data.keys) {
        // Use word boundaries so "yo" won't match "you", "hate" won't match "whatever", etc.
        if (entry.words.some(w => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(m))) {
            const replies = entry.says;
            return replies[Math.floor(Math.random() * replies.length)];
        }
    }
    return data.defaults[Math.floor(Math.random() * data.defaults.length)];
}

// Home positions for parents (on the couch)
const MOM_HOME = { x: 3.55, z: -0.55 };
const DAD_HOME = { x: 3.55, z:  0.55 };

// Parent AI state machines
const momAI = { mesh: null, target: { x: 3.55, z: -0.55 }, state: 'sitting' };
const dadAI = { mesh: null, target: { x: 3.55, z:  0.55 }, state: 'sitting' };

let carriedBy  = null; // which parent is holding the baby (null = in crib)
let passCount  = 0;    // how many times baby has been thrown this trip

// Throw arc state
const throwState = {
    active:   false,
    from:     { x: 0, z: 0 },
    to:       { x: 0, z: 0 },
    progress: 0,
    catcher:  null,
    catcherHome: null
};

const keys = {};
document.addEventListener('keydown', e => { if (e.target.tagName !== 'INPUT') keys[e.key] = true; });
document.addEventListener('keyup',   e => { if (e.target.tagName !== 'INPUT') keys[e.key] = false; });

// =============================================
// CRY ACTIONS (baby age 1-2)
// =============================================
const cooldowns = { milk: 0, diaper: 0 };

function cry(type) {
    const now = Date.now();
    if (now - cooldowns[type] < 5000) {
        showEvent('⏳', 'Wait a moment...');
        return;
    }
    cooldowns[type] = now;

    if (type === 'milk') {
        player.happiness = Math.min(100, player.happiness + 10);
        showEvent('🍼', 'Mom heard you cry and brought you warm milk.');
        if (milkMesh) {
            milkMesh.visible = true;
            if (milkTimer) clearTimeout(milkTimer);
            milkTimer = setTimeout(() => { milkMesh.visible = false; }, 3000);
        }
        momAI.state = 'caring';
        momAI.target = { x: -3, z: 0 };
    } else {
        player.health    = Math.min(100, player.health + 5);
        player.happiness = Math.min(100, player.happiness + 5);
        showEvent('🧷', 'Dad rushed over and changed your diaper. You feel much better.');
        if (diaperMesh) {
            diaperMesh.visible = true;
            if (diaperTimer) clearTimeout(diaperTimer);
            diaperTimer = setTimeout(() => { diaperMesh.visible = false; }, 3000);
        }
        dadAI.state = 'caring';
        dadAI.target = { x: -3, z: 0 };
    }

    updateStats();
    saveGame();
}

// =============================================
// PARENT AI — runs every frame inside animate()
// =============================================
function randomRoomPos() {
    return { x: (Math.random() - 0.5) * 7, z: (Math.random() - 0.5) * 7 };
}

function putBabyInCrib() {
    carriedBy = null;
    passCount = 0;
    if (playerMesh) playerMesh.position.set(-3, 0.9, 0);
    showEvent('🛏️', 'You were gently placed back in your crib.');
}

function throwBaby(thrower, catcher, catcherHome) {
    const myName    = (thrower === momAI) ? 'Mom' : 'Dad';
    const otherName = (thrower === momAI) ? 'Dad' : 'Mom';
    showEvent('🤾', `${myName} threw you to ${otherName}! 😱`);

    throwState.active   = true;
    throwState.progress = 0;
    throwState.from     = { x: thrower.mesh.position.x, z: thrower.mesh.position.z };
    throwState.to       = { x: catcher.mesh.position.x, z: catcher.mesh.position.z };
    throwState.catcher      = catcher;
    throwState.catcherHome  = catcherHome;

    // Relatives watching? They attack!
    if (activeRelatives.length > 0) relativesAttackParents();

    carriedBy      = null; // baby is in the air
    thrower.state  = 'sitting';
    thrower.target = { x: (thrower === momAI ? MOM_HOME.x : DAD_HOME.x),
                       z: (thrower === momAI ? MOM_HOME.z : DAD_HOME.z) };
}

function updateParentAI(ai, homePos) {
    if (!ai.mesh) return;
    const p = ai.mesh.position;

    // Lerp toward target
    p.x += (ai.target.x - p.x) * 0.03;
    p.z += (ai.target.z - p.z) * 0.03;

    // Baby follows whoever is carrying them
    if (carriedBy === ai && playerMesh) {
        playerMesh.position.x = p.x;
        playerMesh.position.z = p.z;
        playerMesh.position.y = p.y + 1.8;
    }

    const dist = Math.hypot(p.x - ai.target.x, p.z - ai.target.z);
    if (dist > 0.15) return; // not at target yet

    if (ai.state === 'caring') {
        // Reached crib — pick up baby and wander
        carriedBy = ai;
        passCount = 0;
        ai.state  = 'wandering';
        ai.target = randomRoomPos();
        showEvent('👶', `${ai === momAI ? 'Mom' : 'Dad'} picked you up out of the crib!`);

    } else if (ai.state === 'wandering' && carriedBy === ai) {
        // Reached random spot while holding baby
        if (passCount < 4 && Math.random() < 0.99) {
            // THROW to the other parent
            const other     = (ai === momAI) ? dadAI : momAI;
            const otherHome = (ai === momAI) ? DAD_HOME : MOM_HOME;
            passCount += 1;
            throwBaby(ai, other, otherHome);
        } else {
            // Put baby back in crib
            ai.state  = 'caring'; // walk back to crib to put down
            ai.target = { x: -3, z: 0 };
            // When they arrive at crib this time, put baby down
            setTimeout(() => {
                putBabyInCrib();
                ai.state  = 'sitting';
                ai.target = { x: homePos.x, z: homePos.z };
            }, 3000);
        }

    } else if (ai.state === 'wandering') {
        // Reached spot without baby — go back home
        ai.state  = 'sitting';
        ai.target = { x: homePos.x, z: homePos.z };
    }
}

// Called automatically every 20 seconds — parents check on baby
function parentCheckOnBaby() {
    if (player.age > 2) return; // only while baby

    // Mom feeds if happiness is low
    if (player.happiness < 40 && momAI.state === 'sitting') {
        player.happiness = Math.min(100, player.happiness + 10);
        showEvent('🍼', 'Mom noticed you were unhappy and brought you some milk.');
        momAI.state  = 'caring';
        momAI.target = { x: -3, z: 0 };
        if (milkMesh) { milkMesh.visible = true; setTimeout(() => { milkMesh.visible = false; }, 3000); }
        updateStats();
        saveGame();
    }

    // Dad changes diaper if health is low
    if (player.health < 80 && dadAI.state === 'sitting') {
        player.health    = Math.min(100, player.health + 5);
        player.happiness = Math.min(100, player.happiness + 5);
        showEvent('🧷', 'Dad could tell something was wrong. He changed your diaper.');
        dadAI.state  = 'caring';
        dadAI.target = { x: -3, z: 0 };
        if (diaperMesh) { diaperMesh.visible = true; setTimeout(() => { diaperMesh.visible = false; }, 3000); }
        updateStats();
        saveGame();
    }
}


function showEvent(emoji, message) {
    const banner = document.getElementById('event-banner');
    document.getElementById('event-content').innerHTML =
        `<div class="event-emoji">${emoji}</div><div class="event-text">${message}</div>`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2500);
}

// =============================================
// COOKING MINI GAME STATE
// =============================================
const RECIPES = [
    { name: 'Veggie Soup',    steps: ['🥕','🧅','🥦'], reward: { happiness: 5  } },
    { name: 'Chicken Stew',   steps: ['🍗','🧄','🥕'], reward: { happiness: 8  } },
    { name: 'Garlic Toast',   steps: ['🍞','🧄','🧈'], reward: { happiness: 4  } },
    { name: 'Tomato Pasta',   steps: ['🍅','🧅','🧄'], reward: { happiness: 6  } },
];
const ALL_INGS = ['🥕','🧅','🥦','🍗','🧄','🍞','🧈','🍅','🫑','🧀'];

const mg = {
    recipe: null,
    added:  [],
    cookInterval: null
};

const SHOPPING_LISTS = [
    { name: 'Snack Run',      steps: ['🍎','🥛','🍞'], reward: { happiness: 5  } },
    { name: 'Toy Store Trip', steps: ['🧸','🎈','🚗'], reward: { happiness: 8  } },
    { name: 'Fruit Stand',    steps: ['🍌','🍇','🍓'], reward: { happiness: 6  } },
    { name: 'Baby Aisle',     steps: ['🧷','🧴','🧦'], reward: { happiness: 4  } },
];
const ALL_SHOP_ITEMS = ['🍎','🥛','🍞','🧸','🎈','🚗','🍌','🍇','🍓','🧷','🧴','🧦','📚','🎨'];

const shop = {
    list: null,
    added: [],
    checkoutInterval: null
};

// =============================================
// SAVE / LOAD
// =============================================
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

// =============================================
// PAGE LOAD
// =============================================
window.addEventListener('load', () => {
    if (loadSavedGame()) {
        document.getElementById('continue-btn').style.display = 'block';
    }
});

// =============================================
// START / CONTINUE
// =============================================
const NAMES = {
    girl: ['Lilly', 'Jane', 'Maya', 'Preanka', 'Emily',
           'Sofia', 'Aria', 'Nora', 'Zoe', 'Chloe',
           'Isla', 'Luna', 'Layla', 'Stella', 'Violet',
           'Aurora', 'Hazel', 'Ellie', 'Scarlett', 'Nova',
           'Mia', 'Avery', 'Harper', 'Grace', 'Penelope'],
    boy:  ['Joah', 'Bob', 'Tyler', 'Jamusen',
           'Liam', 'Noah', 'Ethan', 'Lucas', 'Mason',
           'Logan', 'Aiden', 'Jackson', 'Elijah', 'Carter',
           'Owen', 'Ryan', 'Caleb', 'Nathan', 'Hunter',
           'Zane', 'Cole', 'Finn', 'Miles', 'Jaxon']
};

function startGame(gender) {
    const nameList = NAMES[gender];
    player.name = nameList[Math.floor(Math.random() * nameList.length)];
    player.gender = gender;
    player.age = 1; player.money = 0; player.sleepCount = 0;
    player.happiness = 50; player.health = 100; player.education = 0;
    player.city = 'Maple Grove'; player.lastMoveAge = 0; player.homework = null;
    player.parentTemperament = Math.random() < 0.5 ? 'strict' : 'calm';
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

// =============================================
// DAY TIMER
// =============================================
function setSpeed(n) {
    daySpeed = n;
    lastDayTime = Date.now(); // reset so the countdown starts fresh at the new speed
    updateActionPanel();
}

function startDayTimer() {
    if (dayTimerInterval) clearInterval(dayTimerInterval);
    dayTimerInterval = setInterval(() => {
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

// =============================================
// ADVANCE ONE DAY
// =============================================
function advanceOneDay(silent) {
    birthdayMessage = '';
    player.sleepCount += 1;

    if (player.sleepCount >= 100) {
        player.sleepCount = 0;
        player.age += 1;
        player.health = Math.max(0, player.health - 1);

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
        if (player.age === 5 && !silent) {
            setTimeout(() => showSchoolChoice(), 1500);
        }
        if (!silent) birthdayMessage = `🎉 ${player.name} turned ${player.age} today! ` + birthdayMessage;
        if (!silent) maybeTriggerCityMove();
    }

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

    if (!silent) { updateStats(); updateActionPanel(); }
}

// =============================================
// ACTION PANEL
// =============================================
function updateActionPanel() {
    const panel = document.getElementById('action-panel');

    const speedBtns = [1, 2, 5, 10, 15, 20].map(n =>
        `<button class="speed-btn${daySpeed === n ? ' speed-active' : ''}" onclick="setSpeed(${n})">${n}x</button>`
    ).join('');
    const dayInfo = `☀️ Day <strong>${player.sleepCount}/100</strong> &nbsp;|&nbsp; Next day in: <strong><span id="day-timer">--:--</span></strong> &nbsp;|&nbsp; ⏩ ${speedBtns}`;

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

    if (player.age <= 2) {
        panel.innerHTML = `${bMsg}
            <div style="color:#aaa;margin-bottom:6px">${dayInfo}</div>
            <button class="action-btn" onclick="cry('milk')">😭 Cry for Milk</button>
            <button class="action-btn" onclick="cry('diaper')">😭 Cry for Diaper</button>`;
    } else {
        const schoolLabel = player.school === 'SIP' ? 'SIP' : player.school === 'Homeschool' ? 'Homeschool' : 'Ohlor';
        const studyBtn = player.age >= 5 && player.school
            ? `<button class="action-btn" onclick="study()">📚 Study (${schoolLabel})</button>`
            : '';
        const homeworkBtn = player.homework
            ? `<button class="action-btn" onclick="doHomework()">📝 Homework (${player.homework})</button>`
            : '';
        const shopBtn = player.age >= 3
            ? `<button class="action-btn" onclick="openShopping()">🛍️ Go Shopping</button>`
            : '';
        panel.innerHTML = `${bMsg}
            <div style="color:#aaa;margin-bottom:6px">⬆️⬇️⬅️➡️ to walk &nbsp;|&nbsp; ${dayInfo}</div>
            ${cookBtn} ${shopBtn} ${studyBtn} ${homeworkBtn}`;
    }
}

// =============================================
// UPDATE STATS BAR
// =============================================
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

// =============================================
// COOKING MINI GAME
// =============================================
function openMiniGame() {
    mg.recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    mg.added  = [];
    if (mg.cookInterval) clearInterval(mg.cookInterval);
    document.getElementById('minigame-overlay').classList.remove('hidden');
    renderMiniGame();
}

function renderMiniGame() {
    const r = mg.recipe;

    document.getElementById('mg-recipe').innerHTML =
        `Make: <strong>${r.name}</strong><br>Add in this order: ${r.steps.join(' → ')}`;

    document.getElementById('mg-pot').textContent =
        `🥘 Pot: ${mg.added.length ? mg.added.join(' ') : '(empty)'}`;

    // Pick 2 wrong ingredients as decoys
    const decoys = ALL_INGS.filter(i => !r.steps.includes(i))
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 2);
    const options = [...r.steps, ...decoys].sort(() => Math.random() - 0.5);

    document.getElementById('mg-ingredients').innerHTML =
        options.map(ing => `<button class="ing-btn" onclick="addIngredient('${ing}')">${ing}</button>`).join('');

    // Show Cook button only when all steps added
    if (mg.added.length === r.steps.length) {
        document.getElementById('mg-cook-section').innerHTML =
            `<button class="action-btn" onclick="startCooking()">🔥 Cook it!</button>`;
    } else {
        document.getElementById('mg-cook-section').innerHTML = '';
    }
}

function addIngredient(ing) {
    const nextNeeded = mg.recipe.steps[mg.added.length];
    if (ing === nextNeeded) {
        mg.added.push(ing);
        document.getElementById('mg-message').textContent = '✅ Nice!';
        renderMiniGame();
    } else {
        document.getElementById('mg-message').textContent = `❌ Wrong! Need ${nextNeeded} next.`;
    }
}

function startCooking() {
    let progress = 0;
    document.getElementById('mg-cook-section').innerHTML = `
        <p>🔥 Cooking...</p>
        <div class="progress-bar"><div class="progress-fill" id="mg-fill" style="width:0%"></div></div>`;
    document.getElementById('mg-ingredients').innerHTML = '';
    document.getElementById('mg-message').textContent = '';

    mg.cookInterval = setInterval(() => {
        progress += 2;
        const fill = document.getElementById('mg-fill');
        if (fill) fill.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(mg.cookInterval);
            finishCooking();
        }
    }, 60);
}

function finishCooking() {
    const r = mg.recipe;
    player.happiness = Math.min(100, player.happiness + r.reward.happiness);
    saveGame();
    updateStats();
    document.getElementById('mg-cook-section').innerHTML =
        `<p style="color:#4CAF50;font-size:1.1em">🎉 Delicious! +${r.reward.happiness} happiness</p>
         <button class="action-btn" onclick="closeMiniGame()">Done!</button>`;
}

function closeMiniGame() {
    if (mg.cookInterval) clearInterval(mg.cookInterval);
    document.getElementById('minigame-overlay').classList.add('hidden');
}

// =============================================
// TODDLER SHOPPING MINI GAME
// =============================================
function openShopping() {
    shop.list = SHOPPING_LISTS[Math.floor(Math.random() * SHOPPING_LISTS.length)];
    shop.added = [];
    if (shop.checkoutInterval) clearInterval(shop.checkoutInterval);
    document.getElementById('shopping-overlay').classList.remove('hidden');
    renderShopping();
}

function renderShopping() {
    const s = shop.list;

    document.getElementById('shop-list').innerHTML =
        `Find these: <strong>${s.name}</strong><br>Pick them in order: ${s.steps.join(' → ')}`;

    document.getElementById('shop-cart').textContent =
        `🛒 Cart: ${shop.added.length ? shop.added.join(' ') : '(empty)'}`;

    // Pick 2 wrong items as decoys
    const decoys = ALL_SHOP_ITEMS.filter(i => !s.steps.includes(i))
                                  .sort(() => Math.random() - 0.5)
                                  .slice(0, 2);
    const options = [...s.steps, ...decoys].sort(() => Math.random() - 0.5);

    document.getElementById('shop-items').innerHTML =
        options.map(item => `<button class="ing-btn" onclick="addShopItem('${item}')">${item}</button>`).join('');

    // Show Checkout button only when everything on the list is in the cart
    if (shop.added.length === s.steps.length) {
        document.getElementById('shop-checkout-section').innerHTML =
            `<button class="action-btn" onclick="startCheckout()">🛒 Check Out!</button>`;
    } else {
        document.getElementById('shop-checkout-section').innerHTML = '';
    }
}

function addShopItem(item) {
    const nextNeeded = shop.list.steps[shop.added.length];
    if (item === nextNeeded) {
        shop.added.push(item);
        document.getElementById('shop-message').textContent = '✅ Nice pick!';
        renderShopping();
    } else {
        document.getElementById('shop-message').textContent = `❌ Not that one! Need ${nextNeeded} next.`;
    }
}

function startCheckout() {
    let progress = 0;
    document.getElementById('shop-checkout-section').innerHTML = `
        <p>🛒 Checking out...</p>
        <div class="progress-bar"><div class="progress-fill" id="shop-fill" style="width:0%"></div></div>`;
    document.getElementById('shop-items').innerHTML = '';
    document.getElementById('shop-message').textContent = '';

    shop.checkoutInterval = setInterval(() => {
        progress += 2;
        const fill = document.getElementById('shop-fill');
        if (fill) fill.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(shop.checkoutInterval);
            finishShopping();
        }
    }, 60);
}

function finishShopping() {
    const s = shop.list;
    player.happiness = Math.min(100, player.happiness + s.reward.happiness);
    saveGame();
    updateStats();
    document.getElementById('shop-checkout-section').innerHTML =
        `<p style="color:#4CAF50;font-size:1.1em">🎉 Great trip! +${s.reward.happiness} happiness</p>
         <button class="action-btn" onclick="closeShopping()">Done!</button>`;
}

function closeShopping() {
    if (shop.checkoutInterval) clearInterval(shop.checkoutInterval);
    document.getElementById('shopping-overlay').classList.add('hidden');
}

// =============================================
// HOW TO PLAY GUIDE
// =============================================
function showHowToPlay() {
    document.getElementById('howto-overlay').classList.remove('hidden');
}

function closeHowToPlay() {
    document.getElementById('howto-overlay').classList.add('hidden');
}

// =============================================
// BLOOD EFFECT
// =============================================
function spawnBlood() {
    if (!playerMesh) return;
    const drops = [];
    for (let i = 0; i < 12; i++) {
        const size = 0.05 + Math.random() * 0.1;
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(size, 5, 5),
            new THREE.MeshLambertMaterial({ color: 0xAA0000 })
        );
        m.position.set(
            playerMesh.position.x + (Math.random() - 0.5) * 1.4,
            0.02,
            playerMesh.position.z + (Math.random() - 0.5) * 1.4
        );
        m.scale.y = 0.15;
        scene.add(m);
        drops.push(m);
    }
    setTimeout(() => drops.forEach(m => scene.remove(m)), 3000);
}

// =============================================
// HOSPITAL
// =============================================
function goToHospital() {
    const overlay = document.createElement('div');
    overlay.id = 'hospital-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:200; font-family:Arial;
        display:flex; flex-direction:column; overflow:hidden;
    `;
    overlay.innerHTML = `
        <!-- All the animations for the operating room live here -->
        <style>
            /* The surgical light glows on and off */
            @keyframes opGlow {
                0%,100% { box-shadow:0 0 40px 10px rgba(255,255,200,0.5); }
                50%     { box-shadow:0 0 70px 25px rgba(255,255,200,0.9); }
            }
            /* The doctor's hands move up and down while operating */
            @keyframes opHands {
                0%,100% { transform:translateY(0) rotate(8deg); }
                50%     { transform:translateY(-14px) rotate(-8deg); }
            }
            /* The heart line scrolls left forever */
            @keyframes ekgScroll {
                from { transform:translateX(0); }
                to   { transform:translateX(-200px); }
            }
            /* The beep number pulses bigger each beat */
            @keyframes beat {
                0%,100% { transform:scale(1); }
                30%     { transform:scale(1.3); }
            }
            /* The doctor jumps for joy when the operation is done */
            @keyframes opCheer {
                0%,100% { transform:translateY(0); }
                50%     { transform:translateY(-22px); }
            }
        </style>

        <!-- TOP BAR -->
        <div style="background:#c0392b; padding:12px; text-align:center; flex-shrink:0;">
            <span style="font-size:1.5em; color:white; font-weight:bold; letter-spacing:3px;">
                ➕ &nbsp; OPERATING ROOM &nbsp; ➕
            </span>
        </div>

        <!-- THE OPERATING ROOM -->
        <div style="flex:1; background:#1f5c6e; display:flex; align-items:center;
                    justify-content:center; position:relative; overflow:hidden;">

            <!-- big round surgical light hanging from ceiling -->
            <div style="position:absolute; top:0; left:50%; transform:translateX(-50%);
                        width:6px; height:50px; background:#0d3540;"></div>
            <div style="position:absolute; top:46px; left:50%; transform:translateX(-50%);
                        width:120px; height:120px; border-radius:50%;
                        background:radial-gradient(circle, #fffde0 30%, #ffe98a 100%);
                        animation:opGlow 1.5s ease-in-out infinite;"></div>

            <!-- HEART MONITOR on the wall -->
            <div style="position:absolute; top:24px; right:30px;
                        width:200px; background:#0a0a0a; border:5px solid #444;
                        border-radius:10px; padding:8px; overflow:hidden;">
                <div style="overflow:hidden; height:50px;">
                    <!-- two copies of the heartbeat line so the scroll never shows a gap -->
                    <div style="width:400px; height:50px; animation:ekgScroll 1s linear infinite;">
                        <svg width="400" height="50" viewBox="0 0 400 50">
                            <polyline fill="none" stroke="#2ecc71" stroke-width="2"
                                points="0,25 40,25 50,25 56,8 62,42 70,25 100,25 140,25 150,25 156,8 162,42 170,25 200,25
                                        200,25 240,25 250,25 256,8 262,42 270,25 300,25 340,25 350,25 356,8 362,42 370,25 400,25"/>
                        </svg>
                    </div>
                </div>
                <div style="color:#2ecc71; font-family:monospace; text-align:right; font-size:1.1em;">
                    ❤️ <span style="display:inline-block; animation:beat 1s ease-in-out infinite;">98</span> bpm
                </div>
            </div>

            <!-- OPERATING TABLE with the baby -->
            <div style="position:relative; margin-top:60px;">
                <!-- table top -->
                <div style="width:230px; height:60px; background:#2c3e50;
                            border-radius:12px; display:flex; align-items:center;
                            justify-content:center; position:relative;
                            box-shadow:0 6px 0 #1a252f;">
                    <!-- green surgical sheet over the baby -->
                    <div style="position:absolute; right:18px; bottom:8px;
                                width:120px; height:44px; background:#27ae60; border-radius:6px;"></div>
                    <!-- baby's head poking out -->
                    <div style="font-size:2.2em; position:absolute; left:28px; bottom:6px;">👶</div>
                </div>
                <!-- table legs -->
                <div style="display:flex; justify-content:space-between; width:200px; margin:0 auto;">
                    <div style="width:12px; height:60px; background:#7f8c8d;"></div>
                    <div style="width:12px; height:60px; background:#7f8c8d;"></div>
                </div>

                <!-- DOCTOR standing over the table, operating -->
                <div id="op-doctor" style="position:absolute; top:-110px; left:-70px;
                            display:flex; flex-direction:column; align-items:center;">
                    <!-- head with surgical mask + cap -->
                    <div style="width:46px; height:46px; border-radius:50%;
                                background:#f5cba7; border-top:14px solid #2e86c1;
                                position:relative;">
                        <!-- mask -->
                        <div style="position:absolute; bottom:6px; left:6px;
                                    width:34px; height:18px; background:#aed6f1; border-radius:4px;"></div>
                        <!-- eyes -->
                        <div style="position:absolute; top:18px; left:11px; font-size:0.6em;">👀</div>
                    </div>
                    <!-- blue scrubs body -->
                    <div style="width:60px; height:64px; background:#2e86c1;
                                border-radius:8px 8px 0 0; position:relative;">
                        <!-- the operating hands + tools, animated -->
                        <div id="op-tools" style="position:absolute; bottom:-26px; left:50%;
                                    transform:translateX(-50%);
                                    animation:opHands 0.6s ease-in-out infinite;
                                    font-size:1.4em; white-space:nowrap;">🧤🔪</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BOTTOM STATUS BAR (changes when the operation finishes) -->
        <div id="op-status" style="background:#1a1a2e; padding:16px; text-align:center; flex-shrink:0;">
            <p style="color:#FFD700; font-size:1.1em; margin-bottom:10px;">
                🩺 Dr. Smith is operating...
            </p>
            <div style="width:80%; max-width:400px; height:20px; margin:0 auto;
                        background:#0f3460; border-radius:10px; overflow:hidden;">
                <div id="op-bar" style="height:100%; width:0%;
                            background:linear-gradient(90deg,#e94560,#27ae60);
                            transition:width 0.1s linear;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Fill the progress bar over about 5 seconds, then show the result.
    const bar = document.getElementById('op-bar');
    let pct = 0;
    const op = setInterval(() => {
        pct += 2;
        if (bar) bar.style.width = pct + '%';
        if (pct >= 100) {
            clearInterval(op);
            finishOperation();
        }
    }, 100);
}

function finishOperation() {
    // Make the doctor celebrate: stop operating, jump for joy, raise hands.
    const doc = document.getElementById('op-doctor');
    const tools = document.getElementById('op-tools');
    if (doc) doc.style.animation = 'opCheer 0.45s ease-in-out infinite';
    if (tools) {
        tools.style.animation = 'none';   // stop the up-down operating motion
        tools.style.bottom = 'auto';
        tools.style.top = '-34px';        // move hands ABOVE his head
        tools.innerHTML = '🙌🎉';          // raised hands + party
    }

    const status = document.getElementById('op-status');
    if (!status) return;
    status.innerHTML = `
        <p style="color:#2ecc71; font-size:1.3em; font-weight:bold; margin-bottom:8px;">
            ✅ Operation successful!
        </p>
        <p style="color:#aaa; font-size:0.95em; margin-bottom:12px;">
            Dr. Smith says: <em style="color:#FFD700;">"All fixed! Try not to fall again!"</em>
        </p>
        <button onclick="leaveHospital()" style="
            font-size:1em; padding:10px 28px;
            background:#27ae60; color:white; border:none;
            border-radius:10px; cursor:pointer; font-weight:bold;">
            🏠 Go Home (healed +40)
        </button>
    `;
}

function leaveHospital() {
    const overlay = document.getElementById('hospital-overlay');
    if (overlay) overlay.remove();
    player.health = Math.min(100, player.health + 40);
    if (playerMesh) playerMesh.position.set(-3, 0.9, 0);
    updateStats();
    saveGame();
    showEvent('💉', 'Dr. Smith patched you up. Back home now!');
}

// =============================================
// NPC INTERACTIONS
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
    if (inSchool) return; // don't let relatives sneak into school
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
    if (inSchool || activePet) return;
    if (Math.random() < 0.35) {
        setTimeout(() => spawnMissingPet(), 1200);
    }
}

function spawnMissingPet() {
    if (!scene || inSchool || activePet) return;
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
    if (inSchool) return;
    if (Math.random() < 0.25) {
        setTimeout(() => showFoundMoney(), 1500);
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
            player.city = newCity.city;
            player.lastMoveAge = player.age;
            showEvent('🏙️', `Welcome to ${newCity.city}! Time to meet new classmates at school.`);
            updateStats();
            saveGame();
        }, 3000);
    }, 2500);
}

// =============================================
// SCHOOL
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

let studyCooldown = 0;

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
const HOMESCHOOL_SUBJECTS = ['Math', 'Reading', 'Science', 'Art', 'PE'];
let homeschoolSubjectIndex = 0;

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
let inSchool = false;
let isExamDay = false; // true only on days 10,20,30...100 of each year (10 exams/year)
let failedExamToday = false; // set true if player got a wrong answer on exam day
let homeSceneObjects = [];
let schoolObjects = [];
let schoolNPCList = [];
let teacherApproachState = 'wandering';
let nextApproachTime = 0;
let schoolPeriod = 0;       // 0=class1, 1=snack, 2=class2, 3=class3, 4=lunch, 5=class4, 6=PE, 7=done
let correctThisPeriod = 0;
const QUESTIONS_PER_CLASS = 3;
const SUBJECT_BY_PERIOD = { 0: 'Math', 2: 'Reading', 3: 'Science', 5: 'Art', 6: 'PE' };
const SUBJECT_EMOJI = { Math: '📐', Reading: '📖', Science: '🔬', Art: '🎨', PE: '🏃' };
const PERIOD_LABELS = ['📐 Math','🍎 Snack','📖 Reading','🔬 Science','🍽️ Lunch','🎨 Art','🏃 PE','🏠 Done!'];

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
            { emoji: '🍎', name: 'Apple',     hap: 8,  health: 5  },
            { emoji: '🧇', name: 'Crackers',  hap: 10, health: 2  },
            { emoji: '🧃', name: 'Juice Box', hap: 7,  health: 3  },
          ];

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
            <p style="color:#aaa; margin-bottom:18px;">What do you want?</p>
            ${foods.map(f => `
                <button onclick="eatFood(${f.hap}, ${f.health})"
                    style="display:block; width:100%; margin:8px 0; padding:12px; font-size:1.05em;
                           background:#0f3460; color:white; border:2px solid #3498db;
                           border-radius:10px; cursor:pointer; text-align:left;"
                    onmouseover="this.style.background='#1a6090'"
                    onmouseout="this.style.background='#0f3460'">
                    ${f.emoji} ${f.name}
                    &nbsp; <span style="color:#2ecc71">+${f.hap}😊</span>
                    <span style="color:#e74c3c"> +${f.health}❤️</span>
                </button>`).join('')}
        </div>
    `;
    document.body.appendChild(overlay);
}

function eatFood(hap, health) {
    const overlay = document.getElementById('food-overlay');
    if (overlay) overlay.remove();
    player.happiness = Math.min(100, player.happiness + hap);
    player.health    = Math.min(100, player.health    + health);
    updateStats(); saveGame();
    showEvent('😋', `Yum! +${hap} happiness, +${health} health`);
    setTimeout(advancePeriod, 1200);
}

// =============================================
// CLASSMATE CHAT — free-form text input
// =============================================
let activeChatName = '';

function showClassmateChat(name) {
    if (document.getElementById('chat-overlay')) return;
    activeChatName = name;

    const overlay = document.createElement('div');
    overlay.id = 'chat-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.55); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #3498db; border-radius:16px;
                    width:360px; max-width:92vw; display:flex; flex-direction:column;
                    max-height:88vh;">
            <div style="background:#0f3460; padding:12px 18px; border-radius:13px 13px 0 0;
                        display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                <span style="color:#3498db; font-weight:bold; font-size:1.1em;">💬 ${name}</span>
                <button onclick="closeChat()" style="background:none; border:none;
                    color:#aaa; font-size:1.3em; cursor:pointer; line-height:1;">✕</button>
            </div>
            <div id="chat-messages" style="flex:1; overflow-y:auto; padding:14px;
                min-height:120px; max-height:280px;"></div>
            <div style="padding:10px 14px 14px; border-top:1px solid #0f3460;
                        display:flex; gap:8px; flex-shrink:0;">
                <input id="chat-input" type="text" placeholder="Say something..."
                    style="flex:1; padding:9px 12px; border-radius:8px; border:2px solid #3498db;
                           background:#0f3460; color:white; font-size:0.95em; outline:none;" />
                <button onclick="sendChatMessage()"
                    style="padding:9px 14px; background:#3498db; color:white; border:none;
                           border-radius:8px; cursor:pointer; font-size:0.95em; font-weight:bold;">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // greet the player when the chat opens
    setTimeout(() => {
        const greet = getClassmateResponse(name, 'hi');
        addChatMessage(greet, false);
    }, 300);

    // press Enter to send
    const input = document.getElementById('chat-input');
    if (input) {
        input.focus();
        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
    }
}

function addChatMessage(text, isPlayer) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const row = document.createElement('div');
    row.style.cssText = `margin:5px 0; display:flex;
        justify-content:${isPlayer ? 'flex-end' : 'flex-start'};`;
    row.innerHTML = `<div style="max-width:78%; padding:8px 12px; border-radius:14px;
        font-size:0.9em; line-height:1.4; color:white;
        background:${isPlayer ? '#2980b9' : '#2c3e50'};">${text}</div>`;
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
}

let isSending = false;
let geminiAvailable = false; // disabled until a valid AIza key is added

async function sendChatMessage() {
    if (isSending) return; // prevent duplicate sends from rapid Enter presses
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    isSending = true;
    input.value = '';
    input.focus();

    addChatMessage(msg, true);

    if (geminiAvailable) {
        // Show "thinking..." bubble while waiting for AI
        const box = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = 'margin:5px 0; display:flex; justify-content:flex-start;';
        typingDiv.innerHTML = `<div style="padding:8px 12px; border-radius:14px; font-size:0.9em; color:#aaa; background:#2c3e50;">💭 thinking...</div>`;
        if (box) { box.appendChild(typingDiv); box.scrollTop = box.scrollHeight; }

        try {
            const reply = await askGemini(activeChatName, msg);
            const t = document.getElementById('typing-indicator');
            if (t) t.remove();
            addChatMessage(reply, false);
        } catch(e) {
            const t = document.getElementById('typing-indicator');
            if (t) t.remove();
            console.error('Gemini unavailable, switching to keyword mode:', e);
            geminiAvailable = false; // stop trying Gemini for this session
            addChatMessage(getClassmateResponse(activeChatName, msg), false);
        }
    } else {
        // Gemini is down — use keyword responses directly, no delay
        addChatMessage(getClassmateResponse(activeChatName, msg), false);
    }

    player.happiness = Math.min(100, player.happiness + 3);
    updateStats(); saveGame();
    isSending = false;
}

function closeChat() {
    const overlay = document.getElementById('chat-overlay');
    if (overlay) overlay.remove();
    showEvent('😄', `Nice chat with ${activeChatName}!`);
}

// =============================================
// CLASS QUESTIONS — Math, Reading, Science, Art
// =============================================
// Grade tiers shared by every subject: grades 1-7 each get their own tier (index = grade-1), grade 8+ shares the last one
function gradeTier(grade) {
    return grade <= 7 ? grade - 1 : 7;
}

// Every city's classmates also teach a handful of city-flavoured facts, mixed into
// whatever grade-tier pool is drawn from — so moving to a new city changes what you learn too.
const CITY_THEMES = {
    'Maple Grove': {
        Reading: [
            { word:'meadow', meaning:'A field of grass and wildflowers' },
            { word:'sprout', meaning:'A new plant beginning to grow' },
            { word:'rustle', meaning:'A soft sound like leaves moving' },
        ],
        Science: [
            { q:'What do trees release into the air that we breathe?', answer:'Oxygen' },
            { q:'What do we call a baby tree?', answer:'A sapling' },
            { q:'Which season do leaves usually change color and fall?', answer:'Autumn' },
        ],
        Art: [
            { q:'What kind of art often shows trees, meadows, and outdoor scenery?', answer:'Landscape art' },
            { q:'Which color do autumn leaves often turn?', answer:'Orange' },
            { q:'What do we call carving a picture into wood?', answer:'Wood carving' },
        ],
    },
    'Bayside Cove': {
        Reading: [
            { word:'tide', meaning:"The rise and fall of the ocean's water level" },
            { word:'current', meaning:'A flow of water moving in one direction' },
            { word:'shore', meaning:'The land along the edge of the ocean' },
        ],
        Science: [
            { q:'What ocean animal has eight arms?', answer:'Octopus' },
            { q:'What do we call a baby fish?', answer:'A fry' },
            { q:'Which sea creature has a hard shell and pincers?', answer:'Crab' },
        ],
        Art: [
            { q:'What do we call a painting of the ocean?', answer:'A seascape' },
            { q:'What do we call small colorful pieces arranged to form a picture?', answer:'A mosaic' },
            { q:'What color do you get mixing blue and green?', answer:'Teal' },
        ],
    },
    'Rockford Hills': {
        Reading: [
            { word:'boulder', meaning:'A very large rock' },
            { word:'summit', meaning:'The highest point of a mountain' },
            { word:'canyon', meaning:'A deep valley with steep sides' },
        ],
        Science: [
            { q:'What is very hot melted rock called before it erupts?', answer:'Magma' },
            { q:'What do we call rock formed from layers pressed together over time?', answer:'Sedimentary rock' },
            { q:'What is the tallest mountain in the world?', answer:'Mount Everest' },
        ],
        Art: [
            { q:'What is it called when an artist carves an image into stone?', answer:'Stone carving' },
            { q:'Which color is associated with rugged, earthy landscapes?', answer:'Brown' },
            { q:'What do we call art made by balancing stones on top of each other?', answer:'Rock balancing' },
        ],
    },
};

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
const READING_BANKS = [
    [ // grade 1
        { word:'happy', meaning:'Feeling glad' }, { word:'big', meaning:'Large in size' },
        { word:'fast', meaning:'Quick, not slow' }, { word:'cold', meaning:'Not warm' },
        { word:'little', meaning:'Small in size' }, { word:'loud', meaning:'Makes a big sound' },
    ],
    [ // grade 2
        { word:'quick', meaning:'Very fast' }, { word:'huge', meaning:'Extremely big' },
        { word:'quiet', meaning:'Not loud at all' }, { word:'brave', meaning:'Not afraid' },
        { word:'gentle', meaning:'Soft and kind' }, { word:'tiny', meaning:'Very small' },
    ],
    [ // grade 3
        { word:'enormous', meaning:'Extremely large' }, { word:'furious', meaning:'Very angry' },
        { word:'ancient', meaning:'Very old' }, { word:'curious', meaning:'Eager to learn' },
        { word:'exhausted', meaning:'Very tired' }, { word:'delighted', meaning:'Very pleased' },
    ],
    [ // grade 4
        { word:'nimble', meaning:'Quick and light in movement' }, { word:'vivid', meaning:'Bright, clear, and full of life' },
        { word:'stubborn', meaning:'Refusing to change your mind' }, { word:'weary', meaning:'Very tired' },
        { word:'clumsy', meaning:'Awkward and likely to drop things' }, { word:'humble', meaning:'Not proud or boastful' },
    ],
    [ // grade 5
        { word:'reluctant', meaning:'Unwilling to do something' }, { word:'diligent', meaning:'Hardworking and careful' },
        { word:'absurd', meaning:'Ridiculous or silly' }, { word:'generous', meaning:'Willing to give freely' },
        { word:'cautious', meaning:'Careful to avoid danger' }, { word:'anxious', meaning:'Worried or nervous' },
    ],
    [ // grade 6
        { word:'persistent', meaning:'Continuing firmly despite difficulty' }, { word:'skeptical', meaning:'Having doubts about something' },
        { word:'versatile', meaning:'Able to adapt to many different things' }, { word:'forthright', meaning:'Honest and direct' },
        { word:'meager', meaning:'Very small in amount' }, { word:'resourceful', meaning:'Good at finding quick solutions' },
    ],
    [ // grade 7
        { word:'ambitious', meaning:'Having a strong desire to succeed' }, { word:'indifferent', meaning:'Having no particular interest or concern' },
        { word:'perceptive', meaning:'Quick to notice or understand things' }, { word:'adamant', meaning:'Refusing to change your position' },
        { word:'superficial', meaning:'Only on the surface, not deep' }, { word:'turbulent', meaning:'Full of confusion or disorder' },
    ],
    [ // grade 8+
        { word:'ambiguous', meaning:'Having more than one meaning' }, { word:'tenacious', meaning:'Not giving up easily' },
        { word:'eloquent', meaning:'Speaking clearly and well' }, { word:'meticulous', meaning:'Very careful and precise' },
        { word:'resilient', meaning:'Able to recover quickly' }, { word:'candid', meaning:'Honest and direct' },
    ],
];

function generateReadingQuestion(grade) {
    const pool = withCityFlavor(READING_BANKS[gradeTier(grade)], 'Reading');
    const { item, choices, correctIndex } = pickWithDistractors(pool, 'meaning');
    return { subject: 'Reading', question: `What does "${item.word}" mean?`, choices, correctIndex, grade };
}

// ---------------------------------------------
// SCIENCE — fact quiz
// ---------------------------------------------
const SCIENCE_BANKS = [
    [ // grade 1
        { q:'Which animal says "moo"?', answer:'Cow' }, { q:'What do plants need to grow?', answer:'Sunlight and water' },
        { q:'Which of these is a fruit?', answer:'Apple' }, { q:'What do bees make?', answer:'Honey' },
        { q:'Which animal can fly?', answer:'Bird' }, { q:'What season comes after winter?', answer:'Spring' },
    ],
    [ // grade 2
        { q:'How many legs does a spider have?', answer:'8' }, { q:'What gas do we breathe in to live?', answer:'Oxygen' },
        { q:'What is frozen water called?', answer:'Ice' }, { q:'Which planet do we live on?', answer:'Earth' },
        { q:'What do caterpillars turn into?', answer:'Butterflies' }, { q:'What part of a plant makes food from sunlight?', answer:'Leaves' },
    ],
    [ // grade 3
        { q:'What is the closest planet to the sun?', answer:'Mercury' }, { q:'What force pulls objects toward the Earth?', answer:'Gravity' },
        { q:'What organ pumps blood through your body?', answer:'Heart' }, { q:'What do we call animals that only eat plants?', answer:'Herbivores' },
        { q:'Which of these is a mammal?', answer:'Whale' }, { q:'What is the hardest natural substance on Earth?', answer:'Diamond' },
    ],
    [ // grade 4
        { q:'What do we call an animal that eats both plants and meat?', answer:'Omnivore' }, { q:'What natural disaster is measured using the Richter scale?', answer:'Earthquake' },
        { q:'What do you call water changing from liquid to gas?', answer:'Evaporation' }, { q:'Which sense organ do you use to hear?', answer:'Ears' },
        { q:'What is the main gas found in the air we breathe?', answer:'Nitrogen' }, { q:'Which of these is a renewable energy source?', answer:'Solar power' },
    ],
    [ // grade 5
        { q:'What process do plants use to make food from sunlight?', answer:'Photosynthesis' }, { q:'What is the powerhouse of the cell?', answer:'Mitochondria' },
        { q:'Which gas do plants release during photosynthesis?', answer:'Oxygen' }, { q:'What is the boiling point of water in Celsius?', answer:'100°C' },
        { q:'What is the largest organ in the human body?', answer:'Skin' }, { q:'What force keeps planets orbiting the sun?', answer:'Gravity' },
    ],
    [ // grade 6
        { q:'What is the study of living things called?', answer:'Biology' }, { q:'What gas do plants absorb during photosynthesis?', answer:'Carbon dioxide' },
        { q:'What is the smallest unit of life called?', answer:'Cell' }, { q:'What type of rock is formed from cooled lava?', answer:'Igneous rock' },
        { q:'What is the freezing point of water in Celsius?', answer:'0°C' }, { q:'Which blood cells help fight infection?', answer:'White blood cells' },
    ],
    [ // grade 7
        { q:'What is the process of cell division called?', answer:'Mitosis' }, { q:'Which planet is known for its rings?', answer:'Saturn' },
        { q:'What is the pH of a neutral substance?', answer:'7' }, { q:'What type of energy does a moving object have?', answer:'Kinetic energy' },
        { q:'What do we call the layer of gases surrounding Earth?', answer:'Atmosphere' }, { q:'Which part of the cell controls its activities?', answer:'Nucleus' },
    ],
    [ // grade 8+
        { q:'What is the chemical symbol for gold?', answer:'Au' }, { q:'What is the basic unit of heredity called?', answer:'Gene' },
        { q:'Which layer of Earth is molten rock found in?', answer:'Mantle' }, { q:'What is stored in a stretched rubber band?', answer:'Potential energy' },
        { q:'What did Newton’s first law describe?', answer:'Objects in motion stay in motion' }, { q:'What is the approximate speed of light?', answer:'300,000 km/s' },
    ],
];

function generateScienceQuestion(grade) {
    const pool = withCityFlavor(SCIENCE_BANKS[gradeTier(grade)], 'Science');
    const { item, choices, correctIndex } = pickWithDistractors(pool, 'answer');
    return { subject: 'Science', question: item.q, choices, correctIndex, grade };
}

// ---------------------------------------------
// ART — color & art history quiz
// ---------------------------------------------
const ART_BANKS = [
    [ // grade 1
        { q:'What color do you get mixing Blue and Yellow?', answer:'Green' }, { q:'What color do you get mixing Red and Blue?', answer:'Purple' },
        { q:'What color do you get mixing Red and Yellow?', answer:'Orange' }, { q:'What shape has 3 sides?', answer:'Triangle' },
        { q:'What shape has 4 equal sides?', answer:'Square' }, { q:'What do you call a picture you paint?', answer:'A painting' },
    ],
    [ // grade 2
        { q:'What tool do you use to paint?', answer:'Paintbrush' }, { q:'What color is made by mixing black and white?', answer:'Gray' },
        { q:'What do we call a drawing of a person’s face?', answer:'A portrait' }, { q:'What shape is a ball?', answer:'Sphere' },
        { q:'Which of these is a warm color?', answer:'Orange' }, { q:'What do we call a picture of outdoor scenery?', answer:'A landscape' },
    ],
    [ // grade 3
        { q:'What are the secondary colors?', answer:'Green, orange, purple' }, { q:'What do we call a 3D artwork you can walk around?', answer:'A sculpture' },
        { q:'Who is famous for painting the Mona Lisa?', answer:'Leonardo da Vinci' }, { q:'What is a still life painting of?', answer:'Everyday objects like fruit' },
        { q:'What tool do sculptors use to carve stone?', answer:'Chisel' }, { q:'What are the three primary colors?', answer:'Red, blue, yellow' },
    ],
    [ // grade 4
        { q:'What is a mural?', answer:'A large painting on a wall' }, { q:'What art term means the outline of a shape?', answer:'Contour' },
        { q:'What kind of art is made by gluing different materials together?', answer:'Collage' }, { q:'Which of these is a cool color?', answer:'Blue' },
        { q:'What do we call a drawing made using only one color and its shades?', answer:'Monochrome' }, { q:'What do we call a picture made by pressing an inked object onto paper?', answer:'A print' },
    ],
    [ // grade 5
        { q:'Which artist famously cut off part of his own ear?', answer:'Vincent van Gogh' }, { q:'What art movement is Picasso famous for?', answer:'Cubism' },
        { q:'What do we call colors opposite each other on the color wheel?', answer:'Complementary colors' }, { q:'What does perspective in art show?', answer:'Depth and distance' },
        { q:'Which of these is an Impressionist painter?', answer:'Claude Monet' }, { q:'What material is a classic bronze sculpture made from?', answer:'A metal alloy' },
    ],
    [ // grade 6
        { q:'What are analogous colors?', answer:'Colors next to each other on the color wheel' }, { q:'What art movement focused on abstract shapes over realism?', answer:'Abstract art' },
        { q:'What is a self-portrait?', answer:"An artist's painting of themselves" }, { q:'What technique creates the illusion of depth using converging lines?', answer:'Linear perspective' },
        { q:'Who painted "The Scream"?', answer:'Edvard Munch' }, { q:'What is a silhouette?', answer:'A dark outline filled with solid color' },
    ],
    [ // grade 7
        { q:'What movement featured bold colors and wild brushstrokes, led by Matisse?', answer:'Fauvism' }, { q:'What do we call art created to persuade or send a social message?', answer:'Propaganda art' },
        { q:'What is the term for the lightest and darkest areas in a drawing?', answer:'Value' }, { q:'Which material is traditionally used in stained glass windows?', answer:'Colored glass' },
        { q:'What do we call art from a specific culture passed through generations?', answer:'Folk art' }, { q:'Who sculpted "The Thinker"?', answer:'Auguste Rodin' },
    ],
    [ // grade 8+
        { q:'What art movement featured melting clocks by Salvador Dalí?', answer:'Surrealism' }, { q:'What technique uses tiny dots of color to form an image?', answer:'Pointillism' },
        { q:'Who painted the ceiling of the Sistine Chapel?', answer:'Michelangelo' }, { q:'What is chiaroscuro in painting?', answer:'Strong contrast between light and dark' },
        { q:'What art movement is Andy Warhol associated with?', answer:'Pop Art' }, { q:'What is a fresco?', answer:'A painting made on wet plaster' },
    ],
];

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
const PE_CHALLENGES = [
    { name: 'Jumping Jacks', emoji: '🤸', target: 10 },
    { name: 'Push-Ups',      emoji: '💪', target: 12 },
    { name: 'Sit-Ups',       emoji: '🏋️', target: 12 },
    { name: 'Squats',        emoji: '🦵', target: 10 },
    { name: 'High Knees',    emoji: '🏃', target: 14 },
];
let peChallenge = null;
let peClicks = 0;
let peOnComplete = null;

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

let currentQuestion = null;

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

// =============================================
// RESTART
// =============================================
function restartGame() {
    clearInterval(dayTimerInterval);
    cancelAnimationFrame(animationId);
    document.getElementById('three-container').innerHTML = '';
    player.name = 'Player'; player.age = 1; player.money = 0;
    player.sleepCount = 0; player.happiness = 50; player.health = 100;
    player.education = 0; player.gender = null; player.school = null;
    player.city = 'Maple Grove'; player.lastMoveAge = 0; player.homework = null;
    player.parentTemperament = 'calm';
    birthdayMessage = '';
    inSchool = false;
    activeRelatives.length = 0;
    activeBully = null;
    activePet = null;
    homeschoolSubjectIndex = 0;
    currentQuestion = null;
    // Remove any dynamically-created popup that might still be open (found money,
    // bully confrontation, a class/homework/homeschool/PE question, school choice)
    ['money-overlay', 'bully-overlay', 'math-overlay', 'school-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    localStorage.clear();
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('continue-btn').style.display = 'none';
}

// =============================================
// INIT THREE.JS
// =============================================
function initThreeJS() {
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 7, 7);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Click on 3D NPCs using a raycaster
    const raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width)  *  2 - 1,
           -((e.clientY - rect.top)  / rect.height) *  2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(clickableNPCs, true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj && !obj.userData.npcData) obj = obj.parent;
            if (obj && obj.userData.npcData) interactWithNPC(obj.userData.npcData);
        }
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfffde0, 1.0);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;
    scene.add(sun);

    buildHome();
    buildPlayer();
    buildBabyProps();
    animate();
}

// =============================================
// BABY PROPS — milk bottle + diaper (hidden until triggered)
// =============================================
function buildBabyProps() {
    // Milk bottle — cylinder body + yellow top
    const bottleGroup = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.45, 10),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.1, 0.15, 10),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    );
    top.position.y = 0.3;
    bottleGroup.add(body);
    bottleGroup.add(top);
    bottleGroup.position.set(-3, 1.6, 0);
    bottleGroup.visible = false;
    scene.add(bottleGroup);
    milkMesh = bottleGroup;

    // Diaper — white folded shape
    diaperMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.4),
        new THREE.MeshLambertMaterial({ color: 0xEEEEFF })
    );
    diaperMesh.position.set(-3, 1.6, 0);
    diaperMesh.visible = false;
    scene.add(diaperMesh);
}

// =============================================
// BUILD PARENT — returns a moveable group
// =============================================
function buildParent(x, z, shirtColor, hairColor) {
    const group = new THREE.Group();

    function part(w, h, d, px, py, pz, color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px, py, pz);
        m.castShadow = true;
        group.add(m);
    }

    part(0.45, 0.28, 0.38,  0, 0.58, 0, 0x333366);   // legs
    part(0.45, 0.60, 0.38,  0, 0.98, 0, shirtColor);  // body
    part(0.38, 0.38, 0.38,  0, 1.42, 0, 0xFFCBA4);    // head
    part(0.40, 0.18, 0.40,  0, 1.66, 0, hairColor);   // hair

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function buildNPC(x, z, shirtColor, hairColor, npcData) {
    const group = new THREE.Group();
    function part(w,h,d,px,py,pz,color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w,h,d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px,py,pz);
        group.add(m);
    }
    part(0.45, 0.28, 0.38,  0, 0.58, 0, 0x333366);     // legs
    part(0.45, 0.60, 0.38,  0, 0.98, 0, shirtColor);    // body
    part(0.38, 0.38, 0.38,  0, 1.42, 0, 0xFFCBA4);      // head
    part(0.40, 0.18, 0.40,  0, 1.66, 0, hairColor);     // hair
    group.userData.npcData = npcData;
    group.position.set(x, 0, z);
    scene.add(group);
    clickableNPCs.push(group);
    return group;
}

function buildPetMesh(x, z, npcData) {
    const group = new THREE.Group();
    function part(w,h,d,px,py,pz,color) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w,h,d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(px,py,pz);
        group.add(m);
    }
    const fur = 0xE8983A;
    part(0.34, 0.22, 0.55,  0,    0.22,  0,     fur); // body
    part(0.24, 0.24, 0.24,  0,    0.34,  0.32,  fur); // head
    part(0.08, 0.10, 0.02, -0.08, 0.46,  0.42,  fur); // left ear
    part(0.08, 0.10, 0.02,  0.08, 0.46,  0.42,  fur); // right ear
    part(0.06, 0.06, 0.35,  0,    0.28, -0.32,  fur); // tail
    group.userData.npcData = npcData;
    group.position.set(x, 0, z);
    scene.add(group);
    clickableNPCs.push(group);
    return group;
}

// =============================================
// BUILD HOME — living room with parents + crib
// =============================================
function buildHome() {
    // Floor (warm wood)
    addBox(10, 0.2, 10, 0, -0.1, 0, 0x8B6914);
    // Rug in the center
    addBox(5, 0.05, 3.5, 0, 0.02, 0, 0xB85C38);

    // Walls (warm grey-blue living room)
    addBox(10, 3, 0.2,  0, 1.5, -5, 0xB0C4DE); // back wall
    addBox(0.2, 3, 10, -5, 1.5,  0, 0xB0C4DE); // left wall
    addBox(0.2, 3, 10,  5, 1.5,  0, 0xB0C4DE); // right wall
    // no front wall and no ceiling — so the camera can see in from above

    // Window on back wall
    addBox(2, 1.4, 0.12, 0, 2.0, -4.9, 0xADD8E6);
    // Window frame
    addBox(2.2, 1.6, 0.08, 0, 2.0, -4.95, 0xFFFFFF);

    // Door on front wall
    addBox(1.0, 2.2, 0.15, 2, 1.1, 4.92, 0x8B4513);

    // TV on the left wall
    addBox(0.12, 1.1, 1.8, -4.9, 2.1, 0, 0x222222); // screen (dark)
    addBox(0.10, 1.2, 2.0, -4.92, 2.1, 0, 0x444444); // frame
    addBox(0.1, 0.08, 0.5, -4.7, 1.1, 0, 0x555555); // TV stand

    // ---- CRIB (left side of room) ----
    // Base
    addBox(2,   0.8, 1.3, -3, 0.4, 0, 0xDEB887);
    // Four rails
    addBox(2,   0.65, 0.1, -3, 0.9, -0.6, 0xDEB887); // front rail
    addBox(2,   0.65, 0.1, -3, 0.9,  0.6, 0xDEB887); // back rail
    addBox(0.1, 0.65, 1.3, -4, 0.9,  0,   0xDEB887); // left rail
    addBox(0.1, 0.65, 1.3, -2, 0.9,  0,   0xDEB887); // right rail
    // Mattress
    addBox(1.8, 0.1, 1.1, -3, 0.85, 0, 0xFFFFFF);
    // Plushies inside crib
    addBox(0.30, 0.32, 0.28, -3.3, 1.05, -0.2, 0xFF6B6B); // red bear
    addBox(0.26, 0.30, 0.24, -2.8, 1.04,  0.15, 0xFFD700); // yellow duck
    addBox(0.28, 0.30, 0.26, -3.1, 1.04,  0.25, 0x98FB98); // green bunny
    // Baby mobile above crib
    addBox(0.05, 1.0, 0.05, -3, 2.5, 0, 0x888888);  // pole
    addBox(1.6, 0.05, 0.05, -3, 3.0, 0, 0x888888);  // arm
    addBox(0.2, 0.2, 0.2, -2.25, 2.7, 0, 0xFF6B6B); // red star
    addBox(0.2, 0.2, 0.2, -3.75, 2.7, 0, 0xFFD700); // yellow star
    addBox(0.2, 0.2, 0.2, -3.0, 2.7, 0,  0x98FB98); // green star

    // ---- COUCH (right side, facing left toward the baby) ----
    addBox(0.9, 0.45, 2.6,  3.8, 0.22, 0, 0x8B4513); // seat
    addBox(0.4, 1.0,  2.6,  4.3, 0.8,  0, 0x6B3410); // back rest
    addBox(0.9, 0.6,  0.2,  3.8, 0.5, -1.2, 0x6B3410); // left armrest
    addBox(0.9, 0.6,  0.2,  3.8, 0.5,  1.2, 0x6B3410); // right armrest

    // ---- PARENTS (built as moveable groups) ----
    momMesh = buildParent(3.55, -0.55, 0x4169E1, 0x4B2800);
    dadMesh = buildParent(3.55,  0.55, 0xC0392B, 0xFFD700);
    momAI.mesh = momMesh;
    dadAI.mesh = dadMesh;
}

// =============================================
// BUILD PLAYER — rebuilds the mesh for the current age
// =============================================
function buildPlayerMesh() {
    if (playerMesh) scene.remove(playerMesh);

    if (player.age <= 4) {
        // Baby: small pink capsule
        const geo = new THREE.CapsuleGeometry(0.22, 0.4, 4, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0xFFDAB9 });
        playerMesh = new THREE.Mesh(geo, mat);
        playerMesh.castShadow = true;
        playerMesh.position.set(-3, 0.9, 0); // inside crib
    } else {
        // Age 5+: humanoid with body parts, grows with age
        const group = new THREE.Group();
        const skinColor  = 0xFFCBA4;
        const shirtColor = player.gender === 'boy' ? 0x3498DB : 0xE91E8C;
        const hairColor  = player.gender === 'boy' ? 0x4B2800 : 0xCC0066;

        function part(w, h, d, px, py, pz, color) {
            const m = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshLambertMaterial({ color })
            );
            m.position.set(px, py, pz);
            m.castShadow = true;
            group.add(m);
        }

        part(0.45, 0.28, 0.38, 0, 0.58, 0, 0x2c3e50);  // legs (dark jeans)
        part(0.45, 0.60, 0.38, 0, 0.98, 0, shirtColor); // body
        part(0.38, 0.38, 0.38, 0, 1.42, 0, skinColor);  // head
        part(0.40, 0.18, 0.40, 0, 1.66, 0, hairColor);  // hair

        // Grow from 50% at age 5 up to full adult size at age 22+
        const scale = Math.min(1.0, 0.50 + (player.age - 5) * 0.037);
        group.scale.set(scale, scale, scale);
        group.position.set(0, 0, 0); // center of room
        playerMesh = group;
    }

    scene.add(playerMesh);
}

function buildPlayer() {
    buildPlayerMesh();
}

// =============================================
// HELPER: make a box
// =============================================
function addBox(w, h, d, x, y, z, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// =============================================
// GAME LOOP
// =============================================
function animate() {
    animationId = requestAnimationFrame(animate);

    if (player.age >= 3) {
        const speed = 0.06;
        if (keys['ArrowUp']    || keys['w'] || keys['W']) playerMesh.position.z -= speed;
        if (keys['ArrowDown']  || keys['s'] || keys['S']) playerMesh.position.z += speed;
        if (keys['ArrowLeft']  || keys['a'] || keys['A']) playerMesh.position.x -= speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) playerMesh.position.x += speed;
        playerMesh.position.x = Math.max(-4.5, Math.min(4.5, playerMesh.position.x));
        playerMesh.position.z = Math.max(-4.5, Math.min(4.5, playerMesh.position.z));
    }

    // Baby throw arc
    if (throwState.active && playerMesh) {
        throwState.progress += 0.022; // speed — full arc in ~45 frames (~0.75s)
        const t = Math.min(throwState.progress, 1);

        // Straight line on X and Z
        playerMesh.position.x = throwState.from.x + (throwState.to.x - throwState.from.x) * t;
        playerMesh.position.z = throwState.from.z + (throwState.to.z - throwState.from.z) * t;
        // Parabolic arc on Y — Math.sin(t*PI) gives 0 → 1 → 0
        playerMesh.position.y = 0.9 + Math.sin(t * Math.PI) * 4;
        // Spin while in air
        playerMesh.rotation.x += 0.18;

        if (throwState.progress >= 1) {
            throwState.active = false;
            playerMesh.rotation.x = 0;

            if (Math.random() < 0.40) {
                // 40% — MISSED! Baby hits the floor
                playerMesh.position.y = 0.1;
                player.health = Math.max(0, player.health - 30);
                carriedBy = null;
                passCount = 0;
                spawnBlood();
                showEvent('😱', 'Nobody caught you! You hit the floor hard!');
                updateStats();
                saveGame();
                setTimeout(() => goToHospital(), 2500);
            } else {
                // 60% — caught!
                carriedBy = throwState.catcher;
                throwState.catcher.state  = 'wandering';
                throwState.catcher.target = randomRoomPos();
                showEvent('🙌', `${throwState.catcher === momAI ? 'Mom' : 'Dad'} caught you!`);
            }
        }
    }

    // Parent AI brains (only at home)
    if (!inSchool) {
        updateParentAI(momAI, MOM_HOME);
        updateParentAI(dadAI, DAD_HOME);
    }

    // School NPC movement
    if (inSchool) updateSchoolNPCs();

    // Bobbing animation for milk and diaper
    const t = Date.now() * 0.003;
    if (milkMesh && milkMesh.visible) {
        milkMesh.position.y = 1.6 + Math.sin(t) * 0.15;
        milkMesh.rotation.z = Math.sin(t * 0.8) * 0.2;
    }
    if (diaperMesh && diaperMesh.visible) {
        diaperMesh.position.y = 1.6 + Math.sin(t) * 0.1;
    }

    // Camera outside the open front, angled down into the room
    camera.position.x = playerMesh.position.x * 0.2;
    camera.position.z = 12;
    camera.position.y = 10;
    camera.lookAt(playerMesh.position.x * 0.2, 0, -1);
    renderer.render(scene, camera);
}

// =============================================
// RESIZE
// =============================================
window.addEventListener('resize', () => {
    if (!renderer) return;
    const c = document.getElementById('three-container');
    camera.aspect = c.clientWidth / c.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(c.clientWidth, c.clientHeight);
});
