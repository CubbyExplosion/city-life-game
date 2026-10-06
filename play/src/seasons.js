// =============================================
// SEASONS — every 100-day year ends with winter. In winter the
// Christmas tree goes up and Santa visits on the last day. Some years
// it also SNOWS, and when it snows school is closed until the new year.
// (The Christmas tree and Santa's presents live in gifts.js.)
// =============================================

function isWinter() {
    return player.sleepCount >= WINTER_START_DAY;
}

function isSnowing() {
    return !!player.snowYear && isWinter();
}

// Decided once at the start of each year — "sometimes it snows".
function rollSnowYear() {
    player.snowYear = Math.random() < SNOW_YEAR_CHANCE;
}

// The first day of winter: tell the player what kind of winter it is.
function announceWinter(silent) {
    if (silent) return;
    if (isSnowing()) {
        player.happiness = Math.min(100, player.happiness + 5);
        showEvent('❄️', "It's snowing! Snow day — school is closed until the new year! +5 happiness");
    } else {
        showEvent('🎄', 'Winter is here! Christmas is coming...');
    }
}

// Makes the 3D world match the weather. Safe to call any time: it only
// touches things when we're standing in the house scene, and it adds or
// removes snow so it always matches isSnowing().
function syncWeather() {
    if (!scene || inSchool || driving || inStore || inRestaurant || inNeighborhood || inMall || inWork || inUni) return; // the house is put away right now — we'll sync when we're back

    if (isSnowing()) {
        scene.background = new THREE.Color(0xcfdcea);
        if (!snowGround) {
            snowGround = new THREE.Mesh(
                new THREE.BoxGeometry(46, 0.2, 46),
                new THREE.MeshLambertMaterial({ color: 0xf2f7ff })
            );
            snowGround.position.set(0, -0.35, 0);
        }
        if (!snowGround.parent) scene.add(snowGround);
        if (!snowPoints) snowPoints = makeSnowPoints(450, 26, 14, 26);
        if (!snowPoints.parent) scene.add(snowPoints);
    } else {
        scene.background = new THREE.Color(0x87ceeb);
        [snowGround, snowPoints].forEach(obj => {
            if (obj && obj.parent) obj.parent.remove(obj);
        });
        snowGround = null;
        snowPoints = null;
    }
}

// A cloud of white dots (one dot = one snowflake).
function makeSnowPoints(count, width, height, depth) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * width;
        positions[i * 3 + 1] = Math.random() * height;
        positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9
    }));
    points.frustumCulled = false;
    points.userData.height = height;
    return points;
}

// Called every frame from animate() at home.
function updateSnow() {
    if (!snowPoints || !snowPoints.parent) return;
    animateSnowPoints(snowPoints);
}

// Snowflakes drift down, then restart at the top. (Also used for the snow in the store's parking lot.)
function animateSnowPoints(points) {
    const arr = points.geometry.attributes.position.array;
    const top = points.userData.height;
    const sway = Date.now() * 0.001;
    for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= 0.04 + ((i / 3) % 5) * 0.008;      // fall (each flake at its own speed)
        arr[i]     += Math.sin(sway + i) * 0.004;        // drift side to side
        if (arr[i + 1] < 0) arr[i + 1] = top;            // back to the sky
    }
    points.geometry.attributes.position.needsUpdate = true;
}
