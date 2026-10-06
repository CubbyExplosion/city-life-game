// =============================================
// HERITAGE — "Where is your family from?"
//
// After you pick Boy / Girl you pick where your family comes from (or 🎲 let the game choose). That one choice sets:
//   🎨 your LOOK      skin tone (one of that heritage's tones, picked for you), hair colour, and a matching Mom & Dad
//   🗣️ your LANGUAGE  Mom & Dad sometimes speak it to you (with the English meaning) and you learn the words —
//                     see 🌍 My Heritage (phrasebook + a little practice quiz); classmates react if you use them in chat
//   🍲 your FOODS     the family's groceries stock your fridge, they're sold in the store (🌍 HOME FOODS stand),
//                     the family's recipes show up in the 🍳 Kitchen, and Mom & Dad suggest your home cuisine for dinner
//   🏷️ your NAME      picked from names common in that culture
// Nothing here changes how the game is won or lost — it is the flavour of your family. Older saves (no heritage) play exactly as before.
//
// How: startGame() (core.js) is wrapped to show the picker first; the choice is stored on the player (player.heritage / skin / hair / words).
// Other files ask heritageLook('player'|'mom'|'dad') for colours. restockFridge, dinnerOptionsFor, getClassmateResponse, addStoreRealism,
// advanceOneDay and launchGame are wrapped at the bottom of this file. The data is in HERITAGES + HG_ITEMS below.
// =============================================

// ---- groceries only the heritage foods use: name -> [emoji, price, days it keeps] ----
const HG_ITEMS = {
    'Rice': ['🍚', 3, 365], 'Beans': ['🫘', 3, 365], 'Noodles': ['🍜', 3, 180], 'Tofu': ['🧊', 3, 10], 'Bok Choy': ['🥬', 3, 6], 'Dumplings': ['🥟', 6, 60],
    'Nori': ['🍙', 3, 365], 'Miso': ['🍲', 4, 120], 'Kimchi': ['🥬', 5, 60], 'Gochujang': ['🌶️', 4, 365], 'Lentils': ['🫘', 3, 365], 'Chickpeas': ['🫘', 3, 365],
    'Naan': ['🫓', 3, 5], 'Paneer': ['🧀', 5, 10], 'Curry Spice': ['🌶️', 3, 365], 'Coconut Milk': ['🥥', 3, 120], 'Curry Paste': ['🌶️', 3, 180], 'Mango': ['🥭', 3, 6],
    'Pasta': ['🍝', 3, 365], 'Tomato Sauce': ['🥫', 3, 120], 'Mozzarella': ['🧀', 4, 14], 'Olive Oil': ['🫒', 7, 365], 'Pita': ['🫓', 3, 5], 'Feta': ['🧀', 5, 20],
    'Olives': ['🫒', 4, 60], 'Honey': ['🍯', 5, 365], 'Brie': ['🧀', 6, 14], 'Crêpe Mix': ['🥞', 4, 180], 'Jam': ['🍓', 3, 120], 'Eggplant': ['🍆', 3, 7],
    'Zucchini': ['🥒', 3, 7], 'Chorizo': ['🌭', 5, 30], 'Shrimp': ['🦐', 9, 4], 'Cheese Bread Mix': ['🧀', 4, 120], 'Soy Sauce': ['🍶', 3, 365], 'Longganisa': ['🌭', 5, 30],
    'Ube': ['🍠', 4, 14], 'Rice Noodles': ['🍜', 3, 180], 'Fish Sauce': ['🍶', 3, 365], 'Herbs': ['🌿', 2, 6], 'Plantains': ['🍌', 3, 6], 'Yam': ['🍠', 4, 14],
    'Pepper Mix': ['🌶️', 3, 30], 'Fava Beans': ['🫘', 3, 365], 'Injera': ['🫓', 4, 5], 'Berbere': ['🌶️', 4, 365], 'Coffee Beans': ['☕', 6, 180], 'Pretzels': ['🥨', 3, 5],
    'Sauerkraut': ['🥬', 3, 60], 'Mustard': ['🟡', 2, 365], 'Jerk Seasoning': ['🌶️', 3, 365], 'Pide Bread': ['🫓', 3, 5], 'White Cheese': ['🧀', 5, 20], 'Black Tea': ['🍵', 4, 365],
    'Lamb': ['🍖', 10, 4], 'Pancake Mix': ['🥞', 4, 180], 'Maple Syrup': ['🍁', 6, 365], 'Peanut Butter': ['🥜', 4, 365], 'Jelly': ['🍇', 3, 120], 'Tortillas': ['🫓', 3, 10],
    'Avocados': ['🥑', 4, 5], 'Salsa': ['🌶️', 3, 30], 'Tahini': ['🥜', 5, 365], 'Hot Sauce': ['🌶️', 3, 365]
};

// skin-tone sets (blocky-people colours) and hair sets used below
const HG_SKIN = {
    mixed:  [0xFFCBA4, 0xE8B88A, 0xC68642, 0x8D5524, 0x6B4226, 0xF3C9A0],
    light:  [0xFFCBA4, 0xFFD5B5, 0xF3C9A0],
    fair:   [0xF3C9A0, 0xE8B88A, 0xFFD5B5],
    eastasia: [0xF3C9A0, 0xEBC196, 0xE8B88A],
    tan:    [0xE8B88A, 0xD9A06D, 0xE0AC69],
    warm:   [0xD9A06D, 0xE0AC69, 0xC68642],
    brown:  [0xC68642, 0xA86B3C, 0xD9A06D],
    deep:   [0x8D5524, 0x6B4226, 0x7A4A2A],
    deeper: [0x6B4226, 0x7A4A2A, 0x8D5524],
    latin:  [0xE8B88A, 0xD9A06D, 0xC68642],
    brazil: [0xE8B88A, 0xC68642, 0x8D5524, 0xF3C9A0]
};
const HG_HAIR = {
    black: [0x1B1B1B, 0x2B1D14], dark: [0x3B2314, 0x2B1D14], brown: [0x4B2800, 0x5A3820],
    europe: [0xE6C27A, 0x8B5A2B, 0x4B2800, 0x3B2314, 0x8B3A1A], usa: [0x4B2800, 0xE6C27A, 0x1B1B1B, 0x8B3A1A, 0x3B2314]
};

// A heritage: flag, name, language, skin set, hair set, Mom/Dad words, names, home cuisines (restaurant-data.js ids),
// family phrases [text, English meaning, latin letters (only when the text isn't Latin)], groceries, recipes.
// A recipe: [name, emoji, [ingredients], fullness, health, happiness]
const HERITAGES = [
    { id: 'usa', flag: '🇺🇸', name: 'United States', language: 'English', skin: 'mixed', hair: 'usa', mom: 'Mom', dad: 'Dad', names: null, cuisines: ['burger', 'bbq', 'diner'],
      phrases: [['Good morning, sunshine!', 'A cheerful wake-up'], ['Dinner time!', 'Come and eat'], ['I love you to the moon and back', 'I love you so much'], ['Sweet dreams', 'Good night'], ['Great job, champ!', 'Well done'], ['Buckle up!', 'Seat belt on'], ['Love you, bud!', 'I love you']],
      foods: ['Pancake Mix', 'Maple Syrup', 'Peanut Butter', 'Jelly'],
      recipes: [['Pancakes & Syrup', '🥞', ['Pancake Mix', 'Maple Syrup', 'Eggs'], 40, 0, 9], ['PB&J Sandwich', '🥪', ['Peanut Butter', 'Jelly', 'Bread'], 32, 1, 7], ['Grilled Cheese', '🧀', ['Bread', 'Cheese', 'Butter'], 34, 0, 7]] },
    { id: 'mexico', flag: '🇲🇽', name: 'Mexico', language: 'Spanish', skin: 'latin', hair: 'dark', mom: 'Mamá', dad: 'Papá',
      names: { boy: ['Mateo', 'Santiago', 'Diego', 'Emiliano', 'Luis', 'Javier'], girl: ['Sofía', 'Valentina', 'Camila', 'Ximena', 'Lucía', 'Regina'] }, cuisines: ['taco'],
      phrases: [['¡Buenos días!', 'Good morning!'], ['¡Buen provecho!', 'Enjoy your meal!'], ['Te quiero mucho', 'I love you very much'], ['Buenas noches', 'Good night'], ['¡Muy bien, mi amor!', 'Very good, my love!'], ['Gracias', 'Thank you'], ['¡Vamos a comer!', "Let's eat!"]],
      foods: ['Tortillas', 'Beans', 'Rice', 'Avocados', 'Salsa'],
      recipes: [['Chicken Tacos', '🌮', ['Tortillas', 'Chicken', 'Salsa'], 45, 2, 10], ['Bean Burrito', '🌯', ['Tortillas', 'Beans', 'Cheese'], 42, 3, 8], ['Arroz con Pollo', '🍚', ['Rice', 'Chicken', 'Tomatoes'], 50, 4, 9], ['Guacamole & Chips', '🥑', ['Avocados', 'Chips'], 22, 2, 7]] },
    { id: 'china', flag: '🇨🇳', name: 'China', language: 'Mandarin Chinese', skin: 'eastasia', hair: 'black', mom: 'Māma', dad: 'Bàba',
      names: { boy: ['Wei', 'Jun', 'Hao', 'Ming', 'Chen', 'Bo'], girl: ['Mei', 'Lin', 'Xia', 'Yan', 'Ling', 'Jia'] }, cuisines: ['chinese', 'hotpot'],
      phrases: [['你好', 'Hello', 'Nǐ hǎo'], ['谢谢', 'Thank you', 'Xièxie'], ['我爱你', 'I love you', 'Wǒ ài nǐ'], ['晚安', 'Good night', 'Wǎn ān'], ['吃饭了！', 'Time to eat!', 'Chī fàn le'], ['早上好', 'Good morning', 'Zǎoshang hǎo'], ['再见', 'Goodbye', 'Zàijiàn']],
      foods: ['Rice', 'Noodles', 'Bok Choy', 'Dumplings', 'Tofu'],
      recipes: [['Egg Fried Rice', '🍚', ['Rice', 'Eggs'], 40, 2, 8], ['Chicken Noodle Stir-Fry', '🍜', ['Noodles', 'Chicken', 'Bok Choy'], 52, 4, 9], ['Steamed Dumplings', '🥟', ['Dumplings'], 34, 1, 9], ['Tofu & Greens', '🥬', ['Tofu', 'Bok Choy', 'Rice'], 45, 6, 7]] },
    { id: 'japan', flag: '🇯🇵', name: 'Japan', language: 'Japanese', skin: 'eastasia', hair: 'black', mom: 'Okāsan', dad: 'Otōsan',
      names: { boy: ['Haruto', 'Ren', 'Sora', 'Yuto', 'Kaito', 'Daiki'], girl: ['Sakura', 'Yui', 'Hina', 'Mio', 'Rin', 'Aoi'] }, cuisines: ['sushi', 'ramen'],
      phrases: [['おはよう', 'Good morning', 'Ohayō'], ['ありがとう', 'Thank you', 'Arigatō'], ['いただきます', "Let's eat! (before a meal)", 'Itadakimasu'], ['おやすみ', 'Good night', 'Oyasumi'], ['ただいま', "I'm home!", 'Tadaima'], ['おかえり', 'Welcome home', 'Okaeri'], ['がんばって', 'Do your best!', 'Ganbatte']],
      foods: ['Rice', 'Nori', 'Miso', 'Tofu', 'Noodles'],
      recipes: [['Onigiri Rice Balls', '🍙', ['Rice', 'Nori'], 30, 3, 8], ['Miso Soup', '🍲', ['Miso', 'Tofu'], 24, 5, 7], ['Salmon Rice Bowl', '🍣', ['Fish', 'Rice'], 52, 6, 10], ['Ramen Bowl', '🍜', ['Noodles', 'Eggs', 'Miso'], 55, 2, 10]] },
    { id: 'korea', flag: '🇰🇷', name: 'South Korea', language: 'Korean', skin: 'eastasia', hair: 'black', mom: 'Eomma', dad: 'Appa',
      names: { boy: ['Minjun', 'Seojun', 'Jiho', 'Hyun', 'Dohyun', 'Joon'], girl: ['Seoyeon', 'Jiwoo', 'Haeun', 'Yuna', 'Soo', 'Minseo'] }, cuisines: ['korean'],
      phrases: [['안녕', 'Hi / Bye', 'Annyeong'], ['감사합니다', 'Thank you', 'Gamsahamnida'], ['사랑해', 'I love you', 'Saranghae'], ['잘 자', 'Sleep well', 'Jal ja'], ['맛있게 먹어', 'Eat well!', 'Masitge meogeo'], ['좋은 아침', 'Good morning', 'Joeun achim'], ['잘했어', 'Good job!', 'Jal haesseo']],
      foods: ['Rice', 'Kimchi', 'Gochujang', 'Tofu', 'Noodles'],
      recipes: [['Kimchi Fried Rice', '🍚', ['Kimchi', 'Rice', 'Eggs'], 50, 3, 10], ['Bibimbap', '🍲', ['Rice', 'Carrots', 'Eggs', 'Gochujang'], 58, 6, 10], ['Kimchi Tofu Stew', '🍲', ['Kimchi', 'Tofu'], 40, 6, 8], ['Kimbap Rolls', '🍙', ['Rice', 'Nori', 'Carrots'], 38, 4, 8]] },
    { id: 'india', flag: '🇮🇳', name: 'India', language: 'Hindi', skin: 'brown', hair: 'black', mom: 'Mummy', dad: 'Papa',
      names: { boy: ['Arjun', 'Aarav', 'Rohan', 'Vihaan', 'Krish', 'Dev'], girl: ['Priya', 'Ananya', 'Diya', 'Meera', 'Isha', 'Kavya'] }, cuisines: ['indian'],
      phrases: [['नमस्ते', 'Hello', 'Namaste'], ['धन्यवाद', 'Thank you', 'Dhanyavaad'], ['शुभ रात्रि', 'Good night', 'Shubh ratri'], ['खाना तैयार है', 'Food is ready', 'Khaana taiyaar hai'], ['सुप्रभात', 'Good morning', 'Suprabhaat'], ['शाबाश!', 'Well done!', 'Shaabaash'], ['तुम कैसे हो?', 'How are you?', 'Tum kaise ho']],
      foods: ['Rice', 'Lentils', 'Chickpeas', 'Naan', 'Paneer', 'Curry Spice'],
      recipes: [['Dal & Rice', '🍛', ['Lentils', 'Rice'], 48, 6, 8], ['Chana Masala & Naan', '🍛', ['Chickpeas', 'Tomatoes', 'Naan'], 55, 6, 9], ['Chicken Curry & Rice', '🍛', ['Chicken', 'Curry Spice', 'Rice'], 58, 4, 10], ['Paneer Wrap', '🌯', ['Paneer', 'Naan'], 40, 3, 8]] },
    { id: 'thailand', flag: '🇹🇭', name: 'Thailand', language: 'Thai', skin: 'warm', hair: 'black', mom: 'Mae', dad: 'Pho',
      names: { boy: ['Arthit', 'Kanin', 'Ton', 'Pran', 'Chai', 'Nattapong'], girl: ['Mali', 'Nok', 'Ploy', 'Fah', 'Malee', 'Dao'] }, cuisines: ['thai'],
      phrases: [['สวัสดี', 'Hello', 'Sawasdee'], ['ขอบคุณ', 'Thank you', 'Khop khun'], ['กินข้าวหรือยัง', 'Have you eaten yet? (a Thai way to say hi)', 'Gin khao reu yang'], ['ฝันดี', 'Sweet dreams', 'Fan dee'], ['อร่อย', 'Delicious!', 'Aroi'], ['ไม่เป็นไร', 'No worries', 'Mai pen rai'], ['เก่งมาก', 'Very clever!', 'Geng maak']],
      foods: ['Rice', 'Noodles', 'Coconut Milk', 'Curry Paste', 'Mango'],
      recipes: [['Green Curry', '🍛', ['Curry Paste', 'Coconut Milk', 'Chicken'], 55, 4, 10], ['Pad Thai', '🍜', ['Noodles', 'Eggs', 'Chicken'], 52, 3, 10], ['Mango Sticky Rice', '🥭', ['Mango', 'Rice', 'Coconut Milk'], 38, 2, 10]] },
    { id: 'italy', flag: '🇮🇹', name: 'Italy', language: 'Italian', skin: 'fair', hair: 'europe', mom: 'Mamma', dad: 'Papà',
      names: { boy: ['Luca', 'Marco', 'Matteo', 'Leonardo', 'Giulio', 'Enzo'], girl: ['Giulia', 'Sofia', 'Chiara', 'Aurora', 'Bianca', 'Francesca'] }, cuisines: ['pasta', 'pizza'],
      phrases: [['Buongiorno!', 'Good morning!'], ['Grazie', 'Thank you'], ['Ti voglio bene', 'I love you (family love)'], ['Buonanotte', 'Good night'], ['Buon appetito!', 'Enjoy your meal!'], ['Mangia!', 'Eat!'], ['A dopo', 'See you later']],
      foods: ['Pasta', 'Tomato Sauce', 'Mozzarella', 'Olive Oil'],
      recipes: [['Spaghetti Pomodoro', '🍝', ['Pasta', 'Tomato Sauce'], 48, 3, 9], ['Pasta Carbonara', '🍝', ['Pasta', 'Eggs', 'Ham'], 58, 0, 11], ['Caprese Salad', '🥗', ['Tomatoes', 'Mozzarella', 'Olive Oil'], 28, 5, 8], ['Bruschetta', '🍞', ['Baguette', 'Tomatoes', 'Olive Oil'], 30, 3, 8]] },
    { id: 'greece', flag: '🇬🇷', name: 'Greece', language: 'Greek', skin: 'tan', hair: 'dark', mom: 'Mama', dad: 'Babas',
      names: { boy: ['Nikos', 'Giorgos', 'Dimitris', 'Alexandros', 'Yannis', 'Stavros'], girl: ['Eleni', 'Maria', 'Sofia', 'Katerina', 'Dimitra', 'Ioanna'] }, cuisines: ['greek'],
      phrases: [['Καλημέρα', 'Good morning', 'Kaliméra'], ['Ευχαριστώ', 'Thank you', 'Efcharistó'], ['Σ’ αγαπώ', 'I love you', 'S’agapó'], ['Καληνύχτα', 'Good night', 'Kalinýchta'], ['Καλή όρεξη', 'Enjoy your meal', 'Kalí órexi'], ['Γεια σου', 'Hello', 'Yia sou'], ['Μπράβο!', 'Bravo! Well done!', 'Bravo']],
      foods: ['Pita', 'Feta', 'Olives', 'Honey', 'Lamb'],
      recipes: [['Greek Salad', '🥗', ['Tomatoes', 'Feta', 'Olives'], 28, 6, 8], ['Chicken Gyro', '🥙', ['Pita', 'Chicken', 'Yogurt'], 50, 3, 10], ['Honey Yogurt', '🍯', ['Yogurt', 'Honey'], 20, 4, 8], ['Lamb & Potatoes', '🍖', ['Lamb', 'Potatoes'], 58, 2, 10]] },
    { id: 'france', flag: '🇫🇷', name: 'France', language: 'French', skin: 'light', hair: 'europe', mom: 'Maman', dad: 'Papa',
      names: { boy: ['Louis', 'Hugo', 'Jules', 'Gabriel', 'Lucas', 'Théo'], girl: ['Camille', 'Léa', 'Chloé', 'Manon', 'Inès', 'Jade'] }, cuisines: ['french', 'deli'],
      phrases: [['Bonjour !', 'Hello / Good morning'], ['Merci', 'Thank you'], ['Je t’aime', 'I love you'], ['Bonne nuit', 'Good night'], ['Bon appétit !', 'Enjoy your meal!'], ['À demain', 'See you tomorrow'], ['Bravo, mon chou !', 'Well done, my little cabbage (a sweet nickname)']],
      foods: ['Brie', 'Crêpe Mix', 'Jam', 'Eggplant', 'Zucchini'],
      recipes: [['Crêpes with Jam', '🥞', ['Crêpe Mix', 'Jam', 'Eggs'], 36, 0, 10], ['Baguette & Brie', '🥖', ['Baguette', 'Brie'], 34, 1, 9], ['Ratatouille', '🍆', ['Eggplant', 'Zucchini', 'Tomatoes'], 36, 7, 7]] },
    { id: 'spain', flag: '🇪🇸', name: 'Spain', language: 'Spanish', skin: 'fair', hair: 'dark', mom: 'Mamá', dad: 'Papá',
      names: { boy: ['Pablo', 'Álvaro', 'Hugo', 'Daniel', 'Carlos', 'Adrián'], girl: ['Lucía', 'Paula', 'Carmen', 'Marta', 'Elena', 'Alba'] }, cuisines: ['seafood'],
      phrases: [['¡Hola!', 'Hello!'], ['Gracias', 'Thank you'], ['Te quiero', 'I love you'], ['Buenas noches', 'Good night'], ['¡Que aproveche!', 'Enjoy your meal!'], ['Hasta luego', 'See you later'], ['¡Vamos!', "Let's go!"]],
      foods: ['Chorizo', 'Shrimp', 'Olive Oil', 'Rice'],
      recipes: [['Tortilla Española', '🍳', ['Potatoes', 'Eggs'], 45, 3, 9], ['Paella', '🥘', ['Rice', 'Shrimp', 'Chorizo'], 60, 3, 11], ['Pan con Tomate', '🍞', ['Baguette', 'Tomatoes', 'Olive Oil'], 30, 3, 8]] },
    { id: 'brazil', flag: '🇧🇷', name: 'Brazil', language: 'Portuguese', skin: 'brazil', hair: 'dark', mom: 'Mãe', dad: 'Pai',
      names: { boy: ['Pedro', 'Gabriel', 'Thiago', 'Rafael', 'Davi', 'Enzo'], girl: ['Beatriz', 'Larissa', 'Júlia', 'Luana', 'Marina', 'Alice'] }, cuisines: ['bbq', 'steak'],
      phrases: [['Bom dia!', 'Good morning!'], ['Obrigado / Obrigada', 'Thank you'], ['Eu te amo', 'I love you'], ['Boa noite', 'Good night'], ['Bom apetite!', 'Enjoy your meal!'], ['Tudo bem?', 'How are you? / All good?'], ['Até amanhã', 'See you tomorrow']],
      foods: ['Rice', 'Beans', 'Cheese Bread Mix', 'Steak'],
      recipes: [['Rice & Beans', '🍚', ['Rice', 'Beans'], 45, 5, 8], ['Feijoada', '🍲', ['Beans', 'Sausages', 'Rice'], 62, 1, 10], ['Pão de Queijo', '🧀', ['Cheese Bread Mix', 'Cheese'], 30, 0, 10], ['Churrasco Plate', '🥩', ['Steak', 'Rice'], 58, 3, 11]] },
    { id: 'philippines', flag: '🇵🇭', name: 'Philippines', language: 'Filipino (Tagalog)', skin: 'warm', hair: 'black', mom: 'Nanay', dad: 'Tatay',
      names: { boy: ['Jose', 'Miguel', 'Paolo', 'Jericho', 'Carlo', 'Rafael'], girl: ['Maria', 'Angelica', 'Joy', 'Bea', 'Nina', 'Isabel'] }, cuisines: ['chicken', 'bbq'],
      phrases: [['Magandang umaga', 'Good morning'], ['Salamat', 'Thank you'], ['Mahal kita', 'I love you'], ['Kain na!', "Let's eat!"], ['Kumusta?', 'How are you?'], ['Opo', 'Yes (said politely to elders)'], ['Tulog na', 'Time to sleep']],
      foods: ['Rice', 'Soy Sauce', 'Noodles', 'Longganisa', 'Ube'],
      recipes: [['Chicken Adobo', '🍗', ['Chicken', 'Soy Sauce', 'Rice'], 58, 3, 11], ['Pancit', '🍜', ['Noodles', 'Carrots', 'Chicken'], 50, 4, 9], ['Longsilog Breakfast', '🍳', ['Longganisa', 'Rice', 'Eggs'], 55, 0, 10]] },
    { id: 'vietnam', flag: '🇻🇳', name: 'Vietnam', language: 'Vietnamese', skin: 'tan', hair: 'black', mom: 'Mẹ', dad: 'Ba',
      names: { boy: ['Minh', 'Anh', 'Khoa', 'Bao', 'Huy', 'Long'], girl: ['Linh', 'Mai', 'Lan', 'Hoa', 'Thu', 'Ngoc'] }, cuisines: ['ramen', 'hotpot'],
      phrases: [['Xin chào', 'Hello'], ['Cảm ơn', 'Thank you'], ['Mẹ yêu con', 'Mom loves you'], ['Chúc ngủ ngon', 'Sleep well'], ['Ăn cơm thôi!', "Let's eat!"], ['Chào buổi sáng', 'Good morning'], ['Giỏi lắm!', 'Very good!']],
      foods: ['Rice', 'Rice Noodles', 'Fish Sauce', 'Herbs'],
      recipes: [['Phở', '🍜', ['Rice Noodles', 'Steak', 'Herbs'], 58, 5, 11], ['Rice Noodle Salad', '🥗', ['Rice Noodles', 'Lettuce', 'Herbs'], 40, 6, 8], ['Egg & Rice Plate', '🍳', ['Rice', 'Eggs', 'Fish Sauce'], 45, 2, 8]] },
    { id: 'nigeria', flag: '🇳🇬', name: 'Nigeria', language: 'Yoruba (and English)', skin: 'deeper', hair: 'black', mom: 'Mama', dad: 'Baba',
      names: { boy: ['Tunde', 'Chidi', 'Emeka', 'Kunle', 'Ade', 'Obinna'], girl: ['Ngozi', 'Amara', 'Funmi', 'Chioma', 'Folake', 'Zainab'] }, cuisines: ['chicken', 'bbq'],
      phrases: [['Ẹ kú àárọ̀', 'Good morning'], ['Ẹ ṣé', 'Thank you'], ['Mo nífẹ̀ẹ́ rẹ', 'I love you'], ['Ẹ káàbọ̀', 'Welcome'], ['Jẹun', 'Eat!'], ['Ẹ kú iṣẹ́', 'Well done on your work'], ['Ó dàárọ̀', 'Good night (until morning)']],
      foods: ['Rice', 'Plantains', 'Yam', 'Pepper Mix'],
      recipes: [['Jollof Rice', '🍛', ['Rice', 'Tomatoes', 'Pepper Mix'], 58, 3, 11], ['Fried Plantain', '🍌', ['Plantains'], 28, 1, 9], ['Yam & Pepper Stew', '🍠', ['Yam', 'Tomatoes', 'Pepper Mix'], 52, 4, 9], ['Suya Skewers', '🍢', ['Steak', 'Pepper Mix'], 42, 2, 10]] },
    { id: 'egypt', flag: '🇪🇬', name: 'Egypt', language: 'Arabic', skin: 'warm', hair: 'black', mom: 'Mama', dad: 'Baba',
      names: { boy: ['Omar', 'Youssef', 'Ahmed', 'Karim', 'Ali', 'Mostafa'], girl: ['Nour', 'Salma', 'Mariam', 'Laila', 'Hana', 'Yasmin'] }, cuisines: ['greek', 'deli'],
      phrases: [['صباح الخير', 'Good morning', 'Sabah el-kheir'], ['شكراً', 'Thank you', 'Shukran'], ['بحبك', 'I love you', 'Bahebbak'], ['تصبح على خير', 'Good night', 'Tesbah ala kheir'], ['بالهنا والشفا', 'Enjoy your meal', 'Bil-hana wish-shifa'], ['أهلاً', 'Hello / Welcome', 'Ahlan'], ['يلا', "Come on! Let's go!", 'Yalla']],
      foods: ['Rice', 'Fava Beans', 'Lentils', 'Pita', 'Chickpeas', 'Tahini'],
      recipes: [['Ful Medames', '🫘', ['Fava Beans', 'Pita'], 45, 6, 8], ['Koshari', '🍚', ['Rice', 'Lentils', 'Tomatoes'], 58, 6, 9], ['Falafel Sandwich', '🧆', ['Chickpeas', 'Pita', 'Tahini'], 48, 4, 9]] },
    { id: 'ethiopia', flag: '🇪🇹', name: 'Ethiopia', language: 'Amharic', skin: 'deep', hair: 'black', mom: 'Emaye', dad: 'Abaye',
      names: { boy: ['Abel', 'Dawit', 'Yonas', 'Kaleb', 'Samuel', 'Biruk'], girl: ['Selam', 'Tigist', 'Hanna', 'Meron', 'Liya', 'Bethlehem'] }, cuisines: ['vegan'],
      phrases: [['ሰላም', 'Hello / Peace', 'Selam'], ['አመሰግናለሁ', 'Thank you', 'Ameseginalehu'], ['ጎበዝ', 'Clever! Well done!', 'Gobez'], ['ቡና እንጠጣ', "Let's have coffee", 'Buna entetta'], ['ደህና እደር', 'Sleep well', 'Dehna eder'], ['ብላ', 'Eat!', 'Bela']],
      foods: ['Injera', 'Lentils', 'Berbere', 'Coffee Beans', 'Chickpeas'],
      recipes: [['Misir Wat & Injera', '🍲', ['Lentils', 'Berbere', 'Injera'], 55, 6, 10], ['Doro Wat & Injera', '🍗', ['Chicken', 'Berbere', 'Injera'], 60, 3, 11], ['Shiro & Injera', '🍲', ['Chickpeas', 'Injera'], 48, 6, 9], ['Buna (Coffee)', '☕', ['Coffee Beans'], 6, 0, 6]] },
    { id: 'germany', flag: '🇩🇪', name: 'Germany', language: 'German', skin: 'light', hair: 'europe', mom: 'Mama', dad: 'Papa',
      names: { boy: ['Lukas', 'Felix', 'Jonas', 'Leon', 'Max', 'Paul'], girl: ['Anna', 'Lena', 'Mia', 'Hannah', 'Clara', 'Lea'] }, cuisines: ['deli', 'diner'],
      phrases: [['Guten Morgen!', 'Good morning!'], ['Danke', 'Thank you'], ['Ich hab dich lieb', 'I love you'], ['Gute Nacht', 'Good night'], ['Guten Appetit!', 'Enjoy your meal!'], ['Bis morgen', 'See you tomorrow'], ['Super gemacht!', 'Well done!']],
      foods: ['Pretzels', 'Sauerkraut', 'Mustard', 'Sausages'],
      recipes: [['Bratwurst & Sauerkraut', '🌭', ['Sausages', 'Sauerkraut', 'Mustard'], 55, 0, 10], ['Pretzel & Cheese', '🥨', ['Pretzels', 'Cheese'], 30, -1, 8], ['Kartoffelsalat', '🥔', ['Potatoes', 'Mustard'], 38, 3, 7], ['Schnitzel', '🍗', ['Chicken', 'Eggs', 'Potatoes'], 62, 1, 11]] },
    { id: 'jamaica', flag: '🇯🇲', name: 'Jamaica', language: 'English & Jamaican Patois', skin: 'deep', hair: 'black', mom: 'Mummy', dad: 'Daddy',
      names: { boy: ['Marcus', 'Jamal', 'Devon', 'Kemar', 'Andre', 'Tyrese'], girl: ['Shanice', 'Keisha', 'Aaliyah', 'Kayla', 'Jada', 'Tanya'] }, cuisines: ['chicken', 'bbq'],
      phrases: [['Wah gwaan?', "What's going on? (hello!)"], ['Mi love yuh', 'I love you'], ['Likkle more', 'See you later'], ['Nuh worry', "Don't worry"], ['Irie', 'All good, feeling great'], ['Nyam!', 'Eat!'], ['Big up yuhself!', 'Well done, be proud!']],
      foods: ['Rice', 'Beans', 'Plantains', 'Jerk Seasoning', 'Coconut Milk'],
      recipes: [['Jerk Chicken', '🍗', ['Chicken', 'Jerk Seasoning'], 52, 2, 11], ['Rice & Peas', '🍚', ['Rice', 'Beans', 'Coconut Milk'], 52, 4, 9], ['Fried Plantain', '🍌', ['Plantains'], 28, 1, 9]] },
    { id: 'turkey', flag: '🇹🇷', name: 'Türkiye (Turkey)', language: 'Turkish', skin: 'tan', hair: 'dark', mom: 'Anne', dad: 'Baba',
      names: { boy: ['Emre', 'Mert', 'Can', 'Efe', 'Burak', 'Yusuf'], girl: ['Elif', 'Zeynep', 'Defne', 'Ayşe', 'Deniz', 'Selin'] }, cuisines: ['greek', 'steak'],
      phrases: [['Günaydın', 'Good morning'], ['Teşekkürler', 'Thank you'], ['Seni seviyorum', 'I love you'], ['İyi geceler', 'Good night'], ['Afiyet olsun', 'Enjoy your meal'], ['Merhaba', 'Hello'], ['Hoş geldin', 'Welcome']],
      foods: ['Pide Bread', 'White Cheese', 'Olives', 'Lamb', 'Black Tea'],
      recipes: [['Menemen', '🍳', ['Eggs', 'Tomatoes'], 40, 3, 9], ['Lamb Kebab Wrap', '🥙', ['Lamb', 'Pide Bread', 'Yogurt'], 58, 2, 11], ['Turkish Breakfast', '🧀', ['White Cheese', 'Olives', 'Pide Bread'], 42, 3, 9], ['Çay (Tea)', '🍵', ['Black Tea'], 5, 1, 6]] }
];
// ---- 20 more countries (so there are 40 to choose from) ----
Object.assign(HG_ITEMS, {
    'Cheese Curds': ['🧀', 5, 10], 'Gravy': ['🍲', 3, 20], 'Baked Beans': ['🫘', 3, 365], 'Crumpets': ['🥞', 3, 7], 'Soda Bread Mix': ['🍞', 4, 180], 'Oats': ['🥣', 3, 365],
    'Vegemite': ['🥣', 4, 365], 'Meat Pie': ['🥧', 5, 60], 'Lamingtons': ['🍰', 4, 5], 'Pierogi': ['🥟', 6, 60], 'Kielbasa': ['🌭', 5, 30], 'Beets': ['🥬', 3, 14],
    'Sour Cream': ['🥛', 3, 14], 'Salt Cod': ['🐟', 8, 60], 'Custard Tarts': ['🥧', 4, 4], 'Dulce de Leche': ['🍯', 4, 180], 'Empanadas': ['🥟', 6, 60], 'Yerba Mate': ['🍵', 4, 365],
    'Arepas': ['🫓', 4, 7], 'Limes': ['🍋', 3, 14], 'Quinoa': ['🌾', 4, 365], 'Sambal': ['🌶️', 3, 120], 'Peanut Sauce': ['🥜', 3, 120], 'Tempeh': ['🧊', 3, 10],
    'Maize Flour': ['🌽', 3, 365], 'Kale': ['🥬', 3, 6], 'Chapati': ['🫓', 3, 6], 'Meatballs': ['🧆', 6, 60], 'Crispbread': ['🍞', 3, 120], 'Cinnamon Buns': ['🥐', 3, 3],
    'Stroopwafels': ['🍪', 4, 60], 'Gouda': ['🧀', 5, 30], 'Chocolate Sprinkles': ['🍫', 3, 180], 'Buckwheat': ['🌾', 3, 365], 'Pickles': ['🥒', 3, 120], 'Saffron': ['🌼', 8, 365],
    'Cucumber': ['🥒', 2, 7], 'Boerewors': ['🌭', 6, 30], 'Rooibos Tea': ['🍵', 4, 365], 'Biltong': ['🥩', 6, 60]
});
HERITAGES.push(
    { id: 'canada', flag: '🇨🇦', name: 'Canada', language: 'English & French', skin: 'mixed', hair: 'usa', mom: 'Mom', dad: 'Dad', names: null, cuisines: ['diner', 'burger'],
      phrases: [['Bonjour!', 'Hello! (in French)'], ['Merci', 'Thank you (French)'], ['Sorry!', 'Said a lot in Canada'], ['Bonne nuit', 'Good night (French)'], ['Eh?', 'Right? (a Canadian "huh?")'], ['Time for pancakes!', 'Breakfast!'], ['Au revoir', 'Goodbye (French)']],
      foods: ['Maple Syrup', 'Pancake Mix', 'Cheese Curds', 'Gravy'],
      recipes: [['Poutine', '🍟', ['Frozen Fries', 'Cheese Curds', 'Gravy'], 55, -2, 11], ['Maple Pancakes', '🥞', ['Pancake Mix', 'Maple Syrup', 'Eggs'], 40, 0, 10], ['Maple Toast', '🍞', ['Bread', 'Maple Syrup', 'Butter'], 30, 0, 8]] },
    { id: 'uk', flag: '🇬🇧', name: 'United Kingdom', language: 'English', skin: 'mixed', hair: 'europe', mom: 'Mum', dad: 'Dad', names: { boy: ['Oliver', 'George', 'Harry', 'Jack', 'Archie', 'Oscar'], girl: ['Olivia', 'Amelia', 'Isla', 'Poppy', 'Freya', 'Ivy'] }, cuisines: ['diner', 'deli'],
      phrases: [['Cheers!', 'Thanks!'], ['Brilliant!', 'Great!'], ['Fancy a cuppa?', 'Would you like a cup of tea?'], ['Lovely', 'Nice'], ['Night night', 'Good night'], ['Right, tea time!', "It's time to eat"], ['Mind the gap!', 'Watch your step (on the Tube)']],
      foods: ['Black Tea', 'Baked Beans', 'Crumpets', 'Sausages'],
      recipes: [['Beans on Toast', '🍞', ['Baked Beans', 'Bread'], 36, 3, 7], ['Bangers & Mash', '🌭', ['Sausages', 'Potatoes', 'Gravy'], 58, 0, 10], ['Crumpets & Tea', '🍵', ['Crumpets', 'Black Tea', 'Butter'], 30, 1, 9]] },
    { id: 'ireland', flag: '🇮🇪', name: 'Ireland', language: 'English & Irish (Gaeilge)', skin: 'light', hair: 'europe', mom: 'Mam', dad: 'Dad', names: { boy: ['Conor', 'Seán', 'Cian', 'Oisín', 'Darragh', 'Liam'], girl: ['Aoife', 'Niamh', 'Saoirse', 'Ciara', 'Orla', 'Róisín'] }, cuisines: ['diner', 'deli'],
      phrases: [['Dia duit', 'Hello (God be with you)'], ['Go raibh maith agat', 'Thank you'], ['Slán', 'Goodbye'], ['Oíche mhaith', 'Good night'], ['Sláinte!', 'Cheers! (Health!)'], ['Céad míle fáilte', 'A hundred thousand welcomes'], ['Conas atá tú?', 'How are you?']],
      foods: ['Soda Bread Mix', 'Oats', 'Lamb', 'Butter'],
      recipes: [['Irish Soda Bread', '🍞', ['Soda Bread Mix', 'Butter'], 32, 1, 9], ['Porridge', '🥣', ['Oats', 'Milk'], 30, 5, 7], ['Irish Stew', '🍲', ['Lamb', 'Potatoes', 'Carrots'], 62, 4, 11], ['Buttery Mash', '🥔', ['Potatoes', 'Butter'], 38, 1, 8]] },
    { id: 'australia', flag: '🇦🇺', name: 'Australia', language: 'English (Aussie)', skin: 'mixed', hair: 'usa', mom: 'Mum', dad: 'Dad', names: null, cuisines: ['bbq', 'seafood'],
      phrases: [["G'day!", 'Hello!'], ['No worries!', "That's fine!"], ['Good on ya!', 'Well done!'], ['Ta', 'Thanks'], ['Fair dinkum?', 'Really? Honestly?'], ["See ya later, mate", 'Goodbye, friend'], ["Let's have a barbie", "Let's have a barbecue"]],
      foods: ['Vegemite', 'Meat Pie', 'Lamingtons', 'Sausages'],
      recipes: [['Vegemite Toast', '🍞', ['Vegemite', 'Bread', 'Butter'], 30, 1, 7], ['Meat Pie', '🥧', ['Meat Pie'], 45, -1, 9], ['Barbie Snag Sandwich', '🌭', ['Sausages', 'Bread'], 42, -1, 9], ['Lamington Treat', '🍰', ['Lamingtons'], 15, -2, 9]] },
    { id: 'poland', flag: '🇵🇱', name: 'Poland', language: 'Polish', skin: 'light', hair: 'europe', mom: 'Mama', dad: 'Tata', names: { boy: ['Jakub', 'Antoni', 'Szymon', 'Filip', 'Jan', 'Michał'], girl: ['Zuzanna', 'Maja', 'Julia', 'Hanna', 'Lena', 'Oliwia'] }, cuisines: ['deli', 'diner'],
      phrases: [['Dzień dobry', 'Good day / Hello'], ['Dziękuję', 'Thank you'], ['Kocham cię', 'I love you'], ['Dobranoc', 'Good night'], ['Smacznego!', 'Enjoy your meal!'], ['Cześć', 'Hi / Bye'], ['Do jutra', 'See you tomorrow']],
      foods: ['Pierogi', 'Kielbasa', 'Beets', 'Sour Cream', 'Sauerkraut'],
      recipes: [['Pierogi', '🥟', ['Pierogi', 'Sour Cream'], 48, 1, 11], ['Kielbasa & Sauerkraut', '🌭', ['Kielbasa', 'Sauerkraut'], 52, 0, 10], ['Barszcz (Beet Soup)', '🍲', ['Beets', 'Potatoes', 'Sour Cream'], 45, 5, 8]] },
    { id: 'portugal', flag: '🇵🇹', name: 'Portugal', language: 'Portuguese', skin: 'fair', hair: 'dark', mom: 'Mãe', dad: 'Pai', names: { boy: ['João', 'Tiago', 'Rodrigo', 'Diogo', 'Miguel', 'Duarte'], girl: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Inês', 'Carolina'] }, cuisines: ['seafood'],
      phrases: [['Bom dia!', 'Good morning!'], ['Obrigado / Obrigada', 'Thank you'], ['Amo-te', 'I love you'], ['Boa noite', 'Good night'], ['Bom apetite!', 'Enjoy your meal!'], ['Olá!', 'Hello!'], ['Até já', 'See you soon']],
      foods: ['Salt Cod', 'Custard Tarts', 'Olive Oil', 'Rice'],
      recipes: [['Bacalhau com Batatas', '🐟', ['Salt Cod', 'Potatoes', 'Olive Oil'], 58, 5, 10], ['Pastéis de Nata', '🥧', ['Custard Tarts'], 18, -1, 10], ['Arroz de Marisco', '🍚', ['Rice', 'Shrimp'], 55, 4, 10]] },
    { id: 'argentina', flag: '🇦🇷', name: 'Argentina', language: 'Spanish', skin: 'fair', hair: 'dark', mom: 'Mamá', dad: 'Papá', names: { boy: ['Benjamín', 'Santino', 'Thiago', 'Lautaro', 'Joaquín', 'Mateo'], girl: ['Martina', 'Emma', 'Catalina', 'Mía', 'Julieta', 'Abril'] }, cuisines: ['steak', 'bbq'],
      phrases: [['¡Che, hola!', 'Hey, hello!'], ['Gracias', 'Thank you'], ['Te quiero', 'I love you'], ['Buenas noches', 'Good night'], ['¡Buen provecho!', 'Enjoy your meal!'], ['Dale', 'OK! Sure!'], ['¡Qué lindo!', 'How nice!']],
      foods: ['Steak', 'Dulce de Leche', 'Empanadas', 'Yerba Mate'],
      recipes: [['Asado Plate', '🥩', ['Steak', 'Potatoes'], 60, 2, 11], ['Empanadas', '🥟', ['Empanadas'], 38, 0, 10], ['Dulce de Leche Toast', '🍞', ['Dulce de Leche', 'Bread'], 30, -1, 10], ['Mate', '🍵', ['Yerba Mate'], 5, 1, 6]] },
    { id: 'colombia', flag: '🇨🇴', name: 'Colombia', language: 'Spanish', skin: 'latin', hair: 'dark', mom: 'Mamá', dad: 'Papá', names: { boy: ['Samuel', 'Santiago', 'Sebastián', 'Mateo', 'Emmanuel', 'Juan'], girl: ['Sara', 'Valeria', 'Luciana', 'Mariana', 'Salomé', 'Isabella'] }, cuisines: ['chicken'],
      phrases: [['¡Buenos días!', 'Good morning!'], ['Mil gracias', 'Thanks a million'], ['Te quiero mucho', 'I love you very much'], ['Buenas noches', 'Good night'], ['¡Buen provecho!', 'Enjoy your meal!'], ['¿Qué más?', "What's up?"], ['¡Qué chévere!', 'How cool!']],
      foods: ['Arepas', 'Plantains', 'Beans', 'Rice', 'Coffee Beans'],
      recipes: [['Arepa con Queso', '🫓', ['Arepas', 'Cheese'], 38, 0, 10], ['Rice, Beans & Plantain', '🍚', ['Rice', 'Beans', 'Plantains'], 58, 4, 9], ['Ajiaco Soup', '🍲', ['Chicken', 'Potatoes', 'Corn'], 60, 4, 10], ['Tinto (Coffee)', '☕', ['Coffee Beans'], 5, 0, 6]] },
    { id: 'peru', flag: '🇵🇪', name: 'Peru', language: 'Spanish', skin: 'latin', hair: 'black', mom: 'Mamá', dad: 'Papá', names: { boy: ['Mateo', 'Thiago', 'Gael', 'Diego', 'Jhon', 'Joaquín'], girl: ['Valentina', 'Camila', 'Luciana', 'Alessia', 'Ariana', 'Xiomara'] }, cuisines: ['seafood'],
      phrases: [['¡Buenos días!', 'Good morning!'], ['Gracias', 'Thank you'], ['Te quiero', 'I love you'], ['Buenas noches', 'Good night'], ['¡Buen provecho!', 'Enjoy your meal!'], ['¿Cómo estás?', 'How are you?'], ['¡Chévere!', 'Cool!']],
      foods: ['Fish', 'Limes', 'Quinoa', 'Potatoes', 'Corn'],
      recipes: [['Ceviche', '🐟', ['Fish', 'Limes', 'Corn'], 40, 7, 10], ['Lomo Saltado', '🥩', ['Steak', 'Potatoes', 'Rice'], 62, 2, 11], ['Quinoa Salad', '🥗', ['Quinoa', 'Tomatoes'], 36, 7, 7]] },
    { id: 'pakistan', flag: '🇵🇰', name: 'Pakistan', language: 'Urdu', skin: 'brown', hair: 'black', mom: 'Ammi', dad: 'Abbu', names: { boy: ['Ali', 'Hamza', 'Ahmed', 'Bilal', 'Zain', 'Usman'], girl: ['Ayesha', 'Fatima', 'Zainab', 'Maryam', 'Hira', 'Sana'] }, cuisines: ['indian'],
      phrases: [['السلام علیکم', 'Hello (peace be upon you)', 'Assalam alaikum'], ['شکریہ', 'Thank you', 'Shukriya'], ['خدا حافظ', 'Goodbye', 'Khuda hafiz'], ['شب بخیر', 'Good night', 'Shab bakhair'], ['کھانا کھا لو', 'Eat your food', 'Khaana kha lo'], ['بہت اچھا', 'Very good', 'Bohat acha'], ['خوش آمدید', 'Welcome', 'Khush aamdeed']],
      foods: ['Rice', 'Lentils', 'Naan', 'Chickpeas', 'Curry Spice', 'Yogurt'],
      recipes: [['Chicken Biryani', '🍛', ['Rice', 'Chicken', 'Curry Spice'], 62, 3, 11], ['Daal Chawal', '🍛', ['Lentils', 'Rice'], 48, 6, 8], ['Chana & Naan', '🍛', ['Chickpeas', 'Naan'], 46, 6, 8], ['Chicken Karahi', '🍗', ['Chicken', 'Tomatoes', 'Curry Spice'], 56, 3, 10]] },
    { id: 'indonesia', flag: '🇮🇩', name: 'Indonesia', language: 'Indonesian', skin: 'warm', hair: 'black', mom: 'Ibu', dad: 'Ayah', names: { boy: ['Budi', 'Dimas', 'Rizky', 'Andi', 'Bayu', 'Agus'], girl: ['Putri', 'Sari', 'Dewi', 'Ayu', 'Rina', 'Wulan'] }, cuisines: ['thai'],
      phrases: [['Selamat pagi', 'Good morning'], ['Terima kasih', 'Thank you'], ['Aku sayang kamu', 'I love you'], ['Selamat malam', 'Good night'], ['Selamat makan', 'Enjoy your meal'], ['Apa kabar?', 'How are you?'], ['Sampai jumpa', 'See you']],
      foods: ['Rice', 'Noodles', 'Sambal', 'Peanut Sauce', 'Tempeh'],
      recipes: [['Nasi Goreng', '🍚', ['Rice', 'Eggs', 'Sambal'], 55, 2, 11], ['Mie Goreng', '🍜', ['Noodles', 'Eggs', 'Sambal'], 52, 1, 10], ['Satay & Peanut Sauce', '🍢', ['Chicken', 'Peanut Sauce'], 46, 2, 10], ['Tempeh & Rice', '🍚', ['Tempeh', 'Rice'], 46, 6, 8]] },
    { id: 'kenya', flag: '🇰🇪', name: 'Kenya', language: 'Swahili (and English)', skin: 'deep', hair: 'black', mom: 'Mama', dad: 'Baba', names: { boy: ['Kamau', 'Otieno', 'Juma', 'Baraka', 'Kip', 'Wanyama'], girl: ['Wanjiru', 'Achieng', 'Amani', 'Zawadi', 'Neema', 'Njeri'] }, cuisines: ['chicken', 'bbq'],
      phrases: [['Habari za asubuhi', 'Good morning'], ['Asante', 'Thank you'], ['Nakupenda', 'I love you'], ['Usiku mwema', 'Good night'], ['Karibu', 'Welcome'], ['Chakula tayari', 'Food is ready'], ['Pole pole', 'Slowly, slowly (no rush)']],
      foods: ['Maize Flour', 'Kale', 'Chapati', 'Beans', 'Black Tea', 'Rice'],
      recipes: [['Ugali & Sukuma', '🌽', ['Maize Flour', 'Kale'], 52, 6, 8], ['Chapati & Beans', '🫓', ['Chapati', 'Beans'], 50, 4, 9], ['Pilau Rice', '🍛', ['Rice', 'Chicken', 'Curry Spice'], 58, 3, 11], ['Chai', '🍵', ['Black Tea', 'Milk'], 8, 1, 7]] },
    { id: 'lebanon', flag: '🇱🇧', name: 'Lebanon', language: 'Arabic', skin: 'tan', hair: 'dark', mom: 'Mama', dad: 'Baba', names: { boy: ['Karim', 'Elie', 'Georges', 'Rami', 'Nabil', 'Tony'], girl: ['Layla', 'Maya', 'Nour', 'Rima', 'Lina', 'Dalia'] }, cuisines: ['greek'],
      phrases: [['مرحبا', 'Hello', 'Marhaba'], ['شكراً', 'Thank you', 'Shukran'], ['بحبك', 'I love you', 'Bhebbak'], ['تصبحوا على خير', 'Good night (to everyone)', 'Tesbahou ala khair'], ['صحتين', 'Enjoy your meal (two healths!)', 'Sahtein'], ['صباح الخير', 'Good morning', 'Sabah el-khair'], ['يلا', "Come on! Let's go!", 'Yalla']],
      foods: ['Pita', 'Chickpeas', 'Tahini', 'Olive Oil', 'Herbs'],
      recipes: [['Hummus & Pita', '🫓', ['Chickpeas', 'Tahini', 'Pita'], 42, 5, 9], ['Tabbouleh', '🥗', ['Herbs', 'Tomatoes', 'Olive Oil'], 26, 7, 8], ['Chicken Shawarma Wrap', '🌯', ['Chicken', 'Pita', 'Yogurt'], 52, 3, 11]] },
    { id: 'sweden', flag: '🇸🇪', name: 'Sweden', language: 'Swedish', skin: 'light', hair: 'europe', mom: 'Mamma', dad: 'Pappa', names: { boy: ['Lucas', 'Hugo', 'Oscar', 'Elias', 'Axel', 'Noel'], girl: ['Alice', 'Maja', 'Elsa', 'Ella', 'Wilma', 'Astrid'] }, cuisines: ['deli'],
      phrases: [['God morgon', 'Good morning'], ['Tack', 'Thank you'], ['Jag älskar dig', 'I love you'], ['God natt', 'Good night'], ['Smaklig måltid', 'Enjoy your meal'], ['Hej!', 'Hi!'], ['Vi ses', 'See you']],
      foods: ['Meatballs', 'Crispbread', 'Cinnamon Buns', 'Potatoes', 'Jam'],
      recipes: [['Meatballs & Potatoes', '🧆', ['Meatballs', 'Potatoes', 'Jam'], 60, 1, 11], ['Cinnamon Bun', '🥐', ['Cinnamon Buns'], 20, -2, 10], ['Crispbread & Cheese', '🍞', ['Crispbread', 'Cheese'], 28, 2, 7]] },
    { id: 'netherlands', flag: '🇳🇱', name: 'Netherlands', language: 'Dutch', skin: 'light', hair: 'europe', mom: 'Mama', dad: 'Papa', names: { boy: ['Daan', 'Sem', 'Luuk', 'Finn', 'Jesse', 'Bram'], girl: ['Emma', 'Sanne', 'Lotte', 'Fleur', 'Noor', 'Tess'] }, cuisines: ['deli', 'diner'],
      phrases: [['Goedemorgen', 'Good morning'], ['Dank je wel', 'Thank you'], ['Ik hou van je', 'I love you'], ['Welterusten', 'Sleep well'], ['Eet smakelijk', 'Enjoy your meal'], ['Hallo!', 'Hello!'], ['Tot morgen', 'See you tomorrow']],
      foods: ['Stroopwafels', 'Gouda', 'Chocolate Sprinkles', 'Black Tea'],
      recipes: [['Bread with Sprinkles', '🍞', ['Bread', 'Chocolate Sprinkles', 'Butter'], 32, -1, 10], ['Gouda Sandwich', '🥪', ['Bread', 'Gouda'], 34, 1, 8], ['Stroopwafel & Tea', '🍵', ['Stroopwafels', 'Black Tea'], 20, 0, 9], ['Stamppot', '🥔', ['Potatoes', 'Carrots', 'Sausages'], 58, 3, 9]] },
    { id: 'ukraine', flag: '🇺🇦', name: 'Ukraine', language: 'Ukrainian', skin: 'light', hair: 'europe', mom: 'Mama', dad: 'Tato', names: { boy: ['Andriy', 'Oleksandr', 'Taras', 'Bohdan', 'Maksym', 'Dmytro'], girl: ['Olena', 'Sofiia', 'Oksana', 'Kateryna', 'Daryna', 'Mariia'] }, cuisines: ['deli', 'diner'],
      phrases: [['Доброго ранку', 'Good morning', 'Dobroho ranku'], ['Дякую', 'Thank you', 'Dyakuyu'], ['Я тебе люблю', 'I love you', 'Ya tebe lyublyu'], ['На добраніч', 'Good night', 'Na dobranich'], ['Смачного!', 'Enjoy your meal!', 'Smachnoho'], ['Привіт', 'Hello', 'Pryvit'], ['До завтра', 'See you tomorrow', 'Do zavtra']],
      foods: ['Beets', 'Sour Cream', 'Dumplings', 'Buckwheat', 'Potatoes'],
      recipes: [['Borscht', '🍲', ['Beets', 'Potatoes', 'Sour Cream'], 50, 5, 10], ['Varenyky', '🥟', ['Dumplings', 'Sour Cream'], 46, 1, 10], ['Buckwheat Porridge', '🥣', ['Buckwheat', 'Butter'], 40, 4, 7]] },
    { id: 'russia', flag: '🇷🇺', name: 'Russia', language: 'Russian', skin: 'light', hair: 'europe', mom: 'Mama', dad: 'Papa', names: { boy: ['Ivan', 'Dmitri', 'Alexei', 'Nikolai', 'Sasha', 'Misha'], girl: ['Anastasia', 'Natasha', 'Olga', 'Katya', 'Sonya', 'Vera'] }, cuisines: ['deli'],
      phrases: [['Доброе утро', 'Good morning', 'Dobroye utro'], ['Спасибо', 'Thank you', 'Spasibo'], ['Я тебя люблю', 'I love you', 'Ya tebya lyublyu'], ['Спокойной ночи', 'Good night', 'Spokoynoy nochi'], ['Приятного аппетита', 'Enjoy your meal', 'Priyatnogo appetita'], ['Привет', 'Hi', 'Privet'], ['До завтра', 'See you tomorrow', 'Do zavtra']],
      foods: ['Beets', 'Sour Cream', 'Dumplings', 'Buckwheat', 'Pickles', 'Black Tea'],
      recipes: [['Pelmeni', '🥟', ['Dumplings', 'Sour Cream'], 48, 1, 10], ['Blini', '🥞', ['Pancake Mix', 'Sour Cream', 'Eggs'], 40, 0, 9], ['Borscht', '🍲', ['Beets', 'Potatoes', 'Sour Cream'], 50, 5, 9], ['Tea & Pickles', '🥒', ['Black Tea', 'Pickles'], 12, 1, 6]] },
    { id: 'iran', flag: '🇮🇷', name: 'Iran', language: 'Persian (Farsi)', skin: 'tan', hair: 'dark', mom: 'Maman', dad: 'Baba', names: { boy: ['Reza', 'Ali', 'Arash', 'Kian', 'Parsa', 'Sina'], girl: ['Parisa', 'Shirin', 'Yasaman', 'Neda', 'Sara', 'Mina'] }, cuisines: ['greek', 'steak'],
      phrases: [['صبح بخیر', 'Good morning', 'Sobh bekheir'], ['ممنون', 'Thank you', 'Mamnoon'], ['دوستت دارم', 'I love you', 'Dooset daram'], ['شب بخیر', 'Good night', 'Shab bekheir'], ['نوش جان', 'Enjoy your meal', 'Noosh-e jan'], ['سلام', 'Hello', 'Salam'], ['خداحافظ', 'Goodbye', 'Khodahafez']],
      foods: ['Rice', 'Lamb', 'Saffron', 'Yogurt', 'Cucumber', 'Naan'],
      recipes: [['Saffron Chicken & Rice', '🍚', ['Rice', 'Chicken', 'Saffron'], 62, 4, 11], ['Kebab & Rice', '🍢', ['Lamb', 'Rice'], 60, 2, 11], ['Yogurt & Cucumber', '🥒', ['Yogurt', 'Cucumber'], 20, 5, 7], ['Naan & Cheese', '🫓', ['Naan', 'Cheese'], 34, 1, 8]] },
    { id: 'southafrica', flag: '🇿🇦', name: 'South Africa', language: 'Zulu & English', skin: 'mixed', hair: 'usa', mom: 'Mama', dad: 'Papa', names: { boy: ['Thabo', 'Sipho', 'Liam', 'Tyler', 'Themba', 'Jaco'], girl: ['Naledi', 'Lerato', 'Amahle', 'Chloe', 'Zanele', 'Anika'] }, cuisines: ['bbq', 'steak'],
      phrases: [['Sawubona', 'Hello (I see you)'], ['Ngiyabonga', 'Thank you'], ['Ngiyakuthanda', 'I love you'], ['Ulale kahle', 'Sleep well'], ['Lekker!', 'Great! Tasty! (Afrikaans)'], ["It's braai time!", "Let's barbecue"], ['Eish!', 'Oh no! / Wow!']],
      foods: ['Boerewors', 'Maize Flour', 'Rooibos Tea', 'Biltong'],
      recipes: [['Boerewors Roll', '🌭', ['Boerewors', 'Bread'], 46, -1, 10], ['Pap & Beef Stew', '🍲', ['Maize Flour', 'Steak', 'Tomatoes'], 62, 3, 10], ['Biltong Snack', '🥩', ['Biltong'], 14, 1, 7], ['Rooibos Tea', '🍵', ['Rooibos Tea'], 5, 1, 6]] },
    { id: 'cuba', flag: '🇨🇺', name: 'Cuba', language: 'Spanish', skin: 'brazil', hair: 'dark', mom: 'Mami', dad: 'Papi', names: { boy: ['Carlos', 'Yoel', 'Alejandro', 'Raúl', 'Dayron', 'Luis'], girl: ['Yaritza', 'Camila', 'Daniela', 'Lisandra', 'Maite', 'Ana'] }, cuisines: ['chicken', 'bbq'],
      phrases: [['¡Buenos días!', 'Good morning!'], ['Gracias', 'Thank you'], ['Te quiero', 'I love you'], ['Buenas noches', 'Good night'], ['¡Buen provecho!', 'Enjoy your meal!'], ['¡Qué rico!', 'How delicious!'], ['¿Qué bolá?', "What's up? (Cuban hello)"]],
      foods: ['Rice', 'Beans', 'Plantains', 'Ham'],
      recipes: [['Moros y Cristianos', '🍚', ['Rice', 'Beans'], 52, 4, 9], ['Fried Plantains', '🍌', ['Plantains'], 28, 1, 9], ['Cuban Sandwich', '🥪', ['Bread', 'Ham', 'Cheese'], 50, 0, 11], ['Ropa Vieja', '🥩', ['Steak', 'Tomatoes', 'Rice'], 62, 3, 11]] }
);
HERITAGES.sort((a, b) => a.name.localeCompare(b.name));

function hgFind(id) { return HERITAGES.find(h => h.id === id) || null; }
function hgCur() { return typeof player !== 'undefined' && player && player.heritage ? hgFind(player.heritage) : null; }

// ---------- look ----------
// heritageLook('player' | 'mom' | 'dad') -> { skin, hair } or null (old saves keep their original look)
function heritageLook(role) {
    const H = hgCur(); if (!H) return null;
    const tones = HG_SKIN[H.skin] || HG_SKIN.mixed, hairs = HG_HAIR[H.hair] || HG_HAIR.dark;
    const pi = Math.max(0, tones.indexOf(player.skin));
    if (role === 'player') return { skin: player.skin || tones[0], hair: player.hair || hairs[0] };
    if (role === 'mom') return { skin: tones[(pi + 1) % tones.length], hair: hairs[0] };
    return { skin: tones[(pi + 2) % tones.length], hair: hairs[hairs.length > 1 ? 1 : 0] };
}

// ---------- applying a heritage (foods) ----------
function heritageApply() {
    Object.keys(HG_ITEMS).forEach(n => { if (SHELF_LIFE[n] === undefined) SHELF_LIFE[n] = HG_ITEMS[n][2]; });
    for (let i = FOOD_RECIPES.length - 1; i >= 0; i--) if (FOOD_RECIPES[i].heritage) FOOD_RECIPES.splice(i, 1);     // (a previous game's recipes)
    const H = hgCur(); if (!H) return;
    H.recipes.forEach(r => FOOD_RECIPES.push({ name: r[0], emoji: r[1], need: r[2], full: r[3], health: r[4], hap: r[5], heritage: H.id }));
}
// an item for the store stand / fridge: the heritage table first, then the everyday groceries the store already sells (Steak, Potatoes, Yogurt...)
function hgItem(name) {
    const it = HG_ITEMS[name];
    if (it) return { name, emoji: it[0], price: it[1], color: 0xD7B98A };
    let std = (typeof GROCERY_ITEMS !== 'undefined' ? GROCERY_ITEMS : []).find(g => g.name === name);
    if (!std && typeof STORE_DEPT_ITEMS !== 'undefined') std = [].concat.apply([], Object.values(STORE_DEPT_ITEMS)).find(g => g.name === name);
    if (!std) std = STARTER_GROCERIES.find(g => g.name === name);
    return std ? { name, emoji: std.emoji, price: std.price || 4, color: std.color || 0xD7B98A } : { name, emoji: '🍽️', price: 4, color: 0xD7B98A };
}

// ---------- the picker ----------
let hgPendingGender = null;
function hgPickRandom(a) { return a[Math.floor(Math.random() * a.length)]; }

function hgChoose(id, gender) {
    const H = hgFind(id) || hgPickRandom(HERITAGES);
    const tones = HG_SKIN[H.skin], hairs = HG_HAIR[H.hair];
    player.heritage = H.id; player.skin = hgPickRandom(tones); player.hair = hgPickRandom(hairs); player.words = [];
    heritageApply();
    const el = document.getElementById('hg-picker'); if (el) el.remove();
    const saved = NAMES[gender];
    if (H.names) NAMES[gender] = H.names[gender];
    try { hgOrigStart(gender); } finally { NAMES[gender] = saved; }
    setTimeout(() => showEvent(H.flag, `Your family is from ${H.name}! Home language: ${H.language}.`), 2600);
}

function hgOpenPicker(gender) {
    if (document.getElementById('hg-picker')) return;
    const p = document.createElement('div');
    p.id = 'hg-picker';
    p.style.cssText = 'position:fixed; inset:0; z-index:500; background:rgba(8,12,28,0.94); display:flex; align-items:center; justify-content:center; color:#fff; font-family:inherit;';
    const cards = HERITAGES.map(h => `<button data-id="${h.id}" style="background:#16213e; color:#fff; border:2px solid #2c3e60; border-radius:10px; padding:8px 6px; cursor:pointer; font-size:0.85em; text-align:center;"><div style="font-size:1.6em">${h.flag}</div>${h.name}</button>`).join('');
    p.innerHTML = `<div style="width:min(720px,94vw); max-height:94vh; overflow-y:auto; padding:16px;">
        <h2 style="margin:0 0 4px; text-align:center;">🌍 Where is your family from?</h2>
        <div style="text-align:center; opacity:0.75; margin-bottom:12px; font-size:0.9em;">This picks your skin tone, your family's language, your home foods and your name. It doesn't change how the game is played.</div>
        <input id="hg-search" placeholder="🔍 Search a country or language…" style="width:100%; box-sizing:border-box; margin-bottom:8px; padding:8px 10px; border-radius:8px; border:2px solid #3498db; background:#0f3460; color:#fff;">
        <div id="hg-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; max-height:34vh; overflow-y:auto;">${cards}</div>
        <div id="hg-card" style="margin-top:12px; background:#0f3460; border:2px solid #3498db; border-radius:12px; padding:12px; min-height:90px; font-size:0.92em;">Tap a country to see what your family would be like.</div>
        <div style="display:flex; gap:10px; margin-top:12px;">
            <button id="hg-random" style="flex:1; padding:10px; border-radius:10px; border:1px solid #f1c40f; background:#2c3e50; color:#f1c40f; cursor:pointer;">🎲 Surprise me!</button>
            <button id="hg-go" disabled style="flex:1; padding:10px; border-radius:10px; border:none; background:#2ecc71; color:#fff; font-weight:bold; cursor:pointer; opacity:0.5;">▶ Start</button>
            <button id="hg-back" style="padding:10px 14px; border-radius:10px; border:1px solid #7f8c8d; background:transparent; color:#fff; cursor:pointer;">← Back</button>
        </div></div>`;
    document.body.appendChild(p);
    let chosen = null;
    p.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => {
        chosen = b.dataset.id;
        p.querySelectorAll('button[data-id]').forEach(x => x.style.borderColor = x === b ? '#3498db' : '#2c3e60');
        const H = hgFind(chosen), sw = HG_SKIN[H.skin].map(c => `<span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:#${c.toString(16).padStart(6, '0')};border:1px solid #fff4"></span>`).join(' ');
        document.getElementById('hg-card').innerHTML = `<div style="font-size:1.15em"><b>${H.flag} ${H.name}</b></div>
            <div>🗣️ Language: <b>${H.language}</b> — “${H.phrases[0][0]}” <span style="opacity:0.7">(${H.phrases[0][1]})</span></div>
            <div>🎨 Skin tones: ${sw} <span style="opacity:0.6">(one is picked for you)</span></div>
            <div>🍲 Home foods: ${H.recipes.map(r => r[1] + ' ' + r[0]).join(' · ')}</div>
            <div>🏷️ Names like: ${(H.names ? H.names[gender] : ['Liam', 'Emma']).slice(0, 4).join(', ')}…</div>`;
        const go = document.getElementById('hg-go'); go.disabled = false; go.style.opacity = 1; go.textContent = '▶ Start as ' + H.name;
    });
    const search = document.getElementById('hg-search');
    search.addEventListener('keydown', e => e.stopPropagation());
    search.oninput = () => {                                                  // filter the 40 countries by name or language
        const q = search.value.trim().toLowerCase();
        p.querySelectorAll('button[data-id]').forEach(b => { const h = hgFind(b.dataset.id); b.style.display = !q || (h.name + ' ' + h.language).toLowerCase().includes(q) ? '' : 'none'; });
    };
    document.getElementById('hg-go').onclick = () => { if (chosen) hgChoose(chosen, gender); };
    document.getElementById('hg-random').onclick = () => hgChoose(hgPickRandom(HERITAGES).id, gender);
    document.getElementById('hg-back').onclick = () => p.remove();
}

// ---------- 🌍 My Heritage panel: phrasebook, foods and a practice quiz ----------
function hgPhraseLatin(ph) { return ph[2] || ph[0]; }
function hgOpenPanel() {
    const H = hgCur(); if (!H) { showEvent('🌍', 'Start a new game to choose where your family is from.'); return; }
    let p = document.getElementById('hg-panel');
    if (!p) { p = document.createElement('div'); p.id = 'hg-panel'; p.style.cssText = 'position:fixed; inset:0; z-index:400; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;'; document.body.appendChild(p); p.addEventListener('keydown', e => e.stopPropagation()); p.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === p) p.style.display = 'none'; }); }
    p.style.display = 'flex';
    const learned = (player.words || []).filter(i => H.phrases[i]);
    const words = H.phrases.map((ph, i) => learned.includes(i)
        ? `<div style="padding:4px 0; border-bottom:1px solid #2c3e60;"><b>${ph[0]}</b>${ph[2] ? ` <span style="opacity:0.7">(${ph[2]})</span>` : ''} — ${ph[1]}</div>`
        : `<div style="padding:4px 0; border-bottom:1px solid #2c3e60; opacity:0.45;">❓ not learned yet — Mom & Dad will teach you</div>`).join('');
    const foods = H.recipes.map(r => `${r[1]} ${r[0]}`).join(' · ');
    p.innerHTML = `<div style="background:#16213e; color:#fff; border:2px solid #3498db; border-radius:14px; padding:16px 20px; width:min(460px,92vw); max-height:88vh; overflow-y:auto; font-size:0.92em;">
        <h2 style="margin:0">${H.flag} My Heritage</h2>
        <div style="opacity:0.8">Family from <b>${H.name}</b> · Language: <b>${H.language}</b> · Mom is “${H.mom}”, Dad is “${H.dad}”</div>
        <div style="margin:10px 0 4px; color:#5dade2; font-weight:bold;">🗣️ Family words (${learned.length}/${H.phrases.length} learned)</div>${words}
        <div style="margin:10px 0 4px; color:#5dade2; font-weight:bold;">🍲 Family recipes (cook them in the 🍳 Kitchen)</div><div>${foods}</div>
        <div style="margin:10px 0 4px; color:#5dade2; font-weight:bold;">🎯 Practice</div><div id="hg-quiz"></div>
        <button id="hg-close" style="margin-top:12px; width:100%; padding:8px; border-radius:8px; border:none; background:#3498db; color:#fff; font-weight:bold; cursor:pointer;">✖ Close</button></div>`;
    document.getElementById('hg-close').onclick = () => { p.style.display = 'none'; };
    hgQuiz(H, learned);
}
function hgQuiz(H, learned) {
    const box = document.getElementById('hg-quiz'); if (!box) return;
    if (learned.length < 2) { box.innerHTML = '<span style="opacity:0.7">Learn at least 2 family words first (Mom & Dad teach you one now and then).</span>'; return; }
    const ans = hgPickRandom(learned), others = learned.filter(i => i !== ans).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [ans].concat(others).sort(() => Math.random() - 0.5);
    box.innerHTML = `What does <b>${H.phrases[ans][0]}</b> mean?<div style="display:grid; gap:6px; margin-top:6px;">${opts.map(i => `<button data-i="${i}" style="padding:6px; border-radius:8px; border:1px solid #3498db; background:#0f3460; color:#fff; cursor:pointer;">${H.phrases[i][1]}</button>`).join('')}</div><div id="hg-res" style="margin-top:6px;"></div>`;
    box.querySelectorAll('button').forEach(b => b.onclick = () => {
        const ok = Number(b.dataset.i) === ans;
        document.getElementById('hg-res').innerHTML = ok ? '✅ Correct! <button id="hg-next" style="margin-left:6px;">Next</button>' : `❌ It means “${H.phrases[ans][1]}”. <button id="hg-next" style="margin-left:6px;">Try another</button>`;
        box.querySelectorAll('button[data-i]').forEach(x => x.disabled = true);
        document.getElementById('hg-next').onclick = () => hgQuiz(H, learned);
    });
}

// ---------- Mom & Dad speak your language now and then ----------
function hgDailyPhrase() {
    const H = hgCur(); if (!H || player.age < 1) return;
    if (!Array.isArray(player.words)) player.words = [];
    if (Math.random() > 0.4) return;
    const unlearned = H.phrases.map((p, i) => i).filter(i => !player.words.includes(i));
    const i = unlearned.length && Math.random() < 0.7 ? hgPickRandom(unlearned) : Math.floor(Math.random() * H.phrases.length);
    const ph = H.phrases[i], who = Math.random() < 0.5 ? H.mom : H.dad, isNew = !player.words.includes(i);
    if (isNew) player.words.push(i);
    showEvent('🗣️', `<b>${who}:</b> “${ph[0]}”${ph[2] ? ` <i>(${ph[2]})</i>` : ''}<br><span style="opacity:0.85">${ph[1]}</span>${isNew ? '<br>🌟 New word learned! See 🌍 My Heritage' : ''}`);
}

// ---------- wrappers around the other files' functions ----------
let hgOrigStart = null;
(function wrap() {
    if (typeof startGame === 'function') {
        hgOrigStart = startGame;
        startGame = function (gender) {
            if (!hgPendingGender) { hgPendingGender = gender; hgOpenPicker(gender); hgPendingGender = null; return; }
            return hgOrigStart(gender);
        };
    }
    if (typeof launchGame === 'function') { const o = launchGame; launchGame = function () { heritageApply(); return o.apply(this, arguments); }; }
    if (typeof restockFridge === 'function') {                    // Mom & Dad also buy the family's foods
        const o = restockFridge;
        restockFridge = function (silent) {
            o(silent);
            const H = hgCur(); if (!H) return;
            H.foods.slice().sort(() => Math.random() - 0.5).slice(0, 5).forEach(n => { const it = hgItem(n); addToFridge({ name: it.name, emoji: it.emoji }); });
        };
    }
    if (typeof advanceOneDay === 'function') { const o = advanceOneDay; advanceOneDay = function (silent) { const r = o.apply(this, arguments); if (!silent) hgDailyPhrase(); return r; }; }
    if (typeof dinnerOptionsFor === 'function') {                 // on most days one of the 3 suggestions is home cooking
        const o = dinnerOptionsFor;
        dinnerOptionsFor = function (age, day) {
            const list = o(age, day), H = hgCur();
            if (!H || !H.cuisines.length || ((age * 7 + day) % 10) >= 6) return list;
            if (list.some(r => H.cuisines.includes(r.cuisineId))) return list;
            const cid = H.cuisines[(age + day) % H.cuisines.length], ci = CUISINES.findIndex(c => c.id === cid);
            if (ci < 0) return list;
            list[1] = getRestaurant(ci + CUISINES.length * ((age * 3 + day) % RESTAURANTS_PER_CUISINE));
            return list;
        };
    }
    if (typeof getClassmateResponse === 'function') {             // classmates notice your heritage in chat
        const o = getClassmateResponse;
        getClassmateResponse = function (name, msg) {
            const H = hgCur(), m = String(msg || '').toLowerCase();
            if (H) {
                const flat = m.replace(/[^\p{L}\p{N} ]/gu, '').trim();
                if (H.phrases.some(ph => { const k = hgPhraseLatin(ph).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim(); return k.length > 3 && flat.includes(k); }))
                    return `Whoa, is that ${H.language}?! ${H.flag} That's so cool! What does it mean?`;
                if (/(i am|i'm|im) from|my family is from|my family comes from/.test(m)) return `${H.flag} ${H.name}! That sounds amazing. Tell me about it!`;
                if (/i speak|my language|at home we speak/.test(m)) return `You speak ${H.language}? Say something in ${H.language}! ${H.flag}`;
                if (/(my )?(favorite|favourite) food|we eat at home|my mom cooks|my dad cooks/.test(m)) { const r = hgPickRandom(H.recipes); return `Yum! ${r[1]} Have you ever had ${r[0]}? I want to try it!`; }
            }
            return o.apply(this, arguments);
        };
    }
    if (typeof addStoreRealism === 'function') {                  // 🌍 HOME FOODS stand in the grocery store
        const o = addStoreRealism;
        addStoreRealism = function (ctx) {
            const r = o.apply(this, arguments);
            try { hgStoreStand(ctx); } catch (e) { console.warn('home foods stand', e); }
            return r;
        };
    }
})();

function hgStoreStand(ctx) {
    const H = hgCur(); if (!H) return;
    const { box, put, block, sections } = ctx;
    const items = H.foods.slice(0, 5).map(hgItem);
    items.forEach((item, k) => {
        const x = 12.1, z = -5.9 + k * 1.6 - (k > 1 ? 0 : 0);
        const grp = new THREE.Group();
        box(1.2, 0.8, 0.8, 0, 0.4, 0, 0x8D6E63, grp);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) box(0.36, 0.28, 0.36, -0.3 + i * 0.6, 0.94, -0.18 + j * 0.36, 0xD7B98A, grp);
        const tag = makeLabelSprite(item.emoji, { w: 128, h: 128, size: 80, bg: '#6a1b9a', sw: 1.0, sh: 1.0 }); tag.position.set(0, 1.9, 0); grp.add(tag);
        const price = makeLabelSprite('$' + item.price, { w: 128, h: 64, size: 40, bg: '#f1c40f', fg: '#000', sw: 0.85, sh: 0.42 }); price.position.set(-0.45, 1.25, 0.6); grp.add(price);
        grp.userData.npcData = { name: item.name, isShelf: true, itemIndex: -1 };
        put(grp, x, 0, z);
        clickableNPCs.push(grp);
        sections.push({ group: grp, x, rowZ: z, item });
        block(x - 0.7, x + 0.7, z - 0.5, z + 0.5);
    });
    const sign = makeLabelSprite(`${H.flag} HOME FOODS`, { w: 360, h: 96, size: 46, bg: '#6a1b9a', sw: 3.2, sh: 0.9 });
    put(sign, 12.1, 3.0, -2.6);
}

// ---------- the button ----------
function installHeritage() {
    if (document.getElementById('hg-btn')) return;
    const b = document.createElement('button');
    b.id = 'hg-btn'; b.textContent = '🌍 My Heritage';
    b.style.cssText = 'display:none; position:fixed; top:162px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
    b.onclick = hgOpenPanel;
    document.body.appendChild(b);
    setInterval(() => { const g = document.getElementById('game-screen'); b.style.display = hgCur() && g && !g.classList.contains('hidden') ? 'block' : 'none'; }, 500);
    heritageApply();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHeritage); else installHeritage();
