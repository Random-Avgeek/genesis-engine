import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allows the function to run for up to 60 seconds

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // VALIDATION: Check for required API keys
    const geminiKey = process.env.GEMINI_API_KEY_2;
    const mistralKey = process.env.MISTRAL_API_KEY;
    
    if (!geminiKey) {
      console.error("Missing GEMINI_API_KEY_2 environment variable");
      return NextResponse.json(
        { error: "Missing Gemini API key configuration" },
        { status: 500 }
      );
    }
    else{
        console.log("Achieved Gemini API key configuration successfully")
    }
    
    if (!mistralKey) {
      console.error("Missing MISTRAL_API_KEY environment variable");
      return NextResponse.json(
        { error: "Missing Mistral API key configuration" },
        { status: 500 }
      );
    }
    else{
        console.log("Achieved Mistral API key configuration successfully")
    }

    console.log("Stage 1: Initializing Architect (Gemini)...");
    // STAGE 1: THE ARCHITECT (Gemini 1.5 Flash)
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const architectPrompt = `You are a UX Architect for High-Fidelity Web Games.
User Request: "${query}"
GOAL: Design a "Split-Deck" Interactive Application.
REQUIRED BLUEPRINT:
1. THE CONSOLE: 3 State Mutators, 1 Live Feed.
2. THE VIEWPORT: Haptic Interaction, Visual Feedback.
3. GAME LOOP: Win Condition, Game Over Condition.
4. LIBRARY STACK: Choose Three.js, P5.js, or Matter.js. Include Tone.js.`;

    let blueprint = "";
    try {
      const architectResult = await model.generateContent(architectPrompt);
      blueprint = architectResult.response.text();
      console.log("✅ Stage 1: Blueprint generated successfully");
    } catch (geminiError: any) {
      console.error("❌ Gemini API Error:", geminiError.message);
      throw new Error(`Gemini API failed: ${geminiError.message}`);
    }

    console.log("Stage 2: Initializing Engineer (Mistral)...");
    // STAGE 2: THE ENGINEER (Mistral Codestral)
    const mistral = new Mistral({ apiKey: mistralKey });
    const coderPrompt = `You are the "Genesis Engine" Compiler.
BLUEPRINT SPEC:
${blueprint}
STRICT CODING RULES:
1. Single-File HTML with a Split View Layout using CSS Grid/Flex.
2. Interactivity: Console sliders MUST use 'oninput' to update a global 'GAME_STATE'. Canvas loop reads 'GAME_STATE'.
3. Unconventional Arsenal CDNs: Three.js, Tone.js, GSAP, Confetti.
OUTPUT: Return ONLY raw HTML code. No markdown.`;

    let chatResponse;
    try {
      chatResponse = await mistral.chat.complete({
        model: "codestral-latest",
        messages: [{ role: "user", content: coderPrompt }],
      });
      console.log("✅ Stage 2: Code generation response received");
    } catch (mistralError: any) {
      console.error("❌ Mistral API Error:", mistralError.message);
      throw new Error(`Mistral API failed: ${mistralError.message}`);
    }

    // TYPE-SAFE EXTRACTION: Handle both string and ContentChunk array formats safely
    const rawContent = chatResponse.choices?.[0]?.message?.content;
    console.log("Raw content type:", typeof rawContent);
    console.log("Is array?", Array.isArray(rawContent));
    console.log("Raw content:", rawContent);
    
    let rawCode = "";
    
    if (typeof rawContent === "string") {
      rawCode = rawContent;
    } else if (Array.isArray(rawContent)) {
      rawCode = rawContent.map((chunk: any) => chunk.text || "").join("");
    }

    if (!rawCode) {
      console.error("❌ No code content generated from Mistral");
      console.error("Full response:", JSON.stringify(chatResponse, null, 2));
      return NextResponse.json(
        { error: "Failed to generate code from AI - empty response" },
        { status: 500 }
      );
    }
    
    console.log("✅ Code extracted successfully, length:", rawCode.length);

    // CLEANUP: Remove markdown formatting and ensure standard HTML structure
    let cleanCode = rawCode.replace(/```html/g, "").replace(/```/g, "").trim();
    if (!cleanCode.includes("<!DOCTYPE html>")) cleanCode = "<!DOCTYPE html>\n" + cleanCode;

    console.log("✅ Stage Complete: Returning blueprint and code");
    console.log("Blueprint length:", blueprint.length);
    console.log("Code length:", cleanCode.length);
    return NextResponse.json({ blueprint, code: cleanCode });

  } catch (error: any) {
    console.error("❌ ERROR IN POST HANDLER:");
    console.error("Error Object:", error);
    console.error("Error Message:", error?.message);
    console.error("Error Name:", error?.name);
    console.error("Error Status:", error?.status);
    console.error("Error Response:", error?.response);
    
    const errorMessage = error?.message || JSON.stringify(error) || "Unknown error";
    const errorDetails = {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      constructor: error?.constructor?.name,
      response: error?.response ? JSON.stringify(error.response) : undefined,
      fullError: String(error)
    };
    
    console.error("Detailed Error Info:", errorDetails);
    
    return NextResponse.json(
      { 
        error: "Server error",
        details: errorMessage,
        errorInfo: errorDetails,
        blueprint: "System Failure.",
        code: `<h3>Error</h3><p>${errorMessage}</p>`
      },
      { status: 500 }
    );
  }
}