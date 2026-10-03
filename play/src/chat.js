// =============================================
// CHAT — talking to classmates. Uses simple keyword matching by
// default; askGemini()/sendChatMessage() can call a real AI instead
// once geminiAvailable (state.js) is turned on with a real API key.
// =============================================

const GEMINI_KEY = ''; // paste your own key here for local testing only — never commit a real key, this file ships to every player's browser


const CLASSMATE_PERSONALITIES = {
    'Jake': 'You are Jake, a 10-year-old boy at school. You love football and video games. Reply in 1-2 short sentences like a kid. Be fun and enthusiastic. Use emojis sometimes.',
    'Mia':  'You are Mia, a 10-year-old girl at school. You love drawing and animals. Reply in 1-2 short sentences like a kid. Be kind and sweet. Use emojis sometimes.',
    'Sam':  'You are Sam, a 10-year-old at school. You love racing and gaming. Reply in 1-2 short sentences like a kid. Be energetic and funny. Use emojis sometimes.'
};


async function askGemini(name, userMsg) {
    const personality = CLASSMATE_PERSONALITIES[name] || 'You are a friendly 10-year-old classmate. Reply in 1 sentence.';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: personality }] },
            contents: [{ parts: [{ text: userMsg }] }]
        })
    });
    const data = await res.json();
    console.log('Gemini response:', data);
    if (!data.candidates) throw new Error(JSON.stringify(data));
    return data.candidates[0].content.parts[0].text;
}

// =============================================
// HOW CLASSMATES ANSWER YOU — this uses SUIN's brain (your chatbot!).
// suin-brain.js has Suin's real math calculator, its "what does X mean"
// lookup, and its conversation examples; suin-words.js is Suin's list of
// 4,800+ word definitions (loaded the first time you open a chat).
// The order a classmate thinks in:
//   1. who they are / their age / rude words   (their own personality)
//   2. real math ("what is 7 times 8")          (Suin)
//   3. "what does X mean"                       (Suin)
//   4. longer friendly phrases ("how are you")  (Suin)
//   5. their own favorite topics (football, drawing...) and everyday words
//   6. if nothing matches, a funny "huh?" reply
// =============================================

// Suin's big word list loads only when you first talk to a classmate.
let suinWordsRequested = false;
function ensureSuinWords() {
    if (suinWordsRequested || typeof WORD_DEFINITIONS !== 'undefined') return;
    suinWordsRequested = true;
    const tag = document.createElement('script');
    tag.src = 'src/suin-words.js?v=3';
    document.head.appendChild(tag);
}

// Kids type fast: "who r u" should mean "who are you".
function normalizeKidSpeak(text) {
    return text.toLowerCase()
        .replace(/\bwats\b|\bwhats\b/g, "what's")
        .replace(/\bwat\b|\bwut\b/g, 'what')
        .replace(/\bur\b/g, 'your')
        .replace(/\bu\b/g, 'you')
        .replace(/\br\b/g, 'are')
        .replace(/\bpls\b|\bplz\b/g, 'please')
        .replace(/\bthx\b|\bty\b/g, 'thanks');
}

// Is this keyword in the message as a whole word? ("yo" won't match "you", "hate" won't match "whatever")
function friendWordMatch(text, word) {
    return new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text);
}

// Suin's way of matching: count the words you typed that an example also has. Only the longer
// phrases count here ("good afternoon", "how are you doing") — one-word things like "hi" or "bye"
// stay with each classmate's own personality answers.
function suinPhraseReply(text) {
    const typed = suinWordsOf(text);
    let best = null, bestScore = 0;
    SEED_EXAMPLES.concat(GREETING_EXAMPLES, MOOD_EXAMPLES).forEach(example => {
        const words = suinWordsOf(example.text);
        if (words.length < 2) return;
        const score = suinOverlapScore(typed, words);
        if (score >= 2 && score > bestScore) { bestScore = score; best = example; }
    });
    return best ? best.reply : null;
}

function getClassmateResponse(name, msg) {
    const data = FRIEND_RESPONSES[name];
    if (!data) return '...';
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const text = normalizeKidSpeak(msg);
    const findKey = keys => keys.find(entry => entry.words.some(w => friendWordMatch(text, w)));

    // 1. Who they are, how old, rude words — the first 3 entries of every classmate's table (data.js)
    const own = findKey(data.keys.slice(0, 3));
    if (own) return pick(own.says);

    // 2. Real math, the way Suin does it
    const expr = extractMathExpression(text);
    if (expr) {
        let result;
        try { result = evalMathExpression(expr); } catch (e) { result = NaN; }
        if (Number.isFinite(result)) {
            const rounded = Math.round(result * 1e9) / 1e9;
            return pick(['Easy! ', 'Math time! ', 'Ooh, I know this one! ', '']) + '🧮 ' + expr + ' = ' + rounded;
        }
        return "Hmm, that math didn't work out — try something like \"5 + 3\" or \"12 * 4\" 🧮";
    }

    // 3. "what does ___ mean" — Suin's word list
    const asked = extractDefinitionQuery(text);
    if (asked) {
        if (typeof WORD_DEFINITIONS !== 'undefined' && WORD_DEFINITIONS[asked]) {
            return '"' + asked + '" means: ' + WORD_DEFINITIONS[asked];
        }
        return typeof WORD_DEFINITIONS === 'undefined'
            ? 'Hmm, let me think... ask me again in a second! 🤔'
            : "I don't know that word yet! 🤷";
    }

    // 4. Suin's longer friendly phrases
    const suinSays = suinPhraseReply(text);
    if (suinSays) return suinSays;

    // 5. This classmate's own favorite topics and everyday words
    const mine = findKey(data.keys.slice(3));
    if (mine) return pick(mine.says);

    // 6. No idea what that was
    return pick(data.defaults);
}

function showClassmateChat(name) {
    if (document.getElementById('chat-overlay')) return;
    ensureSuinWords(); // start loading Suin's word list so "what does ___ mean" works
    activeChatName = name;

    const overlay = document.createElement('div');
    overlay.id = 'chat-overlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:300;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.55); font-family:Arial;
    `;
    overlay.innerHTML = `
        <div style="background:#16213e; border:3px solid #3498db; border-radius:16px;
                    width:360px; max-width:92vw; display:flex; flex-direction:column;
                    max-height:88vh;">
            <div style="background:#0f3460; padding:12px 18px; border-radius:13px 13px 0 0;
                        display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                <span style="color:#3498db; font-weight:bold; font-size:1.1em;">💬 ${name}</span>
                <button onclick="closeChat()" style="background:none; border:none;
                    color:#aaa; font-size:1.3em; cursor:pointer; line-height:1;">✕</button>
            </div>
            <div id="chat-messages" style="flex:1; overflow-y:auto; padding:14px;
                min-height:120px; max-height:280px;"></div>
            <div style="padding:10px 14px 14px; border-top:1px solid #0f3460;
                        display:flex; gap:8px; flex-shrink:0;">
                <input id="chat-input" type="text" placeholder="Say something..."
                    style="flex:1; padding:9px 12px; border-radius:8px; border:2px solid #3498db;
                           background:#0f3460; color:white; font-size:0.95em; outline:none;" />
                <button onclick="sendChatMessage()"
                    style="padding:9px 14px; background:#3498db; color:white; border:none;
                           border-radius:8px; cursor:pointer; font-size:0.95em; font-weight:bold;">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // greet the player when the chat opens
    setTimeout(() => {
        const greet = getClassmateResponse(name, 'hi');
        addChatMessage(greet, false);
    }, 300);

    // press Enter to send
    const input = document.getElementById('chat-input');
    if (input) {
        input.focus();
        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
    }
}


function addChatMessage(text, isPlayer) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const row = document.createElement('div');
    row.style.cssText = `margin:5px 0; display:flex;
        justify-content:${isPlayer ? 'flex-end' : 'flex-start'};`;
    row.innerHTML = `<div style="max-width:78%; padding:8px 12px; border-radius:14px;
        font-size:0.9em; line-height:1.4; color:white;
        background:${isPlayer ? '#2980b9' : '#2c3e50'};">${text}</div>`;
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
}


async function sendChatMessage() {
    if (isSending) return; // prevent duplicate sends from rapid Enter presses
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    isSending = true;
    input.value = '';
    input.focus();

    addChatMessage(msg, true);

    if (geminiAvailable) {
        // Show "thinking..." bubble while waiting for AI
        const box = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = 'margin:5px 0; display:flex; justify-content:flex-start;';
        typingDiv.innerHTML = `<div style="padding:8px 12px; border-radius:14px; font-size:0.9em; color:#aaa; background:#2c3e50;">💭 thinking...</div>`;
        if (box) { box.appendChild(typingDiv); box.scrollTop = box.scrollHeight; }

        try {
            const reply = await askGemini(activeChatName, msg);
            const t = document.getElementById('typing-indicator');
            if (t) t.remove();
            addChatMessage(reply, false);
        } catch(e) {
            const t = document.getElementById('typing-indicator');
            if (t) t.remove();
            console.error('Gemini unavailable, switching to keyword mode:', e);
            geminiAvailable = false; // stop trying Gemini for this session
            addChatMessage(getClassmateResponse(activeChatName, msg), false);
        }
    } else {
        // Gemini is down — use keyword responses directly, no delay
        addChatMessage(getClassmateResponse(activeChatName, msg), false);
    }

    player.happiness = Math.min(100, player.happiness + 3);
    updateStats(); saveGame();
    isSending = false;
}


function closeChat() {
    const overlay = document.getElementById('chat-overlay');
    if (overlay) overlay.remove();
    showEvent('😄', `Nice chat with ${activeChatName}!`);
}

