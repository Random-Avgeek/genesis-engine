import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY_2;
    const mistralKey = process.env.MISTRAL_API_KEY;

    if (!geminiKey || !mistralKey) {
      return NextResponse.json({ error: "Missing API Keys" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // STAGE 1: THE NARRATIVE ARCHITECT (Stealth Learning)
    const architectPrompt = `You are a Visionary Game Designer for an EdTech platform.
    User Request: "${query}"
    
    CRITICAL RULE: NO code comments allowed.
    MANDATE: "Stealth Learning". Wrap the educational concept in a high-stakes arcade game narrative (Sci-Fi, Fantasy, etc.).
    
    REQUIRED BLUEPRINT:
    1. The Lore: 1-sentence epic backstory.
    2. Controls: Console sliders/buttons mapped to the lore (e.g., 'Thruster Power' instead of 'Velocity').
    3. Viewport Action: Use Emoji sprites (e.g., 🚀, ☄️, 🏰) as visual metaphors.
    4. Win Condition: User solves the underlying math/science to win.
    5. Engine: Specify the use of Kaplay.js (Kaboom) for physics and rendering.`;

    const architectResult = await geminiModel.generateContent(architectPrompt);
    const blueprint = architectResult.response.text();

    // STAGE 2: THE BUILDER (Kaplay.js Engine Integration)
    const builderPrompt = `You are a Game Developer.
    Draft the initial single-file HTML/JS based on this blueprint:
    ${blueprint}
    
    CRITICAL RULES:
    - DO NOT write code comments.
    - Use Kaplay.js via CDN: <script src="https://unpkg.com/kaplay@3001.0.0-alpha.21/dist/kaplay.js"></script>
    - Initialize kaplay({ global: true, canvas: document.getElementById("game") })
    - Use scaling emojis for sprites. Include basic Kaplay physics (body, area, pos).`;

    const builderResult = await geminiModel.generateContent(builderPrompt);
    const initialCode = builderResult.response.text();

    // STAGE 3: THE RECTIFIER (Mistral Auto-Correction)
    const mistral = new Mistral({ apiKey: mistralKey });
    const polisherPrompt = `You are the Final Code Auditor & Rectifier.
    BLUEPRINT: ${blueprint}
    INITIAL CODE: ${initialCode}
    
    CRITICAL MISSION:
    1. RECTIFY ERRORS: Fix any syntax errors, unclosed HTML tags, or undefined Kaplay variables from the Initial Code.
    2. LAYOUT: Ensure the CSS Grid/Flex "Console vs Viewport" layout is perfectly intact.
    3. PURGE COMMENTS: Strip absolutely ALL comments (//, /* */, ).
    OUTPUT: Return ONLY the flawless, raw HTML code. No markdown formatting.`;

    const chatResponse = await mistral.chat.complete({
      model: "codestral-latest",
      messages: [{ role: "user", content: polisherPrompt }],
    });

    const rawContent = chatResponse.choices?.[0]?.message?.content;
    let rawCode = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "");

    let cleanCode = rawCode.replace(/```html/g, "").replace(/```/g, "").trim();
    if (!cleanCode.includes("<!DOCTYPE html>")) cleanCode = "<!DOCTYPE html>\n" + cleanCode;

    // Output perfectly matches the 'games' database structure requirements
    return NextResponse.json({ blueprint, code: cleanCode });

  } catch (error: any) {
    return NextResponse.json(
      { blueprint: "System Failure.", code: `<h3>Error</h3><p>${error.message}</p>` },
      { status: 500 }
    );
  }
}