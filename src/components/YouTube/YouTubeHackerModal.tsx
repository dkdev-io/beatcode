import React, { useState } from 'react';
import { Video, Sparkles, Wand2, CheckCircle2, ArrowRight, X, Loader2 } from 'lucide-react';
import { reverseEngineerYouTubeTrack } from '../../lib/youtubeAnalyzer';
import type { YouTubeAnalysisResult } from '../../lib/youtubeAnalyzer';
import { useStudioStore } from '../../store/useStudioStore';

interface YouTubeHackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubeHackerModal: React.FC<YouTubeHackerModalProps> = ({ isOpen, onClose }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<YouTubeAnalysisResult | null>(null);

  const { loadPresetFromJSON, setPlaying } = useStudioStore();

  if (!isOpen) return null;

  const STEPS = [
    '🎧 Fetching YouTube Audio Stream & Metadata...',
    '🥁 Analyzing Rhythmic Pulse & Estimating BPM...',
    '🎹 Isolating Basslines, Harmonies & Lead Synths...',
    '⚡ Reverse-Engineering Strudel DAW Multi-Stem Architecture...'
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await reverseEngineerYouTubeTrack(youtubeUrl);
      setTimeout(() => {
        clearInterval(interval);
        setResult(res);
        setIsAnalyzing(false);
      }, 2500);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      alert('Could not process YouTube URL. Please check the link and try again.');
    }
  };

  const handleApplyToDAW = () => {
    if (!result) return;
    loadPresetFromJSON(result.payload);
    setPlaying(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-950/40 via-zinc-900 to-rose-950/40 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
              <Video size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                YouTube Audio Reverse-Engineer
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  AI Transpiler
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Paste any YouTube song link to decompose its BPM, Key, Stems & Synth Patches into Beatcode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-6">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-3">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider">
              YouTube Song URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !youtubeUrl}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} /> Reverse Engineer
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Analysis Step Progress */}
          {isAnalyzing && (
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-red-400">
                  <Loader2 size={14} className="animate-spin" /> {STEPS[stepIndex]}
                </span>
                <span>{Math.round(((stepIndex + 1) / STEPS.length) * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-400 h-full transition-all duration-500"
                  style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Analysis Result Card */}
          {result && !isAnalyzing && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-950 to-red-950/20 border border-red-500/30 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Track DNA Extracted
                  </div>
                  <h3 className="font-bold text-base text-zinc-100 mt-1">{result.title}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{result.author}</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs font-bold">
                  {result.bpm} BPM
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Genre: <strong className="text-red-400">{result.genre}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Key: <strong className="text-cyan-400">{result.key}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Vibe: <strong className="text-purple-400">{result.vibe}</strong>
                </span>
              </div>

              {/* Extracted Stems Preview */}
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                  Generated Stems ({result.payload.stems.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.payload.stems.map((stem, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-zinc-200">{stem.name}</span>
                      <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        {stem.bank || stem.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyToDAW}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <Sparkles size={16} /> Load Track into DAW & Play <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
