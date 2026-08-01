import React, { useEffect } from 'react';
import { GlobalControls } from './components/GlobalControls/GlobalControls';
import { PromptBar } from './components/PromptBar/PromptBar';
import { StemRack } from './components/StemRack/StemRack';
import { LiveCanvas } from './components/LiveCanvas/LiveCanvas';
import { StemPalette } from './components/Palette/StemPalette';
import { BeatRadar } from './components/Visualizer/BeatRadar';
import { useStudioStore } from './store/useStudioStore';
import { engine } from './lib/engine';

export const App: React.FC = () => {
  // Subscribe to Zustand state changes to automatically invoke engine.syncState when playing
  useEffect(() => {
    const unsub = useStudioStore.subscribe(
      (state) => ({ stems: state.stems, bpm: state.bpm, isPlaying: state.isPlaying }),
      ({ stems, bpm, isPlaying }) => {
        if (isPlaying) {
          engine.syncState(stems, bpm);
        }
      },
      { fireImmediately: false }
    );

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 sm:p-6 font-sans flex flex-col gap-6 selection:bg-cyan-500 selection:text-zinc-950">
      {/* 1. Global Controls Header */}
      <GlobalControls />

      {/* 2. Prompt Bar (LLM Studio Copilot & Track Hacker Input) */}
      <PromptBar />

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stem Rack (Drag-and-Drop + Knobs + Mixer) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <StemRack />
          <StemPalette />
        </div>

        {/* Right Column: Visual Radar & Live Code Canvas */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <BeatRadar />
          <LiveCanvas />
        </div>
      </div>

      {/* Footer / System Status */}
      <footer className="mt-8 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <span>Strudel Studio Architecture</span>
          <span>•</span>
          <span className="text-cyan-400">@strudel/core & web audio runtime</span>
        </div>
        <div className="text-zinc-400">
          Built with React 19, TypeScript, Zustand & Tailwind CSS
        </div>
      </footer>
    </div>
  );
};

export default App;
