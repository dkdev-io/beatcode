import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext } from '@strudel/web';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';

function parseDrumPatternParts(patternStr: string) {
  const parts = patternStr.split(',').map((p) => p.trim());
  let kick = '~';
  let snare = '~';
  let hat = '~';

  parts.forEach((part) => {
    if (part.includes('bd') || part.includes('kick')) kick = part;
    if (part.includes('sd') || part.includes('snare') || part.includes('cp') || part.includes('rim')) snare = part;
    if (part.includes('hh') || part.includes('hat') || part.includes('cb')) hat = part;
  });

  // Fallback if no comma-separated parts matched
  if (kick === '~' && snare === '~' && hat === '~') {
    kick = patternStr;
    snare = patternStr;
    hat = patternStr;
  }

  return { kick, snare, hat };
}

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

    if (activeStems.length === 0) return 'stack().gain(0)';

    const validSynths = ['sawtooth', 'square', 'sine', 'triangle', 'piano', 'organ'];

    const stemCodes = activeStems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        const bank = (stem.bank || 'RolandTR909').toLowerCase();
        const { kick, snare, hat } = parseDrumPatternParts(stem.pattern);

        if (bank.includes('808')) {
          // 808 Trap: Deep Sub Sine Boom Kick + Sawtooth Trap Snare + Hi-Hat Sizzle
          const k = `note("${kick.replace(/bd|kick/g, 'c0')}").s("sine").decay(0.25).gain(1.4)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'd2')}").s("sawtooth").crush(2).decay(0.10).gain(0.9)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c7')}").s("square").hpf(7000).decay(0.04).gain(0.35)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else if (bank.includes('707')) {
          // 707 Synthwave: Gated Square Kick + Snare
          const k = `note("${kick.replace(/bd|kick/g, 'g1')}").s("square").lpf(350).decay(0.14).gain(1.0)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'a2')}").s("sawtooth").hpf(1200).crush(3).decay(0.16).gain(0.9)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c6')}").s("sawtooth").hpf(4000).decay(0.05).gain(0.4)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else if (bank.includes('linn')) {
          // 80s Linn: Tight Linn Percussion
          const k = `note("${kick.replace(/bd|kick/g, 'd1')}").s("triangle").lpf(280).decay(0.13).gain(1.1)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'e2')}").s("sawtooth").crush(4).decay(0.15).gain(0.8)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c6')}").s("square").hpf(5200).decay(0.05).gain(0.35)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else if (bank.includes('casio')) {
          // Lo-Fi Casio Mini Toy Drum Machine
          const k = `note("${kick.replace(/bd|kick/g, 'e2')}").s("square").crush(5).decay(0.10).gain(0.95)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'e3')}").s("square").crush(6).decay(0.12).gain(0.85)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c7')}").s("triangle").crush(7).decay(0.04).gain(0.4)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else if (bank.includes('acoustic')) {
          // Live Acoustic Drum Kit
          const k = `note("${kick.replace(/bd|kick/g, 'c1')}").s("sine").lpf(280).decay(0.18).gain(1.1)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'g2')}").s("sawtooth").hpf(800).decay(0.14).gain(0.85)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c6')}").s("triangle").hpf(5000).decay(0.07).gain(0.4)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else if (bank.includes('perc')) {
          // Afro Tribal Percussion
          const k = `note("${kick.replace(/bd|kick/g, 'g1')}").s("sine").lpf(320).decay(0.15).gain(1.0)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'c3')}").s("triangle").decay(0.12).gain(0.9)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c6')}").s("sawtooth").hpf(6000).decay(0.04).gain(0.35)`;
          code = `stack(${k}, ${s}, ${h})`;
        } else {
          // Default 909 Techno Punch
          const k = `note("${kick.replace(/bd|kick/g, 'c1')}").s("sine").lpf(250).decay(0.12).gain(1.1)`;
          const s = `note("${snare.replace(/sd|snare|cp|rim/g, 'g2')}").s("triangle").crush(4).decay(0.15).gain(0.8)`;
          const h = `note("${hat.replace(/hh|hat|cb/g, 'c6')}").s("square").hpf(5000).decay(0.05).gain(0.4)`;
          code = `stack(${k}, ${s}, ${h})`;
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
