import React, { useState } from 'react';
import { Copy, Check, Download, Terminal } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import { engine } from '../../lib/engine';

export const LiveCanvas: React.FC = () => {
  const { stems, bpm, isPlaying, masterVolume, arrangementMode } = useStudioStore();
  const [copied, setCopied] = useState(false);

  const compiledCode = engine.compileASTToCode(stems, bpm, masterVolume, arrangementMode);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([compiledCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strudel-track-${Date.now()}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = compiledCode.split('\n').length;
  const activeStemsCount = stems.filter((s) => !s.muted).length;
  const totalFxCount = stems.reduce((acc, stem) => acc + stem.effects.length, 0);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Canvas Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-cyan-400" />
          <h3 className="font-bold text-sm text-zinc-200 tracking-tight flex items-center gap-2">
            Strudel Live Code Canvas
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Copy Strudel Code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Export Strudel JS script"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative flex-1 p-4 font-mono text-xs overflow-auto bg-zinc-950 text-cyan-300 selection:bg-cyan-500 selection:text-zinc-950 min-h-[300px]">
        <div className="flex gap-4">
          {/* Line Numbers */}
          <div className="select-none text-zinc-600 text-right pr-2 border-r border-zinc-800/80">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Formatted Code Block */}
          <pre className="whitespace-pre-wrap font-mono text-cyan-300 leading-relaxed flex-1">
            {compiledCode}
          </pre>
        </div>
      </div>

      {/* Canvas Footer Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-4">
          <span>CPM: {bpm * 4}</span>
          <span>Active Tracks: {activeStemsCount}/{stems.length}</span>
          <span>DSP FX Nodes: {totalFxCount}</span>
        </div>
        <span className="text-zinc-500">AST -&gt; Strudel DSL</span>
      </div>
    </div>
  );
};
