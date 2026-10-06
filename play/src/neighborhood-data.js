// =============================================
// NEIGHBORHOOD DATA — the street you live on, and who lives there.
//
// When you're old enough (OUTSIDE_AGE), you can go outside and play on your
// block: 8 houses, each with a real family (parents and kids). Some of your
// SCHOOL FRIENDS live on the block too — which ones depends on your city.
//
// Everything is worked out from the city's name, so a city's block is always
// the same: same houses, same families, same school friends living there.
// Nothing here is saved (only how well you know each person: player.friendship).
//
// Used by neighborhood.js. Never changes while the game is running.
// =============================================

const OUTSIDE_AGE = 7;   // "Mom and Dad say you're old enough to play outside now!"

const NEIGHBOR_SURNAMES = ['Patel', 'Johnson', 'Garcia', 'Nguyen', 'Okafor', 'Kowalski', 'Tanaka', 'Rossi', 'Mueller', 'Santos',
                           'Haddad', 'Larsen', 'Murphy', 'Silva', 'Cohen', 'Brooks', 'Ivanov', 'Kim', 'Dubois', 'Reyes'];
const NEIGHBOR_MOMS = ['Maria', 'Aisha', 'Linda', 'Sofia', 'Hannah', 'Grace', 'Emily', 'Priya', 'Olivia', 'Nadia', 'Carla', 'Jenny'];
const NEIGHBOR_DADS = ['David', 'Omar', 'Carlos', 'Kevin', 'Michael', 'Ben', 'Raj', 'Tom', 'Luis', 'Daniel', 'Peter', 'Hassan'];
const NEIGHBOR_BOYS = ['Leo', 'Max', 'Owen', 'Eli', 'Kai', 'Ravi', 'Oscar', 'Finn', 'Milo', 'Arlo'];
const NEIGHBOR_GIRLS = ['Lily', 'Ava', 'Nina', 'Ruby', 'Hana', 'Ivy', 'Cleo', 'Rosa', 'Tess', 'Willa'];

// The classmates in CITY_DATA (data.js) are all kids — boy or girl, for their clothes.
const CLASSMATE_GENDER = { Jake: 'boy', Mia: 'girl', Sam: 'boy', Ella: 'girl', Noah: 'boy', Priya: 'girl', Theo: 'boy', Zara: 'girl', Deshawn: 'boy' };

const HOUSE_WALLS = [0xF5CBA7, 0xAED6F1, 0xD7BDE2, 0xF9E79F, 0xABEBC6, 0xFADBD8, 0xD5DBDB, 0xFAD7A0];
const HOUSE_ROOFS = [0xB03A2E, 0x5D6D7E, 0x7B4B2A, 0x2E4053, 0x884EA0, 0x1F618D];
const SHIRT_COLORS = [0x3498DB, 0xE74C3C, 0x27AE60, 0xF39C12, 0x8E44AD, 0x16A085, 0xE91E8C, 0xD35400];
const HAIR_COLORS = [0x4B2800, 0x222222, 0xCC8844, 0xFFD700, 0x8B0000, 0x888888];

// Where the houses go: 4 on the north side of the street, 4 on the south. Yours is the 2nd on the south side.
const HOUSE_SLOT_X = [-16.5, -5.5, 5.5, 16.5];
const YOUR_HOUSE_INDEX = 5;     // index 0-3 = north side, 4-7 = south side

const blockCache = {};

function pickFrom(list, rng) {
    return list[Math.floor(rng() * list.length)];
}

// Builds (once per city) the street: { houses: [...], classmatesHere: [names] }.
// Each house: { index, side: 'N'|'S', x, z, wall, roof, garage, tree, yours, surname, people: [...] }
// Each person: { name, role: 'kid'|'parent', title, gender, classmate, shirt, hair }
function getNeighborhoodBlock(city) {
    if (blockCache[city]) return blockCache[city];
    const rng = seededRandom(seedFromText('block|' + city));
    const cityData = CITY_DATA.find(c => c.city === city) || CITY_DATA[0];
    const classmateNames = cityData.classmates.map(c => c.name);

    // Which school friends live on this street (about 3 in 4 do; at least one always does)
    let living = classmateNames.filter(n => seededRandom(seedFromText('lives|' + city + '|' + n))() < 0.75);
    if (!living.length) living = [classmateNames[0]];

    const surnames = shuffledCopy(NEIGHBOR_SURNAMES, rng);
    const used = new Set(classmateNames);
    const takeName = (pool) => {
        const free = pool.filter(n => !used.has(n));
        const n = free.length ? free[Math.floor(rng() * free.length)] : pool[Math.floor(rng() * pool.length)];
        used.add(n);
        return n;
    };

    const slots = [];
    for (let i = 0; i < 8; i++) if (i !== YOUR_HOUSE_INDEX) slots.push(i);
    const familyOrder = shuffledCopy(slots, rng);       // which house gets which family

    const houses = [];
    for (let i = 0; i < 8; i++) {
        const side = i < 4 ? 'N' : 'S';
        houses.push({
            index: i, side, x: HOUSE_SLOT_X[i % 4], z: side === 'N' ? -12.4 : 12.4,
            wall: pickFrom(HOUSE_WALLS, rng), roof: pickFrom(HOUSE_ROOFS, rng),
            garage: rng() < 0.55, tree: rng() < 0.75, yours: i === YOUR_HOUSE_INDEX,
            surname: i === YOUR_HOUSE_INDEX ? '' : surnames[i], people: []
        });
    }
    // Your own house: Mom and Dad are inside, so nobody to talk to out front.
    houses[YOUR_HOUSE_INDEX].surname = 'Your';

    function person(name, role, title, gender, classmate) {
        return {
            name, role, title, gender, classmate,
            shirt: pickFrom(SHIRT_COLORS, rng),
            hair: pickFrom(HAIR_COLORS, rng)
        };
    }

    familyOrder.forEach((houseIndex, k) => {
        const h = houses[houseIndex];
        const sur = h.surname;
        // Parents: usually two, sometimes one
        const single = rng() < 0.15;
        if (!single || rng() < 0.5) h.people.push(person('Mrs. ' + sur, 'parent', 'Mrs. ' + sur, 'girl', false));
        if (!single || h.people.length === 0) h.people.push(person('Mr. ' + sur, 'parent', 'Mr. ' + sur, 'boy', false));
        if (k < living.length) {
            // A school friend lives here (and maybe a brother or sister)
            const n = living[k];
            h.people.push(person(n, 'kid', n, CLASSMATE_GENDER[n] || 'boy', true));
            if (rng() < 0.3) {
                const g = rng() < 0.5 ? 'boy' : 'girl';
                h.people.push(person(takeName(g === 'boy' ? NEIGHBOR_BOYS : NEIGHBOR_GIRLS), 'kid', '', g, false));
            }
        } else {
            const r = rng();
            const kids = r < 0.2 ? 0 : r < 0.7 ? 1 : 2;
            for (let c = 0; c < kids; c++) {
                const g = rng() < 0.5 ? 'boy' : 'girl';
                h.people.push(person(takeName(g === 'boy' ? NEIGHBOR_BOYS : NEIGHBOR_GIRLS), 'kid', '', g, false));
            }
        }
    });

    // This city's street STYLE and each house's KIND (street-styles.js) — own seed, so families/people above never change
    const style = typeof streetStyleFor === 'function' ? streetStyleFor(city) : null;
    if (style) {
        const krng = seededRandom(seedFromText('kinds|' + city));
        houses.forEach(h => assignHouseLook(style, h, krng));
    }
    return (blockCache[city] = { houses, classmatesHere: living, style: style ? style.id : 'suburb' });
}

// ---------------------------------------------
// Chat personalities for people who aren't school classmates (Jake, Mia... already have theirs).
// Same shape as FRIEND_RESPONSES in data.js, so chat.js can talk to them with no changes.
// ---------------------------------------------
function registerNeighborPersona(p) {
    if (FRIEND_RESPONSES[p.name]) return;
    const kid = p.role === 'kid';
    FRIEND_RESPONSES[p.name] = {
        adult: !kid,
        keys: kid ? [
            { words: ['who are you', 'who is this', 'your name', 'what is your name'],
              says: [`I'm ${p.name}! I live on your street. 😄`, `It's me, ${p.name}! We're neighbors! 🏡`] },
            { words: ['how old are you', 'your age'],
              says: ["I'm about your age! 😄", "Old enough to play outside without my mom! 😂"] },
            { words: ['shut up', 'shutup', 'stupid', 'dumb', 'idiot', 'ugly'],
              says: ["Hey, that's not nice! 😢", "Ouch... that hurt my feelings. 😔", "Please don't say that! We're neighbors! 💙"] },
            { words: ['hi', 'hello', 'hey', 'hiya', 'hii', 'sup', 'yo'],
              says: ["Hey! 😄 Wanna play?", "Hi! Great day to be outside! ☀️", "Heyyy! 👋"] },
            { words: ['bye', 'goodbye', 'cya', 'see you', 'later'],
              says: ["Bye! Come play again! 👋", "See ya! 😄", "Later! Don't forget to come back! 🌳"] },
            { words: ['good', 'great', 'fine', 'awesome', 'amazing', 'well'],
              says: ["Awesome! 😄", "Nice! Same! 🎉", "Yay! 😊"] },
            { words: ['dog', 'cat', 'pet', 'puppy', 'kitten', 'animal'],
              says: ["I wish I had a pet! 🐶", "Our neighbor's dog is so cute! 🐕", "Pets are the best! 🐾"] },
            { words: ['bike', 'bicycle', 'scooter', 'skate', 'ride'],
              says: ["Wanna race bikes down the street? 🚲", "I'm still learning to ride without training wheels! 😅", "Riding bikes is the best part of summer! ☀️"] },
            { words: ['play', 'game', 'tag', 'hide', 'ball', 'catch'],
              says: ["Yes! Let's play! 🎉", "Tag, you're it! 😆 ...just kidding. Click me to play for real!", "Playing outside is so much fun! 🌳"] },
            { words: ['food', 'snack', 'hungry', 'eat', 'cookie', 'pizza', 'ice cream'],
              says: ["My mom makes the best cookies! 🍪", "I'm starving! Wanna get ice cream? 🍦", "Pizza night is my favorite night! 🍕"] },
            { words: ['school', 'homework', 'teacher', 'class'],
              says: ["Homework is the worst! 😅", "I like recess the most! 🏃", "School's okay, but summer is better! ☀️"] },
            { words: ['mom', 'dad', 'parents', 'family', 'sister', 'brother'],
              says: ["My family is pretty cool! 💛", "My mom says be home before dinner! 🍽️", "Do you have brothers or sisters? 😊"] }
        ] : [
            { words: ['who are you', 'who is this', 'your name', 'what is your name'],
              says: [`I'm ${p.name}, I live right here on your street. It's so nice to see you! 😊`, `${p.name}! We're neighbors, dear. 🏡`] },
            { words: ['how old are you', 'your age'],
              says: ["Oh, old enough to know better! 😄", "A grown-up never tells! 😉"] },
            { words: ['shut up', 'shutup', 'stupid', 'dumb', 'idiot', 'ugly'],
              says: ["That's not very kind, sweetheart. Let's use nice words. 🙂", "Now now, we don't talk like that. 😟", "Oh my! Please be polite. 🙏"] },
            { words: ['hi', 'hello', 'hey', 'hiya', 'hii', 'sup', 'yo'],
              says: ["Well hello there, dear! 😊", "Hi! Lovely to see you out and about! 👋", "Hello! How are you today? 🌞"] },
            { words: ['bye', 'goodbye', 'cya', 'see you', 'later'],
              says: ["Goodbye, dear! Come visit again! 👋", "Take care now! 😊", "See you soon! 🌳"] },
            { words: ['good', 'great', 'fine', 'awesome', 'amazing', 'well'],
              says: ["Wonderful to hear! 😊", "That's lovely! 🌟", "Glad to hear it, dear! 😄"] },
            { words: ['garden', 'flower', 'flowers', 'plant', 'tree', 'grass', 'lawn'],
              says: ["I've been working on my garden all week! 🌷", "Roses are tricky but I love them! 🌹", "Would you like to help me water the flowers one day? 🌻"] },
            { words: ['weather', 'sunny', 'rain', 'raining', 'snow', 'cold', 'hot', 'warm'],
              says: ["Lovely day to be outside, isn't it? ☀️", "I hope it doesn't rain on laundry day! 🌧️", "Isn't the weather something these days? 🌤️"] },
            { words: ['work', 'job', 'office', 'busy'],
              says: ["Work keeps me busy, but I love our street! 💼", "Some days are long, but days like this are nice. 😊"] },
            { words: ['school', 'homework', 'teacher', 'class', 'study'],
              says: ["Study hard — school is important! 📚", "I loved school when I was your age! 🎒", "Do you have a good teacher this year? 😊"] },
            { words: ['cookie', 'cookies', 'bake', 'baking', 'cake', 'snack', 'hungry'],
              says: ["I just baked some cookies! Ask me for a snack! 🍪", "Baking is my favorite hobby! 🧁", "Come by anytime — there's always something sweet! 🍰"] },
            { words: ['kid', 'kids', 'son', 'daughter', 'child', 'children'],
              says: ["Our kids love playing out here! 💛", "They grow up so fast! 🌱", "It's wonderful that the kids on this street all get along! 😊"] },
            { words: ['neighbor', 'neighbors', 'street', 'block', 'house', 'home'],
              says: ["Best street in town! 🏡", "Everybody looks out for each other here. 💛", "It's such a friendly neighborhood! 😊"] }
        ],
        defaults: kid
            ? ["Haha what?! 😂", "Umm ok! 😄", "Cool! 😎", "That's a new one! 😮", "I have no clue lol 😂"]
            : ["Oh, how lovely! 😊", "Is that so? 🙂", "Well, isn't that something! 😄", "I see, I see! 😊", "Hmm, tell me more! 🤔"]
    };
}
