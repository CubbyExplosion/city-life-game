// =============================================
// RESTAURANT DATA — the 300 restaurants you can have dinner at.
//
// 20 kinds of food (cuisines) x 15 restaurants each = 300. Each cuisine has a
// bank of dishes; every restaurant picks its OWN mix from that bank (plus a
// signature "special" nobody else has), so no two menus are the same.
// Everything is worked out from the restaurant's number (0-299), so a
// restaurant always looks the same — nothing here is saved.
//
// Used by dinner.js. Never changes while the game is running.
//
// A dish is: [name, emoji, price, happiness, health]
//   price     — what the bill adds up to (your parents pay)
//   happiness — how much happier you feel after eating it
//   health    — how much it changes your health (fried food is negative!)
// =============================================

const CUISINES = [
    { id: 'pizza', name: 'Pizza', emoji: '🍕', places: ['Pizzeria', 'Pizza Palace', 'Pizza Kitchen'],
      mains: [['Pepperoni Pizza','🍕',12,11,-2],['Cheese Pizza','🧀',10,10,-1],['Veggie Pizza','🥦',12,8,5],['Hawaiian Pizza','🍍',13,10,-1],['Meat Lovers Pizza','🥩',15,12,-4],['BBQ Chicken Pizza','🍗',14,11,-1],['Margherita Pizza','🍅',11,9,2],['Calzone','🥟',13,10,-2],['Mushroom Pizza','🍄',12,8,3],['Stuffed Crust Pizza','🧀',14,12,-4]],
      drinks: [['Lemonade','🍋',3,4,0],['Root Beer','🥤',3,4,-1],['Sparkling Water','💧',2,2,2],['Orange Soda','🍊',3,4,-1]],
      desserts: [['Cinnamon Dough Bites','🍩',6,8,-2],['Gelato','🍨',5,8,-1],['Tiramisu Slice','🍰',7,9,-2],['Chocolate Lava Cake','🍫',8,10,-3]] },
    { id: 'pasta', name: 'Pasta', emoji: '🍝', places: ['Pasta House', 'Trattoria', 'Noodle Kitchen'],
      mains: [['Spaghetti & Meatballs','🍝',14,11,-2],['Fettuccine Alfredo','🧈',15,11,-4],['Penne Arrabbiata','🌶️',13,9,0],['Lasagna','🧀',16,12,-3],['Mac & Cheese','🧀',11,10,-3],['Pesto Pasta','🌿',14,9,3],['Cheese Ravioli','🥟',15,10,0],['Chicken Parmesan','🍗',17,11,-2],['Veggie Primavera','🥕',13,8,6],['Spaghetti Carbonara','🥓',16,11,-3]],
      drinks: [['Italian Soda','🥤',3,4,-1],['Iced Tea','🧋',3,3,1],['Apple Juice','🍎',3,4,1],['Milk','🥛',2,2,3]],
      desserts: [['Tiramisu','🍰',7,9,-2],['Cannoli','🥐',6,8,-2],['Gelato','🍨',5,8,-1],['Panna Cotta','🍮',7,9,-1]] },
    { id: 'burger', name: 'Burgers', emoji: '🍔', places: ['Burger Joint', 'Grill', 'Burger Shack'],
      mains: [['Classic Cheeseburger','🍔',10,11,-3],['Double Bacon Burger','🥓',13,12,-5],['Veggie Burger','🥬',11,8,4],['Crispy Chicken Sandwich','🍗',11,10,-2],['Mushroom Swiss Burger','🍄',12,10,-2],['BBQ Burger','🍖',12,11,-3],['Hot Dog','🌭',7,8,-3],['Fish Sandwich','🐟',11,8,1],['Turkey Burger','🦃',11,9,1],['Loaded Fries Basket','🍟',9,10,-5]],
      drinks: [['Milkshake','🥛',5,7,-2],['Cola','🥤',3,4,-2],['Lemonade','🍋',3,4,0],['Iced Tea','🧋',3,3,1]],
      desserts: [['Apple Pie','🥧',5,8,-1],['Brownie','🍫',5,9,-2],['Soft Serve','🍦',4,8,-1],['Giant Cookie','🍪',3,7,-1]] },
    { id: 'taco', name: 'Mexican', emoji: '🌮', places: ['Taqueria', 'Cantina', 'Taco Stand'],
      mains: [['Beef Tacos','🌮',11,10,-1],['Chicken Burrito','🌯',12,10,0],['Veggie Quesadilla','🧀',10,9,1],['Fish Tacos','🐟',12,9,3],['Nachos Supreme','🧀',11,11,-4],['Cheese Enchiladas','🫔',13,10,-1],['Carnitas Bowl','🍚',13,10,1],['Chicken Fajitas','🫑',14,10,2],['Bean & Cheese Burrito','🫘',9,8,2],['Guacamole & Chips','🥑',8,8,2]],
      drinks: [['Horchata','🥛',4,5,-1],['Limeade','🍋',3,4,0],['Jamaica Iced Tea','🌺',3,4,1],['Mango Juice','🥭',3,4,1]],
      desserts: [['Churros','🍩',5,9,-2],['Flan','🍮',5,8,-1],['Tres Leches Cake','🍰',6,9,-2],['Fried Ice Cream','🍨',6,9,-3]] },
    { id: 'chinese', name: 'Chinese', emoji: '🥡', places: ['Dragon Wok', 'Noodle Garden', 'Chinese Kitchen'],
      mains: [['Sweet & Sour Chicken','🍗',12,10,-2],['Beef & Broccoli','🥦',13,9,4],['Fried Rice','🍚',9,9,-1],['Lo Mein Noodles','🍜',10,9,-1],['Orange Chicken','🍊',12,11,-3],['Kung Pao Chicken','🌶️',13,9,1],['Veggie Stir-Fry','🥕',11,8,6],['Pork Dumplings','🥟',10,10,0],['Egg Rolls','🌯',7,8,-2],['Mapo Tofu','🌶️',12,8,3]],
      drinks: [['Jasmine Tea','🍵',2,3,2],['Lychee Soda','🥤',3,4,-1],['Bubble Tea','🧋',5,6,-1],['Coconut Water','🥥',3,3,2]],
      desserts: [['Fortune Cookie','🥠',2,6,0],['Mango Pudding','🥭',5,8,0],['Sesame Balls','⚪',5,8,-2],['Almond Cookie','🍪',3,6,-1]] },
    { id: 'sushi', name: 'Sushi', emoji: '🍣', places: ['Sushi Bar', 'Sushi House', 'Sushi Kitchen'],
      mains: [['Salmon Nigiri','🍣',14,10,5],['California Roll','🍙',11,9,3],['Spicy Tuna Roll','🌶️',13,9,4],['Veggie Roll','🥒',9,7,5],['Tempura Shrimp Roll','🍤',13,10,0],['Dragon Roll','🐉',15,11,3],['Chicken Teriyaki Bowl','🍗',13,10,2],['Udon Noodle Soup','🍜',12,9,2],['Edamame Platter','🫛',6,6,6],['Rainbow Roll','🌈',16,12,4]],
      drinks: [['Green Tea','🍵',2,3,2],['Ramune Soda','🥤',3,5,-1],['Matcha Latte','🍵',5,5,1],['Melon Soda','🍈',3,5,-1]],
      desserts: [['Mochi Ice Cream','🍡',5,9,-1],['Dorayaki','🥞',4,8,-1],['Matcha Cheesecake','🍰',7,9,-1],['Taiyaki','🐟',4,8,-1]] },
    { id: 'thai', name: 'Thai', emoji: '🍛', places: ['Thai Garden', 'Thai Kitchen', 'Thai Orchid'],
      mains: [['Pad Thai','🍜',12,10,0],['Green Curry','🍛',13,9,2],['Red Curry','🌶️',13,9,2],['Massaman Curry','🥔',14,10,0],['Thai Basil Chicken','🌿',12,9,3],['Tom Yum Soup','🍲',10,8,4],['Satay Skewers','🍢',11,9,2],['Pineapple Fried Rice','🍍',12,10,0],['Drunken Noodles','🍜',13,10,-1],['Papaya Salad','🥗',9,7,6]],
      drinks: [['Thai Iced Tea','🧋',4,6,-2],['Coconut Water','🥥',3,3,2],['Lemongrass Soda','🍋',3,4,1],['Lychee Juice','🍒',3,4,1]],
      desserts: [['Mango Sticky Rice','🥭',6,9,0],['Coconut Ice Cream','🥥',5,8,-1],['Banana Fritters','🍌',5,8,-2],['Taro Pudding','🍮',5,7,0]] },
    { id: 'indian', name: 'Indian', emoji: '🍛', places: ['Curry House', 'Tandoor', 'Spice Kitchen'],
      mains: [['Butter Chicken','🍗',14,11,-1],['Chicken Tikka Masala','🍛',14,10,0],['Palak Paneer','🥬',12,8,5],['Chana Masala','🫘',11,8,5],['Vegetable Biryani','🍚',12,9,3],['Lamb Curry','🍖',16,10,0],['Samosas','🥟',7,8,-2],['Naan & Dal','🫓',10,8,4],['Tandoori Chicken','🍗',14,9,5],['Aloo Gobi','🥔',11,8,4]],
      drinks: [['Mango Lassi','🥭',4,6,0],['Masala Chai','🍵',3,4,1],['Rose Milk','🌹',4,5,0],['Lime Soda','🍋',3,4,0]],
      desserts: [['Gulab Jamun','🍩',5,9,-2],['Kheer','🍚',5,8,0],['Mango Kulfi','🍨',5,8,-1],['Jalebi','🍥',4,8,-2]] },
    { id: 'korean', name: 'Korean', emoji: '🥘', places: ['Korean Kitchen', 'Seoul Grill', 'Korean BBQ'],
      mains: [['Bibimbap','🍚',13,10,5],['Bulgogi Beef','🥩',15,11,1],['Kimchi Fried Rice','🌶️',12,9,2],['Japchae Noodles','🍜',12,9,2],['Korean Fried Chicken','🍗',14,12,-3],['Tteokbokki','🌶️',10,9,-1],['Dumpling Soup','🥟',11,9,2],['Kimbap','🍙',9,8,2],['Galbi Short Ribs','🍖',17,11,0],['Soft Tofu Stew','🍲',11,8,5]],
      drinks: [['Barley Tea','🍵',2,3,2],['Citron Tea','🍋',4,4,1],['Banana Milk','🍌',3,5,-1],['Sikhye Rice Drink','🍚',3,4,0]],
      desserts: [['Bingsu Shaved Ice','🍧',7,10,-1],['Hotteok Pancake','🥞',4,8,-2],['Red Bean Bun','🥮',3,7,0],['Mochi','🍡',4,8,0]] },
    { id: 'greek', name: 'Greek', emoji: '🥙', places: ['Greek Taverna', 'Gyro Grill', 'Olive Tree'],
      mains: [['Chicken Gyro','🥙',11,10,1],['Lamb Souvlaki','🍢',14,10,2],['Greek Salad','🥗',10,7,7],['Moussaka','🍆',14,9,0],['Spanakopita','🥬',9,8,2],['Falafel Plate','🧆',11,8,4],['Hummus & Pita','🫓',8,7,4],['Grilled Fish','🐟',15,9,6],['Stuffed Grape Leaves','🍃',9,7,4],['Pastitsio','🍝',13,9,-1]],
      drinks: [['Lemon Water','🍋',2,3,2],['Fruit Smoothie','🍓',4,5,1],['Mint Lemonade','🌿',3,4,1],['Orange Juice','🍊',3,4,1]],
      desserts: [['Baklava','🍯',5,9,-2],['Honey Yogurt','🍯',4,8,1],['Loukoumades','🍩',5,9,-2],['Rice Pudding','🍚',4,7,0]] },
    { id: 'bbq', name: 'BBQ', emoji: '🍖', places: ['Smokehouse', 'BBQ Pit', 'Rib Shack'],
      mains: [['Pulled Pork Sandwich','🥪',12,11,-2],['BBQ Ribs','🍖',17,12,-3],['Smoked Brisket','🥩',18,12,-2],['BBQ Chicken Plate','🍗',14,10,0],['Mac & Cheese Bowl','🧀',8,9,-3],['Cornbread & Beans','🌽',9,8,2],['Burnt Ends','🔥',15,11,-3],['Sausage Link Plate','🌭',12,9,-3],['Smoked Turkey','🦃',13,9,2],['Coleslaw Combo','🥬',8,7,3]],
      drinks: [['Sweet Tea','🧋',3,4,-1],['Cola','🥤',3,4,-2],['Lemonade','🍋',3,4,0],['Root Beer','🥤',3,4,-1]],
      desserts: [['Peach Cobbler','🍑',6,9,-1],['Banana Pudding','🍌',5,9,-1],['Pecan Pie','🥧',6,9,-2],['Brownie Sundae','🍨',7,10,-3]] },
    { id: 'seafood', name: 'Seafood', emoji: '🦞', places: ['Fish House', 'Seafood Shack', 'Oyster Bar'],
      mains: [['Fish & Chips','🐟',13,10,-2],['Grilled Salmon','🐟',17,9,7],['Shrimp Scampi','🍤',16,10,1],['Lobster Roll','🦞',20,12,2],['Clam Chowder','🍲',9,8,0],['Crab Cakes','🦀',15,10,0],['Fried Calamari','🦑',11,9,-3],['Fish Tacos','🌮',13,9,3],['Coconut Shrimp','🍤',14,10,-2],['Tuna Salad Plate','🥗',12,7,6]],
      drinks: [['Lemonade','🍋',3,4,0],['Sparkling Water','💧',2,2,2],['Iced Tea','🧋',3,3,1],['Ginger Ale','🥤',3,4,-1]],
      desserts: [['Key Lime Pie','🥧',6,9,-1],['Fruit Sorbet','🍧',5,8,0],['Chocolate Mousse','🍫',6,9,-2],['Berry Cobbler','🫐',6,8,0]] },
    { id: 'steak', name: 'Steakhouse', emoji: '🥩', places: ['Steakhouse', 'Chophouse', 'Prime Grill'],
      mains: [['Sirloin Steak','🥩',22,11,3],['Filet Mignon','🥩',28,12,3],['Ribeye Steak','🥩',26,12,1],['Steak Frites','🍟',20,11,-2],['Grilled Chicken Breast','🍗',16,8,6],['Pork Chop','🍖',18,9,1],['Meatloaf','🍖',14,9,-1],['Steak Sandwich','🥪',15,10,-1],['Loaded Baked Potato','🥔',10,8,-1],['Lamb Chops','🍖',26,11,1]],
      drinks: [['Sparkling Cider','🍎',4,4,-1],['Iced Tea','🧋',3,3,1],['Lemonade','🍋',3,4,0],['Hot Cocoa','☕',4,6,-1]],
      desserts: [['Cheesecake','🍰',7,10,-2],['Chocolate Cake','🍫',7,10,-3],['Crème Brûlée','🍮',8,9,-1],['Ice Cream Sundae','🍨',6,9,-2]] },
    { id: 'vegan', name: 'Vegan', emoji: '🥗', places: ['Garden Café', 'Green Bowl', 'Plant Kitchen'],
      mains: [['Buddha Bowl','🥗',12,8,9],['Veggie Burger','🍔',12,9,5],['Lentil Soup','🍲',9,7,8],['Cauliflower Wings','🥦',10,8,4],['Tofu Stir-Fry','🥕',12,8,7],['Avocado Toast','🥑',9,8,6],['Rainbow Salad','🥗',10,7,9],['Chickpea Curry','🍛',12,8,7],['Sweet Potato Tacos','🌮',11,9,6],['Zucchini Noodles','🥒',12,7,8]],
      drinks: [['Green Smoothie','🥬',5,4,4],['Fresh Juice','🍊',4,4,3],['Coconut Water','🥥',3,3,2],['Herbal Tea','🍵',3,3,2]],
      desserts: [['Fruit Bowl','🍓',5,7,5],['Chia Pudding','🍮',5,7,4],['Vegan Brownie','🍫',5,8,0],['Banana Ice Cream','🍌',5,8,1]] },
    { id: 'diner', name: 'Diner', emoji: '🍳', places: ['Diner', 'Pancake House', 'Family Restaurant'],
      mains: [['Pancake Stack','🥞',9,10,-2],['Waffles & Berries','🧇',10,10,0],['Bacon & Eggs','🥓',9,9,-1],['Grilled Cheese & Soup','🥪',9,9,0],['Chicken Fried Steak','🍗',13,10,-4],['Club Sandwich','🥪',11,9,0],['Western Omelette','🍳',10,9,2],['French Toast','🍞',9,10,-1],['Meatloaf Plate','🍖',12,9,-1],['Patty Melt','🍔',11,10,-3]],
      drinks: [['Chocolate Milk','🥛',3,5,0],['Orange Juice','🍊',3,4,1],['Milkshake','🥛',5,7,-2],['Hot Cocoa','☕',3,5,-1]],
      desserts: [['Slice of Pie','🥧',5,8,-1],['Ice Cream Scoop','🍨',3,7,-1],['Glazed Donut','🍩',3,7,-2],['Rice Pudding','🍚',4,7,0]] },
    { id: 'chicken', name: 'Fried Chicken', emoji: '🍗', places: ['Chicken Shack', 'Wing House', 'Chicken Coop'],
      mains: [['Fried Chicken Bucket','🍗',15,12,-5],['Chicken Tenders','🍗',10,10,-3],['Spicy Chicken Sandwich','🌶️',11,11,-3],['Rotisserie Chicken','🍗',13,9,4],['Chicken Wings','🍖',12,11,-3],['Chicken & Waffles','🧇',13,11,-4],['Popcorn Chicken','🍿',9,10,-3],['Grilled Chicken Wrap','🌯',10,8,4],['Chicken Pot Pie','🥧',12,10,-1],['Chicken Noodle Soup','🍲',8,8,3]],
      drinks: [['Sweet Tea','🧋',3,4,-1],['Lemonade','🍋',3,4,0],['Cola','🥤',3,4,-2],['Fruit Punch','🍹',3,4,-1]],
      desserts: [['Biscuit & Honey','🍯',3,7,-1],['Apple Pie','🥧',4,8,-1],['Chocolate Chip Cookie','🍪',3,7,-1],['Soft Serve','🍦',3,7,-1]] },
    { id: 'ramen', name: 'Ramen', emoji: '🍜', places: ['Ramen Bar', 'Ramen House', 'Noodle Shop'],
      mains: [['Tonkotsu Ramen','🍜',14,11,-1],['Miso Ramen','🍜',13,10,1],['Shoyu Ramen','🍜',13,10,1],['Spicy Ramen','🌶️',14,10,0],['Veggie Ramen','🥕',12,8,5],['Chicken Katsu Curry','🍛',14,11,-2],['Gyoza Plate','🥟',8,9,-1],['Fried Rice Bowl','🍚',10,9,0],['Okonomiyaki','🥞',11,9,-1],['Takoyaki','🐙',8,9,-2]],
      drinks: [['Green Tea','🍵',2,3,2],['Ramune','🥤',3,5,-1],['Iced Barley Tea','🧋',3,3,2],['Yuzu Soda','🍋',4,4,0]],
      desserts: [['Mochi','🍡',4,8,0],['Matcha Ice Cream','🍨',5,8,-1],['Dango','🍡',4,8,0],['Soft Serve Swirl','🍦',4,8,-1]] },
    { id: 'deli', name: 'Deli', emoji: '🥪', places: ['Deli', 'Sandwich Shop', 'Sub Shop'],
      mains: [['Turkey Club','🥪',11,9,2],['Pastrami on Rye','🥩',13,10,-1],['Italian Sub','🥖',12,10,-2],['Chicken Salad Sandwich','🥪',10,8,2],['Veggie Sub','🥬',9,7,5],['Reuben Sandwich','🥪',12,10,-2],['Tuna Melt','🐟',11,9,0],['BLT','🥓',10,9,-1],['Soup & Half Sandwich','🍲',10,8,3],['Meatball Sub','🍝',12,10,-2]],
      drinks: [['Iced Tea','🧋',3,3,1],['Lemonade','🍋',3,4,0],['Cream Soda','🥤',3,5,-2],['Apple Juice','🍎',3,4,1]],
      desserts: [['Black & White Cookie','🍪',3,7,-1],['Cheesecake','🍰',6,9,-2],['Rugelach','🥐',4,8,-1],['Chocolate Babka','🍫',5,8,-2]] },
    { id: 'french', name: 'French', emoji: '🥐', places: ['Bistro', 'Café', 'Brasserie'],
      mains: [['Croque Monsieur','🥪',12,10,-2],['Chicken Cordon Bleu','🍗',18,10,-1],['Beef Bourguignon','🍖',20,10,1],['French Onion Soup','🧅',10,9,0],['Ratatouille','🍆',13,8,7],['Quiche Lorraine','🥧',11,9,-1],['Salmon en Croûte','🐟',19,10,4],['Savory Crêpes','🥞',10,9,0],['Mussels & Frites','🍟',17,9,0],['Roast Chicken au Jus','🍗',18,10,1]],
      drinks: [['Sparkling Apple Juice','🍎',4,4,-1],['Hot Chocolate','☕',4,6,-1],['Citron Pressé','🍋',4,4,0],['Sirop Water','🥤',3,4,-1]],
      desserts: [['Crème Brûlée','🍮',7,9,-1],['Macarons','🍬',6,9,-1],['Chocolate Éclair','🍫',6,9,-2],['Fruit Tart','🍓',6,8,0]] },
    { id: 'hotpot', name: 'Hot Pot', emoji: '🍲', places: ['Hot Pot', 'Hot Pot Garden', 'Simmer House'],
      mains: [['Beef Hot Pot','🥩',18,11,2],['Seafood Hot Pot','🦐',20,11,4],['Veggie Hot Pot','🥬',15,8,8],['Spicy Mala Hot Pot','🌶️',17,10,0],['Tomato Broth Hot Pot','🍅',16,9,5],['Chicken Hot Pot','🍗',16,10,4],['Dumpling Platter','🥟',10,9,0],['Noodle Basket','🍜',8,8,0],['Mushroom Platter','🍄',9,7,6],['Tofu Skewers','🍢',8,8,4]],
      drinks: [['Sour Plum Drink','🍹',3,4,0],['Barley Tea','🍵',2,3,2],['Soy Milk','🥛',3,3,2],['Lychee Soda','🥤',3,4,-1]],
      desserts: [['Mango Sago','🥭',5,8,0],['Sesame Ice Cream','🍨',5,8,-1],['Red Bean Soup','🫘',4,7,1],['Fruit Plate','🍉',5,7,5]] }
];

// 15 "first names" per cuisine slot — together with the cuisine's place word they
// make 300 different restaurant names ("Lucky Dragon Wok", "Cozy Pizzeria"...).
const RESTAURANT_BRANDS = [
    'Golden', 'Lucky', 'Happy', 'Sunny', 'Royal', 'Little', 'Big', 'Cozy', 'Blue', 'Red',
    'Green', 'Grand', 'Rainbow', 'Wild', 'Silver', 'Maple', 'Cedar', 'Harbor', 'River', 'Hilltop',
    "Mama's", "Papa's", "Uncle Joe's", "Auntie's", "Grandma's", 'Old Town', 'Corner', 'Midnight', 'Starlight', 'Moonlight',
    'Twin Oaks', 'Sunset', 'Sunrise', 'Pepper', 'Ginger', 'Honey', 'Olive', 'Cherry', 'Lemon', 'Mango',
    'Copper', 'Velvet', 'Emerald', 'Crimson', 'Violet', 'Amber', 'Coral', 'Pearl', 'Ruby', 'Jade',
    'Eagle', 'Panda', 'Tiger', 'Dolphin', 'Fox', 'Owl', 'Bear', 'Lion', 'Falcon', 'Turtle'
];

const RESTAURANTS_PER_CUISINE = 15;
const RESTAURANT_COUNT = CUISINES.length * RESTAURANTS_PER_CUISINE; // 300

// A steady random-number maker: give it the same seed, get the same numbers.
function seededRandom(seed) {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Turns text into a number seed (so "age 9, day 23" always gives the same seed).
function seedFromText(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

function shuffledCopy(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function dishObject(d, mult, kind) {
    return { name: d[0], emoji: d[1], price: Math.max(1, Math.round(d[2] * mult)), hap: d[3], health: d[4], kind };
}

// Builds restaurant number 0-299. Always the same restaurant for the same number.
//   { id, name, cuisine, cuisineId, emoji, rating (3.5-5.0), tier (1-3 = $, $$, $$$), menu: { mains, drinks, desserts } }
function getRestaurant(id) {
    id = ((id % RESTAURANT_COUNT) + RESTAURANT_COUNT) % RESTAURANT_COUNT;
    const cIndex = id % CUISINES.length;
    const cuisine = CUISINES[cIndex];
    const slot = Math.floor(id / CUISINES.length);                       // 0-14: which restaurant of this cuisine
    const brand = RESTAURANT_BRANDS[(slot + cIndex * 3) % RESTAURANT_BRANDS.length];
    const name = brand + ' ' + cuisine.places[slot % cuisine.places.length];
    const rng = seededRandom(seedFromText('restaurant|' + id));

    const tier = 1 + Math.floor(rng() * 3);
    const mult = [0, 0.85, 1.0, 1.3][tier];
    const rating = Math.round((3.5 + rng() * 1.5) * 10) / 10;

    // Its OWN menu: 5 of the cuisine's 10 mains + a signature special + 2 drinks + 2 desserts
    const picked = shuffledCopy(cuisine.mains, rng);
    const special = picked[0];
    const mains = [{
        name: brand + ' Special ' + special[0], emoji: '⭐',
        price: Math.round(special[2] * mult * 1.25), hap: Math.min(15, special[3] + 2), health: special[4], kind: 'main', special: true
    }].concat(picked.slice(1, 6).map(d => dishObject(d, mult, 'main')));
    const drinks = shuffledCopy(cuisine.drinks, rng).slice(0, 2).map(d => dishObject(d, mult, 'drink'));
    const desserts = shuffledCopy(cuisine.desserts, rng).slice(0, 2).map(d => dishObject(d, mult, 'dessert'));

    return { id, name, cuisine: cuisine.name, cuisineId: cuisine.id, emoji: cuisine.emoji, rating, tier, menu: { mains, drinks, desserts } };
}

// The 3 restaurants your parents suggest on a given day. The same day always
// gives the same 3, and they're 3 different kinds of food.
function dinnerOptionsFor(age, day) {
    const rng = seededRandom(seedFromText('dinner|' + age + '|' + day));
    const cuisineOrder = shuffledCopy(CUISINES.map((c, i) => i), rng).slice(0, 3);
    return cuisineOrder.map(c => getRestaurant(c + CUISINES.length * Math.floor(rng() * RESTAURANTS_PER_CUISINE)));
}
