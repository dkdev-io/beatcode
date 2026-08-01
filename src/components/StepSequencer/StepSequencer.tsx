import React from 'react';
import { Grid } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import type { StemChannel } from '../../store/useStudioStore';

interface StepSequencerProps {
  stem: StemChannel;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({ stem }) => {
  const { updateStem } = useStudioStore();
  const totalSteps = 16;

  // Simple parser to check which of 16 steps are currently active in basic mini-notation
  const getActiveStepsFromPattern = (pattern: string): boolean[] => {
    const steps = new Array(totalSteps).fill(false);
    if (!pattern) return steps;

    // Standard 4/4 four-on-the-floor kick pattern: "bd*4"
    if (pattern.includes('*4')) {
      steps[0] = steps[4] = steps[8] = steps[12] = true;
    }
    if (pattern.includes('*8') || pattern.includes('hh*8')) {
      for (let i = 0; i < 16; i += 2) steps[i] = true;
    }
    if (pattern.includes('*16') || pattern.includes('hh*16')) {
      for (let i = 0; i < 16; i++) steps[i] = true;
    }

    // Direct step hits detection
    if (pattern.includes('bd')) steps[0] = true;
    if (pattern.includes('sd')) steps[4] = steps[12] = true;

    return steps;
  };

  const activeSteps = getActiveStepsFromPattern(stem.pattern);

  const toggleStep = (stepIndex: number) => {
    const newSteps = [...activeSteps];
    newSteps[stepIndex] = !newSteps[stepIndex];

    // Convert step array back to clean Strudel mini-notation string
    let newPattern = '';
    if (stem.category === 'drums') {
      const activeIndices = newSteps.map((active, idx) => (active ? idx : -1)).filter((idx) => idx !== -1);
      if (activeIndices.length === 0) {
        newPattern = '~';
      } else if (activeIndices.every((idx) => idx % 4 === 0) && activeIndices.length === 4) {
        newPattern = 'bd*4';
      } else if (activeIndices.every((idx) => idx % 2 === 0) && activeIndices.length === 8) {
        newPattern = 'hh*8';
      } else {
        const tokens = newSteps.map((act) => (act ? (stem.name.toLowerCase().includes('sd') ? 'sd' : 'bd') : '~'));
        newPattern = tokens.join(' ');
      }
    } else {
      const noteMap = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'c5'];
      const tokens = newSteps.map((act, idx) => (act ? `${noteMap[idx % noteMap.length]}3` : '~'));
      newPattern = tokens.join(' ');
    }

    updateStem(stem.id, { pattern: newPattern });
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 bg-zinc-950/90 border border-zinc-800/80 rounded-xl mt-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1 font-semibold uppercase text-zinc-300">
          <Grid size={12} className="text-cyan-400" /> 16-Step Pattern Grid ({stem.name})
        </span>
        <span className="text-[9px] text-zinc-500">Click steps to toggle hits</span>
      </div>

      <div className="grid grid-cols-16 gap-1">
        {Array.from({ length: totalSteps }).map((_, stepIdx) => {
          const isBeatMarker = stepIdx % 4 === 0;
          const isActive = activeSteps[stepIdx];

          return (
            <button
              key={stepIdx}
              onClick={() => toggleStep(stepIdx)}
              className={`h-7 rounded transition-all font-mono text-[9px] font-bold flex items-center justify-center border ${
                isActive
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-300 shadow-md shadow-cyan-500/30'
                  : isBeatMarker
                  ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                  : 'bg-zinc-900/60 text-zinc-600 border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-400'
              }`}
              title={`Step ${stepIdx + 1} (${isBeatMarker ? 'Beat marker' : '16th note'})`}
            >
              {stepIdx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
