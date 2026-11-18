import React from 'react';
import { ArrowRight, Check, Play, RotateCcw, Square, Target, Volume2 } from 'lucide-react';
import { CoachFeedback, TRUMPET_LESSONS, TrumpetLesson } from '../music/trumpetLessons';
import { HARMONIC_PARTIALS, PracticeMelody, ValveTuple, getValveLabel } from '../music/trumpetPhysics';

interface TrumpetLessonsProps {
  selectedLesson: TrumpetLesson;
  completedLessonIds: string[];
  practiceActive: boolean;
  practiceItemId: string;
  practiceStepIndex: number;
  practiceCompleted: boolean;
  practiceElapsedSec: number;
  playingMelodyId: string | null;
  melodyStepIndex: number;
  coachFeedback: CoachFeedback | null;
  metronomeOn: boolean;
  metronomeBpm: number;
  metronomeBeat: number; // 0..3
  onSelectLesson: (lesson: TrumpetLesson) => void;
  onStartLessonDrill: (lesson: TrumpetLesson) => void;
  onStopPractice: () => void;
  onPlayDemo: (melody: PracticeMelody) => void;
  onStopDemo: () => void;
  onAuditionNote: (valves: ValveTuple, partialId: number, durationMs?: number) => void;
  onToggleMetronome: () => void;
  onChangeMetronomeBpm: (bpm: number) => void;
}

export const TrumpetLessons: React.FC<TrumpetLessonsProps> = ({
  selectedLesson,
  completedLessonIds,
  practiceActive,
  practiceItemId,
  practiceStepIndex,
  practiceCompleted,
  practiceElapsedSec,
  playingMelodyId,
  melodyStepIndex,
  coachFeedback,
  metronomeOn,
  metronomeBpm,
  metronomeBeat,
  onSelectLesson,
  onStartLessonDrill,
  onStopPractice,
  onPlayDemo,
  onStopDemo,
  onAuditionNote,
  onToggleMetronome,
  onChangeMetronomeBpm,
}) => {
  const isThisLessonPractice = practiceActive && practiceItemId === selectedLesson.drill.id;
  const isDemoPlayingThis = playingMelodyId === selectedLesson.drill.id;
  const currentStep =
    isThisLessonPractice && !practiceCompleted
      ? selectedLesson.drill.steps[practiceStepIndex]
      : null;
  const currentPartial = currentStep
    ? HARMONIC_PARTIALS.find((p) => p.id === currentStep.partialId)
    : null;

  const nextLesson = TRUMPET_LESSONS.find((l) => l.number === selectedLesson.number + 1) ?? null;

  return (
    <div id="guided-lessons" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT CURRICULUM SYLLABUS */}
      <div className="lg:col-span-5 rounded-xl bg-[#12151C] border border-[#232834] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-medium text-[#CBD5E1]">Trumpet Curriculum</span>
          <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
            {completedLessonIds.length} / {TRUMPET_LESSONS.length} completed
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {TRUMPET_LESSONS.map((lesson) => {
            const isSelected = lesson.id === selectedLesson.id;
            const isDone = completedLessonIds.includes(lesson.id);

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson)}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                  isSelected
                    ? 'bg-[#1B1813] border-[#D4A24C] text-[#F2F4F8]'
                    : 'bg-[#161922] border-[#232834] text-[#CBD5E1] hover:border-[#3B4254]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-[var(--font-display)] text-sm font-semibold">
                    {lesson.title}
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#6EE7B7] whitespace-nowrap shrink-0">
                      <Check className="w-3 h-3" />
                      <span>Passed</span>
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0">
                      {lesson.level}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">{lesson.focus}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT ACTIVE LESSON CLASSROOM */}
      <div className="lg:col-span-7 rounded-xl bg-[#12151C] border border-[#232834] p-5 sm:p-6">
        {/* Lesson Header & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#232834]">
          <div>
            <div className="text-xs font-mono text-[#94A3B8]">
              Lesson {selectedLesson.number} of {TRUMPET_LESSONS.length} · {selectedLesson.level} ·{' '}
              {selectedLesson.recommendedBpm} BPM
            </div>
            <h3 className="font-[var(--font-display)] text-lg font-semibold text-[#F2F4F8] mt-1">
              {selectedLesson.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                isDemoPlayingThis ? onStopDemo() : onPlayDemo(selectedLesson.drill)
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                isDemoPlayingThis
                  ? 'bg-[#DC2626] border-[#F87171] text-white'
                  : 'bg-[#171B24] border-[#2C3344] text-[#F2F4F8] hover:border-[#D4A24C]'
              }`}
            >
              {isDemoPlayingThis ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Demo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Hear Teacher Demo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                isThisLessonPractice ? onStopPractice() : onStartLessonDrill(selectedLesson)
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                isThisLessonPractice
                  ? 'bg-[#1E293B] border border-[#38BDF8] text-[#BAE6FD]'
                  : 'bg-[#D4A24C] text-[#0B0D11] hover:bg-[#E5B65E]'
              }`}
            >
              {isThisLessonPractice ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Exit Lesson Drill</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5" />
                  <span>Start Lesson Drill</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Teacher Explanation & Key Takeaways */}
        <div className="mt-4 space-y-3">
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            {selectedLesson.teacherExplanation}
          </p>

          <ul className="space-y-1.5 text-xs text-[#94A3B8]">
            {selectedLesson.keyTakeaways.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[#D4A24C] shrink-0">0{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Built-in Metronome Practice Bar */}
        <div className="mt-5 p-3.5 rounded-lg bg-[#0B0D11] border border-[#232834] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMetronome}
              aria-pressed={metronomeOn}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                metronomeOn
                  ? 'bg-[#D4A24C] border-[#F5C45E] text-[#0B0D11] font-semibold'
                  : 'bg-[#171B24] border-[#2C3344] text-[#CBD5E1] hover:border-[#475569]'
              }`}
            >
              {metronomeOn ? 'Metronome: On' : 'Metronome: Off'}
            </button>

            <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums" aria-label="Metronome beat">
              {[0, 1, 2, 3].map((b) => (
                <span
                  key={b}
                  className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                    metronomeOn && metronomeBeat === b
                      ? b === 0
                        ? 'bg-[#D4A24C] border-[#FDE68A] text-[#0B0D11] font-bold'
                        : 'bg-[#334155] border-[#64748B] text-[#F2F4F8] font-semibold'
                      : 'bg-[#14171F] border-[#232834] text-[#64748B]'
                  }`}
                >
                  {b + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-[180px] max-w-[260px]">
            <label htmlFor="metronome-bpm" className="text-xs text-[#94A3B8] whitespace-nowrap">
              Tempo
            </label>
            <input
              id="metronome-bpm"
              type="range"
              min={56}
              max={132}
              step={2}
              value={metronomeBpm}
              onChange={(e) => onChangeMetronomeBpm(Number(e.target.value))}
              className="brass-slider w-full"
            />
            <span className="font-mono text-xs tabular-nums text-[#F2F4F8] whitespace-nowrap">
              {metronomeBpm} BPM
            </span>
          </div>
        </div>

        {/* Live Teacher Coach Diagnostic Box (when drill active) */}
        {isThisLessonPractice && !practiceCompleted && currentStep && (
          <div className="mt-4 p-4 rounded-lg bg-[#0B0D11] border border-[#D4A24C]/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-[#94A3B8] tabular-nums">
                  Step {practiceStepIndex + 1} of {selectedLesson.drill.steps.length} ·{' '}
                  {currentStep.beatLabel} · {currentStep.staffHint}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                  <span className="font-[var(--font-display)] text-2xl font-bold text-[#F5C45E] tabular-nums">
                    {currentStep.note}
                  </span>
                  <span className="font-mono text-xs text-[#E2E8F0]">
                    Valves: {getValveLabel(currentStep.valves)}
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    Air Key: {currentPartial?.keyHint} ({currentPartial?.name})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onAuditionNote(currentStep.valves, currentStep.partialId, 480)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] hover:border-[#D4A24C] hover:text-[#F9E3B4] transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Note</span>
              </button>
            </div>

            {coachFeedback && (
              <div
                className={`mt-3 pt-3 border-t border-[#232834] text-xs leading-relaxed ${
                  coachFeedback.status === 'correct'
                    ? 'text-[#6EE7B7]'
                    : coachFeedback.status === 'adjust'
                      ? 'text-[#FCD34D]'
                      : coachFeedback.status === 'release_needed'
                        ? 'text-[#7DD3FC]'
                        : 'text-[#CBD5E1]'
                }`}
              >
                <strong className="font-semibold">Teacher Tip: </strong>
                {coachFeedback.message}
              </div>
            )}
          </div>
        )}

        {/* Lesson Drill Completion Card */}
        {isThisLessonPractice && practiceCompleted && (
          <div className="mt-4 p-4 rounded-lg bg-[#0F1F18] border border-[#10B981]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6EE7B7]">
                <Check className="w-4 h-4" />
                <span>Lesson {selectedLesson.number} Passed</span>
              </div>
              <p className="text-xs text-[#A7F3D0]/85 mt-1 font-mono tabular-nums">
                Completed {selectedLesson.drill.steps.length}/{selectedLesson.drill.steps.length} notes in{' '}
                {practiceElapsedSec.toFixed(1)}s
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onStartLessonDrill(selectedLesson)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#143326] border border-[#10B981]/50 text-[#A7F3D0] hover:bg-[#194231] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat</span>
              </button>

              {nextLesson && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectLesson(nextLesson);
                    onStartLessonDrill(nextLesson);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#10B981] text-[#052E16] hover:bg-[#34D399] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Next: Lesson {nextLesson.number}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lesson Note Sequence Cards */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2.5">
            <span>Lesson Exercise Notes (click any card to hear how it sounds)</span>
            <span className="font-mono tabular-nums">
              {selectedLesson.drill.steps.length} steps
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedLesson.drill.steps.map((step, idx) => {
              const partial = HARMONIC_PARTIALS.find((p) => p.id === step.partialId);
              const valveText = getValveLabel(step.valves).replace('Open (0)', '0');

              const isDemoStep = isDemoPlayingThis && melodyStepIndex === idx;
              const isDrillTarget =
                isThisLessonPractice && !practiceCompleted && practiceStepIndex === idx;
              const isDrillDone =
                isThisLessonPractice && (practiceCompleted || idx < practiceStepIndex);

              return (
                <button
                  key={`${step.note}-${idx}`}
                  type="button"
                  onClick={() => onAuditionNote(step.valves, step.partialId, 460)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A24C] ${
                    isDemoStep || isDrillTarget
                      ? 'bg-[#261E11] border-[#D4A24C] text-[#F9E3B4]'
                      : isDrillDone
                        ? 'bg-[#101F18] border-[#059669]/60 text-[#A7F3D0]'
                        : 'bg-[#0B0D11] border-[#232834] text-[#CBD5E1] hover:border-[#3B4254]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[var(--font-display)] text-base font-semibold tabular-nums">
                      {step.note}
                    </span>
                    <span className="font-mono text-[10px] opacity-80">
                      {isDrillDone ? 'Done' : step.beatLabel}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#94A3B8] mt-1 tabular-nums">
                    Valves {valveText} · {partial?.keyHint}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 truncate">
                    {step.staffHint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
