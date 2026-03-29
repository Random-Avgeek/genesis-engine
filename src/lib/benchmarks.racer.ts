// Racer benchmark fixture - extracted to avoid backtick nesting issues
export const racerBenchmark = {
  title: "Quantum Math Drift",
  blueprint: "BENCHMARK: 3-Lane Educational Racer using Kaplay.js. Features continuous scrolling illusion, discrete lane movement, and dynamic math gate generation.",
  code: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HYPERLANE — Math Racer</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"><\/script>
    <style>
        :root {
            --cyan:    #00f5ff;
            --magenta: #ff0088;
            --yellow:  #ffe600;
            --green:   #00ff88;
            --dark:    #04060f;
            --panel:   rgba(4,6,15,0.92);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex; height: 100vh;
            background: var(--dark);
            font-family: 'Share Tech Mono', monospace;
            overflow: hidden;
        }
        /* scanline overlay */
        body::after {
            content: '';
            position: fixed; inset: 0;
            background: repeating-linear-gradient(
                0deg, transparent, transparent 2px,
                rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px
            );
            pointer-events: none; z-index: 999;
        }
        #viewport {
            flex-grow: 1; position: relative;
            background: var(--dark);
        }

        /* ── HUD panels ──────────────────────────────────────── */
        #hud-left {
            position: absolute; top: 18px; left: 18px;
            z-index: 10; pointer-events: none;
            display: flex; flex-direction: column; gap: 10px;
        }
        #hud-right {
            position: absolute; top: 18px; right: 18px;
            z-index: 10; pointer-events: none;
            display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
        }
        .panel {
            background: var(--panel);
            border: 1px solid #1a2030;
            border-radius: 4px;
            padding: 10px 16px;
        }
        .panel-label {
            font-size: 0.62rem; letter-spacing: 3px;
            color: #445; text-transform: uppercase; margin-bottom: 4px;
        }
        .panel-value {
            font-family: 'Orbitron', monospace;
            font-size: 1.6rem; font-weight: 700;
            color: var(--cyan);
            text-shadow: 0 0 10px var(--cyan);
        }
        #score-val   { color: var(--cyan);    text-shadow: 0 0 10px var(--cyan); }
        #combo-val   { color: var(--yellow);  text-shadow: 0 0 10px var(--yellow); }
        #lives-val   { color: var(--magenta); text-shadow: 0 0 10px var(--magenta); font-size: 1.2rem; letter-spacing: 4px; }

        /* equation display */
        #eq-panel {
            position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
            z-index: 10; pointer-events: none;
            background: var(--panel);
            border: 1px solid #1a2030;
            border-bottom: 2px solid var(--cyan);
            border-radius: 4px;
            padding: 10px 28px;
            text-align: center;
            min-width: 220px;
        }
        #eq-label { font-size: 0.62rem; letter-spacing: 3px; color: #445; margin-bottom: 2px; }
        #equation {
            font-family: 'Orbitron', monospace;
            font-size: 2.4rem; font-weight: 900;
            color: #fff;
            letter-spacing: 4px;
        }
        #op-type {
            font-size: 0.7rem; letter-spacing: 2px;
            margin-top: 2px;
        }

        /* timer bar */
        #timer-bar-wrap {
            position: absolute; top: 0; left: 0; right: 0;
            height: 4px; z-index: 20; pointer-events: none;
        }
        #timer-bar {
            height: 100%; width: 100%;
            background: var(--cyan);
            box-shadow: 0 0 8px var(--cyan);
            transition: background 0.3s;
        }

        /* speedometer canvas */
        #speedo-wrap {
            position: absolute; bottom: 24px; right: 24px;
            z-index: 10; pointer-events: none;
        }
        #speedo { display: block; }

        /* flash overlay */
        #flash {
            position: absolute; inset: 0; z-index: 50;
            pointer-events: none; opacity: 0;
            transition: opacity 0.05s;
        }

        /* answer reveal */
        #reveal {
            position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
            z-index: 60; pointer-events: none;
            font-family: 'Orbitron', monospace;
            font-size: 1rem; letter-spacing: 3px;
            color: var(--magenta);
            text-shadow: 0 0 12px var(--magenta);
            opacity: 0; transition: opacity 0.2s;
            white-space: nowrap;
        }

        .instruction {
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
            color: #334; font-size: 0.75rem; z-index: 10;
            pointer-events: none; letter-spacing: 3px; white-space: nowrap;
        }
    <\/style>
</head>
<body>
<div id="viewport">
    <!-- timer bar -->
    <div id="timer-bar-wrap"><div id="timer-bar"><\/div><\/div>

    <!-- centre equation -->
    <div id="eq-panel">
        <div id="eq-label">SOLVE<\/div>
        <div id="equation">? ? ?<\/div>
        <div id="op-type" style="color:var(--cyan)">LOADING…<\/div>
    <\/div>

    <!-- left hud -->
    <div id="hud-left">
        <div class="panel">
            <div class="panel-label">Sectors Cleared<\/div>
            <div class="panel-value" id="score-val">0<\/div>
        <\/div>
        <div class="panel">
            <div class="panel-label">Combo<\/div>
            <div class="panel-value" id="combo-val">x1<\/div>
        <\/div>
    <\/div>

    <!-- right hud -->
    <div id="hud-right">
        <div class="panel">
            <div class="panel-label">Lives<\/div>
            <div class="panel-value" id="lives-val">♥ ♥ ♥<\/div>
        <\/div>
        <div class="panel">
            <div class="panel-label">Best<\/div>
            <div class="panel-value" id="best-val">0<\/div>
        <\/div>
    <\/div>

    <!-- speedometer -->
    <div id="speedo-wrap">
        <canvas id="speedo" width="140" height="90"><\/canvas>
    <\/div>

    <!-- flash overlay -->
    <div id="flash"><\/div>
    <!-- answer reveal on wrong -->
    <div id="reveal"><\/div>

    <div class="instruction">← → ARROWS TO STEER · REACH THE CORRECT ANSWER<\/div>
<\/div>

<script>
// ═══════════════════════════════════════════════════════════
//  HYPERLANE — optimised math racer  (benchmark edition)
//  All game objects are pooled. Zero mid-game allocations.
// ═══════════════════════════════════════════════════════════

kaplay({ global: true, root: document.getElementById('viewport'), background: [4,6,15,255] });

// ── DOM refs ─────────────────────────────────────────────
const scoreEl  = document.getElementById('score-val');
const comboEl  = document.getElementById('combo-val');
const livesEl  = document.getElementById('lives-val');
const bestEl   = document.getElementById('best-val');
const eqEl     = document.getElementById('equation');
const opEl     = document.getElementById('op-type');
const timerBar = document.getElementById('timer-bar');
const flashEl  = document.getElementById('flash');
const revealEl = document.getElementById('reveal');
const speedoCtx= document.getElementById('speedo').getContext('2d');

// ── constants ─────────────────────────────────────────────
const LANES       = 3;
const BASE_SPEED  = 280;
const SPEED_INC   = 15;
const MAX_SPEED   = 900;
const GATE_H      = 22;
const STAR_RATE   = 0.06;    // seconds between star spawns
const MAX_STARS   = 60;
const MAX_GATES   = 9;       // 3 sets buffered
const TIME_LIMIT  = 7;       // seconds per question
const MAX_LIVES   = 3;

// operation colours for gate tinting
const OP_COLORS = {
    '×': [0, 220, 255],
    '+': [0, 255, 136],
    '−': [255, 0, 136],
    '÷': [255, 230, 0],
};
const OP_NAMES = {
    '×': 'MULTIPLY', '+': 'ADDITION', '−': 'SUBTRACT', '÷': 'DIVIDE'
};

// ── state ─────────────────────────────────────────────────
let score = 0, combo = 1, lives = MAX_LIVES, best = 0;
let gameSpeed = BASE_SPEED;
let questionTimer = TIME_LIMIT;
let questionActive = false;
let correctAnswer  = 0;
let currentOp      = '×';
let flashTimeout   = null;
let revealTimeout  = null;

// ── speedometer draw ──────────────────────────────────────
function drawSpeedo(speed) {
    if (!speedoCtx) return;
    const c = speedoCtx;
    const W = 140, H = 90, cx = 70, cy = 80, R = 62;
    c.clearRect(0, 0, W, H);

    // arc track
    c.beginPath();
    c.arc(cx, cy, R, Math.PI, 0);
    c.strokeStyle = '#0a1020'; c.lineWidth = 12; c.stroke();

    // coloured fill
    const fraction = Math.min((speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);
    const endAngle = Math.PI + fraction * Math.PI;
    const r = Math.round(0 + fraction * 255);
    const g = Math.round(245 - fraction * 245);
    c.beginPath();
    c.arc(cx, cy, R, Math.PI, endAngle);
    c.strokeStyle = \`rgb(\${r},\${g},255)\`; c.lineWidth = 8;
    c.shadowColor  = \`rgb(\${r},\${g},255)\`; c.shadowBlur = 10;
    c.stroke();
    c.shadowBlur = 0;

    // needle
    const needleAngle = Math.PI + fraction * Math.PI;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(needleAngle) * (R-10), cy + Math.sin(needleAngle) * (R-10));
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();

    // digital readout
    c.fillStyle = '#fff';
    c.font = 'bold 13px "Orbitron",monospace';
    c.textAlign = 'center';
    c.fillText(Math.round(speed), cx, cy - 8);
    c.fillStyle = '#445';
    c.font = '9px "Share Tech Mono",monospace';
    c.fillText('KM/H', cx, cy + 6);
}
drawSpeedo(BASE_SPEED);

// ── flash helpers ─────────────────────────────────────────
function screenFlash(color, duration = 120) {
    if (!flashEl) return;
    flashEl.style.background = color;
    flashEl.style.opacity    = '0.35';
    clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => { 
        if (flashEl) flashEl.style.opacity = '0'; 
    }, duration);
}
function showReveal(msg) {
    if (!revealEl) return;
    revealEl.textContent = msg;
    revealEl.style.opacity = '1';
    clearTimeout(revealTimeout);
    revealTimeout = setTimeout(() => { 
        if (revealEl) revealEl.style.opacity = '0'; 
    }, 1800);
}
function updateLivesHUD() {
    if (!livesEl) return;
    livesEl.textContent = '♥ '.repeat(lives).trim() + ' ♡ '.repeat(MAX_LIVES - lives).trim();
    livesEl.textContent = Array.from({length: MAX_LIVES}, (_,i) => i < lives ? '♥' : '♡').join(' ');
}
function updateComboHUD() {
    if (!comboEl) return;
    comboEl.textContent = \`x\${combo}\`;
    comboEl.style.color = combo >= 5 ? '#ff0088' : combo >= 3 ? '#ffe600' : '#00f5ff';
    comboEl.style.textShadow = \`0 0 12px \${comboEl.style.color}\`;
}
updateLivesHUD();

// ── math question generator ────────────────────────────────
function generateQuestion() {
    const ops = ['×', '+', '−', '÷'];
    const op  = choose(ops);
    let a, b, ans;

    if (op === '×') {
        a = randi(2, 13); b = randi(2, 13); ans = a * b;
    } else if (op === '+') {
        a = randi(10, 80); b = randi(10, 80); ans = a + b;
    } else if (op === '−') {
        a = randi(20, 99); b = randi(1, a); ans = a - b;
    } else { // ÷ — guarantee clean division
        b   = randi(2, 12);
        ans = randi(2, 12);
        a   = b * ans;
    }
    return { a, b, op, ans };
}

// produce a wrong answer close to the real one but never equal
function fakeAnswer(ans, idx) {
    const offsets = [randi(1,6), randi(1,6)*-1, randi(7,15)];
    let fake = ans + offsets[idx % offsets.length];
    if (fake === ans) fake += 1;
    if (fake < 0)     fake = ans + Math.abs(offsets[idx % offsets.length]) + 1;
    return fake;
}

// ── kaplay scene ─────────────────────────────────────────
scene("main", () => {
    const W = width(), H = height();
    const laneW = W / LANES;
    const laneX = [laneW*0.5, laneW*1.5, laneW*2.5];
    let currentLane = 1;

    // ── lane dividers (static, drawn once) ───────────────
    for (let i = 1; i < LANES; i++) {
        add([ rect(1, H), pos(laneW * i, 0), color(20, 35, 60), opacity(0.8), z(1) ]);
    }

    // ── star pool ─────────────────────────────────────────
    const starPool  = [];
    const starActive = [];

    function acquireStar() {
        const s = starPool.length ? starPool.pop() : add([
            rect(2, 1), pos(0,0), color(180,200,255), opacity(0.5), z(2),
            { _active: false }
        ]);
        s.pos.x  = rand(0, W);
        s.pos.y  = rand(-20, 0);
        s._len   = rand(10, 35);
        s._speed = rand(0.3, 1.0);   // speed multiplier (varies per star layer)
        s.hidden = false;
        s._active = true;
        starActive.push(s);
    }
    function retireStar(s) {
        if (!s || !s._active) return;  // Already retired
        s.hidden  = true;
        s._active = false;
        const idx = starActive.indexOf(s);
        if (idx !== -1) starActive.splice(idx, 1);
        starPool.push(s);
    }

    // ── gate pool ─────────────────────────────────────────
    const gatePool   = [];
    const gateActive = [];

    function acquireGate(laneIdx, value, isCorrect, op) {
        const g = gatePool.length ? gatePool.pop() : (() => {
            const go = add([
                rect(laneW - 20, GATE_H),
                pos(0, -80), anchor("center"),
                area(),
                color(255,255,255), opacity(0.15),
                z(5), "gate",
                { _isCorrect: false, _value: 0, _alive: false }
            ]);
            go._numLabel = go.add([
                text("", { size: 36 }),
                anchor("center"), pos(0, 0),
                color(255,255,255),
            ]);
            // glow line above gate
            go._glow = go.add([
                rect(laneW - 20, 3), anchor("center"),
                pos(0, -(GATE_H/2 + 1)),
                color(255,255,255), opacity(0.9),
            ]);
            return go;
        })();

        const [cr,cg,cb] = OP_COLORS[op];
        g.pos.x        = laneX[laneIdx];
        g.pos.y        = -60;
        g._isCorrect   = isCorrect;
        g._value       = value;
        g._alive       = true;
        g.hidden       = false;
        g.color        = rgb(cr*0.3, cg*0.3, cb*0.3);
        g.opacity      = isCorrect ? 0.2 : 0.12;
        g._numLabel.text  = value.toString();
        g._numLabel.color = rgb(cr, cg, cb);
        g._glow.color     = rgb(cr, cg, cb);
        g._glow.opacity   = isCorrect ? 0.9 : 0.5;

        gateActive.push(g);
        return g;
    }
    function retireGate(g) {
        if (!g || !g._alive) return;  // Already retired
        g.hidden  = true;
        g._alive  = false;
        if (g._numLabel) g._numLabel.text = "";
        const idx = gateActive.indexOf(g);
        if (idx !== -1) gateActive.splice(idx, 1);
        gatePool.push(g);
    }
    function retireAllGates() {
        // Create a copy to avoid modification during iteration
        const toRetire = [...gateActive];
        toRetire.forEach(g => retireGate(g));
    }

    // ── ship ──────────────────────────────────────────────
    const ship = add([
        text("🚀", { size: 58 }),
        pos(laneX[currentLane], H - 100),
        anchor("center"),
        z(10),
        { _tiltAngle: 0 }
    ]);

    // ghost trail (3 fading copies)
    const ghosts = Array.from({length: 3}, (_, i) =>
        add([ text("🚀", { size: 58 }), pos(laneX[currentLane], H - 100),
              anchor("center"), opacity(0.12 - i * 0.04), z(9) ])
    );
    const ghostHistory = [laneX[1], laneX[1], laneX[1]];

    // ── collision effect pool (small burst rings) ─────────
    const burstPool   = [];
    const burstActive = [];
    function spawnBurst(x, y, col) {
        const b = burstPool.length ? burstPool.pop() : add([
            circle(10), anchor("center"), z(15),
            { _timer: 0, _maxR: 0, _col: [255,255,255] }
        ]);
        if (!b || !b.pos) return;  // Safety check
        b.pos.x  = x; b.pos.y = y;
        b._timer = 0; b._maxR = 50;
        b._col   = col;
        b.hidden = false;
        b.opacity = 1;
        burstActive.push(b);
    }
    function updateBursts(dt) {
        for (let i = burstActive.length - 1; i >= 0; i--) {
            const b = burstActive[i];
            if (!b || !b._col || !b.pos) continue;  // Skip invalid bursts
            b._timer += dt;
            const t = b._timer / 0.4;
            if (b.radius !== undefined) b.radius  = b._maxR * t;
            b.opacity = Math.max(0, 1 - t);
            b.color   = rgb(...b._col);
            if (t >= 1) {
                b.hidden  = true;
                burstActive.splice(i, 1);
                burstPool.push(b);
            }
        }
    }

    // ── question state ────────────────────────────────────
    let correctLane = 0;

    function spawnQuestion() {
        retireAllGates();
        const q = generateQuestion();
        correctAnswer  = q.ans;
        currentOp      = q.op;
        correctLane    = randi(0, LANES);
        questionTimer  = TIME_LIMIT;
        questionActive = true;

        if (eqEl) eqEl.textContent = \`\${q.a} \${q.op} \${q.b}\`;
        if (opEl) {
            opEl.textContent  = OP_NAMES[q.op];
            opEl.style.color  = \`rgb(\${OP_COLORS[q.op].join(',')})\`;
        }

        let usedFakes = 0;
        for (let i = 0; i < LANES; i++) {
            const val = i === correctLane ? q.ans : fakeAnswer(q.ans, usedFakes++);
            acquireGate(i, val, i === correctLane, q.op);
        }
    }

    function onCorrect(gateX, gateY) {
        if (!questionActive) return;  // Guard against multiple triggers
        questionActive = false;
        score += combo;
        combo = Math.min(combo + 1, 10);
        gameSpeed = Math.min(gameSpeed + SPEED_INC * combo, MAX_SPEED);
        if (score > best) { best = score; bestEl.textContent = best; }

        scoreEl.textContent = score;
        updateComboHUD();
        drawSpeedo(gameSpeed);
        screenFlash('rgba(0,245,255,1)', 100);
        if (typeof gateX === 'number' && typeof gateY === 'number') {
            spawnBurst(gateX, gateY, [0, 220, 255]);
        }
        retireAllGates();
        wait(0.4, spawnQuestion);
    }

    function onWrong(gateX, gateY) {
        if (!questionActive) return;  // Guard against multiple triggers
        questionActive = false;
        lives--;
        combo = 1;
        updateLivesHUD();
        updateComboHUD();
        showReveal(\`ANSWER WAS \${correctAnswer}\`);
        screenFlash('rgba(255,0,80,1)', 180);
        shake(15);
        if (typeof gateX === 'number' && typeof gateY === 'number') {
            spawnBurst(gateX, gateY, [255, 0, 88]);
        }
        retireAllGates();

        if (lives <= 0) {
            wait(0.8, () => go("gameover"));
            return;
        }
        wait(0.7, spawnQuestion);
    }

    function onTimeout() {
        if (!questionActive) return;  // Guard against double-trigger
        questionActive = false;
        lives--;
        combo = 1;
        updateLivesHUD();
        updateComboHUD();
        showReveal(\`TIME UP · ANSWER WAS \${correctAnswer}\`);
        screenFlash('rgba(255,180,0,1)', 200);
        shake(10);
        retireAllGates();
        if (lives <= 0) { wait(0.8, () => go("gameover")); return; }
        wait(0.6, spawnQuestion);
    }

    // ── input ─────────────────────────────────────────────
    onKeyPress("left", () => {
        if (ship && ship.pos && currentLane > 0) {
            currentLane--;
            tween(ship.pos.x, laneX[currentLane], 0.12,
                  (v) => ship.pos.x = v, easings.easeOutQuad);
            ship._tiltAngle = -18;
        }
    });
    onKeyPress("right", () => {
        if (ship && ship.pos && currentLane < LANES - 1) {
            currentLane++;
            tween(ship.pos.x, laneX[currentLane], 0.12,
                  (v) => ship.pos.x = v, easings.easeOutQuad);
            ship._tiltAngle = 18;
        }
    });

    // ── star spawn timer ──────────────────────────────────
    let starSpawnTimer = 0;

    // ── main update ───────────────────────────────────────
    onUpdate(() => {
        const dt_ = dt();

        // --- stars ---
        starSpawnTimer += dt_;
        if (starSpawnTimer >= STAR_RATE && starActive.length < MAX_STARS) {
            acquireStar();
            starSpawnTimer = 0;
        }
        const starSpeed = gameSpeed * 0.9;
        for (let i = starActive.length - 1; i >= 0; i--) {
            const s = starActive[i];
            if (!s || !s._active || !s.pos) continue;  // Skip dead stars or invalid ones
            s.pos.y += starSpeed * s._speed * dt_;
            s.height = s._len * s._speed;   // stretch at speed
            if (s.pos.y > H + 50) retireStar(s);
        }

        // --- question timer ---
        if (questionActive) {
            questionTimer -= dt_;
            const frac = Math.max(0, questionTimer / TIME_LIMIT);
            if (timerBar) {
                timerBar.style.width = (frac * 100) + '%';
                timerBar.style.background =
                    frac > 0.5 ? 'var(--cyan)' :
                    frac > 0.25 ? 'var(--yellow)' : 'var(--magenta)';
                timerBar.style.boxShadow = \`0 0 8px \${frac > 0.5 ? 'var(--cyan)' : frac > 0.25 ? 'var(--yellow)' : 'var(--magenta)'}\`;
            }

            if (questionTimer <= 0) onTimeout();
        }

        // --- gates ---
        const gSpeed = gameSpeed * dt_;
        for (let i = gateActive.length - 1; i >= 0; i--) {
            const g = gateActive[i];
            if (!g || !g._alive || !g.pos) continue;  // Skip dead gates or invalid ones
            
            g.pos.y += gSpeed;

            // collision: check proximity to ship instead of Kaplay area
            if (questionActive && ship && ship.pos) {  // Only check collision if active and ship exists
                const dx = Math.abs(g.pos.x - ship.pos.x);
                const dy = Math.abs(g.pos.y - ship.pos.y);
                if (dx < laneW * 0.45 && dy < 40) {
                    if (g._isCorrect) onCorrect(g.pos.x, g.pos.y);
                    else              onWrong(g.pos.x, g.pos.y);
                    continue;  // Skip further processing for this gate
                }
            }
            
            if (g.pos.y > H + 80) retireGate(g);
        }

        // --- ship tilt recovery ---
        if (ship) {
            ship._tiltAngle *= 0.82;
            ship.angle = ship._tiltAngle;
        }

        // --- ghost trail ---
        if (ship && ship.pos) {
            ghostHistory.unshift(ship.pos.x);
            ghostHistory.length = ghosts.length + 1;
            ghosts.forEach((gh, i) => {
                if (gh && gh.pos) {
                    gh.pos.x = ghostHistory[i + 1] || ship.pos.x;
                    gh.pos.y = ship.pos.y + (i + 1) * 18;
                    gh.angle = ship._tiltAngle * (1 - i * 0.3);
                }
            });
        }

        // --- bursts ---
        updateBursts(dt_);
    });

    // kick off
    wait(0.5, spawnQuestion);
});

// ── game over scene ────────────────────────────────────────
scene("gameover", () => {
    const W = width(), H = height();
    add([ rect(W, H), pos(0, 0), color(4, 6, 15), opacity(1) ]);

    add([ text("GAME OVER", { size: 72, font: "monospace" }),
          pos(W/2, H/2 - 80), anchor("center"),
          color(255, 0, 88),
          opacity(1) ]);

    add([ text(\`SECTORS: \${score}   BEST: \${best}\`, { size: 28, font: "monospace" }),
          pos(W/2, H/2), anchor("center"), color(0, 245, 255) ]);

    add([ text("PRESS SPACE TO RETRY", { size: 22, font: "monospace" }),
          pos(W/2, H/2 + 60), anchor("center"), color(100, 130, 160) ]);

    onKeyPress("space", () => {
        score = 0; combo = 1; lives = MAX_LIVES; gameSpeed = BASE_SPEED;
        questionTimer = TIME_LIMIT; questionActive = false;
        if (scoreEl) scoreEl.textContent = "0";
        updateComboHUD(); updateLivesHUD(); drawSpeedo(BASE_SPEED);
        if (timerBar) timerBar.style.width = "100%";
        go("main");
    });
});

go("main");
<\/script>
<\/body>
<\/html>
  `
};
