// =============================================
// VOICES — 120 voices, so every person can have their own.
//
//   THE LIBRARY: 12 pitches (Giant ... Pixie) x 10 timbres (Soft, Round, Buzzy, Chirpy, Nasal, Growl, Airy, Robot, Warble, Bubbly)
//   = 120 different voices, numbered #001-#120. Open 🗣️ Voices to hear any of them (tap a number), then give one to a person
//   ("Assign to": You, Mom, Dad, a classmate, a neighbour, the waiter... or type any name). Anyone you don't assign gets a
//   voice picked from their name, so the same person always sounds the same.
//
//   TWO WAYS TO SPEAK (⚙️ Settings or the 🗣️ panel):  REAL SPEECH (the default) = your device's text-to-speech voices; the 120 voices are
//   made from  system voice x pitch x speed  (voTtsParams), so even a device with only 2-3 voices gets 120 different ones; kids are pitched
//   high, grown-ups natural.  Blips = every letter is a tiny sung note (Web Audio, no speech engine needed) — the automatic fallback when the
//   device has no text-to-speech.  Off = silent.  Volume has its own slider.
//
//   WHEN PEOPLE TALK: chat messages (you and your classmates), and any line the game shows as  Name: "..."  or  <b>Name:</b> ...
//   (Mom & Dad at dinner / in the mall, waiters, cashiers, the doctor, teachers, neighbours). Lines queue up so voices don't overlap.
//   Assignments are remembered (localStorage 'citylife_voices'). Nothing here affects how the game plays.
// =============================================

const VO_PITCHES = [['Giant', 85], ['Deep', 105], ['Low', 130], ['Mellow', 160], ['Warm', 195], ['Mid', 235], ['Bright', 285], ['Light', 345], ['High', 415], ['Squeaky', 500], ['Tiny', 600], ['Pixie', 720]];
const VO_TIMBRES = [
    { n: 'Soft',   wave: 'sine',     lp: 2600 },
    { n: 'Round',  wave: 'triangle', lp: 3200 },
    { n: 'Buzzy',  wave: 'sawtooth', lp: 1500 },
    { n: 'Chirpy', wave: 'square',   lp: 2400, short: true },
    { n: 'Nasal',  wave: 'sawtooth', bp: 1150, q: 3.5 },
    { n: 'Growl',  wave: 'sawtooth', lp: 750, tre: 34 },
    { n: 'Airy',   wave: 'triangle', lp: 3600, noise: 0.55 },
    { n: 'Robot',  wave: 'square',   lp: 1700, flat: true },
    { n: 'Warble', wave: 'sine',     lp: 2800, vib: 7, vibDepth: 0.09 },
    { n: 'Bubbly', wave: 'sine',     lp: 3000, glide: 1.6 }
];
// the library: id 0..119 (shown as #001..#120)
const VOICE_BANK = [];
for (let t = 0; t < VO_TIMBRES.length; t++) for (let p = 0; p < VO_PITCHES.length; p++) {
    const id = t * VO_PITCHES.length + p;
    VOICE_BANK.push({ id, num: id + 1, pitchIdx: p, timbreIdx: t, hz: VO_PITCHES[p][1], name: VO_PITCHES[p][0] + ' ' + VO_TIMBRES[t].n, speed: 9 + (id * 7) % 7, depth: 2.2 + ((id * 5) % 6) * 0.55 });
}

// ---------- who has which voice ----------
let voStore = { map: {}, seen: [], custom: [] };
try { const s = JSON.parse(localStorage.getItem('citylife_voices') || 'null'); if (s) voStore = Object.assign(voStore, s); } catch (e) {}
function voSave() { try { localStorage.setItem('citylife_voices', JSON.stringify(voStore)); } catch (e) {} }
function voHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// the speaker name the game uses -> the key we store ("Mom", "Dad", "You", or the person's name)
function voKey(name) {
    let n = String(name || '').replace(/<[^>]*>/g, '').replace(/[:“”"]/g, '').replace(/^\s*[^\p{L}]+/u, '').trim();
    if (/^(you|me)$/i.test(n)) return 'You';
    const H = typeof hgCur === 'function' ? hgCur() : null;
    if (/^(mom|mommy|mum|mama|mamá)$/i.test(n) || (H && n.toLowerCase() === String(H.mom).toLowerCase())) return 'Mom';
    if (/^(dad|daddy|papa|papá)$/i.test(n) || (H && n.toLowerCase() === String(H.dad).toLowerCase())) return 'Dad';
    if (typeof player !== 'undefined' && player && player.name && n === player.name) return 'You';
    return n.slice(0, 24);
}
// Who is this? (so a kid doesn't get a Giant voice): remembered per person when the game tells us — { k: 1 = a kid, f: 1 = female }
function voHint(key, opts) {
    if (!opts || (opts.kid === undefined && opts.female === undefined)) return;
    voStore.hints = voStore.hints || {};
    const cur = voStore.hints[key] || {};
    const next = { k: opts.kid === undefined ? cur.k : (opts.kid ? 1 : 0), f: opts.female === undefined ? cur.f : (opts.female ? 1 : 0) };
    if (cur.k !== next.k || cur.f !== next.f) { voStore.hints[key] = next; voSave(); }
}
// The kind of voice a person should have: { ps: allowed pitches, ts: allowed timbres, known: true when we know who they are }
function voClassFor(key) {
    const ALL_T = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
    if (key === 'Mom') return { ps: [6, 7, 8], ts: [0, 1, 4, 8, 9], known: true };               // a warm, mid-high voice
    if (key === 'Dad') return { ps: [1, 2, 3], ts: [0, 1, 2, 5, 7], known: true };                // a low voice
    if (key === 'You') return { ps: range(5, 8), ts: ALL_T, known: true };
    if (key === 'Professor') return { ps: [2, 3, 4], ts: [0, 1, 4], known: true };
    let hint = (voStore.hints || {})[key];
    if (!hint && typeof voFindNpc === 'function') { const g = voFindNpc(key), t = g && voTalker(g); if (t) hint = { k: t.kid ? 1 : 0, f: t.female ? 1 : 0 }; }   // look the person up in the scene
    if (!hint) return { ps: range(0, 11), ts: ALL_T, known: false };
    if (hint.k) return { ps: hint.f === 0 ? range(7, 10) : range(8, 11), ts: [0, 1, 3, 6, 8, 9], known: true };   // KIDS sound like kids: high and light (never Giant/Growl/Robot)
    return hint.f ? { ps: range(5, 7), ts: ALL_T, known: true } : { ps: range(1, 4), ts: ALL_T, known: true };    // grown-up women mid-bright, men deep-warm
}
// the default voice: picked from their name inside their class, skipping voices other people already use (so everyone sounds different), then remembered
function voDefaultFor(key) {
    const cls = voClassFor(key), h = voHash(key);
    voStore.auto = voStore.auto || {};
    if (voStore.auto[key] !== undefined && cls.known) return voStore.auto[key];
    const list = []; cls.ts.forEach(t => cls.ps.forEach(p => list.push(t * 12 + p)));
    const used = new Set(Object.values(voStore.map).concat(Object.keys(voStore.auto).filter(k => k !== key).map(k => voStore.auto[k])));
    let pick = list[h % list.length];
    for (let k = 0; k < list.length; k++) { const id = list[(h + k) % list.length]; if (!used.has(id)) { pick = id; break; } }
    if (cls.known) { voStore.auto[key] = pick; voSave(); }
    return pick;
}
function voiceFor(name) { const k = voKey(name), id = voStore.map[k]; return VOICE_BANK[id !== undefined ? id : voDefaultFor(k)]; }
function voAssign(name, id) { const k = voKey(name); voStore.map[k] = id; voNote(k); voSave(); }
function voNote(k) { if (k && !['You', 'Mom', 'Dad'].includes(k) && !voStore.seen.includes(k) && voStore.seen.length < 80) { voStore.seen.push(k); voSave(); } }

// ---------- the speaker ----------
let voSg = null, voQueue = [], voBusy = false, voTimer = 0;
const voRecent = {};                                         // line -> time, so one line isn't spoken twice

function voStyle() { return typeof clsGet === 'function' ? clsGet('voiceStyle') : 'blips'; }
function voVol() { return (typeof clsGet === 'function' ? clsGet('volVoices') : 100) / 100; }
function voStop() {
    if (voSg && sndCtx) { try { voSg.gain.setTargetAtTime(0, sndCtx.currentTime, 0.02); } catch (e) {} voSg = null; }
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    clearTimeout(voTimer); voBusy = false;
}

// speak `text` as voice `v` (an object from VOICE_BANK). Returns the estimated length in seconds.
// ---- REAL SPEECH: the device's text-to-speech voices. 120 different voices come from  system voice x pitch x speed  ----
let voPoolKey = '', voPool = [], voLastTTS = false;
function voTtsAvailable() { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); }
function voTtsPool() {                                                       // the system voices we use (English first; local ones first because they obey pitch)
    const all = voTtsAvailable() ? speechSynthesis.getVoices() : [];
    const key = all.length + '|' + (all[0] ? all[0].name : '');
    if (key === voPoolKey) return voPool;
    let list = all.filter(x => /^en/i.test(x.lang)); if (!list.length) list = all.slice();
    const local = list.filter(x => x.localService); if (local.length >= 2) list = local;
    const noNet = list.filter(x => !/google|online|natural/i.test(x.name)); if (noNet.length >= 2) list = noNet;     // (network voices ignore pitch)
    list.sort((a, b) => a.name.localeCompare(b.name));
    voPoolKey = key; voPool = list;
    return list;
}
if (voTtsAvailable()) { try { speechSynthesis.addEventListener('voiceschanged', () => { voPoolKey = ''; }); } catch (e) {} }
const VO_RATES = [1.0, 0.95, 1.08, 1.18, 1.0, 0.9, 1.12, 0.85, 1.05, 1.15];            // per timbre: some people talk fast, some slow
function voTtsParams(v) {                                                    // which system voice / pitch / speed makes voice #n
    const pool = voTtsPool();
    // grown-ups (pitches 0-6) stay in a natural range 0.5-1.0 (deep men ... bright women); only the high voices (7-11 = kids) go up to 1.15-1.95
    const pitch = v.pitchIdx <= 6 ? 0.5 + v.pitchIdx * (0.5 / 6) : 1.15 + (v.pitchIdx - 7) * 0.2;
    return { voice: pool.length ? pool[v.timbreIdx % pool.length] : null, pitch: Math.max(0.3, Math.min(2, pitch)), rate: VO_RATES[v.timbreIdx] };
}

// speak `text` as voice `v` (an object from VOICE_BANK). Returns the estimated length in seconds. onEnd (optional) fires when real speech ends.
function voSpeakNow(v, text, onEnd) {
    const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    voLastTTS = false;
    if (!clean) return 0;
    const style = voStyle();
    if (style === 'off' || !(typeof sndOn === 'undefined' || sndOn) || document.hidden) return 0;
    if (style === 'speech' && voTtsAvailable()) {
        const u = new SpeechSynthesisUtterance(clean.slice(0, 200)), p = voTtsParams(v);
        try { if (p.voice) { u.voice = p.voice; u.lang = p.voice.lang; } } catch (e) { /* use the default voice */ }
        u.pitch = p.pitch; u.rate = p.rate; u.volume = Math.min(1, voVol());
        const est = Math.min(14, 0.9 + clean.length / (13 * p.rate));
        let done = false;
        const fin = () => { if (done) return; done = true; if (onEnd) onEnd(); };
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, est * 1000 + 5000);                                  // (some browsers never say "ended")
        try { speechSynthesis.speak(u); voLastTTS = true; return est; } catch (e) { /* fall through to the blips */ }
    }
    if (typeof sndStart === 'function') sndStart();
    if (!sndCtx) return 0;
    const c = sndCtx, T = VO_TIMBRES[v.timbreIdx], now = c.currentTime + 0.03, vol = voVol();
    const sg = c.createGain(); sg.gain.value = 1.5 * vol; sg.connect(sndMaster); voSg = sg;
    const interval = 1 / v.speed, letters = clean.replace(/[^\p{L}\p{N}]/gu, '').length;
    let t = now, k = 0, seen = 0;
    for (let i = 0; i < clean.length && seen < 170; i++) {
        const ch = clean[i];
        if (/\s/.test(ch)) { t += interval * 0.55; continue; }
        if (/[,;:]/.test(ch)) { t += interval * 2; continue; }
        if (/[.!?]/.test(ch)) { t += interval * 3.5; continue; }
        if (!/[\p{L}\p{N}]/u.test(ch)) continue;
        seen++; k++;
        const code = ch.toLowerCase().charCodeAt(0), vowel = 'aeiouáéíóúàèìòù'.includes(ch.toLowerCase());
        let semi = T.flat ? ((code % 3) - 1) * 0.6 : (((code * 5 + k * 3) % 11) - 5) / 5 * v.depth;
        if (/\?\s*$/.test(clean) && seen > letters - 5) semi += (seen - (letters - 5)) * 0.9;     // a question rises at the end
        const f = v.hz * Math.pow(2, semi / 12);
        const len = (T.short ? 0.05 : vowel ? 0.085 : 0.06) * Math.min(1.4, 12 / v.speed + 0.2), amp = (vowel ? 0.6 : 0.4) * (/[A-Z]/.test(ch) ? 1.2 : 1);          // (loud: the first version peaked at -25 dB and was easy to miss)
        const o = c.createOscillator(), g = c.createGain();
        o.type = T.wave;
        o.frequency.setValueAtTime(T.glide ? f / T.glide : f, t);
        if (T.glide) o.frequency.exponentialRampToValueAtTime(f, t + len * 0.8);
        let node = o;
        if (T.lp || T.bp) { const fl = c.createBiquadFilter(); fl.type = T.bp ? 'bandpass' : 'lowpass'; fl.frequency.value = T.bp || T.lp; if (T.q) fl.Q.value = T.q; node.connect(fl); node = fl; }
        if (T.vib) { const lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = T.vib; lg.gain.value = f * T.vibDepth; lf.connect(lg); lg.connect(o.frequency); lf.start(t); lf.stop(t + len + 0.03); }
        const env = T.tre ? 1 : 1;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp * env, t + 0.012); g.gain.setValueAtTime(amp * env, t + len * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        node.connect(g); g.connect(sg);
        o.start(t); o.stop(t + len + 0.03);
        if (T.tre) { const tg = c.createGain(); tg.gain.setValueAtTime(0.6, t); g.connect(tg); }                  // (growl roughness comes from the low saw + filter)
        if (T.noise && sndNoise) { const ns = c.createBufferSource(), ng = c.createGain(); ns.buffer = sndNoise; ng.gain.setValueAtTime(amp * T.noise * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + len); ns.connect(ng); ng.connect(sg); ns.start(t, Math.random(), len + 0.02); }
        t += interval * (vowel ? 1.05 : 0.9);
    }
    return Math.max(0.3, t - now + 0.2);
}

// queue a line spoken by `name` (lines wait for each other)
// opts: { kid, female } (who they are — picks a fitting default voice), { onStart(seconds) } (called when they actually start talking)
function voiceSay(name, text, opts) {
    if (voStyle() === 'off') return;
    const key = voKey(name), clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || clean.length < 2) return;
    const sig = key + '|' + clean, nowMs = Date.now();
    if (voRecent[sig] && nowMs - voRecent[sig] < 4000) return;
    voRecent[sig] = nowMs;
    voHint(key, opts);
    voNote(key);
    if (voQueue.length > 6) voQueue.shift();
    voQueue.push({ key, text: clean, onStart: opts && opts.onStart });
    if (!voBusy) voNext();
}
function voNext() {
    const item = voQueue.shift();
    if (!item) { voBusy = false; return; }
    voBusy = true;
    let advanced = false;
    const advance = () => { if (advanced) return; advanced = true; clearTimeout(voTimer); voTimer = setTimeout(voNext, 220); };     // next person talks when this one has really finished
    let dur = 0;
    try { dur = voSpeakNow(voiceFor(item.key), item.text, advance); } catch (e) { console.warn('voice failed', e); voLastTTS = false; }       // never let one bad line freeze everyone's talking
    if (item.onStart) { try { item.onStart(Math.max(1.2, dur)); } catch (e) {} }
    if (!voLastTTS) { advanced = true; voTimer = setTimeout(voNext, Math.max(150, dur * 1000)); }       // blips: we know how long they last
}

// ---------- hearing the game's dialogue ----------
const VO_QUOTE = /^[^\p{L}]*?([\p{Lu}][\p{L}.'’ -]{0,22}?)(?: says)?\s*:\s*["“](.{2,200}?)["”]/u;
function voParseEl(el) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 4 || text.length > 260) return null;
    const m = VO_QUOTE.exec(text);
    if (m) return [m[1].trim(), m[2]];
    const b = el.querySelector ? el.querySelector(':scope > b, :scope > strong') : null;
    if (b) {
        const lab = b.textContent.trim();
        if (/^[\p{Lu}][\p{L}.'’ -]{0,22}:$/u.test(lab) && el.tagName !== 'BODY') {
            const rest = text.slice(text.indexOf(lab) + lab.length).trim().replace(/^["“]|["”]$/g, '');
            if (rest.length > 1) return [lab.slice(0, -1), rest];
        }
    }
    return null;
}
function voScan(node) {
    if (!node || node.nodeType !== 1 || node.id === 'vo-panel' || (node.closest && node.closest('#vo-panel, #cls-panel, #hg-panel, #hg-picker'))) return;
    const list = [node].concat(node.querySelectorAll ? Array.from(node.querySelectorAll('p, div, li, span')).slice(0, 40) : []);
    for (const el of list) {
        const r = voParseEl(el);
        if (r) { voiceSay(r[0], r[1]); if (el === node) return; }
    }
}

// chat bubbles carry no "Name:" label, so hook the chat function itself
(function wrap() {
    if (typeof addChatMessage === 'function') {
        const o = addChatMessage;
        addChatMessage = function (text, isPlayer) {
            const r = o.apply(this, arguments);
            try {
                const nm = typeof activeChatName !== 'undefined' && activeChatName, fr = nm && typeof FRIEND_RESPONSES !== 'undefined' ? FRIEND_RESPONSES[nm] : null;
                voiceSay(isPlayer ? 'You' : nm || 'Friend', text, isPlayer ? { female: typeof player !== 'undefined' && player.gender === 'girl', kid: typeof player !== 'undefined' && player.age < 18 } : fr ? { kid: !fr.adult } : undefined);
            } catch (e) {}
            return r;
        };
    }
    // the teacher reads the lesson aloud (lessons.js) and the professor says what today's exercise teaches (lecture-tasks.js)
    if (typeof lessonShell === 'function') {
        const o = lessonShell;
        lessonShell = function (title, teacher, body) {
            const r = o.apply(this, arguments);
            try { const t = String(body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150); if (t) voiceSay(teacher || 'Teacher', t, { kid: false, female: /^(ms|mrs|miss)\b/i.test(String(teacher || '')) }); } catch (e) {}
            return r;
        };
    }
    if (typeof runLectureTask === 'function') {
        const o = runLectureTask;
        runLectureTask = function (major, index) {
            const r = o.apply(this, arguments);
            try { const g = STUDY_GAMES[major.id][index]; if (g && g.teach) voiceSay('Professor', g.teach, { kid: false }); } catch (e) {}
            return r;
        };
    }
    if (typeof closeChat === 'function') { const o = closeChat; closeChat = function () { voQueue.length = 0; voStop(); return o.apply(this, arguments); }; }
})();

// ---------- people talk to you on their own ----------
// Every so often someone close to you (a neighbour, a classmate, the teacher, a relative...) says something in THEIR voice, with a
// speech bubble over their head. ⚙️ Settings → "People talk around you" turns it off.
const VO_KID_LINES = ['Hi!', 'Hello! Want to play?', "Look, it's so sunny!", 'I love recess!', 'Race you to the corner!', "What's your name?", "I'm so hungry!", 'Do you like it here?', 'Hey, wait for me!', 'This is my favorite street!'];
const VO_ADULT_LINES = ['Good morning!', "Lovely day, isn't it?", 'Nice to see you!', 'Have a great day!', 'Mind the traffic out there.', 'Hello there!', 'Busy day today!', 'Take care now!'];
const VO_TEACHER_LINES = ['Settle down, everyone.', "Don't forget your homework!", 'Eyes on the board, please.', 'Good work today, class!'];
let voNextChatter = 0, voChatterScene = null;

function voTalker(group) {                                                    // who is this NPC? -> { name, kid, female, teacher } or null
    const d = group && group.userData && group.userData.npcData;
    if (!d || !d.name || d.isShelf || d.isBall || d.isGift || d.isPet || d.isBully) return null;
    const role = String(d.role || '').toLowerCase(), teacher = d.npcType === 'teacher';
    const adult = teacher || /mom|dad|mother|father|parent|gran|uncle|aunt|adult/.test(role) || d.adult === true;
    const female = d.gender === 'girl' || /mom|mother|gran|aunt|girl/.test(role) || (teacher && /^(ms|mrs|miss)\b/i.test(d.name));
    return { name: d.name, kid: !adult, female: !!female, teacher };
}
function voShowBubble(group, text, secs) {
    if (typeof makeLabelSprite !== 'function' || !group || !group.parent) return;
    const old = group.getObjectByName('voBubble'); if (old) voDropBubble(old);
    const gs = group.scale.x || 1;
    const sp = makeLabelSprite(text, { w: 460, h: 100, size: 36, bg: '#ffffff', fg: '#222222', sw: 3.4 / gs, sh: 0.74 / gs });
    sp.name = 'voBubble'; sp.position.set(0, 2.55, 0); sp.raycast = () => {}; sp.renderOrder = 6;
    group.add(sp);
    setTimeout(() => voDropBubble(sp), Math.max(1500, secs * 1000));
}
function voDropBubble(sp) { if (sp.parent) sp.parent.remove(sp); if (sp.material) { if (sp.material.map) sp.material.map.dispose(); sp.material.dispose(); } }

function voChatter() {
    if (typeof clsGet === 'function' && !clsGet('talkAround')) return;
    if (voStyle() === 'off' || voBusy || document.hidden || typeof clickableNPCs === 'undefined' || typeof camera === 'undefined' || !camera) return;
    if (document.getElementById('chat-overlay') || document.getElementById('life-panel') || document.getElementById('lesson-overlay') || document.getElementById('math-overlay')) return;   // someone is already talking to you
    const now = Date.now();
    if (!voNextChatter) voNextChatter = now + 1500;
    if (now < voNextChatter) return;
    voNextChatter = now + 9000 + Math.random() * 8000;
    const cam = camera.position, p = typeof playerMesh !== 'undefined' && playerMesh ? playerMesh.position : cam, v = new THREE.Vector3(), cands = [];
    clickableNPCs.forEach(g => {
        const t = voTalker(g); if (!t || !g.parent || g.visible === false) return;
        g.getWorldPosition(v);
        const d = Math.hypot(v.x - cam.x, v.z - cam.z);
        if (d < 18) cands.push({ g, t, d, near: Math.hypot(v.x - p.x, v.z - p.z) < 6 });
    });
    // Mom & Dad at home (they aren't clickable, so they aren't in clickableNPCs)
    [['Mom', typeof momMesh !== 'undefined' ? momMesh : null, true], ['Dad', typeof dadMesh !== 'undefined' ? dadMesh : null, false]].forEach(([nm, g, fem]) => {
        if (g && g.parent && g.visible !== false) cands.push({ g, t: { name: nm, kid: false, female: fem, teacher: false, parent: true }, d: 3, near: true });
    });
    if (!cands.length) return;
    const pick = cands[Math.floor(Math.random() * cands.length)], t = pick.t;
    if (t.parent) {
        const L = player.age < 3 ? ['Aww, my little baby!', 'Are you hungry, sweetie?', 'Coochie coo!', 'Time for a nap soon!'] : ['Are you hungry, sweetie?', 'Did you sleep well?', 'Come here, give me a hug!', 'I love you so much!', 'Time to eat soon!', 'You are such a good kid!'];
        const line = Math.random() < 0.3 ? `${player.name}, I love you!` : L[Math.floor(Math.random() * L.length)];
        voiceSay(t.name, line, { kid: false, female: t.female, onStart: secs => voShowBubble(pick.g, line, secs) });
        return;
    }
    const raining = typeof isRaining === 'function' && isRaining(), dark = typeof rlDaylight === 'function' && rlDaylight().h < 0;
    let line;
    if (pick.near && Math.random() < 0.6) line = t.kid ? `Hi, ${player.name}!` : `Hello, ${player.name}! How are you?`;
    else if (raining && Math.random() < 0.5) line = 'Wow, it is really raining!';
    else if (dark && Math.random() < 0.5) line = "It's getting dark out here!";
    else { const bank = t.teacher ? VO_TEACHER_LINES : t.kid ? VO_KID_LINES : VO_ADULT_LINES; line = bank[Math.floor(Math.random() * bank.length)]; }
    voiceSay(t.name, line, { kid: t.kid, female: t.female, onStart: secs => voShowBubble(pick.g, line, secs) });
}

// ---------- they answer you, in any way ----------
// Lots of replies are told as plain banners ("Sam gave you a snack", "You beat Mia!", "You're IT!") with no quotation marks, so the
// listener above can't hear them. Here the person named in the banner REACTS out loud (and in a bubble).
function voFindNpc(name) { return (typeof clickableNPCs !== 'undefined' ? clickableNPCs : []).find(g => g.userData && g.userData.npcData && g.userData.npcData.name === name && g.parent) || null; }
function voSayAs(name, line) {
    const g = voFindNpc(name), t = g ? voTalker(g) : null;
    voiceSay(name, line, t ? { kid: t.kid, female: t.female, onStart: secs => voShowBubble(g, line, secs) } : undefined);
}
const VO_REACTIONS = [
    [/gave you|snack/i,                       n => ['Here, enjoy!', 'I saved this for you!', 'Yummy, right?']],
    [/best friends/i,                         n => ["We're best friends!", 'Yay! You are my best friend!']],
    [/good friends/i,                         n => ["Yay, we're friends now!", 'I like playing with you!']],
    [/You beat/i,                             n => ['Aww, you won!', 'Good game! You are really good!']],
    [/won this round|wins this round/i,       n => ['Ha ha, I got you!', 'Ooh, my turn to win!']],
    [/Good game/i,                            n => ['I won! Good game!', 'That was fun! Play again?']],
    [/Tag! You caught/i,                      n => ['Oh no, you caught me!', 'You are so fast!']],
    [/got away/i,                             n => ["Ha ha, you can't catch me!", 'Too slow!']],
    [/You're IT/i,                            n => ['Catch me if you can!', 'Run, run, run!']],
    [/Walk closer/i,                          n => ['Come over here!', "I'm right here!"]],
    [/came to visit/i,                        n => ['Hello! I came to see you!', 'Surprise! Hi there!']],
    [/missing pet|found .*pet|thank/i,        n => ['Thank you so much!', 'You are a hero!']]
];
function voReact(message) {
    if (typeof clsGet === 'function' && !clsGet('talkAround')) return;
    const text = String(message || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || VO_QUOTE.test(text)) return;                                // lines with quotes are already spoken
    const names = (typeof clickableNPCs !== 'undefined' ? clickableNPCs : []).map(g => g.userData && g.userData.npcData && g.userData.npcData.name).filter(Boolean)
        .sort((a, b) => b.length - a.length);
    const who = names.find(n => text.includes(n));
    if (!who) return;
    const rule = VO_REACTIONS.find(r => r[0].test(text));
    if (!rule) return;
    const list = rule[1](who);
    voSayAs(who, list[Math.floor(Math.random() * list.length)]);
}

// ---------- they talk to EACH OTHER ----------
// Two people standing near each other have a little conversation, turn by turn, each in their own voice with a bubble.
// [who (0 or 1), line] — {a} {b} are their names. Kids chat about play and school, grown-ups about the day.
const VO_KID_TALK = [
    [[0, 'Hi {b}! Did you finish your homework?'], [1, 'Yes! It was really easy.'], [0, 'Lucky! Mine was so hard.'], [1, 'I can help you after school!']],
    [[0, 'Hey {b}, want to play tag?'], [1, 'Yes! You are it!'], [0, 'No fair, I was not ready!'], [1, 'Ha ha, run!']],
    [[0, 'What is your favorite animal, {b}?'], [1, 'I love dogs! What about you?'], [0, 'I like cats best.'], [1, 'Cats are cool too!']],
    [[0, 'Look at that big cloud!'], [1, 'It looks like a dragon!'], [0, 'Ha ha, you are so funny, {b}!']],
    [[0, 'Are you hungry, {b}?'], [1, 'So hungry! I want pizza.'], [0, 'Pizza is the best!'], [1, 'Let us ask for some!']],
    [[0, 'Did you see the teacher today?'], [1, 'Yes, she gave us a big test!'], [0, 'Oh no! I hope I did well.'], [1, 'You always do great, {a}!']]
];
const VO_ADULT_TALK = [
    [[0, 'Good morning, {b}! How are you?'], [1, 'Very well, thank you, {a}. And you?'], [0, 'Busy, but good!'], [1, 'Have a lovely day!']],
    [[0, 'Lovely weather today, isn\'t it?'], [1, 'It really is! Perfect for a walk.'], [0, 'I might take the kids to the park.']],
    [[0, 'Did you hear about the new shop at the mall?'], [1, 'Yes! I want to go this weekend.'], [0, 'We should go together, {b}.'], [1, 'That sounds great!']],
    [[0, 'How is work, {b}?'], [1, 'Tiring, but I like it.'], [0, 'You deserve a good rest.'], [1, 'Thank you, {a}.']],
    [[0, 'The street looks so nice today.'], [1, 'The trees are growing so tall!'], [0, 'It is a wonderful neighborhood.']]
];
const VO_MIXED_TALK = [
    [[0, 'Hello, {b}! How was school today?'], [1, 'It was fun! We painted pictures.'], [0, 'That sounds wonderful!'], [1, 'I will show you later!']],
    [[0, 'Good morning, {b}! Off to play?'], [1, 'Yes! Can I go to the park?'], [0, 'Of course, but be careful.'], [1, 'I will, thank you!']]
];
let voNextConvo = 0, voConvoGen = 0;
function voConverse() {
    if (typeof clsGet === 'function' && !clsGet('talkAround')) return;
    if (voStyle() === 'off' || voBusy || document.hidden || typeof clickableNPCs === 'undefined' || typeof camera === 'undefined' || !camera) return;
    if (document.getElementById('chat-overlay') || document.getElementById('life-panel') || document.getElementById('lesson-overlay') || document.getElementById('math-overlay')) return;
    const now = Date.now();
    if (!voNextConvo) voNextConvo = now + 12000;
    if (now < voNextConvo) return;
    voNextConvo = now + 22000 + Math.random() * 22000;
    const cam = camera.position, v = new THREE.Vector3(), pos = [];
    clickableNPCs.forEach(g => { const t = voTalker(g); if (!t || !g.parent || g.visible === false) return; g.getWorldPosition(v); if (Math.hypot(v.x - cam.x, v.z - cam.z) < 18) pos.push({ g, t, x: v.x, z: v.z }); });
    let best = null;
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {            // the closest two people (not you)
        if (pos[i].t.name === pos[j].t.name) continue;
        const d = Math.hypot(pos[i].x - pos[j].x, pos[i].z - pos[j].z);
        if (d < 10 && (!best || d < best.d)) best = { a: pos[i], b: pos[j], d };
    }
    if (!best) return;
    const A = best.a, B = best.b, kids = (A.t.kid ? 1 : 0) + (B.t.kid ? 1 : 0);
    const bank = kids === 2 ? VO_KID_TALK : kids === 0 ? VO_ADULT_TALK : VO_MIXED_TALK;
    const script = bank[Math.floor(Math.random() * bank.length)];
    const who = [A, B];
    if (kids === 1 && !A.t.kid) { who[0] = A; who[1] = B; } else if (kids === 1) { who[0] = B; who[1] = A; }          // mixed scripts: the grown-up starts
    // they turn to face each other
    const dx = B.x - A.x, dz = B.z - A.z;
    try { A.g.rotation.y = Math.atan2(dx, dz); B.g.rotation.y = Math.atan2(-dx, -dz); } catch (e) {}
    const gen = ++voConvoGen;
    voQueue.length = 0;
    script.forEach(([s, line]) => {
        const sp = who[s], other = who[1 - s];
        const text = line.replace(/\{a\}/g, sp.t.name.replace(/^(Mr|Mrs|Ms|Miss)\.?\s+/, '')).replace(/\{b\}/g, other.t.name.replace(/^(Mr|Mrs|Ms|Miss)\.?\s+/, ''));
        voQueue.push({ key: voKey(sp.t.name), text, onStart: secs => { if (gen === voConvoGen) voShowBubble(sp.g, text, secs); } });
        voHint(voKey(sp.t.name), { kid: sp.t.kid, female: sp.t.female }); voNote(voKey(sp.t.name));
    });
    voNextChatter = now + 60000;                                                      // (the random one-liners wait while they chat)
    if (!voBusy) voNext();
}

(function wrapReactions() {
    if (typeof showEvent === 'function') {
        const o = showEvent;
        showEvent = function (emoji, message) { const r = o.apply(this, arguments); try { voReact(message); } catch (e) {} return r; };
    }
    if (typeof openNeighborMenu === 'function') {                       // you click a neighbour: they greet you
        const o = openNeighborMenu;
        openNeighborMenu = function (npcData) {
            const r = o.apply(this, arguments);
            try { if (npcData && npcData.name && !(Date.now() < (window.__voGreetCool || 0))) { window.__voGreetCool = Date.now() + 4000; voSayAs(npcData.name, Math.random() < 0.5 ? `Hi, ${player.name}!` : `Hello ${player.name}! Nice to see you!`); } } catch (e) {}
            return r;
        };
    }
})();

// ---------- the 🗣️ Voices panel ----------
let voSelected = 0;
function voPeopleList() {
    const names = ['You', 'Mom', 'Dad', 'Teacher', 'Waiter', 'Cashier', 'Chef', 'Dr. Smith'];
    try { const cd = CITY_DATA.find(c => c.name === player.city); if (cd && cd.classmates) cd.classmates.forEach(c => names.push(c.name || c)); } catch (e) {}
    voStore.seen.forEach(n => names.push(n)); voStore.custom.forEach(n => names.push(n));
    return Array.from(new Set(names.map(n => String(n))));
}
function voOpenPanel() {
    let p = document.getElementById('vo-panel');
    if (!p) {
        p = document.createElement('div'); p.id = 'vo-panel';
        p.style.cssText = 'display:none; position:fixed; inset:0; z-index:410; background:rgba(0,0,0,0.6); align-items:center; justify-content:center;';
        p.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') voClosePanel(); });
        p.addEventListener('keyup', e => e.stopPropagation());
        p.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === p) voClosePanel(); });
        document.body.appendChild(p);
    }
    p.style.display = 'flex';
    voRenderPanel();
}
function voClosePanel() { const p = document.getElementById('vo-panel'); if (p) p.style.display = 'none'; voQueue.length = 0; voStop(); }
function voPreview(id) { voQueue.length = 0; voStop(); const v = VOICE_BANK[id]; voSpeakNow(v, `Hi! I'm voice number ${v.num}. Nice to meet you!`); }
function voVoiceLabel(v) { return '#' + String(v.num).padStart(3, '0') + ' ' + v.name; }

function voRenderPanel() {
    const p = document.getElementById('vo-panel'); if (!p) return;
    const people = voPeopleList(), v = VOICE_BANK[voSelected];
    const btn = 'padding:5px 9px; border-radius:7px; border:1px solid #3498db; background:#0f3460; color:#fff; cursor:pointer; font-size:0.85em;';
    const grid = VOICE_BANK.map(x => `<button data-id="${x.id}" title="${voVoiceLabel(x)}" style="padding:3px 0; border-radius:6px; border:2px solid ${x.id === voSelected ? '#f1c40f' : '#2c3e60'}; background:#16213e; color:#fff; cursor:pointer; font-size:0.72em;">${String(x.num).padStart(3, '0')}</button>`).join('');
    const rows = people.map(n => { const cur = voiceFor(n); return `<div style="display:flex; gap:6px; align-items:center; padding:3px 0; border-bottom:1px solid #2c3e60;">
        <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis;">${n}</span>
        <select data-who="${n}" style="max-width:130px; background:#0f3460; color:#fff; border:1px solid #3498db; border-radius:6px; font-size:0.8em;">${VOICE_BANK.map(x => `<option value="${x.id}" ${x.id === cur.id ? 'selected' : ''}>${voVoiceLabel(x)}</option>`).join('')}</select>
        <button data-play="${n}" style="${btn}">▶</button><button data-use="${n}" title="Give the selected voice to ${n}" style="${btn}">⬅</button></div>`; }).join('');
    p.innerHTML = `<div style="background:#16213e; color:#fff; border:2px solid #3498db; border-radius:14px; padding:14px 18px; width:min(520px,94vw); max-height:90vh; overflow-y:auto; font-size:0.92em;">
        <h2 style="margin:0">🗣️ Voices <span style="font-size:0.6em; opacity:0.7;">(${VOICE_BANK.length} to choose from)</span></h2>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:8px 0;">
            <label>Speech: <select id="vo-style" style="background:#0f3460; color:#fff; border:1px solid #3498db; border-radius:6px;"><option value="speech">Real speech (spoken voices)</option><option value="blips">Blips (musical sounds)</option><option value="off">Off</option></select></label>
            <label>Volume <input id="vo-vol" type="range" min="0" max="100" step="5" style="width:110px; vertical-align:middle;"></label>
        </div>
        <div style="color:#5dade2; font-weight:bold; margin-top:6px;">🎧 Voice library — tap a number to hear it</div>
        <div style="display:grid; grid-template-columns:repeat(12,1fr); gap:3px; margin-top:4px;">${grid}</div>
        <div style="margin:6px 0; background:#0f3460; border-radius:8px; padding:6px 8px;">Selected: <b>${voVoiceLabel(v)}</b>
            <button id="vo-hear" style="${btn} margin-left:6px;">▶ Hear it</button>
            <button id="vo-rand" style="${btn}">🎲 Random</button></div>
        <div style="color:#5dade2; font-weight:bold; margin-top:8px;">👥 Who sounds like what</div>
        <div style="opacity:0.7; font-size:0.85em;">Pick from the list, or press ⬅ to give a person the selected voice.</div>
        ${rows}
        <div style="display:flex; gap:6px; margin-top:8px;"><input id="vo-new" placeholder="Add a person's name…" style="flex:1; padding:6px; border-radius:7px; border:1px solid #3498db; background:#0f3460; color:#fff;"><button id="vo-add" style="${btn}">+ Add</button></div>
        <div style="display:flex; gap:8px; margin-top:10px;"><button id="vo-reset" style="${btn} flex:1;">↺ Reset all voices</button><button id="vo-close" style="${btn} flex:1; background:#3498db;">✖ Close</button></div></div>`;
    p.querySelector('#vo-style').value = voStyle(); p.querySelector('#vo-vol').value = voVol() * 100;
    p.querySelector('#vo-style').onchange = e => { if (typeof clsSet === 'function') clsSet('voiceStyle', e.target.value); };
    p.querySelector('#vo-vol').oninput = e => { if (typeof clsSet === 'function') clsSet('volVoices', Number(e.target.value)); };
    p.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => { voSelected = Number(b.dataset.id); voPreview(voSelected); voRenderPanelKeepScroll(); });
    p.querySelector('#vo-hear').onclick = () => voPreview(voSelected);
    p.querySelector('#vo-rand').onclick = () => { voSelected = Math.floor(Math.random() * VOICE_BANK.length); voPreview(voSelected); voRenderPanelKeepScroll(); };
    p.querySelectorAll('select[data-who]').forEach(s => s.onchange = () => { voAssign(s.dataset.who, Number(s.value)); voPreview(Number(s.value)); });
    p.querySelectorAll('button[data-play]').forEach(b => b.onclick = () => { voQueue.length = 0; voStop(); voSpeakNow(voiceFor(b.dataset.play), `Hello, I'm ${b.dataset.play}.`); });
    p.querySelectorAll('button[data-use]').forEach(b => b.onclick = () => { voAssign(b.dataset.use, voSelected); voRenderPanelKeepScroll(); });
    p.querySelector('#vo-add').onclick = () => { const n = p.querySelector('#vo-new').value.trim().slice(0, 24); if (n) { if (!voStore.custom.includes(n)) voStore.custom.push(n); voSave(); voRenderPanelKeepScroll(); } };
    p.querySelector('#vo-reset').onclick = () => { voStore.map = {}; voStore.auto = {}; voSave(); voRenderPanelKeepScroll(); };
    p.querySelector('#vo-close').onclick = voClosePanel;
}
function voRenderPanelKeepScroll() { const box = document.querySelector('#vo-panel > div'), y = box ? box.scrollTop : 0; voRenderPanel(); const b2 = document.querySelector('#vo-panel > div'); if (b2) b2.scrollTop = y; }

function installVoices() {
    if (document.getElementById('voices-btn')) return;
    const b = document.createElement('button');
    b.id = 'voices-btn'; b.textContent = '🗣️ Voices';
    b.style.cssText = 'display:none; position:fixed; top:192px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
    b.onclick = voOpenPanel;
    document.body.appendChild(b);
    setInterval(() => { const g = document.getElementById('game-screen'); b.style.display = g && !g.classList.contains('hidden') ? 'block' : 'none'; }, 500);
    setInterval(voChatter, 1000);                         // people nearby start talking now and then
    setInterval(voConverse, 1500);                        // ...and sometimes two of them have a little conversation
    // hear dialogue the game shows
    new MutationObserver(muts => { for (const m of muts) m.addedNodes.forEach(voScan); }).observe(document.body, { childList: true, subtree: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installVoices); else installVoices();
