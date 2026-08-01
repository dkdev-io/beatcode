import React, { useState } from 'react';
import { Volume2, VolumeX, Trash2, BookmarkPlus, GripVertical, Plus, X, Grid } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStudioStore } from '../../store/useStudioStore';
import { StepSequencer } from '../StepSequencer/StepSequencer';
import type { StemChannel, StemEffect } from '../../store/useStudioStore';

interface StemRowProps {
  stem: StemChannel;
}

export const StemRow: React.FC<StemRowProps> = ({ stem }) => {
  const {
    updateStem,
    toggleMute,
    toggleSolo,
    removeStem,
    updateEffect,
    addEffect,
    removeEffect,
    saveStemToPalette
  } = useStudioStore();

  const [showAddFx, setShowAddFx] = useState(false);
  const [showSeqGrid, setShowSeqGrid] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const categoryColorMap: Record<string, string> = {
    drums: 'border-l-rose-500 bg-rose-950/20 hover:bg-rose-950/30',
    bass: 'border-l-amber-500 bg-amber-950/20 hover:bg-amber-950/30',
    lead: 'border-l-cyan-500 bg-cyan-950/20 hover:bg-cyan-950/30',
    pad: 'border-l-indigo-500 bg-indigo-950/20 hover:bg-indigo-950/30',
    fx: 'border-l-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/30',
  };

  const categoryBadgeMap: Record<string, string> = {
    drums: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    bass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    lead: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    pad: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    fx: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  const availableFxTypes: StemEffect['type'][] = ['lpf', 'hpf', 'delay', 'room', 'crush', 'gain'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col gap-3 p-4 rounded-xl border border-zinc-800/80 border-l-4 shadow-lg backdrop-blur-md transition-all ${
        categoryColorMap[stem.category] || 'border-l-zinc-500 bg-zinc-900/40'
      } ${stem.muted ? 'opacity-40 grayscale-[40%]' : 'opacity-100'} ${
        isDragging ? 'shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-500/50 scale-[1.01]' : ''
      }`}
    >
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
        {/* Drag Handle & Track Header */}
        <div className="flex items-center gap-3 w-full xl:w-56 shrink-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-300 transition-colors p-1"
            title="Drag to reorder channel"
          >
            <GripVertical size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={stem.name}
                onChange={(e) => updateStem(stem.id, { name: e.target.value })}
                className="font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-cyan-500 focus:outline-none px-1 text-sm md:text-base w-28 md:w-32 truncate"
              />
              <select
                value={stem.category}
                onChange={(e) => updateStem(stem.id, { category: e.target.value as any })}
                className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded border ${
                  categoryBadgeMap[stem.category] || 'bg-zinc-800 text-zinc-300'
                } focus:outline-none cursor-pointer bg-zinc-900`}
              >
                <option value="drums">Drums</option>
                <option value="bass">Bass</option>
                <option value="lead">Lead</option>
                <option value="pad">Pad</option>
                <option value="fx">FX</option>
              </select>
            </div>
          </div>

          {/* Mute & Solo Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleMute(stem.id)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                stem.muted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm shadow-red-500/20'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              title="Mute Track"
            >
              M
            </button>
            <button
              onClick={() => toggleSolo(stem.id)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                stem.solo
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md shadow-amber-500/30 ring-1 ring-amber-400'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              title="Solo Track"
            >
              S
            </button>
          </div>
        </div>

        {/* Pattern Input & Sound Bank Selector */}
        <div className="flex-1 flex flex-col gap-1 w-full">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>Strudel Mini-Notation</span>
              <span className="text-[9px] text-cyan-400/70 font-normal">e.g. bd*4, [~ sd]*2</span>
            </label>
            <button
              onClick={() => setShowSeqGrid(!showSeqGrid)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-colors ${
                showSeqGrid ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Grid size={11} /> 16-Step Grid
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={stem.pattern}
              onChange={(e) => updateStem(stem.id, { pattern: e.target.value })}
              placeholder='e.g., bd*4, [~ sd]*2'
              className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-xs md:text-sm text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
            />
            <input
              type="text"
              value={stem.bank || ''}
              onChange={(e) => updateStem(stem.id, { bank: e.target.value })}
              placeholder="Bank (e.g. 909)"
              className="w-24 md:w-32 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Volume & FX Controls */}
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto py-1 scrollbar-thin">
          {/* Volume Slider */}
          <div className="flex flex-col items-center gap-1 w-20 shrink-0 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-400">
                {stem.volume === 0 ? <VolumeX size={11} className="text-red-400" /> : <Volume2 size={11} />}
              </span>
              <span className="text-cyan-400 font-bold">{Math.round(stem.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={stem.volume}
              onChange={(e) => updateStem(stem.id, { volume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-500">VOL</span>
          </div>

          {/* Dynamic FX Controls */}
          {stem.effects.map((fx) => (
            <div key={fx.id} className="relative group/fx flex flex-col items-center gap-1 w-20 shrink-0 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
              <div className="flex items-center justify-between w-full text-[10px] font-mono">
                <span className="uppercase text-[9px] font-semibold text-indigo-400">{fx.type}</span>
                <span className="text-indigo-300 font-bold">{Math.round(fx.value * 100)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={fx.value}
                onChange={(e) => updateEffect(stem.id, fx.id, parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
              <button
                onClick={() => removeEffect(stem.id, fx.id)}
                className="absolute -top-1.5 -right-1.5 hidden group-hover/fx:flex bg-red-500 text-white rounded-full p-0.5 text-[8px] hover:bg-red-600 transition-colors shadow-sm"
                title="Remove effect"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {/* Add FX Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowAddFx(!showAddFx)}
              className="flex flex-col items-center justify-center w-10 h-14 rounded-lg border border-dashed border-zinc-700 hover:border-indigo-400 text-zinc-500 hover:text-indigo-300 bg-zinc-950/20 hover:bg-indigo-950/30 transition-all text-xs"
              title="Add Audio Effect"
            >
              <Plus size={14} />
              <span className="text-[8px] font-mono uppercase mt-0.5">FX</span>
            </button>

            {showAddFx && (
              <div className="absolute right-0 bottom-full mb-2 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-30 font-mono text-xs">
                <div className="px-2 py-1 text-[10px] uppercase text-zinc-500 font-bold border-b border-zinc-800">
                  Select Effect
                </div>
                {availableFxTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      addEffect(stem.id, type);
                      setShowAddFx(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-indigo-600/30 hover:text-white uppercase text-[11px] transition-colors"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Utility Buttons */}
        <div className="flex xl:flex-col items-center justify-end gap-1 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-zinc-800/60">
          <button
            onClick={() => saveStemToPalette(stem.id)}
            title="Save Stem to Library Palette"
            className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <BookmarkPlus size={16} />
          </button>
          <button
            onClick={() => removeStem(stem.id)}
            title="Delete Channel"
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Expandable Step Sequencer Grid */}
      {showSeqGrid && <StepSequencer stem={stem} />}
    </div>
  );
};
