import React, { useRef } from 'react';
import { Mic, MicOff, RotateCcw, Smartphone, Wind } from 'lucide-react';
import {
  HarmonicPartial,
  MuteType,
  RECOMMENDED_PARTIALS,
  TRUMPET_KEYS,
  TrumpetKeyId,
  ValveTuple,
} from '../music/trumpetPhysics';

interface PhonePlayDeckProps {
  valves: ValveTuple;
  airPressure: number;
  activePartial: HarmonicPartial;
  isBlowing: boolean;
  continuousAir: boolean;
  micEnabled: boolean;
  isMicBlowing: boolean;
  micLevelPct: number;
  micThresholdPct: number;
  micSensitivity: number;
  micError: string | null;
  keyId: TrumpetKeyId;
  mute: MuteType;
  compactPhoneView?: boolean;
  onAirPadStart: (airPct: number) => void;
  onAirPadMove: (airPct: number) => void;
  onAirPadEnd: () => void;
  onValvePointerDown: (idx: 0 | 1 | 2) => void;
  onValvePointerUp: (idx: 0 | 1 | 2) => void;
  onComboDown: (combo: ValveTuple) => void;
  onComboUp: () => void;
  onToggleContinuousAir: () => void;
  onToggleMic: () => void;
  onRecalibrateMic: () => void;
  onChangeMicSensitivity: (val: number) => void;
  onChangeKey: (keyId: TrumpetKeyId) => void;
  onChangeMute: (mute: MuteType) => void;
}

const COMBO_PADS: Array<{ label: string; sub: string; valves: ValveTuple }> = [
  { label: '1+2', sub: '−3', valves: [true, true, false] },
  { label: '1+3', sub: '−5', valves: [true, false, true] },
  { label: '2+3', sub: '−4', valves: [false, true, true] },
  { label: '123', sub: '−6', valves: [true, true, true] },
];

const MUTE_OPTIONS: Array<{ id: MuteType; label: string }> = [
  { id: 'open', label: 'Open' },
  { id: 'straight', label: 'Straight' },
  { id: 'cup', label: 'Cup' },
  { id: 'harmon', label: 'Harmon' },
];

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore if blocked by browser policy
    }
  }
}

export const PhonePlayDeck: React.FC<PhonePlayDeckProps> = ({
  valves,
  airPressure,
  activePartial,
  isBlowing,
  continuousAir,
  micEnabled,
  isMicBlowing,
  micLevelPct,
  micThresholdPct,
  micSensitivity,
  micError,
  keyId,
  mute,
  compactPhoneView = false,
  onAirPadStart,
  onAirPadMove,
  onAirPadEnd,
  onValvePointerDown,
  onValvePointerUp,
  onComboDown,
  onComboUp,
  onToggleContinuousAir,
  onToggleMic,
  onRecalibrateMic,
  onChangeMicSensitivity,
  onChangeKey,
  onChangeMute,
}) => {
  const airPadRef = useRef<HTMLDivElement | null>(null);
  const activeAirPointerIdRef = useRef<number | null>(null);
  const activeValvePointersRef = useRef<Map<number, 0 | 1 | 2>>(new Map());
  const activeComboPointerRef = useRef<number | null>(null);

  // Ordered top (Lead C6) to bottom (Low C4) for natural thumb slide-up = higher pitch
  const partialsTopToBottom = [...RECOMMENDED_PARTIALS].reverse();

  const computeAirFromClientY = (clientY: number): number => {
    const el = airPadRef.current;
    if (!el) return airPressure;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / Math.max(1, rect.height);
    // Map [0..1] vertically across [18..99] so bottom = Low C4 (24%) and top = Lead C6 (97%)
    return Math.round(Math.max(18, Math.min(99, 18 + ratio * 81)));
  };

  const handleAirPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    activeAirPointerIdRef.current = e.pointerId;
    triggerHaptic();
    onAirPadStart(computeAirFromClientY(e.clientY));
  };

  const handleAirPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeAirPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    onAirPadMove(computeAirFromClientY(e.clientY));
  };

  const handleAirPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeAirPointerIdRef.current !== e.pointerId) return;
    activeAirPointerIdRef.current = null;
    onAirPadEnd();
  };

  return (
    <section
      id="phone-play-deck"
      className={
        compactPhoneView
          ? 'space-y-3'
          : 'mt-5 rounded-2xl bg-[#12151C] border border-[#232834] p-4 sm:p-5 space-y-4'
      }
      aria-label="Phone Multi-Touch Trumpet Grip"
    >
      {!compactPhoneView && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#232834]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D4A24C] shrink-0" />
            <h2 className="font-[var(--font-display)] text-base font-semibold text-[#F2F4F8]">
              Phone Touch Grip (2-Thumb &amp; Multi-Finger)
            </h2>
          </div>
          <span className="text-xs text-[#94A3B8]">
            Left thumb slides Air Pressure · Right hand plays Valves &amp; Combos
          </span>
        </div>
      )}

      {/* BREATH MODE BAR: BLOW INTO MIC + ONE-HAND AUTO-BLOW */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggleMic}
          aria-pressed={micEnabled}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            micEnabled && isMicBlowing
              ? 'bg-[#065F46] border-[#34D399] text-[#ECFDF5] font-semibold'
              : micEnabled
                ? 'bg-[#101F18] border-[#10B981] text-[#6EE7B7]'
                : 'bg-[#171B24] border-[#2C3344] text-[#CBD5E1] hover:border-[#475569]'
          }`}
        >
          {micEnabled ? <Mic className="w-4 h-4 shrink-0" /> : <MicOff className="w-4 h-4 shrink-0" />}
          <span>
            {micEnabled ? (isMicBlowing ? 'Mic: Blowing' : 'Mic: Listening') : 'Blow into Mic'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleContinuousAir}
          aria-pressed={continuousAir}
          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            continuousAir
              ? 'bg-[#1E293B] border-[#38BDF8] text-[#BAE6FD] font-semibold'
              : 'bg-[#171B24] border-[#2C3344] text-[#CBD5E1] hover:border-[#475569]'
          }`}
        >
          <Wind className="w-4 h-4 shrink-0" />
          <span>{continuousAir ? 'Auto-Blow: On' : 'One-Hand Auto-Blow'}</span>
        </button>
      </div>

      {/* LIVE MIC BREATH METER + THRESHOLD MARKER + RECALIBRATE */}
      {micEnabled && (
        <div className="p-3 rounded-xl bg-[#0B0D11] border border-[#232834] space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
            <span className={isMicBlowing ? 'text-[#6EE7B7] font-semibold' : 'text-[#94A3B8]'}>
              {isMicBlowing
                ? 'Breath detected — sounding horn'
                : 'Blow gently across mic (headphones best)'}
            </span>
            <span className="text-[#CBD5E1] shrink-0">
              {micLevelPct}% / {micThresholdPct}%
            </span>
          </div>

          <div className="relative w-full h-2.5 rounded-full bg-[#171B24] overflow-hidden">
            <div
              className={`h-full transition-transform duration-75 origin-left ${
                isMicBlowing ? 'bg-[#34D399]' : 'bg-[#10B981]/60'
              }`}
              style={{ width: '100%', transform: `scaleX(${micLevelPct / 100})` }}
            />
            {/* Trigger Threshold Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#F5C45E]"
              style={{ left: `${micThresholdPct}%` }}
              title={`Trigger threshold: ${micThresholdPct}%`}
            />
          </div>

          <div className="flex items-center justify-between gap-2.5 text-xs text-[#94A3B8]">
            <label htmlFor="mic-sensitivity" className="whitespace-nowrap shrink-0 text-[11px]">
              Sensitivity
            </label>
            <input
              id="mic-sensitivity"
              type="range"
              min={10}
              max={95}
              value={micSensitivity}
              onChange={(e) => onChangeMicSensitivity(Number(e.target.value))}
              className="brass-slider w-full"
            />
            <button
              type="button"
              onClick={onRecalibrateMic}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-[#171B24] border border-[#2C3344] text-[#CBD5E1] hover:border-[#D4A24C] whitespace-nowrap shrink-0 cursor-pointer"
              title="Re-measure quiet room ambient level"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Recalibrate</span>
            </button>
          </div>
        </div>
      )}

      {micError && <p className="text-xs text-[#FCA5A5]">{micError}</p>}

      {/* TWO-HANDED TOUCH PLAY SURFACE (Left Thumb Air Slide + Right Hand 3 Pistons & Combos) */}
      <div className="grid grid-cols-12 gap-2.5 items-stretch">
        {/* LEFT THUMB ZONE: CONTINUOUS MOUTHPIECE AIR PAD */}
        <div className="col-span-5 flex flex-col">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-medium text-[#CBD5E1] truncate">Air Slide</span>
            <span className="font-mono tabular-nums text-[#F5C45E] shrink-0">
              {airPressure}%
            </span>
          </div>

          <div
            ref={airPadRef}
            onPointerDown={handleAirPointerDown}
            onPointerMove={handleAirPointerMove}
            onPointerUp={handleAirPointerEnd}
            onPointerCancel={handleAirPointerEnd}
            role="slider"
            aria-label="Touch and slide vertically to blow and change air pressure partials"
            aria-valuemin={18}
            aria-valuemax={99}
            aria-valuenow={airPressure}
            tabIndex={0}
            className={`relative flex-1 min-h-[252px] rounded-xl border overflow-hidden touch-none select-none cursor-ns-resize flex flex-col justify-between transition-colors ${
              isBlowing
                ? 'border-[#D4A24C] bg-[#19150E]'
                : 'border-[#2D3446] bg-[#0B0D11]'
            }`}
          >
            <div
              className="absolute inset-x-0 bottom-0 bg-[#D4A24C]/20 pointer-events-none transition-transform duration-75 origin-bottom"
              style={{
                height: '100%',
                transform: `scaleY(${Math.max(0.05, airPressure / 100)})`,
              }}
            />

            {partialsTopToBottom.map((p) => {
              const isActiveBand = activePartial.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`relative z-10 flex items-center justify-between px-2.5 py-2 border-b last:border-b-0 border-[#232834]/80 text-[11px] ${
                    isActiveBand && isBlowing
                      ? 'bg-[#D4A24C]/25 text-[#F9E3B4] font-semibold'
                      : isActiveBand
                        ? 'text-[#F5C45E] font-medium'
                        : 'text-[#94A3B8]'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono tabular-nums shrink-0 ml-1">
                    {p.openNoteLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 text-[10px] text-[#64748B] text-center">
            {micEnabled || continuousAir ? 'Tap/slide sets register' : 'Hold & slide to blow'}
          </div>
        </div>

        {/* RIGHT HAND ZONE: 3 MULTI-TOUCH VALVES + SINGLE-THUMB COMBO PADS */}
        <div className="col-span-7 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-medium text-[#CBD5E1]">3 Pistons</span>
              <span className="font-mono text-[#94A3B8]">Multi-touch</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { idx: 0 as const, num: '1', drop: '−2', label: 'Index' },
                { idx: 1 as const, num: '2', drop: '−1', label: 'Middle' },
                { idx: 2 as const, num: '3', drop: '−3', label: 'Ring' },
              ].map((v) => {
                const pressed = valves[v.idx];
                return (
                  <button
                    key={v.num}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      activeValvePointersRef.current.set(e.pointerId, v.idx);
                      triggerHaptic();
                      onValvePointerDown(v.idx);
                    }}
                    onPointerUp={(e) => {
                      if (activeValvePointersRef.current.has(e.pointerId)) {
                        activeValvePointersRef.current.delete(e.pointerId);
                        onValvePointerUp(v.idx);
                      }
                    }}
                    onPointerCancel={(e) => {
                      if (activeValvePointersRef.current.has(e.pointerId)) {
                        activeValvePointersRef.current.delete(e.pointerId);
                        onValvePointerUp(v.idx);
                      }
                    }}
                    aria-pressed={pressed}
                    className={`min-h-[144px] rounded-xl border flex flex-col items-center justify-center gap-1.5 touch-none select-none transition-transform duration-75 cursor-pointer ${
                      pressed
                        ? 'translate-y-1 bg-gradient-to-b from-[#E5B85C] to-[#B67E22] border-[#FDE68A] text-[#0B0D11]'
                        : 'bg-[#181C26] border-[#2D3446] text-[#F2F4F8] shadow-[0_4px_0_0_#0A0C10]'
                    }`}
                  >
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-[var(--font-display)] text-xl font-bold border ${
                        pressed
                          ? 'bg-[#0B0D11]/15 border-[#0B0D11]/30 text-[#0B0D11]'
                          : 'bg-[#0E1117] border-[#333B4D] text-[#F5C45E]'
                      }`}
                    >
                      {v.num}
                    </span>
                    <span className="text-[11px] font-semibold">{v.label}</span>
                    <span
                      className={`font-mono text-[10px] tabular-nums ${
                        pressed ? 'text-[#0B0D11]/85' : 'text-[#94A3B8]'
                      }`}
                    >
                      {v.drop} st
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single-Thumb Combo Shortcuts */}
          <div>
            <div className="text-[11px] text-[#94A3B8] mb-1">1-Thumb Combos</div>
            <div className="grid grid-cols-4 gap-1.5">
              {COMBO_PADS.map((combo) => {
                const isComboActive =
                  valves[0] === combo.valves[0] &&
                  valves[1] === combo.valves[1] &&
                  valves[2] === combo.valves[2];
                return (
                  <button
                    key={combo.label}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      activeComboPointerRef.current = e.pointerId;
                      triggerHaptic();
                      onComboDown(combo.valves);
                    }}
                    onPointerUp={(e) => {
                      if (activeComboPointerRef.current === e.pointerId) {
                        activeComboPointerRef.current = null;
                        onComboUp();
                      }
                    }}
                    onPointerCancel={(e) => {
                      if (activeComboPointerRef.current === e.pointerId) {
                        activeComboPointerRef.current = null;
                        onComboUp();
                      }
                    }}
                    className={`min-h-[54px] rounded-lg border flex flex-col items-center justify-center touch-none select-none transition-colors cursor-pointer ${
                      isComboActive
                        ? 'bg-[#D4A24C] border-[#FDE68A] text-[#0B0D11] font-semibold'
                        : 'bg-[#171B24] border-[#2C3344] text-[#CBD5E1] active:bg-[#232834]'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-semibold tabular-nums">
                      {combo.label}
                    </span>
                    <span
                      className={`font-mono text-[10px] tabular-nums ${
                        isComboActive ? 'text-[#0B0D11]/80' : 'text-[#64748B]'
                      }`}
                    >
                      {combo.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT TRUMPET KEY & BELL MUTE QUICK STRIP (for handheld Phone UI View) */}
      {compactPhoneView && (
        <div className="pt-2.5 border-t border-[#232834] grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="phone-key-select" className="block text-[11px] text-[#94A3B8] mb-1">
              Trumpet Key
            </label>
            <select
              id="phone-key-select"
              value={keyId}
              onChange={(e) => onChangeKey(e.target.value as TrumpetKeyId)}
              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#171B24] border border-[#2C3344] text-xs font-medium text-[#F2F4F8]"
            >
              {TRUMPET_KEYS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="phone-mute-select" className="block text-[11px] text-[#94A3B8] mb-1">
              Bell Mute
            </label>
            <select
              id="phone-mute-select"
              value={mute}
              onChange={(e) => onChangeMute(e.target.value as MuteType)}
              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#171B24] border border-[#2C3344] text-xs font-medium text-[#F2F4F8]"
            >
              {MUTE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
};
