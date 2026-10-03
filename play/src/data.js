// =============================================
// DATA — constant facts the game reads from, never writes to.
// Classmates, cities, recipes, shopping lists, quiz content banks,
// name lists, and the school schedule tables all live here.
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


const RECIPES = [
    { name: 'Veggie Soup',    steps: ['🥕','🧅','🥦'], reward: { happiness: 5  } },
    { name: 'Chicken Stew',   steps: ['🍗','🧄','🥕'], reward: { happiness: 8  } },
    { name: 'Garlic Toast',   steps: ['🍞','🧄','🧈'], reward: { happiness: 4  } },
    { name: 'Tomato Pasta',   steps: ['🍅','🧅','🧄'], reward: { happiness: 6  } },
];

const ALL_INGS = ['🥕','🧅','🥦','🍗','🧄','🍞','🧈','🍅','🫑','🧀'];

const SHOPPING_LISTS = [
    { name: 'Snack Run',      steps: ['🍎','🥛','🍞'], reward: { happiness: 5  } },
    { name: 'Toy Store Trip', steps: ['🧸','🎈','🚗'], reward: { happiness: 8  } },
    { name: 'Fruit Stand',    steps: ['🍌','🍇','🍓'], reward: { happiness: 6  } },
    { name: 'Baby Aisle',     steps: ['🧷','🧴','🧦'], reward: { happiness: 4  } },
];

const ALL_SHOP_ITEMS = ['🍎','🥛','🍞','🧸','🎈','🚗','🍌','🍇','🍓','🧷','🧴','🧦','📚','🎨'];

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


const HOMESCHOOL_SUBJECTS = ['Math', 'Reading', 'Science', 'Art', 'PE'];

const QUESTIONS_PER_CLASS = 3;

const SUBJECT_BY_PERIOD = { 0: 'Math', 2: 'Reading', 3: 'Science', 5: 'Art', 6: 'PE' };

const SUBJECT_EMOJI = { Math: '📐', Reading: '📖', Science: '🔬', Art: '🎨', PE: '🏃' };

const PERIOD_LABELS = ['📐 Math','🍎 Snack','📖 Reading','🔬 Science','🍽️ Lunch','🎨 Art','🏃 PE','🌳 Recess','🏠 Done!'];

const RECESS_MS = 25000; // recess lasts 25 real seconds (or until you press Go Home)

// ---- Seasons: every 100-day year ends with winter ----
const WINTER_START_DAY = 85;   // days 85-99 are winter (Christmas tree goes up)
const CHRISTMAS_DAY = 99;      // Santa visits on the last day of the year
const SNOW_YEAR_CHANCE = 0.4;  // some years it snows all winter — and snow means NO SCHOOL
const MAX_PENDING_GIFTS = 10;  // unopened presents never pile up past this

// ---- Toys: what's inside the presents ----
// minAge: youngest age that can get it | play: happiness for playing with it
// santa: true = a special toy only Santa brings | shape/color: how it looks in the room
const TOY_DATA = [
    // baby toys
    { id:'rattle',  name:'Jingle Rattle',   emoji:'🔔', minAge:1, play:3, shape:'ball', color:0xF1C40F },
    { id:'blocks',  name:'Stacking Blocks', emoji:'🧱', minAge:1, play:3, shape:'box',  color:0xE74C3C },
    { id:'duck',    name:'Squeaky Duck',    emoji:'🦆', minAge:1, play:3, shape:'ball', color:0xFFD93D },
    { id:'teddy',   name:'Teddy Bear',      emoji:'🧸', minAge:1, play:4, shape:'tall', color:0x8B5A2B },
    // toddler toys
    { id:'car',     name:'Toy Car',         emoji:'🚗', minAge:3, play:4, shape:'box',  color:0xC0392B },
    { id:'train',   name:'Toy Train',       emoji:'🚂', minAge:3, play:5, shape:'box',  color:0x2E86C1 },
    { id:'ball',    name:'Soccer Ball',     emoji:'⚽', minAge:3, play:4, shape:'ball', color:0xFFFFFF },
    { id:'paints',  name:'Paint Set',       emoji:'🎨', minAge:3, play:5, shape:'box',  color:0x8E44AD },
    { id:'puzzle',  name:'Jigsaw Puzzle',   emoji:'🧩', minAge:3, play:5, shape:'box',  color:0x27AE60 },
    { id:'puppy',   name:'Plush Puppy',     emoji:'🐶', minAge:3, play:4, shape:'ball', color:0xD2B48C },
    // kid toys
    { id:'robot',   name:'Robot',           emoji:'🤖', minAge:5, play:6, shape:'tall', color:0xBDC3C7 },
    { id:'kite',    name:'Kite',            emoji:'🪁', minAge:5, play:5, shape:'tall', color:0xE67E22 },
    { id:'yoyo',    name:'Yo-Yo',           emoji:'🪀', minAge:5, play:4, shape:'ball', color:0xE74C3C },
    { id:'dino',    name:'Dinosaur',        emoji:'🦖', minAge:5, play:6, shape:'tall', color:0x2ECC71 },
    { id:'skate',   name:'Mini Skateboard', emoji:'🛹', minAge:5, play:6, shape:'box',  color:0x3498DB },
    { id:'hoops',   name:'Basketball',      emoji:'🏀', minAge:5, play:5, shape:'ball', color:0xE67E22 },
    { id:'scope',   name:'Telescope',       emoji:'🔭', minAge:5, play:6, shape:'tall', color:0x7F8C8D },
    { id:'game',    name:'Board Game',      emoji:'🎲', minAge:5, play:5, shape:'box',  color:0xECF0F1 },
    // special Santa-only toys
    { id:'sled',    name:'Sled',            emoji:'🛷', minAge:3, play:10, shape:'box',  color:0xCB4335, santa:true },
    { id:'console', name:'Game Console',    emoji:'🎮', minAge:5, play:12, shape:'box',  color:0x2C3E50, santa:true },
    { id:'heli',    name:'RC Helicopter',   emoji:'🚁', minAge:5, play:10, shape:'tall', color:0x2980B9, santa:true },
    { id:'unicorn', name:'Unicorn Plush',   emoji:'🦄', minAge:3, play:10, shape:'tall', color:0xF5B7F0, santa:true },
    { id:'rocket',  name:'Rocket Ship',     emoji:'🚀', minAge:5, play:10, shape:'tall', color:0xF8F9F9, santa:true },
    { id:'globe',   name:'Snow Globe',      emoji:'🔮', minAge:3, play:8,  shape:'ball', color:0xAED6F1, santa:true },
];


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


const PE_CHALLENGES = [
    { name: 'Jumping Jacks', emoji: '🤸', target: 10 },
    { name: 'Push-Ups',      emoji: '💪', target: 12 },
    { name: 'Sit-Ups',       emoji: '🏋️', target: 12 },
    { name: 'Squats',        emoji: '🦵', target: 10 },
    { name: 'High Knees',    emoji: '🏃', target: 14 },
];

