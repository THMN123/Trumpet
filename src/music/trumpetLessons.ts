import {
  HARMONIC_PARTIALS,
  MelodyStep,
  PracticeMelody,
  TrumpetKeyId,
  ValveTuple,
  getValveLabel,
} from './trumpetPhysics';

export interface LessonDrillStep extends MelodyStep {
  beatLabel: string; // e.g. '1 beat' | '2 beats'
  staffHint: string; // e.g. 'Ledger line below staff' | 'Bottom line (E)'
}

export interface TrumpetLesson {
  number: number;
  id: string;
  title: string;
  level: 'Beginner' | 'Foundations' | 'Intermediate';
  focus: string;
  teacherExplanation: string;
  keyTakeaways: string[];
  recommendedBpm: number;
  drill: PracticeMelody<LessonDrillStep>;
}

export const TRUMPET_LESSONS: TrumpetLesson[] = [
  {
    number: 1,
    id: 'lesson-1-first-sound',
    title: '01. Making Your First Sound & Breath Control',
    level: 'Beginner',
    focus: 'Open valves (0) · Gentle vs Focused Air',
    teacherExplanation:
      'Before touching any valves, a brass player learns to control airflow. With all three valves up (Open), gentle slow air produces Low C (C4), while faster focused air jumps an octave higher to Middle C (C5).',
    keyTakeaways: [
      'Keep all 3 valves untouched (Open 0) for this entire lesson.',
      'Hold key A for Low C4 (Gentle Air), release, then hold key D for Middle C5 (Focused Air).',
      'Think of blowing warm "ho" air for low notes and cool, fast "hee" air for higher notes.',
    ],
    recommendedBpm: 72,
    drill: {
      id: 'lesson-1-drill',
      title: 'Lesson 1: Open Octaves',
      subtitle: 'Alternate between Low C4 (key A) and Middle C5 (key D)',
      category: 'scale',
      tempoBpm: 72,
      steps: [
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 750, beatLabel: '2 beats', staffHint: 'Ledger line below staff' },
        { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 750, beatLabel: '2 beats', staffHint: '3rd space (F-A-C-E)' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 750, beatLabel: '2 beats', staffHint: 'Ledger line below staff' },
        { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 900, beatLabel: 'Hold', staffHint: '3rd space (F-A-C-E)' },
      ],
    },
  },
  {
    number: 2,
    id: 'lesson-2-harmonic-series',
    title: '02. Lip Slurs & The Harmonic Series',
    level: 'Beginner',
    focus: 'Playing 3 different notes with Zero Valves',
    teacherExplanation:
      'How do bugles play whole songs without any valves? By stepping through the natural harmonic series of a brass tube. Between Low C4 and Middle C5 sits G4—still Open (0), using steady Mid-Low air.',
    keyTakeaways: [
      'C4 (key A), G4 (key S), and C5 (key D) all use Open (0) valves.',
      'To climb higher, accelerate your air speed smoothly without pinching.',
      'This 3-note open arpeggio (C4 · G4 · C5) is the warm-up every trumpeter plays daily.',
    ],
    recommendedBpm: 80,
    drill: {
      id: 'lesson-2-drill',
      title: 'Lesson 2: Bugle Arpeggio',
      subtitle: 'Climb and descend C4 · G4 · C5 using only Air keys A, S, D',
      category: 'scale',
      tempoBpm: 80,
      steps: [
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 550, beatLabel: '1 beat', staffHint: 'Ledger line below' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 550, beatLabel: '1 beat', staffHint: '2nd line (Every Good)' },
        { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 750, beatLabel: '2 beats', staffHint: '3rd space (C)' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 550, beatLabel: '1 beat', staffHint: '2nd line (G)' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 850, beatLabel: '2 beats', staffHint: 'Ledger line below' },
      ],
    },
  },
  {
    number: 3,
    id: 'lesson-3-three-valves',
    title: '03. Meet the Three Valves (Lowering Pitch)',
    level: 'Beginner',
    focus: 'How Valves 1, 2, and 3 add tubing length',
    teacherExplanation:
      'Valves never raise pitch—they always lower it by routing air through extra brass loops. Valve 2 lowers by 1 half-step, Valve 1 lowers by 2 half-steps (a whole step), and Valve 1+2 together lower by 3 half-steps.',
    keyTakeaways: [
      'Start on Middle C5 (Open 0 + key D).',
      'Press Valve 2 (key 2, W, or ↓) to drop 1 half-step down to B4.',
      'Press Valve 1 (key 1, Q, or ←) for Bb4, and Valves 1+2 together for A4.',
    ],
    recommendedBpm: 76,
    drill: {
      id: 'lesson-3-drill',
      title: 'Lesson 3: Chromatic Step-Down',
      subtitle: 'Hold Middle Air (D) and walk down C5 · B4 · Bb4 · A4',
      category: 'scale',
      tempoBpm: 76,
      steps: [
        { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 600, beatLabel: '2 beats', staffHint: '3rd space' },
        { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 600, beatLabel: '2 beats', staffHint: '3rd line (Boy)' },
        { note: 'Bb4', writtenMidi: 70, valves: [true, false, false], partialId: 4, durationMs: 600, beatLabel: '2 beats', staffHint: '3rd line flat' },
        { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 850, beatLabel: '2 beats', staffHint: '2nd space (A)' },
      ],
    },
  },
  {
    number: 4,
    id: 'lesson-4-reading-treble-clef',
    title: '04. Reading Music: Your First Three Notes (E · D · C)',
    level: 'Beginner',
    focus: 'Treble staff lines & spaces · Playing your first tune',
    teacherExplanation:
      'In treble clef, the five lines from bottom to top spell E-G-B-D-F ("Every Good Boy Does Fine") and the four spaces spell F-A-C-E. Watch the staff above: E4 sits on the bottom line, D4 hangs just beneath it, and C4 sits on its own ledger line.',
    keyTakeaways: [
      'E4 (bottom line): Valves 1+2 with Mid-Low Air (key S).',
      'D4 (just under bottom line): Valves 1+3 with Mid-Low Air (key S).',
      'C4 (ledger line): Open (0) with Gentle Air (key A). Notice the air shift down for C4!',
    ],
    recommendedBpm: 80,
    drill: {
      id: 'lesson-4-drill',
      title: 'Lesson 4: Hot Cross Buns',
      subtitle: 'Play E4 · D4 · C4 twice using real treble clef reading',
      category: 'melody',
      tempoBpm: 80,
      steps: [
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 520, beatLabel: '1 beat', staffHint: 'Bottom line (Every)' },
        { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 520, beatLabel: '1 beat', staffHint: 'Space below line 1' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 900, beatLabel: '2 beats', staffHint: 'Ledger line (C4)' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 520, beatLabel: '1 beat', staffHint: 'Bottom line (E)' },
        { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 520, beatLabel: '1 beat', staffHint: 'Space below line 1' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 950, beatLabel: '2 beats', staffHint: 'Ledger line (C4)' },
      ],
    },
  },
  {
    number: 5,
    id: 'lesson-5-five-note-melody',
    title: '05. Five-Note Range & Ode to Joy',
    level: 'Foundations',
    focus: 'Adding F4 (Valve 1) and G4 (Open 0) · Smooth melodies',
    teacherExplanation:
      'Now we add two notes above E4: F4 sits in the first space ("F" in F-A-C-E) using Valve 1, and G4 sits on the second line ("Good") using Open (0). All four notes D4, E4, F4, and G4 share Mid-Low Air (key S), so you only move your fingers!',
    keyTakeaways: [
      'D4 (1+3), E4 (1+2), F4 (1), and G4 (0) all sit in Partial 3 (key S).',
      'Only C4 drops down to Gentle Air (key A).',
      'Keep your air steady on S while walking your fingers cleanly between 1+2, 1, and 0.',
    ],
    recommendedBpm: 88,
    drill: {
      id: 'lesson-5-drill',
      title: 'Lesson 5: Ode to Joy (Opening)',
      subtitle: 'Beethoven’s famous 5-note melody from C4 to G4',
      category: 'melody',
      tempoBpm: 88,
      steps: [
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '1st line (E)' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '1st line (E)' },
        { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '1st space (F)' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '2nd line (G)' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '2nd line (G)' },
        { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '1st space (F)' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: '1st line (E)' },
        { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: 'Below 1st line (D)' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 460, beatLabel: '1 beat', staffHint: 'Ledger line (C)' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 460, beatLabel: '1 beat', staffHint: 'Ledger line (C)' },
        { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 460, beatLabel: '1 beat', staffHint: 'Below 1st line (D)' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 700, beatLabel: '2 beats', staffHint: '1st line (E)' },
      ],
    },
  },
  {
    number: 6,
    id: 'lesson-6-c-major-scale',
    title: '06. The Full C Major Scale (Crossing Registers)',
    level: 'Foundations',
    focus: 'Connecting Partial 2 → Partial 3 → Partial 4 smoothly',
    teacherExplanation:
      'A Major Scale follows the pattern Whole-Whole-Half-Whole-Whole-Whole-Half. On trumpet, climbing from G4 (Open, key S) up to A4 (1+2, key D) requires stepping into the next harmonic partial while pressing Valves 1+2.',
    keyTakeaways: [
      'Lower half: C4 (0 · A) → D4 (1+3 · S) → E4 (1+2 · S) → F4 (1 · S) → G4 (0 · S).',
      'Upper half: A4 (1+2 · D) → B4 (2 · D) → C5 (0 · D).',
      'Notice how the upper half mirrors your earlier step-down lesson in reverse!',
    ],
    recommendedBpm: 88,
    drill: {
      id: 'lesson-6-drill',
      title: 'Lesson 6: C Major Scale',
      subtitle: 'Complete 8-note C Major scale from C4 to C5',
      category: 'scale',
      tempoBpm: 88,
      steps: [
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 500, beatLabel: '1 beat', staffHint: 'Ledger line' },
        { note: 'D4', writtenMidi: 62, valves: [true, false, true], partialId: 3, durationMs: 500, beatLabel: '1 beat', staffHint: 'Below line 1' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 500, beatLabel: '1 beat', staffHint: '1st line' },
        { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 500, beatLabel: '1 beat', staffHint: '1st space' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 500, beatLabel: '1 beat', staffHint: '2nd line' },
        { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 500, beatLabel: '1 beat', staffHint: '2nd space' },
        { note: 'B4', writtenMidi: 71, valves: [false, true, false], partialId: 4, durationMs: 500, beatLabel: '1 beat', staffHint: '3rd line' },
        { note: 'C5', writtenMidi: 72, valves: [false, false, false], partialId: 4, durationMs: 850, beatLabel: '2 beats', staffHint: '3rd space' },
      ],
    },
  },
  {
    number: 7,
    id: 'lesson-7-rhythm-metronome',
    title: '07. Rhythm, Tonguing & Playing with a Metronome',
    level: 'Foundations',
    focus: 'Articulating repeated notes cleanly on the beat',
    teacherExplanation:
      'In real music, repeated notes must be separated cleanly by releasing and re-starting the air—like saying "ta, ta, ta" with your tongue. Turn on the Metronome below and practice landing each note right on the click!',
    keyTakeaways: [
      'Release your air key (or Spacebar) briefly between repeated notes like C4 → C4.',
      'Enable the Metronome at 80 BPM so you feel Beat 1 (high click) through Beat 4.',
      'Twinkle, Twinkle leaps a full Perfect 5th from C4 (0 · A) straight up to G4 (0 · S).',
    ],
    recommendedBpm: 80,
    drill: {
      id: 'lesson-7-drill',
      title: 'Lesson 7: Twinkle, Twinkle Little Star',
      subtitle: 'Articulate repeated notes & leap C4 → G4 → A4 → G4',
      category: 'melody',
      tempoBpm: 80,
      steps: [
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 460, beatLabel: 'Beat 1', staffHint: 'Ledger line' },
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 460, beatLabel: 'Beat 2', staffHint: 'Re-tongue!' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460, beatLabel: 'Beat 3', staffHint: 'Leap to S' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 460, beatLabel: 'Beat 4', staffHint: 'Re-tongue!' },
        { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 460, beatLabel: 'Beat 1', staffHint: '1+2 · Air D' },
        { note: 'A4', writtenMidi: 69, valves: [true, true, false], partialId: 4, durationMs: 460, beatLabel: 'Beat 2', staffHint: 'Re-tongue!' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 850, beatLabel: 'Beats 3-4', staffHint: '0 · Air S' },
      ],
    },
  },
  {
    number: 8,
    id: 'lesson-8-transposition-jazz',
    title: '08. Transposition (Bb vs C) & Brass Tone Colors',
    level: 'Intermediate',
    focus: 'Real-world band transposition & jazz phrasing',
    teacherExplanation:
      'A standard trumpet is in the key of Bb: when your sheet music says C, the horn actually sounds concert Bb (2 half-steps lower). That is why switching the Trumpet Key control between Bb and C changes the sounding pitch while your fingerings stay identical.',
    keyTakeaways: [
      'Play "When the Saints Go Marching In" (C4 → E4 → F4 → G4) in Bb, then try switching to C or Harmon Mute.',
      'This 4-note phrase uses Gentle Air (A) for C4 and Mid-Low Air (S) for E4, F4, G4.',
      'Once you master this, try recording your own riff in the Phrase Recorder!',
    ],
    recommendedBpm: 100,
    drill: {
      id: 'lesson-8-drill',
      title: 'Lesson 8: When the Saints Motif',
      subtitle: 'Classic jazz call from C4 up to G4',
      category: 'melody',
      tempoBpm: 100,
      steps: [
        { note: 'C4', writtenMidi: 60, valves: [false, false, false], partialId: 2, durationMs: 360, beatLabel: 'Beat 1', staffHint: '0 · Air A' },
        { note: 'E4', writtenMidi: 64, valves: [true, true, false], partialId: 3, durationMs: 360, beatLabel: 'Beat 2', staffHint: '1+2 · Air S' },
        { note: 'F4', writtenMidi: 65, valves: [true, false, false], partialId: 3, durationMs: 360, beatLabel: 'Beat 3', staffHint: '1 · Air S' },
        { note: 'G4', writtenMidi: 67, valves: [false, false, false], partialId: 3, durationMs: 820, beatLabel: 'Hold', staffHint: '0 · Air S' },
      ],
    },
  },
];

export interface CoachFeedback {
  status: 'idle' | 'correct' | 'adjust' | 'release_needed';
  message: string;
}

export function getCoachFeedback(params: {
  isBlowing: boolean;
  awaitingRelease: boolean;
  currentValves: ValveTuple;
  currentPartialId: number;
  currentWrittenMidi: number;
  currentWrittenNote: string;
  targetStep: LessonDrillStep;
  keyId: TrumpetKeyId;
}): CoachFeedback {
  const {
    isBlowing,
    awaitingRelease,
    currentValves,
    currentPartialId,
    currentWrittenMidi,
    currentWrittenNote,
    targetStep,
  } = params;

  const targetPartial = HARMONIC_PARTIALS.find((p) => p.id === targetStep.partialId);
  const targetValveText = getValveLabel(targetStep.valves);
  const targetAirKey = targetPartial?.keyHint ?? 'D';
  const targetAirName = targetPartial?.name ?? 'Middle';

  if (awaitingRelease) {
    return {
      status: 'release_needed',
      message: `Tongue reset: briefly release air, then blow ${targetStep.note} again (${targetValveText} · key ${targetAirKey}).`,
    };
  }

  if (!isBlowing) {
    return {
      status: 'idle',
      message: `Ready for ${targetStep.note}: set Valves ${targetValveText}, then press & hold air key ${targetAirKey} (${targetAirName} Air).`,
    };
  }

  if (currentWrittenMidi === targetStep.writtenMidi) {
    return {
      status: 'correct',
      message: `Great tone! ${targetStep.note} locked in cleanly.`,
    };
  }

  const valvesMatch =
    currentValves[0] === targetStep.valves[0] &&
    currentValves[1] === targetStep.valves[1] &&
    currentValves[2] === targetStep.valves[2];

  const partialMatch = currentPartialId === targetStep.partialId;

  if (valvesMatch && !partialMatch) {
    const direction = currentPartialId < targetStep.partialId ? 'faster/higher' : 'slower/lower';
    return {
      status: 'adjust',
      message: `Valves are right (${targetValveText}), but you're sounding ${currentWrittenNote}. Use ${direction} air — press key ${targetAirKey} (${targetAirName}) for ${targetStep.note}.`,
    };
  }

  if (!valvesMatch && partialMatch) {
    return {
      status: 'adjust',
      message: `Good air pressure (key ${targetAirKey})! Change fingers from ${getValveLabel(currentValves)} to Valves ${targetValveText} for ${targetStep.note}.`,
    };
  }

  return {
    status: 'adjust',
    message: `Sounding ${currentWrittenNote} (${getValveLabel(currentValves)}). For ${targetStep.note}, press Valves ${targetValveText} and hold air key ${targetAirKey}.`,
  };
}
