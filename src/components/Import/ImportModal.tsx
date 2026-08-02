import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';
import type { StudioJSONPayload } from '../../store/useStudioStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { loadPresetFromJSON, setPlaying } = useStudioStore();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError(null);
    if (!inputText.trim()) {
      setError('Please paste JSON code or upload a valid song file.');
      return;
    }

    try {
      const parsed = JSON.parse(inputText);
      if (typeof parsed !== 'object' || !Array.isArray(parsed.stems)) {
        throw new Error('Invalid beatcode song JSON format. Must contain a stems array.');
      }

      loadPresetFromJSON(parsed as StudioJSONPayload);
      setPlaying(true);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not parse song file. Make sure it is valid Beatcode JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-indigo-950/40 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                Import Song Project
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  JSON / Code
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Upload a .json beatcode project file or paste raw Strudel track code
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

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* File Upload Dropzone */}
          <div className="relative border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-zinc-950/50 text-center cursor-pointer group">
            <input
              type="file"
              accept=".json,.js,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="p-3 bg-zinc-900 text-cyan-400 rounded-xl border border-zinc-800 group-hover:border-cyan-500/40 transition-colors">
              <FileCode size={24} />
            </div>
            <div className="text-xs font-bold text-zinc-200">
              Click or drag & drop a .json project file
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              Supports Beatcode JSON payloads & exported track presets
            </div>
          </div>

          {/* Code Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-cyan-400" />
              Or Paste JSON Code
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='{ "bpm": 124, "stems": [ ... ] }'
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-cyan-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleImport}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Import & Load Into DAW <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
