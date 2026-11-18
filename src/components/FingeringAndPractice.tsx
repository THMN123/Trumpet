import React, { useState } from 'react';
import { Check, Circle, Play, Repeat, RotateCcw, Square, Target, Trash2, Volume2 } from 'lucide-react';
import { CoachFeedback, TrumpetLesson } from '../music/trumpetLessons';
import {
  CHROMATIC_FINGERING_CHART,
  ChromaticFingeringEntry,
  HARMONIC_PARTIALS,
  PRACTICE_MELODIES,
  PRACTICE_SCALES,
  PracticeMelody,
  RecordedPhrase,
  ValveTuple,
  getValveLabel,
} from '../music/trumpetPhysics';
import { TrumpetLessons } from './TrumpetLessons';

export type StudioTab = 'lessons' | 'practice' | 'recorder' | 'fingering';

interface FingeringAndPracticeProps {
  activeTab: StudioTab;
  onChangeTab: (tab: StudioTab) => void;
  activeWrittenMidi: number;
  isBlowing: boolean;
  playingMelodyId: string | null;
  melodyStepIndex: number;
  // Guided Lessons & Metronome props
  selectedLesson: TrumpetLesson;
  completedLessonIds: string[];
  coachFeedback: CoachFeedback | null;
  metronomeOn: boolean;
  metronomeBpm: number;
  metronomeBeat: number;
  onSelectLesson: (lesson: TrumpetLesson) => void;
  onStartLessonDrill: (lesson: TrumpetLesson) => void;
  onToggleMetronome: () => void;
  onChangeMetronomeBpm: (bpm: number) => void;
  // Scale / Phrase Replication Practice props
  practiceItem: PracticeMelody;
  practiceActive: boolean;
  practiceStepIndex: number;
  practiceCompleted: boolean;
  practiceElapsedSec: number;
  // Phrase Recorder props
  isRecording: boolean;
  recordingElapsedMs: number;
  recordedPhrase: RecordedPhrase | null;
  isPlayingRecording: boolean;
  playbackElapsedMs: number;
  loopRecording: boolean;
  onSelectPracticeItem: (item: PracticeMelody) => void;
  onStartPractice: (item: PracticeMelody) => void;
  onStopPractice: () => void;
  onAuditionNote: (valves: ValveTuple, partialId: number, durationMs?: number) => void;
  onPreviewStart: (valves: ValveTuple, airCenter: number) => void;
  onPreviewStop: () => void;
  onPlayMelody: (melody: PracticeMelody) => void;
  onStopMelody: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onStopRecordingPlayback: () => void;
  onClearRecording: () => void;
  onToggleLoopRecording: () => void;
}

export const FingeringAndPractice: React.FC<FingeringAndPracticeProps> = ({
  activeTab,
  onChangeTab,
  activeWrittenMidi,
  isBlowing,
  playingMelodyId,
  melodyStepIndex,
  selectedLesson,
  completedLessonIds,
  coachFeedback,
  metronomeOn,
  metronomeBpm,
  metronomeBeat,
  onSelectLesson,
  onStartLessonDrill,
  onToggleMetronome,
  onChangeMetronomeBpm,
  practiceItem,
  practiceActive,
  practiceStepIndex,
  practiceCompleted,
  practiceElapsedSec,
  isRecording,
  recordingElapsedMs,
  recordedPhrase,
  isPlayingRecording,
  playbackElapsedMs,
  loopRecording,
  onSelectPracticeItem,
  onStartPractice,
  onStopPractice,
  onAuditionNote,
  onPreviewStart,
  onPreviewStop,
  onPlayMelody,
  onStopMelody,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onStopRecordingPlayback,
  onClearRecording,
  onToggleLoopRecording,
}) => {
  const [libraryFilter, setLibraryFilter] = useState<'scales' | 'melodies'>('scales');

  const libraryItems = libraryFilter === 'scales' ? PRACTICE_SCALES : PRACTICE_MELODIES;
  const currentTargetStep =
    practiceActive && !practiceCompleted ? practiceItem.steps[practiceStepIndex] : null;
  const currentTargetPartial = currentTargetStep
    ? HARMONIC_PARTIALS.find((p) => p.id === currentTargetStep.partialId)
    : null;

  const isDemoPlayingSelected = playingMelodyId === practiceItem.id;

  // Summarize unique notes played in the recorded phrase for timeline display
  const recordedNotesSummary = React.useMemo(() => {
    if (!recordedPhrase) return [];
    const notes: Array<{ note: string; valves: ValveTuple; tMs: number }> = [];
    for (const ev of recordedPhrase.events) {
      if (!ev.isBlowing) continue;
      const last = notes[notes.length - 1];
      if (!last || last.note !== ev.writtenNote) {
        notes.push({ note: ev.writtenNote, valves: ev.valves, tMs: ev.tMs });
      }
    }
    return notes;
  }, [recordedPhrase]);

  const handleCardDown = (entry: ChromaticFingeringEntry) => {
    onPreviewStart(entry.valves, entry.airCenter);
  };

  return (
    <section
      id="reference-studio"
      className="mt-10 border-t border-[#232834] pt-8"
      aria-label="Practice Mode, Phrase Recorder, and Fingering Chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-[var(--font-display)] text-xl font-semibold text-[#F2F4F8] tracking-tight">
            Trumpet Academy &amp; Practice Studio
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Learn trumpet step by step from zero, practice scales with live feedback, or record and replay your own phrases.
          </p>
        </div>

        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#14171F] border border-[#232834] self-start"
          role="tablist"
          aria-label="Studio tools"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'lessons'}
            onClick={() => onChangeTab('lessons')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F2F4F8]'
            }`}
          >
            Guided Lessons
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'practice'}
            onClick={() => onChangeTab('practice')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F2F4F8]'
            }`}
          >
            Scale Practice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recorder'}
            onClick={() => onChangeTab('recorder')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'recorder'
                ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F2F4F8]'
            }`}
          >
            Phrase Recorder
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fingering'}
            onClick={() => onChangeTab('fingering')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'fingering'
                ? 'bg-[#D4A24C] text-[#0B0D11] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F2F4F8]'
            }`}
          >
            Fingering Chart
          </button>
        </div>
      </div>

      {/* TAB 0: STRUCTURED TRUMPET & MUSIC LESSONS */}
      {activeTab === 'lessons' && (
        <TrumpetLessons
          selectedLesson={selectedLesson}
          completedLessonIds={completedLessonIds}
          practiceActive={practiceActive}
          practiceItemId={practiceItem.id}
          practiceStepIndex={practiceStepIndex}
          practiceCompleted={practiceCompleted}
          practiceElapsedSec={practiceElapsedSec}
          playingMelodyId={playingMelodyId}
          melodyStepIndex={melodyStepIndex}
          coachFeedback={coachFeedback}
          metronomeOn={metronomeOn}
          metronomeBpm={metronomeBpm}
          metronomeBeat={metronomeBeat}
          onSelectLesson={onSelectLesson}
          onStartLessonDrill={onStartLessonDrill}
          onStopPractice={onStopPractice}
          onPlayDemo={onPlayMelody}
          onStopDemo={onStopMelody}
          onAuditionNote={onAuditionNote}
          onToggleMetronome={onToggleMetronome}
          onChangeMetronomeBpm={onChangeMetronomeBpm}
        />
      )}

      {/* TAB 1: SCALE & MELODY REPLICATION PRACTICE MODE */}
      {activeTab === 'practice' && (
        <div id="practice-mode" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Selector List (Scales vs Melodies) */}
          <div className="lg:col-span-5 rounded-xl bg-[#12151C] border border-[#232834] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-medium text-[#CBD5E1]">Select Exercise</span>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-[#0B0D11] border border-[#232834]">
                <button
                  type="button"
                  onClick={() => setLibraryFilter('scales')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    libraryFilter === 'scales'
                      ? 'bg-[#1E2432] text-[#F2F4F8]'
                      : 'text-[#64748B] hover:text-[#CBD5E1]'
                  }`}
                >
                  Scales
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryFilter('melodies')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    libraryFilter === 'melodies'
                      ? 'bg-[#1E2432] text-[#F2F4F8]'
                      : 'text-[#64748B] hover:text-[#CBD5E1]'
                  }`}
                >
                  Melodies
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {libraryItems.map((item) => {
                const isSelected = practiceItem.id === item.id;
                const isPlaying = playingMelodyId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPracticeItem(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                      isSelected
                        ? 'bg-[#1B1813] border-[#D4A24C] text-[#F2F4F8]'
                        : 'bg-[#161922] border-[#232834] text-[#CBD5E1] hover:border-[#3B4254]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-[var(--font-display)] text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums whitespace-nowrap shrink-0">
                        {isPlaying ? 'Playing' : `${item.steps.length} notes · ${item.tempoBpm} BPM`}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Practice Stage */}
          <div className="lg:col-span-7 rounded-xl bg-[#12151C] border border-[#232834] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232834]">
              <div>
                <h3 className="font-[var(--font-display)] text-lg font-semibold text-[#F2F4F8]">
                  {practiceItem.title}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{practiceItem.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    isDemoPlayingSelected ? onStopMelody() : onPlayMelody(practiceItem)
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    isDemoPlayingSelected
                      ? 'bg-[#DC2626] border-[#F87171] text-white'
                      : 'bg-[#171B24] border-[#2C3344] text-[#F2F4F8] hover:border-[#D4A24C]'
                  }`}
                >
                  {isDemoPlayingSelected ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Reference</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Hear Reference</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    practiceActive ? onStopPractice() : onStartPractice(practiceItem)
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    practiceActive
                      ? 'bg-[#1E293B] border border-[#38BDF8] text-[#BAE6FD]'
                      : 'bg-[#D4A24C] text-[#0B0D11] hover:bg-[#E5B65E] font-semibold'
                  }`}
                >
                  {practiceActive ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Exit Practice</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-3.5 h-3.5" />
                      <span>Practice &amp; Replicate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Replication Prompt */}
            {practiceActive && !practiceCompleted && currentTargetStep && (
              <div className="mt-4 p-4 rounded-lg bg-[#0B0D11] border border-[#D4A24C]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#94A3B8] font-mono tabular-nums">
                    Step {practiceStepIndex + 1} of {practiceItem.steps.length} · Play this note on your trumpet
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                    <span className="font-[var(--font-display)] text-2xl font-bold text-[#F5C45E] tabular-nums">
                      {currentTargetStep.note}
                    </span>
                    <span className="font-mono text-xs text-[#E2E8F0]">
                      Valves: {getValveLabel(currentTargetStep.valves)}
                    </span>
                    <span className="font-mono text-xs text-[#94A3B8]">
                      Air Key: {currentTargetPartial?.keyHint} ({currentTargetPartial?.name} ·{' '}
                      {currentTargetPartial?.airCenter}%)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAuditionNote(currentTargetStep.valves, currentTargetStep.partialId, 450)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] hover:border-[#D4A24C] hover:text-[#F9E3B4] transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Hear Target</span>
                </button>
              </div>
            )}

            {/* Practice Completion Summary */}
            {practiceActive && practiceCompleted && (
              <div className="mt-4 p-4 rounded-lg bg-[#0F1F18] border border-[#10B981]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6EE7B7]">
                    <Check className="w-4 h-4" />
                    <span>Scale Completed</span>
                  </div>
                  <p className="text-xs text-[#A7F3D0]/80 mt-1 font-mono tabular-nums">
                    Matched {practiceItem.steps.length}/{practiceItem.steps.length} notes in{' '}
                    {practiceElapsedSec.toFixed(1)}s
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onStartPractice(practiceItem)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#10B981] text-[#052E16] hover:bg-[#34D399] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Again</span>
                </button>
              </div>
            )}

            {/* Step-by-Step Note Strip (Clickable to audition individual notes) */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2.5">
                <span>Note Sequence (click any note to hear it)</span>
                <span className="font-mono tabular-nums">
                  {practiceActive
                    ? `${practiceCompleted ? practiceItem.steps.length : practiceStepIndex}/${practiceItem.steps.length} matched`
                    : `${practiceItem.steps.length} notes`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {practiceItem.steps.map((step, idx) => {
                  const partial = HARMONIC_PARTIALS.find((p) => p.id === step.partialId);
                  const valveText = getValveLabel(step.valves).replace('Open (0)', '0');

                  const isDemoStep = isDemoPlayingSelected && melodyStepIndex === idx;
                  const isPracticeTarget =
                    practiceActive && !practiceCompleted && practiceStepIndex === idx;
                  const isPracticeDone =
                    practiceActive && (practiceCompleted || idx < practiceStepIndex);

                  return (
                    <button
                      key={`${step.note}-${idx}`}
                      type="button"
                      onClick={() => onAuditionNote(step.valves, step.partialId, 420)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                        isDemoStep || isPracticeTarget
                          ? 'bg-[#261E11] border-[#D4A24C] text-[#F9E3B4]'
                          : isPracticeDone
                            ? 'bg-[#101F18] border-[#059669]/60 text-[#A7F3D0]'
                            : 'bg-[#0B0D11] border-[#232834] text-[#CBD5E1] hover:border-[#3B4254]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-[var(--font-display)] text-base font-semibold tabular-nums">
                          {step.note}
                        </span>
                        <span className="font-mono text-[11px] opacity-80">
                          {isPracticeDone ? 'Done' : `#${idx + 1}`}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[#94A3B8] mt-1.5 tabular-nums">
                        Valves {valveText} · {partial?.keyHint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHRASE RECORDER & TRUMPET PLAYBACK */}
      {activeTab === 'recorder' && (
        <div
          id="phrase-recorder"
          className="rounded-xl bg-[#12151C] border border-[#232834] p-5 sm:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#232834]">
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-[#F2F4F8]">
                Trumpet Phrase Recorder
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Record up to 30 seconds of live valve &amp; air performance, then play it back through the brass horn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={onStartRecording}
                  disabled={isPlayingRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C]"
                >
                  <Circle className="w-3.5 h-3.5 fill-current" />
                  <span>{recordedPhrase ? 'Record New Phrase' : 'Record Phrase'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStopRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#F2F4F8] text-[#0B0D11] hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C]"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Recording</span>
                </button>
              )}

              {recordedPhrase && !isRecording && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      isPlayingRecording ? onStopRecordingPlayback() : onPlayRecording()
                    }
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                      isPlayingRecording
                        ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                        : 'bg-[#D4A24C] text-[#0B0D11] hover:bg-[#E5B65E]'
                    }`}
                  >
                    {isPlayingRecording ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Playback</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Phrase</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleLoopRecording}
                    aria-pressed={loopRecording}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                      loopRecording
                        ? 'bg-[#1E293B] border-[#38BDF8] text-[#BAE6FD]'
                        : 'bg-[#171B24] border-[#2C3344] text-[#CBD5E1] hover:border-[#475569]'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{loopRecording ? 'Loop: On' : 'Loop: Off'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClearRecording}
                    disabled={isPlayingRecording}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#171B24] border border-[#2C3344] text-[#94A3B8] hover:text-[#F87171] hover:border-[#F87171]/50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Recording / Playback Timeline & Captured Notes */}
          <div className="mt-5">
            {isRecording ? (
              <div className="p-4 rounded-lg bg-[#1F1214] border border-[#DC2626]/60">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-[#FCA5A5] font-semibold">
                    Recording Live Performance — Play valves &amp; air pressure now
                  </span>
                  <span className="text-[#F2F4F8]">
                    {(recordingElapsedMs / 1000).toFixed(1)}s / 30.0s
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#0B0D11] mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#DC2626] transition-all duration-100"
                    style={{ width: `${Math.min(100, (recordingElapsedMs / 30000) * 100)}%` }}
                  />
                </div>
              </div>
            ) : recordedPhrase ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0B0D11] border border-[#232834]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#94A3B8]">
                    <span>
                      Captured Phrase · {recordedPhrase.noteCount} articulated{' '}
                      {recordedPhrase.noteCount === 1 ? 'note' : 'notes'} ·{' '}
                      {(recordedPhrase.durationMs / 1000).toFixed(1)}s
                    </span>
                    <span className={isPlayingRecording ? 'text-[#F5C45E] font-semibold' : ''}>
                      {isPlayingRecording
                        ? `${(playbackElapsedMs / 1000).toFixed(1)}s / ${(recordedPhrase.durationMs / 1000).toFixed(1)}s`
                        : 'Ready for Playback'}
                    </span>
                  </div>

                  {/* Playback progress bar */}
                  <div className="w-full h-2 rounded-full bg-[#171B24] mt-3 overflow-hidden">
                    <div
                      className="h-full bg-[#D4A24C] transition-all duration-75"
                      style={{
                        width: isPlayingRecording
                          ? `${Math.min(100, (playbackElapsedMs / Math.max(1, recordedPhrase.durationMs)) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Captured Note Sequence Chips */}
                {recordedNotesSummary.length > 0 ? (
                  <div>
                    <div className="text-xs text-[#94A3B8] mb-2">
                      Captured Notes Sequence ({recordedNotesSummary.length} transitions)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recordedNotesSummary.map((item, i) => (
                        <div
                          key={`${item.note}-${i}`}
                          className="px-2.5 py-1 rounded bg-[#0B0D11] border border-[#232834] font-mono text-xs text-[#E2E8F0] tabular-nums"
                        >
                          <span className="text-[#F5C45E] font-semibold">{item.note}</span>
                          <span className="text-[#64748B] mx-1">·</span>
                          <span className="text-[#94A3B8]">
                            {getValveLabel(item.valves).replace('Open (0)', '0')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    No sounding notes were captured in this take (make sure to blow with Space, Auto-Blow, or Air Pressure keys A–H while recording).
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#0B0D11] border border-[#232834] text-center">
                <p className="text-sm text-[#CBD5E1]">
                  No recorded phrase yet.
                </p>
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  Click <strong className="text-[#F2F4F8]">Record Phrase</strong>, play a short riff using your valves (<span className="font-mono">123 / QWE / ←↓→</span>) and air pressure (<span className="font-mono">A S D F G H</span> or <span className="font-mono">Space</span>), then press <strong className="text-[#F2F4F8]">Stop Recording</strong> to play it back on the horn.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHROMATIC FINGERING CHART */}
      {activeTab === 'fingering' && (
        <div
          id="fingering-chart"
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5"
        >
          {CHROMATIC_FINGERING_CHART.map((entry) => {
            const isActiveNote = activeWrittenMidi === entry.writtenMidi;
            const isActiveSounding = isActiveNote && isBlowing;

            return (
              <button
                key={entry.writtenMidi}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                  handleCardDown(entry);
                }}
                onPointerUp={onPreviewStop}
                onPointerCancel={onPreviewStop}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardDown(entry);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPreviewStop();
                  }
                }}
                className={`group text-left p-3 rounded-lg border transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                  isActiveSounding
                    ? 'bg-[#261E11] border-[#D4A24C] text-[#F9E3B4]'
                    : isActiveNote
                      ? 'bg-[#1A1D26] border-[#64748B] text-[#F2F4F8]'
                      : 'bg-[#14171F] border-[#232834] text-[#CBD5E1] hover:border-[#3B4254] hover:bg-[#191D28]'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-[var(--font-display)] text-base font-semibold tabular-nums">
                    {entry.writtenNote}
                  </span>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    P{entry.partialId} · {entry.keyHint}
                  </span>
                </div>

                {/* Visual 3-Valve Dots */}
                <div className="flex items-center gap-1.5 mt-2.5" aria-hidden="true">
                  {entry.valves.map((pressed, i) => (
                    <span
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border text-[9px] font-mono flex items-center justify-center ${
                        pressed
                          ? 'bg-[#D4A24C] border-[#F5C45E] text-[#0B0D11] font-semibold'
                          : 'bg-[#0B0D11] border-[#333B4D] text-[#64748B]'
                      }`}
                    >
                      {i + 1}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    {entry.valveLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
