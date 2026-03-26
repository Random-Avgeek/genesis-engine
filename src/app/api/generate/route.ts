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

    console.log(">> STAGE 1: Architecting Blueprint");
    // STAGE 1: THE ARCHITECT (Gemini Refinement)
    const architectPrompt = `You are a UX Architect. Refine this user request: "${query}".
    Create a strict "Split-Deck" Interactive Application Blueprint.
    CRITICAL GLOBAL RULE: Absolutely NO comments (// or /* */) are allowed in any downstream code.
    Include: 1. Console Layout, 2. Viewport Mechanics, 3. Game Loop, 4. Library Stack (Three.js, Tone.js).`;

    const architectResult = await geminiModel.generateContent(architectPrompt);
    const blueprint = architectResult.response.text();

    console.log(">> STAGE 2: Building Initial Code");
    // STAGE 2: THE BUILDER (Gemini Initial Code)
    const builderPrompt = `You are a strict Frontend Developer.
    Draft the initial single-file HTML/JS based on this blueprint:
    ${blueprint}
    CRITICAL RULE: DO NOT write a single code comment. Output ONLY raw code.`;

    const builderResult = await geminiModel.generateContent(builderPrompt);
    const initialCode = builderResult.response.text();

    console.log(">> STAGE 3: Polishing via Codestral");
    // STAGE 3: THE POLISHER (Mistral Engineer)
    const mistral = new Mistral({ apiKey: mistralKey });
    const polisherPrompt = `You are the Final Code Polisher.
    BLUEPRINT: ${blueprint}
    INITIAL CODE: ${initialCode}
    TASK: 
    1. Fix bugs and enforce the CSS Grid/Flex split layout.
    2. Wire the 'oninput' slider events to the Viewport canvas.
    3. STRIP ALL COMMENTS. Do not include any explanatory comments in the HTML, CSS, or JS.
    OUTPUT: Return ONLY raw HTML code. No markdown.`;

    const chatResponse = await mistral.chat.complete({
      model: "codestral-latest",
      messages: [{ role: "user", content: polisherPrompt }],
    });

    // Type-Safe Extraction
    const rawContent = chatResponse.choices?.[0]?.message?.content;
    let rawCode = "";
    if (typeof rawContent === "string") {
      rawCode = rawContent;
    } else if (Array.isArray(rawContent)) {
      rawCode = rawContent.map((chunk: any) => chunk.text || "").join("");
    }

    // Cleanup
    let cleanCode = rawCode.replace(/```html/g, "").replace(/```/g, "").trim();
    if (!cleanCode.includes("<!DOCTYPE html>")) cleanCode = "<!DOCTYPE html>\n" + cleanCode;

    console.log(">> PIPELINE COMPLETE");
    // This perfectly matches the basic structure needed for the 'games' table dataset
    return NextResponse.json({ blueprint, code: cleanCode });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json(
      { blueprint: "System Failure.", code: `<h3>Error</h3><p>${error.message}</p>` },
      { status: 500 }
    );
  }
}