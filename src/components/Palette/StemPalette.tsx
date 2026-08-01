import React from 'react';
import { Library, Plus, Trash2, BookmarkCheck, Sparkles } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import type { StemChannel } from '../../store/useStudioStore';

export const StemPalette: React.FC = () => {
  const { savedPalette, removeSavedStem, addSavedStemToRack, addStem } = useStudioStore();

  const PREMADE_BLOCKS: Omit<StemChannel, 'id'>[] = [
    {
      name: 'TR-909 Kick & Hat',
      category: 'drums',
      muted: false,
      solo: false,
      volume: 0.9,
      bank: 'RolandTR909',
      pattern: 'bd*4, [hh*8]',
      effects: [{ id: 'fx-b1', type: 'lpf', value: 0.9 }]
    },
    {
      name: 'Resonant 303 Bass',
      category: 'bass',
      muted: false,
      solo: false,
      volume: 0.8,
      bank: 'sawtooth',
      pattern: 'c2 eb2 g2 bb2',
      effects: [
        { id: 'fx-b2', type: 'lpf', value: 0.4 },
        { id: 'fx-b3', type: 'crush', value: 0.2 }
      ]
    },
    {
      name: 'Cyber Synth Lead',
      category: 'lead',
      muted: false,
      solo: false,
      volume: 0.7,
      bank: 'square',
      pattern: 'g4 c5 e5 g5',
      effects: [{ id: 'fx-b4', type: 'delay', value: 0.4 }]
    },
    {
      name: 'Ambient Warm Pad',
      category: 'pad',
      muted: false,
      solo: false,
      volume: 0.65,
      bank: 'square',
      pattern: '[c3,g3,c4] ~ [f3,c4,f4]',
      effects: [{ id: 'fx-b5', type: 'room', value: 0.6 }]
    }
  ];

  return (
    <div className="flex flex-col gap-4 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-xl backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Library size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100 tracking-tight flex items-center gap-2">
              Stem Palette & Block Library
            </h3>
            <p className="text-xs text-zinc-400">Save custom channels & reuse pre-configured sound blocks</p>
          </div>
        </div>
      </div>

      {/* User Saved Stems Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
          <BookmarkCheck size={13} className="text-cyan-400" />
          Saved User Stems ({savedPalette.length})
        </span>

        {savedPalette.length === 0 ? (
          <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 font-mono">
            No saved stems yet. Click the bookmark icon on any Stem Row to save it here!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedPalette.map((stem) => (
              <div
                key={stem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all group"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs text-zinc-200 truncate">{stem.name}</div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate">{stem.pattern}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => addSavedStemToRack(stem)}
                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono font-medium flex items-center gap-1 transition-colors"
                    title="Add to active Stem Rack"
                  >
                    <Plus size={12} /> Add
                  </button>
                  <button
                    onClick={() => removeSavedStem(stem.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove from palette"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-made Sound Block Templates */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/60">
        <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-purple-400" />
          Starter Sound Blocks
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PREMADE_BLOCKS.map((block, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:border-indigo-500/40 transition-all"
            >
              <div className="min-w-0 pr-2">
                <div className="font-bold text-xs text-zinc-300 truncate">{block.name}</div>
                <div className="text-[10px] font-mono text-indigo-400 truncate">{block.pattern}</div>
              </div>
              <button
                onClick={() => addStem(block)}
                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono font-medium flex items-center gap-1 shrink-0 transition-colors"
                title="Add block to Stem Rack"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
