import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { benchmarkGames } from "@/lib/benchmarks";

export const maxDuration = 120;

// ─── helpers ────────────────────────────────────────────────────────────────

function extractHTML(raw: string): string {
  // Strip markdown fences if the model wrapped its output
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let code = fenced ? fenced[1].trim() : raw.trim();

  const dtIdx   = code.toLowerCase().indexOf("<!doctype html>");
  const htmlIdx  = code.toLowerCase().indexOf("<html");

  if (dtIdx !== -1)   return code.substring(dtIdx);
  if (htmlIdx !== -1) return "<!DOCTYPE html>\n" + code.substring(htmlIdx);
  return "<!DOCTYPE html>\n" + code;
}

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c: any) => c.text ?? "").join("");
  return "";
}

// ─── route ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    // ── key validation ──────────────────────────────────────────────────────
    const geminiKey  = process.env.GEMINI_API_KEY_2;
    const groqKey    = process.env.GROQ_API_KEY;
    const mistralKey = process.env.MISTRAL_API_KEY;

    const missing = [
      !geminiKey  && "GEMINI_API_KEY_2",
      !groqKey    && "GROQ_API_KEY",
      !mistralKey && "MISTRAL_API_KEY",
    ].filter(Boolean);

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing environment variables: ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    // ── client init ─────────────────────────────────────────────────────────
    const gemini = new GoogleGenerativeAI(geminiKey!).getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.8 },
    });
    const groq    = new Groq({ apiKey: groqKey });
    const mistral = new Mistral({ apiKey: mistralKey });

    // Gold standard benchmark context fed to all three stages
    const benchmarkContext = Object.values(benchmarkGames)
      .map(b => `TITLE: "${b.title}"\nDESIGN PATTERN: ${b.blueprint}`)
      .join("\n\n");

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 1 — ARCHITECT  (Gemini 2.5 Flash)
    // Produces a structured Game Design Document. No code — pure design intent.
    // ══════════════════════════════════════════════════════════════════════════
    const architectPrompt = `
You are a Lead Game Designer and UX Architect at a premium EdTech studio.
Your philosophy is "Stealth Learning" — wrapping hard educational concepts inside
satisfying, polished arcade mechanics so players learn without noticing.

USER REQUEST:
"${query}"

GOLD STANDARD REFERENCE LIBRARY (study these patterns carefully):
${benchmarkContext}

YOUR TASK:
Produce a tight, unambiguous Game Design Document (GDD) that a senior developer
can implement directly. Every decision must serve both the gameplay feel AND
the educational concept — they are inseparable.

Respond in exactly this structure:

**TITLE:** A punchy, memorable name (3–5 words max)

**LEARNING OBJECTIVE:** The single concrete skill or concept the player will
practice. Be specific — not "math" but "mental multiplication of 2-digit numbers".

**LORE (1–2 sentences):** A vivid narrative skin that makes the mechanic feel
urgent. Good lore makes a timer feel like a countdown to disaster.

**CORE LOOP (numbered steps):** The exact sequence of: perceive → decide → act → feedback.
Keep it to 4–6 steps. Each step must map directly to an educational action.

**CONTROLS & UI LAYOUT:**
- Left panel inputs (sliders, buttons, dropdowns, text fields): list each with its
  label, range/options, and what game variable it controls.
- Right panel canvas: describe the initial visual state the player sees.

**GAME FEEL — JUICE SPEC:**
List every feedback moment with its exact effect:
e.g. "Correct answer → cyan burst ring expands from collision point + score
counter animates upward + 80ms screen flash"

**DIFFICULTY CURVE:** How does the game get harder over time? Be specific
(speed increases, answer ranges widen, timer shortens, new operator introduced, etc.)

**WIN / LOSS CONDITIONS:** Exact thresholds. What triggers game over? What is
the victory screen? What persists between rounds (score, speed, combo)?

**TECHNICAL NOTES FOR BUILDER:**
Any non-obvious implementation details: object pooling needs, which Kaplay
primitives to use, collision strategy, DOM↔canvas data flow.
`.trim();

    const architectResult = await gemini.generateContent(architectPrompt);
    const blueprint = architectResult.response.text().trim();

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 2 — BUILDER  (Llama 3.3 70b via Groq)
    // Translates the GDD into a single self-contained HTML file.
    // ══════════════════════════════════════════════════════════════════════════
    const builderPrompt = `
You are a senior full-stack game developer specialising in Kaplay.js arcade games.
You write clean, performant, self-contained HTML that runs perfectly in a sandboxed iframe.

GAME DESIGN DOCUMENT:
${blueprint}

ABSOLUTE ENGINEERING RULES — violating any of these will cause the game to fail:

1. OUTPUT FORMAT
   Return ONLY raw HTML starting with <!DOCTYPE html>.
   No markdown fences. No preamble. No explanation. The very first character must be "<".

2. SINGLE FILE
   Everything — HTML, CSS, JS — in one file. No external assets except:
   • Kaplay CDN: <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
   • Google Fonts (optional, for typography only)

3. KAPLAY INITIALISATION
   Always use:
   kaplay({ global: true, root: document.getElementById('viewport'), background: [4, 6, 15, 255] })
   NEVER use the canvas: option — root: renders into a div, which is safer in iframes.

4. LAYOUT — CSS Flexbox split-screen:
   • body: display:flex; height:100vh; overflow:hidden; margin:0;
   • Left panel  #console : fixed width (320–420px), dark bg (#0a0a0a), styled inputs,
     border-right accent in a neon colour. Contains all HTML controls.
   • Right panel #viewport: flex-grow:1; position:relative; contains the Kaplay canvas.
   The game MUST fill the entire right panel — no scrollbars, no overflow.
   The Game must be interactive and actually work when the left panels bar and slide mechanisms are triggered. It should not be unresponsive or dead at creation. Make sure it is precompiled and usable and most importantly simple to be able to run on the browser and optimised.

5. STYLING STANDARDS
   • Dark theme throughout. Background: #050505 or #04060f.
   • Accent colour matches the game's theme (neon cyan, magenta, amber, green — pick one).
   • All interactive elements (buttons, sliders, inputs) must be clearly labelled,
     keyboard-accessible, and visually distinct from the background.
   • Use a monospace or technical font (Share Tech Mono, Orbitron, Courier New).
   Make sure that we are following Dark mode so the text is a light color which is readable by the user

6. PERFORMANCE — OBJECT POOLING
   Never call destroy() inside a game loop. For any object spawned repeatedly
   (enemies, projectiles, particles, gates), implement a pool:
   - pool array + active array
   - acquire() hides→repositions a pooled object or creates one if pool is empty
   - retire() hides it and pushes back to pool
   This is non-negotiable. destroy() causes GC spikes and frame drops.

7. SINGLE onUpdate LOOP
   All per-frame logic (movement, collision, timers, UI sync) must live in ONE
   onUpdate(() => { ... }) callback. Never register onUpdate inside a loop or
   per-object. Use manual distance checks for collision — never area() + onCollide()
   on pooled objects.

8. DOM ↔ CANVAS SYNC
   Cache all DOM element references outside the scene with:
   const el = document.getElementById('...')
   Update them directly (el.textContent = value) — never query the DOM inside onUpdate.
   CSS custom properties (var(--cyan)) do NOT resolve in JS .style assignments —
   use literal hex values (#00f5ff) instead.

9. GAME FEEL (NON-NEGOTIABLE)
   Every correct action: visual burst/flash + score animation.
   Every wrong action: shake(N) + red flash overlay + reveal correct answer briefly.
   Speed / difficulty must increase measurably as score climbs.
   Include a GAME OVER scene with final score, best score, and Space-to-retry.

10. IFRAME SAFETY
    No alert(), confirm(), or prompt(). No localStorage (not available in sandboxed iframes).
    All state lives in JS variables at module scope.
`.trim();

    const builderCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.15,
      max_tokens: 8192,
      messages: [
        {
          role: "system",
          content:
            "You are an expert Kaplay.js game developer. You output only raw HTML — no markdown, no explanation, no wrapper text. Your first character is always '<'.",
        },
        { role: "user", content: builderPrompt },
      ],
    });

    const draftCode = builderCompletion.choices[0]?.message?.content ?? "";

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 3 — UX AUDITOR  (Gemini 2.5 Flash)
    // Reads the draft code against the GDD + benchmark standards.
    // Does NOT write code — outputs a precise, numbered shortcomings report
    // that Stage 4 will use as its fix brief.
    // ══════════════════════════════════════════════════════════════════════════
    const auditorPrompt = `
You are a brutal, experienced QA Lead and UX Auditor for a premium interactive EdTech platform.
You have shipped dozens of Kaplay.js browser games and you know every failure mode intimately.
Your job is NOT to write code — it is to READ code and expose every problem that would make
a player unable to play, confused, bored, or frustrated.

You will be given:
1. The Game Design Document the game was supposed to implement.
2. The actual HTML/JS code a developer wrote.
3. Gold standard benchmark examples showing what a high-quality implementation looks like.

Study all three, then produce a cold, precise shortcomings report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME DESIGN DOCUMENT (intended design):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${blueprint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DRAFT CODE (what was actually built):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${draftCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOLD STANDARD BENCHMARKS (quality bar):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${benchmarkContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR AUDIT — check every category below:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[PLAYABILITY — game cannot be played without these]
- Is there a way to START the game? (button, keypress, or auto-start on load)
- Are all required resources initialised before they are used?
  (ammo > 0, enemies spawned, timer started, score initialised)
- Can the core mechanic actually be triggered by the player?
  (e.g. fire button wired up, keyboard listener active, collision zone reachable)
- Does the game loop continue after the first round, or does it dead-end?
- Is there a visible game over condition, and can the player retry?

[DESIGN FIDELITY — GDD vs reality]
- List every mechanic specified in the GDD that is missing or only partially implemented.
- List any mechanic present in the code that contradicts the GDD.
- Is the difficulty curve implemented? Does it actually escalate over time?
- Are the win/loss thresholds from the GDD correctly coded?

[UX & FEEDBACK — player must always know what is happening]
- Is there feedback for every player action (correct and incorrect)?
- Are score, lives, timer, or combo displayed clearly and updated in real time?
- Is it ever possible for the player to be in an ambiguous state
  (e.g. no enemies on screen, nothing to interact with, silent failure)?
- Does the game communicate what the player should do next at all times?

[PERFORMANCE & STABILITY — things that will freeze or crash the game]
- Are there destroy() calls inside onUpdate or loop() callbacks?
- Are there add() calls inside onUpdate? (causes memory leak)
- Are there multiple onUpdate registrations (one per loop iteration)?
- Are there any CSS var() references used in JS .style assignments?
  (these silently fail — only literal hex values work in JS)
- Are there uncached DOM queries inside hot paths?

[COMPARED TO BENCHMARKS — quality gap analysis]
Compare the draft to the gold standard benchmarks provided.
List specific gaps: missing juice effects, missing HUD elements, inferior collision
detection, missing pooling, weaker visual polish, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — be surgical and specific:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY a numbered list of shortcomings. Each item must:
- Identify the exact problem (not vague — cite the specific variable, function, or missing element)
- Classify it as one of: [BLOCKER] | [UX] | [PERFORMANCE] | [DESIGN GAP] | [POLISH]
- State precisely what the fix must do

Example format:
1. [BLOCKER] No enemies are spawned on game start — spawnEnemy() is defined but never called. Fix: call spawnEnemy() inside scene("main") after initialisation, and set up loop(2, spawnEnemy) for continuous spawning.
2. [UX] Score element #score is updated but never displayed in the HUD — the element exists in HTML but has display:none. Fix: remove display:none from #score CSS rule.
3. [PERFORMANCE] destroy(projectile) is called inside onUpdate on every frame when projectile.pos.y > height(). Fix: implement projectile pool with hidden flag and retire() function.

If a category has zero issues, write: "✓ [CATEGORY NAME] — no issues found."
Do not write any preamble, summary, or closing remarks. Output the numbered list only.
`.trim();

    // Run architect model at lower temperature for analytical precision
    const auditorModel = new GoogleGenerativeAI(geminiKey!).getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.2 },
    });

    const auditorResult = await auditorModel.generateContent(auditorPrompt);
    const shortcomingsReport = auditorResult.response.text().trim();

    console.log(">>> STAGE 3 AUDIT REPORT:\n", shortcomingsReport);

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 4 — FIXER  (Codestral Latest via Mistral)
    // Receives the draft code + the Gemini audit report.
    // Implements every fix listed. Returns the final corrected HTML.
    // ══════════════════════════════════════════════════════════════════════════
    const fixerPrompt = `
You are a senior Kaplay.js game engineer performing a targeted patch pass on a draft game.
A senior UX auditor has already read the code and produced a precise shortcomings report.
Your job is to implement every fix in that report, then apply the structural checklist below.

Do not invent new features. Do not change the game's design. Only fix what is listed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT REPORT — fix every numbered item:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shortcomingsReport}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DRAFT CODE TO PATCH:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${draftCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY STRUCTURAL CHECKLIST (fix these regardless of audit):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ STRUCTURE ]
□ First line is <!DOCTYPE html> — strip any markdown fences or leading text
□ All tags properly closed: <html>, <head>, <body>, <style>, <script>
□ Kaplay imported from: https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js

[ KAPLAY INIT ]
□ Uses root: document.getElementById('viewport') — NOT canvas:
□ background is a numeric array [r,g,b,255] — NOT a CSS string
□ global: true is present

[ PERFORMANCE ]
□ No destroy() inside onUpdate or loop() — replace with pool retire()
□ No add() inside onUpdate — move to pool initialise
□ Exactly ONE onUpdate per scene
□ Collision uses Math.abs distance checks — not onCollide on pooled objects

[ DOM SAFETY ]
□ All getElementById calls cached outside scene/onUpdate
□ No CSS var() in JS .style — replace with literal hex (e.g. #00f5ff)
□ No localStorage, alert(), confirm(), or prompt()

[ GAME FEEL ]
□ Correct player action → screen flash + score update animation
□ Wrong player action → shake() + red flash overlay + brief answer/correction reveal
□ Difficulty escalates over time (speed, range, timer, or complexity)

[ LAYOUT ]
□ body: display:flex; margin:0; overflow:hidden; height:100vh
□ #viewport: flex-grow:1; position:relative
□ Left panel does not overlap the game canvas

[ GAME OVER ]
□ Scene exists and shows final score + best score
□ Retry resets ALL state: score, speed, lives, combo, timers, active arrays

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Return ONLY the patched HTML file.
- First character must be "<". Last character must be ">".
- No markdown fences. No explanation. No changelog. No apology.
- Preserve all working code exactly — only touch what needs fixing.
`.trim();

    const fixerResponse = await mistral.chat.complete({
      model: "codestral-latest",
      temperature: 0.05,
      messages: [{ role: "user", content: fixerPrompt }],
    });

    const rawFixed = contentToString(fixerResponse.choices?.[0]?.message?.content);

    // ── final extraction & safety net ───────────────────────────────────────
    const cleanCode = extractHTML(rawFixed || draftCode);

    return NextResponse.json({ blueprint, code: cleanCode });

  } catch (error: any) {
    console.error(">>> PIPELINE EXECUTION ERROR:", error);

    const safeMessage = String(error?.message ?? error).replace(/</g, "&lt;");

    return NextResponse.json(
      {
        blueprint: "Pipeline failure — see server logs.",
        code: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#050505;color:#ff3333;font-family:monospace;padding:2rem;height:100vh;box-sizing:border-box;">
  <h2 style="margin-bottom:1rem;">⚠ CORE SYSTEM FAILURE</h2>
  <p style="color:#888;margin-bottom:.5rem;">Pipeline stage error:</p>
  <pre style="color:#ff6666;background:#0a0a0a;padding:1rem;border:1px solid #333;overflow:auto;white-space:pre-wrap;">${safeMessage}</pre>
  <p style="color:#444;margin-top:1rem;font-size:.8rem;">Check server logs for the full stack trace.</p>
</body></html>`,
      },
      { status: 500 }
    );
  }
}