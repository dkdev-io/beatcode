import React from 'react';
import { Play, Square, Activity, Radio, Volume2, Layers, Repeat, Upload, Video } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { engine } from '../../lib/engine';

interface GlobalControlsProps {
  onOpenImportModal: () => void;
  onOpenYouTubeModal: () => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  onOpenImportModal,
  onOpenYouTubeModal
}) => {
  const {
    bpm,
    setBpm,
    isPlaying,
    togglePlay,
    masterVolume,
    setMasterVolume,
    arrangementMode,
    setArrangementMode,
    stems
  } = useStudioStore();

  const handlePlayToggle = async () => {
    if (!isPlaying) {
      await engine.init();
      engine.syncState(stems, bpm, masterVolume, arrangementMode);
    } else {
      engine.stop();
    }
    togglePlay();
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl sticky top-4 z-40">
      {/* Brand & Transport Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Activity className="text-zinc-950 stroke-[2.5]" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Strudel Studio
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v1.0.0
              </span>
            </h1>
            <p className="text-[11px] font-mono text-zinc-400">Live-Coding Web Audio DAW</p>
          </div>
        </div>
      </div>

      {/* Center Controls: Play/Stop, BPM, Mode */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Play/Stop Toggle */}
        <button
          onClick={handlePlayToggle}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 ring-2 ring-red-400/50 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-zinc-950 shadow-cyan-500/25 ring-1 ring-cyan-300/40'
          }`}
        >
          {isPlaying ? (
            <>
              <Square size={16} className="fill-current" /> STOP
            </>
          ) : (
            <>
              <Play size={16} className="fill-current ml-0.5" /> PLAY
            </>
          )}
        </button>

        {/* BPM Selector */}
        <div className="flex items-center gap-3 bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono text-zinc-400 font-semibold tracking-wider">Tempo</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-14 bg-transparent font-mono text-lg font-bold text-cyan-400 focus:outline-none text-center"
              />
              <span className="text-xs font-mono text-zinc-400">BPM</span>
            </div>
          </div>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg hidden sm:block"
          />
        </div>

        {/* Mode Selector: Parallel (Stack) vs Sequential (Cat) */}
        <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setArrangementMode('stack')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              arrangementMode === 'stack'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Parallel Layering Mode (All cards play simultaneously)"
          >
            <Layers size={13} /> Layer
          </button>
          <button
            onClick={() => setArrangementMode('cat')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              arrangementMode === 'cat'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sequential Timeline Mode (Cards play sequentially in order)"
          >
            <Repeat size={13} /> Sequence
          </button>
        </div>

        {/* Import & YouTube Reverse Engineer Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Import Song Project (.json or code)"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={onOpenYouTubeModal}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 border border-red-500/40 text-red-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Reverse Engineer a YouTube Song Link"
          >
            <Video size={14} className="text-red-400" /> YouTube AI
          </button>
        </div>
      </div>

      {/* Right Controls: Master Volume & Sync Queue Status */}
      <div className="flex items-center gap-4">
        {/* Master Volume */}
        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
          <Volume2 size={16} className="text-zinc-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
          <span className="text-xs font-mono text-zinc-400 w-8 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* Sync Queue Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Radio size={12} className={isPlaying ? 'animate-ping text-emerald-400' : 'text-emerald-600'} />
          <span>{isPlaying ? 'LIVE SYNC' : 'STANDBY'}</span>
        </div>
      </div>
    </header>
  );
};
