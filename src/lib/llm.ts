import type { StudioJSONPayload, SoundCategory } from '../store/useStudioStore';

/**
 * Clean and validate a StudioJSONPayload structure locally
 */
export function validatePayload(payload: any): StudioJSONPayload | null {
  if (typeof payload !== 'object' || !payload) return null;
  if (typeof payload.bpm !== 'number' || !Array.isArray(payload.stems)) return null;

  const stems = payload.stems.map((s: any) => ({
    name: String(s.name || 'Channel'),
    category: (['drums', 'bass', 'lead', 'pad', 'fx'].includes(s.category)
      ? s.category
      : 'lead') as SoundCategory,
    muted: Boolean(s.muted),
    solo: Boolean(s.solo),
    volume: typeof s.volume === 'number' ? Math.max(0, Math.min(1, s.volume)) : 0.8,
    bank: s.bank ? String(s.bank) : undefined,
    pattern: String(s.pattern || 'c4'),
    effects: Array.isArray(s.effects)
      ? s.effects.map((fx: any) => ({
          id: String(fx.id || `fx-${Math.random().toString(36).substring(2, 6)}`),
          type: (['lpf', 'hpf', 'delay', 'room', 'crush', 'gain'].includes(fx.type)
            ? fx.type
            : 'lpf') as any,
          value: typeof fx.value === 'number' ? Math.max(0, Math.min(1, fx.value)) : 0.5,
        }))
      : [],
  }));

  return {
    bpm: Math.max(40, Math.min(240, payload.bpm)),
    description: payload.description ? String(payload.description) : undefined,
    stems,
  };
}

/**
 * Local Autonomous Track AST Transpiler
 * Resolves natural language user prompts into Strudel Studio JSON AST payloads locally.
 */
export async function generateTrackAST(prompt: string): Promise<StudioJSONPayload> {
  const p = prompt.toLowerCase().trim();

  // 1. Determine Tempo / BPM based on musical style
  let bpm = 124;
  if (p.includes('techno') || p.includes('berlin') || p.includes('industrial')) bpm = 132;
  else if (p.includes('acid') || p.includes('303')) bpm = 134;
  else if (p.includes('synthwave') || p.includes('outrun') || p.includes('cyberpunk')) bpm = 116;
  else if (p.includes('house') || p.includes('disco') || p.includes('deep house')) bpm = 124;
  else if (p.includes('hiphop') || p.includes('hip-hop') || p.includes('lofi') || p.includes('chill')) bpm = 88;
  else if (p.includes('dnb') || p.includes('drum and bass') || p.includes('jungle')) bpm = 174;
  else if (p.includes('ambient') || p.includes('drone') || p.includes('space')) bpm = 75;

  // Custom BPM extraction if mentioned in prompt (e.g. "at 140 bpm")
  const bpmMatch = p.match(/(\d{2,3})\s*bpm/);
  if (bpmMatch && bpmMatch[1]) {
    bpm = parseInt(bpmMatch[1], 10);
  }

  const stems: StudioJSONPayload['stems'] = [];

  // 2. Build Drums Channel
  if (p.includes('dnb') || p.includes('jungle')) {
    stems.push({
      name: 'DnB Breakbeat',
      category: 'drums',
      muted: false,
      solo: false,
      volume: 0.9,
      bank: 'RolandTR909',
      pattern: 'bd [~ sd] [~ bd] sd, [hh*8]',
      effects: [{ id: `fx-d1-${Date.now()}`, type: 'lpf', value: 0.9 }]
    });
  } else if (p.includes('techno') || p.includes('industrial') || p.includes('hard')) {
    stems.push({
      name: '909 Techno Drums',
      category: 'drums',
      muted: false,
      solo: false,
      volume: 0.92,
      bank: 'RolandTR909',
      pattern: 'bd*4, [~ sd]*2, [hh*16]',
      effects: [
        { id: `fx-d1-${Date.now()}`, type: 'crush', value: 0.2 },
        { id: `fx-d2-${Date.now()}`, type: 'lpf', value: 0.95 }
      ]
    });
  } else if (p.includes('hiphop') || p.includes('lofi')) {
    stems.push({
      name: 'Dusty 808 Drums',
      category: 'drums',
      muted: false,
      solo: false,
      volume: 0.85,
      bank: 'RolandTR808',
      pattern: 'bd ~ sd [~ bd], [hh*4]',
      effects: [
        { id: `fx-d1-${Date.now()}`, type: 'crush', value: 0.3 },
        { id: `fx-d2-${Date.now()}`, type: 'lpf', value: 0.75 }
      ]
    });
  } else {
    stems.push({
      name: 'Standard Beats',
      category: 'drums',
      muted: false,
      solo: false,
      volume: 0.85,
      bank: 'RolandTR909',
      pattern: 'bd*4, [~ sd]*2, [~ hh]*4',
      effects: [{ id: `fx-d1-${Date.now()}`, type: 'lpf', value: 0.9 }]
    });
  }

  // 3. Build Bass Channel
  if (p.includes('acid') || p.includes('303')) {
    stems.push({
      name: 'Resonant 303 Acid',
      category: 'bass',
      muted: false,
      solo: false,
      volume: 0.85,
      bank: 'sawtooth',
      pattern: 'c1 [~ c1] eb1 [f1 g1]',
      effects: [
        { id: `fx-b1-${Date.now()}`, type: 'lpf', value: 0.4 },
        { id: `fx-b2-${Date.now()}`, type: 'crush', value: 0.2 }
      ]
    });
  } else if (p.includes('synthwave') || p.includes('cyberpunk') || p.includes('drive')) {
    stems.push({
      name: 'Octave Drive Bass',
      category: 'bass',
      muted: false,
      solo: false,
      volume: 0.82,
      bank: 'sawtooth',
      pattern: 'c2*8',
      effects: [
        { id: `fx-b1-${Date.now()}`, type: 'lpf', value: 0.55 },
        { id: `fx-b2-${Date.now()}`, type: 'room', value: 0.2 }
      ]
    });
  } else {
    stems.push({
      name: 'Deep Sub Bass',
      category: 'bass',
      muted: false,
      solo: false,
      volume: 0.8,
      bank: 'sawtooth',
      pattern: 'c1 [~ c1] g1 f1',
      effects: [{ id: `fx-b1-${Date.now()}`, type: 'lpf', value: 0.35 }]
    });
  }

  // 4. Build Lead / Melody Channel
  if (p.includes('arp') || p.includes('arpeggio')) {
    stems.push({
      name: 'Arp Synth Lead',
      category: 'lead',
      muted: false,
      solo: false,
      volume: 0.72,
      bank: 'square',
      pattern: '[c4 e4 g4 b4]*2',
      effects: [
        { id: `fx-l1-${Date.now()}`, type: 'delay', value: 0.45 },
        { id: `fx-l2-${Date.now()}`, type: 'room', value: 0.4 }
      ]
    });
  } else if (p.includes('space') || p.includes('delay') || p.includes('lead')) {
    stems.push({
      name: 'Space Echo Lead',
      category: 'lead',
      muted: false,
      solo: false,
      volume: 0.68,
      bank: 'gm_lead',
      pattern: '~ [g4 c5] ~ e5',
      effects: [
        { id: `fx-l1-${Date.now()}`, type: 'delay', value: 0.5 },
        { id: `fx-l2-${Date.now()}`, type: 'room', value: 0.6 }
      ]
    });
  } else {
    stems.push({
      name: 'Melodic Synth',
      category: 'lead',
      muted: false,
      solo: false,
      volume: 0.65,
      bank: 'gm_lead',
      pattern: 'c4 e4 g4 b4',
      effects: [{ id: `fx-l1-${Date.now()}`, type: 'delay', value: 0.3 }]
    });
  }

  // 5. Build Atmosphere / Pad Channel if requested
  if (p.includes('pad') || p.includes('ambient') || p.includes('chord') || p.includes('house')) {
    stems.push({
      name: 'Atmosphere Chords',
      category: 'pad',
      muted: false,
      solo: false,
      volume: 0.6,
      bank: 'sawtooth',
      pattern: '[c3,eb3,g3,bb3] ~ [f3,ab3,c4,eb4]',
      effects: [
        { id: `fx-p1-${Date.now()}`, type: 'room', value: 0.7 },
        { id: `fx-p2-${Date.now()}`, type: 'lpf', value: 0.6 }
      ]
    });
  }

  const generatedPayload: StudioJSONPayload = {
    bpm,
    description: `Local AST Transpiler output for prompt: "${prompt}"`,
    stems,
  };

  return generatedPayload;
}
