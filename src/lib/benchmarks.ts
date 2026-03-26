export const benchmarkGames = {
  projectile: {
    title: "Siege of the Quantum Castle",
    blueprint: "BENCHMARK: Projectile Motion Simulator using Kaplay.js. Features CSS Grid split layout, interactive physics controls, and an educational overlay.",
    code: `
        <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Projectile Benchmark</title>
        <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
        <style>
            :root { --neon: #00ff9d; --bg: #050505; --panel: #111; }
            body { margin: 0; display: flex; height: 100vh; font-family: 'Courier New', Courier, monospace; background: var(--bg); color: white; overflow: hidden; }
            #console { width: 350px; background: var(--panel); border-right: 2px solid var(--neon); padding: 20px; display: flex; flex-direction: column; gap: 20px; z-index: 10; box-shadow: 5px 0 15px rgba(0,255,157,0.1); }
            #viewport { flex-grow: 1; position: relative; background: radial-gradient(circle at center, #1a1a2e 0%, #000 100%); }
            h2 { margin: 0; color: var(--neon); text-transform: uppercase; font-size: 1.2rem; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .control-group { display: flex; flex-direction: column; gap: 5px; }
            label { font-size: 0.8rem; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
            input[type=range] { accent-color: var(--neon); width: 100%; cursor: pointer; }
            .val-display { color: var(--neon); font-weight: bold; font-size: 1.2rem; }
            button { background: var(--neon); color: black; border: none; padding: 15px; font-weight: bold; font-size: 1.1rem; text-transform: uppercase; cursor: pointer; transition: 0.2s; clip-path: polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%); }
            button:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(0,255,157,0.4); }
            .guide { margin-top: auto; background: #000; border: 1px solid #333; padding: 15px; font-size: 0.8rem; line-height: 1.5; color: #888; }
            .guide span { color: var(--neon); }
            #stats { position: absolute; top: 20px; right: 20px; font-size: 1.5rem; font-weight: bold; color: var(--neon); text-shadow: 0 0 10px var(--neon); z-index: 10; }
        </style>
    </head>
    <body>

        <div id="console">
            <h2>Quantum Siege Ops</h2>
            
            <div class="control-group">
                <label>Trebuchet Angle (θ)</label>
                <input type="range" id="angle" min="0" max="90" value="45">
                <div class="val-display"><span id="angleVal">45</span>°</div>
            </div>

            <div class="control-group">
                <label>Thruster Power (v₀)</label>
                <input type="range" id="power" min="500" max="2500" value="1500" step="50">
                <div class="val-display"><span id="powerVal">1500</span> m/s</div>
            </div>

            <button id="fireBtn">🚀 INITIALIZE LAUNCH</button>

            <div class="guide">
                <strong>📖 FIELD MANUAL:</strong><br><br>
                Calculate your trajectory to destroy the incoming Gravity Goblins.<br><br>
                <span>v₀x = v₀ * cos(θ)</span><br>
                <span>v₀y = v₀ * sin(θ)</span><br><br>
                Gravity pulls at 2400 pixels/sec². High angles yield hang-time, low angles yield distance.
            </div>
        </div>

        <div id="viewport">
            <div id="stats">TARGETS DESTROYED: <span id="score">0</span></div>
        </div>

        <script>
            kaplay({ global: true, root: document.getElementById('viewport'), background: [0, 0, 0, 0] });
            setGravity(2400);

            let score = 0;

            scene("main", () => {
                // 1. The Trebuchet Base (Castle)
                add([
                    text("🏰", { size: 64 }),
                    pos(40, height() - 100),
                    anchor("botleft")
                ]);

                // 2. The Animated Mechanical Arm
                const arm = add([
                    rect(70, 8, { radius: 4 }),
                    color(139, 69, 19), // Brown color
                    pos(85, height() - 130), // Pivot point on the castle
                    anchor("left"),
                    rotate(-45) // Starting angle
                ]);

                // Update UI & Arm Angle Dynamically
                const angleSlider = document.getElementById('angle');
                const powerSlider = document.getElementById('power');
                
                angleSlider.oninput = (e) => {
                    document.getElementById('angleVal').innerText = e.target.value;
                    arm.angle = -e.target.value; // Negative because canvas rotation is clockwise
                };
                
                powerSlider.oninput = (e) => {
                    document.getElementById('powerVal').innerText = e.target.value;
                };

                function spawnTarget() {
                    const targetX = rand(width() / 2, width() - 100);
                    const targetY = rand(100, height() - 200);
                    
                    add([
                        text("👾", { size: 48 }),
                        pos(targetX, targetY),
                        area(),
                        anchor("center"),
                        "target",
                        { dir: choose([-1, 1]) } 
                    ]);
                }

                spawnTarget();

                document.getElementById('fireBtn').onclick = () => {
                    const angle = angleSlider.value;
                    const power = powerSlider.value;
                    
                    // Animate the Trebuchet Throw (Swing forward, bounce back)
                    const startAngle = arm.angle;
                    tween(startAngle, startAngle - 40, 0.1, (val) => arm.angle = val, easings.easeOutQuad).onEnd(() => {
                        tween(arm.angle, startAngle, 0.4, (val) => arm.angle = val, easings.easeOutBounce);
                    });
                    
                    // Math
                    const rad = angle * (Math.PI / 180);
                    const vx = power * Math.cos(rad);
                    const vy = -power * Math.sin(rad); 

                    // Spawn Projectile at the tip of the arm
                    const projectile = add([
                        text("☄️", { size: 32 }),
                        pos(85 + Math.cos(rad) * 70, height() - 130 - Math.sin(rad) * 70),
                        area(),
                        body(),
                        anchor("center"),
                        "projectile"
                    ]);

                    projectile.jump(0); 
                    projectile.vel = vec2(vx, vy);

                    projectile.onUpdate(() => {
                        if (projectile.pos.y > height() + 100 || projectile.pos.x > width() + 100) destroy(projectile);
                    });
                };

                onCollide("projectile", "target", (p, t) => {
                    destroy(p);
                    destroy(t);
                    score++;
                    document.getElementById('score').innerText = score;
                    confetti({ particleCount: 100, spread: 70, origin: { x: t.pos.x / width(), y: t.pos.y / height() }, colors: ['#00ff9d', '#ffffff'] });
                    wait(0.5, spawnTarget);
                });
            });

            go("main");
        </script>
    </body>
    </html>`
  },
  chem: {
    title: "Orbital Isotope Stabilizer",
    blueprint: "BENCHMARK: Chemical Balancing Simulator using Kaplay.js. Features dynamic DOM input generation for equations, orbital math animations, and camera shake on failure.",
    code: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chemistry Benchmark</title>
        <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
        <style>
            :root { --neon: #00ff9d; --danger: #ff3333; --bg: #050505; --panel: #111; }
            body { margin: 0; display: flex; height: 100vh; font-family: 'Courier New', Courier, monospace; background: var(--bg); color: white; overflow: hidden; }
            #console { width: 350px; background: var(--panel); border-right: 2px solid var(--neon); padding: 20px; display: flex; flex-direction: column; gap: 20px; z-index: 10; box-shadow: 5px 0 15px rgba(0,255,157,0.1); }
            #viewport { flex-grow: 1; position: relative; background: radial-gradient(circle at center, #1a0a0a 0%, #000 100%); transition: background 0.5s; }
            h2 { margin: 0; color: var(--neon); text-transform: uppercase; font-size: 1.2rem; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .equation-container { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: bold; background: #000; padding: 15px; border: 1px solid #333; }
            .molecule { display: flex; align-items: center; gap: 5px; }
            input[type=number] { width: 50px; background: #222; border: 1px solid var(--neon); color: var(--neon); font-family: monospace; font-size: 1.2rem; text-align: center; padding: 5px; outline: none; }
            input[type=number]:focus { box-shadow: 0 0 10px rgba(0,255,157,0.3); }
            .arrow { color: #888; padding: 0 5px; }
            button { background: var(--neon); color: black; border: none; padding: 15px; font-weight: bold; font-size: 1.1rem; text-transform: uppercase; cursor: pointer; transition: 0.2s; clip-path: polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%); }
            button:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(0,255,157,0.4); }
            .guide { margin-top: auto; background: #000; border: 1px solid #333; padding: 15px; font-size: 0.8rem; line-height: 1.5; color: #888; }
            .guide span { color: var(--neon); }
            #stats { position: absolute; top: 20px; right: 20px; font-size: 1.5rem; font-weight: bold; color: var(--neon); text-shadow: 0 0 10px var(--neon); z-index: 10; }
            #feedback { color: var(--danger); font-weight: bold; text-align: center; min-height: 20px; }
        </style>
    </head>
    <body>

        <div id="console">
            <h2>Orbital Core Stabilizer</h2>
            
            <div class="guide" style="margin-top: 0; margin-bottom: 10px;">
                <strong>MISSION:</strong> The planetary core is degrading. Synthesize the exact isotopic ratio to halt the reaction.
            </div>

            <div id="equation-display" class="equation-container">
                </div>
            
            <div id="feedback"></div>

            <button id="injectBtn">☢️ INJECT PAYLOAD</button>
        </div>

        <div id="viewport">
            <div id="stats">CORES SAVED: <span id="score">0</span></div>
        </div>

        <script>
            // --- DATASET ---
            const anomalies = [
                { left: ["H₂", "O₂"], right: ["H₂O"], ans: [2, 1, 2] }, // Water
                { left: ["N₂", "H₂"], right: ["NH₃"], ans: [1, 3, 2] }, // Ammonia
                { left: ["CH₄", "O₂"], right: ["CO₂", "H₂O"], ans: [1, 2, 1, 2] }, // Methane Combustion
                { left: ["Fe", "O₂"], right: ["Fe₂O₃"], ans: [4, 3, 2] }, // Iron Rusting
                { left: ["K", "Cl₂"], right: ["KCl"], ans: [2, 1, 2] } // Potassium Chloride
            ];
            
            let currentLevel = 0;
            let score = 0;
            let isAnimating = false;

            // --- UI LOGIC ---
            function loadEquation() {
                const data = anomalies[currentLevel];
                const container = document.getElementById('equation-display');
                container.innerHTML = ''; // Clear
                
                // Build Left Side (Reactants)
                data.left.forEach((mol, idx) => {
                    container.innerHTML += \`<div class="molecule"><input type="number" min="1" max="9" value="1" id="coeff-\${idx}"><span>\${mol}</span></div>\`;
                    if (idx < data.left.length - 1) container.innerHTML += \`<span class="arrow">+</span>\`;
                });
                
                container.innerHTML += \`<span class="arrow">→</span>\`;
                
                // Build Right Side (Products)
                const offset = data.left.length;
                data.right.forEach((mol, idx) => {
                    container.innerHTML += \`<div class="molecule"><input type="number" min="1" max="9" value="1" id="coeff-\${offset + idx}"><span>\${mol}</span></div>\`;
                    if (idx < data.right.length - 1) container.innerHTML += \`<span class="arrow">+</span>\`;
                });
                
                document.getElementById('feedback').innerText = "";
            }

            // --- ENGINE LOGIC ---
            kaplay({ global: true, root: document.getElementById('viewport'), background: [0, 0, 0, 0] });

            scene("main", () => {
                const centerX = width() / 2;
                const centerY = height() / 2;

                // The Dying Planet
                const planet = add([
                    text("🪐", { size: 120 }),
                    pos(centerX, centerY),
                    anchor("center"),
                    scale(1),
                    area(),
                    "planet"
                ]);

                // Unstable Orbiting Anomalies
                const orbiters = [];
                for(let i=0; i<3; i++) {
                    orbiters.push(add([
                        text("⚠️", { size: 30 }),
                        pos(centerX, centerY),
                        anchor("center"),
                        { angle: (Math.PI * 2 / 3) * i, speed: 2, distance: 120 }
                    ]));
                }

                // Orbital Math Animation
                onUpdate(() => {
                    // Pulse the planet
                    planet.scale = vec2(1 + Math.sin(time() * 5) * 0.05);
                    
                    // Spin the warnings
                    orbiters.forEach(orb => {
                        orb.angle += dt() * orb.speed;
                        orb.pos.x = centerX + Math.cos(orb.angle) * orb.distance;
                        orb.pos.y = centerY + Math.sin(orb.angle) * orb.distance;
                    });
                });

                // Validation Logic
                document.getElementById('injectBtn').onclick = () => {
                    if(isAnimating) return;
                    
                    const data = anomalies[currentLevel];
                    let isCorrect = true;
                    
                    // Check all inputs
                    for(let i=0; i < data.ans.length; i++) {
                        const val = parseInt(document.getElementById(\`coeff-\${i}\`).value);
                        if(val !== data.ans[i]) isCorrect = false;
                    }

                    if(isCorrect) {
                        isAnimating = true;
                        document.getElementById('feedback').innerText = "CALCULATIONS CORRECT. FIRING PAYLOAD.";
                        document.getElementById('feedback').style.color = "var(--neon)";
                        
                        // The "Stealth Learning" Visual Reward
                        const ship = add([
                            text("🚀", { size: 60 }),
                            pos(-100, centerY),
                            anchor("center"),
                            area()
                        ]);

                        // Tween ship to planet
                        tween(ship.pos.x, centerX, 1, (val) => ship.pos.x = val, easings.easeInQuad).onEnd(() => {
                            destroy(ship);
                            
                            // Stabilize Planet
                            planet.text = "🌍";
                            orbiters.forEach(o => destroy(o));
                            document.getElementById('viewport').style.background = "radial-gradient(circle at center, #0a1a1a 0%, #000 100%)";
                            
                            // Confetti & Score
                            confetti({ particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.5 }, colors: ['#00ff9d', '#00aaff', '#ffffff'] });
                            score++;
                            document.getElementById('score').innerText = score;
                            
                            // Load next level
                            wait(2, () => {
                                currentLevel = (currentLevel + 1) % anomalies.length;
                                loadEquation();
                                go("main"); // Reset scene
                                isAnimating = false;
                                document.getElementById('viewport').style.background = "radial-gradient(circle at center, #1a0a0a 0%, #000 100%)";
                            });
                        });

                    } else {
                        // Failure State
                        document.getElementById('feedback').innerText = "INCORRECT RATIO! CRITICAL INSTABILITY!";
                        document.getElementById('feedback').style.color = "var(--danger)";
                        shake(20); // Kaplay built-in screen shake
                    }
                };
            });

            // Start
            loadEquation();
            go("main");
        </script>
    </body>
    </html>`
  }
};