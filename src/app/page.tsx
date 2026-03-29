"use client";

import { useState } from "react";
import { benchmarkGames } from "@/lib/benchmarks";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameData, setGameData] = useState<{
    title: string;
    blueprint: string;
    code: string;
  } | null>(null);

  // Loads a game from your local benchmarks.ts library
  const loadBenchmark = (key: keyof typeof benchmarkGames) => {
    setGameData(benchmarkGames[key]);
  };

  // Triggers the Gemini + Groq Hybrid Pipeline
  const handleExecuteBuild = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGameData(null); // Clears the viewport to show a loading state

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Core System Failure");

      // Inject the AI's response into the viewport
      setGameData({
        title: "Custom AI Generation",
        blueprint: data.blueprint,
        code: data.code,
      });
      
    } catch (err: any) {
      setGameData({
        title: "System Error",
        blueprint: "Execution halted due to pipeline failure.",
        code: `<div style="color:#ff3333; padding:20px; font-family:monospace; background:#050505; height:100vh;">
                <h3>CORE SYSTEM FAILURE</h3>
                <p>${err.message}</p>
               </div>`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex h-screen bg-[#050505] text-white font-mono overflow-hidden">
      
      {/* LEFT PANEL: CONSOLE */}
      <div className="w-[400px] border-r border-[#333] bg-[#0a0a0a] p-6 flex flex-col shadow-[5px_0_30px_rgba(0,0,0,0.5)] z-10 overflow-y-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-[#333] pb-4">
          <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            GENESIS <span className="text-[#00ff9d]">//</span> HYBRID
          </h1>
          <p className="text-xs text-[#666] tracking-widest mt-2">
            [ 3-TIER PIPELINE SYNCHRONIZATION ]
          </p>
        </div>

        {/* GOLD STANDARD LIBRARY */}
        <div className="mb-8">
          <div className="text-xs text-[#888] mb-3 tracking-widest flex items-center gap-2">
            <span>||\</span> GOLD STANDARD LIBRARY
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => loadBenchmark('projectile')}
              className="text-left text-sm text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] p-3 transition-colors"
            >
              &gt; LOAD: Projectile Mechanics
            </button>
            <button 
              onClick={() => loadBenchmark('chem')}
              className="text-left text-sm text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] p-3 transition-colors"
            >
              &gt; LOAD: Isotope Stabilizer
            </button>
            <button 
              onClick={() => loadBenchmark('coder')}
              className="text-left text-sm text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] p-3 transition-colors"
            >
              &gt; LOAD: Syntax Sentinel
            </button>
            <button
              onClick={() => loadBenchmark('fantasy')}
              className="text-left text-sm text-[#ffaa00] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] p-3 transition-colors"
            >
              &gt; LOAD: Rune Weaver
            </button>
          </div>
        </div>

        {/* PIPELINE STAGES */}
        <div className="flex flex-col gap-3 my-6 font-bold text-xs tracking-wider">
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <span className="text-lg">⚙️</span> STAGE 1: ARCHITECT (GEMINI 2.5)
          </div>
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <span className="text-lg">🛠️</span> STAGE 2: BUILDER (LLAMA 3.3)
          </div>
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <span className="text-lg">🧹</span> STAGE 3: LINTER (MIXTRAL 8x7B)
          </div>
        </div>

        {/* CUSTOM GENERATION INPUT */}
        <div className="mt-auto">
          <div className="text-xs text-[#888] mb-2 tracking-widest">ENTER PARAMETER</div>
          <div className="relative">
            <span className="absolute top-3 left-3 text-[#00ff9d]">&gt;_</span>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A cyberpunk typing game about sorting arrays..."
              className="w-full bg-[#111] border border-[#333] text-[#00ff9d] p-3 pl-8 text-sm focus:outline-none focus:border-[#00ff9d] resize-none h-24 transition-colors placeholder:text-[#333]"
              spellCheck="false"
            />
          </div>
          
          <button 
            onClick={handleExecuteBuild}
            disabled={isGenerating || !prompt}
            className="w-full mt-4 bg-[#00ff9d] text-black font-black text-lg p-4 tracking-widest uppercase disabled:bg-[#333] disabled:text-[#555] transition-all hover:translate-y-[-2px] hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]"
            style={{ clipPath: 'polygon(3% 0, 100% 0, 100% 70%, 97% 100%, 0 100%, 0 30%)' }}
          >
            {isGenerating ? "COMPILING..." : "▶ EXECUTE BUILD"}
          </button>
        </div>

        {/* SYSTEM LOG */}
        <div className="mt-6 border border-[#333] bg-[#000] p-3 text-xs text-[#555]">
          &gt;&gt; SYSTEM LOG:
          <br/>
          {isGenerating ? (
            <span className="text-[#ffaa00] animate-pulse">Establishing neural link...</span>
          ) : gameData ? (
            <span className="text-[#00ff9d]">
              Loaded: {gameData.title}
              <br/>
              <span className="text-[#444] leading-relaxed block mt-1">{gameData.blueprint}</span>
            </span>
          ) : (
            <span>Awaiting input sequence.</span>
          )}
        </div>

      </div>

      {/* RIGHT PANEL: VIEWPORT */}
      <div className="flex-grow flex flex-col relative bg-[#020202]">
        


        {/* IFRAME RENDERER */}
        <div className="flex-grow relative">
          {gameData ? (
            <iframe
              key={gameData.title} // CRITICAL: Forces full unmount to clear Kaplay cache
              srcDoc={gameData.code}
              className="w-full h-full border-none"
              title="Genesis Engine Viewport"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#333] border-4 border-dashed border-[#111] m-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)]">
              <span className="text-6xl mb-4 opacity-50">👁️‍🗨️</span>
              <p className="tracking-widest">VIEWPORT OFFLINE</p>
            </div>
          )}
        </div>
        
        {/* LOADING OVERLAY */}
        {isGenerating && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#333] border-t-[#00ff9d] rounded-full animate-spin mb-6"></div>
            <div className="text-[#00ff9d] font-bold tracking-widest animate-pulse">SYNTHESIZING ARCHITECTURE...</div>
          </div>
        )}

      </div>
    </main>
  );
}