import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext, samples } from '@strudel/web';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';
import { generateRealDrumWavs } from './drumSynth';

class StrudelEngine {
  private isInitialized = false;
  private analyserNode: AnalyserNode | null = null;
  private pendingCode: string | null = null;
  private isEvaluating = false;

  public async init() {
    if (this.isInitialized) return;
    try {
      await initAudioOnFirstClick();
      await initStrudel();

      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Generate in-memory real audio WAV percussion files and register into Strudel samples engine
      if (ctx) {
        try {
          const drumWavMap = generateRealDrumWavs(ctx);
          samples(drumWavMap);
        } catch (e) {
          console.warn('Real drum WAV generation notice:', e);
        }
      }
    } catch (err) {
      console.warn('Strudel Engine initialization warning:', err);
    } finally {
      this.isInitialized = true;
      this.setupAnalyser();
    }
  }

  private setupAnalyser() {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx) {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        if (!this.analyserNode) {
          this.analyserNode = audioCtx.createAnalyser();
          this.analyserNode.fftSize = 64;
        }
      }
    } catch (err) {
      console.warn('AudioContext Analyser setup warning:', err);
    }
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(32);
    }
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public compileASTToCode(
    stems: StemChannel[],
    bpm: number,
    masterVolume: number = 0.8,
    arrangementMode: ArrangementMode = 'stack'
  ): string {
    const hasSolo = stems.some((s) => s.solo);
    const validSynths = [
      'sawtooth',
      'square',
      'sine',
      'triangle',
      'piano',
      'organ',
      'vibraphone',
      'marimba',
      'flute',
      'violin',
      'trumpet',
      'guitar'
    ];

    const stemCodes = stems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        const bank = (stem.bank || 'RolandTR909').toLowerCase();
        let patternStr = stem.pattern.trim();

        // Map drum kit selection to registered in-memory real WAV sound names
        if (bank.includes('808')) {
          patternStr = patternStr.replace(/\bbd\b/g, '808bd').replace(/\bsd\b/g, '808sd').replace(/\bhh\b/g, '808oh');
        } else if (bank.includes('707')) {
          patternStr = patternStr.replace(/\bbd\b/g, '707bd').replace(/\bsd\b/g, '707sd').replace(/\bhh\b/g, '707hh');
        } else if (bank.includes('casio')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'casiobd').replace(/\bsd\b/g, 'casiosd').replace(/\bhh\b/g, 'casiohh');
        } else if (bank.includes('acoustic')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'drum:0').replace(/\bsd\b/g, 'drum:1').replace(/\bhh\b/g, 'drum:2');
        } else if (bank.includes('perc')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'perc:0').replace(/\bsd\b/g, 'perc:1').replace(/\bhh\b/g, 'perc:2');
        }

        // Pure authentic sample-based drum output (plays in-memory real WAV audio files)
        code = `s("${patternStr}")`;
      } else {
        let soundName = (stem.bank || 'sawtooth').toLowerCase();
        if (!validSynths.includes(soundName)) {
          soundName = stem.category === 'bass' ? 'sawtooth' : 'square';
        }

        let pat = stem.pattern;
        if (stem.category === 'bass') {
          pat = pat.replace(/c1/g, 'c2').replace(/eb1/g, 'eb2').replace(/f1/g, 'f2').replace(/g1/g, 'g2').replace(/a1/g, 'a2');
        }

        code = `note("${pat}").s("${soundName}")`;
      }

      // Apply Pace / Speed multiplier on individual stem (.fast or .slow)
      const pace = typeof stem.pace === 'number' ? stem.pace : 1.0;
      if (pace > 1.001) {
        code += `.fast(${pace.toFixed(2)})`;
      } else if (pace < 0.999 && pace > 0.001) {
        const slowFactor = 1 / pace;
        code += `.slow(${slowFactor.toFixed(2)})`;
      }

      stem.effects.forEach((fx) => {
        if (fx.type === 'lpf') code += `.lpf(${Math.round(fx.value * 18000 + 500)})`;
        if (fx.type === 'hpf') code += `.hpf(${Math.round(fx.value * 2000)})`;
        if (fx.type === 'delay') code += `.delay(${fx.value.toFixed(2)})`;
        if (fx.type === 'room') code += `.room(${fx.value.toFixed(2)})`;
        if (fx.type === 'crush') code += `.crush(${Math.floor(fx.value * 12 + 1)})`;
        if (fx.type === 'gain') code += `.gain(${Math.max(0.0001, fx.value).toFixed(4)})`;
      });

      if (typeof stem.pan === 'number') {
        code += `.pan(${stem.pan.toFixed(2)})`;
      }

      // Calculate effective channel volume based on mute, solo, and volume slider
      let effVol = stem.volume;
      if (stem.muted) effVol = 0;
      if (hasSolo && !stem.solo) effVol = 0;

      const safeGain = Math.max(0, effVol).toFixed(4);
      code += `.gain(${safeGain})`;
      return `  // ${stem.name}\n  ${code}`;
    });

    if (stemCodes.length === 0) return 'stack().gain(0)';

    const combiner = arrangementMode === 'cat' ? 'cat' : 'stack';
    const safeMaster = Math.max(0.0001, masterVolume).toFixed(4);
    return `${combiner}(\n${stemCodes.join(',\n')}\n).cpm(${bpm}).gain(${safeMaster})`;
  }

  public async syncState(
    stems: StemChannel[],
    bpm: number,
    masterVolume: number = 0.8,
    arrangementMode: ArrangementMode = 'stack'
  ) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (_) {}

    this.pendingCode = this.compileASTToCode(stems, bpm, masterVolume, arrangementMode);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isEvaluating) return;
    this.isEvaluating = true;

    while (this.pendingCode !== null) {
      const codeToRun = this.pendingCode;
      this.pendingCode = null; // Clear pending before evaluation
      try {
        await evaluate(codeToRun);
      } catch (err) {
        console.error('Strudel evaluation error:', err);
      }
    }

    this.isEvaluating = false;
  }

  public stop() {
    this.pendingCode = 'stack().gain(0)';
    this.processQueue();
  }
}

export const engine = new StrudelEngine();
