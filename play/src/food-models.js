// =============================================
// FOOD MODELS — little 3D foods built from Three.js shapes (cylinders, spheres, tori, boxes...).
//
//   buildFoodModel(emoji, name, opts) -> THREE.Group, about 1 unit wide, origin at the bottom centre.
//        opts: { plate: false }   don't draw the plate (the restaurant table already has one)
//              { grocery: true }  milk/water/soda/juice/cereal/ice cream look like store packaging
//   foodIcon(emoji, name, size, opts) -> PNG data-URL of the model (one shared offscreen renderer, cached), or null
//   foodImg(emoji, name, px, opts)    -> '<img ...>' HTML, or the plain emoji if no icon can be made
//   makeFoodSprite(emoji, name, size) -> a camera-facing sprite of the icon (or null)
//   disposeFoodModel(group)           -> frees geometries/materials of a model
//
// Which model? 1) strong words in the dish name ("Cheese Pizza" is a pizza, not a cheese wedge),
// 2) the emoji, 3) weaker name words, 4) a coloured covered dish. Nothing here can crash the game.
// Plain global functions (no modules). Never saved.
// =============================================

// ---------- tiny building helpers (y of cylinders/boxes/cones = their BOTTOM, spheres/tori = their CENTRE) ----------
let fmBump = null;
function fmBumpTexture() {                       // a fine irregular surface (crumb, skin, crust) shared by every food
    if (fmBump) return fmBump;
    const S = 96, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), img = g.createImageData(S, S);
    for (let i = 0; i < S * S; i++) { const v = 90 + Math.random() * 120; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    fmBump = new THREE.CanvasTexture(c); fmBump.wrapS = fmBump.wrapT = THREE.RepeatWrapping; fmBump.dispose = () => {};
    return fmBump;
}
function fmMat(color, o) {
    const c = new THREE.Color(color);
    const light = (c.r + c.g + c.b) / 3;
    const ceramic = light > 0.86 && c.r > 0.84 && c.g > 0.84 && c.b > 0.8;           // plates, cups, bottles: smooth + shiny
    const p = { color: color, roughness: ceramic ? 0.22 : 0.62, metalness: 0.0 };
    if (o && o.dbl) p.side = THREE.DoubleSide;
    if (o && o.alpha) { p.transparent = true; p.opacity = o.alpha; p.depthWrite = false; p.roughness = 0.1; }
    if (o && o.shiny) p.roughness = 0.15;                                             // sauces, glazes, juices
    if (!ceramic && !(o && (o.alpha || o.shiny))) { p.bumpMap = fmBumpTexture(); p.bumpScale = 0.35; }
    return new THREE.MeshStandardMaterial(p);
}
function fmPlace(m, x, y, z, o) {
    m.position.set(x || 0, y || 0, z || 0);
    if (o) {
        if (o.rx) m.rotation.x = o.rx;
        if (o.ry) m.rotation.y = o.ry;
        if (o.rz) m.rotation.z = o.rz;
        if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
    }
    return m;
}
function fmCyl(g, rt, rb, h, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, (o && o.seg) || 30, 1, !!(o && o.open),
        (o && o.t0) || 0, (o && o.tl) || Math.PI * 2), fmMat(color, o));
    fmPlace(m, x, (y || 0) + (o && o.c ? 0 : h / 2), z, o); g.add(m); return m;
}
function fmBox(g, w, h, d, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fmMat(color, o));
    fmPlace(m, x, (y || 0) + (o && o.c ? 0 : h / 2), z, o); g.add(m); return m;
}
function fmSph(g, r, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18), fmMat(color, o));
    fmPlace(m, x, y, z, o); g.add(m); return m;
}
function fmDome(g, r, color, x, y, z, o) {          // top half of a sphere; y = its flat bottom
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), fmMat(color, { dbl: true }));
    fmPlace(m, x, y, z, o); g.add(m); return m;
}
function fmTor(g, R, r, color, x, y, z, o) {         // ring lying flat (axis up) unless o.rx is given
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, (o && o.seg) || 36, (o && o.arc) || Math.PI * 2), fmMat(color, o));
    fmPlace(m, x, y, z, o || {});
    if (!o || o.rx === undefined) m.rotation.x = Math.PI / 2;
    g.add(m); return m;
}
function fmCone(g, r, h, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, (o && o.seg) || 16), fmMat(color, o));
    fmPlace(m, x, (y || 0) + (o && o.c ? 0 : h / 2), z, o); g.add(m); return m;
}
function fmCaps(g, r, len, color, x, y, z, o) {      // capsule, long axis = y (use o.rz = PI/2 to lay it along x)
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), fmMat(color, o));
    fmPlace(m, x, y, z, o); g.add(m); return m;
}
function fmLathe(g, pts, color, x, y, z, o) {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 44), fmMat(color, { dbl: true, alpha: o && o.alpha }));
    fmPlace(m, x, y, z, o); g.add(m); return m;
}
// a wedge (triangle prism): tip at x=-len/2, widening to +x, standing h tall, bottom at y
function fmWedge(g, len, halfW, h, color, x, y, z, o) {
    const sh = new THREE.Shape();
    sh.moveTo(-len / 2, 0); sh.lineTo(len / 2, -halfW); sh.lineTo(len / 2, halfW); sh.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }), fmMat(color));
    m.rotation.x = -Math.PI / 2;                       // extrusion depth (z) -> up (y)
    const holder = new THREE.Group();
    holder.add(m);
    holder.position.set(x || 0, y || 0, z || 0);
    if (o && o.ry) holder.rotation.y = o.ry;
    g.add(holder); return holder;
}
// bowl: outer shell + inner liner; returns the y of the inside bottom
function fmBowl(g, r, h, outer, inner, x, y, z) {
    const o = [], i = [], n = 8;
    for (let k = 0; k <= n; k++) {
        const a = k / n * Math.PI / 2;
        o.push([Math.max(0.001, Math.sin(a) * r), h * (1 - Math.cos(a))]);
        i.push([Math.max(0.001, Math.sin(a) * r * 0.94), 0.025 + (h - 0.025) * (1 - Math.cos(a))]);
    }
    fmLathe(g, o, outer, x, y, z);
    fmLathe(g, i, inner === undefined ? outer : inner, x, y, z);
    fmTor(g, r * 0.97, 0.014, outer, x || 0, (y || 0) + h, z || 0);
    return (y || 0) + 0.03;
}
function fmRing(n, cx, cz, rad, a0) {                // n points around a circle
    const a = [];
    for (let k = 0; k < n; k++) { const t = (a0 || 0) + k / n * Math.PI * 2; a.push([cx + Math.cos(t) * rad, cz + Math.sin(t) * rad, t]); }
    return a;
}
function fmHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

// ---------- the builders: fn(group, variant, ctx) ----------
const FM_BUILD = {};
const FM_PLATED = {};          // kinds that sit on a plate

FM_BUILD.pizza = function (g, v) {
    if (v === 'slice') {
        fmWedge(g, 0.85, 0.32, 0.06, 0xDDA85A, 0, 0, 0);
        fmWedge(g, 0.8, 0.28, 0.02, 0xC0392B, 0, 0.06, 0);
        fmWedge(g, 0.78, 0.26, 0.02, 0xF6D675, 0, 0.08, 0);
        fmCyl(g, 0.045, 0.045, 0.015, 0xB5301F, 0.05, 0.1, 0);
        fmCyl(g, 0.045, 0.045, 0.015, 0xB5301F, -0.12, 0.1, 0.05);
        fmCyl(g, 0.045, 0.045, 0.015, 0xB5301F, -0.12, 0.1, -0.05);
        fmCyl(g, 0.05, 0.05, 0.015, 0xB5301F, 0.22, 0.1, 0);
        fmCyl(g, 0.045, 0.045, 0.012, 0xB5301F, 0.22, 0.1, 0.12);
        fmCyl(g, 0.045, 0.045, 0.012, 0xB5301F, 0.22, 0.1, -0.12);
        fmCaps(g, 0.04, 0.5, 0xDDA85A, 0.42, 0.05, 0, { rx: Math.PI / 2 });
        return;
    }
    fmCyl(g, 0.43, 0.43, 0.07, 0xD9A650, 0, 0, 0, { seg: 30 });
    fmCyl(g, 0.37, 0.37, 0.02, 0xC0392B, 0, 0.07, 0, { seg: 30 });
    fmCyl(g, 0.35, 0.35, 0.02, 0xF6D675, 0, 0.09, 0, { seg: 30 });
    const TOPS = {
        pepperoni: [['disc', 0xB5301F, 0.055]],
        veggie: [['ring', 0x3E9B3E, 0.05], ['ball', 0xE8D9C0, 0.04], ['ring', 0x2B2B2B, 0.03], ['ball', 0xD9402B, 0.04]],
        hawaiian: [['cube', 0xF4D03F, 0.05], ['cube', 0xF0A0A0, 0.05]],
        meat: [['disc', 0xB5301F, 0.055], ['ball', 0x6B3A1E, 0.045], ['cube', 0xC8553D, 0.04]],
        bbq: [['cube', 0xF3E2BC, 0.05], ['ball', 0x7A3E1B, 0.035], ['ring', 0x9B3B6B, 0.04]],
        margherita: [['ball', 0xFFFFFF, 0.07], ['leaf', 0x2E8B3C, 0.05]],
        mushroom: [['ball', 0xE9DCC3, 0.05], ['ball', 0x8B6B4A, 0.045]],
        cheese: [['ball', 0xE8B84A, 0.04]]
    };
    const tops = TOPS[v] || TOPS.pepperoni;
    const spots = fmRing(6, 0, 0, 0.24, 0.3).concat(fmRing(3, 0, 0, 0.1, 0.9), fmRing(6, 0, 0, 0.3, 0.8));
    spots.forEach((p, i) => {
        const t = tops[i % tops.length], c = t[1], r = t[2], y = 0.115;
        if (t[0] === 'disc') fmCyl(g, r, r, 0.015, c, p[0], 0.105, p[1]);
        else if (t[0] === 'cube') fmBox(g, r * 2, r, r * 2, c, p[0], 0.105, p[1], { ry: p[2] });
        else if (t[0] === 'ring') fmTor(g, r * 0.8, r * 0.3, c, p[0], y, p[1]);
        else if (t[0] === 'leaf') fmSph(g, r, c, p[0], y, p[1], { s: [1.4, 0.3, 0.8], ry: p[2] });
        else fmSph(g, r, c, p[0], y, p[1], { s: [1, 0.55, 1] });
    });
};
FM_PLATED.pizza = true;

FM_BUILD.burger = function (g) {
    fmCyl(g, 0.36, 0.34, 0.07, 0xDDA04A, 0, 0, 0);
    fmCyl(g, 0.38, 0.38, 0.1, 0x5B3A24, 0, 0.07, 0);
    fmBox(g, 0.62, 0.015, 0.62, 0xF5C242, 0, 0.17, 0, { ry: Math.PI / 4 });
    fmTor(g, 0.36, 0.04, 0x62B84A, 0, 0.2, 0);
    fmCyl(g, 0.3, 0.3, 0.04, 0xD43A2A, 0, 0.19, 0);
    fmDome(g, 0.38, 0xE0A245, 0, 0.23, 0, { s: [1, 0.75, 1] });
    for (let k = 0; k < 10; k++) {
        const th = 0.3 + (k % 3) * 0.3, ph = k * 2.4;
        fmSph(g, 0.022, 0xFFF2CC, Math.sin(th) * Math.cos(ph) * 0.385, 0.23 + Math.cos(th) * 0.285, Math.sin(th) * Math.sin(ph) * 0.385, { s: [1.2, 0.6, 1] });
    }
};
FM_PLATED.burger = true;

FM_BUILD.hotdog = function (g, v) {
    if (v === 'corndog') {
        fmCyl(g, 0.012, 0.012, 0.35, 0xE0C080, -0.45, 0.14, 0, { rz: Math.PI / 2, c: true });
        fmCaps(g, 0.11, 0.5, 0xD99A3A, 0.05, 0.14, 0, { rz: Math.PI / 2 });
        for (let i = 0; i < 6; i++) fmSph(g, 0.025, 0xE8C21A, -0.18 + i * 0.1, 0.25, (i % 2 ? 0.03 : -0.03));
        return;
    }
    fmCaps(g, 0.14, 0.6, 0xE3AE5E, 0, 0.15, 0, { rz: Math.PI / 2 });
    fmCaps(g, 0.1, 0.72, 0xB5452E, 0, 0.23, 0, { rz: Math.PI / 2 });
    for (let i = 0; i < 8; i++) fmSph(g, 0.03, 0xE8C21A, -0.3 + i * 0.085, 0.33, (i % 2 ? 0.035 : -0.035));
};
FM_PLATED.hotdog = true;

FM_BUILD.fries = function (g) {
    fmCyl(g, 0.275, 0.205, 0.33, 0xD8362B, 0, 0, 0, { seg: 4, ry: Math.PI / 4, open: true, dbl: true });
    fmCyl(g, 0.2, 0.2, 0.02, 0xB02A20, 0, 0, 0, { seg: 4, ry: Math.PI / 4 });
    for (let i = 0; i < 16; i++) {
        const a = i * 0.9, rad = 0.03 + (i % 3) * 0.06;
        fmBox(g, 0.06, 0.34, 0.06, i % 2 ? 0xF2C84B : 0xE9B73A, Math.cos(a) * rad, 0.2, Math.sin(a) * rad,
            { rz: ((i * 37) % 7 - 3) * 0.06, rx: ((i * 53) % 7 - 3) * 0.06 });
    }
    fmBox(g, 0.2, 0.1, 0.01, 0xFFD23F, 0, 0.1, 0.19, { ry: 0 });
};

FM_BUILD.sandwich = function (g, v) {
    const bread = v === 'toast' ? 0xD79A4A : 0xE8C48A;
    fmBox(g, 0.7, 0.09, 0.62, bread, 0, 0, 0);
    fmBox(g, 0.74, 0.03, 0.66, 0x62B84A, 0, 0.09, 0);
    fmCyl(g, 0.14, 0.14, 0.03, 0xD43A2A, -0.15, 0.12, 0.05);
    fmCyl(g, 0.14, 0.14, 0.03, 0xD43A2A, 0.15, 0.12, -0.05);
    fmBox(g, 0.72, 0.025, 0.64, 0xF5C242, 0, 0.15, 0, { ry: 0.05 });
    fmBox(g, 0.7, 0.025, 0.6, 0xF0A5A5, 0, 0.175, 0, { ry: -0.04 });
    fmBox(g, 0.7, 0.09, 0.62, bread, 0, 0.2, 0, { ry: 0.06 });
    fmBox(g, 0.6, 0.012, 0.5, 0xF4DCA8, 0, 0.29, 0, { ry: 0.06 });
};
FM_PLATED.sandwich = true;

FM_BUILD.taco = function (g, v) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.62, 20, 1, true, -Math.PI / 2, Math.PI), fmMat(v === 'soft' ? 0xEBD3A0 : 0xE8B84B, { dbl: true }));
    m.rotation.x = Math.PI / 2; m.position.set(0, 0.28, 0); g.add(m);
    for (let i = 0; i < 5; i++) {
        const z = -0.24 + i * 0.12;
        fmSph(g, 0.1, 0x6B3F22, 0, 0.12, z, { s: [1, 0.7, 1] });
        fmSph(g, 0.09, 0x62B84A, (i % 2 ? 0.06 : -0.06), 0.28, z, { s: [1, 0.6, 1] });
        fmBox(g, 0.07, 0.07, 0.07, 0xD43A2A, (i % 2 ? -0.05 : 0.05), 0.3, z + 0.03);
    }
    fmBox(g, 0.3, 0.02, 0.5, 0xF5C242, 0, 0.3, 0);
};
FM_PLATED.taco = true;

FM_BUILD.wrap = function (g, v) {
    const tort = v === 'pita' ? 0xF0DEB5 : v === 'spring' ? 0xE0A040 : 0xE9CF9E;
    const fill = v === 'veggie' ? 0x62B84A : v === 'spring' ? 0xF0D080 : 0x7A4A2A;
    const n = v === 'spring' ? 2 : 1, len = v === 'spring' ? 0.55 : 0.72, r = v === 'spring' ? 0.1 : 0.17;
    for (let k = 0; k < n; k++) {
        const z = n === 1 ? 0 : (k ? 0.17 : -0.17);
        fmCyl(g, r, r, len, tort, 0, r, z, { rz: Math.PI / 2, c: true });
        fmCyl(g, r * 0.78, r * 0.78, 0.01, fill, len / 2 + 0.002, r, z, { rz: Math.PI / 2, c: true });
        fmSph(g, r * 0.4, 0xD43A2A, len / 2 + 0.01, r + 0.03, z, { s: [0.2, 1, 1] });
        if (v !== 'spring') fmTor(g, r + 0.004, 0.012, 0xC9A96E, 0.12, r, z, { ry: Math.PI / 2, rx: 0 });
    }
    if (v === 'pita') for (let i = 0; i < 4; i++) fmSph(g, 0.09, i % 2 ? 0x62B84A : 0xD43A2A, -0.2 + i * 0.13, 0.4, 0, { s: [1, 0.7, 1] });
};
FM_PLATED.wrap = true;

FM_BUILD.pasta = function (g, v) {
    if (v === 'lasagna') {
        const cols = [0xE8C770, 0xC0392B, 0xF5EBD0, 0xC0392B, 0xE8C770];
        cols.forEach((c, i) => fmBox(g, 0.7, 0.05, 0.5, c, 0, i * 0.05, 0));
        fmBox(g, 0.7, 0.03, 0.5, 0xE9A13B, 0, 0.25, 0);
        for (let i = 0; i < 5; i++) fmSph(g, 0.03, 0xA8501E, -0.25 + i * 0.12, 0.29, (i % 2 ? 0.1 : -0.1), { s: [1, 0.4, 1] });
        fmSph(g, 0.05, 0x2E8B3C, 0.2, 0.29, 0.05, { s: [1.4, 0.3, 0.8] });
        return;
    }
    if (v === 'ravioli') {
        [[-0.2, -0.1, 0.3], [0.15, -0.15, -0.2], [0, 0.18, 0.1]].forEach(p => {
            fmBox(g, 0.3, 0.07, 0.3, 0xF3DD9A, p[0], 0, p[1], { ry: p[2] });
            fmBox(g, 0.22, 0.03, 0.22, 0xE8C970, p[0], 0.07, p[1], { ry: p[2] });
        });
        fmSph(g, 0.2, 0xC62828, 0, 0.1, 0.02, { s: [1.2, 0.15, 1] });
        fmSph(g, 0.05, 0x2E8B3C, 0.05, 0.14, 0, { s: [1.4, 0.3, 0.8] });
        return;
    }
    if (v === 'mac') {
        const top = fmBowl(g, 0.4, 0.3, 0xD9D9D9, 0xF2A93B, 0, 0, 0);
        for (let i = 0; i < 14; i++) {
            const a = i * 2.4, rad = 0.05 + (i % 4) * 0.07;
            fmTor(g, 0.045, 0.02, 0xF2A93B, Math.cos(a) * rad, 0.3 + (i % 3) * 0.02, Math.sin(a) * rad, { rx: (i % 3) * 0.7, arc: Math.PI * 1.6 });
        }
        fmSph(g, 0.3, 0xF6B84A, 0, 0.27, 0, { s: [1, 0.25, 1] });
        return;
    }
    fmTor(g, 0.28, 0.07, 0xF2D17A, 0, 0.07, 0);
    fmTor(g, 0.22, 0.07, 0xEDC96B, 0, 0.14, 0, { ry: 0.3 });
    fmTor(g, 0.15, 0.07, 0xF2D17A, 0, 0.21, 0);
    fmTor(g, 0.25, 0.04, 0xF2D17A, 0.02, 0.1, 0.02, { rx: 1.2, ry: 0.5 });
    const sauce = { alfredo: 0xFFF1D0, pesto: 0x5E9E3A, arrabbiata: 0xD9381E, carbonara: 0xF6E2A0 }[v] || 0xC62828;
    fmSph(g, 0.22, sauce, 0, 0.28, 0, { s: [1, 0.4, 1] });
    if (v === 'carbonara') [0, 1.5, 3, 4.5].forEach(a => fmBox(g, 0.1, 0.03, 0.05, 0xB5452E, Math.cos(a) * 0.12, 0.34, Math.sin(a) * 0.12, { ry: a }));
    else if (!v || v === 'meatballs' || v === 'bolognese') [0, 2.1, 4.2].forEach(a => fmSph(g, 0.09, 0x6B3A24, Math.cos(a) * 0.1, 0.36, Math.sin(a) * 0.1));
    fmSph(g, 0.06, 0x2E8B3C, 0, 0.42, 0, { s: [1.4, 0.3, 0.9], ry: 0.5 });
};
FM_PLATED.pasta = true;

FM_BUILD.cutlet = function (g) {                       // breaded chicken with sauce + cheese (chicken parmesan)
    fmSph(g, 0.4, 0xD9A04E, 0, 0.08, 0, { s: [1, 0.2, 0.75] });
    fmSph(g, 0.34, 0xC62828, 0, 0.12, 0, { s: [1, 0.12, 0.7] });
    fmSph(g, 0.3, 0xF6D675, 0, 0.15, 0, { s: [1, 0.1, 0.62] });
    fmSph(g, 0.05, 0x2E8B3C, 0.05, 0.18, 0, { s: [1.4, 0.3, 0.8] });
};
FM_PLATED.cutlet = true;

FM_BUILD.noodles = function (g, v) {
    const brothColors = { ramen: 0xB5762E, pho: 0xD9A867, udon: 0xE6C48A, miso: 0xC29555 };
    const bowlCol = v === 'pho' ? 0xF2F2F2 : 0xC0392B;
    const top = fmBowl(g, 0.44, 0.32, bowlCol, 0xF4EFE6, 0, 0, 0);
    fmCyl(g, 0.4, 0.4, 0.01, brothColors[v] || 0xB5762E, 0, 0.25, 0, { seg: 24 });
    const nc = v === 'udon' ? 0xF4E8CC : 0xF2D78A;
    fmSph(g, 0.24, nc, 0, 0.26, 0, { s: [1, 0.4, 1] });
    for (let i = 0; i < 4; i++) fmTor(g, 0.1, 0.022, nc, Math.cos(i * 1.6) * 0.1, 0.32 + i * 0.01, Math.sin(i * 1.6) * 0.1, { rx: 0.4 * i, arc: Math.PI * 1.5 });
    fmCyl(g, 0.11, 0.11, 0.025, 0xE9A0A0, 0.15, 0.29, 0.14);
    fmSph(g, 0.09, 0xFDFDF8, -0.17, 0.3, 0.1, { s: [1, 0.7, 1] });
    fmSph(g, 0.045, 0xF4A91B, -0.17, 0.35, 0.1);
    fmBox(g, 0.2, 0.2, 0.012, 0x1E3A2A, -0.05, 0.28, -0.2, { rx: -0.3 });
    for (let i = 0; i < 6; i++) fmCyl(g, 0.018, 0.018, 0.02, 0x4CAF50, -0.05 + i * 0.05, 0.31, 0.03 + (i % 2) * 0.06);
    fmCyl(g, 0.012, 0.012, 0.8, 0xB5834A, 0.1, 0.45, 0.1, { rz: 1.25, c: true });
    fmCyl(g, 0.012, 0.012, 0.8, 0xB5834A, 0.14, 0.45, 0.14, { rz: 1.25, c: true });
};

FM_BUILD.stirnoodles = function (g) {
    fmSph(g, 0.3, 0xD08A3E, 0, 0.12, 0, { s: [1, 0.55, 1] });
    for (let i = 0; i < 6; i++) fmTor(g, 0.12, 0.025, 0xE0A055, Math.cos(i * 1.1) * 0.12, 0.2 + i * 0.01, Math.sin(i * 1.1) * 0.12, { rx: 0.3 * i, arc: Math.PI * 1.5 });
    for (let i = 0; i < 6; i++) fmBox(g, 0.06, 0.04, 0.06, [0xD43A2A, 0x4CAF50, 0xF2C94C][i % 3], Math.cos(i * 1.7) * 0.2, 0.22, Math.sin(i * 1.7) * 0.2);
    fmCyl(g, 0.012, 0.012, 0.8, 0xB5834A, 0.1, 0.45, -0.3, { rz: 1.25, c: true });
    fmCone(g, 0.12, 0.1, 0x7CB342, 0.35, 0.02, 0.15);
};
FM_PLATED.stirnoodles = true;

FM_BUILD.ricebowl = function (g, v) {
    fmBowl(g, 0.4, 0.28, 0xF2F2F2, 0xF4EFE6, 0, 0, 0);
    fmTor(g, 0.39, 0.012, 0x3A6EA5, 0, 0.22, 0, { rx: Math.PI / 2 });
    fmDome(g, 0.36, 0xFBFBF5, 0, 0.22, 0, { s: [1, 0.55, 1] });
    if (v === 'bibimbap') {
        [0x4CAF50, 0xF28C28, 0x6B4A2A, 0xEFE6C0, 0xD43A2A].forEach((c, i) => {
            const a = i * 1.256;
            fmSph(g, 0.09, c, Math.cos(a) * 0.19, 0.38, Math.sin(a) * 0.19, { s: [1.3, 0.5, 1], ry: a });
        });
        fmSph(g, 0.1, 0xFDFDF8, 0, 0.42, 0, { s: [1, 0.3, 1] }); fmSph(g, 0.045, 0xF4A91B, 0, 0.45, 0);
    } else if (v === 'poke') {
        for (let i = 0; i < 7; i++) fmBox(g, 0.1, 0.08, 0.1, [0xF47B4B, 0xC93A4B, 0x8BC34A][i % 3], Math.cos(i * 0.9) * 0.2, 0.36, Math.sin(i * 0.9) * 0.2, { ry: i });
    } else if (v === 'donburi') {
        for (let i = 0; i < 4; i++) fmBox(g, 0.34, 0.025, 0.1, 0x7A4A2A, 0, 0.36 + i * 0.012, -0.15 + i * 0.1, { ry: 0.1 * i });
        fmSph(g, 0.1, 0xFDFDF8, 0.1, 0.4, 0.1, { s: [1, 0.35, 1] }); fmSph(g, 0.045, 0xF4A91B, 0.1, 0.43, 0.1);
    } else {
        for (let i = 0; i < 5; i++) fmSph(g, 0.012, 0x2B2B2B, Math.cos(i * 2) * 0.1, 0.405, Math.sin(i * 2) * 0.1);
    }
};

FM_BUILD.friedrice = function (g) {
    fmSph(g, 0.34, 0xE8C46A, 0, 0.08, 0, { s: [1, 0.7, 1] });
    for (let i = 0; i < 12; i++) {
        const a = i * 2.4, rad = 0.05 + (i % 4) * 0.07;
        fmSph(g, 0.03, [0x4CAF50, 0xF28C28, 0xF6E27A, 0x8E2B2B][i % 4], Math.cos(a) * rad, 0.24 + (rad < 0.15 ? 0.04 : 0), Math.sin(a) * rad);
    }
};
FM_PLATED.friedrice = true;

FM_BUILD.curry = function (g, v) {
    const liq = { butter: 0xD9622B, green: 0x7AA83A, red: 0xB8421F, stew: 0x8B4A23, chili: 0x8E2B1B, korma: 0xE8C071, paella: 0xE8B84B }[v] || 0xD98B1F;
    if (v === 'paella') {                                // shallow pan of yellow rice
        fmCyl(g, 0.46, 0.4, 0.1, 0x3A3A3A, 0, 0, 0, { seg: 26 });
        fmCyl(g, 0.4, 0.4, 0.02, liq, 0, 0.1, 0, { seg: 26 });
        for (let i = 0; i < 10; i++) {
            const a = i * 2.4, rad = 0.08 + (i % 3) * 0.1;
            fmSph(g, 0.055, [0xE0522A, 0x4CAF50, 0xF0D8C0][i % 3], Math.cos(a) * rad, 0.14, Math.sin(a) * rad, { s: [1.3, 0.8, 1], ry: a });
        }
        fmTor(g, 0.44, 0.012, 0x222222, 0, 0.1, 0);
        return;
    }
    fmBowl(g, 0.44, 0.3, 0xE8E4DA, 0xF4EFE6, 0, 0, 0);
    fmCyl(g, 0.4, 0.4, 0.01, liq, 0, 0.24, 0, { seg: 24 });
    if (v === 'rice') fmDome(g, 0.2, 0xFBFBF5, -0.14, 0.22, 0, { s: [1, 0.7, 1] });
    for (let i = 0; i < 7; i++) {
        const a = i * 2.2, rad = 0.06 + (i % 3) * 0.08;
        const c = [0xE8C99A, 0xF28C28, 0xBFA070, 0x6DBE4B][i % 4];
        if (i % 2) fmBox(g, 0.09, 0.07, 0.09, c, Math.cos(a) * rad + (v === 'rice' ? 0.12 : 0), 0.24, Math.sin(a) * rad, { ry: a });
        else fmSph(g, 0.05, c, Math.cos(a) * rad + (v === 'rice' ? 0.12 : 0), 0.26, Math.sin(a) * rad);
    }
};

FM_BUILD.soup = function (g, v) {
    const liq = { tomato: 0xD1492E, chicken: 0xE8B84A, pumpkin: 0xE0852B, green: 0x7DB34A, creamy: 0xEFE2C6, miso: 0xC29555 }[v] || 0xE8B84A;
    fmCyl(g, 0.4, 0.34, 0.03, 0xFFFFFF, 0, 0, 0);                // saucer
    fmBowl(g, 0.34, 0.24, 0xF2F2F2, 0xF4EFE6, 0, 0.03, 0);
    fmCyl(g, 0.31, 0.31, 0.01, liq, 0, 0.24, 0, { seg: 22 });
    for (let i = 0; i < 4; i++) fmBox(g, 0.05, 0.05, 0.05, 0xE2B26A, Math.cos(i * 1.7) * 0.1, 0.26, Math.sin(i * 1.7) * 0.1, { ry: i });
    fmTor(g, 0.1, 0.02, 0xFFFFFF, 0, 0.255, 0, {});
    for (let i = 0; i < 5; i++) fmCyl(g, 0.012, 0.012, 0.01, 0x2E8B3C, Math.cos(i * 2.2) * 0.2, 0.255, Math.sin(i * 2.2) * 0.2);
    fmCyl(g, 0.01, 0.01, 0.35, 0xBBBBBB, 0.25, 0.3, 0.2, { rz: 1.2, ry: 0.5 });
};

FM_BUILD.salad = function (g, v) {
    fmBowl(g, 0.45, 0.26, v === 'fruit' ? 0xF2F2F2 : 0xB5834A, v === 'fruit' ? 0xF4EFE6 : 0xC99A5E, 0, 0, 0);
    if (v === 'fruit') {
        for (let i = 0; i < 12; i++) {
            const a = i * 2.4, rad = 0.05 + (i % 4) * 0.08, c = [0xE63946, 0xF5D440, 0xF28C1D, 0x7B2D8E, 0x8BC34A, 0xFFF3C4][i % 6];
            fmSph(g, 0.07, c, Math.cos(a) * rad, 0.26 + (rad < 0.2 ? 0.04 : 0), Math.sin(a) * rad, { s: [1, 0.85, 1] });
        }
        return;
    }
    const greens = [0x5FAE3E, 0x7CC24E, 0x3F9D3A, 0x93D162];
    for (let i = 0; i < 10; i++) {
        const a = i * 2.4, rad = 0.06 + (i % 4) * 0.075;
        fmSph(g, 0.14, greens[i % 4], Math.cos(a) * rad, 0.25 + (rad < 0.2 ? 0.05 : 0), Math.sin(a) * rad, { s: [1, 0.35, 0.8], ry: a, rz: 0.2 });
    }
    [[0.12, 0.1], [-0.1, 0.18], [0.0, -0.18]].forEach(p => fmSph(g, 0.07, 0xD93A2B, p[0], 0.34, p[1]));
    [[-0.15, -0.05], [0.18, -0.1]].forEach(p => fmCyl(g, 0.07, 0.07, 0.02, 0xB5D98A, p[0], 0.33, p[1], { rx: 0.4 }));
    fmTor(g, 0.07, 0.012, 0x8E3B6B, 0.05, 0.36, 0.05, { rx: 0.5 });
    [[0.2, 0.16], [-0.22, -0.14]].forEach(p => fmBox(g, 0.05, 0.05, 0.05, 0xE2B26A, p[0], 0.33, p[1], { ry: 0.5 }));
};

FM_BUILD.steak = function (g, v) {
    if (v === 'ham') {
        fmDome(g, 0.3, 0xE48E86, -0.15, 0.02, 0, { s: [1.2, 0.8, 0.9] });
        [0.2, 0.28, 0.36].forEach((x, i) => fmCyl(g, 0.2, 0.2, 0.03, 0xF0A59B, x, 0.02 + i * 0.03, 0.1 - i * 0.05, { rz: -0.35, rx: 0.2 }));
        return;
    }
    if (v === 'ribs') {
        fmSph(g, 0.3, 0xB5502A, 0.05, 0.16, 0, { s: [1.2, 0.8, 0.9] });
        fmCyl(g, 0.045, 0.045, 0.4, 0xF4EBD7, -0.4, 0.14, 0, { rz: Math.PI / 2, c: true });
        fmSph(g, 0.07, 0xF4EBD7, -0.42, 0.18, 0.04); fmSph(g, 0.07, 0xF4EBD7, -0.42, 0.18, -0.04);
        return;
    }
    fmSph(g, 0.4, 0x6B3420, 0, 0.07, 0, { s: [1, 0.2, 0.72], ry: 0.2 });
    fmSph(g, 0.34, 0x8A4A2C, 0, 0.1, 0, { s: [1, 0.14, 0.66], ry: 0.2 });
    for (let i = 0; i < 4; i++) fmBox(g, 0.5, 0.008, 0.025, 0x2A140C, -0.1 + i * 0.07, 0.115, 0, { ry: 0.7 });
    fmBox(g, 0.1, 0.04, 0.1, 0xFFE27A, 0.1, 0.115, 0, { ry: 0.3 });
    fmCyl(g, 0.01, 0.01, 0.3, 0x2E7D32, -0.1, 0.17, 0.22, { rz: 1.3, ry: 0.4, c: true });
    [0, 1, 2].forEach(i => fmSph(g, 0.07, 0xC8A468, 0.3 + i * 0.05, 0.08, 0.25 - i * 0.14, { s: [1.2, 0.8, 1] }));
};
FM_PLATED.steak = true;

FM_BUILD.chicken = function (g, v) {
    if (v === 'nuggets') {
        [[-0.2, -0.1], [0.05, -0.2], [0.2, 0.0], [-0.05, 0.12], [0.18, 0.22]].forEach((p, i) => fmSph(g, 0.12, 0xD9A24B, p[0], 0.09, p[1], { s: [1.1, 0.6, 0.9], ry: i }));
        fmCyl(g, 0.1, 0.08, 0.07, 0xF2F2F2, -0.3, 0, 0.3); fmCyl(g, 0.085, 0.085, 0.01, 0xC62828, -0.3, 0.07, 0.3);
        return;
    }
    if (v === 'wings') {
        for (let i = 0; i < 5; i++) fmSph(g, 0.14, 0xC4702A, -0.2 + (i % 3) * 0.2, 0.09 + (i > 2 ? 0.1 : 0), (i > 2 ? 0 : (i - 1) * 0.1) - 0.05, { s: [1.5, 0.7, 0.8], ry: i * 0.7 });
        fmSph(g, 0.15, 0xB5321A, 0, 0.19, 0, { s: [1.4, 0.2, 1] });
        fmBox(g, 0.05, 0.4, 0.05, 0x8BC34A, 0.35, 0.02, 0.25, { rz: 0.2 });
        return;
    }
    [-0.14, 0.14].forEach((z, i) => {
        const s = i ? 1 : -1;
        fmSph(g, 0.17, 0xC8802F, -0.05, 0.16, z, { s: [1.3, 1, 1], ry: s * 0.3 });
        fmCyl(g, 0.035, 0.035, 0.3, 0xF4EBD7, 0.16, 0.12, z + s * 0.04, { rz: Math.PI / 2 + 0.15, ry: s * 0.3, c: true });
        fmSph(g, 0.055, 0xF4EBD7, 0.42, 0.14, z + s * 0.08);
    });
};
FM_PLATED.chicken = true;

FM_BUILD.turkey = function (g) {
    fmSph(g, 0.38, 0xC77A2C, 0, 0.2, 0, { s: [1, 0.75, 0.8] });
    fmSph(g, 0.2, 0xD98B3A, 0, 0.35, 0, { s: [1.4, 0.5, 1] });
    [-1, 1].forEach(s => {
        fmCaps(g, 0.08, 0.2, 0xB86B22, 0.3, 0.14, s * 0.22, { rz: 1.2, ry: s * 0.4 });
        fmCone(g, 0.05, 0.1, 0xFFFFFF, 0.46, 0.14, s * 0.26, { rz: -1.57, c: true });
    });
    [-0.28, -0.12, 0.1].forEach((x, i) => fmSph(g, 0.06, 0x3E9B3E, x, 0.02, 0.35 - i * 0.1, { s: [1.4, 0.5, 1] }));
};
FM_PLATED.turkey = true;

FM_BUILD.skewer = function (g, v) {
    [-0.14, 0.14].forEach((z, k) => {
        fmCyl(g, 0.012, 0.012, 0.85, 0xE0C080, 0, 0.1, z, { rz: Math.PI / 2, c: true });
        for (let i = 0; i < 5; i++) {
            const x = -0.3 + i * 0.14;
            if (v === 'dango') fmSph(g, 0.1, [0xF4A6B8, 0xFFFFFF, 0x9AD17F][i % 3], -0.12 + i * 0.12 - 0.1, 0.1, z, {});
            else if (i % 2) fmBox(g, 0.12, 0.12, 0.12, [0x3F9D3A, 0xD33A2A][k], x, 0.04, z, { ry: i });
            else fmBox(g, 0.13, 0.13, 0.13, 0x7A4A2A, x, 0.035, z, { ry: i });
        }
    });
};
FM_PLATED.skewer = true;

FM_BUILD.sushi = function (g, v) {
    if (v === 'onigiri') {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.22, 3), fmMat(0xFBFBF5));
        m.rotation.x = -Math.PI / 2; m.position.set(0, 0.135, 0); g.add(m);
        fmBox(g, 0.28, 0.14, 0.235, 0x1E2A22, 0, 0, 0);
        return;
    }
    if (v === 'maki') {
        [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach((p, i) => {
            fmCyl(g, 0.14, 0.14, 0.13, 0x1E2A22, p[0], 0, p[1]);
            fmCyl(g, 0.115, 0.115, 0.005, 0xFBFBF5, p[0], 0.13, p[1]);
            fmCyl(g, 0.04, 0.04, 0.006, [0xF47B4B, 0x8BC34A, 0xC93A4B, 0xF2C94C][i], p[0], 0.13, p[1]);
        });
        fmSph(g, 0.06, 0x8CC152, 0.35, 0.05, 0.3);
        return;
    }
    [[-0.28, 0xF47B4B], [0, 0xC93A4B], [0.28, 0xF6A07A]].forEach((p, i) => {
        fmCaps(g, 0.09, 0.2, 0xFBFBF5, -0.05, 0.09, p[0], { rz: Math.PI / 2 });
        fmSph(g, 0.17, p[1], -0.05, 0.2, p[0], { s: [1, 0.25, 0.65] });
        if (i === 1) fmBox(g, 0.035, 0.12, 0.2, 0x1E2A22, -0.05, 0.02, p[0]);
    });
    fmSph(g, 0.06, 0x8CC152, 0.3, 0.05, 0.3);
    fmSph(g, 0.1, 0xF4A6B8, 0.3, 0.025, -0.25, { s: [1, 0.25, 1] });
};
FM_PLATED.sushi = true;

FM_BUILD.dumpling = function (g, v) {
    if (v === 'calzone') {
        fmSph(g, 0.4, 0xD99A45, 0, 0.1, 0, { s: [1, 0.45, 0.65] });
        fmTor(g, 0.28, 0.02, 0xBF7F32, 0, 0.12, 0, { arc: Math.PI, rx: -Math.PI / 2 + 0.0, s: [1.3, 1, 1] });
        fmCyl(g, 0.12, 0.1, 0.07, 0xF2F2F2, 0.35, 0, 0.3); fmCyl(g, 0.1, 0.1, 0.01, 0xC0392B, 0.35, 0.07, 0.3);
        return;
    }
    if (v === 'fortune') {
        fmSph(g, 0.2, 0xE0B060, 0, 0.12, 0, { s: [1.3, 0.8, 1] });
        fmSph(g, 0.14, 0xD59F4F, 0.05, 0.2, 0, { s: [1, 0.5, 1] });
        fmBox(g, 0.3, 0.005, 0.07, 0xFFFFFF, 0.2, 0.02, 0.25, { ry: 0.4 });
        return;
    }
    [[-0.22, -0.14], [0.2, -0.12], [0, 0.2]].forEach((p, i) => {
        fmSph(g, 0.22, 0xF4E6C6, p[0], 0.1, p[1], { s: [1.2, 0.6, 0.8], ry: i });
        fmCyl(g, 0.02, 0.02, 0.4, 0xE9D6AE, p[0], 0.2, p[1], { rz: Math.PI / 2, ry: i, c: true });
        for (let k = 0; k < 4; k++) fmSph(g, 0.03, 0xE9D6AE, p[0] + Math.cos(i) * (k - 1.5) * 0.08, 0.2, p[1] - Math.sin(i) * (k - 1.5) * 0.08);
    });
    fmCyl(g, 0.1, 0.08, 0.05, 0xF2F2F2, 0.35, 0, 0.3); fmCyl(g, 0.08, 0.08, 0.01, 0x3E2412, 0.35, 0.05, 0.3);
};
FM_PLATED.dumpling = true;

FM_BUILD.egg = function (g, v) {
    if (v === 'carton') {
        fmBox(g, 0.78, 0.1, 0.52, 0xC9BFA3, 0, 0, 0);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) fmSph(g, 0.1, 0xF3E3C3, -0.26 + i * 0.26, 0.2, -0.13 + j * 0.26, { s: [1, 1.25, 1] });
        return;
    }
    if (v === 'omelette') {
        fmSph(g, 0.4, 0xF6D45A, 0, 0.1, 0, { s: [1, 0.35, 0.65] });
        for (let i = 0; i < 5; i++) fmSph(g, 0.03, 0x4CAF50, -0.2 + i * 0.1, 0.2, (i % 2) * 0.08 - 0.04);
        fmBox(g, 0.1, 0.02, 0.1, 0xF5C242, 0.1, 0.19, 0.0);
        return;
    }
    fmSph(g, 0.3, 0xFDFDFB, 0, 0.04, 0, { s: [1, 0.12, 0.85] });
    fmSph(g, 0.2, 0xFDFDFB, 0.2, 0.04, 0.12, { s: [1, 0.12, 1] });
    fmSph(g, 0.2, 0xFDFDFB, -0.2, 0.04, -0.12, { s: [1, 0.12, 1] });
    fmSph(g, 0.1, 0xF4A91B, 0, 0.1, 0, { s: [1, 0.8, 1] });
    if (v === 'toast') fmBox(g, 0.34, 0.06, 0.34, 0xE2B26A, 0.3, 0, 0.25, { ry: 0.4 });
};
FM_PLATED.egg = true;

FM_BUILD.cake = function (g, v) {
    if (v === 'cupcake') {
        fmCyl(g, 0.24, 0.17, 0.2, 0x4FC3F7, 0, 0, 0);
        fmDome(g, 0.24, 0xC98B52, 0, 0.2, 0, { s: [1, 0.6, 1] });
        fmCyl(g, 0.2, 0.17, 0.09, 0xF48FB1, 0, 0.3, 0);
        fmCyl(g, 0.14, 0.1, 0.08, 0xF48FB1, 0, 0.38, 0);
        fmCone(g, 0.07, 0.1, 0xF48FB1, 0, 0.46, 0);
        fmSph(g, 0.04, 0xC62828, 0, 0.58, 0);
        return;
    }
    if (v === 'birthday') {
        fmCyl(g, 0.4, 0.4, 0.17, 0xF8BBD0, 0, 0, 0, { seg: 26 });
        fmTor(g, 0.4, 0.03, 0xFFFFFF, 0, 0.17, 0);
        fmCyl(g, 0.27, 0.27, 0.16, 0xFFE0B2, 0, 0.17, 0, { seg: 24 });
        fmTor(g, 0.27, 0.03, 0xF48FB1, 0, 0.33, 0);
        [0xE53935, 0x1E88E5, 0xFDD835].forEach((c, i) => {
            const a = i * 2.1;
            fmCyl(g, 0.014, 0.014, 0.16, c, Math.cos(a) * 0.12, 0.33, Math.sin(a) * 0.12);
            fmCone(g, 0.02, 0.05, 0xFF9800, Math.cos(a) * 0.12, 0.49, Math.sin(a) * 0.12);
        });
        fmRing(12, 0, 0, 0.4).forEach(p => fmSph(g, 0.025, 0xF06292, p[0], 0.12, p[1]));
        return;
    }
    if (v === 'tiramisu') {
        fmBox(g, 0.62, 0.08, 0.42, 0xC9A56A, 0, 0, 0);
        fmBox(g, 0.62, 0.07, 0.42, 0xF8EBD0, 0, 0.08, 0);
        fmBox(g, 0.62, 0.06, 0.42, 0xC9A56A, 0, 0.15, 0);
        fmBox(g, 0.62, 0.03, 0.42, 0x5A3A22, 0, 0.21, 0);
        return;
    }
    if (v === 'lava') {
        fmCyl(g, 0.33, 0.35, 0.22, 0x4A2616, 0, 0, 0, { seg: 24 });
        fmCyl(g, 0.25, 0.25, 0.015, 0x2B140B, 0, 0.22, 0, { seg: 20 });
        fmSph(g, 0.4, 0x6B3418, 0, 0.02, 0, { s: [1, 0.08, 1] });
        fmSph(g, 0.12, 0xFFF3D6, 0.34, 0.12, 0.2, { s: [1, 0.8, 1] });
        fmSph(g, 0.04, 0xC62828, 0, 0.27, 0);
        return;
    }
    const pal = v === 'choc' ? [0x5A3320, 0x8B5A3C, 0x3B1E14] : v === 'cheesecake' ? [0xB67C3D, 0xF8E3A8, 0xD62839] : [0xF3D9A4, 0xFFF4E0, 0xF6A5C0];
    fmWedge(g, 0.7, 0.28, 0.09, pal[0], 0, 0, 0, { ry: -0.5 });
    fmWedge(g, 0.7, 0.28, 0.035, pal[1], 0, 0.09, 0, { ry: -0.5 });
    fmWedge(g, 0.7, 0.28, 0.09, pal[0], 0, 0.125, 0, { ry: -0.5 });
    fmWedge(g, 0.7, 0.28, 0.03, pal[2], 0, 0.215, 0, { ry: -0.5 });
    fmSph(g, 0.045, 0xC62828, 0.22 * Math.cos(0.5), 0.28, 0.22 * Math.sin(0.5) + 0);
    fmSph(g, 0.06, 0xFFFFFF, 0.12 * Math.cos(0.5), 0.26, 0.12 * Math.sin(0.5), { s: [1, 0.6, 1] });
};
FM_PLATED.cake = true;

FM_BUILD.icecream = function (g, v) {
    if (v === 'tub') {
        fmCyl(g, 0.32, 0.27, 0.38, 0xF8BBD0, 0, 0, 0, { seg: 22 });
        fmCyl(g, 0.34, 0.34, 0.05, 0xFFFFFF, 0, 0.38, 0, { seg: 22 });
        fmSph(g, 0.12, 0xE53935, 0, 0.2, 0.275, { s: [1, 1, 0.2] });
        fmSph(g, 0.06, 0xFFFFFF, 0.1, 0.3, 0.28, { s: [1, 1, 0.2] });
        return;
    }
    if (v === 'cup') {
        fmCyl(g, 0.27, 0.19, 0.22, 0xFFFFFF, 0, 0, 0, { seg: 20 });
        fmCyl(g, 0.272, 0.2, 0.06, 0xF06292, 0, 0.05, 0, { seg: 20 });
        fmSph(g, 0.17, 0xF8BBD0, -0.12, 0.34, 0.02); fmSph(g, 0.17, 0x6B3F2A, 0.13, 0.34, 0.03);
        fmSph(g, 0.17, 0xFFF3C4, 0, 0.42, -0.1); fmSph(g, 0.04, 0xC62828, 0, 0.6, -0.1);
        fmBox(g, 0.05, 0.3, 0.012, 0xE0B070, 0.2, 0.3, -0.05, { rz: -0.4 });
        return;
    }
    if (v === 'ice') {
        fmCyl(g, 0.26, 0.17, 0.22, 0xFFFFFF, 0, 0, 0, { seg: 18 });
        fmDome(g, 0.26, 0xF0F8FF, 0, 0.22, 0, { s: [1, 1.1, 1] });
        fmSph(g, 0.2, 0xE53935, 0.02, 0.38, 0.02, { s: [1, 0.3, 1] });
        return;
    }
    fmCone(g, 0.2, 0.5, 0xD9A25A, 0, 0, 0, { rx: Math.PI, seg: 14 });
    g.children[g.children.length - 1].position.y = 0.25;
    [0.12, 0.24, 0.36].forEach(y => fmTor(g, 0.2 * (1 - y / 0.5) * 0.9 + 0.02, 0.008, 0xB67C3D, 0, 0.5 - y, 0));
    if (v === 'swirl') {
        fmCyl(g, 0.2, 0.22, 0.1, 0xFFF3D6, 0, 0.5, 0); fmCyl(g, 0.15, 0.2, 0.1, 0xFFF3D6, 0, 0.6, 0);
        fmCyl(g, 0.1, 0.15, 0.09, 0xFFF3D6, 0, 0.7, 0); fmCone(g, 0.07, 0.1, 0xFFF3D6, 0, 0.79, 0);
    } else {
        fmSph(g, 0.22, 0xF8BBD0, 0, 0.58, 0); fmSph(g, 0.2, 0x6B3F2A, 0.02, 0.8, 0);
        fmSph(g, 0.04, 0xC62828, 0.02, 1.0, 0);
    }
};

FM_BUILD.donut = function (g) {
    fmTor(g, 0.26, 0.12, 0xD9A257, 0, 0.115, 0, { s: [1, 1, 0.95] });
    fmTor(g, 0.26, 0.125, 0xF06292, 0, 0.16, 0, { s: [1, 1, 0.6] });
    for (let i = 0; i < 12; i++) {
        const a = i * 0.52, rad = 0.26 + ((i % 3) - 1) * 0.06;
        fmBox(g, 0.05, 0.012, 0.014, [0xFFFFFF, 0xFFEB3B, 0x4FC3F7, 0x8BC34A][i % 4], Math.cos(a) * rad, 0.225 - Math.abs((i % 3) - 1) * 0.03, Math.sin(a) * rad, { ry: i });
    }
};
FM_PLATED.donut = true;

FM_BUILD.cookie = function (g, v) {
    if (v === 'mooncake') {
        fmCyl(g, 0.28, 0.3, 0.14, 0xB86B2E, 0, 0, 0, { seg: 24 });
        fmTor(g, 0.2, 0.015, 0xF0D49A, 0, 0.145, 0);
        fmSph(g, 0.05, 0xF0D49A, 0, 0.15, 0, { s: [1, 0.4, 1] });
        return;
    }
    [[-0.17, 0, 0, 0.3], [0.2, 0.0, 0.05, 0.26]].forEach((p, i) => {
        const h = new THREE.Group();
        fmCyl(h, p[3], p[3], 0.07, 0xD2A056, 0, 0, 0, { seg: 24 });
        fmTor(h, p[3], 0.03, 0xC8964A, 0, 0.035, 0);
        for (let k = 0; k < 8; k++) fmSph(h, 0.035, 0x4A2A18, Math.cos(k * 2.4 + i) * (0.05 + (k % 3) * 0.06), 0.075, Math.sin(k * 2.4 + i) * (0.05 + (k % 3) * 0.06), { s: [1, 0.6, 1] });
        h.position.set(p[0], p[1], p[2]);
        if (i) { h.rotation.z = 0.25; h.position.y = 0.05; }
        g.add(h);
    });
};
FM_PLATED.cookie = true;

FM_BUILD.pie = function (g, v) {
    fmCyl(g, 0.42, 0.36, 0.14, 0xB9B9BC, 0, 0, 0, { seg: 26 });
    fmCyl(g, 0.4, 0.4, 0.05, v === 'pumpkin' ? 0xE0852B : 0xD59A4A, 0, 0.13, 0, { seg: 26 });
    fmTor(g, 0.4, 0.035, 0xD59A4A, 0, 0.17, 0, { seg: 30 });
    for (let i = -2; i <= 2; i++) {
        fmBox(g, 0.5, 0.025, 0.055, 0xC98539, 0, 0.18, i * 0.12, { ry: Math.PI / 4 });
        fmBox(g, 0.5, 0.03, 0.055, 0xC98539, 0, 0.18, i * 0.12, { ry: -Math.PI / 4 });
    }
};
FM_PLATED.pie = true;

FM_BUILD.pudding = function (g) {
    fmCyl(g, 0.28, 0.33, 0.22, 0xF0B84A, 0, 0, 0, { seg: 22 });
    fmCyl(g, 0.29, 0.29, 0.03, 0x8B4513, 0, 0.22, 0, { seg: 22 });
    fmTor(g, 0.3, 0.025, 0x8B4513, 0, 0.215, 0);
    fmSph(g, 0.08, 0xFFFFFF, 0, 0.3, 0, { s: [1, 0.8, 1] }); fmSph(g, 0.035, 0xC62828, 0, 0.37, 0);
};
FM_PLATED.pudding = true;

// ---- drinks ----
FM_BUILD.cup = function (g, v) {                       // paper soda cup with lid and straw
    const col = { cola: 0xB71C1C, orange: 0xFB8C00, lemon: 0xF9A825, smoothie: 0xE91E63, root: 0x6D4C41 }[v] || 0xE53935;
    fmCyl(g, 0.2, 0.15, 0.45, 0xFFFFFF, 0, 0, 0);
    fmCyl(g, 0.186, 0.166, 0.18, col, 0, 0.12, 0, { ry: 0 });
    g.children[g.children.length - 1].scale.set(1.012, 1, 1.012);
    fmCyl(g, 0.215, 0.215, 0.04, 0xF0F0F0, 0, 0.45, 0);
    fmCyl(g, 0.012, 0.012, 0.4, col, 0.03, 0.4, 0, { rz: -0.15 });
    fmCyl(g, 0.012, 0.012, 0.1, col, -0.03, 0.78, 0, { rz: Math.PI / 2 - 0.3 });
};
FM_BUILD.glass = function (g, v) {
    const liq = { lemon: 0xF7E36B, orange: 0xFFA533, apple: 0xE0A63A, milk: 0xFFFFFF, choc: 0x6B3F2A, water: 0xCDEBFA, tea: 0xB5651D, cola: 0x3A1F12, tropical: 0xFF6F91, rose: 0xF48FB1, green: 0x9CCC65, pink: 0xF06292 }[v] || 0xFFA533;
    fmCyl(g, 0.19, 0.15, 0.36, liq, 0, 0.03, 0);
    const shell = fmCyl(g, 0.205, 0.16, 0.42, 0xDDEEFF, 0, 0, 0, { open: true, dbl: true, alpha: 0.3 });
    fmCyl(g, 0.16, 0.16, 0.03, 0xDDEEFF, 0, 0, 0, { alpha: 0.6 });
    if (v === 'lemon' || v === 'water' || v === 'tea' || v === 'tropical') {
        [[0.05, 0.3, 0.04], [-0.06, 0.33, -0.05]].forEach(p => fmBox(g, 0.09, 0.09, 0.09, 0xF4FAFF, p[0], p[1], p[2], { ry: 0.5, alpha: 0.7 }));
    }
    if (v === 'lemon' || v === 'tea') { fmCyl(g, 0.09, 0.09, 0.02, 0xF4D03F, 0.2, 0.34, 0, { rx: Math.PI / 2 - 0.0, rz: 0.3 }); }
    if (v === 'tropical') { fmCyl(g, 0.012, 0.012, 0.4, 0xFFFFFF, 0.04, 0.3, 0, { rz: -0.15 }); fmSph(g, 0.07, 0xF28C1D, -0.18, 0.42, 0, { s: [1, 0.4, 1] }); }
    if (v === 'milk') fmCyl(g, 0.19, 0.19, 0.01, 0xFFFFFF, 0, 0.39, 0);
};
FM_BUILD.boba = function (g) {
    fmCyl(g, 0.2, 0.16, 0.5, 0xC49A6C, 0, 0.02, 0);
    fmCyl(g, 0.22, 0.17, 0.52, 0xFFFFFF, 0, 0, 0, { open: true, dbl: true, alpha: 0.28 });
    for (let i = 0; i < 12; i++) fmSph(g, 0.03, 0x2B1B12, Math.cos(i * 2.3) * (0.03 + (i % 3) * 0.045), 0.06 + (i % 2) * 0.04, Math.sin(i * 2.3) * (0.03 + (i % 3) * 0.045));
    fmCyl(g, 0.23, 0.23, 0.03, 0xF4F4F4, 0, 0.52, 0);
    fmCyl(g, 0.02, 0.02, 0.45, 0x26C6DA, 0.05, 0.4, 0, { rz: -0.12 });
};
FM_BUILD.mug = function (g, v) {
    const liq = v === 'green' ? 0xA5C45E : v === 'cocoa' ? 0x5A3220 : v === 'rose' ? 0xE57373 : 0x6F4E37;
    fmCyl(g, 0.36, 0.3, 0.03, 0xFFFFFF, 0, 0, 0);
    fmCyl(g, 0.2, 0.17, 0.26, 0xF7F7F2, 0, 0.03, 0, { open: true, dbl: true });
    fmCyl(g, 0.17, 0.17, 0.02, 0xF7F7F2, 0, 0.03, 0);
    fmCyl(g, 0.185, 0.185, 0.01, liq, 0, 0.27, 0);
    if (v !== 'green') fmTor(g, 0.09, 0.025, 0xF7F7F2, 0.24, 0.17, 0, { rx: 0 });
    if (v === 'cocoa') [[0.05, 0.03], [-0.07, -0.04]].forEach(p => fmBox(g, 0.07, 0.05, 0.07, 0xFFFFFF, p[0], 0.28, p[1], { ry: 0.5 }));
};
FM_PLATED.mug = false;
FM_BUILD.juicebox = function (g, v) {
    const col = { green: 0x58D68D, orange: 0xFFA533, apple: 0xE74C3C }[v] || 0x58D68D;
    fmBox(g, 0.34, 0.5, 0.2, col, 0, 0, 0);
    fmBox(g, 0.36, 0.04, 0.12, 0xFFFFFF, 0, 0.5, 0);
    fmSph(g, 0.1, 0xFFFFFF, 0, 0.26, 0.1, { s: [1, 1.3, 0.1] });
    fmSph(g, 0.06, 0xE53935, 0, 0.26, 0.108, { s: [1, 1, 0.1] });
    fmCyl(g, 0.012, 0.012, 0.22, 0xE53935, 0.08, 0.5, 0);
    fmCyl(g, 0.012, 0.012, 0.1, 0xE53935, 0.12, 0.72, 0, { rz: Math.PI / 2 });
};
FM_BUILD.milkcarton = function (g, v) {
    fmBox(g, 0.3, 0.45, 0.3, v === 'choc' ? 0x8B5A3C : 0xFFFFFF, 0, 0, 0);
    fmBox(g, 0.304, 0.2, 0.304, v === 'choc' ? 0x5A3320 : 0x3F7FCF, 0, 0, 0);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.3, 3), fmMat(v === 'choc' ? 0x8B5A3C : 0xFFFFFF));
    roof.rotation.x = -Math.PI / 2; roof.position.set(0, 0.45 + 0.095, 0); g.add(roof);
    fmCyl(g, 0.04, 0.04, 0.04, 0x3F7FCF, 0, 0.6, 0);
    fmSph(g, 0.07, 0xFFFFFF, 0, 0.3, 0.155, { s: [1, 1, 0.1] });
    fmSph(g, 0.03, 0x333333, 0.02, 0.31, 0.162, { s: [1, 1, 0.1] });
};
FM_BUILD.bottle = function (g, v) {
    fmLathe(g, [[0.001, 0], [0.14, 0], [0.15, 0.03], [0.15, 0.46], [0.13, 0.52], [0.06, 0.58], [0.05, 0.64], [0.001, 0.64]], 0xBFE6FA, 0, 0, 0, { alpha: 0.65 });
    fmCyl(g, 0.152, 0.152, 0.2, 0x1E88E5, 0, 0.18, 0, { open: true, dbl: true });
    fmSph(g, 0.06, 0xFFFFFF, 0, 0.28, 0.155, { s: [1, 1.2, 0.1] });
    fmCyl(g, 0.055, 0.055, 0.06, 0x2D7FC1, 0, 0.64, 0);
};
FM_BUILD.can = function (g, v) {
    fmCyl(g, 0.14, 0.14, 0.42, 0xE53935, 0, 0, 0);
    fmCyl(g, 0.143, 0.143, 0.08, 0xFFFFFF, 0, 0.15, 0, { open: true, dbl: true });
    fmCyl(g, 0.12, 0.14, 0.03, 0xC0C4C8, 0, 0.42, 0);
    fmCyl(g, 0.14, 0.12, 0.02, 0xC0C4C8, 0, -0.0, 0);
    fmBox(g, 0.06, 0.012, 0.04, 0x9A9EA3, 0.0, 0.455, 0);
};

// ---- baked things ----
FM_BUILD.bread = function (g) {
    fmBox(g, 0.78, 0.25, 0.44, 0xD39A4E, 0, 0, 0);
    fmCyl(g, 0.21, 0.21, 0.78, 0xD39A4E, 0, 0.25, 0, { rz: Math.PI / 2, c: true });
    fmBox(g, 0.36, 0.34, 0.04, 0xF1D9A2, -0.2, 0.0, 0.36, { ry: 0.2 });
    fmBox(g, 0.3, 0.012, 0.3, 0xF4DCA8, 0, 0.455, 0);
};
FM_PLATED.bread = false;
FM_BUILD.baguette = function (g) {
    [[0.15, 0.12], [-0.12, -0.1]].forEach((p, i) => {
        fmCaps(g, 0.1, 0.7, 0xD39A4F, 0, 0.1, p[0] * 1.3, { rz: Math.PI / 2, ry: i ? -0.1 : 0.12, s: [1, 1, 0.9] });
        for (let k = 0; k < 4; k++) fmSph(g, 0.05, 0xF0D49A, -0.25 + k * 0.17, 0.19, p[0] * 1.3 + (i ? 0.01 : -0.01), { s: [1.5, 0.35, 0.5], ry: 0.7 });
    });
};
FM_PLATED.baguette = false;
FM_BUILD.croissant = function (g) {
    for (let i = 0; i < 7; i++) {
        const th = -1.1 + i * 0.367;
        const r = 0.07 + 0.11 * Math.cos(th * 1.3);
        fmSph(g, r, i % 2 ? 0xD58E3B : 0xE0A04C, Math.sin(th) * 0.32, 0.12, 0.1 - Math.cos(th) * 0.3, { s: [1.15, 0.95, 1.15], ry: th });
    }
};
FM_PLATED.croissant = true;
FM_BUILD.pancake = function (g, v) {
    if (v === 'waffle') {
        fmBox(g, 0.7, 0.08, 0.7, 0xE2B35E, 0, 0, 0);
        for (let i = -2; i <= 2; i++) { fmBox(g, 0.7, 0.012, 0.022, 0xB9822E, 0, 0.08, i * 0.12); fmBox(g, 0.022, 0.012, 0.7, 0xB9822E, i * 0.12, 0.08, 0); }
        fmBox(g, 0.12, 0.05, 0.12, 0xFFE27A, 0.1, 0.09, 0.0, { ry: 0.3 });
        fmSph(g, 0.07, 0xE63946, -0.2, 0.12, 0.2); fmSph(g, 0.07, 0xE63946, 0.22, 0.12, -0.2);
        return;
    }
    for (let i = 0; i < 4; i++) fmCyl(g, 0.33, 0.33, 0.06, i % 2 ? 0xE5B060 : 0xDDA552, (i % 2 ? 0.02 : -0.02), i * 0.06, 0, { seg: 24 });
    fmBox(g, 0.12, 0.06, 0.12, 0xFFE27A, 0, 0.24, 0, { ry: 0.3 });
    fmSph(g, 0.25, 0x8B4513, 0, 0.245, 0, { s: [1, 0.1, 1] });
};
FM_PLATED.pancake = true;
FM_BUILD.pretzel = function (g) {
    fmTor(g, 0.2, 0.055, 0xB4691F, 0, 0.06, 0.05);
    fmCaps(g, 0.055, 0.34, 0xB4691F, -0.12, 0.06, -0.12, { rz: 0.9, rx: 1.5 });
    fmCaps(g, 0.055, 0.34, 0xB4691F, 0.12, 0.06, -0.12, { rz: -0.9, rx: 1.5 });
    for (let i = 0; i < 10; i++) fmBox(g, 0.025, 0.015, 0.025, 0xFFFFFF, Math.cos(i * 0.63) * 0.2, 0.12, Math.sin(i * 0.63) * 0.2 + 0.05);
};
FM_PLATED.pretzel = true;

// ---- snacks & treats ----
FM_BUILD.popcorn = function (g) {
    for (let k = 0; k < 8; k++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.42, 2, 1, true, k * Math.PI / 4, Math.PI / 4), fmMat(k % 2 ? 0xFFFFFF : 0xD93025, { dbl: true }));
        m.position.y = 0.21; g.add(m);
    }
    fmCyl(g, 0.22, 0.22, 0.01, 0xD93025, 0, 0, 0);
    for (let i = 0; i < 16; i++) {
        const a = i * 2.4, rad = 0.05 + (i % 4) * 0.05;
        fmSph(g, 0.07 + (i % 3) * 0.01, i % 3 ? 0xFFF4C8 : 0xF7E08A, Math.cos(a) * rad, 0.45 + (i % 4) * 0.045, Math.sin(a) * rad);
    }
};
FM_BUILD.chipsbag = function (g) {
    fmBox(g, 0.5, 0.62, 0.15, 0xF2B21A, 0, 0.04, 0);
    fmSph(g, 0.28, 0xF2B21A, 0, 0.36, 0, { s: [1, 1.15, 0.5] });
    fmBox(g, 0.52, 0.07, 0.05, 0xC99412, 0, 0, 0);
    fmBox(g, 0.52, 0.07, 0.05, 0xC99412, 0, 0.7, 0);
    fmSph(g, 0.17, 0xD32F2F, 0, 0.36, 0.08, { s: [1, 1.1, 0.15] });
    [[-0.04, 0.4], [0.05, 0.33]].forEach(p => fmCyl(g, 0.05, 0.05, 0.01, 0xFFD54F, p[0], p[1], 0.13, { rx: Math.PI / 2 }));
};
FM_BUILD.cerealbox = function (g) {
    fmBox(g, 0.46, 0.64, 0.14, 0xF39C12, 0, 0, 0);
    fmSph(g, 0.15, 0xFFFFFF, 0, 0.32, 0.07, { s: [1, 1, 0.1] });
    fmSph(g, 0.1, 0xF4EFE6, 0, 0.27, 0.075, { s: [1, 0.6, 0.15] });
    for (let i = 0; i < 6; i++) fmTor(g, 0.02, 0.01, 0xE3A14D, -0.06 + (i % 3) * 0.06, 0.35 + Math.floor(i / 3) * 0.03, 0.082, { rx: 0 });
    fmBox(g, 0.46, 0.08, 0.145, 0xD35400, 0, 0.56, 0);
};
FM_BUILD.cerealbowl = function (g) {
    fmBowl(g, 0.4, 0.28, 0xF2F2F2, 0xF4EFE6, 0, 0, 0);
    fmTor(g, 0.39, 0.012, 0x3A6EA5, 0, 0.22, 0, { rx: Math.PI / 2 });
    fmCyl(g, 0.34, 0.34, 0.01, 0xF8F5EA, 0, 0.22, 0, { seg: 22 });
    for (let i = 0; i < 18; i++) {
        const a = i * 2.4, rad = 0.04 + (i % 5) * 0.055;
        fmTor(g, 0.04, 0.017, i % 4 ? 0xE3A14D : 0xC27A2C, Math.cos(a) * rad, 0.24 + (i % 3) * 0.008, Math.sin(a) * rad, { rx: Math.PI / 2 + (i % 3) * 0.3 });
    }
    fmCyl(g, 0.012, 0.012, 0.3, 0xBBBBBB, 0.25, 0.28, 0.1, { rz: 1.2 });
};
FM_BUILD.chocolate = function (g) {
    fmBox(g, 0.3, 0.05, 0.5, 0x5A3220, 0, 0.0, 0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) fmBox(g, 0.085, 0.02, 0.105, 0x6B3D28, -0.09 + i * 0.09, 0.05, -0.18 + j * 0.12);
    fmBox(g, 0.32, 0.06, 0.26, 0xC0392B, 0, 0, 0.12);
    fmBox(g, 0.325, 0.062, 0.05, 0xF1C40F, 0, 0, 0.12);
    fmBox(g, 0.28, 0.01, 0.16, 0xD6D6D6, 0.04, 0.05, -0.05, { rx: 0.25 });
};
FM_BUILD.candy = function (g, v) {
    if (v === 'cotton') {
        fmCone(g, 0.12, 0.4, 0xFFFFFF, 0, 0, 0, { rx: Math.PI });
        g.children[g.children.length - 1].position.y = 0.2;
        [[0, 0.6, 0, 0.22], [0.15, 0.55, 0.05, 0.14], [-0.14, 0.58, -0.05, 0.15], [0.05, 0.75, 0, 0.14], [0, 0.55, 0.15, 0.13], [0.0, 0.5, -0.14, 0.13]].forEach(p => fmSph(g, p[3], 0xF8A5C8, p[0], p[1], p[2]));
        return;
    }
    if (v === 'lolli') {
        fmCyl(g, 0.014, 0.014, 0.55, 0xFFFFFF, 0, 0, 0);
        fmCyl(g, 0.26, 0.26, 0.05, 0xE91E63, 0, 0.5, 0, { rx: Math.PI / 2, seg: 24 });
        const m = g.children[g.children.length - 1]; m.position.set(0, 0.76, 0);
        [0.06, 0.12, 0.18, 0.24].forEach((R, i) => fmTor(g, R, 0.03, [0xFFFFFF, 0x4FC3F7, 0xFFEB3B, 0x8BC34A][i], 0, 0.76, 0.03, { rx: 0 }));
        return;
    }
    if (v === 'marsh') {
        for (let i = 0; i < 9; i++) fmCyl(g, 0.09, 0.09, 0.1, i % 3 ? 0xFFFFFF : 0xF8BBD0, Math.cos(i * 2.4) * (0.1 + (i % 3) * 0.09), (i > 5 ? 0.1 : 0), Math.sin(i * 2.4) * (0.1 + (i % 3) * 0.09), { ry: i });
        return;
    }
    if (v === 'pile') {
        const pal = [0xE53935, 0xFFEB3B, 0x43A047, 0xFB8C00, 0xE91E63, 0x8E24AA, 0x1E88E5];
        for (let i = 0; i < 22; i++) {
            const a = i * 2.4, rad = 0.04 + (i % 5) * 0.06;
            fmSph(g, 0.07, pal[i % 7], Math.cos(a) * rad, 0.07 + (rad < 0.15 ? 0.08 : 0), Math.sin(a) * rad, { s: [1.3, 0.9, 0.9], ry: i });
        }
        return;
    }
    [[-0.22, 0xF06292], [0.0, 0x4FC3F7], [0.22, 0xFFB300]].forEach((p, i) => {
        fmSph(g, 0.13, p[1], p[0], 0.13, i * 0.1 - 0.1, { s: [1.3, 1, 1] });
        fmCone(g, 0.09, 0.14, p[1], p[0] + 0.24, 0.13 - 0.07 + 0.0, i * 0.1 - 0.1, { rz: -Math.PI / 2 });
        fmCone(g, 0.09, 0.14, p[1], p[0] - 0.24, 0.13 - 0.07 + 0.0, i * 0.1 - 0.1, { rz: Math.PI / 2 });
    });
};
FM_PLATED.candy = false;

FM_BUILD.yogurt = function (g) {
    fmCyl(g, 0.24, 0.19, 0.36, 0xFFFFFF, 0, 0, 0);
    fmCyl(g, 0.247, 0.247, 0.025, 0xCFD8DC, 0, 0.36, 0);
    fmCyl(g, 0.222, 0.2, 0.15, 0xF06292, 0, 0.1, 0);
    g.children[g.children.length - 1].scale.set(1.012, 1, 1.012);
    fmSph(g, 0.06, 0xE53935, 0, 0.18, 0.22, { s: [1, 1, 0.25] });
};

// ---- fruit & veg ----
FM_BUILD.apple = function (g, v) {
    const col = v === 'green' ? 0x8BC34A : v === 'candy' ? 0xB3122B : 0xD7263D;
    fmSph(g, 0.27, col, 0, 0.26, 0, { s: [1, 0.92, 1] });
    fmCyl(g, 0.014, 0.014, 0.1, v === 'candy' ? 0xE0C080 : 0x6D4C41, 0, 0.45, 0);
    if (v === 'candy') { fmCyl(g, 0.014, 0.014, 0.4, 0xE0C080, 0, 0.45, 0); return; }
    fmSph(g, 0.06, 0x4CAF50, 0.07, 0.54, 0, { s: [1.6, 0.3, 0.8], rz: 0.4 });
};
FM_BUILD.banana = function (g) {
    const sub = new THREE.Group();
    sub.rotation.x = Math.PI / 2; sub.position.set(-0.3, 0.07, -0.3);
    [0.38, 0.45, 0.52].forEach(R => {
        fmTor(sub, R, 0.07, 0xF5D440, 0, 0, 0, { arc: Math.PI * 0.5, rx: 0 });
        fmSph(sub, 0.035, 0x5D4037, R, 0, 0);
        fmCyl(sub, 0.03, 0.03, 0.06, 0x7B8F3A, 0, R, 0, {});
    });
    g.add(sub);
};
FM_BUILD.orange = function (g) {
    fmSph(g, 0.27, 0xF28C1D, -0.1, 0.26, -0.08);
    fmSph(g, 0.04, 0x4CAF50, -0.1, 0.53, -0.08, { s: [1.4, 0.4, 1] });
    fmCyl(g, 0.2, 0.2, 0.1, 0xF28C1D, 0.28, 0, 0.2, { seg: 20 });
    fmCyl(g, 0.17, 0.17, 0.012, 0xFFB84D, 0.28, 0.1, 0.2, { seg: 20 });
    for (let i = 0; i < 6; i++) fmBox(g, 0.34, 0.005, 0.012, 0xFFF3D0, 0.28, 0.112, 0.2, { ry: i * 0.52 });
};
FM_BUILD.grapes = function (g, v) {
    const col = v === 'green' ? [0x9CCC65, 0x8BC34A] : v === 'blue' ? [0x3F51B5, 0x303F9F] : [0x7B2D8E, 0x5E2072];
    let n = 0;
    [[5, 0.62], [4, 0.52], [3, 0.42], [2, 0.32], [1, 0.22]].forEach(row => {
        for (let k = 0; k < row[0]; k++) { fmSph(g, 0.085, col[(n++) % 2], (k - (row[0] - 1) / 2) * 0.16, row[1] - 0.1, ((n * 37) % 5 - 2) * 0.02); }
    });
    fmCyl(g, 0.012, 0.012, 0.15, 0x6D4C41, 0, 0.55, 0);
    fmSph(g, 0.1, 0x4CAF50, 0.1, 0.7, 0, { s: [1.4, 0.2, 1] });
};
FM_BUILD.tomato = function (g) {
    fmSph(g, 0.26, 0xDC3B2A, 0, 0.24, 0, { s: [1, 0.85, 1] });
    for (let i = 0; i < 5; i++) fmSph(g, 0.06, 0x3E9B3E, Math.cos(i * 1.26) * 0.07, 0.45, Math.sin(i * 1.26) * 0.07, { s: [1.8, 0.3, 0.7], ry: -i * 1.26 });
    fmCyl(g, 0.012, 0.012, 0.05, 0x3E9B3E, 0, 0.45, 0);
};
FM_BUILD.strawberry = function (g) {
    fmCone(g, 0.2, 0.34, 0xD7263D, 0, 0, 0, { rx: Math.PI });
    g.children[g.children.length - 1].position.y = 0.2;
    for (let i = 0; i < 12; i++) { const a = i * 2.4, y = 0.1 + (i % 4) * 0.07, rr = 0.2 * (y - 0.03) / 0.34; fmSph(g, 0.012, 0xFFE082, Math.cos(a) * (rr + 0.01), y, Math.sin(a) * (rr + 0.01)); }
    for (let i = 0; i < 5; i++) fmSph(g, 0.06, 0x3E9B3E, Math.cos(i * 1.26) * 0.1, 0.37, Math.sin(i * 1.26) * 0.1, { s: [1.6, 0.3, 0.8], ry: -i * 1.26 });
};
FM_BUILD.lemon = function (g) {
    fmSph(g, 0.22, 0xF4D03F, 0, 0.2, 0, { s: [1.3, 0.95, 0.95] });
    fmSph(g, 0.035, 0xF4D03F, 0.28, 0.2, 0); fmSph(g, 0.035, 0xF4D03F, -0.28, 0.2, 0);
    fmCyl(g, 0.17, 0.17, 0.03, 0xF4D03F, 0.2, 0, 0.35);
    fmCyl(g, 0.14, 0.14, 0.032, 0xFFF59D, 0.2, 0, 0.35);
};
FM_BUILD.cherry = function (g) {
    fmSph(g, 0.13, 0x8E1127, -0.12, 0.13, 0); fmSph(g, 0.13, 0x8E1127, 0.14, 0.13, 0.05);
    fmCyl(g, 0.01, 0.01, 0.4, 0x6D8B3A, -0.12, 0.22, 0, { rz: -0.35 });
    fmCyl(g, 0.01, 0.01, 0.4, 0x6D8B3A, 0.14, 0.22, 0.05, { rz: 0.35 });
};
FM_BUILD.peach = function (g) {
    fmSph(g, 0.26, 0xF6A66B, 0, 0.26, 0, { s: [1, 0.95, 1] });
    fmSph(g, 0.17, 0xF28C6B, 0.1, 0.3, 0.12);
    fmSph(g, 0.06, 0x4CAF50, 0.03, 0.54, 0, { s: [1.6, 0.3, 0.8], rz: 0.3 });
};
FM_BUILD.mango = function (g) {
    fmSph(g, 0.28, 0xF5A623, 0, 0.25, 0, { s: [1.15, 0.9, 0.85], rz: 0.2 });
    fmSph(g, 0.2, 0x8BC34A, -0.15, 0.32, 0.03, { s: [0.9, 0.8, 0.8] });
    fmSph(g, 0.2, 0xF28C28, 0.12, 0.25, 0.05, { s: [1, 0.85, 0.85] });
};
FM_BUILD.kiwi = function (g) {
    fmCyl(g, 0.25, 0.25, 0.04, 0x7CB342, -0.1, 0, 0.1, { seg: 24 });
    fmCyl(g, 0.21, 0.21, 0.042, 0xBFE08A, -0.1, 0, 0.1, { seg: 24 });
    fmCyl(g, 0.05, 0.05, 0.045, 0xF4F8DF, -0.1, 0, 0.1);
    for (let i = 0; i < 12; i++) fmSph(g, 0.012, 0x222222, -0.1 + Math.cos(i * 0.52) * 0.12, 0.045, 0.1 + Math.sin(i * 0.52) * 0.12);
    fmSph(g, 0.2, 0x8D6E4B, 0.25, 0.18, -0.2, { s: [1.25, 0.9, 0.9], ry: 0.5 });
};
FM_BUILD.watermelon = function (g) {
    const R = 0.42, d = 0.22;
    [[R, 0x2E7D32, d], [R - 0.03, 0xF1F8E9, d + 0.01], [R - 0.08, 0xE63946, d + 0.02]].forEach(c => {
        const sh = new THREE.Shape();
        sh.moveTo(-c[0], 0); sh.absarc(0, 0, c[0], Math.PI, Math.PI * 2, false); sh.closePath();
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: c[2], bevelEnabled: false }), fmMat(c[1]));
        m.position.set(0, R, -c[2] / 2); g.add(m);
    });
    for (let i = 0; i < 7; i++) fmSph(g, 0.022, 0x111111, -0.22 + (i % 4) * 0.15, R - 0.1 - Math.floor(i / 4) * 0.13 - (i % 2) * 0.04, d / 2 + 0.02, { s: [0.7, 1.2, 0.3] });
};
FM_BUILD.pineapple = function (g) {
    fmSph(g, 0.24, 0xE8B82E, 0, 0.3, 0, { s: [0.9, 1.25, 0.9] });
    for (let i = 0; i < 6; i++) fmSph(g, 0.03, 0xB8861B, Math.cos(i * 1.05) * 0.2, 0.2 + (i % 3) * 0.12, Math.sin(i * 1.05) * 0.2);
    for (let i = 0; i < 6; i++) fmCone(g, 0.045, 0.28, i % 2 ? 0x2E7D32 : 0x43A047, Math.cos(i * 1.05) * 0.05, 0.6, Math.sin(i * 1.05) * 0.05, { rz: Math.cos(i * 1.05) * 0.4, rx: -Math.sin(i * 1.05) * 0.4 });
};
FM_BUILD.melon = function (g) {
    fmSph(g, 0.3, 0xBFE08A, 0, 0.3, 0);
    for (let i = 0; i < 5; i++) fmTor(g, 0.302, 0.008, 0x8DB45A, 0, 0.3, 0, { rx: 0, ry: i * 0.63 });
};
FM_BUILD.avocado = function (g) {
    fmSph(g, 0.24, 0x2E5D2E, 0, 0.34, 0, { s: [0.9, 1.3, 0.5] });
    fmSph(g, 0.2, 0xC8E27A, 0, 0.34, 0.1, { s: [0.9, 1.25, 0.15] });
    fmSph(g, 0.1, 0x7A4B2A, 0, 0.24, 0.14);
};
FM_BUILD.carrot = function (g) {
    [[0.1, 0], [-0.1, 0.18]].forEach((p, i) => {
        const m = fmCone(g, 0.11, 0.7, 0xF28C28, 0, 0, 0, { rz: Math.PI / 2 });
        m.position.set(0, 0.11, p[0] + (i ? 0.05 : 0));
        [0.1, -0.05, -0.2].forEach(x => fmTor(g, 0.11 * (x + 0.35) / 0.7 + 0.004, 0.008, 0xD97216, x, 0.11, p[0] + (i ? 0.05 : 0), { ry: Math.PI / 2, rx: 0 }));
        [0, 1, 2].forEach(k => fmCone(g, 0.03, 0.2, 0x4CAF50, 0.4, 0.06, p[0] + (k - 1) * 0.04 + (i ? 0.05 : 0), { rz: -1.0 + k * 0.1 }));
    });
};
FM_BUILD.corn = function (g) {
    fmCaps(g, 0.12, 0.55, 0xF7D44A, 0, 0.13, 0, { rz: Math.PI / 2 });
    for (let i = 0; i < 6; i++) fmTor(g, 0.122, 0.008, 0xD9B22E, -0.22 + i * 0.09, 0.13, 0, { ry: Math.PI / 2, rx: 0 });
    fmSph(g, 0.1, 0x7CB342, 0.28, 0.14, 0.06, { s: [2, 0.3, 0.9], rz: 0.2 });
    fmSph(g, 0.1, 0x689F38, 0.28, 0.14, -0.06, { s: [2, 0.3, 0.9], rz: -0.2 });
};
FM_BUILD.potato = function (g) {
    [[-0.15, 0, 0.1, 0.22], [0.2, 0.05, 0.1, 0.18], [0.0, -0.05, -0.2, 0.2]].forEach((p, i) => {
        fmSph(g, p[3], 0xB58B5A, p[0], 0.16, p[2], { s: [1.2, 0.8, 0.9], ry: i });
        fmSph(g, 0.02, 0x7A5A38, p[0] + 0.06, 0.28, p[2]);
    });
};
FM_BUILD.broccoli = function (g) {
    fmCyl(g, 0.07, 0.09, 0.25, 0x8BC34A, 0, 0, 0);
    [[0, 0.38, 0, 0.17], [0.14, 0.3, 0.06, 0.12], [-0.14, 0.31, 0.04, 0.12], [0.05, 0.3, -0.14, 0.12], [-0.06, 0.45, 0.05, 0.1], [0.08, 0.44, -0.02, 0.1]].forEach((p, i) => fmSph(g, p[3], i % 2 ? 0x3A8F3F : 0x2E7D32, p[0], p[1], p[2]));
};
FM_BUILD.lettuce = function (g, v) {
    const k = v === 'herb' ? 0.55 : 1;
    for (let i = 0; i < 8; i++) {
        const a = i * 0.785;
        fmSph(g, 0.2 * k, i % 2 ? 0x7CC24E : 0x5FAE3E, Math.cos(a) * 0.17 * k, 0.15 * k + 0.04, Math.sin(a) * 0.17 * k, { s: [1, 0.3, 1.2], ry: -a, rz: 0.5 });
    }
    fmSph(g, 0.17 * k, 0xB6E08A, 0, 0.2 * k + 0.05, 0);
};
FM_BUILD.mushroom = function (g) {
    [[0, 0, 1], [0.3, 0.1, 0.65]].forEach(p => {
        const s = p[2];
        fmCyl(g, 0.08 * s, 0.1 * s, 0.2 * s, 0xF0E6D6, p[0], 0, p[1]);
        fmDome(g, 0.26 * s, 0xE9DCC3, p[0], 0.18 * s, p[1], { s: [1, 0.8, 1] });
    });
};
FM_BUILD.cucumber = function (g) {
    fmCaps(g, 0.1, 0.55, 0x3F8F3A, -0.05, 0.11, -0.12, { rz: Math.PI / 2 });
    [0, 1, 2].forEach(i => { fmCyl(g, 0.1, 0.1, 0.03, 0x2E6B2A, 0.05 + i * 0.1, 0, 0.22 - i * 0.02, { seg: 18 }); fmCyl(g, 0.08, 0.08, 0.032, 0xB7E08C, 0.05 + i * 0.1, 0, 0.22 - i * 0.02, { seg: 18 }); });
};
FM_BUILD.pepper = function (g, v) {
    if (v === 'chili') {
        [[-0.05, 0], [0.1, 0.2]].forEach(p => {
            fmCaps(g, 0.065, 0.4, 0xD32F2F, p[0], 0.08, p[1], { rz: Math.PI / 2 - 0.2, ry: 0.2 });
            fmSph(g, 0.06, 0x2E7D32, p[0] - 0.28, 0.12, p[1], { s: [0.8, 1, 1] });
        });
        return;
    }
    [[0.0, 0.0], [0.13, 0.09], [-0.1, 0.1]].forEach(p => fmSph(g, 0.17, 0x3E9B3E, p[0], 0.23, p[1]));
    fmCyl(g, 0.03, 0.03, 0.1, 0x2E7D32, 0, 0.38, 0.05);
};
FM_BUILD.eggplant = function (g) {
    fmSph(g, 0.2, 0x5B2A86, 0, 0.3, 0, { s: [1, 1.5, 1] });
    fmSph(g, 0.14, 0x5B2A86, 0, 0.18, 0, { s: [1.15, 1.1, 1.15] });
    fmDome(g, 0.1, 0x2E7D32, 0, 0.55, 0, { s: [1, 0.4, 1] });
    fmCyl(g, 0.02, 0.02, 0.1, 0x2E7D32, 0, 0.57, 0);
};
FM_BUILD.onion = function (g, v) {
    fmSph(g, 0.26, v === 'purple' ? 0x8E3B6B : 0xC9803A, 0, 0.23, 0, { s: [1, 0.85, 1] });
    fmCone(g, 0.06, 0.15, 0xE8D6A8, 0, 0.4, 0);
};
FM_BUILD.onionrings = function (g, v) {
    const col = v === 'calamari' ? 0xE8C27A : 0xD9A04E;
    [[-0.2, 0, -0.1], [0.12, 0, -0.18], [0, 0, 0.14], [0.25, 0, 0.1], [-0.22, 0, 0.22]].forEach((p, i) => fmTor(g, 0.13, 0.055, col, p[0], 0.06 + (i > 2 ? 0.07 : 0), p[2], { rx: Math.PI / 2 - (i > 2 ? 0.5 : 0.0) }));
    fmWedge(g, 0.3, 0.12, 0.08, 0xF4D03F, 0.35, 0, -0.3, { ry: 0.5 });
};
FM_PLATED.onionrings = true;
FM_BUILD.peas = function (g) {
    fmCaps(g, 0.09, 0.5, 0x5E9E3A, 0, 0.09, 0, { rz: Math.PI / 2, s: [1, 1, 0.8] });
    for (let i = 0; i < 5; i++) fmSph(g, 0.07, 0x8BD450, -0.18 + i * 0.09, 0.2, 0);
};
FM_BUILD.beans = function (g) {
    for (let i = 0; i < 14; i++) {
        const a = i * 2.4, rad = 0.04 + (i % 4) * 0.07;
        fmSph(g, 0.07, 0x8B2E1F, Math.cos(a) * rad, 0.06 + (rad < 0.15 ? 0.08 : 0), Math.sin(a) * rad, { s: [1.5, 0.8, 0.95], ry: i * 1.1 });
    }
};
FM_BUILD.coconut = function (g) {
    fmSph(g, 0.27, 0x6D4C41, -0.12, 0.27, -0.1);
    [[-0.02, 0.5], [-0.16, 0.5], [-0.09, 0.45]].forEach((p) => fmSph(g, 0.03, 0x2B1B12, p[0] - 0.05, p[1], -0.1 + 0.18));
    const o = [], i2 = [];
    for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI / 2; o.push([Math.max(0.001, Math.sin(a) * 0.25), 0.25 * (1 - Math.cos(a))]); i2.push([Math.max(0.001, Math.sin(a) * 0.22), 0.03 + 0.22 * (1 - Math.cos(a))]); }
    fmLathe(g, o, 0x6D4C41, 0.3, 0, 0.25); fmLathe(g, i2, 0xFFFFFF, 0.3, 0, 0.25);
};
FM_BUILD.cheese = function (g) {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.6, 0); sh.lineTo(0.6, 0.3); sh.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false }), fmMat(0xF6C842));
    m.position.set(-0.3, 0, -0.175); g.add(m);
    fmBox(g, 0.01, 0.3, 0.352, 0xE2A93B, 0.301, 0, 0);
    [[-0.1, 0.07], [0.08, 0.11], [0.18, 0.06]].forEach(p => fmSph(g, 0.05, 0xD9A22B, p[0], p[1], 0.178, { s: [1, 1, 0.2] }));
};
FM_BUILD.butter = function (g) {
    fmBox(g, 0.5, 0.18, 0.28, 0xFFE27A, 0.0, 0, 0);
    fmBox(g, 0.26, 0.185, 0.285, 0xFAFAFA, -0.12, 0, 0);
    fmBox(g, 0.262, 0.187, 0.06, 0x3F7FCF, -0.12, 0, 0);
    fmBox(g, 0.12, 0.1, 0.28, 0xFFEFA8, 0.38, 0, 0.0, { ry: 0.25 });
};
FM_BUILD.honey = function (g) {
    fmCyl(g, 0.22, 0.22, 0.34, 0xE5A323, 0, 0, 0);
    fmCyl(g, 0.17, 0.17, 0.06, 0xB87333, 0, 0.34, 0);
    fmCyl(g, 0.222, 0.222, 0.12, 0xF5F5F0, 0, 0.1, 0, { open: true, dbl: true });
    fmSph(g, 0.07, 0xE5A323, 0, 0.15, 0.22, { s: [1, 1.2, 0.1] });
};
FM_BUILD.takeout = function (g) {
    fmCyl(g, 0.3, 0.2, 0.38, 0xF8F8F2, 0, 0, 0, { seg: 4, ry: Math.PI / 4 });
    fmCyl(g, 0.31, 0.21, 0.08, 0xD32F2F, 0, 0.1, 0, { seg: 4, ry: Math.PI / 4, open: true, dbl: true });
    fmBox(g, 0.4, 0.015, 0.2, 0xF1F1EA, 0, 0.37, 0.18, { rx: -0.5 });
    fmBox(g, 0.4, 0.015, 0.2, 0xF1F1EA, 0, 0.37, -0.18, { rx: 0.5 });
    fmTor(g, 0.2, 0.01, 0xBBBBBB, 0, 0.4, 0, { arc: Math.PI, rx: 0 });
};
FM_BUILD.tamale = function (g) {
    [-0.14, 0.16].forEach((z, i) => {
        fmCaps(g, 0.12, 0.45, 0xE8D9A8, 0, 0.12, z, { rz: Math.PI / 2, ry: i ? 0.1 : -0.1 });
        [-0.37, 0.37].forEach(x => fmCone(g, 0.05, 0.09, 0xD9C88E, x, 0.1, z, { rz: x < 0 ? Math.PI / 2 : -Math.PI / 2 }));
        fmTor(g, 0.122, 0.01, 0x6D4C41, 0.2, 0.12, z, { ry: Math.PI / 2, rx: 0 });
    });
    fmSph(g, 0.1, 0xC62828, 0.25, 0.04, 0.35, { s: [1.3, 0.3, 1] });
};
FM_PLATED.tamale = true;
FM_BUILD.flatbread = function (g) {
    fmSph(g, 0.46, 0xE3B26A, 0, 0.03, 0, { s: [1, 0.07, 0.75] });
    for (let i = 0; i < 9; i++) fmSph(g, 0.03, 0x8A5A2A, Math.cos(i * 2.4) * (0.1 + (i % 3) * 0.1), 0.07, Math.sin(i * 2.4) * 0.2, { s: [1.3, 0.3, 1] });
    fmBox(g, 0.08, 0.03, 0.08, 0xFFE27A, 0.05, 0.06, 0);
};
FM_PLATED.flatbread = true;
FM_BUILD.falafel = function (g) {
    [[-0.2, -0.1], [0.05, -0.2], [0.2, 0.0], [-0.05, 0.1], [0.1, 0.2]].forEach((p, i) => {
        fmSph(g, 0.11, 0x8A5A2B, p[0], 0.11, p[1]);
        fmSph(g, 0.03, 0x6DA844, p[0] + 0.05, 0.19, p[1]);
    });
    fmCyl(g, 0.12, 0.09, 0.07, 0xF2F2F2, 0.35, 0, 0.3); fmCyl(g, 0.1, 0.1, 0.01, 0xFFFFFF, 0.35, 0.07, 0.3);
};
FM_PLATED.falafel = true;
FM_BUILD.bacon = function (g) {
    [-0.22, 0, 0.22].forEach((z, i) => {
        for (let k = 0; k < 4; k++) {
            fmBox(g, 0.18, 0.025, 0.1, 0xF2C9BC, -0.27 + k * 0.18, 0, z, { ry: (k % 2 ? 0.15 : -0.15) });
            fmBox(g, 0.18, 0.027, 0.04, 0xA3262A, -0.27 + k * 0.18, 0, z, { ry: (k % 2 ? 0.15 : -0.15) });
        }
    });
};
FM_PLATED.bacon = true;
FM_BUILD.fish = function (g, v) {
    if (v === 'whole') {
        fmSph(g, 0.3, 0x85B4D0, 0, 0.14, 0, { s: [1.3, 0.55, 0.45] });
        fmSph(g, 0.28, 0xD6E6EE, 0, 0.1, 0.05, { s: [1.3, 0.35, 0.35] });
        fmCone(g, 0.15, 0.2, 0x6A9AB8, 0.45, 0.14, 0, { rz: Math.PI / 2, s: [1, 1, 0.3], c: true });
        fmSph(g, 0.035, 0x111111, -0.28, 0.2, 0.12); fmSph(g, 0.03, 0xFFFFFF, -0.28, 0.2, 0.108);
        fmCone(g, 0.07, 0.15, 0x6A9AB8, 0, 0.3, 0, { s: [1, 1, 0.3] });
        return;
    }
    fmSph(g, 0.4, 0xE8C99A, 0, 0.07, 0, { s: [1, 0.2, 0.55], ry: 0.2 });
    for (let i = 0; i < 4; i++) fmBox(g, 0.5, 0.008, 0.02, 0xB88A55, -0.05 + i * 0.07, 0.125, 0, { ry: 0.7 });
    fmWedge(g, 0.25, 0.1, 0.07, 0xF4D03F, 0.3, 0, 0.3, { ry: 0.4 });
    fmSph(g, 0.04, 0x2E8B3C, -0.2, 0.14, 0.1, { s: [1.4, 0.3, 0.8] });
    if (v === 'chips') for (let i = 0; i < 8; i++) fmBox(g, 0.06, 0.06, 0.4, i % 2 ? 0xF2C84B : 0xE9B73A, -0.35 + (i % 4) * 0.07, 0.0, 0.35, { ry: 1.2 + i * 0.05 }).position.set(-0.3 + (i % 4) * 0.07 + (i > 3 ? 0.07 : 0), 0.03 + (i > 3 ? 0.05 : 0), 0.38);
};
FM_PLATED.fish = true;
FM_BUILD.shrimp = function (g) {
    [-0.22, 0.0, 0.22].forEach((z, i) => {
        const sub = new THREE.Group();
        sub.rotation.x = Math.PI / 2; sub.position.set(-0.1, 0.07, z - 0.1);
        fmTor(sub, 0.17, 0.07, 0xE08B3A, 0, 0, 0, { arc: Math.PI * 1.2, rx: 0 });
        fmCone(sub, 0.06, 0.12, 0xE0522A, 0.17, 0, 0, { rz: -Math.PI / 2 });
        g.add(sub);
    });
    fmWedge(g, 0.25, 0.1, 0.07, 0xF4D03F, 0.35, 0, 0.3, { ry: 0.4 });
};
FM_PLATED.shrimp = true;
FM_BUILD.shellfish = function (g, v) {
    const red = 0xC62828;
    if (v === 'crab') {
        fmSph(g, 0.28, red, 0, 0.16, 0, { s: [1.2, 0.5, 0.9] });
        [-1, 1].forEach(s => {
            fmSph(g, 0.1, red, s * 0.42, 0.18, 0.28, { s: [1.2, 0.8, 1] });
            fmCyl(g, 0.02, 0.02, 0.3, red, s * 0.33, 0.14, 0.15, { rz: s * 1.2, rx: 0.6 });
            fmSph(g, 0.025, 0x111111, s * 0.09, 0.28, 0.2);
            [0, 1, 2].forEach(k => fmCyl(g, 0.015, 0.015, 0.3, red, s * 0.3, 0.06, -0.1 - k * 0.1, { rz: s * 1.1 }));
        });
        return;
    }
    fmCaps(g, 0.12, 0.45, red, 0, 0.12, 0, { rz: Math.PI / 2 });
    for (let i = 0; i < 4; i++) fmTor(g, 0.12 - i * 0.005, 0.01, 0x8E1B1B, -0.15 + i * 0.1, 0.12, 0, { ry: Math.PI / 2, rx: 0 });
    fmCone(g, 0.1, 0.2, red, 0.36, 0.12, 0, { rz: -Math.PI / 2, s: [1, 1, 0.4] });
    [-1, 1].forEach(s => { fmSph(g, 0.1, red, -0.4, 0.1, s * 0.2, { s: [1.3, 0.6, 0.9] }); fmCyl(g, 0.012, 0.012, 0.4, red, -0.35, 0.16, s * 0.05, { rz: 1.4, ry: s * 0.3 }); });
};
FM_PLATED.shellfish = true;

FM_BUILD.tp = function (g) {
    [[-0.2, 0.1], [0.2, 0.1], [0, -0.22]].forEach(p => {
        fmCyl(g, 0.19, 0.19, 0.28, 0xFAFAFA, p[0], 0, p[1], { seg: 22 });
        fmCyl(g, 0.08, 0.08, 0.282, 0x9E7B4F, p[0], 0, p[1]);
        fmCyl(g, 0.06, 0.06, 0.285, 0x4B3A28, p[0], 0, p[1]);
        fmTor(g, 0.19, 0.006, 0xDDDDDD, p[0], 0.2, p[1]);
    });
};
FM_BUILD.soap = function (g) {
    fmBox(g, 0.46, 0.14, 0.28, 0xCE93D8, 0, 0, 0);
    fmBox(g, 0.5, 0.1, 0.24, 0xCE93D8, 0, 0.02, 0);
    fmBox(g, 0.4, 0.14, 0.32, 0xCE93D8, 0, 0, 0);
    fmBox(g, 0.3, 0.012, 0.16, 0xE1BEE7, 0, 0.14, 0);
    [[0.3, 0.2, 0.15], [0.4, 0.1, 0.1], [-0.3, 0.15, 0.2]].forEach(p => fmSph(g, 0.04 + p[2] * 0.1, 0xF3F9FF, p[0], 0.1 + p[1], p[2] + 0.1, { alpha: 0.6 }));
};

FM_BUILD.generic = function (g, v, ctx) {                  // a covered dish, coloured from the emoji
    const h = ctx && ctx.hue !== undefined ? ctx.hue : 0.08;
    const c = new THREE.Color(); c.setHSL(h, 0.5, 0.6);
    fmDome(g, 0.36, c.getHex(), 0, 0, 0, { s: [1, 0.85, 1] });
    fmSph(g, 0.05, 0xE8E8E8, 0, 0.32, 0);
    fmTor(g, 0.36, 0.015, 0xE8E8E8, 0, 0.01, 0);
};
FM_PLATED.generic = true;

// ---------- which model? ----------
// strong name words (checked first); [regex, kind, variant]
const FM_NAME_RULES = [
    [/corn ?dog/, 'hotdog', 'corndog'],
    [/pizza slice|slice of pizza/, 'pizza', 'slice'],
    [/calzone/, 'dumpling', 'calzone'],
    [/pizza/, 'pizza', (n) => /veg|garden|primavera/.test(n) ? 'veggie' : /hawaii/.test(n) ? 'hawaiian' : /meat/.test(n) ? 'meat' : /bbq|barbecue/.test(n) ? 'bbq' : /margherita/.test(n) ? 'margherita' : /mushroom/.test(n) ? 'mushroom' : /cheese|stuffed/.test(n) ? 'cheese' : 'pepperoni'],
    [/burger/, 'burger'],
    [/fish (&|and|n) chips|fish & chips/, 'fish', 'chips'],
    [/nugget|\btenders\b/, 'chicken', 'nuggets'],
    [/\bwings?\b/, 'chicken', 'wings'],
    [/parm|cutlet|schnitzel|katsu/, 'cutlet'],
    [/hot ?dog|sausage|bratwurst|frankfurter/, 'hotdog'],
    [/spring roll|egg roll/, 'wrap', 'spring'],
    [/taco|nacho|quesadilla/, 'taco', (n) => /soft|quesadilla/.test(n) ? 'soft' : 'hard'],
    [/burrito|wrap|shawarma|gyro|fajita|enchilada|kebab wrap/, 'wrap', (n) => /veg/.test(n) ? 'veggie' : /gyro|shawarma/.test(n) ? 'pita' : 'meat'],
    [/pita|souvlaki/, 'wrap', 'pita'],
    [/onigiri|rice ball/, 'sushi', 'onigiri'],
    [/lobster roll/, 'shellfish', 'lobster'],
    [/rice drink|sikhye|horchata/, 'glass', 'milk'],
    [/bubble|boba|pearl/, 'boba'],
    [/cinnamon roll|dinner roll|bread roll|sweet roll/, 'bread'],
    [/maki|sushi roll|california roll|dragon roll|\broll\b/, 'sushi', 'maki'],
    [/sushi|nigiri|sashimi/, 'sushi', 'nigiri'],
    [/poke/, 'ricebowl', 'poke'],
    [/fortune cookie/, 'dumpling', 'fortune'],
    [/mooncake/, 'cookie', 'mooncake'],
    [/dumpling|gyoza|potsticker|wonton|dim sum|\bbao\b|steamed bun|samosa|empanada|pierogi|momo/, 'dumpling'],
    [/pad thai|lo mein|chow mein|stir.?fry noodle|dan dan|yakisoba|noodles? stir/, 'stirnoodles'],
    [/ramen|pho\b|udon|soba|laksa|noodle soup|noodle bowl|beef noodle|wonton soup|\bnoodles?\b/, 'noodles', (n) => /pho\b/.test(n) ? 'pho' : /udon|soba/.test(n) ? 'udon' : 'ramen'],
    [/fried rice|egg fried/, 'friedrice'],
    [/bibimbap/, 'ricebowl', 'bibimbap'],
    [/donburi|rice bowl|katsudon|gyudon|teriyaki bowl|burrito bowl/, 'ricebowl', 'donburi'],
    [/biryani|paella|jambalaya|risotto/, 'curry', 'paella'],
    [/masala chai|\bchai\b/, 'mug', 'coffee'],
    [/butter chicken|tikka|masala/, 'curry', 'butter'],
    [/green curry/, 'curry', 'green'],
    [/korma/, 'curry', 'korma'],
    [/curry/, 'curry', 'curry'],
    [/chili|chilli|goulash/, 'curry', 'chili'],
    [/stew|casserole|hotpot|hot pot|cassoulet/, 'curry', 'stew'],
    [/soup|chowder|bisque|broth|gazpacho|miso/, 'soup', (n) => /tomato|gazpacho/.test(n) ? 'tomato' : /pumpkin|squash/.test(n) ? 'pumpkin' : /broccoli|pea|spinach|green/.test(n) ? 'green' : /chowder|bisque|cream/.test(n) ? 'creamy' : /miso/.test(n) ? 'miso' : 'chicken'],
    [/lasagna|lasagne/, 'pasta', 'lasagna'],
    [/ravioli|tortellini/, 'pasta', 'ravioli'],
    [/mac ?(&|and|n)? ?cheese/, 'pasta', 'mac'],
    [/spaghetti|fettuccine|penne|pasta|primavera|linguine|carbonara|macaroni|gnocchi|rigatoni|alfredo|pesto/, 'pasta', (n) => /alfredo/.test(n) ? 'alfredo' : /pesto/.test(n) ? 'pesto' : /arrabbiata/.test(n) ? 'arrabbiata' : /carbonara/.test(n) ? 'carbonara' : /primavera/.test(n) ? 'pesto' : /meatball/.test(n) ? 'meatballs' : 'bolognese'],
    [/salad|slaw/, 'salad', (n) => /fruit/.test(n) ? 'fruit' : 'green'],
    [/fruit cup|fruit bowl/, 'salad', 'fruit'],
    [/turkey/, 'turkey'],
    [/lobster/, 'shellfish', 'lobster'],
    [/\bcrab/, 'shellfish', 'crab'],
    [/calamari|squid/, 'onionrings', 'calamari'],
    [/onion ring/, 'onionrings'],
    [/shrimp|prawn/, 'shrimp'],
    [/fish|salmon|tuna|cod\b|tilapia|trout/, 'fish', (n, o) => (o && o.grocery) ? 'whole' : 'fillet'],
    [/skewer|kebab|satay|yakitori|brochette/, 'skewer', 'meat'],
    [/dango/, 'skewer', 'dango'],
    [/ribs|brisket|bbq pork|pulled pork|spare/, 'steak', 'ribs'],
    [/\bham\b/, 'steak', 'ham'],
    [/burnt ends/, 'steak', 'ribs'],
    [/steak|beef|lamb|pork chop|filet|sirloin|roast beef|prime rib|meat loaf|meatloaf/, 'steak'],
    [/chicken|drumstick|poultry/, 'chicken', 'drumstick'],
    [/bacon/, 'bacon'],
    [/omelet|omelette|frittata/, 'egg', 'omelette'],
    [/toast.*egg|egg.*toast/, 'egg', 'toast'],
    [/\beggs?\b/, 'egg', (n, o) => (o && o.grocery) ? 'carton' : 'fried'],
    [/sandwich|\bsub\b|panini|\bclub\b|bagel|\bmelt\b|toastie|grilled cheese/, 'sandwich', (n) => /grilled|melt|panini|toast/.test(n) ? 'toast' : 'plain'],
    [/chocolate lava|lava cake|molten/, 'cake', 'lava'],
    [/tiramisu/, 'cake', 'tiramisu'],
    [/cheesecake/, 'cake', 'cheesecake'],
    [/birthday cake/, 'cake', 'birthday'],
    [/cupcake|muffin/, 'cake', 'cupcake'],
    [/chocolate cake|brownie|fudge/, 'cake', 'choc'],
    [/(?<!pan)cake|torte|gateau/, 'cake', 'vanilla'],
    [/pancake|crepe|crêpe|hotcake/, 'pancake', 'stack'],
    [/waffle/, 'pancake', 'waffle'],
    [/donut|doughnut|beignet|churro dough|dough bites/, 'donut'],
    [/flan|pudding|custard|creme brulee|panna cotta|mousse/, 'pudding'],
    [/\bpie\b|\btarts?\b|cobbler|strudel/, 'pie', (n) => /pumpkin/.test(n) ? 'pumpkin' : 'apple'],
    [/ice cream cone|soft serve/, 'icecream', 'cone'],
    [/yogurt|yoghurt/, 'yogurt'],
    [/gelato|ice cream|sundae|sorbet|frozen custard/, 'icecream', (n, o) => (o && o.grocery) ? 'tub' : 'cup'],
    [/shaved ice|snow cone|kakigori|halo.?halo/, 'icecream', 'ice'],
    [/cotton candy/, 'candy', 'cotton'],
    [/lollipop|sucker/, 'candy', 'lolli'],
    [/marshmallow/, 'candy', 'marsh'],
    [/jelly bean|gummy|gummies|gumdrop|jelly/, 'candy', 'pile'],
    [/candy apple|toffee apple/, 'apple', 'candy'],
    [/candy|sweets|taffy|toffee/, 'candy', 'wrapped'],
    [/hot chocolate|hot cocoa|cocoa/, 'mug', 'cocoa'],
    [/chocolate bar|^chocolate$/, 'chocolate'],
    [/cookie|biscuit|macaron|shortbread/, 'cookie', 'choc'],
    [/pretzel/, 'pretzel'],
    [/popcorn/, 'popcorn'],
    [/chips|crisps|nachos? chips|tortilla chips/, 'chipsbag'],
    [/fries|french fry|chip(s)? basket|wedges|tots|hash brown/, 'fries'],
    [/croissant|pastry|danish|puff/, 'croissant'],
    [/baguette|ciabatta|breadstick/, 'baguette'],
    [/naan|flatbread|roti|chapati|focaccia|paratha/, 'flatbread'],
    [/falafel|meatball|sesame ball/, 'falafel'],
    [/tamale/, 'tamale'],
    [/toast\b|bread|loaf|garlic/, 'bread'],
    [/cereal|granola|\boats?\b/, (o) => (o && o.grocery) ? 'cerealbox' : 'cerealbowl', null],
    [/rice\b/, 'ricebowl', 'plain'],
    [/hot cocoa|cocoa|hot chocolate/, 'mug', 'cocoa'],
    [/coffee|\blatte\b|espresso|cappuccino|mocha|\bchai\b/, 'mug', 'coffee'],
    [/rose tea|hibiscus/, 'mug', 'rose'],
    [/green tea|matcha|jasmine|tea\b/, (o, n) => /iced|sweet|lemon|thai|boba|bubble/.test(n) ? 'glass' : 'mug', (n) => /iced|sweet|thai|lemon/.test(n) ? 'tea' : /green|matcha|jasmine/.test(n) ? 'green' : 'coffee'],
    [/milkshake|shake|smoothie|lassi/, 'glass', (n) => /strawberry|berry|lassi|rose/.test(n) ? 'pink' : /mango/.test(n) ? 'orange' : 'milk'],
    [/lemonade/, 'glass', 'lemon'],
    [/orange (juice|soda)|orangeade/, 'glass', 'orange'],
    [/apple (juice|cider)|cider/, 'glass', 'apple'],
    [/\bmilk\b/, (o) => (o && o.grocery) ? 'milkcarton' : 'glass', (n) => /choc/.test(n) ? 'choc' : 'milk'],
    [/sparkling|mineral|\bwater\b/, (o) => (o && o.grocery) ? 'bottle' : 'glass', 'water'],
    [/juice/, (o) => (o && o.grocery) ? 'juicebox' : 'glass', (n) => /orange/.test(n) ? 'orange' : /apple/.test(n) ? 'apple' : 'green'],
    [/cocktail|punch|tropical|virgin|mocktail/, 'glass', 'tropical'],
    [/soda|cola|root beer|pop\b|fizz|ginger ale|italian soda/, (o) => (o && o.grocery) ? 'can' : 'cup', (n) => /root/.test(n) ? 'root' : /orange/.test(n) ? 'orange' : 'cola'],
    [/toilet paper|tissue/, 'tp'],
    [/soap/, 'soap'],
    [/cheese/, 'cheese'],
    [/corn\b/, 'corn'],
    [/butter/, 'butter'],
    [/honey/, 'honey'],
    [/broccoli/, 'broccoli'],
    [/lettuce|cabbage|bok choy|greens|spinach|kale/, 'lettuce', 'leaf'],
    [/carrot/, 'carrot'],
    [/potato/, 'potato'],
    [/tomato/, 'tomato'],
    [/mushroom/, 'mushroom'],
    [/cucumber|pickle/, 'cucumber'],
    [/pepper|capsicum/, 'pepper', (n) => /chili|chilli|jalape|hot/.test(n) ? 'chili' : 'bell'],
    [/eggplant|aubergine/, 'eggplant'],
    [/onion/, 'onion', 'yellow'],
    [/avocado|guacamole/, 'avocado'],
    [/\bapples?\b/, 'apple', (n) => /green/.test(n) ? 'green' : 'red'],
    [/banana/, 'banana'],
    [/orange|tangerine|clementine/, 'orange'],
    [/grape/, 'grapes', (n) => /green/.test(n) ? 'green' : 'purple'],
    [/strawberr|raspberr|berry|berries/, 'strawberry'],
    [/lemon|lime/, 'lemon'],
    [/cherry|cherries/, 'cherry'],
    [/peach|apricot|plum/, 'peach'],
    [/pineapple/, 'pineapple'],
    [/mango|papaya/, 'mango'],
    [/kiwi/, 'kiwi'],
    [/watermelon/, 'watermelon'],
    [/melon|cantaloupe/, 'melon'],
    [/coconut/, 'coconut'],
    [/pea\b|peas|edamame/, 'peas'],
    [/\bbeans?\b|lentil|hummus/, 'beans'],
    [/herb|basil|mint|parsley/, 'lettuce', 'herb']
];

// emoji (variation selectors removed) -> [kind, variant]
const FM_EMOJI = {
    '🍕': ['pizza', 'pepperoni'], '🍔': ['burger'], '🌭': ['hotdog'], '🍟': ['fries'], '🥪': ['sandwich', 'plain'],
    '🌮': ['taco', 'hard'], '🌯': ['wrap', 'meat'], '🥙': ['wrap', 'pita'], '🫔': ['tamale'], '🍝': ['pasta', 'bolognese'],
    '🍜': ['noodles', 'ramen'], '🍚': ['ricebowl', 'plain'], '🍛': ['curry', 'rice'], '🍲': ['curry', 'stew'], '🥘': ['curry', 'paella'],
    '🥣': ['cerealbowl'], '🥗': ['salad', 'green'], '🥩': ['steak'], '🍖': ['steak', 'ribs'], '🍗': ['chicken', 'drumstick'], '🦃': ['turkey'],
    '🍢': ['skewer', 'meat'], '🍡': ['skewer', 'dango'], '🍣': ['sushi', 'nigiri'], '🍙': ['sushi', 'onigiri'], '🥟': ['dumpling'], '🥠': ['dumpling', 'fortune'],
    '🥮': ['cookie', 'mooncake'], '🍳': ['egg', 'toast'], '🥚': ['egg', 'carton'], '🍰': ['cake', 'vanilla'], '🎂': ['cake', 'birthday'], '🧁': ['cake', 'cupcake'],
    '🍨': ['icecream', 'cup'], '🍦': ['icecream', 'swirl'], '🍧': ['icecream', 'ice'], '🍩': ['donut'], '🍪': ['cookie', 'choc'], '🥧': ['pie', 'apple'],
    '🍮': ['pudding'], '🥤': ['cup', 'cola'], '🧋': ['boba'], '🍵': ['mug', 'green'], '☕': ['mug', 'coffee'], '🍹': ['glass', 'tropical'], '🍋': ['lemon'],
    '🥛': ['glass', 'milk'], '💧': ['glass', 'water'], '🧃': ['juicebox', 'green'], '🍞': ['bread'], '🥖': ['baguette'], '🥐': ['croissant'], '🥨': ['pretzel'],
    '🥞': ['pancake', 'stack'], '🧇': ['pancake', 'waffle'], '🫓': ['flatbread'], '🧆': ['falafel'], '🥓': ['bacon'],
    '🍎': ['apple', 'red'], '🍌': ['banana'], '🍊': ['orange'], '🍇': ['grapes', 'purple'], '🍅': ['tomato'], '🍓': ['strawberry'], '🍒': ['cherry'],
    '🍑': ['peach'], '🦐': ['shrimp'], '🫐': ['grapes', 'blue'], '🐙': ['onionrings', 'calamari'], '🍍': ['pineapple'], '🥭': ['mango'], '🥝': ['kiwi'], '🍉': ['watermelon'], '🍈': ['melon'], '🥑': ['avocado'], '🥥': ['coconut'],
    '🥕': ['carrot'], '🌽': ['corn'], '🥔': ['potato'], '🥦': ['broccoli'], '🥬': ['lettuce', 'leaf'], '🍄': ['mushroom'], '🥒': ['cucumber'],
    '🫑': ['pepper', 'bell'], '🌶': ['pepper', 'chili'], '🍆': ['eggplant'], '🧅': ['onion', 'yellow'], '🫛': ['peas'], '🫘': ['beans'], '🌿': ['lettuce', 'herb'], '🍃': ['lettuce', 'herb'],
    '🧀': ['cheese'], '🧈': ['butter'], '🍯': ['honey'], '🥡': ['takeout'], '🐟': ['fish', 'fillet'], '🍤': ['shrimp'], '🦞': ['shellfish', 'lobster'], '🦀': ['shellfish', 'crab'],
    '🦑': ['onionrings', 'calamari'], '🍫': ['chocolate'], '🍬': ['candy', 'wrapped'], '🍭': ['candy', 'lolli'], '🍥': ['candy', 'marsh'], '🍿': ['chipsbag'],
    '🌺': ['mug', 'rose'], '🌹': ['mug', 'rose'], '🧻': ['tp'], '🧼': ['soap']
};

// Works out { kind, variant, key } for a dish/grocery. `exact` = true when the emoji or a name word really matched.
function foodModelKind(emoji, name, opts) {
    const n = (name || '').toLowerCase();
    const em = (emoji || '').replace(/️/g, '');
    const o = opts || {};
    const run = (rule) => {
        let kind = rule[1], v = rule[2];
        if (typeof kind === 'function') kind = kind(o, n);
        if (typeof v === 'function') v = v(n, o);
        return { kind: kind, variant: v || '', exact: true };
    };
    let r = null;
    for (let i = 0; i < FM_NAME_RULES.length; i++) {
        const rule = FM_NAME_RULES[i];
        if (rule[0].test(n)) { r = run(rule); break; }
    }
    if (!r && FM_EMOJI[em]) {
        const e = FM_EMOJI[em];
        r = { kind: e[0], variant: e[1] || '', exact: true };
    }
    if (r) {
        // grocery packaging overrides for plain emoji lookups
        if (o.grocery) {
            if (r.kind === 'glass' && r.variant === 'milk') r = { kind: 'milkcarton', variant: 'milk', exact: true };
            else if (r.kind === 'glass' && r.variant === 'water') r = { kind: 'bottle', variant: 'water', exact: true };
            else if (r.kind === 'cup') r = { kind: 'can', variant: 'cola', exact: true };
            else if (r.kind === 'cerealbowl') r = { kind: 'cerealbox', variant: '', exact: true };
            else if (r.kind === 'icecream' && r.variant === 'cup') r = { kind: 'icecream', variant: 'tub', exact: true };
            else if (r.kind === 'icecream' && r.variant === 'swirl' && /yogurt|yoghurt/.test(n)) r = { kind: 'yogurt', variant: '', exact: true };
            else if (r.kind === 'fish' && r.variant === 'fillet') r = { kind: 'fish', variant: 'whole', exact: true };
            else if (r.kind === 'egg' && r.variant === 'toast') r = { kind: 'egg', variant: 'carton', exact: true };
        } else if (r.kind === 'egg' && r.variant === 'carton') r = { kind: 'egg', variant: 'fried', exact: true };
        if (!FM_BUILD[r.kind]) r = null;
    }
    if (!r) r = { kind: 'generic', variant: '', exact: false, hue: (fmHash(em + n) % 360) / 360 };
    r.key = r.kind + ':' + r.variant;
    return r;
}

// ---------- the public model builder ----------
function buildFoodModel(emoji, name, opts) {
    const o = opts || {};
    const root = new THREE.Group();
    const holder = new THREE.Group();
    let r;
    try { r = foodModelKind(emoji, name, o); } catch (e) { r = { kind: 'generic', variant: '', hue: 0.08 }; }
    try {
        FM_BUILD[r.kind](holder, r.variant, r);
    } catch (e) {
        while (holder.children.length) holder.remove(holder.children[0]);
        try { FM_BUILD.generic(holder, '', { hue: 0.08 }); r = { kind: 'generic' }; } catch (e2) { /* leave empty */ }
    }
    if (FM_PLATED[r.kind] && o.plate !== false) {
        fmCyl(root, 0.5, 0.34, 0.05, 0xF6F6F2, 0, 0, 0, { seg: 48 });                 // the plate
        fmTor(root, 0.49, 0.012, 0xFFFFFF, 0, 0.05, 0);                                  // a rolled rim
        fmCyl(root, 0.34, 0.34, 0.008, 0xE9E9E3, 0, 0.046, 0, { seg: 48 });              // the shallow well
        fmCyl(root, 0.2, 0.22, 0.012, 0xD9D9D2, 0, -0.004, 0, { seg: 24 });              // the foot ring underneath
        holder.position.y = 0.055;
    }
    root.add(holder);
    root.userData.foodKind = r.kind;
    if (FM_HOT[r.kind] && o.steam !== false) fmAddSteam(root, FM_HOT[r.kind]);
    return root;
}

// ---------- steam: a few soft white puffs that rise and fade above hot food ----------
const FM_HOT = { pizza: 0.35, burger: 0.4, hotdog: 0.35, fries: 0.5, sandwich: 0.2, taco: 0.35, wrap: 0.3, pasta: 0.5, cutlet: 0.4, noodles: 0.55, stirnoodles: 0.5,
    ricebowl: 0.5, friedrice: 0.5, curry: 0.55, soup: 0.65, steak: 0.5, chicken: 0.45, turkey: 0.4, skewer: 0.4, dumpling: 0.5, egg: 0.3, mug: 0.55, takeout: 0.4,
    tamale: 0.4, falafel: 0.3, bacon: 0.35, pancake: 0.35, onionrings: 0.35, flatbread: 0.2, potato: 0.3, corn: 0.3, fish: 0.4, shrimp: 0.35, shellfish: 0.4 };
let fmSteamTex = null;
function fmSteamTexture() {
    if (fmSteamTex) return fmSteamTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    fmSteamTex = new THREE.CanvasTexture(c); fmSteamTex.dispose = () => {};
    return fmSteamTex;
}
function fmAddSteam(root, strength) {
    const box = new THREE.Box3().setFromObject(root);
    const top = box.max.y, puffs = [];
    for (let i = 0; i < 4; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fmSteamTexture(), transparent: true, opacity: 0, depthWrite: false }));
        sp.raycast = () => {};
        root.add(sp);
        puffs.push({ sp, off: i / 4, x: (Math.random() - 0.5) * 0.3, z: (Math.random() - 0.5) * 0.3 });
    }
    // drawn every frame the food is visible: the puffs rise, grow and fade (and in still pictures they hang just above the dish)
    const driver = root.getObjectByProperty('isMesh', true);
    const upd = () => {
        const t = Date.now() / 1000;
        puffs.forEach(p => {
            const k = (t * 0.35 + p.off) % 1;
            p.sp.position.set(p.x + Math.sin(t * 1.3 + p.off * 9) * 0.04 * k, top + 0.05 + k * 0.45, p.z);
            const s = 0.18 + k * 0.4; p.sp.scale.set(s, s, 1);
            p.sp.material.opacity = Math.sin(k * Math.PI) * 0.5 * strength;
        });
    };
    upd();
    if (driver) driver.onBeforeRender = upd;
}

// frees a model's geometries and materials
function disposeFoodModel(obj) {
    if (!obj) return;
    obj.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
    });
}

// ---------- icons (PNG data-URLs from ONE shared offscreen renderer) ----------
let fmIconRenderer = null, fmIconScene = null, fmIconCam = null, fmIconFailed = false;
const fmIconCache = {};

function fmIconSetup() {
    if (fmIconRenderer) return true;
    if (fmIconFailed || typeof THREE === 'undefined') return false;
    try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 96;
        fmIconRenderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
        fmIconRenderer.setPixelRatio(1);
        fmIconRenderer.setClearColor(0x000000, 0);
        fmIconScene = new THREE.Scene();
        fmIconScene.add(new THREE.HemisphereLight(0xffffff, 0xcdb89a, 1.1));
        const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);                         // warm key light
        sun.position.set(-1.5, 3, 2.5);
        fmIconScene.add(sun);
        const fill = new THREE.DirectionalLight(0xbfd8ff, 0.7);                        // cool fill
        fill.position.set(2.5, 1.2, 1.0);
        fmIconScene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 1.1);                         // rim light from behind
        rim.position.set(0.5, 2, -3);
        fmIconScene.add(rim);
        fmIconCam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
        return true;
    } catch (e) {
        fmIconFailed = true; fmIconRenderer = null;
        return false;
    }
}

function foodIcon(emoji, name, size, opts) {
    const px = Math.max(16, Math.min(256, Math.round(size || 96)));
    const o = opts || {};
    let info;
    try { info = foodModelKind(emoji, name, o); } catch (e) { return null; }
    if (!info.exact && !o.force) return null;                  // not a food we know: caller keeps the plain emoji
    const key = info.key + '|' + px + '|' + (o.grocery ? 'g' : 'r') + (info.kind === 'generic' ? '|' + emoji : '');
    if (key in fmIconCache) return fmIconCache[key];
    if (!fmIconSetup()) return null;
    let url = null, model = null;
    try {
        model = buildFoodModel(emoji, name, { grocery: o.grocery });
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false }));
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002;
        model.rotation.y = -0.5;
        fmIconScene.add(model); fmIconScene.add(shadow);
        const box = new THREE.Box3().setFromObject(model);
        const bs = box.getSize(new THREE.Vector3());
        shadow.scale.setScalar(Math.max(0.3, Math.min(1, Math.max(bs.x, bs.z) / 1.05)));          // the shadow matches the dish's size
        const c = box.getCenter(new THREE.Vector3());
        const sph = box.getBoundingSphere(new THREE.Sphere());
        const dist = Math.max(0.5, sph.radius) / Math.sin(THREE.MathUtils.degToRad(15)) * 1.02;
        const dir = new THREE.Vector3(0.0, 0.85, 1).normalize();
        fmIconCam.position.copy(c).addScaledVector(dir, dist);
        fmIconCam.lookAt(c);
        fmIconCam.updateProjectionMatrix();
        fmIconRenderer.setSize(px, px, false);
        fmIconRenderer.render(fmIconScene, fmIconCam);
        url = fmIconRenderer.domElement.toDataURL('image/png');
        fmIconScene.remove(model); fmIconScene.remove(shadow);
        disposeFoodModel(model); disposeFoodModel(shadow);
    } catch (e) {
        url = null;
        try { if (model) { fmIconScene.remove(model); disposeFoodModel(model); } } catch (e2) { /* ignore */ }
    }
    fmIconCache[key] = url;
    return url;
}

// <img> for the DOM, or the plain emoji if there's no icon. opts.force makes unknown foods get a generic covered dish.
function foodImg(emoji, name, px, opts) {
    const p = px || 28;
    let url = null;
    try { url = foodIcon(emoji, name, Math.max(48, p * 2), opts); } catch (e) { url = null; }
    if (!url) return emoji || '';
    return '<img src="' + url + '" width="' + p + '" height="' + p + '" alt="' + (emoji || '') + '" style="vertical-align:middle">';
}

// a camera-facing sprite of the icon (handy where a flat picture is fine); null if no icon
function makeFoodSprite(emoji, name, size, opts) {
    const url = foodIcon(emoji, name, 128, opts);
    if (!url) return null;
    const tex = new THREE.TextureLoader().load(url);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(size || 1, size || 1, 1);
    return sprite;
}
