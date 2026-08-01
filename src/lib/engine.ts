import { evaluate, initAudioOnFirstClick } from '@strudel/web';
import type { StemChannel } from '../store/useStudioStore';

class StrudelEngine {
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) return;
    try {
      await initAudioOnFirstClick();
      this.isInitialized = true;
    } catch (err) {
      console.warn('Audio initialization deferred or failed:', err);
    }
  }

  public compileASTToCode(stems: StemChannel[], bpm: number): string {
    // Solo logic: If any stem has solo: true, only active solo stems play
    const hasSolo = stems.some((s) => s.solo);
    const activeStems = stems.filter((s) => {
      if (hasSolo) return s.solo && !s.muted;
      return !s.muted;
    });

    if (activeStems.length === 0) return 'silence';

    const stemCodes = activeStems.map((stem) => {
      let code = '';
      if (stem.category === 'drums') {
        code = `s("${stem.pattern}")`;
        if (stem.bank) code += `.bank("${stem.bank}")`;
      } else {
        code = `note("${stem.pattern}")`;
        if (stem.bank) code += `.s("${stem.bank}")`;
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

    return `setcpm(${bpm})\nstack(\n${stemCodes.join(',\n')}\n)`;
  }

  public syncState(stems: StemChannel[], bpm: number) {
    if (!this.isInitialized) return;
    const code = this.compileASTToCode(stems, bpm);
    try {
      evaluate(code);
    } catch (err) {
      console.error('Strudel evaluation error:', err);
    }
  }

  public stop() {
    if (!this.isInitialized) return;
    try {
      evaluate('silence');
    } catch (err) {
      console.error('Strudel stop error:', err);
    }
  }
}

export const engine = new StrudelEngine();
