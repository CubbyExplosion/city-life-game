// =============================================
// MINI-GAMES — Cook (any age) and Go Shopping (toddler age 3+)
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

