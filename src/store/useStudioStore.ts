import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type SoundCategory = 'drums' | 'bass' | 'lead' | 'pad' | 'fx';
export type ArrangementMode = 'stack' | 'cat';

export interface StemEffect {
  id: string;
  type: 'lpf' | 'hpf' | 'delay' | 'room' | 'crush' | 'gain';
  value: number; // 0.0 to 1.0
}

export interface StemChannel {
  id: string;
  name: string;
  category: SoundCategory;
  muted: boolean;
  solo: boolean;
  volume: number; // 0.0 to 1.0
  pan?: number; // 0.0 (left) to 1.0 (right), default 0.5
  bank?: string;
  pattern: string; // Strudel mini-notation
  effects: StemEffect[];
}

export interface StudioJSONPayload {
  bpm: number;
  description?: string;
  arrangementMode?: ArrangementMode;
  masterVolume?: number;
  stems: Omit<StemChannel, 'id'>[];
}

export interface StudioState {
  bpm: number;
  quantum: number;
  isPlaying: boolean;
  masterVolume: number;
  arrangementMode: ArrangementMode;
  stems: StemChannel[];
  savedPalette: StemChannel[];

  setBpm: (bpm: number) => void;
  setQuantum: (quantum: number) => void;
  setMasterVolume: (vol: number) => void;
  setArrangementMode: (mode: ArrangementMode) => void;
  setPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  addStem: (stem: Omit<StemChannel, 'id'>) => void;
  reorderStems: (newStems: StemChannel[]) => void;
  updateStem: (id: string, partial: Partial<StemChannel>) => void;
  removeStem: (id: string) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  addEffect: (stemId: string, effectType: StemEffect['type']) => void;
  removeEffect: (stemId: string, effectId: string) => void;
  updateEffect: (stemId: string, effectId: string, value: number) => void;
  loadPresetFromJSON: (payload: StudioJSONPayload) => void;
  saveStemToPalette: (stemId: string) => void;
  removeSavedStem: (savedId: string) => void;
  addSavedStemToRack: (savedStem: StemChannel) => void;
}

const DEFAULT_STEMS: StemChannel[] = [
  {
    id: 'stem-1',
    name: 'Drums',
    category: 'drums',
    muted: false,
    solo: false,
    volume: 0.85,
    pan: 0.5,
    bank: 'RolandTR909',
    pattern: 'bd*4, [~ sd]*2, [hh*8]',
    effects: [
      { id: 'fx-1', type: 'lpf', value: 0.9 },
      { id: 'fx-2', type: 'room', value: 0.2 }
    ]
  },
  {
    id: 'stem-2',
    name: 'Acid Bass',
    category: 'bass',
    muted: false,
    solo: false,
    volume: 0.75,
    pan: 0.4,
    bank: 'sawtooth',
    pattern: 'c2 [~ c2] eb2 f2',
    effects: [
      { id: 'fx-3', type: 'lpf', value: 0.4 },
      { id: 'fx-4', type: 'crush', value: 0.1 }
    ]
  },
  {
    id: 'stem-3',
    name: 'Melodic Lead',
    category: 'lead',
    muted: false,
    solo: false,
    volume: 0.6,
    pan: 0.6,
    bank: 'square',
    pattern: 'g4 c5 e5 g5',
    effects: [
      { id: 'fx-5', type: 'delay', value: 0.3 },
      { id: 'fx-6', type: 'room', value: 0.5 }
    ]
  }
];

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    bpm: 124,
    quantum: 4,
    isPlaying: false,
    masterVolume: 0.8,
    arrangementMode: 'stack',
    stems: DEFAULT_STEMS,
    savedPalette: [],

    setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(240, bpm)) }),
    setQuantum: (quantum) => set({ quantum }),
    setMasterVolume: (masterVolume) => set({ masterVolume }),
    setArrangementMode: (arrangementMode) => set({ arrangementMode }),
    setPlaying: (isPlaying) => set({ isPlaying }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    addStem: (newStem) =>
      set((state) => ({
        stems: [
          ...state.stems,
          {
            ...newStem,
            id: `stem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
          }
        ]
      })),

    reorderStems: (newStems) => set({ stems: newStems }),

    updateStem: (id, partial) =>
      set((state) => ({
        stems: state.stems.map((stem) =>
          stem.id === id ? { ...stem, ...partial } : stem
        )
      })),

    removeStem: (id) =>
      set((state) => ({
        stems: state.stems.filter((stem) => stem.id !== id)
      })),

    toggleMute: (id) =>
      set((state) => ({
        stems: state.stems.map((stem) =>
          stem.id === id ? { ...stem, muted: !stem.muted } : stem
        )
      })),

    toggleSolo: (id) =>
      set((state) => {
        const targetStem = state.stems.find((s) => s.id === id);
        if (!targetStem) return state;
        const isCurrentlySoloed = targetStem.solo;

        return {
          stems: state.stems.map((stem) => {
            if (stem.id === id) {
              return { ...stem, solo: !isCurrentlySoloed };
            }
            return stem;
          })
        };
      }),

    addEffect: (stemId, effectType) =>
      set((state) => ({
        stems: state.stems.map((stem) => {
          if (stem.id !== stemId) return stem;
          const newFx: StemEffect = {
            id: `fx-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
            type: effectType,
            value: 0.5
          };
          return {
            ...stem,
            effects: [...stem.effects, newFx]
          };
        })
      })),

    removeEffect: (stemId, effectId) =>
      set((state) => ({
        stems: state.stems.map((stem) => {
          if (stem.id !== stemId) return stem;
          return {
            ...stem,
            effects: stem.effects.filter((fx) => fx.id !== effectId)
          };
        })
      })),

    updateEffect: (stemId, effectId, value) =>
      set((state) => ({
        stems: state.stems.map((stem) => {
          if (stem.id !== stemId) return stem;
          return {
            ...stem,
            effects: stem.effects.map((fx) =>
              fx.id === effectId ? { ...fx, value } : fx
            )
          };
        })
      })),

    loadPresetFromJSON: (payload) => {
      const formattedStems: StemChannel[] = payload.stems.map((s, idx) => ({
        ...s,
        id: `stem-${Date.now()}-${idx}`
      }));

      set({
        bpm: payload.bpm || get().bpm,
        masterVolume: payload.masterVolume ?? get().masterVolume,
        arrangementMode: payload.arrangementMode || get().arrangementMode,
        stems: formattedStems
      });
    },

    saveStemToPalette: (stemId) =>
      set((state) => {
        const stemToSave = state.stems.find((s) => s.id === stemId);
        if (!stemToSave) return state;
        return {
          savedPalette: [
            ...state.savedPalette,
            { ...stemToSave, id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` }
          ]
        };
      }),

    removeSavedStem: (savedId) =>
      set((state) => ({
        savedPalette: state.savedPalette.filter((s) => s.id !== savedId)
      })),

    addSavedStemToRack: (savedStem) =>
      set((state) => ({
        stems: [
          ...state.stems,
          {
            ...savedStem,
            id: `stem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
          }
        ]
      }))
  }))
);
