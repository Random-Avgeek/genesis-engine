"use client";

import { useState } from "react";
import { Terminal, Play, Cpu, Server } from "lucide-react";

export default function GenesisEngine() {
  // State mapped to our future database structure
  const [query, setQuery] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [status, setStatus] = useState("SYSTEM ONLINE");
  const [gameData, setGameData] = useState({
    title: "",
    code: "",
    blueprint: ""
  });

const handleExecuteBuild = async () => {
    if (!query) return;
    
    setIsBuilding(true);
    setStatus(">> INITIALIZING HYBRID PIPELINE...");
    
    try {
      setStatus(">> TRANSMITTING TO ORBITAL COMMAND (API)...");
      
      // Make the actual call to Phase 2 API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        const apiErrorMessage = data.details || data.error || `HTTP ${response.status}`;
        const apiErrorInfo = data.errorInfo ? JSON.stringify(data.errorInfo, null, 2) : "No additional info";
        throw new Error(`API Error: ${apiErrorMessage}\n\nServer Details:\n${apiErrorInfo}`);
      }

      setStatus(">> RECEIVING SCHEMATICS & COMPILING CODE...");

      // Update state with actual AI output, aligning with the database schema
      setGameData({
        title: query,
        blueprint: data.blueprint,
        code: data.code
      });

      setStatus(">> SYSTEM ONLINE: RENDER COMPLETE");

    } catch (error: any) {
      console.error("Build failed:", error);
      setStatus(">> SYSTEM FAILURE: FALLBACK TRIGGERED");
      
      // The Failsafe Mechanism
      const errorDetails = error.message || "Could not connect to the Generative APIs.";
      setGameData({
        title: "System Error",
        blueprint: "Generation failed. Failsafe triggered.",
        code: `
          <div style="color: #ff3333; font-family: monospace; padding: 20px; background: #1a1a1a; border-radius: 8px;">
            <h3>⚠️ CORE SYSTEM FAILURE</h3>
            <p><strong>Error:</strong> ${errorDetails}</p>
            <p style="font-size: 12px; margin-top: 15px;"><strong>Troubleshooting:</strong></p>
            <ul style="margin-left: 20px; font-size: 12px;">
              <li>Check if API keys in .env.local are valid</li>
              <li>Verify internet connection</li>
              <li>Check NetworkTab in DevTools for API response errors</li>
              <li>Check terminal logs for detailed error messages</li>
            </ul>
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; color: #00ff9d;">Click to see full error details</summary>
              <pre style="background: #0a0a0a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-top: 10px;">${JSON.stringify(error, null, 2)}</pre>
            </details>
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
      <div className="w-full md:w-[400px] border-r border-gray-800 bg-[#0a0a0a] p-6 flex flex-col">
        
        {/* Header */}
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black tracking-tighter">
            GENESIS <span className="text-[#00ff9d]">//</span> HYBRID
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            [ CONSOLE + VIEWPORT SYNCHRONIZATION ]
          </p>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-8 font-mono text-sm">
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <Cpu size={16} /> <span>ARCHITECT: STANDBY</span>
          </div>
          <div className="flex items-center gap-3 text-[#00ff9d]">
            <Server size={16} /> <span>ENGINEER: STANDBY</span>
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
        <div className="mt-auto pt-6">
          <div className="bg-black border border-gray-800 p-3 font-mono text-xs text-gray-400">
            {status}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: THE VIEWPORT */}
      <div className="flex-grow bg-black relative flex items-center justify-center overflow-hidden">
        {!gameData.code ? (
          <div className="text-gray-800 font-mono tracking-widest flex flex-col items-center gap-4">
            <div className="w-24 h-24 border border-gray-800 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
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