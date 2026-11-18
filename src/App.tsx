import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Circle,
  Mic,
  MicOff,
  Monitor,
  Play,
  RotateCcw,
  Smartphone,
  Square,
  Target,
  Volume2,
  Wind,
} from 'lucide-react';
import { micBreath } from './audio/micBreath';
import { trumpetAudio } from './audio/trumpetEngine';
import { FingeringAndPractice, StudioTab } from './components/FingeringAndPractice';
import { PhonePlayDeck } from './components/PhonePlayDeck';
import { TrebleStaff } from './components/TrebleStaff';
import { TrumpetVisual } from './components/TrumpetVisual';
import { WaveformScope } from './components/WaveformScope';
import {
  LessonDrillStep,
  TRUMPET_LESSONS,
  TrumpetLesson,
  getCoachFeedback,
} from './music/trumpetLessons';
import {
  HARMONIC_PARTIALS,
  MuteType,
  PracticeMelody,
  RECOMMENDED_PARTIALS,
  RecordedEvent,
  RecordedPhrase,
  TRUMPET_KEYS,
  TrumpetKeyId,
  ValveTuple,
  calculateTrumpetPitch,
  getValveLabel,
} from './music/trumpetPhysics';

const MUTE_OPTIONS: Array<{ id: MuteType; label: string }> = [
  { id: 'open', label: 'Open' },
  { id: 'straight', label: 'Straight' },
  { id: 'cup', label: 'Cup' },
  { id: 'harmon', label: 'Harmon' },
];

function mapKeyToValveIndex(key: string): 0 | 1 | 2 | null {
  const lower = key.toLowerCase();
  if (lower === '1' || lower === 'q' || key === 'ArrowLeft') return 0;
  if (lower === '2' || lower === 'w' || key === 'ArrowDown') return 1;
  if (lower === '3' || lower === 'e' || key === 'ArrowRight') return 2;
  return null;
}

function mapKeyToPartialAir(key: string): number | null {
  const lower = key.toLowerCase();
  const match = HARMONIC_PARTIALS.find((p) => p.keyHint.toLowerCase() === lower);
  return match ? match.airCenter : null;
}

export default function App() {
  // Core instrument state
  const [valves, setValves] = useState<ValveTuple>([false, false, false]);
  const [lockValvesMode, setLockValvesMode] = useState(false);

  const [airPressure, setAirPressure] = useState<number>(58); // Default Partial 4 (Middle C5)
  const [continuousAir, setContinuousAir] = useState(false);
  const [isSpaceBlowing, setIsSpaceBlowing] = useState(false);
  const [isPointerBlowing, setIsPointerBlowing] = useState(false);
  const [isAirKeyBlowing, setIsAirKeyBlowing] = useState(false);
  const [isPreviewBlowing, setIsPreviewBlowing] = useState(false);

  // Phone / Touch Play Mode & Optional Microphone Breath
  const [phoneMode, setPhoneMode] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isAirPadBlowing, setIsAirPadBlowing] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isMicBlowing, setIsMicBlowing] = useState(false);
  const [micLevelPct, setMicLevelPct] = useState(0);
  const [micThresholdPct, setMicThresholdPct] = useState(30);
  const [micSensitivity, setMicSensitivity] = useState(55);
  const [micError, setMicError] = useState<string | null>(null);

  const [keyId, setKeyId] = useState<TrumpetKeyId>('Bb');
  const [mute, setMute] = useState<MuteType>('open');
  const [a4Hz, setA4Hz] = useState<number>(440);
  const [lipBendCents, setLipBendCents] = useState<number>(0);
  const [vibratoCents, setVibratoCents] = useState<number>(6);
  const [volume, setVolume] = useState<number>(75);

  // Melody & single-note audition playback state
  const [playingMelodyId, setPlayingMelodyId] = useState<string | null>(null);
  const [melodyStepIndex, setMelodyStepIndex] = useState<number>(-1);
  const [isAuditionBlowing, setIsAuditionBlowing] = useState(false);
  const melodyTimersRef = useRef<number[]>([]);
  const auditionTimerRef = useRef<number | null>(null);

  // Studio Tab & Guided Curriculum state
  const [studioTab, setStudioTab] = useState<StudioTab>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<TrumpetLesson>(TRUMPET_LESSONS[0]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Metronome state
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(80);
  const [metronomeBeat, setMetronomeBeat] = useState(0);

  // Scale / Phrase Replication Practice state
  const [practiceItem, setPracticeItem] = useState<PracticeMelody>(TRUMPET_LESSONS[0].drill);
  const [practiceActive, setPracticeActive] = useState(false);
  const [practiceStepIndex, setPracticeStepIndex] = useState(0);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [practiceElapsedSec, setPracticeElapsedSec] = useState(0);
  const [awaitingRelease, setAwaitingRelease] = useState(false);
  const practiceStartMsRef = useRef<number | null>(null);
  const awaitingReleaseRef = useRef<boolean>(false);

  // Phrase Recorder & Playback state
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [recordedPhrase, setRecordedPhrase] = useState<RecordedPhrase | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isPlaybackBlowing, setIsPlaybackBlowing] = useState(false);
  const [playbackElapsedMs, setPlaybackElapsedMs] = useState(0);
  const [loopRecording, setLoopRecording] = useState(false);
  const loopRecordingRef = useRef(loopRecording);
  loopRecordingRef.current = loopRecording;

  const recordingStartRef = useRef<number>(0);
  const recordedEventsRef = useRef<RecordedEvent[]>([]);
  const playbackTimersRef = useRef<number[]>([]);
  const playbackIntervalRef = useRef<number | null>(null);

  // Track held keyboard keys per valve / air key so multi-key combos release cleanly
  const heldValveKeysRef = useRef<[Set<string>, Set<string>, Set<string>]>([
    new Set(),
    new Set(),
    new Set(),
  ]);
  const heldAirKeysRef = useRef<Set<string>>(new Set());
  const wasBlowingRef = useRef(false);
  const prevValvesRef = useRef<ValveTuple>([false, false, false]);

  const isMelodyBlowing = playingMelodyId !== null && melodyStepIndex >= 0;
  const isBlowing =
    continuousAir ||
    isSpaceBlowing ||
    isPointerBlowing ||
    isAirKeyBlowing ||
    isAirPadBlowing ||
    isMicBlowing ||
    isPreviewBlowing ||
    isAuditionBlowing ||
    isMelodyBlowing ||
    isPlaybackBlowing;

  const pitch = useMemo(
    () =>
      calculateTrumpetPitch({
        valves,
        airPressure,
        keyId,
        a4Hz,
        lipBendCents,
      }),
    [valves, airPressure, keyId, a4Hz, lipBendCents]
  );

  // Sync audio synthesis with live physical instrument state
  useEffect(() => {
    trumpetAudio.setVolume(volume / 100);
  }, [volume]);

  useEffect(() => {
    const valvesChanged =
      prevValvesRef.current[0] !== valves[0] ||
      prevValvesRef.current[1] !== valves[1] ||
      prevValvesRef.current[2] !== valves[2];

    if (valvesChanged) {
      trumpetAudio.triggerValveClick();
      prevValvesRef.current = [...valves] as ValveTuple;
    }

    if (isBlowing && !wasBlowingRef.current) {
      trumpetAudio.startNote({
        freqHz: pitch.frequencyHz,
        airPressure,
        mute,
        vibratoCents,
      });
      wasBlowingRef.current = true;
    } else if (isBlowing && wasBlowingRef.current) {
      trumpetAudio.updateNote({
        freqHz: pitch.frequencyHz,
        airPressure,
        mute,
        vibratoCents,
        slurTimeSec: valvesChanged ? 0.014 : 0.022,
      });
    } else if (!isBlowing && wasBlowingRef.current) {
      trumpetAudio.stopNote();
      wasBlowingRef.current = false;
    }
  }, [isBlowing, pitch.frequencyHz, airPressure, mute, vibratoCents, valves]);

  const stopAudition = useCallback(() => {
    if (auditionTimerRef.current !== null) {
      window.clearTimeout(auditionTimerRef.current);
      auditionTimerRef.current = null;
    }
    setIsAuditionBlowing(false);
  }, []);

  const stopMelody = useCallback(() => {
    melodyTimersRef.current.forEach((id) => window.clearTimeout(id));
    melodyTimersRef.current = [];
    setPlayingMelodyId(null);
    setMelodyStepIndex(-1);
  }, []);

  const stopRecordingPlayback = useCallback(() => {
    playbackTimersRef.current.forEach((id) => window.clearTimeout(id));
    playbackTimersRef.current = [];
    if (playbackIntervalRef.current !== null) {
      window.clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setIsPlayingRecording(false);
    setIsPlaybackBlowing(false);
    setPlaybackElapsedMs(0);
    setValves([false, false, false]);
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    const durationMs = Math.max(100, performance.now() - recordingStartRef.current);
    const events = [...recordedEventsRef.current];
    const last = events[events.length - 1];
    if (!last || last.isBlowing) {
      events.push({
        tMs: durationMs,
        isBlowing: false,
        valves: last ? ([...last.valves] as ValveTuple) : [false, false, false],
        airPressure: last ? last.airPressure : 58,
        keyId: last ? last.keyId : 'Bb',
        mute: last ? last.mute : 'open',
        a4Hz: last ? last.a4Hz : 440,
        lipBendCents: last ? last.lipBendCents : 0,
        vibratoCents: last ? last.vibratoCents : 6,
        writtenNote: last ? last.writtenNote : 'C5',
      });
    }

    // Count articulated notes (breath onsets or note changes while blowing)
    let noteCount = 0;
    let prevBlowing = false;
    let prevNote = '';
    for (const ev of events) {
      if (ev.isBlowing && (!prevBlowing || ev.writtenNote !== prevNote)) {
        noteCount += 1;
      }
      prevBlowing = ev.isBlowing;
      prevNote = ev.writtenNote;
    }

    setRecordedPhrase({
      id: `take-${Date.now()}`,
      durationMs,
      noteCount,
      events,
    });
  }, []);

  const startRecording = useCallback(() => {
    trumpetAudio.ensureContext();
    stopMelody();
    stopAudition();
    stopRecordingPlayback();
    setPracticeActive(false);

    recordingStartRef.current = performance.now();
    recordedEventsRef.current = [
      {
        tMs: 0,
        isBlowing,
        valves: [...valves] as ValveTuple,
        airPressure,
        keyId,
        mute,
        a4Hz,
        lipBendCents,
        vibratoCents,
        writtenNote: pitch.writtenNote,
      },
    ];
    setRecordingElapsedMs(0);
    isRecordingRef.current = true;
    setIsRecording(true);
  }, [
    stopMelody,
    stopAudition,
    stopRecordingPlayback,
    isBlowing,
    valves,
    airPressure,
    keyId,
    mute,
    a4Hz,
    lipBendCents,
    vibratoCents,
    pitch.writtenNote,
  ]);

  // Capture live instrument events while recording is active
  useEffect(() => {
    if (!isRecording) return;
    const tMs = Math.max(0, performance.now() - recordingStartRef.current);
    const events = recordedEventsRef.current;
    const prev = events[events.length - 1];

    const changed =
      !prev ||
      prev.isBlowing !== isBlowing ||
      prev.valves[0] !== valves[0] ||
      prev.valves[1] !== valves[1] ||
      prev.valves[2] !== valves[2] ||
      prev.airPressure !== airPressure ||
      prev.keyId !== keyId ||
      prev.mute !== mute ||
      prev.a4Hz !== a4Hz ||
      prev.lipBendCents !== lipBendCents ||
      prev.vibratoCents !== vibratoCents;

    if (changed) {
      events.push({
        tMs,
        isBlowing,
        valves: [...valves] as ValveTuple,
        airPressure,
        keyId,
        mute,
        a4Hz,
        lipBendCents,
        vibratoCents,
        writtenNote: pitch.writtenNote,
      });
    }
  }, [
    isRecording,
    isBlowing,
    valves,
    airPressure,
    keyId,
    mute,
    a4Hz,
    lipBendCents,
    vibratoCents,
    pitch.writtenNote,
  ]);

  // Recording elapsed timer & 30s safety cap
  useEffect(() => {
    if (!isRecording) return;
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - recordingStartRef.current;
      setRecordingElapsedMs(elapsed);
      if (elapsed >= 30000) {
        stopRecording();
      }
    }, 80);
    return () => window.clearInterval(intervalId);
  }, [isRecording, stopRecording]);

  const playRecording = useCallback(
    (phraseOverride?: RecordedPhrase) => {
      const phrase = phraseOverride ?? recordedPhrase;
      if (!phrase || phrase.events.length === 0) return;

      trumpetAudio.ensureContext();
      stopMelody();
      stopAudition();
      stopRecordingPlayback();
      setContinuousAir(false);
      setPracticeActive(false);

      setIsPlayingRecording(true);
      setPlaybackElapsedMs(0);
      const startTime = performance.now();

      playbackIntervalRef.current = window.setInterval(() => {
        setPlaybackElapsedMs(Math.min(phrase.durationMs, performance.now() - startTime));
      }, 50);

      phrase.events.forEach((ev) => {
        const tId = window.setTimeout(() => {
          setValves([...ev.valves] as ValveTuple);
          setAirPressure(ev.airPressure);
          setKeyId(ev.keyId);
          setMute(ev.mute);
          setA4Hz(ev.a4Hz);
          setLipBendCents(ev.lipBendCents);
          setVibratoCents(ev.vibratoCents);
          setIsPlaybackBlowing(ev.isBlowing);
        }, ev.tMs);
        playbackTimersRef.current.push(tId);
      });

      const endId = window.setTimeout(() => {
        if (loopRecordingRef.current) {
          playRecording(phrase);
        } else {
          stopRecordingPlayback();
        }
      }, phrase.durationMs + 40);
      playbackTimersRef.current.push(endId);
    },
    [recordedPhrase, stopMelody, stopAudition, stopRecordingPlayback]
  );

  const auditionNote = useCallback(
    (noteValves: ValveTuple, partialId: number, durationMs = 420) => {
      trumpetAudio.ensureContext();
      stopMelody();
      stopAudition();
      stopRecordingPlayback();

      const partial = HARMONIC_PARTIALS.find((p) => p.id === partialId);
      const targetAir = partial ? partial.airCenter : 58;

      setValves([...noteValves] as ValveTuple);
      setAirPressure(targetAir);
      setIsAuditionBlowing(true);

      auditionTimerRef.current = window.setTimeout(() => {
        setIsAuditionBlowing(false);
        if (!lockValvesMode) {
          setValves([false, false, false]);
        }
        auditionTimerRef.current = null;
      }, durationMs);
    },
    [stopMelody, stopAudition, stopRecordingPlayback, lockValvesMode]
  );

  const startPractice = useCallback(
    (item: PracticeMelody) => {
      stopMelody();
      stopAudition();
      stopRecordingPlayback();
      setPracticeItem(item);
      setPracticeActive(true);
      setPracticeStepIndex(0);
      setPracticeCompleted(false);
      setPracticeElapsedSec(0);
      practiceStartMsRef.current = null;
      awaitingReleaseRef.current = false;
    },
    [stopMelody, stopAudition, stopRecordingPlayback]
  );

  // Metronome click loop
  useEffect(() => {
    if (!metronomeOn) {
      setMetronomeBeat(0);
      return;
    }

    trumpetAudio.ensureContext();
    let currentBeat = 0;
    setMetronomeBeat(0);
    trumpetAudio.triggerMetronomeClick(true);

    const intervalMs = Math.round(60000 / metronomeBpm);
    const id = window.setInterval(() => {
      currentBeat = (currentBeat + 1) % 4;
      setMetronomeBeat(currentBeat);
      trumpetAudio.triggerMetronomeClick(currentBeat === 0);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [metronomeOn, metronomeBpm]);

  const startLessonDrill = useCallback(
    (lesson: TrumpetLesson) => {
      stopMelody();
      stopAudition();
      stopRecordingPlayback();
      setSelectedLesson(lesson);
      setPracticeItem(lesson.drill);
      setMetronomeBpm(lesson.recommendedBpm);
      setPracticeActive(true);
      setPracticeStepIndex(0);
      setPracticeCompleted(false);
      setPracticeElapsedSec(0);
      setAwaitingRelease(false);
      practiceStartMsRef.current = null;
      awaitingReleaseRef.current = false;
    },
    [stopMelody, stopAudition, stopRecordingPlayback]
  );

  const stopPractice = useCallback(() => {
    setPracticeActive(false);
    setPracticeStepIndex(0);
    setPracticeCompleted(false);
    setAwaitingRelease(false);
    practiceStartMsRef.current = null;
    awaitingReleaseRef.current = false;
  }, []);

  // Live Scale & Lesson Replication Matcher
  useEffect(() => {
    if (!practiceActive || practiceCompleted) return;
    // Do not match automated demo/audition/recording playback as user replication
    if (isMelodyBlowing || isAuditionBlowing || isPlaybackBlowing) return;

    const targetStep = practiceItem.steps[practiceStepIndex];
    if (!targetStep) return;

    if (awaitingReleaseRef.current) {
      if (!isBlowing || pitch.writtenMidi !== targetStep.writtenMidi) {
        awaitingReleaseRef.current = false;
        setAwaitingRelease(false);
      }
      return;
    }

    if (isBlowing && pitch.writtenMidi === targetStep.writtenMidi) {
      const timerId = window.setTimeout(() => {
        if (practiceStartMsRef.current === null) {
          practiceStartMsRef.current = performance.now();
        }
        const nextIndex = practiceStepIndex + 1;
        if (nextIndex >= practiceItem.steps.length) {
          const totalSec = practiceStartMsRef.current
            ? Math.max(0.4, (performance.now() - practiceStartMsRef.current) / 1000)
            : 0;
          setPracticeElapsedSec(totalSec);
          setPracticeCompleted(true);

          // Mark matching curriculum lesson as passed
          const matchedLesson = TRUMPET_LESSONS.find((l) => l.drill.id === practiceItem.id);
          if (matchedLesson) {
            setCompletedLessonIds((prev) =>
              prev.includes(matchedLesson.id) ? prev : [...prev, matchedLesson.id]
            );
          }
        } else {
          const nextStep = practiceItem.steps[nextIndex];
          const needsRelease = nextStep.writtenMidi === targetStep.writtenMidi;
          awaitingReleaseRef.current = needsRelease;
          setAwaitingRelease(needsRelease);
          setPracticeStepIndex(nextIndex);
        }
      }, 85);

      return () => window.clearTimeout(timerId);
    }
  }, [
    practiceActive,
    practiceCompleted,
    practiceItem,
    practiceStepIndex,
    isBlowing,
    isMelodyBlowing,
    isAuditionBlowing,
    isPlaybackBlowing,
    pitch.writtenMidi,
  ]);

  const startMelody = useCallback(
    (melody: PracticeMelody) => {
      stopMelody();
      stopAudition();
      stopRecordingPlayback();
      trumpetAudio.ensureContext();
      setContinuousAir(false);
      setPracticeItem(melody);
      setPlayingMelodyId(melody.id);

      let elapsed = 0;
      melody.steps.forEach((step, index) => {
        const partial = HARMONIC_PARTIALS.find((p) => p.id === step.partialId);
        const targetAir = partial ? partial.airCenter : 58;

        const startTimer = window.setTimeout(() => {
          setMelodyStepIndex(index);
          setValves([...step.valves] as ValveTuple);
          setAirPressure(targetAir);
          // Re-articulate repeated notes with a fresh tongue attack
          if (index > 0) {
            trumpetAudio.startNote({
              freqHz: calculateTrumpetPitch({
                valves: step.valves,
                airPressure: targetAir,
                keyId,
                a4Hz,
                lipBendCents,
              }).frequencyHz,
              airPressure: targetAir,
              mute,
              vibratoCents,
            });
          }
        }, elapsed);
        melodyTimersRef.current.push(startTimer);

        elapsed += step.durationMs;
      });

      const endTimer = window.setTimeout(() => {
        setPlayingMelodyId(null);
        setMelodyStepIndex(-1);
        setValves([false, false, false]);
      }, elapsed + 40);
      melodyTimersRef.current.push(endTimer);
    },
    [stopMelody, stopAudition, stopRecordingPlayback, keyId, a4Hz, lipBendCents, mute, vibratoCents]
  );

  // Clean up timers & mic stream on unmount
  useEffect(() => {
    return () => {
      melodyTimersRef.current.forEach((id) => window.clearTimeout(id));
      playbackTimersRef.current.forEach((id) => window.clearTimeout(id));
      if (playbackIntervalRef.current !== null) {
        window.clearInterval(playbackIntervalRef.current);
      }
      if (auditionTimerRef.current !== null) {
        window.clearTimeout(auditionTimerRef.current);
      }
      micBreath.stop();
    };
  }, []);

  // Keyboard bindings: Valves (123 / QWE / Left,Down,Right), Air Partials (Z A S D F G H), Space (Blow), -/= (Air fine)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement &&
        e.target.type !== 'range'
      ) {
        return;
      }

      const isNavKey =
        e.code === 'Space' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp';

      if (isNavKey) {
        e.preventDefault();
      }

      if (e.repeat) return;

      // Valve keys
      const valveIdx = mapKeyToValveIndex(e.key);
      if (valveIdx !== null) {
        trumpetAudio.ensureContext();
        if (playingMelodyId) stopMelody();
        const keyToken = e.key.toLowerCase();
        heldValveKeysRef.current[valveIdx].add(keyToken);
        setValves((prev) => {
          const next = [...prev] as ValveTuple;
          next[valveIdx] = true;
          return next;
        });
        return;
      }

      // Spacebar = Blow breath gate
      if (e.code === 'Space') {
        trumpetAudio.ensureContext();
        if (playingMelodyId) stopMelody();
        setIsSpaceBlowing(true);
        return;
      }

      // Air pressure partial keys (Z, A, S, D, F, G, H)
      const partialAir = mapKeyToPartialAir(e.key);
      if (partialAir !== null && !e.metaKey && !e.ctrlKey && !e.altKey) {
        trumpetAudio.ensureContext();
        if (playingMelodyId) stopMelody();
        heldAirKeysRef.current.add(e.key.toLowerCase());
        setAirPressure(partialAir);
        setIsAirKeyBlowing(true);
        return;
      }

      // Fine air pressure step with ArrowUp / = / -
      if (e.key === 'ArrowUp' || e.key === '=' || e.key === '+') {
        setAirPressure((p) => Math.min(100, p + 5));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        setAirPressure((p) => Math.max(0, p - 5));
        return;
      }

      // 'C' toggles Continuous Air
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        trumpetAudio.ensureContext();
        setContinuousAir((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const valveIdx = mapKeyToValveIndex(e.key);
      if (valveIdx !== null) {
        const keyToken = e.key.toLowerCase();
        heldValveKeysRef.current[valveIdx].delete(keyToken);
        if (heldValveKeysRef.current[valveIdx].size === 0 && !lockValvesMode) {
          setValves((prev) => {
            const next = [...prev] as ValveTuple;
            next[valveIdx] = false;
            return next;
          });
        }
        return;
      }

      if (e.code === 'Space') {
        setIsSpaceBlowing(false);
        return;
      }

      const partialAir = mapKeyToPartialAir(e.key);
      if (partialAir !== null) {
        heldAirKeysRef.current.delete(e.key.toLowerCase());
        if (heldAirKeysRef.current.size === 0) {
          setIsAirKeyBlowing(false);
        }
      }
    };

    const handleBlur = () => {
      heldValveKeysRef.current.forEach((s) => s.clear());
      heldAirKeysRef.current.clear();
      setIsSpaceBlowing(false);
      setIsAirKeyBlowing(false);
      setIsPointerBlowing(false);
      setIsPreviewBlowing(false);
      if (!lockValvesMode) {
        setValves([false, false, false]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [lockValvesMode, playingMelodyId, stopMelody]);

  // Pointer handlers for Valves (supports momentary hold or lock/toggle mode)
  const handleValvePointerDown = (idx: 0 | 1 | 2) => {
    trumpetAudio.ensureContext();
    if (playingMelodyId) stopMelody();

    if (lockValvesMode) {
      setValves((prev) => {
        const next = [...prev] as ValveTuple;
        next[idx] = !next[idx];
        return next;
      });
    } else {
      setValves((prev) => {
        const next = [...prev] as ValveTuple;
        next[idx] = true;
        return next;
      });
    }
  };

  const handleValvePointerUp = (idx: 0 | 1 | 2) => {
    if (!lockValvesMode) {
      setValves((prev) => {
        const next = [...prev] as ValveTuple;
        next[idx] = false;
        return next;
      });
    }
  };

  // Pointer handlers for Recommended Air Pressure Buttons
  const handleAirPresetDown = (airCenter: number) => {
    trumpetAudio.ensureContext();
    if (playingMelodyId) stopMelody();
    setAirPressure(airCenter);
    setIsPointerBlowing(true);
  };

  const handleAirPresetUp = () => {
    setIsPointerBlowing(false);
  };

  const handlePreviewStart = (previewValves: ValveTuple, previewAir: number) => {
    trumpetAudio.ensureContext();
    if (playingMelodyId) stopMelody();
    setValves([...previewValves] as ValveTuple);
    setAirPressure(previewAir);
    setIsPreviewBlowing(true);
  };

  const handlePreviewStop = () => {
    setIsPreviewBlowing(false);
    if (!lockValvesMode) {
      setValves([false, false, false]);
    }
  };

  const handleToggleMic = useCallback(async () => {
    trumpetAudio.ensureContext();
    if (micEnabled) {
      micBreath.stop();
      setMicEnabled(false);
      setIsMicBlowing(false);
      setMicLevelPct(0);
      return;
    }

    setMicError(null);
    micBreath.setSensitivity(micSensitivity);
    const ok = await micBreath.start({
      onLevel: (levelPct, thresholdPct, blowing) => {
        setMicLevelPct(levelPct);
        setMicThresholdPct(thresholdPct);
        setIsMicBlowing(blowing);
      },
      onError: (msg) => {
        setMicError(msg);
        setMicEnabled(false);
        setIsMicBlowing(false);
      },
    });
    if (ok) {
      setMicEnabled(true);
    }
  }, [micEnabled, micSensitivity]);

  const handleRecalibrateMic = useCallback(() => {
    micBreath.recalibrate();
  }, []);

  const handleChangeMicSensitivity = useCallback((val: number) => {
    setMicSensitivity(val);
    micBreath.setSensitivity(val);
  }, []);

  const handleResetHorn = () => {
    stopMelody();
    stopAudition();
    stopRecording();
    stopRecordingPlayback();
    stopPractice();
    micBreath.stop();
    setMicEnabled(false);
    setIsMicBlowing(false);
    setMicLevelPct(0);
    setMicThresholdPct(30);
    setMetronomeOn(false);
    setContinuousAir(false);
    setIsSpaceBlowing(false);
    setIsPointerBlowing(false);
    setIsAirKeyBlowing(false);
    setIsAirPadBlowing(false);
    setIsPreviewBlowing(false);
    setValves([false, false, false]);
    setAirPressure(58);
    setKeyId('Bb');
    setMute('open');
    setA4Hz(440);
    setLipBendCents(0);
    setVibratoCents(6);
    trumpetAudio.stopNote();
  };

  const activeKeyConfig = TRUMPET_KEYS.find((k) => k.id === keyId) ?? TRUMPET_KEYS[0];
  const activePracticeTarget =
    practiceActive && !practiceCompleted ? practiceItem.steps[practiceStepIndex] : null;
  const activePracticePartial = activePracticeTarget
    ? HARMONIC_PARTIALS.find((p) => p.id === activePracticeTarget.partialId)
    : null;

  const coachFeedback = useMemo(() => {
    if (!practiceActive || practiceCompleted || !activePracticeTarget) return null;
    const drillStep: LessonDrillStep = {
      ...activePracticeTarget,
      beatLabel: (activePracticeTarget as LessonDrillStep).beatLabel ?? 'Play',
      staffHint: (activePracticeTarget as LessonDrillStep).staffHint ?? '',
    };
    return getCoachFeedback({
      isBlowing: isBlowing && !isMelodyBlowing && !isAuditionBlowing && !isPlaybackBlowing,
      awaitingRelease,
      currentValves: valves,
      currentPartialId: pitch.partial.id,
      currentWrittenMidi: pitch.writtenMidi,
      currentWrittenNote: pitch.writtenNote,
      targetStep: drillStep,
      keyId,
    });
  }, [
    practiceActive,
    practiceCompleted,
    activePracticeTarget,
    isBlowing,
    isMelodyBlowing,
    isAuditionBlowing,
    isPlaybackBlowing,
    awaitingRelease,
    valves,
    pitch.partial.id,
    pitch.writtenMidi,
    pitch.writtenNote,
    keyId,
  ]);

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#F2F4F8] flex flex-col">
      {/* TOP BAR CONTRACT: 3 zones separated by gap-8 */}
      <header className="border-b border-[#232834] bg-[#0E1117]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#instrument-stage"
            className="font-[var(--font-display)] text-xl font-bold tracking-tight text-[#F2F4F8] whitespace-nowrap shrink-0"
          >
            BrassLab
          </a>

          {/* Zone 2: Concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]">
            <a
              href="#instrument-stage"
              className="hover:text-[#F2F4F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Trumpet
            </a>
            <a
              href={phoneMode ? '#phone-play-deck' : '#valve-deck'}
              className="hover:text-[#F2F4F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Valves &amp; Air
            </a>
            <a
              href="#reference-studio"
              onClick={() => setStudioTab('lessons')}
              className="hover:text-[#F2F4F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Lessons &amp; Practice
            </a>
            <a
              href="#acoustics-summary"
              className="hover:text-[#F2F4F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Acoustics
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleResetHorn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#181C26] text-[#F2F4F8] border border-[#2C3344] hover:border-[#D4A24C] hover:text-[#F9E3B4] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Horn</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* INSTRUMENT STAGE & LIVE TELEMETRY */}
        <section id="instrument-stage" aria-label="Interactive Trumpet Stage">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-semibold tracking-tight text-[#F2F4F8] text-balance">
                  {activeKeyConfig.label} Trumpet Simulator
                </h1>

                {/* Desktop Studio / Phone UI View Segmented Switcher */}
                <div
                  role="group"
                  aria-label="Workspace Layout View"
                  className="inline-flex items-center p-0.5 rounded-lg bg-[#12151C] border border-[#232834]"
                >
                  <button
                    type="button"
                    onClick={() => setPhoneMode(false)}
                    aria-pressed={!phoneMode}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      !phoneMode
                        ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F2F4F8]'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneMode(true)}
                    aria-pressed={phoneMode}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      phoneMode
                        ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F2F4F8]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Phone UI View</span>
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#94A3B8] mt-1">
                {phoneMode
                  ? 'Handheld portrait layout: use Blow into Mic, One-Hand Auto-Blow, or slide the Air Pad with your left thumb while playing valves on the right.'
                  : (
                    <>
                      Play the 3 valves with{' '}
                      <span className="font-mono text-[#E2E8F0]">1 2 3</span>,{' '}
                      <span className="font-mono text-[#E2E8F0]">Q W E</span>, or{' '}
                      <span className="font-mono text-[#E2E8F0]">← ↓ →</span> and shape pitch with Air Pressure{' '}
                      <span className="font-mono text-[#E2E8F0]">A S D F G H</span> +{' '}
                      <span className="font-mono text-[#E2E8F0]">Space</span>.
                    </>
                  )}
              </p>
            </div>

            {/* Clean unboxed inline pitch readout (Zero-Pill Rule) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-mono tabular-nums text-[#94A3B8]">
              <span className={isBlowing ? 'text-[#F5C45E] font-medium' : 'text-[#CBD5E1]'}>
                {isBlowing ? 'Sounding' : 'Ready'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Written <strong className="text-[#F2F4F8] font-semibold">{pitch.writtenNote}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Concert <strong className="text-[#F2F4F8] font-semibold">{pitch.concertNote}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{pitch.frequencyHz.toFixed(1)} Hz</span>
              <span aria-hidden="true">·</span>
              <span>Partial {pitch.partial.id}</span>
            </div>
          </div>

          {phoneMode ? (
            /* PHONE UI VIEW: COMPACT HANDHELD PORTRAIT TRUMPET CONSOLE */
            <div className="max-w-[440px] mx-auto rounded-[28px] border-2 border-[#2A3142] bg-[#10131A] p-3.5 sm:p-4 shadow-2xl space-y-3.5">
              {/* Phone Readout + Quick Actions */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#232834]">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-[var(--font-display)] text-3xl font-bold tabular-nums text-[#F5C45E]">
                    {pitch.writtenNote}
                  </span>
                  <div className="text-[11px] font-mono tabular-nums text-[#94A3B8] leading-tight">
                    <div>Concert {pitch.concertNote} · P{pitch.partial.id}</div>
                    <div>Valves: {getValveLabel(valves)} · {airPressure}%</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMetronomeOn((v) => !v)}
                    aria-pressed={metronomeOn}
                    className={`min-h-[40px] px-2.5 rounded-lg text-[11px] font-mono tabular-nums border transition-colors cursor-pointer ${
                      metronomeOn
                        ? 'bg-[#211C13] border-[#D4A24C] text-[#F5C45E]'
                        : 'bg-[#171B24] border-[#2C3344] text-[#94A3B8]'
                    }`}
                  >
                    {metronomeOn ? `${metronomeBpm}·${metronomeBeat + 1}` : 'BPM'}
                  </button>

                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isPlayingRecording}
                      aria-label="Record Phrase"
                      className="min-h-[40px] px-2.5 rounded-lg text-[11px] font-medium bg-[#1E1416] border border-[#7F1D1D] text-[#FCA5A5] disabled:opacity-45 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Circle className="w-3 h-3 fill-current" />
                      <span>Rec</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="min-h-[40px] px-2.5 rounded-lg text-[11px] font-semibold bg-[#DC2626] text-white font-mono tabular-nums cursor-pointer inline-flex items-center gap-1"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>{(recordingElapsedMs / 1000).toFixed(1)}s</span>
                    </button>
                  )}

                  {recordedPhrase && !isRecording && (
                    <button
                      type="button"
                      onClick={() =>
                        isPlayingRecording ? stopRecordingPlayback() : playRecording()
                      }
                      aria-label={isPlayingRecording ? 'Stop Playback' : 'Play Recording'}
                      className="min-h-[40px] px-2.5 rounded-lg text-[11px] font-semibold bg-[#D4A24C] text-[#0B0D11] cursor-pointer inline-flex items-center gap-1"
                    >
                      {isPlayingRecording ? (
                        <Square className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Interactive Trumpet Graphic + Staff Strip */}
              <div className="rounded-xl bg-[#0B0D11] border border-[#232834] p-2 space-y-2">
                <TrumpetVisual
                  valves={valves}
                  isBlowing={isBlowing}
                  airPressure={airPressure}
                  mute={mute}
                  a4Hz={a4Hz}
                  onValvePointerDown={handleValvePointerDown}
                  onValvePointerUp={handleValvePointerUp}
                />
                <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-[#1D222D]">
                  <div className="col-span-6">
                    <TrebleStaff writtenMidi={pitch.writtenMidi} isBlowing={isBlowing} />
                  </div>
                  <div className="col-span-6">
                    <WaveformScope isBlowing={isBlowing} />
                  </div>
                </div>
              </div>

              {/* Active Lesson / Practice Coach Strip */}
              <div className="rounded-xl bg-[#151923] border border-[#232834] px-3 py-2 flex items-center justify-between gap-2">
                {practiceActive ? (
                  practiceCompleted ? (
                    <div className="text-xs font-mono text-[#6EE7B7]">
                      Passed · {practiceItem.title} ({practiceElapsedSec.toFixed(1)}s)
                    </div>
                  ) : activePracticeTarget ? (
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono tabular-nums text-[#F5C45E] truncate">
                        Target {practiceStepIndex + 1}/{practiceItem.steps.length}:{' '}
                        <strong className="text-[#F9E3B4]">{activePracticeTarget.note}</strong> · Valves{' '}
                        {getValveLabel(activePracticeTarget.valves)} · P{activePracticeTarget.partialId}
                      </div>
                      {coachFeedback && (
                        <div
                          className={`text-[11px] truncate ${
                            coachFeedback.status === 'correct'
                              ? 'text-[#6EE7B7]'
                              : coachFeedback.status === 'adjust'
                                ? 'text-[#FCD34D]'
                                : coachFeedback.status === 'release_needed'
                                  ? 'text-[#7DD3FC]'
                                  : 'text-[#94A3B8]'
                          }`}
                        >
                          {coachFeedback.message}
                        </div>
                      )}
                    </div>
                  ) : null
                ) : (
                  <div className="text-[11px] text-[#94A3B8] truncate">
                    Next: <strong className="text-[#E2E8F0]">{selectedLesson.title}</strong>
                  </div>
                )}

                {!practiceActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudioTab('lessons');
                      startLessonDrill(selectedLesson);
                    }}
                    className="min-h-[36px] px-2.5 rounded-lg text-[11px] font-medium bg-[#1C212E] border border-[#2C3344] text-[#F5C45E] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Lesson {selectedLesson.number}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activePracticeTarget && !practiceCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          auditionNote(
                            activePracticeTarget.valves,
                            activePracticeTarget.partialId,
                            450
                          )
                        }
                        aria-label="Hear Target Note"
                        className="min-h-[36px] px-2 rounded-lg text-[11px] bg-[#1C212E] border border-[#2C3344] text-[#CBD5E1] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopPractice}
                      className="min-h-[36px] px-2 rounded-lg text-[11px] bg-[#1E293B] border border-[#38BDF8] text-[#BAE6FD] cursor-pointer"
                    >
                      Exit
                    </button>
                  </div>
                )}
              </div>

              {/* Integrated Phone Play Deck (Blow into Mic + One-Hand Auto-Blow + 2-Thumb Play) */}
              <PhonePlayDeck
                compactPhoneView
                valves={valves}
                airPressure={airPressure}
                activePartial={pitch.partial}
                isBlowing={isBlowing}
                continuousAir={continuousAir}
                micEnabled={micEnabled}
                isMicBlowing={isMicBlowing}
                micLevelPct={micLevelPct}
                micThresholdPct={micThresholdPct}
                micSensitivity={micSensitivity}
                micError={micError}
                keyId={keyId}
                mute={mute}
                onAirPadStart={(pct) => {
                  trumpetAudio.ensureContext();
                  if (playingMelodyId) stopMelody();
                  setAirPressure(pct);
                  setIsAirPadBlowing(true);
                }}
                onAirPadMove={(pct) => {
                  setAirPressure(pct);
                }}
                onAirPadEnd={() => {
                  setIsAirPadBlowing(false);
                }}
                onValvePointerDown={handleValvePointerDown}
                onValvePointerUp={handleValvePointerUp}
                onComboDown={(combo) => {
                  trumpetAudio.ensureContext();
                  if (playingMelodyId) stopMelody();
                  setValves([...combo] as ValveTuple);
                }}
                onComboUp={() => {
                  if (!lockValvesMode) {
                    setValves([false, false, false]);
                  }
                }}
                onToggleContinuousAir={() => {
                  trumpetAudio.ensureContext();
                  if (playingMelodyId) stopMelody();
                  setContinuousAir((v) => !v);
                }}
                onToggleMic={handleToggleMic}
                onRecalibrateMic={handleRecalibrateMic}
                onChangeMicSensitivity={handleChangeMicSensitivity}
                onChangeKey={setKeyId}
                onChangeMute={setMute}
              />
            </div>
          ) : (
            /* DESKTOP STUDIO INSTRUMENT STAGE CONTAINER */
            <div className="rounded-2xl bg-[#12151C] border border-[#232834] p-4 sm:p-6">
              {/* Compact Studio Cue Bar: Live Teacher Coach, Metronome & Quick Record */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#232834]">
                <div className="flex flex-col gap-0.5 text-xs">
                  {practiceActive ? (
                    practiceCompleted ? (
                      <span className="font-mono tabular-nums text-[#6EE7B7] font-medium">
                        Completed · {practiceItem.title} ({practiceElapsedSec.toFixed(1)}s)
                      </span>
                    ) : activePracticeTarget ? (
                      <>
                        <span className="inline-flex items-center gap-2 font-mono tabular-nums text-[#F5C45E]">
                          <Target className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Target {practiceStepIndex + 1}/{practiceItem.steps.length}:{' '}
                            <strong className="text-[#F9E3B4]">{activePracticeTarget.note}</strong> · Valves{' '}
                            {getValveLabel(activePracticeTarget.valves)} · Air {activePracticePartial?.keyHint}
                          </span>
                        </span>
                        {coachFeedback && (
                          <span
                            className={
                              coachFeedback.status === 'correct'
                                ? 'text-[#6EE7B7]'
                                : coachFeedback.status === 'adjust'
                                  ? 'text-[#FCD34D]'
                                  : coachFeedback.status === 'release_needed'
                                    ? 'text-[#7DD3FC]'
                                    : 'text-[#94A3B8]'
                            }
                          >
                            {coachFeedback.message}
                          </span>
                        )}
                      </>
                    ) : null
                  ) : (
                    <span className="text-[#94A3B8]">
                      New to trumpet? Start{' '}
                      <strong className="text-[#E2E8F0] font-medium">{selectedLesson.title}</strong> to learn step by step.
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!practiceActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStudioTab('lessons');
                        startLessonDrill(selectedLesson);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] hover:border-[#D4A24C] hover:text-[#F9E3B4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Start Lesson {selectedLesson.number}</span>
                    </button>
                  ) : (
                    <>
                      {activePracticeTarget && !practiceCompleted && (
                        <button
                          type="button"
                          onClick={() =>
                            auditionNote(
                              activePracticeTarget.valves,
                              activePracticeTarget.partialId,
                              450
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] hover:border-[#D4A24C] hover:text-[#F9E3B4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Hear Target</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopPractice}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1E293B] border border-[#38BDF8] text-[#BAE6FD] hover:bg-[#334155] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Exit Practice</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setMetronomeOn((v) => !v)}
                    aria-pressed={metronomeOn}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                      metronomeOn
                        ? 'bg-[#211C13] border-[#D4A24C] text-[#F5C45E]'
                        : 'bg-[#171B24] border-[#2C3344] text-[#94A3B8] hover:text-[#F2F4F8]'
                    }`}
                  >
                    <span>
                      {metronomeOn ? `Metronome ${metronomeBpm} · ${metronomeBeat + 1}/4` : 'Metronome'}
                    </span>
                  </button>

                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isPlayingRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1E1416] border border-[#7F1D1D] text-[#FCA5A5] hover:bg-[#DC2626] hover:text-white disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Circle className="w-3 h-3 fill-current" />
                      <span>Record Phrase</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop ({(recordingElapsedMs / 1000).toFixed(1)}s)</span>
                    </button>
                  )}

                  {recordedPhrase && !isRecording && (
                    <button
                      type="button"
                      onClick={() =>
                        isPlayingRecording ? stopRecordingPlayback() : playRecording()
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#D4A24C] text-[#0B0D11] hover:bg-[#E5B65E] transition-colors whitespace-nowrap shrink-0 cursor-pointer font-semibold"
                    >
                      {isPlayingRecording ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop ({(playbackElapsedMs / 1000).toFixed(1)}s)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play Recording ({(recordedPhrase.durationMs / 1000).toFixed(1)}s)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Interactive Trumpet SVG (9 cols on desktop) */}
                <div className="lg:col-span-9">
                  <TrumpetVisual
                    valves={valves}
                    isBlowing={isBlowing}
                    airPressure={airPressure}
                    mute={mute}
                    a4Hz={a4Hz}
                    onValvePointerDown={handleValvePointerDown}
                    onValvePointerUp={handleValvePointerUp}
                  />
                </div>

                {/* Live Staff + Waveform Scope (3 cols on desktop) */}
                <div className="lg:col-span-3 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-[#232834] pt-4 lg:pt-0 lg:pl-6">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-[#94A3B8]">Written Pitch</div>
                      <div className="font-[var(--font-display)] text-4xl font-bold tracking-tight tabular-nums text-[#F5C45E]">
                        {pitch.writtenNote}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums text-[#94A3B8]">
                      <div>Concert {pitch.concertNote}</div>
                      <div>
                        {pitch.embouchureCents >= 0 ? `+${pitch.embouchureCents}` : pitch.embouchureCents}¢
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#0B0D11] border border-[#232834] px-2 py-1">
                    <TrebleStaff writtenMidi={pitch.writtenMidi} isBlowing={isBlowing} />
                  </div>

                  <WaveformScope isBlowing={isBlowing} />

                  <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#94A3B8]">
                    <span>Valves: {getValveLabel(valves)}</span>
                    <span>Tube: {pitch.totalTubeLengthPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* TACTILE CONTROL DECK: 3 VALVES (LEFT) + AIR PRESSURE, PITCH & KEY (RIGHT) - Desktop Studio only */}
        {!phoneMode && (
        <section
          id="valve-deck"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch"
          aria-label="Valve and Air Pressure Controls"
        >
          {/* LEFT ZONE: THE 3 VALVES + MOUTHPIECE BLOW TRIGGER */}
          <div className="lg:col-span-5 rounded-2xl bg-[#12151C] border border-[#232834] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-[var(--font-display)] text-lg font-semibold text-[#F2F4F8]">
                    Three Pistons (Valves 1 · 2 · 3)
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Combine valves to lengthen the brass tube (−1 to −6 semitones)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setLockValvesMode((v) => !v)}
                  aria-pressed={lockValvesMode}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    lockValvesMode
                      ? 'bg-[#D4A24C] text-[#0B0D11] border-[#F5C45E]'
                      : 'bg-[#171B24] text-[#CBD5E1] border-[#2C3344] hover:border-[#475569]'
                  }`}
                >
                  {lockValvesMode ? 'Valve Lock: On' : 'Valve Lock: Off'}
                </button>
              </div>

              {/* 3 Tactile Brass Valve Pads */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  {
                    idx: 0 as const,
                    num: '1',
                    drop: '−2 st',
                    keys: '1 · Q · ←',
                    name: 'Index',
                  },
                  {
                    idx: 1 as const,
                    num: '2',
                    drop: '−1 st',
                    keys: '2 · W · ↓',
                    name: 'Middle',
                  },
                  {
                    idx: 2 as const,
                    num: '3',
                    drop: '−3 st',
                    keys: '3 · E · →',
                    name: 'Ring',
                  },
                ].map((v) => {
                  const active = valves[v.idx];
                  return (
                    <button
                      key={v.num}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                        handleValvePointerDown(v.idx);
                      }}
                      onPointerUp={() => handleValvePointerUp(v.idx)}
                      onPointerCancel={() => handleValvePointerUp(v.idx)}
                      aria-pressed={active}
                      className={`relative flex flex-col items-center justify-between py-5 px-3 rounded-xl border select-none transition-transform duration-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                        active
                          ? 'translate-y-1.5 bg-gradient-to-b from-[#E5B85C] to-[#B67E22] border-[#FDE68A] text-[#0B0D11] shadow-inner'
                          : 'bg-[#181C26] border-[#2D3446] text-[#F2F4F8] hover:border-[#D4A24C]/60 shadow-[0_6px_0_0_#0A0C10]'
                      }`}
                    >
                      <span
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-[var(--font-display)] text-xl font-bold border ${
                          active
                            ? 'bg-[#0B0D11]/15 border-[#0B0D11]/30 text-[#0B0D11]'
                            : 'bg-[#0E1117] border-[#333B4D] text-[#F5C45E]'
                        }`}
                      >
                        {v.num}
                      </span>

                      <div className="mt-3 text-center">
                        <div className="text-xs font-semibold">{v.name}</div>
                        <div
                          className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                            active ? 'text-[#0B0D11]/85 font-medium' : 'text-[#94A3B8]'
                          }`}
                        >
                          {v.drop}
                        </div>
                      </div>

                      <div
                        className={`mt-2.5 font-mono text-[11px] tracking-tight ${
                          active ? 'text-[#0B0D11] font-semibold' : 'text-[#64748B]'
                        }`}
                      >
                        {v.keys}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mouthpiece / Blow Breath Gate + One-Hand Auto-Blow + Blow into Mic */}
            <div className="mt-6 pt-5 border-t border-[#232834] space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                    trumpetAudio.ensureContext();
                    if (playingMelodyId) stopMelody();
                    setIsPointerBlowing(true);
                  }}
                  onPointerUp={() => setIsPointerBlowing(false)}
                  onPointerCancel={() => setIsPointerBlowing(false)}
                  aria-pressed={isBlowing}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm border transition-all select-none cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    isBlowing
                      ? 'bg-[#D4A24C] border-[#FDE68A] text-[#0B0D11] font-semibold'
                      : 'bg-[#191E29] border-[#323A4D] text-[#F2F4F8] hover:border-[#D4A24C]'
                  }`}
                >
                  <Wind className="w-4 h-4 shrink-0" />
                  <span>{isBlowing ? 'Blowing Mouthpiece' : 'Hold to Blow (Space)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    trumpetAudio.ensureContext();
                    if (playingMelodyId) stopMelody();
                    setContinuousAir((v) => !v);
                  }}
                  aria-pressed={continuousAir}
                  className={`px-3.5 py-3 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    continuousAir
                      ? 'bg-[#1E293B] border-[#38BDF8] text-[#BAE6FD]'
                      : 'bg-[#161922] border-[#2C3344] text-[#94A3B8] hover:text-[#F2F4F8]'
                  }`}
                >
                  {continuousAir ? 'Auto-Blow: On (C)' : 'One-Hand Auto-Blow (C)'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleMic}
                  aria-pressed={micEnabled}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    micEnabled && isMicBlowing
                      ? 'bg-[#065F46] border-[#34D399] text-[#ECFDF5]'
                      : micEnabled
                        ? 'bg-[#101F18] border-[#10B981] text-[#6EE7B7]'
                        : 'bg-[#161922] border-[#2C3344] text-[#94A3B8] hover:text-[#F2F4F8]'
                  }`}
                >
                  {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{micEnabled ? (isMicBlowing ? 'Mic: Blowing' : 'Mic: On') : 'Blow into Mic'}</span>
                </button>
              </div>

              {micEnabled && (
                <div className="p-2.5 rounded-xl bg-[#0B0D11] border border-[#232834] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#94A3B8]">
                    <span>{isMicBlowing ? 'Breath detected' : 'Blow across mic'}</span>
                    <span>
                      {micLevelPct}% / {micThresholdPct}%
                    </span>
                  </div>
                  <div className="relative w-full h-2 rounded-full bg-[#171B24] overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] transition-transform duration-75 origin-left"
                      style={{ width: '100%', transform: `scaleX(${micLevelPct / 100})` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#F5C45E]"
                      style={{ left: `${micThresholdPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                    <span className="whitespace-nowrap">Sensitivity</span>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      value={micSensitivity}
                      onChange={(e) => handleChangeMicSensitivity(Number(e.target.value))}
                      className="brass-slider w-full"
                      aria-label="Microphone breath sensitivity"
                    />
                    <button
                      type="button"
                      onClick={handleRecalibrateMic}
                      className="px-2 py-0.5 rounded bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] whitespace-nowrap cursor-pointer"
                    >
                      Recalibrate
                    </button>
                  </div>
                </div>
              )}

              {micError && <p className="text-xs text-[#FCA5A5]">{micError}</p>}
            </div>
          </div>

          {/* RIGHT ZONE: RECOMMENDED AIR PRESSURE BUTTONS, KEY, PITCH & MUTE */}
          <div className="lg:col-span-7 rounded-2xl bg-[#12151C] border border-[#232834] p-5 sm:p-6 flex flex-col justify-between gap-6">
            {/* 1. Recommended Air Pressure Buttons (Harmonic Partials) */}
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-[var(--font-display)] text-lg font-semibold text-[#F2F4F8]">
                    Air Pressure &amp; Harmonic Partials
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Press or hold a recommended air preset to jump partials like overblowing a real brass horn
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#F5C45E]">
                  {airPressure}% PSI · {pitch.partial.registerLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {RECOMMENDED_PARTIALS.map((p) => {
                  const isCurrentPartial = pitch.partial.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                        handleAirPresetDown(p.airCenter);
                      }}
                      onPointerUp={handleAirPresetUp}
                      onPointerCancel={handleAirPresetUp}
                      className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                        isCurrentPartial && isBlowing
                          ? 'bg-[#D4A24C] border-[#FDE68A] text-[#0B0D11]'
                          : isCurrentPartial
                            ? 'bg-[#211C13] border-[#D4A24C] text-[#F9E3B4]'
                            : 'bg-[#171B24] border-[#293040] text-[#CBD5E1] hover:border-[#475569]'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="font-semibold text-xs whitespace-nowrap">{p.name}</span>
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            isCurrentPartial && isBlowing ? 'text-[#0B0D11]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {p.keyHint}
                        </span>
                      </div>
                      <div
                        className={`font-mono text-sm font-semibold mt-1.5 tabular-nums ${
                          isCurrentPartial && isBlowing ? 'text-[#0B0D11]' : 'text-[#F2F4F8]'
                        }`}
                      >
                        {p.openNoteLabel}
                      </div>
                      <div
                        className={`font-mono text-[10px] mt-0.5 tabular-nums ${
                          isCurrentPartial && isBlowing ? 'text-[#0B0D11]/80' : 'text-[#64748B]'
                        }`}
                      >
                        P{p.id} · {p.airCenter}%
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continuous Air Pressure Slider with Partial Tick Marks */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1.5">
                  <label htmlFor="air-pressure-slider">
                    Continuous Airflow Pressure (Keys <span className="font-mono text-[#E2E8F0]">-</span> /{' '}
                    <span className="font-mono text-[#E2E8F0]">+</span> or Pedal <span className="font-mono text-[#E2E8F0]">Z</span>)
                  </label>
                  <span className="font-mono tabular-nums text-[#F2F4F8]">{airPressure}%</span>
                </div>
                <input
                  id="air-pressure-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={airPressure}
                  onChange={(e) => setAirPressure(Number(e.target.value))}
                  className="brass-slider w-full"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1 tabular-nums">
                  <span>P1 C3</span>
                  <span>P2 C4</span>
                  <span>P3 G4</span>
                  <span>P4 C5</span>
                  <span>P5 E5</span>
                  <span>P6 G5</span>
                  <span>P8 C6</span>
                </div>
              </div>
            </div>

            {/* 2. Key Selection, Mute & Pitch Fine-Tuning */}
            <div className="pt-5 border-t border-[#232834] grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Key Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#CBD5E1]">Trumpet Key</span>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    {activeKeyConfig.transposeSemitones === 0
                      ? 'Concert Pitch'
                      : `${activeKeyConfig.transposeSemitones > 0 ? '+' : ''}${activeKeyConfig.transposeSemitones} st`}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-3 gap-1.5">
                  {TRUMPET_KEYS.map((k) => {
                    const selected = k.id === keyId;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setKeyId(k.id)}
                        title={k.description}
                        className={`px-2.5 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                          selected
                            ? 'bg-[#D4A24C] border-[#F5C45E] text-[#0B0D11] font-semibold'
                            : 'bg-[#171B24] border-[#293040] text-[#CBD5E1] hover:border-[#475569]'
                        }`}
                      >
                        {k.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bell Mute Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#CBD5E1]">Bell Mute</span>
                  <span className="font-mono text-[11px] text-[#94A3B8] capitalize">{mute}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {MUTE_OPTIONS.map((m) => {
                    const selected = m.id === mute;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMute(m.id)}
                        className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                          selected
                            ? 'bg-[#D4A24C] border-[#F5C45E] text-[#0B0D11] font-semibold'
                            : 'bg-[#171B24] border-[#293040] text-[#CBD5E1] hover:border-[#475569]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Pitch Fine-Tune Sliders (Tuning Slide Hz, Lip Bend Cents, Vibrato, Volume) */}
            <div className="pt-4 border-t border-[#232834] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="tuning-slider" className="text-[#94A3B8]">
                    Tuning Slide
                  </label>
                  <button
                    type="button"
                    onClick={() => setA4Hz(440)}
                    className="font-mono text-[11px] tabular-nums text-[#F2F4F8] hover:text-[#F5C45E] cursor-pointer"
                    title="Click to reset to A=440 Hz"
                  >
                    A={a4Hz}Hz
                  </button>
                </div>
                <input
                  id="tuning-slider"
                  type="range"
                  min={438}
                  max={444}
                  step={0.5}
                  value={a4Hz}
                  onChange={(e) => setA4Hz(Number(e.target.value))}
                  className="brass-slider w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="lip-bend-slider" className="text-[#94A3B8]">
                    Lip Bend
                  </label>
                  <button
                    type="button"
                    onClick={() => setLipBendCents(0)}
                    className="font-mono text-[11px] tabular-nums text-[#F2F4F8] hover:text-[#F5C45E] cursor-pointer"
                    title="Click to center embouchure (0 cents)"
                  >
                    {lipBendCents > 0 ? `+${lipBendCents}¢` : `${lipBendCents}¢`}
                  </button>
                </div>
                <input
                  id="lip-bend-slider"
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={lipBendCents}
                  onChange={(e) => setLipBendCents(Number(e.target.value))}
                  className="brass-slider w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="vibrato-slider" className="text-[#94A3B8]">
                    Vibrato
                  </label>
                  <span className="font-mono text-[11px] tabular-nums text-[#F2F4F8]">
                    {vibratoCents}¢
                  </span>
                </div>
                <input
                  id="vibrato-slider"
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={vibratoCents}
                  onChange={(e) => setVibratoCents(Number(e.target.value))}
                  className="brass-slider w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="volume-slider" className="text-[#94A3B8] inline-flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    <span>Volume</span>
                  </label>
                  <span className="font-mono text-[11px] tabular-nums text-[#F2F4F8]">
                    {volume}%
                  </span>
                </div>
                <input
                  id="volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="brass-slider w-full"
                />
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ACADEMY LESSONS, PRACTICE MODE, PHRASE RECORDER & FINGERING CHART */}
        <FingeringAndPractice
          activeTab={studioTab}
          onChangeTab={setStudioTab}
          activeWrittenMidi={pitch.writtenMidi}
          isBlowing={isBlowing}
          playingMelodyId={playingMelodyId}
          melodyStepIndex={melodyStepIndex}
          selectedLesson={selectedLesson}
          completedLessonIds={completedLessonIds}
          coachFeedback={coachFeedback}
          metronomeOn={metronomeOn}
          metronomeBpm={metronomeBpm}
          metronomeBeat={metronomeBeat}
          onSelectLesson={(lesson) => {
            setSelectedLesson(lesson);
            setMetronomeBpm(lesson.recommendedBpm);
            if (practiceActive) {
              startLessonDrill(lesson);
            }
          }}
          onStartLessonDrill={startLessonDrill}
          onToggleMetronome={() => setMetronomeOn((v) => !v)}
          onChangeMetronomeBpm={setMetronomeBpm}
          practiceItem={practiceItem}
          practiceActive={practiceActive}
          practiceStepIndex={practiceStepIndex}
          practiceCompleted={practiceCompleted}
          practiceElapsedSec={practiceElapsedSec}
          isRecording={isRecording}
          recordingElapsedMs={recordingElapsedMs}
          recordedPhrase={recordedPhrase}
          isPlayingRecording={isPlayingRecording}
          playbackElapsedMs={playbackElapsedMs}
          loopRecording={loopRecording}
          onSelectPracticeItem={(item) => {
            setPracticeItem(item);
            if (practiceActive) startPractice(item);
          }}
          onStartPractice={startPractice}
          onStopPractice={stopPractice}
          onAuditionNote={auditionNote}
          onPreviewStart={handlePreviewStart}
          onPreviewStop={handlePreviewStop}
          onPlayMelody={startMelody}
          onStopMelody={stopMelody}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onPlayRecording={() => playRecording()}
          onStopRecordingPlayback={stopRecordingPlayback}
          onClearRecording={() => {
            stopRecordingPlayback();
            setRecordedPhrase(null);
          }}
          onToggleLoopRecording={() => setLoopRecording((v) => !v)}
        />

        {/* CONCISE ACOUSTIC ARCHITECTURE REFERENCE */}
        <section
          id="acoustics-summary"
          className="mt-10 border-t border-[#232834] pt-8 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6"
          aria-label="How the Trumpet Physics Work"
        >
          <div>
            <h3 className="font-[var(--font-display)] text-sm font-semibold text-[#F2F4F8]">
              01. Three-Valve Tubing Math
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mt-1.5">
              Each piston routes air through an extra brass loop: Valve 1 lowers pitch by 2 semitones, Valve 2 by 1 semitone, and Valve 3 by 3 semitones. Combining all three drops the harmonic series by a tritone (−6 semitones).
            </p>
          </div>
          <div>
            <h3 className="font-[var(--font-display)] text-sm font-semibold text-[#F2F4F8]">
              02. Embouchure &amp; Overblowing
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mt-1.5">
              With only 7 distinct tube lengths, trumpeters reach nearly three octaves by tightening lip tension and accelerating airflow to lock onto higher harmonic partials (C4, G4, C5, E5, G5, C6).
            </p>
          </div>
          <div>
            <h3 className="font-[var(--font-display)] text-sm font-semibold text-[#F2F4F8]">
              03. Transposing Keys &amp; Mutes
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mt-1.5">
              Switching between Bb, C, D, Eb, F, and Piccolo Bb shifts the physical fundamental tube length while keeping fingerings consistent—paired with real-time bell formant filtering for Straight, Cup, and Harmon mutes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
