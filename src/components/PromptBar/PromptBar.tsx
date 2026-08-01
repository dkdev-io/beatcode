import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, Music2, Code } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import type { StudioJSONPayload } from '../../store/useStudioStore';

export const PromptBar: React.FC = () => {
  const { loadPresetFromJSON } = useStudioStore();
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Genre preset library for instant offline/online generation
  const GENRE_PRESETS: Record<string, StudioJSONPayload> = {
    'Peak Techno': {
      bpm: 132,
      description: 'Industrial Berlin Peak Time Techno with distorted 909 kick and resonant 303 acid lead',
      stems: [
        {
          name: '909 Drums',
          category: 'drums',
          muted: false,
          solo: false,
          volume: 0.9,
          bank: 'RolandTR909',
          pattern: 'bd*4, [~ sd]*2, hh*16',
          effects: [
            { id: 'fx-1', type: 'lpf', value: 0.95 },
            { id: 'fx-2', type: 'crush', value: 0.15 }
          ]
        },
        {
          name: 'Acid 303 Line',
          category: 'bass',
          muted: false,
          solo: false,
          volume: 0.85,
          bank: 'sawtooth',
          pattern: 'c1 [c1 c2] eb1 [f1 g1]',
          effects: [
            { id: 'fx-3', type: 'lpf', value: 0.45 },
            { id: 'fx-4', type: 'room', value: 0.3 }
          ]
        },
        {
          name: 'Space Perc',
          category: 'lead',
          muted: false,
          solo: false,
          volume: 0.65,
          bank: 'gm_lead',
          pattern: '~ [g4 c5] ~ e5',
          effects: [
            { id: 'fx-5', type: 'delay', value: 0.5 },
            { id: 'fx-6', type: 'room', value: 0.6 }
          ]
        }
      ]
    },
    'Synthwave Drive': {
      bpm: 115,
      description: '80s Outrun Synthwave with punchy 808 beats, driving bass synth and gated pads',
      stems: [
        {
          name: '808 Drums',
          category: 'drums',
          muted: false,
          solo: false,
          volume: 0.85,
          bank: 'RolandTR808',
          pattern: 'bd [~ bd] sd [~ bd], [hh*8]',
          effects: [{ id: 'fx-10', type: 'room', value: 0.25 }]
        },
        {
          name: 'Synth Bass',
          category: 'bass',
          muted: false,
          solo: false,
          volume: 0.8,
          bank: 'sawtooth',
          pattern: 'c2*8',
          effects: [
            { id: 'fx-11', type: 'lpf', value: 0.6 },
            { id: 'fx-12', type: 'crush', value: 0.1 }
          ]
        },
        {
          name: 'Arp Chords',
          category: 'lead',
          muted: false,
          solo: false,
          volume: 0.7,
          bank: 'square',
          pattern: '[c4 e4 g4 b4]*2',
          effects: [
            { id: 'fx-13', type: 'delay', value: 0.4 },
            { id: 'fx-14', type: 'room', value: 0.4 }
          ]
        }
      ]
    },
    'Deep House': {
      bpm: 124,
      description: 'Warm Groovy Deep House track with soulful chord stabs and walking sub bass',
      stems: [
        {
          name: 'House Drums',
          category: 'drums',
          muted: false,
          solo: false,
          volume: 0.85,
          bank: 'RolandTR909',
          pattern: 'bd*4, [~ sd]*2, [~ hh]*4',
          effects: [{ id: 'fx-20', type: 'lpf', value: 0.85 }]
        },
        {
          name: 'Deep Sub',
          category: 'bass',
          muted: false,
          solo: false,
          volume: 0.85,
          bank: 'sawtooth',
          pattern: 'c1 [~ c1] g1 f1',
          effects: [{ id: 'fx-21', type: 'lpf', value: 0.35 }]
        },
        {
          name: 'Soul Chords',
          category: 'pad',
          muted: false,
          solo: false,
          volume: 0.7,
          bank: 'gm_lead',
          pattern: '~ [c4,eb4,g4,bb4] ~ [f4,ab4,c5]',
          effects: [
            { id: 'fx-22', type: 'room', value: 0.5 },
            { id: 'fx-23', type: 'delay', value: 0.3 }
          ]
        }
      ]
    },
    'Lofi Chill': {
      bpm: 85,
      description: 'Mellow Lofi Hip-Hop with dusty vinyl drums, sub bass, and warm EP keys',
      stems: [
        {
          name: 'Dusty Beat',
          category: 'drums',
          muted: false,
          solo: false,
          volume: 0.8,
          bank: 'RolandTR808',
          pattern: 'bd ~ sd [~ bd], [hh*4]',
          effects: [
            { id: 'fx-30', type: 'crush', value: 0.3 },
            { id: 'fx-31', type: 'lpf', value: 0.7 }
          ]
        },
        {
          name: 'Warm Bass',
          category: 'bass',
          muted: false,
          solo: false,
          volume: 0.75,
          bank: 'sawtooth',
          pattern: 'f1 ~ c2 ~',
          effects: [{ id: 'fx-32', type: 'lpf', value: 0.4 }]
        },
        {
          name: 'Mellow Keys',
          category: 'lead',
          muted: false,
          solo: false,
          volume: 0.65,
          bank: 'gm_lead',
          pattern: '[c4,e4,g4] [d4,f4,a4] [e4,g4,b4]',
          effects: [
            { id: 'fx-33', type: 'delay', value: 0.3 },
            { id: 'fx-34', type: 'room', value: 0.6 }
          ]
        }
      ]
    }
  };

  const handleGenerate = (customPrompt?: string) => {
    const query = customPrompt || promptText;
    if (!query) return;

    setIsGenerating(true);

    setTimeout(() => {
      // Find closest matching preset or build dynamic arrangement
      const matchedName = Object.keys(GENRE_PRESETS).find(
        (key) => key.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(key.toLowerCase())
      );

      const targetPayload = matchedName ? GENRE_PRESETS[matchedName] : GENRE_PRESETS['Peak Techno'];
      loadPresetFromJSON(targetPayload);
      setIsGenerating(false);
    }, 600);
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
        {Object.keys(GENRE_PRESETS).map((genre) => (
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
