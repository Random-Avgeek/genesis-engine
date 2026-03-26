"use client";

import { useState } from "react";
import { Terminal, Play, Cpu, Server, Layers, Library } from "lucide-react";
import { benchmarkGames } from "@/lib/benchmarks";

export default function GenesisEngine() {
  const [query, setQuery] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [status, setStatus] = useState("SYSTEM ONLINE");
  const [gameData, setGameData] = useState({
    title: "",
    code: "",
    blueprint: ""
  });

  // Instantly loads a pre-compiled benchmark game
  const loadBenchmark = (key: keyof typeof benchmarkGames) => {
    const game = benchmarkGames[key];
    setGameData({
      title: game.title,
      blueprint: game.blueprint,
      code: game.code
    });
    setStatus(`>> LOADED BENCHMARK: ${game.title}`);
  };

  // Handles the 3-Tier AI Generation Pipeline
  const handleExecuteBuild = async () => {
    if (!query) return;
    
    setIsBuilding(true);
    setStatus(">> INITIALIZING 3-TIER HYBRID PIPELINE...");
    
    try {
      setStatus(">> STAGE 1: GEMINI ARCHITECT REFINING PROMPT...");
      
      const fetchPromise = fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      setTimeout(() => setStatus(">> STAGE 2: GEMINI DRAFTING INITIAL ENGINE CODE..."), 2500);
      setTimeout(() => setStatus(">> STAGE 3: MISTRAL POLISHING & WIRING EVENTS..."), 6000);

      const response = await fetchPromise;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setStatus(">> RECEIVING FINAL SCHEMATICS...");
      const data = await response.json();

      setGameData({
        title: query,
        blueprint: data.blueprint,
        code: data.code
      });

      setStatus(">> SYSTEM ONLINE: RENDER COMPLETE");

    } catch (error: any) {
      console.error("Build failed:", error);
      setStatus(">> SYSTEM FAILURE: FALLBACK TRIGGERED");
      
      setGameData({
        title: "System Error",
        blueprint: "Generation failed. Failsafe triggered.",
        code: `
          <div style="color: #ff3333; font-family: monospace; padding: 20px; background: black; height: 100vh;">
            <h3>⚠️ CORE SYSTEM FAILURE</h3>
            <p>${error.message || "Could not connect to the Generative APIs."}</p>
            <p>Check your terminal for detailed logs.</p>
          </div>
        `
      });
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans">
      
      {/* LEFT PANEL: THE CONSOLE */}
      <div className="w-full md:w-[400px] border-r border-gray-800 bg-[#0a0a0a] p-6 flex flex-col z-10 shadow-2xl shadow-emerald-900/10 overflow-y-auto">
        
        {/* Header */}
        <div className="mb-6 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black tracking-tighter">
            GENESIS <span className="text-[#00ff9d]">//</span> HYBRID
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            [ 3-TIER PIPELINE SYNCHRONIZATION ]
          </p>
        </div>

        {/* Benchmark Library Section */}
        <div className="mb-8 border-b border-gray-800 pb-6">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2 mb-3">
            <Library size={14} /> Gold Standard Library
          </h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => loadBenchmark('projectile')}
              className="text-left text-sm font-mono text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 p-2 transition-colors"
            >
              &gt; LOAD: Projectile Mechanics
            </button>
            <button 
              onClick={() => loadBenchmark('chem')}
              className="text-left text-sm font-mono text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 p-2 transition-colors"
            >
              &gt; LOAD: Isotope Stabilizer
            </button>
            <button 
              onClick={() => loadBenchmark('coder')}
              className="text-left text-sm font-mono text-[#00ff9d] bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 p-2 transition-colors"
            >
              &gt; LOAD: Syntax Sentinel
            </button>
            <button 
              onClick={() => loadBenchmark('fantasy')}
              className="text-left text-sm font-mono text-[#ffaa00] bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 p-2 transition-colors"
            >
              &gt; LOAD: Rune Weaver
            </button>
            <button 
              onClick={() => loadBenchmark('racer')}
              className="text-left text-sm font-mono text-[#ff0055] bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 p-2 transition-colors"
            >
              &gt; LOAD: Math Drift
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-8 font-mono text-xs font-bold tracking-wider">
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <Cpu size={16} /> <span>STAGE 1: ARCHITECT (GEMINI)</span>
          </div>
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <Layers size={16} /> <span>STAGE 2: BUILDER (GEMINI)</span>
          </div>
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <Server size={16} /> <span>STAGE 3: POLISHER (MISTRAL)</span>
          </div>
        </div>

        {/* Input Section */}
        <div className="flex-grow space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Enter Parameter
            </label>
            <div className="relative">
              <Terminal className="absolute left-3 top-3.5 text-[#00ff9d]" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Cyberpunk City Builder"
                className="w-full bg-[#111] border border-gray-800 border-l-[3px] border-l-[#00ff9d] text-[#00ff9d] pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ff9d] transition-colors"
                disabled={isBuilding}
              />
            </div>
          </div>

          <button
            onClick={handleExecuteBuild}
            disabled={isBuilding || !query}
            className="w-full bg-[#00ff9d] hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 px-6 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ clipPath: "polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%)" }}
          >
            {isBuilding ? (
              <span className="animate-pulse">Compiling...</span>
            ) : (
              <>
                <Play fill="currentColor" size={18} /> Execute Build
              </>
            )}
          </button>
        </div>

        {/* Live Status Console */}
        <div className="mt-6">
          <div className="bg-black border border-gray-800 p-3 font-mono text-xs text-gray-400 min-h-[60px] flex items-center">
            {status}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: THE VIEWPORT */}
      <div className="flex-grow bg-black relative flex items-center justify-center overflow-hidden">
        {!gameData.code ? (
          <div className="text-gray-800 font-mono tracking-widest flex flex-col items-center gap-4">
            <div className="w-24 h-24 border border-gray-800 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-1 h-1 bg-[#00ff9d] rounded-full shadow-[0_0_15px_#00ff9d]"></div>
            </div>
            AWAITING INPUT
          </div>
        ) : (
          <iframe
            srcDoc={gameData.code}
            className="w-full h-full border-none bg-white"
            title="Genesis Engine Viewport"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>

    </div>
  );
}