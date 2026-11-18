export type ValveTuple = [boolean, boolean, boolean];

export type TrumpetKeyId = 'Bb' | 'C' | 'D' | 'Eb' | 'F' | 'PiccBb';

export type MuteType = 'open' | 'straight' | 'cup' | 'harmon';

export interface TrumpetKeyConfig {
  id: TrumpetKeyId;
  label: string;
  shortLabel: string;
  transposeSemitones: number; // Relative to written C4 = concert C4
  description: string;
}

export const TRUMPET_KEYS: TrumpetKeyConfig[] = [
  {
    id: 'Bb',
    label: 'Bb Standard',
    shortLabel: 'Bb',
    transposeSemitones: -2,
    description: 'Standard orchestral & jazz trumpet (sounds M2 lower than written)',
  },
  {
    id: 'C',
    label: 'C Orchestral',
    shortLabel: 'C',
    transposeSemitones: 0,
    description: 'Brighter orchestral concert-pitch trumpet',
  },
  {
    id: 'D',
    label: 'D Baroque',
    shortLabel: 'D',
    transposeSemitones: 2,
    description: 'Classical & Baroque trumpet (sounds M2 higher)',
  },
  {
    id: 'Eb',
    label: 'Eb Soprano',
    shortLabel: 'Eb',
    transposeSemitones: 3,
    description: 'Solo concerto trumpet (sounds m3 higher)',
  },
  {
    id: 'F',
    label: 'F High',
    shortLabel: 'F',
    transposeSemitones: 5,
    description: 'High-register Bach-era trumpet (sounds P4 higher)',
  },
  {
    id: 'PiccBb',
    label: 'Piccolo Bb',
    shortLabel: 'Picc Bb',
    transposeSemitones: 10,
    description: 'Piccolo trumpet tuned one octave above standard Bb',
  },
];

export interface HarmonicPartial {
  id: number; // 1, 2, 3, 4, 5, 6, 8
  name: string;
  openWrittenMidi: number;
  openNoteLabel: string;
  airCenter: number; // 0..100
  airMin: number;
  airMax: number;
  keyHint: string;
  registerLabel: string;
}

export const HARMONIC_PARTIALS: HarmonicPartial[] = [
  {
    id: 1,
    name: 'Pedal',
    openWrittenMidi: 48, // C3
    openNoteLabel: 'C3',
    airCenter: 8,
    airMin: 0,
    airMax: 15,
    keyHint: 'Z',
    registerLabel: 'Pedal Tone',
  },
  {
    id: 2,
    name: 'Low',
    openWrittenMidi: 60, // C4
    openNoteLabel: 'C4',
    airCenter: 24,
    airMin: 15,
    airMax: 34,
    keyHint: 'A',
    registerLabel: 'Gentle Air',
  },
  {
    id: 3,
    name: 'Mid-Low',
    openWrittenMidi: 67, // G4
    openNoteLabel: 'G4',
    airCenter: 42,
    airMin: 34,
    airMax: 51,
    keyHint: 'S',
    registerLabel: 'Steady Air',
  },
  {
    id: 4,
    name: 'Middle',
    openWrittenMidi: 72, // C5
    openNoteLabel: 'C5',
    airCenter: 58,
    airMin: 51,
    airMax: 67,
    keyHint: 'D',
    registerLabel: 'Focused Air',
  },
  {
    id: 5,
    name: 'Upper',
    openWrittenMidi: 76, // E5
    openNoteLabel: 'E5',
    airCenter: 74,
    airMin: 67,
    airMax: 82,
    keyHint: 'F',
    registerLabel: 'Fast Air',
  },
  {
    id: 6,
    name: 'High',
    openWrittenMidi: 79, // G5
    openNoteLabel: 'G5',
    airCenter: 88,
    airMin: 82,
    airMax: 93,
    keyHint: 'G',
    registerLabel: 'High Pressure',
  },
  {
    id: 8,
    name: 'Lead C',
    openWrittenMidi: 84, // C6
    openNoteLabel: 'C6',
    airCenter: 97,
    airMin: 93,
    airMax: 100,
    keyHint: 'H',
    registerLabel: 'Lead Air',
  },
];

// Primary recommended air pressure buttons (Partials 2..8, plus Pedal accessible via Z or slider)
export const RECOMMENDED_PARTIALS = HARMONIC_PARTIALS.filter((p) => p.id >= 2);

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_DISPLAY = ['C', 'C#/Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function midiToNoteName(midi: number, concise = true): string {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const pc = ((rounded % 12) + 12) % 12;
  const base = concise ? NOTE_NAMES_SHARP[pc] : NOTE_NAMES_DISPLAY[pc];
  return `${base}${octave}`;
}

export function midiToFrequency(midi: number, a4Hz = 440, centsOffset = 0): number {
  const effectiveMidi = midi + centsOffset / 100;
  return a4Hz * Math.pow(2, (effectiveMidi - 69) / 12);
}

export function getValveSemitoneDrop(valves: ValveTuple): number {
  let drop = 0;
  if (valves[0]) drop += 2; // Valve 1: whole step
  if (valves[1]) drop += 1; // Valve 2: half step
  if (valves[2]) drop += 3; // Valve 3: minor third
  return drop;
}

export function getValveLabel(valves: ValveTuple): string {
  const active: number[] = [];
  if (valves[0]) active.push(1);
  if (valves[1]) active.push(2);
  if (valves[2]) active.push(3);
  return active.length === 0 ? 'Open (0)' : active.join(' + ');
}

export function getPartialFromAirPressure(airPressure: number): HarmonicPartial {
  const clamped = Math.max(0, Math.min(100, airPressure));
  for (const partial of HARMONIC_PARTIALS) {
    if (clamped >= partial.airMin && clamped <= partial.airMax) {
      return partial;
    }
  }
  return HARMONIC_PARTIALS[3]; // Fallback to Middle C5
}

export interface TrumpetPitchState {
  partial: HarmonicPartial;
  valveDropSemitones: number;
  writtenMidi: number;
  writtenNote: string;
  writtenNoteFull: string;
  concertMidi: number;
  concertNote: string;
  frequencyHz: number;
  embouchureCents: number; // Natural micro-bend from partial sweet spot + user lip bend
  totalTubeLengthPct: number; // 100% open up to ~141% for 1+2+3
}

export function calculateTrumpetPitch(params: {
  valves: ValveTuple;
  airPressure: number;
  keyId: TrumpetKeyId;
  a4Hz: number;
  lipBendCents: number;
  naturalValveIntonation?: boolean;
}): TrumpetPitchState {
  const { valves, airPressure, keyId, a4Hz, lipBendCents } = params;
  const partial = getPartialFromAirPressure(airPressure);
  const valveDropSemitones = getValveSemitoneDrop(valves);
  const writtenMidi = partial.openWrittenMidi - valveDropSemitones;

  const keyCfg = TRUMPET_KEYS.find((k) => k.id === keyId) ?? TRUMPET_KEYS[0];
  const concertMidi = writtenMidi + keyCfg.transposeSemitones;

  // Natural lip-slot pull: slight cents deviation if air pressure isn't centered on the partial sweet spot
  const halfSpan = Math.max(1, (partial.airMax - partial.airMin) / 2);
  const normalizedDelta = (airPressure - partial.airCenter) / halfSpan;
  const slotPullCents = Math.max(-16, Math.min(16, normalizedDelta * 12));

  const embouchureCents = Math.round(slotPullCents + lipBendCents);
  const frequencyHz = midiToFrequency(concertMidi, a4Hz, embouchureCents);

  // Physics: lowering pitch by N semitones scales tube length by 2^(N/12)
  const totalTubeLengthPct = Math.round(Math.pow(2, valveDropSemitones / 12) * 100);

  return {
    partial,
    valveDropSemitones,
    writtenMidi,
    writtenNote: midiToNoteName(writtenMidi, true),
    writtenNoteFull: midiToNoteName(writtenMidi, false),
    concertMidi,
    concertNote: midiToNoteName(concertMidi, true),
    frequencyHz,
    embouchureCents,
    totalTubeLengthPct,
  };
}

export interface ChromaticFingeringEntry {
  writtenMidi: number;
  writtenNote: string;
  displayNote: string;
  valves: ValveTuple;
  valveLabel: string;
  partialId: number;
  airCenter: number;
  keyHint: string;
  alternateLabel?: string;
}

// Complete standard chromatic range of the trumpet: F#3 (MIDI 54) to C6 (MIDI 84)
export const CHROMATIC_FINGERING_CHART: ChromaticFingeringEntry[] = [
  { writtenMidi: 54, writtenNote: 'F#3', displayNote: 'F#3 / Gb3', valves: [true, true, true], valveLabel: '1+2+3', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 55, writtenNote: 'G3', displayNote: 'G3', valves: [true, false, true], valveLabel: '1+3', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 56, writtenNote: 'G#3', displayNote: 'Ab3 / G#3', valves: [false, true, true], valveLabel: '2+3', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 57, writtenNote: 'A3', displayNote: 'A3', valves: [true, true, false], valveLabel: '1+2', partialId: 2, airCenter: 24, keyHint: 'A', alternateLabel: '3' },
  { writtenMidi: 58, writtenNote: 'A#3', displayNote: 'Bb3 / A#3', valves: [true, false, false], valveLabel: '1', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 59, writtenNote: 'B3', displayNote: 'B3', valves: [false, true, false], valveLabel: '2', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 60, writtenNote: 'C4', displayNote: 'C4', valves: [false, false, false], valveLabel: '0', partialId: 2, airCenter: 24, keyHint: 'A' },
  { writtenMidi: 61, writtenNote: 'C#4', displayNote: 'C#4 / Db4', valves: [true, true, true], valveLabel: '1+2+3', partialId: 3, airCenter: 42, keyHint: 'S' },
  { writtenMidi: 62, writtenNote: 'D4', displayNote: 'D4', valves: [true, false, true], valveLabel: '1+3', partialId: 3, airCenter: 42, keyHint: 'S' },
  { writtenMidi: 63, writtenNote: 'D#4', displayNote: 'Eb4 / D#4', valves: [false, true, true], valveLabel: '2+3', partialId: 3, airCenter: 42, keyHint: 'S' },
  { writtenMidi: 64, writtenNote: 'E4', displayNote: 'E4', valves: [true, true, false], valveLabel: '1+2', partialId: 3, airCenter: 42, keyHint: 'S', alternateLabel: '3' },
  { writtenMidi: 65, writtenNote: 'F4', displayNote: 'F4', valves: [true, false, false], valveLabel: '1', partialId: 3, airCenter: 42, keyHint: 'S' },
  { writtenMidi: 66, writtenNote: 'F#4', displayNote: 'F#4 / Gb4', valves: [false, true, false], valveLabel: '2', partialId: 3, airCenter: 42, keyHint: 'S' },
  { writtenMidi: 67, writtenNote: 'G4', displayNote: 'G4', valves: [false, false, false], valveLabel: '0', partialId: 3, airCenter: 42, keyHint: 'S', alternateLabel: '1+3' },
  { writtenMidi: 68, writtenNote: 'G#4', displayNote: 'Ab4 / G#4', valves: [false, true, true], valveLabel: '2+3', partialId: 4, airCenter: 58, keyHint: 'D' },
  { writtenMidi: 69, writtenNote: 'A4', displayNote: 'A4', valves: [true, true, false], valveLabel: '1+2', partialId: 4, airCenter: 58, keyHint: 'D', alternateLabel: '3' },
  { writtenMidi: 70, writtenNote: 'A#4', displayNote: 'Bb4 / A#4', valves: [true, false, false], valveLabel: '1', partialId: 4, airCenter: 58, keyHint: 'D' },
  { writtenMidi: 71, writtenNote: 'B4', displayNote: 'B4', valves: [false, true, false], valveLabel: '2', partialId: 4, airCenter: 58, keyHint: 'D' },
  { writtenMidi: 72, writtenNote: 'C5', displayNote: 'C5', valves: [false, false, false], valveLabel: '0', partialId: 4, airCenter: 58, keyHint: 'D' },
  { writtenMidi: 73, writtenNote: 'C#5', displayNote: 'C#5 / Db5', valves: [true, true, false], valveLabel: '1+2', partialId: 5, airCenter: 74, keyHint: 'F' },
  { writtenMidi: 74, writtenNote: 'D5', displayNote: 'D5', valves: [true, false, false], valveLabel: '1', partialId: 5, airCenter: 74, keyHint: 'F' },
  { writtenMidi: 75, writtenNote: 'D#5', displayNote: 'Eb5 / D#5', valves: [false, true, false], valveLabel: '2', partialId: 5, airCenter: 74, keyHint: 'F' },
  { writtenMidi: 76, writtenNote: 'E5', displayNote: 'E5', valves: [false, false, false], valveLabel: '0', partialId: 5, airCenter: 74, keyHint: 'F', alternateLabel: '1+2' },
  { writtenMidi: 77, writtenNote: 'F5', displayNote: 'F5', valves: [true, false, false], valveLabel: '1', partialId: 6, airCenter: 88, keyHint: 'G' },
  { writtenMidi: 78, writtenNote: 'F#5', displayNote: 'F#5 / Gb5', valves: [false, true, false], valveLabel: '2', partialId: 6, airCenter: 88, keyHint: 'G' },
  { writtenMidi: 79, writtenNote: 'G5', displayNote: 'G5', valves: [false, false, false], valveLabel: '0', partialId: 6, airCenter: 88, keyHint: 'G' },
  { writtenMidi: 80, writtenNote: 'G#5', displayNote: 'Ab5 / G#5', valves: [false, true, true], valveLabel: '2+3', partialId: 6, airCenter: 88, keyHint: 'G', alternateLabel: '1+2+3 (P8)' },
  { writtenMidi: 81, writtenNote: 'A5', displayNote: 'A5', valves: [true, true, false], valveLabel: '1+2', partialId: 8, airCenter: 97, keyHint: 'H' },
  { writtenMidi: 82, writtenNote: 'A#5', displayNote: 'Bb5 / A#5', valves: [true, false, false], valveLabel: '1', partialId: 8, airCenter: 97, keyHint: 'H' },
  { writtenMidi: 83, writtenNote: 'B5', displayNote: 'B5', valves: [false, true, false], valveLabel: '2', partialId: 8, airCenter: 97, keyHint: 'H' },
  { writtenMidi: 84, writtenNote: 'C6', displayNote: 'C6', valves: [false, false, false], valveLabel: '0', partialId: 8, airCenter: 97, keyHint: 'H' },
];

export interface MelodyStep {
  note: string;
  writtenMidi: number;
  valves: ValveTuple;
  partialId: number;
  durationMs: number;
}

export interface PracticeMelody<TStep extends MelodyStep = MelodyStep> {
  id: string;
  title: string;
  subtitle: string;
  category: 'scale' | 'melody';
  tempoBpm: number;
  steps: TStep[];
}

export interface RecordedEvent {
  tMs: number;
  isBlowing: boolean;
  valves: ValveTuple;
  airPressure: number;
  keyId: TrumpetKeyId;
  mute: MuteType;
  a4Hz: number;
  lipBendCents: number;
  vibratoCents: number;
  writtenNote: string;
}

export interface RecordedPhrase {
  id: string;
  durationMs: number;
  noteCount: number;
  events: RecordedEvent[];
}

export const PRACTICE_SCALES: PracticeMelody[] = [
  {
    id: 'c-major-scale',
    title: 'C Major Scale',
    subtitle: '8-note ascending scale from Low C4 to Middle C5',
    category: 'scale',
    tempoBpm: 96,
    steps: [
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 480 },
      { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 480 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 480 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 480 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 480 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 480 },
      { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 480 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 760 },
    ],
  },
  {
    id: 'c-major-up-down',
    title: 'C Major Scale (Up & Down)',
    subtitle: 'Full ascending and descending C Major warm-up',
    category: 'scale',
    tempoBpm: 100,
    steps: [
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 380 },
      { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 380 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 380 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 380 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 380 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 380 },
      { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 380 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 520 },
      { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 380 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 380 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 380 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 380 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 380 },
      { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 380 },
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 680 },
    ],
  },
  {
    id: 'f-major-scale',
    title: 'F Major Scale',
    subtitle: 'One flat (Bb4 on Valve 1) from F4 to F5',
    category: 'scale',
    tempoBpm: 96,
    steps: [
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 460 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 460 },
      { note: 'Bb4', writtenMidi: 70, valves: [true, false, false], partialId: 4, durationMs: 460 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 460 },
      { note: 'D5', writtenMidi: 74, valves: [true, false, false], partialId: 5, durationMs: 460 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 460 },
      { note: 'F5', writtenMidi: 77, valves: [true, false, false], partialId: 6, durationMs: 740 },
    ],
  },
  {
    id: 'g-major-scale',
    title: 'G Major Scale',
    subtitle: 'One sharp (F#5 on Valve 2) from G4 to G5',
    category: 'scale',
    tempoBpm: 96,
    steps: [
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 460 },
      { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 460 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 460 },
      { note: 'D5', writtenMidi: 74, valves: [true, false, false], partialId: 5, durationMs: 460 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 460 },
      { note: 'F#5', writtenMidi: 78, valves: [false, true, false], partialId: 6, durationMs: 460 },
      { note: 'G5', writtenMidi: 79, valves: [false, false, false], partialId: 6, durationMs: 740 },
    ],
  },
  {
    id: 'c-pentatonic-scale',
    title: 'C Major Pentatonic',
    subtitle: '5-note melodic pattern (C4 · D4 · E4 · G4 · A4 · C5)',
    category: 'scale',
    tempoBpm: 104,
    steps: [
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 440 },
      { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 440 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 440 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 440 },
      { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 440 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 720 },
    ],
  },
];

export const PRACTICE_MELODIES: PracticeMelody[] = [
  {
    id: 'bugle-call',
    title: 'Reveille Bugle Call',
    subtitle: 'All Open (0) valves — played purely with Air Pressure',
    category: 'melody',
    tempoBpm: 120,
    steps: [
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 260 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 260 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 260 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 520 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 260 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 260 },
      { note: 'G5', writtenMidi: 79, valves: [false, false, false], partialId: 6, durationMs: 520 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 260 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 650 },
    ],
  },
  {
    id: 'saints-march',
    title: 'When the Saints Go Marching In',
    subtitle: 'Brass jazz standard using Mid-Low & Middle air pressure',
    category: 'melody',
    tempoBpm: 120,
    steps: [
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 320 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 320 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 320 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 780 },
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 320 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 320 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 320 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 780 },
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 320 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 320 },
      { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 320 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 480 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 480 },
      { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 480 },
      { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 480 },
      { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 780 },
    ],
  },
  {
    id: 'fanfare-motif',
    title: 'Heroic Brass Fanfare',
    subtitle: 'Bold fifths & fourths across Middle and High registers',
    category: 'melody',
    tempoBpm: 112,
    steps: [
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 260 },
      { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 720 },
      { note: 'G5', writtenMidi: 79, valves: [false, false, false], partialId: 6, durationMs: 620 },
      { note: 'F5', writtenMidi: 77, valves: [true, false, false], partialId: 6, durationMs: 240 },
      { note: 'E5', writtenMidi: 76, valves: [false, false, false], partialId: 5, durationMs: 240 },
      { note: 'D5', writtenMidi: 74, valves: [true, false, false], partialId: 5, durationMs: 240 },
      { note: 'C6', writtenMidi: 84, valves: [false, false, false], partialId: 8, durationMs: 740 },
      { note: 'G5', writtenMidi: 79, valves: [false, false, false], partialId: 6, durationMs: 450 },
    ],
  },
];
