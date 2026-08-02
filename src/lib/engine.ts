import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext } from '@strudel/web';
import { registerSound } from 'superdough';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';

let cachedNoiseBuffer: AudioBuffer | null = null;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 0.2; // 200ms noise buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function registerDrumPercussionSounds() {
  const ctx = getAudioContext() as AudioContext | null;
  if (!ctx) return;

  if (!cachedNoiseBuffer) {
    cachedNoiseBuffer = createNoiseBuffer(ctx);
  }

  // 1. Acoustic & Tribal Percussion (Conga / Bongo / African Tribal Perc)
  const registerTribalPerc = (name: string, baseFreq: number) => {
    registerSound(name, (t: number, value: any, onended: () => void) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const startTime = t || ctx.currentTime;
        const duration = 0.12;

        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, startTime + duration);

        gain.gain.setValueAtTime((value?.gain ?? 0.8) * 0.9, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        setTimeout(onended, duration * 1000);
      } catch (_) {
        onended();
      }
    });
  };

  registerTribalPerc('perc', 360);
  registerTribalPerc('conga', 280);
  registerTribalPerc('bongo', 480);
  registerTribalPerc('perc:0', 360);
  registerTribalPerc('perc:1', 280);
  registerTribalPerc('perc:2', 480);

  // 2. Thumping Acoustic & Electronic Kicks (bd, 808bd, 707bd, linn, casio)
  const registerKick = (name: string, startFreq: number, endFreq: number, dur: number) => {
    registerSound(name, (t: number, value: any, onended: () => void) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const startTime = t || ctx.currentTime;

        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.045);

        gain.gain.setValueAtTime((value?.gain ?? 1.0) * 1.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);

        setTimeout(onended, dur * 1000);
      } catch (_) {
        onended();
      }
    });
  };

  registerKick('bd', 160, 38, 0.15);
  registerKick('808bd', 140, 32, 0.28);
  registerKick('707bd', 180, 45, 0.12);
  registerKick('linn', 150, 42, 0.14);
  registerKick('casiobd', 170, 50, 0.10);
  registerKick('drum:0', 160, 40, 0.16);

  // 3. Snappy Noise Snares (sd, 808sd, 707sd, casio)
  const registerSnare = (name: string, noiseFreq: number) => {
    registerSound(name, (t: number, value: any, onended: () => void) => {
      try {
        const startTime = t || ctx.currentTime;
        const dur = 0.15;

        // White noise snap component
        if (cachedNoiseBuffer) {
          const noise = ctx.createBufferSource();
          noise.buffer = cachedNoiseBuffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(noiseFreq, startTime);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime((value?.gain ?? 0.8) * 0.7, startTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          noise.start(startTime);
          noise.stop(startTime + dur);
        }

        // Tonal body pop component
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, startTime);
        osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.04);

        oscGain.gain.setValueAtTime((value?.gain ?? 0.8) * 0.5, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);

        setTimeout(onended, dur * 1000);
      } catch (_) {
        onended();
      }
    });
  };

  registerSnare('sd', 1500);
  registerSnare('808sd', 1200);
  registerSnare('707sd', 1800);
  registerSnare('casiosd', 2200);
  registerSnare('drum:1', 1400);

  // 4. Filtered Metallic Hi-Hats (hh, 808oh, 707, casio)
  const registerHat = (name: string, cutoffFreq: number, dur: number) => {
    registerSound(name, (t: number, value: any, onended: () => void) => {
      try {
        const startTime = t || ctx.currentTime;

        if (cachedNoiseBuffer) {
          const noise = ctx.createBufferSource();
          noise.buffer = cachedNoiseBuffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(cutoffFreq, startTime);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime((value?.gain ?? 0.4) * 0.5, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noise.start(startTime);
          noise.stop(startTime + dur);
        }

        setTimeout(onended, dur * 1000);
      } catch (_) {
        onended();
      }
    });
  };

  registerHat('hh', 7000, 0.04);
  registerHat('808oh', 6500, 0.12);
  registerHat('707', 6000, 0.05);
  registerHat('casiohh', 8000, 0.03);
  registerHat('drum:2', 6800, 0.05);

  // 5. Rimshot, Clap & Cowbell (rim, cp, cb)
  registerTribalPerc('rim', 600);
  registerTribalPerc('cp', 900);
  registerTribalPerc('cb', 750);
}

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

      // Register authentic WebAudio percussion sounds (kicks, snares, hats, congas, bongos)
      registerDrumPercussionSounds();
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
    const validSynths = ['sawtooth', 'square', 'sine', 'triangle', 'piano', 'organ'];

    const stemCodes = stems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        const bank = (stem.bank || 'RolandTR909').toLowerCase();
        let patternStr = stem.pattern;

        // Map drum kit selection to registered percussion sound names
        if (bank.includes('808')) {
          patternStr = patternStr.replace(/\bbd\b/g, '808bd').replace(/\bsd\b/g, '808sd').replace(/\bhh\b/g, '808oh');
        } else if (bank.includes('707')) {
          patternStr = patternStr.replace(/\bbd\b/g, '707bd').replace(/\bsd\b/g, '707sd').replace(/\bhh\b/g, '707');
        } else if (bank.includes('casio')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'casiobd').replace(/\bsd\b/g, 'casiosd').replace(/\bhh\b/g, 'casiohh');
        } else if (bank.includes('acoustic')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'drum:0').replace(/\bsd\b/g, 'drum:1').replace(/\bhh\b/g, 'drum:2');
        } else if (bank.includes('perc')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'perc:0').replace(/\bsd\b/g, 'perc:1').replace(/\bhh\b/g, 'perc:2');
        }

        // Pure authentic WebAudio percussion pattern output
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
