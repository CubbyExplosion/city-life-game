// =============================================
// FOOD — eating works like real life.
//
//   🍽️ FULLNESS (0-100) goes down every day. Hungry (30 or less) makes you sad; starving (0) hurts your health.
//   🧊 THE FRIDGE holds the groceries you really bought at the store. They SPOIL: bread and croissants
//      in a few days, milk in a week, frozen food and canned things for ages. Spoiled food is thrown out.
//   👩‍🍳 THE KITCHEN: pick a recipe made from what's actually in your fridge (eggs + bread = toast & eggs...),
//      cook it, eat it. Healthy meals help your health; junk food is tasty but not great for you.
//   🚪 Eating out (the restaurants and the food court), school snacks and lunch all fill you up too.
//   🧒 While you're a kid your PARENTS keep the fridge stocked and cook for you when you're hungry.
//      From age 18 you're on your own: you buy your own groceries (with your own money, see life.js).
//
// The 🍳 Kitchen button is on the home screen. Day changes call foodNewDay() from advanceOneDay() in core.js.
// =============================================

// How many days each grocery lasts in the fridge
const SHELF_LIFE = {
    Milk: 7, Bread: 5, Apples: 14, Bananas: 5, Cereal: 90, Eggs: 14, Cheese: 20, Carrots: 14, Pizza: 60, Juice: 10, Cookies: 30, Chicken: 4,
    Yogurt: 10, Butter: 30, Croissants: 3, Donuts: 3, 'Birthday Cake': 4, Baguette: 3, Steak: 4, Sausages: 6, Fish: 3,
    Tomatoes: 6, Lettuce: 5, Oranges: 14, Grapes: 7, Potatoes: 21, Corn: 5, 'Ice Cream': 60, 'Frozen Fries': 60,
    Water: 365, Soda: 120, Chips: 60, Chocolate: 90, 'Toilet Paper': 9999, Soap: 9999
};
const HOUSEHOLD_ITEMS = ['Toilet Paper', 'Soap'];            // not food — you use them up over time
const STARTER_GROCERIES = [
    { name: 'Milk', emoji: '🥛' }, { name: 'Bread', emoji: '🍞' }, { name: 'Eggs', emoji: '🥚' }, { name: 'Cheese', emoji: '🧀' },
    { name: 'Apples', emoji: '🍎' }, { name: 'Bananas', emoji: '🍌' }, { name: 'Cereal', emoji: '🥣' }, { name: 'Chicken', emoji: '🍗' },
    { name: 'Carrots', emoji: '🥕' }, { name: 'Potatoes', emoji: '🥔' }, { name: 'Pizza', emoji: '🍕' }, { name: 'Juice', emoji: '🧃' },
    { name: 'Yogurt', emoji: '🍦' }, { name: 'Tomatoes', emoji: '🍅' }, { name: 'Toilet Paper', emoji: '🧻' }, { name: 'Soap', emoji: '🧼' }
];

// A meal: ingredients (one of each, from the fridge), how full it makes you, and how good it is for you
const FOOD_RECIPES = [
    { name: 'Cereal & Milk',        emoji: '🥣', need: ['Cereal', 'Milk'],                full: 30, health: 2,  hap: 4  },
    { name: 'Toast & Eggs',         emoji: '🍳', need: ['Bread', 'Eggs'],                 full: 35, health: 3,  hap: 5  },
    { name: 'Cheese Sandwich',      emoji: '🥪', need: ['Bread', 'Cheese'],               full: 30, health: 1,  hap: 4  },
    { name: 'Cheesy Omelette',      emoji: '🍳', need: ['Eggs', 'Cheese'],                full: 32, health: 3,  hap: 6  },
    { name: 'Fruit Salad',          emoji: '🥗', need: ['Apples', 'Bananas'],             full: 25, health: 5,  hap: 5  },
    { name: 'Yogurt & Grapes',      emoji: '🍇', need: ['Yogurt', 'Grapes'],              full: 22, health: 4,  hap: 5  },
    { name: 'Garden Salad',         emoji: '🥬', need: ['Lettuce', 'Tomatoes'],           full: 20, health: 6,  hap: 3  },
    { name: 'Chicken & Carrots',    emoji: '🍗', need: ['Chicken', 'Carrots'],            full: 45, health: 5,  hap: 6  },
    { name: 'Roast Chicken Dinner', emoji: '🍗', need: ['Chicken', 'Potatoes', 'Carrots'], full: 60, health: 6, hap: 9  },
    { name: 'Steak & Potatoes',     emoji: '🥩', need: ['Steak', 'Potatoes'],             full: 55, health: 4,  hap: 10 },
    { name: 'Fish & Chips',         emoji: '🐟', need: ['Fish', 'Frozen Fries'],          full: 50, health: 1,  hap: 9  },
    { name: 'Sausage Sandwich',     emoji: '🌭', need: ['Sausages', 'Bread'],             full: 40, health: -1, hap: 7  },
    { name: 'Croissant Breakfast',  emoji: '🥐', need: ['Croissants', 'Butter'],          full: 28, health: -1, hap: 6  },
    { name: 'Corn & Butter',        emoji: '🌽', need: ['Corn', 'Butter'],                full: 25, health: 2,  hap: 4  },
    { name: 'Pizza Night',          emoji: '🍕', need: ['Pizza'],                         full: 45, health: -2, hap: 9  },
    { name: 'Ice Cream',            emoji: '🍨', need: ['Ice Cream'],                     full: 15, health: -2, hap: 8  },
    { name: 'Bag of Chips',         emoji: '🍿', need: ['Chips'],                         full: 12, health: -2, hap: 5  },
    { name: 'Chocolate Bar',        emoji: '🍫', need: ['Chocolate'],                     full: 10, health: -2, hap: 5  },
    { name: 'Cookies & Juice',      emoji: '🍪', need: ['Cookies', 'Juice'],              full: 18, health: -1, hap: 6  }
];
// The one meal you can always make: plain rice from the cupboard (cheap and boring)
const PLAIN_MEAL = { name: 'Plain Rice & Water', emoji: '🍚', need: [], full: 22, health: 0, hap: -2 };

// ---------------------------------------------
// state helpers
// ---------------------------------------------
function foodDay() { return player.age * 100 + player.sleepCount; }

function ensureFoodState() {
    if (typeof player.fullness !== 'number') player.fullness = 80;
    if (!Array.isArray(player.fridge)) player.fridge = [];
}

function addToFridge(item) {
    ensureFoodState();
    const life = SHELF_LIFE[item.name] || 7;
    player.fridge.push({ name: item.name, emoji: item.emoji, exp: foodDay() + life });
}

function fridgeCount(name) {
    ensureFoodState();
    return player.fridge.filter(f => f.name === name).length;
}

function takeFromFridge(name) {
    ensureFoodState();
    // use the one that expires soonest first (like real life)
    let best = -1;
    player.fridge.forEach((f, i) => { if (f.name === name && (best < 0 || f.exp < player.fridge[best].exp)) best = i; });
    if (best >= 0) player.fridge.splice(best, 1);
    return best >= 0;
}

function canMake(r) {
    const counts = {};
    r.need.forEach(n => counts[n] = (counts[n] || 0) + 1);
    return Object.keys(counts).every(n => fridgeCount(n) >= counts[n]);
}

function missingFor(r) {
    return r.need.filter(n => fridgeCount(n) < 1);
}

function hungerLabel() {
    const f = player.fullness;
    return f <= 0 ? '😵 Starving!' : f <= 30 ? '😩 Hungry' : f <= 60 ? '🙂 Peckish' : f <= 90 ? '😌 Satisfied' : '🤰 Stuffed';
}

// Fills you up (called by meals, restaurants, snacks...). Returns false if you were already stuffed.
function gainFullness(n, quiet) {
    ensureFoodState();
    const before = player.fullness;
    player.fullness = Math.max(0, Math.min(100, before + n));
    if (!quiet && before + n > 110) {                                  // way too much
        player.health = Math.max(0, player.health - 2);
        showEvent('🤢', 'You ate way too much and your tummy hurts! -2 health');
    }
    if (typeof updateStats === 'function') updateStats();
}

// ---------------------------------------------
// every new day: you get hungry, food spoils, kids get fed, parents shop
// ---------------------------------------------
function foodNewDay(silent) {
    ensureFoodState();
    if (player.age <= 2) { player.fullness = 100; return; }               // babies drink milk (cry for milk)
    player.fullness = Math.max(0, player.fullness - 22);

    // spoilage
    const today = foodDay();
    const bad = player.fridge.filter(f => f.exp <= today);
    if (bad.length) {
        player.fridge = player.fridge.filter(f => !bad.includes(f));
        if (!silent) showEvent('🗑️', `Spoiled and thrown out: ${bad.map(b => b.emoji + ' ' + b.name).slice(0, 4).join(', ')}${bad.length > 4 ? '...' : ''}`);
    }
    // parents look after you until you're 18
    if (player.age < 18) {
        if (player.sleepCount % 10 === 0 || player.fridge.filter(f => !HOUSEHOLD_ITEMS.includes(f.name)).length < 4) restockFridge(silent);
        if (player.fullness <= 50) parentsFeedYou(silent);
    } else {
        // adults use up household supplies: toilet paper and soap
        if (player.sleepCount % 10 === 5) {
            ['Toilet Paper', 'Soap'].forEach(n => { if (!takeFromFridge(n)) { player.happiness = Math.max(0, player.happiness - 2); if (!silent) showEvent(n === 'Soap' ? '🧼' : '🧻', `You ran out of ${n.toLowerCase()}! Buy some at the grocery store.`); } });
        }
    }
    // hunger hurts
    if (player.fullness <= 0) {
        player.health = Math.max(0, player.health - 3); player.happiness = Math.max(0, player.happiness - 4);
        if (!silent) showEvent('😵', "You're STARVING! Eat something right away! -3 health");
    } else if (player.fullness <= 30) {
        player.happiness = Math.max(0, player.happiness - 2);
        if (!silent) showEvent('😩', "You're hungry... open the 🍳 Kitchen and eat something.");
    }
}

// Mom or Dad fills the fridge with the week's groceries
function restockFridge(silent) {
    ensureFoodState();
    const picks = STARTER_GROCERIES.slice().sort(() => Math.random() - 0.5).slice(0, 10);
    ['Milk', 'Bread', 'Eggs'].forEach(n => { if (!picks.find(p => p.name === n)) picks.push(STARTER_GROCERIES.find(s => s.name === n)); });
    picks.forEach(addToFridge);
    if (!silent) showEvent('🛒', 'Mom & Dad went grocery shopping and filled up the fridge!');
}

function parentsFeedYou(silent) {
    const options = FOOD_RECIPES.filter(canMake);
    const meal = options.length ? options[Math.floor(Math.random() * options.length)] : null;
    if (meal) {
        meal.need.forEach(takeFromFridge);
        player.fullness = Math.min(100, player.fullness + meal.full);
        player.health = Math.max(0, Math.min(100, player.health + meal.health));
        player.happiness = Math.max(0, Math.min(100, player.happiness + meal.hap));
        if (!silent) showEvent(meal.emoji, `${Math.random() < 0.5 ? 'Mom' : 'Dad'} cooked ${meal.name} for you! 😋`);
    } else {
        player.fullness = Math.min(100, player.fullness + 35);
        if (!silent) showEvent('🍽️', 'Mom & Dad found some leftovers for you to eat.');
    }
}

// ---------------------------------------------
// the groceries you buy go in the fridge (called from the store checkout)
// ---------------------------------------------
// Pays for the cart: parents pay while you're a kid; from 18 you pay with your own money.
// Returns { items: what you actually bought, payerText, short }
function processGroceryCheckout(items) {
    ensureFoodState();
    let kept = items.slice(), payerText, short = false;
    if (typeof isIndependent === 'function' && isIndependent()) {
        let total = kept.reduce((s, i) => s + i.price, 0);
        if (total > player.money) {                                    // can't afford it all: put the priciest things back
            short = true;
            kept.sort((a, b) => a.price - b.price);
            const affordable = [];
            let sum = 0;
            for (const it of kept) { if (sum + it.price <= player.money) { affordable.push(it); sum += it.price; } }
            kept = affordable;
            total = sum;
        }
        player.money -= total;
        payerText = `💳 You paid $${total} from your own money.` + (short ? ' (You didn\'t have enough, so some things went back on the shelf.)' : '');
    } else {
        payerText = `👪 ${Math.random() < 0.5 ? 'Mom' : 'Dad'} paid with a card.`;
    }
    kept.forEach(addToFridge);
    updateStats(); saveGame();
    return { items: kept, payerText, short };
}

// ---------------------------------------------
// 🍳 the kitchen
// ---------------------------------------------
function foodOverlayEl() { return document.getElementById('kitchen-overlay'); }

function openKitchen() {
    ensureFoodState();
    if (foodOverlayEl()) return;
    const el = document.createElement('div');
    el.id = 'kitchen-overlay';
    el.style.cssText = `position:fixed; inset:0; z-index:290; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); font-family:Arial; overflow-y:auto; padding:14px;`;
    document.body.appendChild(el);
    renderKitchen();
}

function closeKitchen() {
    const el = foodOverlayEl();
    if (el) el.remove();
}

function renderKitchen() {
    const el = foodOverlayEl();
    if (!el) return;
    const today = foodDay();
    const grouped = {};
    player.fridge.forEach(f => {
        const g = grouped[f.name] || (grouped[f.name] = { emoji: f.emoji, n: 0, soon: 9999 });
        g.n++; g.soon = Math.min(g.soon, f.exp - today);
    });
    const fridgeHtml = Object.keys(grouped).length
        ? Object.keys(grouped).map(n => {
            const g = grouped[n], left = g.soon;
            const col = HOUSEHOLD_ITEMS.includes(n) ? '#9ab' : left <= 1 ? '#e74c3c' : left <= 3 ? '#f39c12' : '#2ecc71';
            return `<span style="display:inline-block; margin:3px; padding:4px 9px; border-radius:10px; background:#0f3460; color:#fff; font-size:0.85em;">${typeof foodImg === 'function' ? foodImg(g.emoji, n, 24, { grocery: true, force: true }) : g.emoji} ${n} ×${g.n}${HOUSEHOLD_ITEMS.includes(n) ? '' : ` <b style="color:${col}">· ${left <= 0 ? 'today!' : left + 'd'}</b>`}</span>`;
        }).join('')
        : '<span style="color:#9ab;">The fridge is empty! Go shopping (🛍️ Go Shopping).</span>';
    const meals = FOOD_RECIPES.slice().sort((a, b) => (canMake(b) ? 1 : 0) - (canMake(a) ? 1 : 0));
    const mealBtn = (r, idx, plain) => {
        const ok = plain || canMake(r);
        const miss = plain ? [] : missingFor(r);
        return `<button onclick="cookMeal(${plain ? -1 : FOOD_RECIPES.indexOf(r)})" ${ok ? '' : 'disabled'} style="display:flex; justify-content:space-between; align-items:center; gap:8px; width:100%; margin:3px 0;
            padding:7px 10px; border-radius:9px; font-size:0.9em; text-align:left; cursor:${ok ? 'pointer' : 'not-allowed'}; color:white;
            background:${ok ? '#0f3460' : '#2a2a3a'}; border:2px solid ${ok ? '#2ecc71' : '#444'}; opacity:${ok ? 1 : 0.6};">
            <span>${typeof foodImg === 'function' ? foodImg(r.emoji, r.name, 30, { force: true }) : r.emoji} <b>${r.name}</b><br><span style="font-size:0.8em; color:#aaa;">${plain ? 'from the cupboard — always available' : r.need.join(' + ')}${miss.length ? ` <span style="color:#e74c3c">(need ${miss.join(', ')})</span>` : ''}</span></span>
            <span style="white-space:nowrap; font-size:0.82em;">🍽️ +${r.full} ${r.health ? `<span style="color:${r.health > 0 ? '#2ecc71' : '#e74c3c'}">${r.health > 0 ? '+' : ''}${r.health}❤️</span>` : ''} <span style="color:#2ecc71">${r.hap >= 0 ? '+' : ''}${r.hap}😊</span></span></button>`;
    };
    el.innerHTML = `
        <div style="background:#16213e; border:3px solid #e67e22; border-radius:16px; padding:18px 24px; max-width:640px; width:100%;">
            <h2 style="color:#FFD700; text-align:center; margin-bottom:4px;">🍳 Kitchen</h2>
            <div style="text-align:center; margin-bottom:8px;">
                <div style="color:#fff;">🍽️ Fullness: <b>${player.fullness}</b>/100 — ${hungerLabel()}</div>
                <div style="background:#0f3460; border-radius:6px; height:12px; width:260px; margin:4px auto; overflow:hidden;"><div style="width:${player.fullness}%; height:100%; background:${player.fullness <= 30 ? '#e74c3c' : '#2ecc71'};"></div></div>
            </div>
            <h3 style="color:#9ab; font-size:0.9em; margin:6px 0 2px;">🧊 In your fridge <span style="font-weight:normal;">(the number is how many days until it spoils)</span></h3>
            <div style="margin-bottom:6px;">${fridgeHtml}</div>
            <h3 style="color:#9ab; font-size:0.9em; margin:6px 0 2px;">👩‍🍳 What do you want to cook?</h3>
            <div style="max-height:34vh; overflow-y:auto;">${mealBtn(PLAIN_MEAL, -1, true)}${meals.map(r => mealBtn(r)).join('')}</div>
            <div style="text-align:center; margin-top:10px;"><button onclick="closeKitchen()" style="padding:9px 22px; border:none; border-radius:10px; background:#555; color:white; cursor:pointer;">✖ Close</button></div>
        </div>`;
}

function cookMeal(idx) {
    const r = idx < 0 ? PLAIN_MEAL : FOOD_RECIPES[idx];
    if (!r || (idx >= 0 && !canMake(r))) return;
    if (player.fullness >= 90) { showEvent('🤰', "You're not hungry — you can't eat any more right now!"); return; }
    r.need.forEach(takeFromFridge);
    const el = foodOverlayEl();
    if (el) el.firstElementChild.innerHTML = `
        <div style="text-align:center; padding:20px 30px;">
            <div style="font-size:3em;">👩‍🍳 🔥</div>
            <h2 style="color:#FFD700; margin:8px 0;">Cooking ${r.name}...</h2>
            <div style="font-size:2em;">${typeof foodImg === 'function' ? foodImg(r.emoji, r.name, 64, { force: true }) : r.emoji}</div></div>`;
    setTimeout(() => {
        gainFullness(r.full);
        player.health = Math.max(0, Math.min(100, player.health + r.health));
        player.happiness = Math.max(0, Math.min(100, player.happiness + r.hap));
        updateStats(); saveGame();
        const e2 = foodOverlayEl();
        if (!e2) return;
        e2.firstElementChild.innerHTML = `
            <div style="text-align:center; padding:16px 26px;">
                <div style="font-size:3em;">${typeof foodImg === 'function' ? foodImg(r.emoji, r.name, 72, { force: true }) : r.emoji} 😋</div>
                <h2 style="color:#2ecc71; margin:6px 0;">${r.health >= 4 ? 'Healthy and delicious!' : r.health <= -1 ? 'Tasty... but not so healthy!' : r.hap < 0 ? 'Boring, but it fills you up.' : 'Yum!'}</h2>
                <p style="color:#fff;">🍽️ +${r.full} fullness (now ${player.fullness}) ${r.health ? `· <span style="color:${r.health > 0 ? '#2ecc71' : '#e74c3c'}">${r.health > 0 ? '+' : ''}${r.health} health</span>` : ''} · <span style="color:${r.hap >= 0 ? '#2ecc71' : '#e74c3c'}">${r.hap >= 0 ? '+' : ''}${r.hap} happiness</span></p>
                <button onclick="renderKitchen()" style="margin:12px 4px 0; padding:9px 20px; border:none; border-radius:10px; background:#e67e22; color:white; font-weight:bold; cursor:pointer;">🍳 Cook something else</button>
                <button onclick="closeKitchen()" style="margin:12px 4px 0; padding:9px 20px; border:none; border-radius:10px; background:#3498db; color:white; font-weight:bold; cursor:pointer;">Done</button>
            </div>`;
    }, 1800);
}

function resetFood() {
    closeKitchen();
}
