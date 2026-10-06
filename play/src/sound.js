// =============================================
// SOUND — everything you hear is made on the spot with the Web Audio API (no sound files).
//
//   Engine hum while you drive (pitch follows your speed, a bit of tyre noise), the police SIREN when an officer
//   is chasing you, a THUD when you bump a car, RAIN on rainy days (muffled when you are indoors / in a car),
//   and FOOTSTEPS that change with the ground: wooden floors, pavement, grass, shop tiles.
//   🔊 button (top right) or the M key switches it all off; the choice is remembered.
//
// How: nothing in the other files knows about sound. Ten times a second soundTick() looks at the same variables the
// game already keeps (rideState, isRaining(), playerMesh, the scene flags) and sets the volumes. Browsers only let
// sound start after a click or key press, so the audio context is created on your first one.
// =============================================

let sndCtx = null, sndMaster = null, sndNoise = null;
let sndOn = true;
try { if (localStorage.getItem('citylife_sound') === '0') sndOn = false; } catch (e) {}
let sndRain = null, sndEngine = null, sndSiren = null;
let sndLastPos = null, sndStepAcc = 0, sndLastCrashes = 0, sndLastTick = 0;

function sndStart() {
    if (sndCtx) { if (sndCtx.state === 'suspended') sndCtx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    sndCtx = new AC();
    sndMaster = sndCtx.createGain();
    sndMaster.gain.value = sndOn ? sndVol('volMaster') : 0;
    sndMaster.connect(sndCtx.destination);
    // two seconds of white noise, looped, is the raw material for rain, tyres and footsteps
    const len = sndCtx.sampleRate * 2, buf = sndCtx.createBuffer(1, len, sndCtx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    sndNoise = buf;
    sndBuildLoops();
}

function sndNoiseSource() {
    const s = sndCtx.createBufferSource(); s.buffer = sndNoise; s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random() * 1.5);
    return s;
}

function sndBuildLoops() {
    const c = sndCtx;
    // rain: hissy noise, a low rumble underneath
    const rs = sndNoiseSource(), rhp = c.createBiquadFilter(), rlp = c.createBiquadFilter(), rg = c.createGain();
    rhp.type = 'highpass'; rhp.frequency.value = 700; rlp.type = 'lowpass'; rlp.frequency.value = 7000; rg.gain.value = 0;
    rs.connect(rhp); rhp.connect(rlp); rlp.connect(rg); rg.connect(sndMaster);
    sndRain = { gain: rg, lp: rlp };

    // engine: two detuned saw waves + a square an octave down, through a low-pass; tyre noise rides along
    const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), eg = c.createGain(), elp = c.createBiquadFilter();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; o3.type = 'square';
    o2.detune.value = 14; elp.type = 'lowpass'; elp.frequency.value = 420; eg.gain.value = 0;
    [o1, o2, o3].forEach(o => { o.connect(elp); o.start(); });
    elp.connect(eg); eg.connect(sndMaster);
    const ts = sndNoiseSource(), tbp = c.createBiquadFilter(), tg = c.createGain();
    tbp.type = 'bandpass'; tbp.frequency.value = 500; tg.gain.value = 0;
    ts.connect(tbp); tbp.connect(tg); tg.connect(sndMaster);
    sndEngine = { o1, o2, o3, gain: eg, lp: elp, tyre: tg };

    // siren: a square wave whose pitch sweeps up and down
    const so = c.createOscillator(), lfo = c.createOscillator(), lfoG = c.createGain(), sg = c.createGain(), slp = c.createBiquadFilter();
    so.type = 'square'; so.frequency.value = 780; lfo.frequency.value = 0.9; lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(so.frequency); slp.type = 'lowpass'; slp.frequency.value = 2400; sg.gain.value = 0;
    so.connect(slp); slp.connect(sg); sg.connect(sndMaster); so.start(); lfo.start();
    sndSiren = { gain: sg };
}

// volume sliders from the ⚙️ Settings panel (settings.js), 0..1
function sndVol(k) { return typeof clsGet === 'function' ? clsGet(k) / 100 : (k === 'volMaster' ? 0.8 : 1); }
function soundApplyVolumes() { if (sndMaster) sndSet(sndMaster.gain, sndOn ? sndVol('volMaster') : 0, 0.05); }

function sndSet(param, v, t) { try { param.setTargetAtTime(v, sndCtx.currentTime, t || 0.12); } catch (e) {} }

// one footstep: a short burst of filtered noise (+ a tiny tone for hard floors)
function sndStep(surface, run) {
    if (!sndCtx || !sndOn) return;
    const c = sndCtx, t = c.currentTime;
    const prof = {
        wood:     { f: 320,  q: 1.2, v: 0.34, d: 0.09, tone: 90 },
        pavement: { f: 900,  q: 0.7, v: 0.26, d: 0.07, tone: 0 },
        grass:    { f: 1800, q: 0.5, v: 0.14, d: 0.12, tone: 0 },
        tile:     { f: 1300, q: 2.2, v: 0.30, d: 0.05, tone: 240 }
    }[surface] || { f: 500, q: 1, v: 0.25, d: 0.08, tone: 0 };
    const s = c.createBufferSource(); s.buffer = sndNoise;
    const bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = prof.f * (0.85 + Math.random() * 0.3); bp.Q.value = prof.q;
    const vol = prof.v * (run ? 1.25 : 1) * (0.85 + Math.random() * 0.3) * sndVol('volSteps');
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + prof.d);
    s.connect(bp); bp.connect(g); g.connect(sndMaster); s.start(t, Math.random() * 1.5, prof.d + 0.05);
    if (prof.tone) {
        const o = c.createOscillator(), og = c.createGain();
        o.frequency.setValueAtTime(prof.tone, t); o.frequency.exponentialRampToValueAtTime(prof.tone * 0.5, t + 0.06);
        og.gain.setValueAtTime(vol * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        o.connect(og); og.connect(sndMaster); o.start(t); o.stop(t + 0.08);
    }
}

// a bump: low thump + crunch
function sndCrash() {
    if (!sndCtx || !sndOn) return;
    const c = sndCtx, t = c.currentTime;
    const o = c.createOscillator(), og = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    const cv = sndVol('volVehicle');
    og.gain.setValueAtTime(0.9 * cv + 0.0001, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(og); og.connect(sndMaster); o.start(t); o.stop(t + 0.32);
    const s = c.createBufferSource(); s.buffer = sndNoise;
    const lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1800; g.gain.setValueAtTime(0.6 * cv + 0.0001, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    s.connect(lp); lp.connect(g); g.connect(sndMaster); s.start(t, 0, 0.4);
}

// a little bird call: 2-4 quick rising/falling whistles (nature.js). `loud` 0..1 (quieter through a window)
function soundChirp(loud) {
    sndStart();
    if (!sndCtx || !sndOn || document.hidden) return;
    const c = sndCtx, t0 = c.currentTime, n = 2 + Math.floor(Math.random() * 3), base = 2300 + Math.random() * 1800, up = Math.random() < 0.6;
    const vol = 0.07 * (loud === undefined ? 1 : loud) * sndVol('volBirds');
    for (let i = 0; i < n; i++) {
        const t = t0 + i * (0.09 + Math.random() * 0.03), o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(base * (up ? 0.8 : 1.15), t); o.frequency.exponentialRampToValueAtTime(base * (up ? 1.2 : 0.85), t + 0.07);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol + 0.0001, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        o.connect(g); g.connect(sndMaster); o.start(t); o.stop(t + 0.1);
    }
}

// a light-switch "tick-tock" (lights.js)
function soundClick() {
    sndStart();
    if (!sndCtx || !sndOn) return;
    const c = sndCtx, t = c.currentTime;
    [0, 0.045].forEach((dt, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(i ? 1400 : 1900, t + dt);
        g.gain.setValueAtTime(0.0001, t + dt); g.gain.linearRampToValueAtTime(0.12 * sndVol('volSteps'), t + dt + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.03);
        o.connect(g); g.connect(sndMaster); o.start(t + dt); o.stop(t + dt + 0.04);
    });
}

// what is under your feet right now?
function sndSurface() {
    if (typeof neighborhood3D !== 'undefined' && neighborhood3D) return 'pavement';
    if (typeof mall3D !== 'undefined' && mall3D) return 'tile';
    if (typeof inStore !== 'undefined' && inStore) return 'tile';
    if (typeof inField !== 'undefined' && inField && typeof inSchool !== 'undefined' && inSchool) return 'grass';
    if (typeof place3D !== 'undefined' && place3D) return 'tile';
    return 'wood';                                               // home, classroom
}

function soundTick() {
    if (!sndCtx) return;
    const now = Date.now(), dt = Math.min(0.5, (now - sndLastTick) / 1000 || 0.1); sndLastTick = now;
    const hidden = document.hidden;
    const r = (typeof rideState !== 'undefined') ? rideState : null;
    const inCar = !!r;
    const out = typeof rlOutdoors === 'function' ? rlOutdoors() : true;
    const raining = typeof isRaining === 'function' && isRaining();
    const on = sndOn && !hidden;

    // rain: loud outside, soft through a window / car roof, none in the mall / shop
    const rainVol = !on || !raining ? 0 : inCar ? 0.16 : out ? 0.34 : 0.07;
    sndSet(sndRain.gain.gain, rainVol * sndVol('volWeather'), 0.4);
    const vv = sndVol('volVehicle');
    sndSet(sndRain.lp.frequency, inCar || !out ? 1800 : 7000, 0.3);

    // engine: manual driving uses your speed; the kids' rides purr along at a steady pace
    let engVol = 0, pitch = 0;
    if (r && on) {
        const sp = r.manual ? r.speed : 14;                       // ~0..22
        engVol = 0.10 + Math.min(1, sp / 22) * 0.14;
        pitch = 46 + sp * 5.2;
    }
    sndSet(sndEngine.gain.gain, engVol * vv, 0.15);
    if (pitch) {
        sndSet(sndEngine.o1.frequency, pitch, 0.1); sndSet(sndEngine.o2.frequency, pitch * 1.005, 0.1); sndSet(sndEngine.o3.frequency, pitch * 0.5, 0.1);
        sndSet(sndEngine.lp.frequency, 260 + pitch * 4, 0.1);
        sndSet(sndEngine.tyre.gain, (r && r.manual ? Math.min(1, r.speed / 22) * 0.07 : 0.02) * vv, 0.2);
    } else sndSet(sndEngine.tyre.gain, 0, 0.2);

    // siren while an officer is chasing you; thump when the crash counter goes up
    sndSet(sndSiren.gain.gain, on && r && r.chase ? (inCar ? 0.07 : 0.1) * vv : 0, 0.1);
    if (r && r.manual) {
        if ((r.crashes || 0) > sndLastCrashes) sndCrash();
        sndLastCrashes = r.crashes || 0;
    } else sndLastCrashes = 0;

    // footsteps: count how far playerMesh has walked; one step every ~0.7 units (a bit quicker when running)
    if (inCar || !on || typeof playerMesh === 'undefined' || !playerMesh || !playerMesh.visible && !(typeof fpActive === 'function' && fpActive())) { sndLastPos = null; return; }
    if (typeof player !== 'undefined' && player.age < 3) { sndLastPos = null; return; }       // babies don't walk
    const p = playerMesh.position;
    if (sndLastPos) {
        const d = Math.hypot(p.x - sndLastPos.x, p.z - sndLastPos.z);
        if (d < 3) {                                              // a jump of 3+ is a teleport (new scene), not a walk
            sndStepAcc += d;
            const stride = 0.62;
            if (sndStepAcc >= stride) { sndStepAcc = 0; sndStep(sndSurface(), d / dt > 4.5); }
        } else sndStepAcc = 0;
    }
    sndLastPos = { x: p.x, z: p.z };
}

function soundToggle() {
    sndOn = !sndOn;
    try { localStorage.setItem('citylife_sound', sndOn ? '1' : '0'); } catch (e) {}
    sndStart();
    soundApplyVolumes();
    soundSyncButton();
    if (typeof clsSyncPanel === 'function') clsSyncPanel();
}
function soundSyncButton() {
    const b = document.getElementById('sound-toggle');
    if (b) b.textContent = sndOn ? '🔊 Sound (M)' : '🔇 Sound (M)';
}

function installSound() {
    if (document.getElementById('sound-toggle')) return;
    const b = document.createElement('button');
    b.id = 'sound-toggle';
    b.style.cssText = 'position:fixed; top:72px; right:8px; z-index:120; background:rgba(22,33,62,0.85); color:#fff; border:1px solid #3498db; border-radius:8px; padding:3px 9px; font-size:0.78em; cursor:pointer;';
    b.onclick = soundToggle;
    document.body.appendChild(b);
    soundSyncButton();
    // browsers only allow sound after a click/key, so start on the first one
    const go = () => { sndStart(); };
    window.addEventListener('pointerdown', go, { once: false, passive: true });
    window.addEventListener('keydown', e => {
        go();
        if ((e.key === 'm' || e.key === 'M') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) soundToggle();
    });
    document.addEventListener('visibilitychange', () => { if (sndCtx) { if (document.hidden) sndCtx.suspend(); else sndCtx.resume(); } });
    setInterval(soundTick, 100);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSound); else installSound();
