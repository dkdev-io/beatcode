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
        const bank = (stem.bank || '909').toLowerCase();
        let patternStr = stem.pattern;

        if (bank.includes('808')) {
          // 808 Trap: Deep Sub Boom Kick + Crisp Trap Snare & Sizzling Hihats
          patternStr = patternStr.replace(/\bbd\b/g, '808bd').replace(/\bsd\b/g, '808sd').replace(/\bhh\b/g, '808oh');
          const synthKick = `note("c0*4").s("sine").gain(1.4)`;
          const synthSnare = `note("~ d3 ~ d3").s("sawtooth").crush(2).gain(0.85)`;
          const synthHat = `note("c7*16").s("square").hpf(7000).gain(0.35)`;
          code = `stack(s("${patternStr}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
        } else if (bank.includes('707')) {
          // 707 Synthwave: Punchy Gated Retro Drums
          patternStr = patternStr.replace(/\bbd\b/g, '707bd').replace(/\bsd\b/g, '707sd').replace(/\bhh\b/g, '707');
          const synthKick = `note("g1*4").s("square").lpf(350).gain(1.0)`;
          const synthSnare = `note("~ a2 ~ a2").s("sawtooth").hpf(1200).crush(3).gain(0.9)`;
          const synthHat = `note("c6*8").s("sawtooth").hpf(4000).gain(0.4)`;
          code = `stack(s("${patternStr}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
        } else if (bank.includes('linn')) {
          // 80s LinnDrum: Tight Electro Percussion
          patternStr = patternStr.replace(/\bbd\b/g, 'linn').replace(/\bsd\b/g, 'linn').replace(/\bhh\b/g, 'linn');
          const synthKick = `note("d1*4").s("triangle").lpf(280).gain(1.1)`;
          const synthSnare = `note("~ f#2 ~ f#2").s("sawtooth").crush(4).gain(0.8)`;
          const synthHat = `note("c6*8").s("square").hpf(5500).gain(0.35)`;
          code = `stack(s("${patternStr}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
        } else if (bank.includes('casio')) {
          // Lo-Fi Casio Mini Toy Drum Machine
          patternStr = patternStr.replace(/\bbd\b/g, 'casio').replace(/\bsd\b/g, 'casio').replace(/\bhh\b/g, 'casio');
          const synthKick = `note("e2*4").s("square").crush(5).gain(0.9)`;
          const synthSnare = `note("~ e3 ~ e3").s("square").crush(6).gain(0.85)`;
          const synthHat = `note("c7*8").s("triangle").crush(7).gain(0.4)`;
          code = `stack(s("${patternStr}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
        } else {
          // 909 Techno: Heavy Hardcore Techno Kick & Snare
          const synthKick = `note("c1*4").s("sine").lpf(250).gain(1.0)`;
          const synthSnare = `note("~ g2 ~ g2").s("triangle").crush(4).gain(0.75)`;
          const synthHat = `note("c6*8").s("square").hpf(5000).gain(0.4)`;
          code = `stack(s("${patternStr}"), ${synthKick}, ${synthSnare}, ${synthHat})`;
        }
      } else {
        let soundName = (stem.bank || 'sawtooth').toLowerCase();
        if (!validSynths.includes(soundName)) {
          soundName = stem.category === 'bass' ? 'sawtooth' : 'square';
        }

        // Pitch Octave Normalizer: Ensure bass sits at punchy octave 2 (65Hz-130Hz)
        let pat = stem.pattern;
        if (stem.category === 'bass') {
          pat = pat.replace(/c1/g, 'c2').replace(/eb1/g, 'eb2').replace(/f1/g, 'f2').replace(/g1/g, 'g2').replace(/a1/g, 'a2');
        }

        code = `note("${pat}").s("${soundName}")`;
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

    // Fault-tolerant Promise Queue: Always catch errors to guarantee pipeline resilience
    this.lastEvalPromise = this.lastEvalPromise
      .catch(() => {})
      .then(async () => {
        try {
          await evaluate(code);
        } catch (err) {
          console.error('Strudel evaluation error:', err);
        }
      });
  }

  public stop() {
    this.lastEvalPromise = this.lastEvalPromise
      .catch(() => {})
      .then(async () => {
        try {
          await evaluate('silence');
        } catch (err) {
          console.error('Strudel stop error:', err);
        }
      });
  }
}

export const engine = new StrudelEngine();
