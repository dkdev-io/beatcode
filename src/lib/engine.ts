import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext } from '@strudel/web';
import type { StemChannel } from '../store/useStudioStore';

class StrudelEngine {
  private isInitialized = false;
  private analyserNode: AnalyserNode | null = null;
  private pendingSyncTimeout: ReturnType<typeof setTimeout> | null = null;

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

  public compileASTToCode(stems: StemChannel[], bpm: number, masterVolume: number = 0.8): string {
    // Solo logic: If any stem has solo: true, only active solo stems play
    const hasSolo = stems.some((s) => s.solo);
    const activeStems = stems.filter((s) => {
      if (hasSolo) return s.solo && !s.muted;
      return !s.muted;
    });

    if (activeStems.length === 0) return 'silence';

    const validSynths = ['sawtooth', 'square', 'sine', 'triangle', 'piano', 'organ'];

    const stemCodes = activeStems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        code = `s("${stem.pattern}")`;
      } else {
        code = `note("${stem.pattern}")`;
        let soundName = (stem.bank || 'sawtooth').toLowerCase();
        if (!validSynths.includes(soundName)) {
          soundName = stem.category === 'bass' ? 'sawtooth' : 'square';
        }
        code += `.s("${soundName}")`;
      }

      stem.effects.forEach((fx) => {
        if (fx.type === 'lpf') code += `.lpf(${Math.round(fx.value * 8000 + 100)})`;
        if (fx.type === 'hpf') code += `.hpf(${Math.round(fx.value * 4000)})`;
        if (fx.type === 'delay') code += `.delay(${fx.value.toFixed(2)})`;
        if (fx.type === 'room') code += `.room(${fx.value.toFixed(2)})`;
        if (fx.type === 'crush') code += `.crush(${Math.floor(fx.value * 12 + 1)})`;
        if (fx.type === 'gain') code += `.gain(${fx.value.toFixed(2)})`;
      });

      code += `.gain(${stem.volume.toFixed(2)})`;
      return `  // ${stem.name}\n  ${code}`;
    });

    return `setcpm(${bpm})\nstack(\n${stemCodes.join(',\n')}\n).gain(${masterVolume.toFixed(2)})`;
  }

  public async syncState(
    stems: StemChannel[],
    bpm: number,
    masterVolume: number = 0.8,
    quantum: number = 4,
    immediate: boolean = false
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

    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
    }

    const code = this.compileASTToCode(stems, bpm, masterVolume);

    if (immediate) {
      try {
        evaluate(code);
      } catch (err) {
        console.error('Strudel immediate evaluation error:', err);
      }
      return;
    }

    const delayMs = Math.max(20, Math.min(150, (60000 / (bpm * 4)) * (quantum / 4)));

    this.pendingSyncTimeout = setTimeout(() => {
      try {
        evaluate(code);
      } catch (err) {
        console.error('Strudel evaluation error:', err);
      }
    }, delayMs);
  }

  public stop() {
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
    }
    try {
      evaluate('silence');
    } catch (err) {
      console.error('Strudel stop error:', err);
    }
  }
}

export const engine = new StrudelEngine();
