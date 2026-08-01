import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext } from '@strudel/web';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';

class StrudelEngine {
  private isInitialized = false;
  private analyserNode: AnalyserNode | null = null;
  private lastEvalPromise: Promise<any> = Promise.resolve();

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
    // Solo logic: If any stem has solo: true, only active solo stems play
    const hasSolo = stems.some((s) => s.solo);
    const activeStems = stems.filter((s) => {
      if (s.volume <= 0.001) return false;
      if (hasSolo) return s.solo && !s.muted;
      return !s.muted;
    });

    if (activeStems.length === 0) return 'silence';

    const validSynths = ['sawtooth', 'square', 'sine', 'triangle', 'piano', 'organ'];

    const stemCodes = activeStems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        // Guaranteed WebAudio synthesized drums + sample layer
        const synthKick = `note("c1*4").s("sine").lpf(250).gain(0.9)`;
        const synthSnare = `note("~ g2 ~ g2").s("triangle").crush(4).gain(0.7)`;
        const synthHat = `note("c6*8").s("square").hpf(5000).gain(0.4)`;
        code = `stack(s("${stem.pattern}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
      } else {
        let soundName = (stem.bank || 'sawtooth').toLowerCase();
        if (!validSynths.includes(soundName)) {
          soundName = stem.category === 'bass' ? 'sawtooth' : 'square';
        }
        code = `s("${soundName}").note("${stem.pattern}")`;
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

      const safeGain = Math.max(0.0001, stem.volume).toFixed(4);
      code += `.gain(${safeGain})`;
      return `  // ${stem.name}\n  ${code}`;
    });

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

    const code = this.compileASTToCode(stems, bpm, masterVolume, arrangementMode);

    // Queue evaluation promises sequentially to guarantee atomic, ordered audio updates
    this.lastEvalPromise = this.lastEvalPromise.then(async () => {
      try {
        await evaluate(code);
      } catch (err) {
        console.error('Strudel evaluation error:', err);
      }
    });
  }

  public stop() {
    this.lastEvalPromise = this.lastEvalPromise.then(async () => {
      try {
        await evaluate('silence');
      } catch (err) {
        console.error('Strudel stop error:', err);
      }
    });
  }
}

export const engine = new StrudelEngine();
