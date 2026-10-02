// =============================================
// MAIN — the entry point. This file loads LAST (see index.html's
// <script> tags), after every other file has defined its functions
// and variables. Load order for the other files doesn't actually
// matter for correctness here (nothing else runs immediately —
// everything waits for a click or this 'load' event) but this is
// the suggested reading order for understanding the codebase:
//   data.js  -> state.js -> world.js -> homelife.js -> events.js
//   -> minigames.js -> school.js -> chat.js -> core.js -> main.js
// =============================================

window.addEventListener('load', () => {
    if (loadSavedGame()) {
        document.getElementById('continue-btn').style.display = 'block';
    }
});
