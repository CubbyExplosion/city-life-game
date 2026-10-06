// =============================================
// SETTINGS — a ⚙️ panel for things that change how the game LOOKS, SOUNDS and FEELS to control,
// never how it PLAYS (no difficulty, money, day length or crime options live here).
//
//   Sound:     master / vehicle / weather / footsteps volume, mute.
//   View:      first person on/off, field of view, look sensitivity, camera shake when you crash.
//   Graphics:  quality (sharpness), shadows, rain drawing, FPS counter.
//   Everything is saved in localStorage ('citylife_settings') and applied instantly. "Reset" restores the defaults.
//
// Other files read a value with clsGet('name') (see CLS_DEFAULTS below); this file only stores and applies them.
// Hooks: firstperson.js (fov, look speed), travel.js (shake), realism.js (shadows, rain), sound.js (volumes).
// =============================================

const CLS_DEFAULTS = {
    volMaster: 80,      // 0-100
    volVehicle: 100,    // engine, siren, crash
    volWeather: 100,    // rain
    volSteps: 100,      // footsteps
    volBirds: 100,      // birdsong
    volVoices: 100,     // people talking (voices.js)
    talkAround: true,   // people near you start talking now and then, with a speech bubble (voices.js)
    voiceStyle: 'speech', // 'speech' (REAL spoken voices: your device's text-to-speech) | 'blips' (musical babble, the fallback) | 'off'
    nature: true,       // swaying trees + flying birds
    fov: 72,            // first-person field of view
    lookSpeed: 100,     // % of the normal mouse/touch look speed
    shake: true,        // camera shake when you bump a car
    quality: 'high',    // low / medium / high  -> picture sharpness (pixel ratio)
    shadows: true,
    rain: true,         // draw the falling rain (the sound is separate)
    fps: false          // show a frames-per-second counter
};
let clsValues = Object.assign({}, CLS_DEFAULTS);
try { Object.assign(clsValues, JSON.parse(localStorage.getItem('citylife_settings') || '{}')); } catch (e) {}
if (!clsValues._v || clsValues._v < 2) { clsValues.voiceStyle = CLS_DEFAULTS.voiceStyle; clsValues._v = 2; }     // v2: voices are now real speech by default (older saves had 'blips')

function clsGet(k) { return clsValues[k] !== undefined ? clsValues[k] : CLS_DEFAULTS[k]; }
function clsSet(k, v) {
    clsValues[k] = v;
    try { localStorage.setItem('citylife_settings', JSON.stringify(clsValues)); } catch (e) {}
    clsApply();
}

// ---- applying ----
let clsFpsBox = null, clsFpsFrames = 0, clsFpsLast = performance.now();
function clsPixelRatio() {
    const dpr = window.devicePixelRatio || 1, q = clsGet('quality');
    return q === 'low' ? 0.6 : q === 'medium' ? 1 : Math.min(2, dpr);
}
function clsApply() {
    if (typeof renderer !== 'undefined' && renderer) {
        const want = clsPixelRatio();
        if (renderer.getPixelRatio() !== want) {
            renderer.setPixelRatio(want);
            const c = document.getElementById('three-container');
            if (c) renderer.setSize(c.clientWidth, c.clientHeight);
        }
    }
    if (typeof soundApplyVolumes === 'function') soundApplyVolumes();
    if (typeof fpSyncButton === 'function') fpSyncButton();
    if (clsFpsBox) clsFpsBox.style.display = clsGet('fps') ? 'block' : 'none';
    clsSyncPanel();
}

// ---- the panel ----
const CLS_ROWS = [
    { h: '🔊 Sound' },
    { k: 'mute', label: 'Sound on', type: 'bool', get: () => (typeof sndOn !== 'undefined' ? sndOn : true), set: v => { if (typeof sndOn !== 'undefined' && sndOn !== v) soundToggle(); } },
    { k: 'volMaster', label: 'Master volume', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'volVehicle', label: 'Cars & siren', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'volWeather', label: 'Rain', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'volSteps', label: 'Footsteps', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'volBirds', label: 'Birdsong', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'volVoices', label: 'People talking', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
    { k: 'talkAround', label: 'People talk around you', type: 'bool' },
    { k: 'voiceStyle', label: 'Voice style (🗣️ Voices)', type: 'choice', opts: [['speech', 'Real speech'], ['blips', 'Blips (sounds)'], ['off', 'Off']] },
    { h: '👁️ View & controls' },
    { k: 'fpv', label: 'First-person view (V)', type: 'bool', get: () => (typeof fpv !== 'undefined' ? fpv : true), set: v => { if (typeof fpv !== 'undefined' && fpv !== v) toggleFirstPerson(); } },
    { k: 'fov', label: 'Field of view', type: 'range', min: 55, max: 100, step: 1, unit: '°' },
    { k: 'lookSpeed', label: 'Look speed (drag)', type: 'range', min: 40, max: 250, step: 10, unit: '%' },
    { k: 'shake', label: 'Camera shake in crashes', type: 'bool' },
    { h: '🖼️ Graphics' },
    { k: 'quality', label: 'Picture quality', type: 'choice', opts: [['low', 'Low (fast)'], ['medium', 'Medium'], ['high', 'High']] },
    { k: 'nature', label: 'Moving trees & birds', type: 'bool' },
    { k: 'shadows', label: 'Shadows', type: 'bool' },
    { k: 'rain', label: 'Show rain', type: 'bool' },
    { k: 'fps', label: 'Show FPS counter', type: 'bool' }
];

function clsRowValue(r) { return r.get ? r.get() : clsGet(r.k); }

function clsBuildPanel() {
    if (document.getElementById('cls-panel')) return;
    const p = document.createElement('div');
    p.id = 'cls-panel';
    p.style.cssText = 'display:none; position:fixed; inset:0; z-index:400; background:rgba(0,0,0,0.6); align-items:center; justify-content:center;';
    let rows = '';
    CLS_ROWS.forEach(r => {
        if (r.h) { rows += `<div style="margin:12px 0 4px; color:#5dade2; font-weight:bold; border-bottom:1px solid #2c3e60; padding-bottom:3px;">${r.h}</div>`; return; }
        let ctl = '';
        if (r.type === 'bool') ctl = `<input type="checkbox" data-k="${r.k}" style="width:20px;height:20px;cursor:pointer;">`;
        else if (r.type === 'range') ctl = `<input type="range" data-k="${r.k}" min="${r.min}" max="${r.max}" step="${r.step}" style="width:150px;cursor:pointer;"><span data-val="${r.k}" style="display:inline-block;width:46px;text-align:right;">${''}</span>`;
        else if (r.type === 'choice') ctl = `<select data-k="${r.k}" style="background:#0f3460;color:#fff;border:1px solid #3498db;border-radius:6px;padding:3px;">${r.opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`;
        rows += `<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:5px 0;"><label style="flex:1;">${r.label}</label><span style="display:flex;align-items:center;gap:6px;">${ctl}</span></div>`;
    });
    p.innerHTML = `<div style="background:#16213e; color:#fff; border:2px solid #3498db; border-radius:14px; padding:18px 22px; width:min(440px, 92vw); max-height:88vh; overflow-y:auto; font-size:0.92em;">
        <h2 style="margin:0 0 4px;">⚙️ Settings</h2>
        <div style="opacity:0.7; font-size:0.85em;">These only change how the game looks and sounds — never how it plays. (The day clock keeps running.)</div>
        <div style="margin-top:6px; font-size:0.8em; background:#3b2a12; border:1px solid #f39c12; border-radius:8px; padding:5px 8px;">⚠️ This game probably isn't the best for people with epilepsy or photosensitivity (flashing police/warning lights, crash shake). Turn off “Camera shake” below, and stop playing if you feel unwell.</div>
        ${rows}
        <div style="display:flex; gap:10px; margin-top:16px;">
            <button id="cls-reset" style="flex:1; padding:8px; border-radius:8px; border:1px solid #7f8c8d; background:#2c3e50; color:#fff; cursor:pointer;">↺ Reset to defaults</button>
            <button id="cls-close" style="flex:1; padding:8px; border-radius:8px; border:none; background:#3498db; color:#fff; font-weight:bold; cursor:pointer;">✖ Close</button>
        </div></div>`;
    document.body.appendChild(p);

    p.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') clsClose(); });   // typing in the panel must not walk you around
    p.addEventListener('keyup', e => e.stopPropagation());
    p.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === p) clsClose(); });
    document.getElementById('cls-close').onclick = clsClose;
    document.getElementById('cls-reset').onclick = () => {
        clsValues = Object.assign({}, CLS_DEFAULTS);
        try { localStorage.setItem('citylife_settings', JSON.stringify(clsValues)); } catch (e) {}
        CLS_ROWS.forEach(r => { if (r.set && r.k === 'mute') r.set(true); if (r.k === 'fpv') r.set(true); });
        clsApply();
    };
    p.querySelectorAll('[data-k]').forEach(el => {
        const row = CLS_ROWS.find(r => r.k === el.dataset.k);
        const onChange = () => {
            const v = row.type === 'bool' ? el.checked : row.type === 'range' ? Number(el.value) : el.value;
            if (row.set) { row.set(v); clsApply(); } else clsSet(row.k, v);
        };
        el.addEventListener(row.type === 'range' ? 'input' : 'change', onChange);
    });
    clsSyncPanel();
}

function clsSyncPanel() {
    const p = document.getElementById('cls-panel');
    if (!p) return;
    CLS_ROWS.forEach(r => {
        if (!r.k) return;
        const el = p.querySelector(`[data-k="${r.k}"]`), val = clsRowValue(r);
        if (!el) return;
        if (r.type === 'bool') el.checked = !!val; else el.value = val;
        const out = p.querySelector(`[data-val="${r.k}"]`);
        if (out) out.textContent = val + r.unit;
    });
}

function clsOpen() { clsBuildPanel(); clsSyncPanel(); document.getElementById('cls-panel').style.display = 'flex'; }
function clsClose() { const p = document.getElementById('cls-panel'); if (p) p.style.display = 'none'; }
function clsToggle() { const p = document.getElementById('cls-panel'); if (p && p.style.display === 'flex') clsClose(); else clsOpen(); }

function installSettings() {
    if (document.getElementById('cls-btn')) return;
    const b = document.createElement('button');
    b.id = 'cls-btn';
    b.textContent = '⚙️ Settings';
    b.style.cssText = 'position:fixed; top:102px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
    b.onclick = clsToggle;
    document.body.appendChild(b);

    clsFpsBox = document.createElement('div');
    clsFpsBox.style.cssText = 'display:none; position:fixed; left:8px; bottom:8px; z-index:120; background:rgba(0,0,0,0.6); color:#7CFC00; font:12px monospace; padding:2px 7px; border-radius:6px; pointer-events:none;';
    document.body.appendChild(clsFpsBox);
    const loop = t => {
        clsFpsFrames++;
        if (t - clsFpsLast >= 500) { if (clsGet('fps')) clsFpsBox.textContent = Math.round(clsFpsFrames * 1000 / (t - clsFpsLast)) + ' FPS'; clsFpsFrames = 0; clsFpsLast = t; }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // the renderer is created later (when a game starts) — keep checking so quality is applied as soon as it exists
    setInterval(clsApply, 1000);
    clsApply();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSettings); else installSettings();
