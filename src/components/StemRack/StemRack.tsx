import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { Plus, SlidersHorizontal, Layers } from 'lucide-react';
import { StemRow } from './StemRow';
import { useStudioStore } from '../../store/useStudioStore';
import type { SoundCategory } from '../../store/useStudioStore';

export const StemRack: React.FC = () => {
  const { stems, reorderStems, addStem } = useStudioStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stems.findIndex((item) => item.id === active.id);
      const newIndex = stems.findIndex((item) => item.id === over.id);
      reorderStems(arrayMove(stems, oldIndex, newIndex));
    }
  };

  const handleAddNewStem = (category: SoundCategory = 'lead') => {
    const defaultPatterns: Record<SoundCategory, { name: string; pattern: string; bank: string }> = {
      drums: { name: 'Drums', pattern: 'bd sd [hh*4] sd', bank: 'RolandTR909' },
      bass: { name: 'Sub Bass', pattern: 'c1 [~ c1] g1 f1', bank: 'sawtooth' },
      lead: { name: 'Synth Lead', pattern: 'c4 e4 g4 b4', bank: 'gm_lead' },
      pad: { name: 'Atmosphere Pad', pattern: '[c3,e3,g3] ~ [f3,a3,c4] ~', bank: 'sawtooth' },
      fx: { name: 'Glitch FX', pattern: '~ ~ ~ noise', bank: 'sawtooth' },
    };

    const config = defaultPatterns[category];
    addStem({
      name: config.name,
      category,
      muted: false,
      solo: false,
      volume: 0.75,
      bank: config.bank,
      pattern: config.pattern,
      effects: [
        { id: `fx-${Date.now()}`, type: 'lpf', value: 0.8 }
      ]
    });
  };

  return (
    <div className="flex flex-col gap-4 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-xl backdrop-blur-lg">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              Stem Rack & Mixer
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-normal">
                {stems.length} channels
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Drag channels to reorder • Tweak pattern strings & DSP effect parameters
            </p>
          </div>
        </div>

        {/* Quick Add Stem Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleAddNewStem('drums')}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1"
          >
            <Plus size={12} /> Drums
          </button>
          <button
            onClick={() => handleAddNewStem('bass')}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1"
          >
            <Plus size={12} /> Bass
          </button>
          <button
            onClick={() => handleAddNewStem('lead')}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center gap-1"
          >
            <Plus size={12} /> Lead
          </button>
          <button
            onClick={() => handleAddNewStem('pad')}
            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-1"
          >
            <Plus size={12} /> Pad
          </button>
        </div>
      </div>

      {/* Stem Rows Container with Drag-and-Drop */}
      {stems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-xl text-center">
          <Layers size={36} className="text-zinc-600 mb-3" />
          <p className="text-zinc-400 font-medium text-sm">No stems currently in rack</p>
          <p className="text-zinc-500 text-xs mt-1">Add a new channel above or generate a track using LLM Copilot</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stems.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {stems.map((stem) => (
                <StemRow key={stem.id} stem={stem} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
