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

      // Preload standard dirt sample soundbank (bd, sd, hh, cp, rim, cb, 808, 707, linn, casio, perc, etc.)
      try {
        await evaluate('samples("github:tidalcycles/dirt-samples")');
      } catch (e) {
        console.warn('Dirt-samples preload notification:', e);
      }

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

    if (activeStems.length === 0) return 'stack().gain(0)';

    const validSynths = ['sawtooth', 'square', 'sine', 'triangle', 'piano', 'organ'];

    const stemCodes = activeStems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        const bank = (stem.bank || 'RolandTR909').toLowerCase();
        let patternStr = stem.pattern;

        if (['sine', 'triangle', 'sawtooth', 'square'].includes(bank)) {
          // Pure WebAudio Synth Drum Mode (100% offline with decay envelope percussion)
          const synthWave = bank;
          const k = `note("c1*4").s("${synthWave}").lpf(300).decay(0.12).gain(1.2)`;
          const s = `note("~ e2 ~ e2").s("${synthWave}").crush(3).decay(0.15).gain(0.9)`;
          const h = `note("c6*8").s("${synthWave}").hpf(4500).decay(0.06).gain(0.4)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else {
          // Sample-based Drum Kit Mode (dirt-samples: 909, 808, 707, linn, casio, acoustic, perc)
          if (bank.includes('808')) {
            patternStr = patternStr.replace(/\bbd\b/g, '808bd').replace(/\bsd\b/g, '808sd').replace(/\bhh\b/g, '808oh');
          } else if (bank.includes('707')) {
            patternStr = patternStr.replace(/\bbd\b/g, '707bd').replace(/\bsd\b/g, '707sd').replace(/\bhh\b/g, '707');
          } else if (bank.includes('linn')) {
            patternStr = patternStr.replace(/\bbd\b/g, 'linn').replace(/\bsd\b/g, 'linn').replace(/\bhh\b/g, 'linn');
          } else if (bank.includes('acoustic') || bank.includes('rock')) {
            patternStr = patternStr.replace(/\bbd\b/g, 'drum:0').replace(/\bsd\b/g, 'drum:1').replace(/\bhh\b/g, 'drum:2');
          } else if (bank.includes('casio')) {
            patternStr = patternStr.replace(/\bbd\b/g, 'casiobd').replace(/\bsd\b/g, 'casiosd').replace(/\bhh\b/g, 'casiohh');
          } else if (bank.includes('perc')) {
            patternStr = patternStr.replace(/\bbd\b/g, 'perc:0').replace(/\bsd\b/g, 'perc:1').replace(/\bhh\b/g, 'perc:2');
          }

          code = `s("${patternStr}")`;
        }
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
          await evaluate('stack().gain(0)');
        } catch (err) {
          console.error('Strudel stop error:', err);
        }
      });
  }
}

export const engine = new StrudelEngine();
