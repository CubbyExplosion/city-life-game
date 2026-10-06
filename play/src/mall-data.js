// =============================================
// MALL DATA — the 100 shops in the mall.
//
// 10 kinds of shop x 10 shops each = 100. Each kind has a bank of things to buy;
// every shop picks its OWN 6 (so no two shops sell the same mix), at its own
// prices. Worked out from the shop's number (0-99), so a shop is always the same.
//
// An item is: [name, emoji, price, happiness, health, education]
// Used by mall.js. Never changes while the game is running.
// =============================================

const MALL_CATEGORIES = [
    { id: 'toys', name: 'Toys', emoji: '🧸', color: 0xE74C3C, places: ['Toys', 'Toy Box', 'Toy Corner'],
      items: [['Teddy Bear','🧸',12,10,0,0],['Building Blocks','🧱',15,9,0,2],['Toy Car','🚗',8,7,0,0],['Doll','🪆',14,9,0,0],['Jigsaw Puzzle','🧩',10,6,0,3],['Yo-yo','🪀',5,5,0,0],
              ['Kite','🪁',9,7,2,0],['Water Balloon Pack','🎈',6,6,1,0],['Board Game','🎲',18,10,0,2],['Stuffed Dinosaur','🦖',13,9,0,0],['Toy Robot','🤖',20,11,0,1],['Rubber Duck Set','🦆',6,5,0,0]] },
    { id: 'clothes', name: 'Clothes', emoji: '👕', color: 0x9B59B6, places: ['Boutique', 'Kids Wear', 'Outfitters'],
      items: [['T-Shirt','👕',10,5,0,0],['Cozy Hoodie','🧥',22,7,0,0],['Jeans','👖',18,5,0,0],['Fuzzy Socks','🧦',5,4,0,0],['Sun Hat','🧢',8,5,0,0],['Warm Scarf','🧣',9,4,1,0],
              ['Pajamas','😴',15,6,0,0],['Party Dress','👗',20,8,0,0],['Shorts','🩳',12,5,0,0],['Winter Gloves','🧤',7,4,1,0],['School Backpack','🎒',19,6,0,1],['Rain Jacket','🌧️',21,6,1,0]] },
    { id: 'shoes', name: 'Shoes', emoji: '👟', color: 0x2980B9, places: ['Shoes', 'Shoe Box', 'Footwear'],
      items: [['Sneakers','👟',25,8,2,0],['Boots','🥾',28,7,2,0],['Sandals','🩴',12,5,1,0],['Light-up Shoes','✨',22,10,1,0],['Rain Boots','☔',18,6,1,0],['Slippers','🥿',10,5,0,0],
              ['Soccer Cleats','⚽',30,8,3,0],['Running Shoes','🏃',27,8,4,0],['Flip-flops','🏖️',7,4,0,0],['Skate Shoes','🛹',26,8,2,0],['Ballet Flats','🩰',20,7,1,0],['Hiking Boots','⛰️',32,7,3,0]] },
    { id: 'books', name: 'Books', emoji: '📚', color: 0x16A085, places: ['Books', 'Bookshop', 'Book Nook'],
      items: [['Picture Book','📖',8,5,0,3],['Adventure Novel','📚',12,6,0,4],['Comic Book','💥',6,6,0,2],['Dinosaur Encyclopedia','🦕',16,5,0,5],['Fairy Tales','🧚',10,6,0,3],['Joke Book','😂',7,7,0,2],
              ['Science Experiments','🔬',14,6,0,5],['World Atlas','🗺️',18,4,0,6],['Poems for Kids','🖋️',9,4,0,3],['Mystery Story','🕵️',11,6,0,4],['Kids Cookbook','🍳',13,5,0,3],['Coloring Book','🖍️',5,6,0,1]] },
    { id: 'games', name: 'Games & Gadgets', emoji: '🎮', color: 0x34495E, places: ['Games', 'Game Zone', 'Gadgets'],
      items: [['Video Game','🎮',30,13,0,0],['Headphones','🎧',25,8,0,0],['Walkie-Talkies','📻',18,9,0,0],['Remote-Control Car','🏎️',28,11,0,0],['Digital Pet','🐣',15,9,0,0],['Calculator','🧮',12,3,0,3],
              ['Kids Camera','📷',35,10,0,1],['Bluetooth Speaker','🔊',22,8,0,0],['Star Projector','🌟',20,9,0,1],['Robot Kit','🤖',38,12,0,3],['Coding Toy','💻',33,10,0,5],['Glow Lamp','💡',14,6,0,0]] },
    { id: 'sports', name: 'Sports', emoji: '⚽', color: 0x27AE60, places: ['Sports', 'Sports Shack', 'Sporting Goods'],
      items: [['Soccer Ball','⚽',14,7,4,0],['Basketball','🏀',16,7,4,0],['Jump Rope','🪢',6,5,5,0],['Skateboard','🛹',35,11,3,0],['Bike Helmet','⛑️',20,5,2,0],['Tennis Racket','🎾',24,7,4,0],
              ['Frisbee','🥏',7,6,4,0],['Baseball Glove','🧤',22,7,3,0],['Scooter','🛴',38,12,4,0],['Swim Goggles','🥽',10,5,3,0],['Hula Hoop','⭕',8,6,4,0],['Water Bottle','🧴',9,3,3,0]] },
    { id: 'candy', name: 'Candy', emoji: '🍬', color: 0xE91E63, places: ['Candy', 'Sweets', 'Candy Shop'],
      items: [['Chocolate Bar','🍫',4,6,-1,0],['Gummy Bears','🧸',4,6,-1,0],['Giant Lollipop','🍭',3,5,-1,0],['Cupcake','🧁',5,7,-1,0],['Cotton Candy','🍬',6,7,-2,0],['Jelly Beans','🫘',5,6,-1,0],
              ['Cookie Box','🍪',8,8,-2,0],['Candy Apple','🍎',6,7,0,0],['Donut','🍩',4,6,-1,0],['Fruit Gummies','🍓',5,5,0,0],['Caramel Popcorn','🍿',5,6,-1,0],['Marshmallows','🍥',4,5,-1,0]] },
    { id: 'pets', name: 'Pet Shop', emoji: '🐶', color: 0xD35400, places: ['Pet Shop', 'Pet Palace', 'Paws'],
      items: [['Hamster Wheel','🐹',8,6,0,0],['Dog Chew Toy','🦴',6,6,0,0],['Cat Feather Toy','🐱',5,5,0,0],['Fish Tank Castle','🐠',12,7,0,0],['Bird Seed','🐦',5,4,0,0],['Puppy Bed','🛏️',20,7,0,0],
              ['Dog Leash','🐕',12,5,1,0],['Pet Sweater','🧶',14,6,0,0],['Stuffed Puppy','🐶',13,9,0,0],['Aquarium Plant','🌿',7,4,0,0],['Pet Brush','🪮',8,4,0,0],['Treat Jar','🍖',9,6,0,0]] },
    { id: 'art', name: 'Art & Crafts', emoji: '🎨', color: 0xF39C12, places: ['Art Studio', 'Crafts', 'Art Room'],
      items: [['Watercolor Set','🎨',14,7,0,3],['Crayon Box','🖍️',5,6,0,2],['Sticker Book','🌟',6,7,0,0],['Modeling Clay','🏺',12,7,0,2],['Bracelet Kit','📿',10,8,0,0],['Sketchbook','📓',9,6,0,3],
              ['Glitter Glue','✨',6,6,0,0],['Origami Paper','📄',5,5,0,3],['Paint Brushes','🖌️',8,5,0,2],['Model Airplane','🛩️',18,8,0,3],['Bead Kit','🔮',11,7,0,0],['Scrapbook','📔',13,7,0,2]] },
    { id: 'snacks', name: 'Snack Bar', emoji: '🍦', color: 0x1ABC9C, places: ['Snack Bar', 'Treats', 'Food Stand'],
      items: [['Soft Pretzel','🥨',5,6,0,0],['Ice Cream Cone','🍦',4,7,0,0],['Pizza Slice','🍕',5,7,-1,0],['Fruit Cup','🍇',4,5,3,0],['Smoothie','🥤',6,6,2,0],['French Fries','🍟',4,6,-2,0],
              ['Chicken Nuggets','🍗',7,7,-1,0],['Hot Cocoa','☕',4,6,0,0],['Corn Dog','🌭',5,6,-1,0],['Veggie Wrap','🌯',8,5,3,0],['Lemonade','🍋',3,5,0,0],['Frozen Yogurt','🍨',6,7,0,0]] }
];

const MALL_SHOP_COUNT = MALL_CATEGORIES.length * 10;   // 100

// Builds shop number 0-99. Always the same shop for the same number.
//   { id, name, catId, catName, emoji, color, tier, items: [{name, emoji, price, hap, health, edu}] x6 }
// (RESTAURANT_BRANDS, seededRandom, seedFromText and shuffledCopy come from restaurant-data.js)
function getMallShop(id) {
    id = ((id % MALL_SHOP_COUNT) + MALL_SHOP_COUNT) % MALL_SHOP_COUNT;
    const cIndex = id % MALL_CATEGORIES.length;
    const cat = MALL_CATEGORIES[cIndex];
    const slot = Math.floor(id / MALL_CATEGORIES.length);                         // 0-9: which shop of this kind
    const brand = RESTAURANT_BRANDS[(slot * 6 + cIndex * 7) % RESTAURANT_BRANDS.length];
    const rng = seededRandom(seedFromText('mallshop|' + id));
    const tier = 1 + Math.floor(rng() * 3);
    const mult = [0, 0.85, 1.0, 1.25][tier];
    const items = shuffledCopy(cat.items, rng).slice(0, 6).map(d => ({
        name: d[0], emoji: d[1], price: Math.max(2, Math.round(d[2] * mult)), hap: d[3], health: d[4], edu: d[5]
    }));
    return { id, name: brand + ' ' + cat.places[slot % cat.places.length], catId: cat.id, catName: cat.name, emoji: cat.emoji, color: cat.color, tier, items };
}
