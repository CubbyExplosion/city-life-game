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
// GO SHOPPING — see store.js for the grocery store itself. A parent
// drives you there; the ride ends in the store's parking lot.
// =============================================

// The grocery store is inside Utama Mall now (mall.js): a parent drives you to the mall and you
// walk to the grocery at the end of the concourse.
function openShopping() {
    if (driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni) return;
    startMallErrand();
}
