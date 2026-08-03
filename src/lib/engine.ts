import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext } from '@strudel/web';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';

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
        const patternStr = stem.pattern.trim();

        // Separate pattern into comma-separated parts or single pattern
        const parts = patternStr.split(',').map((p) => p.trim()).filter(Boolean);
        let kickPart = '~';
        let snarePart = '~';
        let hatPart = '~';

        if (parts.length > 1) {
          parts.forEach((p) => {
            if (p.includes('bd') || p.includes('kick')) kickPart = p;
            if (p.includes('sd') || p.includes('snare') || p.includes('cp') || p.includes('rim')) snarePart = p;
            if (p.includes('hh') || p.includes('hat') || p.includes('cb')) hatPart = p;
          });
        } else {
          kickPart = patternStr;
          snarePart = patternStr;
          hatPart = patternStr;
        }

        // Configure synth sound parameters per kit style
        let kNote = 'c1', kWave = 'sine', kLpf = 280, kDecay = 0.14, kGain = 1.3;
        let sNote = 'e2', sWave = 'sawtooth', sCrush = 3, sDecay = 0.12, sGain = 0.95;
        let hNote = 'c6', hWave = 'square', hHpf = 5500, hDecay = 0.04, hGain = 0.45;

        if (bank.includes('808')) {
          kNote = 'c0'; kWave = 'sine'; kLpf = 200; kDecay = 0.28; kGain = 1.5; // Deep 808 sub kick
          sNote = 'd2'; sWave = 'sawtooth'; sCrush = 2; sDecay = 0.10; sGain = 1.0; // Trap snare
          hNote = 'c7'; hWave = 'square'; hHpf = 7500; hDecay = 0.03; hGain = 0.4; // 808 sizzle hat
        } else if (bank.includes('707')) {
          kNote = 'g1'; kWave = 'square'; kLpf = 350; kDecay = 0.13; kGain = 1.1; // 707 gated kick
          sNote = 'a2'; sWave = 'sawtooth'; sCrush = 4; sDecay = 0.15; sGain = 0.9; // 707 gated snare
          hNote = 'c6'; hWave = 'sawtooth'; hHpf = 4500; hDecay = 0.05; hGain = 0.4;
        } else if (bank.includes('casio')) {
          kNote = 'e2'; kWave = 'square'; kLpf = 400; kDecay = 0.10; kGain = 1.0;
          sNote = 'e3'; sWave = 'square'; sCrush = 6; sDecay = 0.10; sGain = 0.85;
          hNote = 'c7'; hWave = 'triangle'; hHpf = 6000; hDecay = 0.03; hGain = 0.4;
        } else if (bank.includes('perc')) {
          kNote = 'g1'; kWave = 'sine'; kLpf = 320; kDecay = 0.15; kGain = 1.1; // Afro Tribal Conga Bass
          sNote = 'c3'; sWave = 'triangle'; sCrush = 0; sDecay = 0.12; sGain = 0.95; // High Conga / Bongo
          hNote = 'c6'; hWave = 'sawtooth'; hHpf = 6000; hDecay = 0.04; hGain = 0.4; // Shaker
        }

        const kPat = kickPart.replace(/\bbd\b|\bkick\b/g, kNote).replace(/\bsd\b|\bsnare\b|\bhh\b|\bhat\b|\bcp\b|\brim\b|\bcb\b/g, '~');
        const sPat = snarePart.replace(/\bsd\b|\bsnare\b|\bcp\b|\brim\b/g, sNote).replace(/\bbd\b|\bkick\b|\bhh\b|\bhat\b|\bcb\b/g, '~');
        const hPat = hatPart.replace(/\bhh\b|\bhat\b|\bcb\b/g, hNote).replace(/\bbd\b|\bkick\b|\bsd\b|\bsnare\b|\bcp\b|\brim\b/g, '~');

        const kCode = `note("${kPat}").s("${kWave}").lpf(${kLpf}).decay(${kDecay}).gain(${kGain})`;
        const sCode = sCrush > 0
          ? `note("${sPat}").s("${sWave}").crush(${sCrush}).decay(${sDecay}).gain(${sGain})`
          : `note("${sPat}").s("${sWave}").decay(${sDecay}).gain(${sGain})`;
        const hCode = `note("${hPat}").s("${hWave}").hpf(${hHpf}).decay(${hDecay}).gain(${hGain})`;

        code = `stack(${kCode}, ${sCode}, ${hCode})`;
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
