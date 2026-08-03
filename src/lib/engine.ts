import { evaluate, initStrudel, initAudioOnFirstClick, getAudioContext, registerSound } from '@strudel/web';
import type { StemChannel, ArrangementMode } from '../store/useStudioStore';

// Split only on top-level commas, respecting []/<>/{}/() nesting used by Strudel mini-notation
function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '[' || ch === '<' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '>' || ch === '}' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

let cachedNoiseBuffer: AudioBuffer | null = null;
let soundsRegistered = false;

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
  if (soundsRegistered) return;
  const ctx = getAudioContext() as AudioContext | null;
  if (!ctx) return;

  try {
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
    // Colon-free names for the Afro Tribal kit (mini-notation parses "perc:0" as sound "perc" idx 0,
    // so colon-suffixed keys are unreachable). bd/sd/hh remap to these for distinct tribal voices.
    registerTribalPerc('percsn', 280);
    registerTribalPerc('perchh', 480);

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
    registerKick('acbd', 160, 40, 0.16);

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
    registerSnare('acsd', 1400);

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
    registerHat('achh', 6800, 0.05);

    // 5. Rimshot, Clap & Cowbell (rim, cp, cb)
    registerTribalPerc('rim', 600);
    registerTribalPerc('cp', 900);
    registerTribalPerc('cb', 750);

    // 6. Extended Instrument Sound Points (piano, organ, vibraphone, marimba, flute, violin, trumpet, guitar)
    const registerTonalSynth = (name: string, type: OscillatorType, attack: number, decay: number) => {
      registerSound(name, (t: number, value: any, onended: () => void) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          const startTime = t || ctx.currentTime;
          const freq = value?.freq || 440;

          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime((value?.gain ?? 0.6) * 0.7, startTime + attack);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + attack + decay);

          setTimeout(onended, (attack + decay) * 1000);
        } catch (_) {
          onended();
        }
      });
    };

    registerTonalSynth('piano', 'triangle', 0.005, 0.4);
    registerTonalSynth('organ', 'sine', 0.02, 0.6);
    registerTonalSynth('vibraphone', 'sine', 0.002, 0.8);
    registerTonalSynth('marimba', 'triangle', 0.002, 0.25);
    registerTonalSynth('flute', 'sine', 0.05, 0.5);
    registerTonalSynth('violin', 'sawtooth', 0.08, 0.6);
    registerTonalSynth('trumpet', 'square', 0.03, 0.4);
    registerTonalSynth('guitar', 'triangle', 0.004, 0.35);

    soundsRegistered = true;
  } catch (err) {
    console.warn('Error registering drum percussion sounds:', err);
  }
}

// Arm superdough's first-click audio init at module load, BEFORE the user's first gesture.
// This lets the PLAY click's own mousedown load the AudioWorklets that superdough's synths
// and effects require. If we armed it inside init() (which runs on the click event, after
// mousedown), the listener would miss this click and only fire on the next one.
if (typeof document !== 'undefined') {
  initAudioOnFirstClick();
}

class StrudelEngine {
  private isInitialized = false;
  private analyserNode: AnalyserNode | null = null;
  private pendingCode: string | null = null;
  private isEvaluating = false;

  public async init() {
    if (this.isInitialized) return;
    try {
      // The listener was armed at module load, so this resolves once the current gesture's
      // mousedown has loaded the AudioWorklets — no deadlock, and worklets are ready before evaluate.
      await initAudioOnFirstClick();
      await initStrudel();

      // We are inside a user gesture (PLAY click), so create + resume the context directly.
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Register authentic WebAudio percussion & expanded instrument sounds
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

        // Map drum kit selection to registered percussion sound names
        if (bank.includes('808')) {
          patternStr = patternStr.replace(/\bbd\b/g, '808bd').replace(/\bsd\b/g, '808sd').replace(/\bhh\b/g, '808oh');
        } else if (bank.includes('707')) {
          patternStr = patternStr.replace(/\bbd\b/g, '707bd').replace(/\bsd\b/g, '707sd').replace(/\bhh\b/g, '707');
        } else if (bank.includes('casio')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'casiobd').replace(/\bsd\b/g, 'casiosd').replace(/\bhh\b/g, 'casiohh');
        } else if (bank.includes('acoustic')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'acbd').replace(/\bsd\b/g, 'acsd').replace(/\bhh\b/g, 'achh');
        } else if (bank.includes('perc')) {
          patternStr = patternStr.replace(/\bbd\b/g, 'perc').replace(/\bsd\b/g, 'percsn').replace(/\bhh\b/g, 'perchh');
        }

        // If drum pattern contains top-level commas, split into stacked s() layers to avoid
        // mini-notation syntax errors. Bracket-aware so commas inside [ ] < > { } stay intact.
        const parts = splitTopLevelCommas(patternStr);
        if (parts.length > 1) {
          const sParts = parts.map((p) => `s("${p}")`);
          code = `stack(${sParts.join(', ')})`;
        } else if (parts.length === 1) {
          code = `s("${parts[0]}")`;
        } else {
          code = 'silence';
        }
      } else {
        let soundName = (stem.bank || 'sawtooth').toLowerCase();
        if (!validSynths.includes(soundName)) {
          soundName = stem.category === 'bass' ? 'sawtooth' : 'square';
        }

        let pat = stem.pattern.trim().replace(/,\s*$/, '');
        if (stem.category === 'bass') {
          pat = pat.replace(/c1/g, 'c2').replace(/eb1/g, 'eb2').replace(/f1/g, 'f2').replace(/g1/g, 'g2').replace(/a1/g, 'a2');
        }

        code = pat ? `note("${pat}").s("${soundName}")` : 'silence';
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
    } else {
      registerDrumPercussionSounds();
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
