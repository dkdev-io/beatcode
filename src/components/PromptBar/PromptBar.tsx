import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, Music2, Code } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { generateTrackAST } from '../../lib/llm';

export const PromptBar: React.FC = () => {
  const { loadPresetFromJSON } = useStudioStore();
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick preset shortcuts
  const QUICK_PRESETS = ['Peak Techno', 'Synthwave Drive', 'Acid 303', 'Deep House', 'Lofi Chill', 'DnB Breakbeat'];

  const handleGenerate = async (customPrompt?: string) => {
    const query = customPrompt || promptText;
    if (!query) return;

    setIsGenerating(true);

    try {
      const payload = await generateTrackAST(query);
      loadPresetFromJSON(payload);
    } catch (err) {
      console.error('Track AST generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl shadow-xl backdrop-blur-lg">
      {/* Input Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-400 shrink-0">
          <Sparkles size={20} className="animate-pulse" />
          <span className="font-bold text-sm text-zinc-200">LLM Studio Copilot</span>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe a track style, e.g. '80s Synthwave with heavy bass and gated arp'..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 shrink-0"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Decomposing AST...
            </>
          ) : (
            <>
              <Wand2 size={16} /> Generate Track AST
            </>
          )}
        </button>
      </div>

      {/* Quick Genre Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none">
        <span className="text-[10px] font-mono uppercase text-zinc-500 shrink-0 flex items-center gap-1">
          <Music2 size={12} /> Presets:
        </span>
        {QUICK_PRESETS.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenerate(genre)}
            className="px-3 py-1 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-cyan-300 font-mono text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Code size={12} className="text-cyan-400/70" />
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};
