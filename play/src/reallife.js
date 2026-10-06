// =============================================
// REAL LIFE — everyday things to do, a phone, electronics, a pet, sickness, dating/marriage/kids, bugs & science.
//
//   🌟 Life button  : ~100 things to do in real life in 11 categories (chores, health, social, hobbies, outdoors, travel, money, food, nature, science, family).
//                     Each costs some money, has a cooldown (in life-days), a minimum age, and changes happiness / health / education / fullness.
//   📱 Phone button : battery, 📞 calls, 💬 texts (with scam texts!), 📷 camera, 🐞 Bug Guide, 🔬 Science News, 🛒 online shop, 🔒 online safety.
//   🔌 Electronics  : shop for phone, laptop, TV, console, headphones, camera, smart speaker (new = 30-day warranty). They break sometimes: repair or replace.
//                     Internet plan ($15 every 10 days) is needed for streaming/online things. Too much screen time hurts happiness.
//   🐾 Pet          : adopt a dog/cat/hamster/fish/bird; feed it every few days; walk the dog.
//   🤒 Sickness     : you can catch a cold; rest, buy medicine or see the doctor.
//   💕 Relationships: dates -> dating -> engaged -> married -> children (they cost a little and cheer you up). No 3D partner/children are drawn.
//   🐞🔬 Bug collection (30 species with facts) and 24 "reports from scientists" (short, general facts).
//
// State: player.rl = { cd:{}, own:{}, bought:{}, battery, screen, net, sick, pet, bugs:[], photos, love, news, ... }  (saved with the player).
// Hooks: lifeButtons (adds the buttons), advanceOneDay (daily upkeep), startGame (resets state).
// Everything here is plain overlays (lifeOverlay/lifeBtn from life.js) — no 3D, so nothing here can break the scenes.
// =============================================

function rlDay() { return player.age * 100 + player.sleepCount; }
function rlS() {
    if (!player.rl) player.rl = {};
    const r = player.rl;
    if (!r.cd) r.cd = {};
    if (!r.own) r.own = {};
    if (!r.bought) r.bought = {};
    if (!r.bugs) r.bugs = [];
    if (r.battery === undefined) r.battery = 100;
    if (!r.screen) r.screen = 0;
    if (!r.photos) r.photos = 0;
    if (!r.love) r.love = { stage: 'single', score: 0, name: null };
    if (!r.kids) r.kids = 0;
    if (!r.news) r.news = 0;
    return r;
}
function rlClamp(v) { return Math.max(0, Math.min(100, v)); }
function rlApply(fx) {
    if (!fx) return;
    if (fx.happy) player.happiness = rlClamp(player.happiness + fx.happy);
    if (fx.health) player.health = rlClamp(player.health + fx.health);
    if (fx.edu) player.education = rlClamp(player.education + fx.edu);
    if (fx.full) player.fullness = rlClamp((player.fullness === undefined ? 80 : player.fullness) + fx.full);
    if (fx.money) player.money += fx.money;
    try { updateStats(); saveGame(); } catch (e) {}
}
function rlFxText(fx) {
    if (!fx) return '';
    const p = [];
    if (fx.happy) p.push((fx.happy > 0 ? '+' : '') + fx.happy + '😊');
    if (fx.health) p.push((fx.health > 0 ? '+' : '') + fx.health + '❤️');
    if (fx.edu) p.push((fx.edu > 0 ? '+' : '') + fx.edu + '📚');
    if (fx.full) p.push((fx.full > 0 ? '+' : '') + fx.full + '🍽️');
    return p.join(' ');
}
const rlPick = a => a[Math.floor(Math.random() * a.length)];
const rlHas = k => !!rlS().own[k] && !rlS().own[k].broken;

// ---------------------------------------------
// ELECTRONICS CATALOG
// ---------------------------------------------
const RL_DEVICES = [
    { id: 'phone', emoji: '📱', name: 'Smartphone', price: 250, age: 8, blurb: 'Calls, texts, camera, Bug Guide, Science News.' },
    { id: 'laptop', emoji: '💻', name: 'Laptop', price: 700, age: 8, blurb: 'Study, learn to code, browse, make apps.' },
    { id: 'tv', emoji: '📺', name: 'Television', price: 450, age: 8, blurb: 'Watch shows and the news (streaming needs the internet plan).' },
    { id: 'console', emoji: '🎮', name: 'Game console', price: 400, age: 6, blurb: 'Video games!' },
    { id: 'headphones', emoji: '🎧', name: 'Headphones', price: 80, age: 6, blurb: 'Music anywhere.' },
    { id: 'camera', emoji: '📷', name: 'Digital camera', price: 300, age: 8, blurb: 'Better photos.' },
    { id: 'speaker', emoji: '🔊', name: 'Smart speaker', price: 60, age: 8, blurb: 'Smart-home gadget: music, timers, jokes.' },
    { id: 'kit', emoji: '🔧', name: 'Electronics hobby kit', price: 70, age: 10, blurb: 'Build circuits, LEDs and little robots.' },
    { id: 'ecar', emoji: '🔋', name: 'Electric car', price: 9000, age: 18, blurb: 'Charge it at a station. Quiet and cheap to run.' }
];
function rlDevice(id) { return RL_DEVICES.find(d => d.id === id); }

// ---------------------------------------------
// ACTIVITIES  [id, emoji, name, minAge, cost, effects, cooldown (days), message, requires]
// ---------------------------------------------
const RL_CATS = [
    { id: 'chores', emoji: '🧹', name: 'Home & chores', acts: [
        ['shower', '🚿', 'Take a shower', 3, 0, { happy: 1, health: 1 }, 1, 'Fresh and clean!'],
        ['teeth', '🪥', 'Brush your teeth', 3, 0, { health: 1 }, 1, 'Sparkly smile.'],
        ['laundry', '🧺', 'Do the laundry', 8, 0, { happy: 1 }, 3, 'Clean clothes smell great.'],
        ['clean', '🧽', 'Clean the home', 8, 0, { happy: 3 }, 3, 'A tidy place, a tidy mind.'],
        ['dishes', '🍽️', 'Wash the dishes', 6, 0, { happy: 1 }, 1, 'All the plates are clean.'],
        ['trash', '🗑️', 'Take out the trash', 6, 0, { happy: 1 }, 3, 'Bins out, smell gone.'],
        ['water', '🪴', 'Water the plants', 4, 0, { happy: 2 }, 3, 'The plants look happier.'],
        ['bed', '🛏️', 'Make your bed', 4, 0, { happy: 1 }, 1, 'Looks nice.'],
        ['clothes', '👕', 'Buy new clothes', 6, 40, { happy: 6 }, 10, 'New outfit — looking good!'],
        ['haircut', '💇', 'Get a haircut', 5, 20, { happy: 5 }, 12, 'Fresh haircut!'],
        ['repairhome', '🔨', 'Fix something at home', 12, 15, { happy: 3, edu: 1 }, 6, 'You fixed it yourself. Nice!']
    ] },
    { id: 'health', emoji: '❤️', name: 'Health & body', acts: [
        ['jog', '🏃', 'Go for a jog', 6, 0, { health: 4, happy: 2, full: -8 }, 2, 'Fresh air and a good run.'],
        ['gym', '🏋️', 'Go to the gym', 14, 12, { health: 6, happy: 2, full: -10 }, 3, 'Stronger every day.'],
        ['yoga', '🧘', 'Do yoga', 8, 0, { health: 3, happy: 4 }, 2, 'Calm and stretchy.'],
        ['meditate', '🕯️', 'Meditate', 8, 0, { happy: 5 }, 2, 'Quiet mind.'],
        ['swim', '🏊', 'Go swimming', 5, 6, { health: 5, happy: 4, full: -8 }, 3, 'Splash!'],
        ['bike', '🚴', 'Ride a bike', 5, 0, { health: 4, happy: 3, full: -6 }, 2, 'Wind in your hair.'],
        ['stretch', '🤸', 'Stretch and warm up', 4, 0, { health: 1 }, 1, 'Loose and ready.'],
        ['checkup', '🩺', 'Doctor check-up', 1, 30, { health: 8 }, 20, 'The doctor says you are doing well.'],
        ['dentist', '🦷', 'Visit the dentist', 3, 40, { health: 5 }, 25, 'No cavities (this time!).'],
        ['vaccine', '💉', 'Get a vaccine', 1, 15, { health: 6 }, 40, 'Ouch, but protected!'],
        ['nap', '😴', 'Take a nap', 3, 0, { health: 2, happy: 2 }, 2, 'Zzz... much better.'],
        ['spa', '💆', 'Spa day', 16, 70, { happy: 12, health: 4 }, 14, 'So relaxing.']
    ] },
    { id: 'social', emoji: '🎉', name: 'Friends & fun', acts: [
        ['callfriend', '📞', 'Call a friend', 5, 0, { happy: 4 }, 1, 'You chatted for ages.'],
        ['playdate', '🧸', 'Have a playdate', 3, 0, { happy: 6 }, 2, 'You played all afternoon.'],
        ['party', '🎈', 'Throw a party', 8, 80, { happy: 15 }, 15, 'What a party! Everyone had fun.'],
        ['movie', '🎬', 'Go to the cinema', 5, 14, { happy: 8, full: 4 }, 4, 'Popcorn and a great film.'],
        ['concert', '🎤', 'Go to a concert', 12, 60, { happy: 14 }, 12, 'Unforgettable show!'],
        ['arcade', '🕹️', 'Visit the arcade', 5, 10, { happy: 7 }, 3, 'You got a high score.'],
        ['bowling', '🎳', 'Go bowling', 6, 12, { happy: 7, health: 1 }, 5, 'Strike!'],
        ['karaoke', '🎙️', 'Karaoke night', 12, 18, { happy: 9 }, 5, 'You sang your heart out.'],
        ['volunteer', '🤝', 'Volunteer', 10, 0, { happy: 7, edu: 1 }, 5, 'You helped your community.'],
        ['worship', '🙏', 'Visit a place of worship / reflection', 3, 0, { happy: 5 }, 7, 'A calm, thoughtful visit.'],
        ['letter', '✉️', 'Write a letter to a friend', 6, 1, { happy: 3 }, 4, 'You mailed it with a stamp.'],
        ['festival', '🎪', 'Go to a festival', 4, 30, { happy: 12 }, 14, 'Music, food and lights!'],
        ['sleepover', '🛌', 'Have a sleepover', 5, 0, { happy: 9 }, 5, 'Stories and snacks until late.']
    ] },
    { id: 'hobby', emoji: '🎨', name: 'Hobbies & creativity', acts: [
        ['paint', '🎨', 'Paint a picture', 4, 8, { happy: 6, edu: 1 }, 2, 'A colourful masterpiece!'],
        ['guitar', '🎸', 'Play the guitar', 7, 0, { happy: 6, edu: 1 }, 2, 'You practised a new song.'],
        ['piano', '🎹', 'Practise piano', 5, 0, { happy: 5, edu: 1 }, 2, 'Scales and a little tune.'],
        ['book', '📖', 'Read a book', 5, 0, { happy: 4, edu: 2 }, 2, 'You got lost in a story.'],
        ['write', '✍️', 'Write a story', 7, 0, { happy: 4, edu: 2 }, 3, 'A new chapter!'],
        ['garden', '🌻', 'Do some gardening', 5, 5, { happy: 5, health: 2 }, 3, 'Your flowers are growing.'],
        ['bake', '🧁', 'Bake cupcakes', 6, 6, { happy: 6, full: 8 }, 3, 'They smell delicious.'],
        ['chess', '♟️', 'Play chess', 6, 0, { happy: 3, edu: 2 }, 2, 'Checkmate in 12 moves.'],
        ['puzzle', '🧩', 'Do a jigsaw puzzle', 4, 0, { happy: 4, edu: 1 }, 2, 'The last piece clicks in.'],
        ['knit', '🧶', 'Knit a scarf', 8, 5, { happy: 5 }, 4, 'Cosy.'],
        ['dance', '💃', 'Dance', 4, 0, { happy: 7, health: 2, full: -5 }, 2, 'You danced like nobody was watching.'],
        ['lego', '🧱', 'Build with bricks', 3, 0, { happy: 5, edu: 1 }, 2, 'You built a tiny city.'],
        ['photo', '📸', 'Photography walk', 8, 0, { happy: 5 }, 3, 'You found great light.', 'camera'],
        ['woodwork', '🪚', 'Woodworking', 12, 15, { happy: 5, edu: 1 }, 6, 'You made a little shelf.'],
        ['collect', '🪙', 'Sort your collection', 6, 0, { happy: 3 }, 4, 'Stamps, cards and coins in order.']
    ] },
    { id: 'outdoor', emoji: '🌳', name: 'Outdoors & sport', acts: [
        ['park', '🌳', 'Walk in the park', 3, 0, { happy: 4, health: 2 }, 1, 'Birds and sunshine.'],
        ['picnic', '🧺', 'Have a picnic', 4, 8, { happy: 8, full: 12 }, 4, 'Sandwiches on the grass.'],
        ['hike', '🥾', 'Go hiking', 8, 5, { happy: 8, health: 5, full: -10 }, 5, 'A great view from the top.'],
        ['fish', '🎣', 'Go fishing', 6, 5, { happy: 6 }, 4, 'A peaceful afternoon (you caught one!).'],
        ['camp', '⛺', 'Go camping', 8, 30, { happy: 12, health: 3 }, 12, 'Campfire, stars and marshmallows.'],
        ['football', '⚽', 'Play football', 4, 0, { happy: 6, health: 4, full: -8 }, 2, 'Goal!'],
        ['basket', '🏀', 'Play basketball', 6, 0, { happy: 6, health: 4, full: -8 }, 2, 'Swish!'],
        ['tennis', '🎾', 'Play tennis', 8, 8, { happy: 6, health: 4, full: -8 }, 3, 'Great rally.'],
        ['skate', '🛹', 'Go skateboarding', 7, 0, { happy: 7, health: 2 }, 3, 'You landed a trick.'],
        ['ski', '⛷️', 'Go skiing', 8, 90, { happy: 14, health: 3 }, 20, 'Fresh snow, big smiles.'],
        ['playground', '🛝', 'Play at the playground', 2, 0, { happy: 6 }, 1, 'Slide, swing, repeat.'],
        ['kite', '🪁', 'Fly a kite', 3, 3, { happy: 6 }, 3, 'It soared!']
    ] },
    { id: 'travel', emoji: '✈️', name: 'Travel & days out', acts: [
        ['bus', '🚌', 'Ride the public bus', 6, 3, { happy: 3 }, 1, 'You watched the city go by.'],
        ['train', '🚆', 'Take the train to a nearby town', 8, 25, { happy: 8 }, 6, 'A fun day trip.'],
        ['plane', '✈️', 'Holiday abroad (flight)', 12, 400, { happy: 25, health: 4 }, 40, 'A wonderful holiday in another country!'],
        ['beach', '🏖️', 'Go to the beach', 4, 12, { happy: 10, health: 2 }, 6, 'Sand castles and waves.'],
        ['zoo', '🦁', 'Visit the zoo', 3, 18, { happy: 9, edu: 1 }, 8, 'You saw so many animals.'],
        ['museum', '🏛️', 'Visit a museum', 6, 12, { happy: 5, edu: 3 }, 7, 'You learned a lot.'],
        ['themepark', '🎢', 'Go to a theme park', 6, 60, { happy: 16 }, 14, 'Rollercoasters!'],
        ['roadtrip', '🚗', 'Take a road trip', 18, 50, { happy: 12 }, 12, 'Snacks, songs and open road.'],
        ['cruise', '🚢', 'Go on a cruise', 20, 600, { happy: 28, health: 3 }, 60, 'Sea, sun and buffets.'],
        ['aquarium', '🐠', 'Visit the aquarium', 3, 16, { happy: 8, edu: 1 }, 8, 'Jellyfish are so calm.'],
        ['library', '📚', 'Visit the library', 5, 0, { happy: 3, edu: 3 }, 2, 'You borrowed three books.'],
        ['market', '🛍️', 'Visit a street market', 5, 10, { happy: 6 }, 5, 'You found a bargain.']
    ] },
    { id: 'money', emoji: '💰', name: 'Money & grown-up stuff', acts: [
        ['save', '🏦', 'Put $50 in your savings (pays 4%)', 8, 50, null, 1, 'Saved!'],
        ['invest', '📈', 'Invest $100 (could go up or down)', 18, 100, null, 6, ''],
        ['donate', '❤️', 'Donate $20 to charity', 8, 20, { happy: 6 }, 3, 'Your gift will help someone.'],
        ['sellold', '🏷️', 'Sell old stuff online', 12, 0, null, 8, '', 'net'],
        ['budget', '🧮', 'Make a budget', 12, 0, { edu: 2 }, 5, 'You know where your money goes now.'],
        ['taxes', '🧾', 'Do your taxes', 18, 0, null, 30, ''],
        ['insure', '🛡️', 'Buy insurance', 18, 25, { happy: 3 }, 30, 'Peace of mind.'],
        ['lottery', '🎟️', 'Buy a lottery ticket ($5)', 18, 5, null, 3, '']
    ] },
    { id: 'food', emoji: '🍔', name: 'Food & drink', acts: [
        ['icecream', '🍦', 'Get an ice cream', 2, 4, { happy: 5, full: 6 }, 1, 'Delicious.'],
        ['bubbletea', '🧋', 'Drink bubble tea', 5, 5, { happy: 5, full: 4 }, 1, 'Yum!'],
        ['coffee', '☕', 'Coffee with a friend', 14, 6, { happy: 5 }, 2, 'A nice chat.'],
        ['takeaway', '🥡', 'Order takeaway', 8, 14, { happy: 5, full: 30 }, 2, 'Hot food at your door.', 'net'],
        ['bbq', '🍖', 'Have a barbecue', 6, 25, { happy: 9, full: 35 }, 8, 'Smoky and delicious.'],
        ['cookclass', '🧑‍🍳', 'Take a cooking class', 10, 35, { happy: 6, edu: 2 }, 12, 'You learned a new recipe.'],
        ['fruit', '🍎', 'Eat a healthy snack', 2, 2, { health: 2, full: 8 }, 1, 'Healthy and tasty.'],
        ['water', '💧', 'Drink water', 1, 0, { health: 1 }, 1, 'Hydrated!']
    ] },
    { id: 'nature', emoji: '🐞', name: 'Bugs & nature', acts: [
        ['bughunt', '🐞', 'Go on a bug hunt', 3, 0, null, 1, ''],
        ['birdwatch', '🐦', 'Watch birds', 4, 0, { happy: 4, edu: 1 }, 2, 'You spotted a bird with a red chest.'],
        ['stargaze', '🌌', 'Stargaze', 4, 0, { happy: 6, edu: 1 }, 2, 'So many stars — and a shooting star!'],
        ['pond', '🐸', 'Pond dipping', 4, 0, { happy: 5, edu: 1 }, 3, 'Tadpoles and tiny water beetles.'],
        ['botanic', '🌺', 'Visit a botanical garden', 5, 10, { happy: 6, edu: 2 }, 7, 'Plants from all over the world.'],
        ['compost', '♻️', 'Start a compost heap', 8, 0, { happy: 2, edu: 1 }, 10, 'Worms will do the rest.'],
        ['recycle', '♻️', 'Recycle old electronics (e-waste)', 8, 0, { happy: 3, edu: 1 }, 10, 'Old gadgets go to the proper recycling point.'],
        ['plant', '🌱', 'Plant a tree', 5, 4, { happy: 6, edu: 1 }, 14, 'It will grow for years.']
    ] },
    { id: 'science', emoji: '🔬', name: 'Science', acts: [
        ['observatory', '🔭', 'Visit an observatory', 6, 15, { happy: 6, edu: 3 }, 10, 'You saw Saturn\'s rings through a telescope!'],
        ['sciencemuseum', '🧪', 'Science museum', 5, 14, { happy: 6, edu: 3 }, 8, 'You pressed every button.'],
        ['experiment', '⚗️', 'Home science experiment', 6, 5, { happy: 5, edu: 2 }, 4, 'Baking-soda volcano!'],
        ['citizensci', '📋', 'Citizen science: count insects or birds', 8, 0, { happy: 3, edu: 2 }, 6, 'Scientists will use your counts.'],
        ['lecturetalk', '🎓', 'Go to a public science talk', 12, 8, { happy: 4, edu: 4 }, 10, 'A scientist explained her latest results.'],
        ['news', '📰', 'Read a science news report', 8, 0, null, 1, '']
    ] },
    { id: 'tech', emoji: '🔌', name: 'Electronics & screens', acts: [
        ['watchtv', '📺', 'Watch TV', 3, 0, { happy: 5 }, 1, 'A good show.', 'tv'],
        ['stream', '🍿', 'Stream a movie', 5, 0, { happy: 7 }, 1, 'Movie night!', 'tv+net'],
        ['videogame', '🎮', 'Play video games', 5, 0, { happy: 8, edu: 0 }, 1, 'You beat a tough level!', 'console'],
        ['music', '🎧', 'Listen to music', 4, 0, { happy: 5 }, 1, 'The perfect playlist.', 'headphones'],
        ['browse', '🌐', 'Browse the internet', 8, 0, { happy: 3, edu: 1 }, 1, 'You read about something new.', 'laptop+net'],
        ['code', '👨‍💻', 'Learn to code / make an app', 8, 0, { happy: 3, edu: 3 }, 2, 'Your little app works!', 'laptop'],
        ['homework', '📝', 'Study on the laptop', 8, 0, { edu: 3 }, 1, 'You got ahead on your studies.', 'laptop'],
        ['circuit', '💡', 'Build a circuit with your kit', 10, 0, { happy: 5, edu: 3 }, 3, 'The LED lights up!', 'kit'],
        ['robot', '🤖', 'Build a little robot', 12, 10, { happy: 7, edu: 4 }, 8, 'It rolls across the floor!', 'kit'],
        ['smart', '🏠', 'Use your smart speaker', 6, 0, { happy: 3 }, 1, '"Playing your favourite song."', 'speaker'],
        ['videocall', '📹', 'Video call family', 6, 0, { happy: 6 }, 1, 'You waved at everyone.', 'phone+net'],
        ['charge', '🔌', 'Charge your devices', 3, 0, null, 0, '']
    ] }
];
// (chores and food both have a 'water' id, so activities are always looked up by category + id)
function rlFind(catId, id) { const c = RL_CATS.find(x => x.id === catId); return c ? c.acts.find(a => a[0] === id) : null; }

function rlNeedsText(req) {
    if (!req) return '';
    return req.split('+').map(r => r === 'net' ? 'internet plan' : (rlDevice(r) ? rlDevice(r).name.toLowerCase() : r)).join(' + ');
}
function rlMeetsReq(req) {
    if (!req) return true;
    return req.split('+').every(r => r === 'net' ? rlNetOn() : rlHas(r));
}
function rlNetOn() { return !!rlS().net; }

// ---------------------------------------------
// bugs & science reports
// ---------------------------------------------
const RL_BUGS = [
    ['Ladybug', '🐞', 'Ladybugs eat lots of aphids, so gardeners love them.'],
    ['Honeybee', '🐝', 'Honeybees do a "waggle dance" to tell others where flowers are.'],
    ['Monarch butterfly', '🦋', 'Monarchs migrate thousands of kilometres each year.'],
    ['Firefly', '✨', 'Fireflies make light with a chemical reaction in their bodies.'],
    ['Dragonfly', '🪰', 'Dragonflies have been around since before the dinosaurs.'],
    ['Ant', '🐜', 'Ants can carry many times their own body weight.'],
    ['Grasshopper', '🦗', 'Grasshoppers hear with ears on their belly or legs.'],
    ['Praying mantis', '🦗', 'A mantis can turn its head to look behind itself.'],
    ['Stag beetle', '🪲', 'Male stag beetles use their big "antlers" to wrestle rivals.'],
    ['Cricket', '🦗', 'Crickets chirp by rubbing their wings together.'],
    ['Cicada', '🪰', 'Some cicadas live underground for 13 or 17 years before coming out.'],
    ['Earthworm', '🪱', 'Earthworms loosen soil and help plants grow (not an insect!).'],
    ['Garden spider', '🕷️', 'Spiders are arachnids with 8 legs, not insects (which have 6).'],
    ['Snail', '🐌', 'A snail\'s shell grows with it and can\'t be taken off.'],
    ['Caterpillar', '🐛', 'Caterpillars eat leaves and will turn into butterflies or moths.'],
    ['Bumblebee', '🐝', 'Bumblebees "buzz-pollinate" by shaking flowers with their muscles.'],
    ['Luna moth', '🦋', 'Adult luna moths have no mouth and live only about a week.'],
    ['Centipede', '🪱', 'Centipedes have one pair of legs per body segment.'],
    ['Pill bug', '🪲', 'Pill bugs (woodlice) are crustaceans and can roll into a ball.'],
    ['Stick insect', '🌿', 'Stick insects look just like twigs to hide from birds.'],
    ['Mosquito', '🦟', 'Only female mosquitoes bite — they need blood to lay eggs.'],
    ['Housefly', '🪰', 'Flies taste with their feet.'],
    ['Wasp', '🐝', 'Many wasps hunt pest insects and help gardeners.'],
    ['Rhinoceros beetle', '🪲', 'Rhino beetles are among the strongest animals for their size.'],
    ['Katydid', '🦗', 'Katydids look like leaves and "sing" at night.'],
    ['Lacewing', '🪰', 'Lacewing larvae eat aphids — nicknamed "aphid lions".'],
    ['Damselfly', '🪰', 'Damselflies fold their wings along the body when resting.'],
    ['Water strider', '🦟', 'Water striders skate on the surface of ponds.'],
    ['Leafcutter ant', '🐜', 'They carry leaf pieces to grow a fungus farm to eat.'],
    ['Weevil', '🪲', 'Weevils are beetles with a long snout.']
];
const RL_NEWS = [
    'Scientists report: honeybees can learn to recognise human faces in lab tests.',
    'Researchers say octopuses have three hearts and blue blood.',
    'Astronomers: the Sun\'s light takes about 8 minutes to reach Earth.',
    'Biologists have found evidence that trees can share nutrients through underground fungi.',
    'Physicists remind us: water expands as it freezes, which is why ice floats.',
    'Planet scientists: a day on Venus is longer than its year.',
    'Entomologists estimate there are millions of insect species — many not yet named.',
    'Chemists: soap works by breaking up the oily coating around many germs.',
    'Neuroscientists report that sleep helps the brain store new memories.',
    'Battery researchers: heat is one of the biggest things that shortens a phone battery\'s life.',
    'Ecologists: bees and other pollinators help produce much of the food we eat.',
    'The James Webb telescope sees in infrared light, which lets it look through dust clouds.',
    'Climate scientists say planting and protecting forests helps store carbon.',
    'Zoologists tracked monarch butterflies flying over 4,000 km to winter in warm forests.',
    'Medical researchers say washing hands and vaccines prevent many illnesses.',
    'Geologists: Earth\'s continents move a few centimetres a year — about as fast as fingernails grow.',
    'Engineers are building recycling methods to recover metals from old electronics.',
    'Ornithologists: some birds, like crows, can use tools to get food.',
    'Computer scientists: strong passwords are long, unique, and not reused across sites.',
    'Marine biologists: coral reefs cover under 1% of the ocean but host about a quarter of marine species.',
    'Nutrition scientists say a mix of fruit, vegetables and movement keeps most people healthier.',
    'Astronomers have confirmed thousands of planets orbiting other stars.',
    'Entomologists: a few ant species build living bridges out of their own bodies.',
    'Psychologists report that too much screen time before bed can make it harder to sleep.'
];

// ---------------------------------------------
// the 🌟 Life menu
// ---------------------------------------------
function rlHome() {
    const r = rlS();
    let h = `<h2 style="color:#f1c40f; text-align:center; margin-top:0;">🌟 Real Life</h2>
        <div style="color:#bbb; text-align:center; font-size:0.85em; margin-bottom:8px;">💰 $${player.money} · 😊 ${player.happiness} · ❤️ ${player.health} · 📚 ${player.education}${r.sick ? ' · 🤒 sick' : ''}</div>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">`;
    RL_CATS.forEach(c => { h += lifeBtn(`rlCat('${c.id}')`, `${c.emoji} ${c.name}`, '#2c3e50'); });
    h += `</div><div style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:6px;">`;
    h += lifeBtn('rlShopOpen()', '🛒 Electronics shop', '#8e44ad');
    h += lifeBtn('rlPetMenu()', '🐾 Pet', '#16a085');
    h += lifeBtn('rlLoveMenu()', '💕 Relationships', '#c0392b');
    if (r.sick) h += lifeBtn('rlSickMenu()', '🤒 I feel sick', '#e67e22');
    h += `</div><div style="text-align:center; margin-top:10px;">${lifeBtn('closeLifeOverlay()', 'Close', '#555')}</div>`;
    lifeOverlay(h, '#f1c40f');
}
function rlCat(catId) {
    const c = RL_CATS.find(x => x.id === catId);
    const r = rlS();
    let h = `<h2 style="color:#f1c40f; text-align:center; margin-top:0;">${c.emoji} ${c.name}</h2>
        <div style="color:#bbb; text-align:center; font-size:0.85em;">💰 $${player.money}</div>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:6px;">`;
    c.acts.forEach(a => {
        const [id, em, name, minAge, cost, fx, cd, msg, req] = a;
        const left = Math.max(0, (r.cd[catId + ':' + id] || -999) + cd - rlDay());
        const locked = player.age < minAge ? `age ${minAge}+` : !rlMeetsReq(req) ? 'needs ' + rlNeedsText(req) : left > 0 ? `again in ${left}d` : player.money < cost ? 'not enough $' : '';
        const label = `${em} ${name}${cost ? ' — $' + cost : ''}${fx ? ' (' + rlFxText(fx) + ')' : ''}${locked ? ' 🔒 ' + locked : ''}`;
        h += lifeBtn(`rlDo('${catId}','${id}')`, label, locked ? '#555' : '#2980b9', 'font-size:0.85em; padding:8px 12px;' + (locked ? ' opacity:0.65;' : ''));
    });
    h += `</div><div style="text-align:center; margin-top:10px;">${lifeBtn('rlHome()', '⬅ Back', '#555')}</div>`;
    lifeOverlay(h, '#f1c40f');
}
function rlDo(catId, id) {
    const a = rlFind(catId, id); if (!a) return;
    const r = rlS();
    const [, em, name, minAge, cost, fx, cd, msg, req] = a;
    const key = catId + ':' + id;
    if (player.age < minAge) { showEvent('🔒', `You need to be ${minAge} or older.`); return; }
    if (!rlMeetsReq(req)) { showEvent('🔌', 'You need: ' + rlNeedsText(req) + '.'); return; }
    if ((r.cd[key] || -999) + cd > rlDay()) { showEvent('⏳', 'You did that recently.'); return; }
    if (player.money < cost) { showEvent('💰', 'Not enough money.'); return; }
    if (r.sick && /jog|gym|swim|ski|hike|bike|football|basket|tennis|skate|dance/.test(id)) { showEvent('🤒', 'You feel too sick for that. Rest first!'); return; }
    player.money -= cost;
    r.cd[key] = rlDay();
    if (/laptop|tv|console|phone/.test(req || '')) rlScreenUse();
    const special = RL_SPECIAL[id];
    if (special) special(a);
    else { rlApply(fx); showEvent(em, msg); }
    try { updateStats(); saveGame(); } catch (e) {}
    setTimeout(() => rlCat(catId), 60);
}
function rlScreenUse() {
    const r = rlS(); r.screen++;
    if (r.screen === 5) showEvent('👀', 'You have been looking at screens a lot today. Time for a break!');
    if (r.screen > 5) player.happiness = rlClamp(player.happiness - 1);
}

const RL_SPECIAL = {
    bughunt: function () {
        const r = rlS();
        if (Math.random() < 0.25) { showEvent('🐞', 'You searched under leaves but found nothing today.'); rlApply({ happy: 1 }); return; }
        const unseen = RL_BUGS.filter(b => !r.bugs.includes(b[0]));
        const b = unseen.length ? rlPick(unseen) : rlPick(RL_BUGS);
        const isNew = !r.bugs.includes(b[0]);
        if (isNew) r.bugs.push(b[0]);
        rlApply({ happy: isNew ? 5 : 2, edu: isNew ? 1 : 0 });
        showEvent(b[1], isNew ? `New bug: ${b[0]}! (${r.bugs.length}/${RL_BUGS.length}) — ${b[2]}` : `You found another ${b[0]}. You let it go.`);
        if (r.bugs.length === RL_BUGS.length && !r.bugDone) { r.bugDone = true; rlApply({ happy: 15 }); setTimeout(() => showEvent('🏆', 'Bug Guide complete! You are a real entomologist.'), 2800); }
    },
    news: function () {
        const r = rlS();
        const n = RL_NEWS[r.news % RL_NEWS.length]; r.news++;
        rlApply({ happy: 2, edu: 1 });
        showEvent('📰', n);
    },
    charge: function () {
        const r = rlS(); r.battery = 100; showEvent('🔌', 'All your devices are charged to 100%.');
    },
    save: function () { const r = rlS(); r.savings = (r.savings || 0) + 50; showEvent('🏦', `Saved $50. Savings: $${r.savings}.`); },
    invest: function () {
        const r = rlS(); const roll = Math.random();
        const back = roll < 0.4 ? 60 : roll < 0.85 ? 130 : 220;
        player.money += back;
        showEvent(back < 100 ? '📉' : '📈', back < 100 ? `The market dipped: your $100 is now $${back}.` : `Your $100 grew to $${back}!`);
    },
    sellold: function () {
        const g = 10 + Math.floor(Math.random() * 40); player.money += g; showEvent('🏷️', `You sold some old stuff for $${g}.`);
    },
    taxes: function () {
        const refund = player.job ? 20 + Math.floor(Math.random() * 60) : 5; player.money += refund;
        rlApply({ edu: 1 }); showEvent('🧾', `Taxes done. Refund: $${refund}.`);
    },
    insure: function () { rlS().insured = rlDay() + 60; rlApply({ happy: 3 }); showEvent('🛡️', 'You are insured for 60 days: repairs and doctor visits are half price.'); },
    lottery: function () {
        const w = Math.random(); let g = 0;
        if (w < 0.01) g = 1500; else if (w < 0.08) g = 40; else if (w < 0.2) g = 10;
        player.money += g;
        showEvent('🎟️', g ? `You won $${g}!` : 'No luck this time. (The lottery is rarely a good deal!)');
    },
    checkup: function () {
        const r = rlS(); if (r.sick) { r.sick = false; showEvent('🩺', 'The doctor treated your cold. You feel better!'); } else showEvent('🩺', 'The doctor says you are doing well.');
        rlApply({ health: 8 });
    },
    recycle: function () {
        const r = rlS(); let n = 0;
        Object.keys(r.own).forEach(k => { if (r.own[k].broken) { delete r.own[k]; n++; } });
        rlApply({ happy: 3, edu: 1 });
        showEvent('♻️', n ? `You recycled ${n} broken device${n > 1 ? 's' : ''} at an e-waste point.` : 'You took old batteries and cables to the recycling point.');
    },
    photo: function () { const r = rlS(); r.photos += 4; rlApply({ happy: 5 }); showEvent('📸', `You took 4 great photos. Album: ${r.photos}.`); },
    takeaway: function (a) { rlApply(a[5]); rlScreenUse(); showEvent(a[1], a[7]); },
    callfriend: function (a) { rlApply(a[5]); showEvent(a[1], a[7]); }
};

// ---------------------------------------------
// 🛒 electronics shop + owned devices
// ---------------------------------------------
function rlShopOpen() {
    const r = rlS();
    let h = `<h2 style="color:#9b59b6; text-align:center; margin-top:0;">🛒 Electronics Shop</h2>
        <div style="color:#bbb; text-align:center; font-size:0.85em;">💰 $${player.money} · New devices have a 30-day warranty</div>`;
    h += `<div style="color:#fff; margin-top:8px;">`;
    RL_DEVICES.forEach(d => {
        const o = r.own[d.id];
        const state = !o ? '' : o.broken ? ' 💥 broken' : ' ✅ owned';
        h += `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; border-bottom:1px solid #ffffff22; padding:5px 0;">
            <div style="font-size:0.9em;"><b>${d.emoji} ${d.name}</b>${state}<br><span style="color:#aaa; font-size:0.85em;">${d.blurb}</span></div>
            <div style="white-space:nowrap;">`;
        if (!o) h += lifeBtn(`rlBuy('${d.id}')`, `$${d.price}`, player.age >= d.age && player.money >= d.price ? '#27ae60' : '#555', 'padding:6px 12px;');
        else if (o.broken) h += lifeBtn(`rlRepair('${d.id}')`, `Repair $${rlRepairCost(d)}`, '#e67e22', 'padding:6px 10px;') + lifeBtn(`rlBuy('${d.id}', true)`, `Replace $${d.price}`, '#27ae60', 'padding:6px 10px;');
        else h += `<span style="color:#7f8">in use</span>`;
        h += `</div></div>`;
    });
    h += `</div><div style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:8px;">`;
    h += lifeBtn('rlToggleNet()', r.net ? '🌐 Internet plan: ON ($15 / 10 days) — cancel' : '🌐 Start internet plan ($15 / 10 days)', r.net ? '#16a085' : '#8e44ad');
    h += lifeBtn('rlHome()', '⬅ Back', '#555');
    h += `</div>`;
    lifeOverlay(h, '#9b59b6');
}
function rlRepairCost(d) {
    const r = rlS(); const o = r.own[d.id];
    if (o && o.warranty >= rlDay()) return 0;
    const half = r.insured && r.insured >= rlDay();
    return Math.round(d.price * 0.4 * (half ? 0.5 : 1));
}
function rlBuy(id, replace) {
    const d = rlDevice(id); const r = rlS();
    if (player.age < d.age) { showEvent('🔒', `You need to be ${d.age} or older for that.`); return; }
    if (r.own[id] && !replace) { showEvent('✅', 'You already have that.'); return; }
    if (player.money < d.price) { showEvent('💰', 'Not enough money.'); return; }
    player.money -= d.price;
    r.own[id] = { bought: rlDay(), warranty: rlDay() + 30 };
    if (id === 'phone') r.battery = 100;
    rlApply({ happy: 6 });
    showEvent(d.emoji, `You bought a ${d.name.toLowerCase()}!`);
    setTimeout(rlShopOpen, 60);
}
function rlRepair(id) {
    const d = rlDevice(id); const r = rlS(); const c = rlRepairCost(d);
    if (player.money < c) { showEvent('💰', 'Not enough money to repair.'); return; }
    player.money -= c; r.own[id].broken = false; if (c === 0) showEvent('🛠️', 'Fixed for free — still under warranty!'); else showEvent('🛠️', `Repaired for $${c}.`);
    try { updateStats(); saveGame(); } catch (e) {}
    setTimeout(rlShopOpen, 60);
}
function rlToggleNet() {
    const r = rlS();
    if (r.net) { r.net = false; showEvent('🌐', 'Internet plan cancelled.'); }
    else { if (player.money < 15) { showEvent('💰', 'Not enough money.'); return; } player.money -= 15; r.net = true; r.netPaid = rlDay(); showEvent('🌐', 'Internet is on. Wifi at home!'); }
    try { updateStats(); saveGame(); } catch (e) {}
    setTimeout(rlShopOpen, 60);
}

// ---------------------------------------------
// 📱 phone
// ---------------------------------------------
const RL_TEXTS = [
    ['👩', 'Mia: "Wanna hang out this weekend?"', ['Sure!', 'Maybe next week'], 'ok'],
    ['👨', 'Dad: "Don\'t forget to eat dinner!"', ['Thanks Dad', '👍'], 'ok'],
    ['👩', 'Mom: "Proud of you 💛"', ['Love you', '❤️'], 'ok'],
    ['🧑', 'Sam: "Did you see that funny video?"', ['LOL yes', 'Not yet'], 'ok'],
    ['🎁', 'Unknown number: "YOU WON A FREE PRIZE! Click this link and enter your password to claim."', ['Click the link', 'Delete and block'], 'scam'],
    ['🏦', 'Unknown: "Your bank account is locked! Send your PIN to unlock it."', ['Send the PIN', 'Delete — real banks never ask'], 'scam'],
    ['📦', 'Unknown: "Your parcel is waiting. Pay a $3 fee at this link."', ['Pay the fee', 'Ignore it'], 'scam']
];
function rlPhoneOn() { return rlHas('phone'); }
function rlPhone() {
    const r = rlS();
    if (!rlPhoneOn()) { showEvent('📱', r.own.phone && r.own.phone.broken ? 'Your phone is broken — repair it in the shop.' : 'You need a phone. Buy one in the 🛒 Electronics shop.'); return; }
    let h = `<h2 style="color:#3498db; text-align:center; margin-top:0;">📱 Phone</h2>
        <div style="text-align:center; color:#fff;">🔋 ${r.battery}% ${r.battery <= 15 ? '⚠️ low' : ''} · 🌐 ${r.net ? 'wifi on' : 'no internet plan'} · 📷 ${r.photos} photos · 🐞 ${r.bugs.length}/${RL_BUGS.length} bugs</div>`;
    if (r.battery <= 0) h += `<div style="color:#e74c3c; text-align:center; margin:8px;">Battery dead! Charge it to use apps.</div><div style="text-align:center;">${lifeBtn('rlCharge()', '🔌 Charge', '#27ae60')}</div>`;
    else {
        h += `<div style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:8px;">`;
        h += lifeBtn("rlApp('call')", '📞 Call', '#27ae60') + lifeBtn("rlApp('text')", '💬 Texts', '#2980b9') + lifeBtn("rlApp('cam')", '📷 Camera', '#8e44ad')
            + lifeBtn('rlBugGuide()', '🐞 Bug Guide', '#16a085') + lifeBtn('rlNewsApp()', '🔬 Science News', '#d35400') + lifeBtn("rlApp('safe')", '🔒 Online safety', '#7f8c8d')
            + lifeBtn('rlShopOpen()', '🛒 Shop', '#9b59b6') + lifeBtn('rlCharge()', '🔌 Charge', '#555');
        h += `</div>`;
    }
    h += `<div style="text-align:center; margin-top:10px;">${lifeBtn('closeLifeOverlay()', 'Close', '#555')}</div>`;
    lifeOverlay(h, '#3498db');
}
function rlCharge() { rlS().battery = 100; showEvent('🔌', 'Charged to 100%.'); rlPhone(); }
function rlDrain(n) { const r = rlS(); r.battery = Math.max(0, r.battery - n); rlScreenUse(); }
function rlApp(which) {
    const r = rlS();
    if (which === 'call') {
        rlDrain(3);
        let h = `<h2 style="color:#27ae60; text-align:center; margin-top:0;">📞 Call</h2><div style="text-align:center;">
            ${lifeBtn("rlCall('Mom')", '👩 Mom', '#27ae60')}${lifeBtn("rlCall('Dad')", '👨 Dad', '#27ae60')}${lifeBtn("rlCall('a friend')", '🧑 A friend', '#27ae60')}${lifeBtn("rlCall('the doctor')", '🩺 Doctor', '#e67e22')}${lifeBtn("rlCall('911')", '🚑 Emergency', '#c0392b')}
            <br>${lifeBtn('rlPhone()', '⬅ Back', '#555')}</div>`;
        lifeOverlay(h, '#27ae60');
    } else if (which === 'text') {
        rlDrain(2);
        const t = rlPick(RL_TEXTS);
        const h = `<h2 style="color:#2980b9; text-align:center; margin-top:0;">💬 New text</h2>
            <div style="color:#fff; background:#0f3460; border-radius:10px; padding:12px; text-align:center;">${t[0]} ${t[1]}</div>
            <div style="text-align:center; margin-top:8px;">${lifeBtn(`rlReply(${RL_TEXTS.indexOf(t)},0)`, t[2][0], '#27ae60')}${lifeBtn(`rlReply(${RL_TEXTS.indexOf(t)},1)`, t[2][1], '#2980b9')}</div>`;
        lifeOverlay(h, '#2980b9');
    } else if (which === 'cam') {
        rlDrain(4); r.photos++; rlApply({ happy: 2 });
        showEvent('📷', `Click! Photo #${r.photos} saved.`); rlPhone();
    } else if (which === 'safe') {
        const h = `<h2 style="color:#7f8c8d; text-align:center; margin-top:0;">🔒 Online safety</h2>
            <div style="color:#fff; line-height:1.6;">• Use long, different passwords and never share them.<br>• Real banks and shops never ask for your PIN or password by text.<br>• Don't click links from strangers.<br>• Tell a grown-up if something online makes you feel uncomfortable.<br>• Take screen breaks: more than 5 uses a day makes you feel worse.</div>
            <div style="text-align:center; margin-top:8px;">${lifeBtn('rlPhone()', '⬅ Back', '#555')}</div>`;
        lifeOverlay(h, '#7f8c8d');
    }
}
function rlCall(who) {
    if (who === 'the doctor') { const r = rlS(); if (r.sick) { rlSickMenu(); return; } showEvent('🩺', 'Doctor: "You sound healthy. Come in for a check-up any time."'); rlPhone(); return; }
    if (who === '911') { showEvent('🚑', 'Emergency line: "Call only for real emergencies, please."'); rlPhone(); return; }
    rlApply({ happy: who === 'a friend' ? 4 : 5 });
    showEvent('📞', `You had a nice chat with ${who}.`); rlPhone();
}
function rlReply(i, c) {
    const t = RL_TEXTS[i];
    if (t[3] === 'scam') {
        if (c === 0) { const lost = Math.min(player.money, 60); player.money -= lost; rlApply({ happy: -6 }); showEvent('🚨', `That was a scam! You lost $${lost}. Never click strange links.`); }
        else { rlApply({ edu: 1, happy: 2 }); showEvent('🛡️', 'Good call — you spotted a scam and blocked it.'); }
    } else { rlApply({ happy: 3 }); showEvent('💬', 'Sent!'); }
    rlPhone();
}
function rlBugGuide() {
    const r = rlS();
    let h = `<h2 style="color:#16a085; text-align:center; margin-top:0;">🐞 Bug Guide (${r.bugs.length}/${RL_BUGS.length})</h2><div style="color:#fff; max-height:55vh; overflow-y:auto; font-size:0.88em; line-height:1.4;">`;
    RL_BUGS.forEach(b => { h += r.bugs.includes(b[0]) ? `<div style="margin:4px 0;">${b[1]} <b>${b[0]}</b> — ${b[2]}</div>` : `<div style="margin:4px 0; opacity:0.45;">❔ ??? — find it on a 🐞 bug hunt</div>`; });
    h += `</div><div style="text-align:center; margin-top:8px;">${lifeBtn('rlPhone()', '⬅ Back', '#555')}</div>`;
    lifeOverlay(h, '#16a085');
}
function rlNewsApp() {
    const r = rlS();
    if (!rlNetOn()) { showEvent('🌐', 'No internet plan — start one in the 🛒 shop.'); return; }
    rlDrain(2);
    const n = RL_NEWS[r.news % RL_NEWS.length]; r.news++;
    rlApply({ happy: 1, edu: 1 });
    const h = `<h2 style="color:#d35400; text-align:center; margin-top:0;">🔬 Science News</h2><div style="color:#fff; background:#0f3460; border-radius:10px; padding:14px; line-height:1.5;">📰 ${n}</div>
        <div style="text-align:center; margin-top:8px;">${lifeBtn('rlNewsApp()', 'Next report ➡', '#d35400')}${lifeBtn('rlPhone()', '⬅ Back', '#555')}</div>`;
    lifeOverlay(h, '#d35400');
}

// ---------------------------------------------
// 🤒 sickness
// ---------------------------------------------
function rlSickMenu() {
    const r = rlS();
    const half = r.insured && r.insured >= rlDay();
    const dr = half ? 20 : 40;
    const h = `<h2 style="color:#e67e22; text-align:center; margin-top:0;">🤒 You have a cold</h2>
        <div style="color:#fff; text-align:center; line-height:1.6;">You lose a little health every day until you get better.</div>
        <div style="text-align:center; margin-top:8px;">${lifeBtn('rlCure("rest")', '🛏️ Rest (free, slower)', '#2980b9')}${lifeBtn('rlCure("meds")', '💊 Medicine $10', '#27ae60')}${lifeBtn('rlCure("doctor")', `🩺 Doctor $${dr}`, '#e67e22')}${lifeBtn('rlHome()', '⬅ Back', '#555')}</div>`;
    lifeOverlay(h, '#e67e22');
}
function rlCure(how) {
    const r = rlS();
    if (how === 'rest') { rlApply({ health: 2 }); if (Math.random() < 0.4) { r.sick = false; showEvent('🛏️', 'You rested and feel better!'); } else showEvent('🛏️', 'You rested. Still a bit sniffly.'); }
    else if (how === 'meds') { if (player.money < 10) { showEvent('💰', 'Not enough money.'); return; } player.money -= 10; r.sick = false; rlApply({ health: 3 }); showEvent('💊', 'The medicine worked. You feel better.'); }
    else { const c = r.insured && r.insured >= rlDay() ? 20 : 40; if (player.money < c) { showEvent('💰', 'Not enough money.'); return; } player.money -= c; r.sick = false; rlApply({ health: 8 }); showEvent('🩺', 'The doctor sorted you out.'); }
    try { updateStats(); saveGame(); } catch (e) {}
    rlHome();
}

// ---------------------------------------------
// 🐾 pet
// ---------------------------------------------
const RL_PETS = [['dog', '🐶', 'Dog', 90], ['cat', '🐱', 'Cat', 70], ['hamster', '🐹', 'Hamster', 25], ['fish', '🐠', 'Fish', 15], ['bird', '🦜', 'Bird', 45], ['rabbit', '🐰', 'Rabbit', 40]];
function rlPetMenu() {
    const r = rlS(); const p = r.pet;
    let h = `<h2 style="color:#16a085; text-align:center; margin-top:0;">🐾 Pet</h2>`;
    if (p) {
        const hungry = rlDay() - p.fed;
        h += `<div style="color:#fff; text-align:center; line-height:1.7;">${p.emoji} <b>${p.name}</b> the ${p.kind}<br>Mood: ${hungry <= 1 ? '😊 happy' : hungry <= 3 ? '😐 hungry' : '😢 very hungry'} · Bond: ${p.bond}</div>
            <div style="text-align:center; margin-top:8px;">${lifeBtn('rlPetDo("feed")', '🍖 Feed ($3)', '#27ae60')}${lifeBtn('rlPetDo("play")', '🎾 Play', '#2980b9')}${p.kind === 'Dog' ? lifeBtn('rlPetDo("walk")', '🦮 Walk the dog', '#16a085') : ''}${lifeBtn('rlPetDo("vet")', '🩺 Vet ($25)', '#e67e22')}${lifeBtn('rlHome()', '⬅ Back', '#555')}</div>`;
    } else {
        h += `<div style="color:#fff; text-align:center;">Adopt a pet! You must feed it every few days.</div><div style="text-align:center; margin-top:8px;">`;
        RL_PETS.forEach(q => { h += lifeBtn(`rlAdopt('${q[0]}')`, `${q[1]} ${q[2]} — $${q[3]}`, player.money >= q[3] ? '#27ae60' : '#555'); });
        h += `<br>${lifeBtn('rlHome()', '⬅ Back', '#555')}</div>`;
    }
    lifeOverlay(h, '#16a085');
}
function rlAdopt(id) {
    const q = RL_PETS.find(x => x[0] === id); const r = rlS();
    if (player.age < 6) { showEvent('🔒', 'You need to be 6 or older to look after a pet.'); return; }
    if (player.money < q[3]) { showEvent('💰', 'Not enough money.'); return; }
    player.money -= q[3];
    const names = ['Buddy', 'Luna', 'Max', 'Coco', 'Milo', 'Daisy', 'Pip', 'Ziggy'];
    r.pet = { kind: q[2], emoji: q[1], name: rlPick(names), fed: rlDay(), bond: 1 };
    rlApply({ happy: 12 });
    showEvent(q[1], `You adopted ${r.pet.name} the ${q[2].toLowerCase()}!`);
    rlPetMenu();
}
function rlPetDo(what) {
    const r = rlS(); const p = r.pet; if (!p) return;
    if (what === 'feed') { if (player.money < 3) { showEvent('💰', 'Not enough money.'); return; } player.money -= 3; p.fed = rlDay(); p.bond++; rlApply({ happy: 3 }); showEvent(p.emoji, `${p.name} ate happily.`); }
    else if (what === 'play') { p.bond++; rlApply({ happy: 5 }); showEvent(p.emoji, `You played with ${p.name}!`); }
    else if (what === 'walk') { p.bond++; rlApply({ happy: 5, health: 3, full: -5 }); showEvent('🦮', `A long walk with ${p.name}.`); }
    else if (what === 'vet') { if (player.money < 25) { showEvent('💰', 'Not enough money.'); return; } player.money -= 25; p.bond++; rlApply({ happy: 2 }); showEvent('🩺', `${p.name} is healthy.`); }
    try { updateStats(); saveGame(); } catch (e) {}
    rlPetMenu();
}

// ---------------------------------------------
// 💕 relationships: dating -> engaged -> married -> kids
// ---------------------------------------------
const RL_PARTNER_NAMES = ['Alex', 'Sam', 'Jamie', 'Riley', 'Taylor', 'Morgan', 'Jordan', 'Casey', 'Robin', 'Avery'];
function rlLoveMenu() {
    const r = rlS(); const L = r.love;
    let h = `<h2 style="color:#e84393; text-align:center; margin-top:0;">💕 Relationships</h2><div style="color:#fff; text-align:center; line-height:1.7;">`;
    const label = { single: 'Single', dating: `Dating ${L.name}`, engaged: `Engaged to ${L.name}`, married: `Married to ${L.name}` }[L.stage];
    h += `Status: <b>${label}</b>${L.stage !== 'single' ? ' · Love: ' + L.score + '/10' : ''}${r.kids ? ` · 👶 Children: ${r.kids}` : ''}</div><div style="text-align:center; margin-top:8px;">`;
    if (L.stage === 'single') {
        h += player.age >= 16 ? lifeBtn('rlLove("meet")', '👋 Meet someone new', '#e84393') : '<div style="color:#bbb;">You can start dating at 16.</div>';
    } else {
        h += lifeBtn('rlLove("date")', '🌹 Go on a date ($30)', '#e84393');
        if (L.stage === 'dating' && L.score >= 6 && player.age >= 18) h += lifeBtn('rlLove("propose")', '💍 Propose ($150 ring)', '#8e44ad');
        if (L.stage === 'engaged') h += lifeBtn('rlLove("wedding")', '👰 Have the wedding ($400)', '#8e44ad');
        if (L.stage === 'married' && r.kids < 4 && player.age >= 22) h += lifeBtn('rlLove("kid")', '👶 Have a child', '#16a085');
        h += lifeBtn('rlLove("breakup")', L.stage === 'married' ? '💔 Divorce' : '💔 Break up', '#555');
    }
    h += `<br>${lifeBtn('rlHome()', '⬅ Back', '#555')}</div>`;
    lifeOverlay(h, '#e84393');
}
function rlLove(what) {
    const r = rlS(); const L = r.love;
    if (what === 'meet') { L.stage = 'dating'; L.name = rlPick(RL_PARTNER_NAMES); L.score = 2; rlApply({ happy: 8 }); showEvent('💕', `You met ${L.name} and started dating!`); }
    else if (what === 'date') {
        if (player.money < 30) { showEvent('💰', 'Not enough money.'); return; }
        if ((r.cd.date || -9) === rlDay()) { showEvent('⏳', 'One date a day is plenty.'); return; }
        r.cd.date = rlDay(); player.money -= 30; L.score = Math.min(10, L.score + 1); rlApply({ happy: 8 }); showEvent('🌹', `A lovely date with ${L.name}. Love ${L.score}/10.`);
    }
    else if (what === 'propose') { if (player.money < 150) { showEvent('💰', 'The ring costs $150.'); return; } player.money -= 150; L.stage = 'engaged'; rlApply({ happy: 15 }); showEvent('💍', `${L.name} said YES!`); }
    else if (what === 'wedding') { if (player.money < 400) { showEvent('💰', 'The wedding costs $400.'); return; } player.money -= 400; L.stage = 'married'; rlApply({ happy: 25 }); showEvent('👰', `You married ${L.name}! 🎉`); }
    else if (what === 'kid') { r.kids++; rlApply({ happy: 18 }); showEvent('👶', 'Congratulations — a baby! Children cost $15 every 10 days but bring joy.'); }
    else if (what === 'breakup') { const was = L.stage; L.stage = 'single'; L.score = 0; if (was === 'married') r.kids = r.kids; rlApply({ happy: -15 }); showEvent('💔', 'It was a hard decision.'); }
    try { updateStats(); saveGame(); } catch (e) {}
    rlLoveMenu();
}

// ---------------------------------------------
// daily upkeep (advanceOneDay hook)
// ---------------------------------------------
function rlDaily() {
    const r = rlS();
    r.screen = 0;
    if (r.own.phone && !r.own.phone.broken) r.battery = Math.max(0, r.battery - 10);
    // sickness
    if (r.sick) { player.health = rlClamp(player.health - 2); }
    else if (player.age >= 3 && Math.random() < 0.025) { r.sick = true; setTimeout(() => showEvent('🤒', 'You caught a cold! Open 🌟 Life → 🤒 I feel sick.'), 1500); }
    // pet
    if (r.pet) {
        const hungry = rlDay() - r.pet.fed;
        if (hungry === 3) setTimeout(() => showEvent(r.pet.emoji, `${r.pet.name} is hungry!`), 3000);
        if (hungry >= 6) { const n = r.pet.name; r.pet = null; setTimeout(() => showEvent('😢', `${n} went to live with a kind family because it wasn't fed. Take better care next time.`), 3000); }
        else player.happiness = rlClamp(player.happiness + 1);
    }
    // devices break sometimes
    Object.keys(r.own).forEach(k => {
        if (!r.own[k].broken && Math.random() < 0.012) { r.own[k].broken = true; const d = rlDevice(k); setTimeout(() => showEvent('💥', `Your ${d.name.toLowerCase()} broke! Repair or replace it in the 🛒 shop.`), 3500); }
    });
    // internet bill and child costs every 10 days
    if (player.sleepCount % 10 === 0) {
        if (r.net) { if (player.money >= 15) player.money -= 15; else { r.net = false; setTimeout(() => showEvent('🌐', 'Internet cut off: you could not pay the bill.'), 3000); } }
        if (r.kids) { const c = 15 * r.kids; if (player.money >= c) player.money -= c; else player.happiness = rlClamp(player.happiness - 5); }
        if (r.savings) { const i = Math.round(r.savings * 0.04); r.savings += i; if (i) setTimeout(() => showEvent('🏦', `Your savings earned $${i} interest.`), 2000); }
    }
    r.kids && (player.happiness = rlClamp(player.happiness + 1));
    // a free basic phone at 12
    if (player.age === 12 && !r.gotPhone) { r.gotPhone = true; if (!r.own.phone) { r.own.phone = { bought: rlDay(), warranty: rlDay() + 30 }; r.battery = 100; setTimeout(() => showEvent('📱', 'Mom & Dad gave you your first phone for your birthday!'), 3000); } }
    try { updateStats(); saveGame(); } catch (e) {}
}
function rlWithdraw() {
    const r = rlS(); if (!r.savings) { showEvent('🏦', 'No savings yet.'); return; }
    player.money += r.savings; showEvent('🏦', `You withdrew $${r.savings}.`); r.savings = 0; updateStats(); saveGame();
}

if (typeof advanceOneDay === 'function') {
    const rlOrigDay = advanceOneDay;
    advanceOneDay = function () { const res = rlOrigDay.apply(this, arguments); try { rlDaily(); } catch (e) {} return res; };
}
if (typeof startGame === 'function') {
    const rlOrigStart = startGame;
    startGame = function () { delete player.rl; return rlOrigStart.apply(this, arguments); };
}
if (typeof lifeButtons === 'function') {
    const rlOrigButtons = lifeButtons;
    lifeButtons = function () {
        let extra = '';
        if (player.age >= 3) extra += `<button class="action-btn" onclick="rlHome()">🌟 Life</button>`;
        if (player.age >= 8 && rlS().own.phone) extra += `<button class="action-btn" onclick="rlPhone()">📱 Phone${rlS().battery <= 15 ? ' 🪫' : ''}</button>`;
        return rlOrigButtons.apply(this, arguments) + extra;
    };
}
