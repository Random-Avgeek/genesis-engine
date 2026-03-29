import { racerBenchmark } from './benchmarks.racer';

export const benchmarkGames = {
  projectile: {
    title: "Siege of the Quantum Castle",
    blueprint: "BENCHMARK: Projectile Motion Simulator using Kaplay.js. Features CSS Grid split layout, interactive physics controls, and an educational overlay.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projectile Benchmark</title>
    <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"><\/script>
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
            <strong>📖 FIELD MANUAL:<\/strong><br><br>
            Calculate your trajectory to destroy the incoming Gravity Goblins.<br><br>
            <span>v₀x = v₀ * cos(θ)<\/span><br>
            <span>v₀y = v₀ * sin(θ)<\/span><br><br>
            Gravity pulls at 2400 pixels/sec². High angles yield hang-time, low angles yield distance.
        </div>
    </div>

    <div id="viewport">
        <div id="stats">TARGETS DESTROYED: <span id="score">0<\/span><\/div>
    </div>

    <script>
        kaplay({ global: true, root: document.getElementById('viewport'), background: [0, 0, 0, 0] });
        setGravity(2400);

        let score = 0;

        scene("main", () => {
            add([
                text("🏰", { size: 64 }),
                pos(40, height() - 100),
                anchor("botleft")
            ]);

            const arm = add([
                rect(70, 8, { radius: 4 }),
                color(139, 69, 19), 
                pos(85, height() - 130), 
                anchor("left"),
                rotate(-45)
            ]);

            const angleSlider = document.getElementById('angle');
            const powerSlider = document.getElementById('power');
            
            angleSlider.oninput = (e) => {
                document.getElementById('angleVal').innerText = e.target.value;
                arm.angle = -e.target.value;
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
                
                const startAngle = arm.angle;
                tween(startAngle, startAngle - 40, 0.1, (val) => arm.angle = val, easings.easeOutQuad).onEnd(() => {
                    tween(arm.angle, startAngle, 0.4, (val) => arm.angle = val, easings.easeOutBounce);
                });
                
                const rad = angle * (Math.PI / 180);
                const vx = power * Math.cos(rad);
                const vy = -power * Math.sin(rad); 

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
    <\/script>
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
    <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"><\/script>
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
            <strong>MISSION:<\/strong> The planetary core is degrading. Synthesize the exact isotopic ratio.
        </div>

        <div id="equation-display" class="equation-container">
        <\/div>
        
        <div id="feedback"><\/div>

        <button id="injectBtn">☢️ INJECT PAYLOAD<\/button>
    </div>

    <div id="viewport">
        <div id="stats">CORES SAVED: <span id="score">0<\/span><\/div>
    </div>

    <script>
        const anomalies = [
            { left: ["H₂", "O₂"], right: ["H₂O"], ans: [2, 1, 2] },
            { left: ["N₂", "H₂"], right: ["NH₃"], ans: [1, 3, 2] },
            { left: ["CH₄", "O₂"], right: ["CO₂", "H₂O"], ans: [1, 2, 1, 2] },
            { left: ["Fe", "O₂"], right: ["Fe₂O₃"], ans: [4, 3, 2] },
            { left: ["K", "Cl₂"], right: ["KCl"], ans: [2, 1, 2] }
        ];
        
        let currentLevel = 0;
        let score = 0;
        let isAnimating = false;

        function loadEquation() {
            const data = anomalies[currentLevel];
            const container = document.getElementById('equation-display');
            container.innerHTML = '';
            
            data.left.forEach((mol, idx) => {
                container.innerHTML += '<div class="molecule"><input type="number" min="1" max="9" value="1" id="coeff-' + idx + '"><span>' + mol + '<\/span><\/div>';
                if (idx < data.left.length - 1) container.innerHTML += '<span class="arrow">+<\/span>';
            });
            
            container.innerHTML += '<span class="arrow">→<\/span>';
            
            const offset = data.left.length;
            data.right.forEach((mol, idx) => {
                container.innerHTML += '<div class="molecule"><input type="number" min="1" max="9" value="1" id="coeff-' + (offset + idx) + '"><span>' + mol + '<\/span><\/div>';
                if (idx < data.right.length - 1) container.innerHTML += '<span class="arrow">+<\/span>';
            });
            
            document.getElementById('feedback').innerText = "";
        }

        kaplay({ global: true, root: document.getElementById('viewport'), background: [0, 0, 0, 0] });

        scene("main", () => {
            const centerX = width() / 2;
            const centerY = height() / 2;

            const planet = add([
                text("🪐", { size: 120 }),
                pos(centerX, centerY),
                anchor("center"),
                scale(1),
                area(),
                "planet"
            ]);

            const orbiters = [];
            for(let i=0; i<3; i++) {
                orbiters.push(add([
                    text("⚠️", { size: 30 }),
                    pos(centerX, centerY),
                    anchor("center"),
                    { angle: (Math.PI * 2 / 3) * i, speed: 2, distance: 120 }
                ]));
            }

            onUpdate(() => {
                planet.scale = vec2(1 + Math.sin(time() * 5) * 0.05);
                
                orbiters.forEach(orb => {
                    orb.angle += dt() * orb.speed;
                    orb.pos.x = centerX + Math.cos(orb.angle) * orb.distance;
                    orb.pos.y = centerY + Math.sin(orb.angle) * orb.distance;
                });
            });

            document.getElementById('injectBtn').onclick = () => {
                if(isAnimating) return;
                
                const data = anomalies[currentLevel];
                let isCorrect = true;
                
                for(let i=0; i < data.ans.length; i++) {
                    const val = parseInt(document.getElementById('coeff-' + i).value);
                    if(val !== data.ans[i]) isCorrect = false;
                }

                if(isCorrect) {
                    isAnimating = true;
                    document.getElementById('feedback').innerText = "CALCULATIONS CORRECT. FIRING PAYLOAD.";
                    document.getElementById('feedback').style.color = "var(--neon)";
                    
                    const ship = add([
                        text("🚀", { size: 60 }),
                        pos(-100, centerY),
                        anchor("center"),
                        area()
                    ]);

                    tween(ship.pos.x, centerX, 1, (val) => ship.pos.x = val, easings.easeInQuad).onEnd(() => {
                        destroy(ship);
                        
                        planet.text = "🌍";
                        orbiters.forEach(o => destroy(o));
                        document.getElementById('viewport').style.background = "radial-gradient(circle at center, #0a1a1a 0%, #000 100%)";
                        
                        confetti({ particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.5 }, colors: ['#00ff9d', '#00aaff', '#ffffff'] });
                        score++;
                        document.getElementById('score').innerText = score;
                        
                        wait(2, () => {
                            currentLevel = (currentLevel + 1) % anomalies.length;
                            loadEquation();
                            go("main");
                            isAnimating = false;
                            document.getElementById('viewport').style.background = "radial-gradient(circle at center, #1a0a0a 0%, #000 100%)";
                        });
                    });

                } else {
                    document.getElementById('feedback').innerText = "INCORRECT RATIO! CRITICAL INSTABILITY!";
                    document.getElementById('feedback').style.color = "var(--danger)";
                    shake(20);
                }
            };
        });

        loadEquation();
        go("main");
    <\/script>
</body>
</html>`
  },
  coder: {
    title: "Syntax Sentinel: Mainframe",
    blueprint: "BENCHMARK: Code Syntax Debugger. Features a stable Kaplay.js canvas with an active 'Digital Rain' background animation, and a lightweight floating HUD for dynamic ranking.",
    code: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coder Benchmark</title>
        <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
        <style>
            :root { --neon: #00ff9d; --danger: #ff3333; --bg: #050505; --panel: #111; --blue: #00e5ff; }
            body { margin: 0; display: flex; height: 100vh; font-family: 'Courier New', Courier, monospace; background: var(--bg); color: white; overflow: hidden; }
            
            /* LEFT CONSOLE */
            #console { width: 450px; background: var(--panel); border-right: 2px solid var(--neon); padding: 20px; display: flex; flex-direction: column; gap: 15px; z-index: 10; box-shadow: 5px 0 15px rgba(0,255,157,0.1); }
            h2 { margin: 0; color: var(--neon); text-transform: uppercase; font-size: 1.2rem; border-bottom: 1px solid #333; padding-bottom: 10px; }
            .nav-row { display: flex; gap: 10px; justify-content: space-between; }
            select { background: #222; color: var(--neon); border: 1px solid var(--neon); padding: 8px; font-family: monospace; outline: none; width: 48%; cursor: pointer; }
            #editor-container { flex-grow: 1; display: flex; flex-direction: column; border: 1px solid #333; background: #000; position: relative; }
            .editor-header { background: #222; padding: 5px 10px; font-size: 0.8rem; color: #888; border-bottom: 1px solid #333; }
            textarea { flex-grow: 1; background: transparent; border: none; color: #fff; font-family: 'Courier New', monospace; font-size: 1rem; padding: 15px; resize: none; outline: none; line-height: 1.5; }
            button { background: var(--neon); color: black; border: none; padding: 15px; font-weight: bold; font-size: 1.1rem; text-transform: uppercase; cursor: pointer; transition: 0.2s; clip-path: polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%); }
            button:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(0,255,157,0.4); }
            #feedback { color: var(--danger); font-weight: bold; min-height: 40px; font-size: 0.9rem; }
            
            /* RIGHT VIEWPORT & SIMPLE HUD */
            #viewport { flex-grow: 1; position: relative; background: #020202; overflow: hidden; }
            
            #hud { position: absolute; top: 20px; right: 20px; z-index: 10; text-align: right; background: rgba(0,0,0,0.8); padding: 15px 20px; border: 1px solid #333; border-right: 3px solid var(--blue); border-radius: 4px; pointer-events: none; backdrop-filter: blur(4px); }
            .hud-line { font-size: 1.2rem; font-weight: bold; color: #aaa; margin-bottom: 5px; }
            .hud-line span { color: var(--neon); }
            .hud-rank { font-size: 1.4rem; color: var(--blue); text-shadow: 0 0 10px rgba(0,229,255,0.3); margin-top: 10px; letter-spacing: 1px; text-transform: uppercase; }
            .blink { animation: blinker 1s step-start infinite; }
            @keyframes blinker { 50% { opacity: 0; } }
        </style>
    </head>
    <body>

        <div id="console">
            <h2>Syntax Sentinel Core</h2>
            
            <div class="nav-row">
                <select id="lang-select">
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                </select>
                <select id="level-select"></select>
            </div>

            <div id="editor-container">
                <div class="editor-header">root@mainframe:~/fix_code.sh</div>
                <textarea id="code-editor" spellcheck="false"></textarea>
            </div>
            
            <div id="feedback">SYSTEM READY. WAITING FOR COMPILE.</div>

            <button id="compileBtn">⚙️ COMPILE & OVERRIDE</button>
        </div>

        <div id="viewport">
            <div id="hud">
                <div class="hud-line">NODES RESTORED: <span id="score">0</span>/30</div>
                <div class="hud-rank">>_ <span id="rank-display">UNTESTED</span><span class="blink">_</span></div>
            </div>
        </div>

        <script>
            const levelSelect = document.getElementById('level-select');
            for(let i=0; i<10; i++) {
                levelSelect.innerHTML += \`<option value="\${i}">Node \${i+1 < 10 ? '0'+(i+1) : (i+1)}: \${i < 7 ? 'Syntax' : 'Algorithm'}</option>\`;
            }

            const puzzles = {
                python: [
                    { broken: "print(Hello World)", target: 'print("HelloWorld")', alt: "print('HelloWorld')", hint: "Strings require quotes." },
                    { broken: "if True\\n  print('Active')", target: "ifTrue:print('Active')", alt: 'ifTrue:print("Active")', hint: "Missing colon." },
                    { broken: "def boot()\\n  print('Up')", target: "defboot():print", hint: "Function definitions need a colon." },
                    { broken: "items = [1, 2, 3", target: "items=[1,2,3]", hint: "Unclosed bracket." },
                    { broken: "for i in range(5)\\n  pass", target: "foriinrange(5):pass", hint: "Loops need colons." },
                    { broken: "while True\\n  break", target: "whileTrue:break", hint: "While loops need colons." },
                    { broken: "status == 'Offline'", target: "status='Offline'", alt: 'status="Offline"', hint: "Use single '=' for assignment." },
                    { broken: "def calc(items)\\n  total = 0\\n  for i in items\\n    total += i\\n  return total", target: "defcalc(items):total=0foriinitems:total+=ireturntotal", hint: "Multiple colons are missing." },
                    { broken: "class Node\\n  def __init__(self)\\n    self.id = 1", target: "classNode:def__init__(self):self.id=1", hint: "Classes and functions require colons." },
                    { broken: "try:\\n  boot()\\nexcept Exception\\n  log()", target: "try:boot()exceptException:log()", hint: "The except block requires a colon." }
                ],
                cpp: [
                    { broken: "int x = 5", target: "intx=5;", hint: "Missing semicolon." },
                    { broken: 'std::cout << "Hi"', target: 'std::cout<<"Hi";', hint: "Missing semicolon." },
                    { broken: "if (x == 1)\\n  return 0", target: "if(x==1)return0;", hint: "Missing semicolon." },
                    { broken: "for(int i=0 i<5; i++)", target: "for(inti=0;i<5;i++)", hint: "For-loop parameters need semicolons." },
                    { broken: "#include <iostream", target: "#include<iostream>", hint: "Missing closing bracket >" },
                    { broken: "void run()\\n  int a = 1;", target: "voidrun(){inta=1;}", hint: "Functions require curly braces {}" },
                    { broken: "class Server { int id; }", target: "classServer{intid;};", hint: "Classes require a semicolon at the very end." },
                    { broken: "int compute(int a) {\\n  if(a > 0) return a\\n  return 0\\n}", target: "if(a>0)returna;return0;}", hint: "Multiple semicolons missing." },
                    { broken: "std::vector<int> v;\\nv.push_back(1)\\nv.push_back(2)", target: "v.push_back(1);v.push_back(2);", hint: "Method calls require semicolons." },
                    { broken: 'int main() {\\n  std::string msg = "Ready"\\n  std::cout << msg << std::endl\\n  return 0\\n}', target: 'std::stringmsg="Ready";std::cout<<msg<<std::endl;return0;', hint: "Every statement inside main needs a semicolon." }
                ],
                java: [
                    { broken: 'System.out.println("Hi")', target: 'System.out.println("Hi");', hint: "Missing semicolon." },
                    { broken: "int[] arr = {1, 2, 3", target: "int[]arr={1,2,3};", hint: "Missing closing brace and semicolon." },
                    { broken: "public class Main {", target: "publicclassMain{}", hint: "Missing closing curly brace." },
                    { broken: "String s = Hello;", target: 'Strings="Hello";', hint: "Strings must be wrapped in double quotes." },
                    { broken: "for(int i=0; i<5 i++)", target: "for(inti=0;i<5;i++)", hint: "Missing semicolon in for-loop." },
                    { broken: "if(true)\\n  return", target: "if(true)return;", hint: "Missing semicolon." },
                    { broken: "public void start()\\n  int x = 1;", target: "publicvoidstart(){intx=1;}", hint: "Methods require curly braces." },
                    { broken: "public int getId() {\\n  return this.id\\n}", target: "returnthis.id;}", hint: "Missing semicolon." },
                    { broken: "try {\\n  run();\\n} catch(Exception e)\\n  print(e);\\n}", target: "}catch(Exceptione){print(e);}", hint: "Catch blocks require curly braces." },
                    { broken: 'public static void main(String args) {\\n  System.out.println("Boot");\\n}', target: "publicstaticvoidmain(String[]args)", hint: "The main method requires a String array (String[])." }
                ]
            };

            let currentLang = 'python';
            let currentLevel = 0;
            let nodeState = "broken"; 
            const solved = { python: new Set(), cpp: new Set(), java: new Set() };

            const editor = document.getElementById('code-editor');
            const feedback = document.getElementById('feedback');
            const langSelect = document.getElementById('lang-select');
            const rankDisplay = document.getElementById('rank-display');

            function updateRank() {
                const p = solved.python.size;
                const c = solved.cpp.size;
                const j = solved.java.size;
                const total = p + c + j;
                
                document.getElementById('score').innerText = total;

                if (total === 0) return;

                if (p === 10 && c === 10 && j === 10) return rankDisplay.innerText = "SYNTAX GOD";
                if (p >= 7 && c >= 7 && j >= 7) return rankDisplay.innerText = "JACK OF ALL TRADES";

                let max = Math.max(p, c, j);
                let mains = [];
                if (p === max) mains.push("PYTHON");
                if (c === max) mains.push("C++");
                if (j === max) mains.push("JAVA");

                if (mains.length === 3) return rankDisplay.innerText = "BALANCED LEARNER";

                if (mains.length === 2) {
                    if (p === max && j === max) return rankDisplay.innerText = "PYTHO-JAVA CODER";
                    if (p === max && c === max) return rankDisplay.innerText = "C-SNAKE WRANGLER";
                    if (c === max && j === max) return rankDisplay.innerText = "C-JAVA ARCHITECT";
                }

                let lang = mains[0];
                if (max <= 3) return rankDisplay.innerText = \`BEGINNING \${lang}\`;
                if (max <= 7) return rankDisplay.innerText = \`INTERMEDIATE \${lang}\`;
                return rankDisplay.innerText = \`ADVANCED \${lang}\`;
            }

            function loadPuzzle() {
                currentLang = langSelect.value;
                currentLevel = parseInt(levelSelect.value);
                editor.value = puzzles[currentLang][currentLevel].broken;
                
                if (solved[currentLang].has(currentLevel)) {
                    nodeState = "fixed";
                    feedback.innerText = "NODE ALREADY SECURED.";
                    feedback.style.color = "var(--neon)";
                } else {
                    feedback.innerText = "WARNING: SYNTAX ANOMALY DETECTED.";
                    feedback.style.color = "var(--neon)";
                    nodeState = "broken";
                }
            }

            langSelect.addEventListener('change', loadPuzzle);
            levelSelect.addEventListener('change', loadPuzzle);

            // Safe Kaplay Initialization
            kaplay({ global: true, root: document.getElementById('viewport'), background: [0, 0, 0, 0] });

            scene("main", () => {
                const centerX = width() / 2;
                const centerY = height() / 2;

                // DIGITAL RAIN BACKGROUND
                const codeSymbols = ["0", "1", "{", "}", ";", "<", ">", "="];
                loop(0.08, () => {
                    add([
                        text(choose(codeSymbols), { size: rand(14, 24) }),
                        pos(rand(0, width()), -30),
                        color(0, 255, 157),
                        opacity(rand(0.2, 0.7)),
                        move(DOWN, rand(100, 350)),
                        lifespan(4, { fade: 0.5 }),
                        z(5) // Push to background
                    ]);
                });

                // CENTRAL SERVER NODE
                const server = add([ 
                    text("🖥️", { size: 150 }), 
                    pos(centerX, centerY), 
                    anchor("center"), 
                    scale(1),
                    z(10) // Bring to foreground
                ]);

                // ANOMALY SPARKS
                loop(0.1, () => {
                    if(nodeState === "broken") {
                        add([
                            text("⚡", { size: 20 }),
                            pos(centerX + rand(-60, 60), centerY + rand(-60, 60)),
                            anchor("center"), 
                            color(255, 50, 50),
                            opacity(1),  // ✅ Add this line
                            move(choose([UP, DOWN, LEFT, RIGHT]), rand(50, 150)),
                            lifespan(0.5, { fade: 0.5 }),
                            z(11)
                        ]);
                    } else {
                        server.text = "🔋"; 
                    }
                });

                document.getElementById('compileBtn').onclick = () => {
                    if(nodeState === "fixed") return;

                    const puzzle = puzzles[currentLang][currentLevel];
                    const strippedCode = editor.value.replace(/\\s+/g, '');
                    const isMatch = strippedCode.includes(puzzle.target) || (puzzle.alt && strippedCode.includes(puzzle.alt));

                    if (isMatch) {
                        nodeState = "fixed";
                        solved[currentLang].add(currentLevel); 
                        updateRank(); 
                        
                        feedback.innerText = "COMPILE SUCCESS. OVERRIDE ACCEPTED.";
                        feedback.style.color = "var(--neon)";
                        
                        server.text = "🔋"; 
                        shake(5);
                        confetti({ particleCount: 100, spread: 70, origin: { x: 0.6, y: 0.5 }, colors: ['#00ff9d', '#ffffff'] });
                        
                        wait(2, () => {
                            if(currentLevel < 9 && !solved[currentLang].has(currentLevel + 1)) {
                                levelSelect.value = currentLevel + 1;
                                loadPuzzle();
                                server.text = "🖥️";
                            } else {
                                feedback.innerText = "NODE CHAIN RESTORED.";
                            }
                        });

                    } else {
                        feedback.innerText = \`COMPILE ERROR: \${puzzle.hint}\`;
                        feedback.style.color = "var(--danger)";
                        shake(15);
                        server.scale = vec2(1.1); 
                        wait(0.2, () => server.scale = vec2(1));
                    }
                };
            });

            loadPuzzle();
            go("main");
        </script>
    </body>
    </html>`
  },
  fantasy: {
    title: "Woodland Rune Weaver",
    blueprint: "BENCHMARK: Typing-based Fantasy Shooter using Kaplay.js. Optimized for performance by removing projectiles; features dynamic string matching and direct targeted destruction via keyboard input.",
    code: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Woodland Rune Weaver</title>
    <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            display: flex;
            height: 100vh;
            background: #050505;
            color: white;
            font-family: monospace;
            overflow: hidden;
        }
        #viewport {
            flex-grow: 1;
            position: relative;
            background: radial-gradient(circle at center, #0a1a0a 0%, #000 100%);
        }
        #hud {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10;
            text-align: right;
            background: rgba(0,0,0,0.8);
            padding: 15px 20px;
            border: 1px solid #333;
            border-right: 3px solid #ffaa00;
            border-radius: 4px;
            pointer-events: none;
        }
        .hud-line { font-size: 1.2rem; font-weight: bold; color: #aaa; }
        .hud-line span { color: #ffaa00; }
        .instruction {
            position: absolute;
            bottom: 20px;
            left: 0;
            width: 100%;
            text-align: center;
            color: #888;
            font-size: 1.2rem;
            z-index: 10;
            pointer-events: none;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div id="viewport">
        <div id="hud">
            <div class="hud-line">SHADOWS BANISHED: <span id="score">0</span></div>
        </div>
        <div class="instruction">TYPE THE RUNES TO DEFEND THE GOLDEN WOOD</div>
    </div>

    <script>
    kaplay({
        global: true,
        root: document.getElementById('viewport'),
        background: [0, 0, 0, 0],
    });

    // ── constants ────────────────────────────────────────────────────────────
    const WORDS        = ["mithril","elven","star","rings","wizard","shadow",
                          "flame","forest","blade","light","magic","realm",
                          "rune","oak","veil","ember","thorn","glade","science","ancient","great"
                          "gondor,"lothlorien","rivendell","moria","balrog","ent","galadriel","sauron","isildur"
                          "aragorn","legolas","gimli","frodo","samwise","gandalf","saruman","nazgul","orc","uruk","troll"];
    const SPAWN_RATE   = 2;        // seconds between spawns
    const MAX_ENEMIES  = 10;       // hard cap to keep memory flat
    const BASE_SPEED   = 40;
    const SPEED_SCALE  = 2;        // added speed per score point
    const TREE_RADIUS  = 55;       // collision distance (px)

    // ── DOM score cache ───────────────────────────────────────────────────────
    const scoreEl = document.getElementById('score');

    scene("main", () => {
        let score       = 0;
        let activeEnemy = null;

        // ── pool: reuse arrays ────────────────────────────────────────────────
        const pool   = [];
        const active = [];

        // ── tree + aura ───────────────────────────────────────────────────────
        const cx = width()  / 2;
        const cy = height() / 2;

        add([ text("🌳", { size: 100 }), pos(cx, cy), anchor("center") ]);

        const aura = add([ circle(60), pos(cx, cy), anchor("center"),
                           color(255, 170, 0), opacity(0.2) ]);

        // ── flash ring (single reused object) ────────────────────────────────
        // Drawn as a circle outline: we fake an outline by layering two circles.
        const flashRingOuter = add([ circle(46), pos(-9999, -9999), anchor("center"),
                                     color(255, 40, 40), opacity(0) ]);
        const flashRingInner = add([ circle(36), pos(-9999, -9999), anchor("center"),
                                     color(0, 0, 0), opacity(0) ]);   // punch-out centre

        let flashTimer = 0;

        function triggerFlash(x, y) {
            flashRingOuter.pos.x = x; flashRingOuter.pos.y = y;
            flashRingInner.pos.x = x; flashRingInner.pos.y = y;
            flashRingOuter.opacity = 0.85;
            flashRingInner.opacity = 1;
            flashTimer = 0.18;   // seconds to stay visible
        }

        // ── target bracket (shows which enemy is locked) ──────────────────────
        // Two L-shaped corner markers drawn as thin rects, repositioned each frame.
        const BRACKET_SIZE = 28;
        const BRACKET_W    = 3;
        // top-left corner: horizontal + vertical
        const bTLH = add([ rect(BRACKET_SIZE, BRACKET_W), pos(-9999,-9999), color(255,80,80), opacity(0) ]);
        const bTLV = add([ rect(BRACKET_W, BRACKET_SIZE), pos(-9999,-9999), color(255,80,80), opacity(0) ]);
        // bottom-right corner
        const bBRH = add([ rect(BRACKET_SIZE, BRACKET_W), pos(-9999,-9999), color(255,80,80), opacity(0) ]);
        const bBRV = add([ rect(BRACKET_W, BRACKET_SIZE), pos(-9999,-9999), color(255,80,80), opacity(0) ]);

        function updateBrackets(e) {
            if (!e || !e._alive) {
                [bTLH,bTLV,bBRH,bBRV].forEach(b => b.opacity = 0);
                return;
            }
            const x = e.pos.x, y = e.pos.y, o = 32;
            bTLH.pos.x = x - o;           bTLH.pos.y = y - o;           bTLH.opacity = 1;
            bTLV.pos.x = x - o;           bTLV.pos.y = y - o;           bTLV.opacity = 1;
            bBRH.pos.x = x + o - BRACKET_SIZE; bBRH.pos.y = y + o - BRACKET_W; bBRH.opacity = 1;
            bBRV.pos.x = x + o - BRACKET_W;    bBRV.pos.y = y + o - BRACKET_SIZE; bBRV.opacity = 1;
        }

        // ── helpers ───────────────────────────────────────────────────────────

        function chooseWord() {
            const used  = new Set(active.map(e => e._word));
            const avail = WORDS.filter(w => !used.has(w));
            return choose(avail.length ? avail : WORDS);
        }

        // update the two-part label: typed portion (gold) + remaining (white)
        function refreshLabel(e) {
            const typed   = e._typed;
            const remaining = e._word.slice(typed.length);
            // We use two sibling text objects: _labelDone (gold) and _labelRest (white)
            e._labelDone.text = typed;
            e._labelRest.text = remaining;
            // offset _labelRest to sit right after _labelDone
            // approximate: each char ~14px wide at size 24
            const charW = 13.5;
            const totalW  = e._word.length * charW;
            const doneW   = typed.length   * charW;
            const restW   = remaining.length * charW;
            e._labelDone.pos.x = -(totalW / 2) + (doneW / 2);
            e._labelRest.pos.x =  (totalW / 2) - (restW / 2);
        }

        function resetEnemy(e, sx, sy, dx, dy, word) {
            e.pos.x  = sx;  e.pos.y  = sy;
            e._dx    = dx;  e._dy    = dy;
            e._word  = word;
            e._typed = "";
            e._alive = true;
            e.hidden = false;
            e._wobble = 0;
            refreshLabel(e);
        }

        function acquireEnemy(sx, sy, dx, dy, word) {
            if (pool.length > 0) {
                const e = pool.pop();
                resetEnemy(e, sx, sy, dx, dy, word);
                active.push(e);
                return;
            }
            const e = add([
                text("🕷️", { size: 50 }),
                pos(sx, sy),
                anchor("center"),
                { _word: word, _typed: "", _dx: dx, _dy: dy, _alive: true, _wobble: 0 }
            ]);

            // two child labels: typed (gold) + remaining (white)
            e._labelDone = e.add([ text("",   { size: 24 }), pos(0, -42), anchor("center"), color(255, 200, 0) ]);
            e._labelRest = e.add([ text(word, { size: 24 }), pos(0, -42), anchor("center"), color(220, 220, 220) ]);
            refreshLabel(e);

            active.push(e);
        }

        function retireEnemy(e) {
            e.hidden = true;
            e._alive = false;
            e._labelDone.text = "";
            e._labelRest.text = "";
            const idx = active.indexOf(e);
            if (idx !== -1) active.splice(idx, 1);
            pool.push(e);
            if (activeEnemy === e) activeEnemy = null;
        }

        function spawnEnemy() {
            if (active.length >= MAX_ENEMIES) return;
            const angle = rand(0, Math.PI * 2);
            const dist  = Math.max(width(), height()) / 1.5;
            acquireEnemy(
                cx + Math.cos(angle) * dist,
                cy + Math.sin(angle) * dist,
                Math.cos(angle + Math.PI),
                Math.sin(angle + Math.PI),
                chooseWord()
            );
        }

        // single sparkle pool
        let sparkle = null;
        function showSparkle(x, y) {
            if (!sparkle) {
                sparkle = add([ text("✨", { size: 60 }), pos(x, y), anchor("center"), opacity(1) ]);
            }
            sparkle.pos.x = x; sparkle.pos.y = y;
            sparkle.hidden  = false;
            sparkle.opacity = 1;
        }

        // ── main update loop ──────────────────────────────────────────────────
        onUpdate(() => {
            const dt_ = dt();

            // aura pulse
            aura.scale = vec2(1 + Math.sin(time() * 3) * 0.1);

            // sparkle fade
            if (sparkle && !sparkle.hidden) {
                sparkle.opacity -= dt_ * 4;
                if (sparkle.opacity <= 0) sparkle.hidden = true;
            }

            // flash ring fade
            if (flashTimer > 0) {
                flashTimer -= dt_;
                const t = Math.max(0, flashTimer / 0.18);
                flashRingOuter.opacity = 0.85 * t;
                flashRingInner.opacity = t;
                if (flashTimer <= 0) {
                    flashRingOuter.opacity = 0;
                    flashRingInner.opacity = 0;
                }
            }

            // brackets track active enemy
            updateBrackets(activeEnemy);

            const speed = BASE_SPEED + score * SPEED_SCALE;

            for (let i = active.length - 1; i >= 0; i--) {
                const e = active[i];

                // wobble on targeted enemy
                if (e === activeEnemy && e._wobble > 0) {
                    e._wobble -= dt_ * 8;
                    if (e._wobble < 0) e._wobble = 0;
                }
                const wobbleOffset = e === activeEnemy ? Math.sin(time() * 30) * e._wobble * 5 : 0;
                e.angle = wobbleOffset;

                e.pos.x += e._dx * speed * dt_;
                e.pos.y += e._dy * speed * dt_;

                const ddx = e.pos.x - cx, ddy = e.pos.y - cy;
                if (ddx * ddx + ddy * ddy < TREE_RADIUS * TREE_RADIUS) {
                    onTreeHit();
                    return;
                }
            }
        });

        function onTreeHit() {
            shake(20);
            for (let i = active.length - 1; i >= 0; i--) retireEnemy(active[i]);
            activeEnemy = null;
            score = 0;
            scoreEl.textContent = "0";
            [bTLH,bTLV,bBRH,bBRV].forEach(b => b.opacity = 0);
        }

        // ── typing ────────────────────────────────────────────────────────────
        onCharInput((ch) => {
            ch = ch.toLowerCase();
            if (!/[a-z]/.test(ch)) return;

            if (!activeEnemy || !activeEnemy._alive) {
                activeEnemy = active.find(e => e._alive && e._word.startsWith(ch)) || null;
            }
            if (!activeEnemy) return;

            const expected = activeEnemy._word[activeEnemy._typed.length];
            if (expected !== ch) {
                // wrong key: brief red flash on the label to signal mismatch
                activeEnemy._labelRest.color = rgb(255, 80, 80);
                wait(0.1, () => { if (activeEnemy) activeEnemy._labelRest.color = rgb(220, 220, 220); });
                return;
            }

            activeEnemy._typed += ch;
            activeEnemy._wobble = 1;         // trigger wobble
            triggerFlash(activeEnemy.pos.x, activeEnemy.pos.y);
            refreshLabel(activeEnemy);

            if (activeEnemy._typed === activeEnemy._word) {
                showSparkle(activeEnemy.pos.x, activeEnemy.pos.y);
                retireEnemy(activeEnemy);
                score++;
                scoreEl.textContent = score;
            }
        });

        loop(SPAWN_RATE, spawnEnemy);
    });

    go("main");
    </script>
</body>
</html>
    `
  },
  racer: {
    title: "Quantum Math Drift",
    blueprint: "BENCHMARK: 3-Lane Educational Racer using Kaplay.js. Optimized for performance and paced with a manual 'Press Enter to Continue' prompt between math gates.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantum Math Drift</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
    <style>
        :root {
            --cyan:    #00f5ff;
            --magenta: #ff0055;
            --yellow:  #ffe600;
            --dark:    #04060f;
            --panel:   rgba(4,6,15,0.92);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex; height: 100vh;
            background: var(--dark);
            font-family: 'Share Tech Mono', monospace;
            overflow: hidden;
            color: white;
        }
        #viewport { flex-grow: 1; position: relative; background: var(--dark); }

        /* HUD STYLING */
        .hud-container { position: absolute; top: 18px; z-index: 10; pointer-events: none; display: flex; flex-direction: column; gap: 8px; }
        #hud-left { left: 18px; }
        #hud-right { right: 18px; align-items: flex-end; }
        
        .panel { background: var(--panel); border: 1px solid #1a2030; border-radius: 3px; padding: 8px 14px; }
        .panel-label { font-size: 0.6rem; letter-spacing: 3px; color: #667; text-transform: uppercase; margin-bottom: 2px; }
        .panel-value { font-family: 'Orbitron', monospace; font-size: 1.5rem; font-weight: 700; }
        
        #score-val   { color: var(--cyan); text-shadow: 0 0 10px var(--cyan); }
        #combo-val   { color: var(--yellow); }
        #lives-val   { color: var(--magenta); font-size: 1.1rem; letter-spacing: 5px; }
        #speed-val   { color: #fff; font-size: 1.8rem; }
        #best-val    { color: #888; font-size: 1.2rem; }

        /* CENTER EQUATION */
        #eq-panel {
            position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
            z-index: 10; pointer-events: none;
            background: var(--panel); border: 1px solid #1a2030; border-bottom: 2px solid var(--cyan);
            border-radius: 3px; padding: 8px 26px 10px; text-align: center; min-width: 210px;
        }
        #eq-label { font-size: 0.6rem; letter-spacing: 3px; color: #667; }
        #equation { font-family: 'Orbitron', monospace; font-size: 2.5rem; font-weight: 900; color: #fff; letter-spacing: 4px; }
        #op-type { font-size: 0.7rem; letter-spacing: 3px; color: var(--cyan); }

        /* OVERLAYS */
        #timer-wrap { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; z-index: 20; background: #0a0c14; }
        #timer-bar { height: 100%; width: 100%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); transition: width 0.1s linear; }
        
        #flash { position: absolute; inset: 0; z-index: 50; pointer-events: none; opacity: 0; transition: opacity 0.1s; }
        #reveal {
            position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60; pointer-events: none;
            font-family: 'Orbitron', monospace; font-size: 1.2rem; letter-spacing: 3px;
            color: var(--magenta); text-shadow: 0 0 14px var(--magenta);
            opacity: 0; transition: opacity 0.2s; white-space: nowrap;
        }
        
        /* NEW PROMPT ELEMENT */
        #next-prompt {
            position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%);
            z-index: 70; pointer-events: none;
            font-family: 'Orbitron', monospace; font-size: 1.2rem; letter-spacing: 3px;
            color: var(--yellow); text-shadow: 0 0 15px var(--yellow);
            opacity: 0; transition: opacity 0.2s; white-space: nowrap;
        }

        .instruction { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); color: #445; font-size: 0.7rem; z-index: 10; pointer-events: none; letter-spacing: 3px; white-space: nowrap; }

        @keyframes blinker { 50% { opacity: 0; } }
        .blink-fast { animation: blinker 0.6s step-start infinite; }
    </style>
</head>
<body>
<div id="viewport">
    <div id="timer-wrap"><div id="timer-bar"></div></div>

    <div id="eq-panel">
        <div id="eq-label">SOLVE</div>
        <div id="equation">? ? ?</div>
        <div id="op-type">LOADING</div>
    </div>

    <div id="hud-left" class="hud-container">
        <div class="panel">
            <div class="panel-label">Sectors</div>
            <div class="panel-value" id="score-val">0</div>
        </div>
        <div class="panel">
            <div class="panel-label">Combo</div>
            <div class="panel-value" id="combo-val">x1</div>
        </div>
        <div class="panel" style="border-left: 2px solid var(--magenta);">
            <div class="panel-label">Hull</div>
            <div class="panel-value" id="lives-val">♥ ♥ ♥</div>
        </div>
    </div>

    <div id="hud-right" class="hud-container">
        <div class="panel" style="text-align: right; border-left: 2px solid var(--yellow);">
            <div class="panel-label">Velocity</div>
            <div class="panel-value" id="speed-val">300</div>
            <div style="font-size: 10px; color: #667;">KM/H</div>
        </div>
        <div class="panel" style="text-align: right;">
            <div class="panel-label">Best</div>
            <div class="panel-value" id="best-val">0</div>
        </div>
    </div>

    <div id="flash"></div>
    <div id="reveal"></div>
    <div id="next-prompt">PRESS [ENTER] TO CONTINUE</div>
    <div class="instruction">USE LEFT AND RIGHT ARROWS TO STEER</div>
</div>

<script>
kaplay({ global: true, root: document.getElementById('viewport'), background: [4,6,15,255] });

// DOM Refs
const scoreEl   = document.getElementById('score-val');
const comboEl   = document.getElementById('combo-val');
const livesEl   = document.getElementById('lives-val');
const bestEl    = document.getElementById('best-val');
const speedEl   = document.getElementById('speed-val');
const eqEl      = document.getElementById('equation');
const opEl      = document.getElementById('op-type');
const eqPanel   = document.getElementById('eq-panel');
const timerBar  = document.getElementById('timer-bar');
const flashEl   = document.getElementById('flash');
const revealEl  = document.getElementById('reveal');
const promptEl  = document.getElementById('next-prompt');

// Constants
const LANES = 3;
const BASE_SPEED = 300;
const MAX_SPEED = 1000;
const SPEED_INC = 20;
const GATE_H = 80;
const MAX_LIVES = 3;
const TIME_LIMIT = 5;

const OP_COLORS = {
    'x': [255, 0, 88],
    '+': [0, 255, 150],
    '-': [255, 180, 0]
};
const OP_NAMES = { 'x': 'MULTIPLY', '+': 'ADDITION', '-': 'SUBTRACT' };

// State
let score = 0, combo = 1, lives = MAX_LIVES, best = 0;
let gameSpeed = BASE_SPEED;
let questionTimer = TIME_LIMIT;
let questionActive = false;
let waitingForNext = false;
let correctAnswer = 0;
let flashTimeout = null;
let revealTimeout = null;

// UI Helpers
function updateLivesHUD() {
    let str = "";
    for(let i=0; i<MAX_LIVES; i++) str += (i < lives ? '♥ ' : '♡ ');
    livesEl.textContent = str;
}
function updateComboHUD() {
    comboEl.textContent = "x" + combo;
    comboEl.style.color = combo >= 8 ? '#ff0055' : combo >= 5 ? '#ffe600' : '#00f5ff';
}
function screenFlash(color, dur) {
    flashEl.style.background = color; flashEl.style.opacity = '0.3';
    clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => { flashEl.style.opacity = '0'; }, dur);
}
function showReveal(msg) {
    revealEl.textContent = msg; revealEl.style.opacity = '1';
    clearTimeout(revealTimeout);
    revealTimeout = setTimeout(() => { revealEl.style.opacity = '0'; }, 1500);
}

updateLivesHUD();

// Math Engine
function generateQuestion() {
    const op = choose(['x', '+', '-']);
    let a, b, ans;
    if (op === 'x') { a = randi(2, 10); b = randi(2, 10); ans = a * b; }
    else if (op === '+') { a = randi(10, 50); b = randi(10, 50); ans = a + b; }
    else { a = randi(20, 99); b = randi(1, a); ans = a - b; }
    return { a, b, op, ans };
}

function makeFakes(ans) {
    const fakes = [];
    while(fakes.length < 2) {
        let f = ans + randi(-10, 10);
        if(f <= 0) f = ans + randi(1, 10);
        if(f !== ans && !fakes.includes(f)) fakes.push(f);
    }
    return fakes;
}

scene("main", () => {
    const W = width(), H = height();
    const laneW = W / LANES;
    const laneX = [laneW*0.5, laneW*1.5, laneW*2.5];
    let currentLane = 1;

    // Dashes
    const dashPool = [], dashActive = [];
    function acquireDash(x, y) {
        const d = dashPool.length ? dashPool.pop() : add([ rect(2, 60), pos(0,0), color(20,40,70), opacity(0.5) ]);
        d.pos.x = x; d.pos.y = y; d.hidden = false; dashActive.push(d);
    }
    for(let lane=1; lane<LANES; lane++) {
        for(let y=0; y<H+60; y+=100) acquireDash(laneW*lane, y);
    }

    // Gates
    const gatePool = [], gateActive = [];
    function acquireGate(laneIdx, val, isCorrect, op) {
        const g = gatePool.length ? gatePool.pop() : (() => {
            const go = add([ rect(laneW-20, GATE_H), pos(0,0), anchor("center"), opacity(0.15) ]);
            go._label = go.add([ text("", {size:38}), anchor("center") ]);
            return go;
        })();
        
        const [cr,cg,cb] = OP_COLORS[op];
        g.pos.x = laneX[laneIdx]; g.pos.y = -80;
        g._isCorrect = isCorrect; g.hidden = false;
        g.color = rgb(cr*0.3, cg*0.3, cb*0.3);
        g.opacity = isCorrect ? 0.3 : 0.1;
        g._label.text = val.toString();
        g._label.color = rgb(cr, cg, cb);
        gateActive.push(g);
    }

    const ship = add([ text("🚀", {size: 58}), pos(laneX[1], H-100), anchor("center"), { _tilt: 0 } ]);

    function spawnQuestion() {
        gateActive.forEach(g => { g.hidden = true; gatePool.push(g); });
        gateActive.length = 0;

        const q = generateQuestion();
        correctAnswer = q.ans;
        questionTimer = TIME_LIMIT;
        questionActive = true;

        eqEl.textContent = q.a + " " + q.op + " " + q.b;
        opEl.textContent = OP_NAMES[q.op];
        opEl.style.color = "rgb(" + OP_COLORS[q.op].join(',') + ")";
        eqPanel.style.borderBottomColor = "rgb(" + OP_COLORS[q.op].join(',') + ")";

        const correctLane = randi(0, LANES);
        const fakes = makeFakes(q.ans);
        let fi = 0;

        for(let i=0; i<LANES; i++) {
            acquireGate(i, i === correctLane ? q.ans : fakes[fi++], i === correctLane, q.op);
        }
    }

    function triggerNext(isCorrect) {
        questionActive = false;
        gateActive.forEach(g => { g.hidden = true; gatePool.push(g); });
        gateActive.length = 0;

        if (isCorrect) {
            score += combo; combo = Math.min(combo + 1, 10);
            gameSpeed = Math.min(gameSpeed + SPEED_INC * combo, MAX_SPEED);
            if(score > best) best = score;
            
            scoreEl.textContent = score;
            bestEl.textContent = best;
            speedEl.textContent = Math.round(gameSpeed);
            updateComboHUD();
            screenFlash('rgba(0,245,255,1)', 100);
            
            wait(0.3, () => initiateWaitState());
        } else {
            lives--; combo = 1;
            updateLivesHUD(); updateComboHUD();
            showReveal("ANSWER WAS " + correctAnswer);
            screenFlash('rgba(255,0,80,1)', 200);
            shake(15);
            
            if(lives <= 0) { wait(0.8, () => go("gameover")); return; }
            wait(0.8, () => initiateWaitState());
        }
    }

    // Puts the UI into a standby mode and waits for Enter
    function initiateWaitState() {
        eqEl.textContent = "? ? ?";
        opEl.textContent = "STANDBY";
        opEl.style.color = "#667";
        eqPanel.style.borderBottomColor = "#1a2030";
        
        waitingForNext = true;
        promptEl.style.opacity = '1';
        promptEl.classList.add('blink-fast');
    }

    // Input Listeners
    onKeyPress("enter", () => {
        if(waitingForNext) {
            waitingForNext = false;
            promptEl.style.opacity = '0';
            promptEl.classList.remove('blink-fast');
            spawnQuestion();
        }
    });

    onKeyPress("left", () => {
        if(currentLane > 0) {
            currentLane--;
            tween(ship.pos.x, laneX[currentLane], 0.1, v => ship.pos.x = v, easings.easeOutQuad);
            ship._tilt = -20;
        }
    });
    
    onKeyPress("right", () => {
        if(currentLane < LANES-1) {
            currentLane++;
            tween(ship.pos.x, laneX[currentLane], 0.1, v => ship.pos.x = v, easings.easeOutQuad);
            ship._tilt = 20;
        }
    });

    // Main Engine Loop
    onUpdate(() => {
        const dt_ = dt();
        const spd = gameSpeed;

        for(let i=0; i<dashActive.length; i++) {
            const d = dashActive[i];
            d.pos.y += spd * 0.6 * dt_;
            if(d.pos.y > H + 60) d.pos.y -= (H + 100);
        }

        if(questionActive) {
            questionTimer -= dt_;
            timerBar.style.width = Math.max(0, (questionTimer / TIME_LIMIT) * 100) + '%';
            if(questionTimer <= 0) triggerNext(false);
        }

        for(let i=gateActive.length-1; i>=0; i--) {
            const g = gateActive[i];
            g.pos.y += spd * dt_;

            const dx = Math.abs(g.pos.x - ship.pos.x);
            const dy = Math.abs(g.pos.y - ship.pos.y);
            
            if(dx < laneW * 0.4 && dy < GATE_H * 0.5 && questionActive) {
                triggerNext(g._isCorrect);
            }
        }

        ship._tilt *= 0.8;
        ship.angle = ship._tilt;
    });

    // Start Game
    wait(0.5, spawnQuestion);
});

scene("gameover", () => {
    add([ rect(width(), height()), color(10, 10, 20) ]);
    add([ text("SYSTEM FAILURE", {size: 48}), pos(width()/2, height()/2 - 40), anchor("center"), color(255,0,85) ]);
    add([ text("SECTORS: " + score, {size: 24}), pos(width()/2, height()/2 + 20), anchor("center") ]);
    add([ text("PRESS SPACE TO REBOOT", {size: 16}), pos(width()/2, height()/2 + 80), anchor("center"), color(100,100,100) ]);

    onKeyPress("space", () => {
        score = 0; combo = 1; lives = MAX_LIVES; gameSpeed = BASE_SPEED;
        questionTimer = TIME_LIMIT; questionActive = false; waitingForNext = false;
        scoreEl.textContent = "0"; speedEl.textContent = "300";
        timerBar.style.width = "100%";
        updateComboHUD(); updateLivesHUD();
        go("main");
    });
});

go("main");
</script>
</body>
</html>`
  }
};
