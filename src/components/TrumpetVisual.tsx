import React from 'react';
import { MuteType, ValveTuple } from '../music/trumpetPhysics';

interface TrumpetVisualProps {
  valves: ValveTuple;
  isBlowing: boolean;
  airPressure: number;
  mute: MuteType;
  a4Hz: number;
  onValvePointerDown: (index: 0 | 1 | 2) => void;
  onValvePointerUp: (index: 0 | 1 | 2) => void;
}

export const TrumpetVisual: React.FC<TrumpetVisualProps> = ({
  valves,
  isBlowing,
  airPressure,
  mute,
  a4Hz,
  onValvePointerDown,
  onValvePointerUp,
}) => {
  // Tuning slide pull distance: 440 Hz = 0px, 438 Hz = -10px (pulled out left), 444 Hz = +10px (pushed in right)
  const tuningOffsetPx = (a4Hz - 440) * 2.5;
  const bellWaveOpacity = isBlowing ? Math.min(0.85, 0.25 + (airPressure / 100) * 0.6) : 0;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox="0 0 920 300"
        className="w-full h-auto max-h-[290px] overflow-visible"
        role="img"
        aria-label="Interactive brass trumpet with three playable pistons, tuning slides, and bell"
      >
        <defs>
          {/* Brushed Brass Metallic Gradients */}
          <linearGradient id="brassTubeH" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8DE94" />
            <stop offset="28%" stopColor="#D6A146" />
            <stop offset="65%" stopColor="#9C6E21" />
            <stop offset="88%" stopColor="#E6B85C" />
            <stop offset="100%" stopColor="#6D4B13" />
          </linearGradient>

          <linearGradient id="brassTubeV" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8A5F1A" />
            <stop offset="25%" stopColor="#F6DA8E" />
            <stop offset="55%" stopColor="#CA9339" />
            <stop offset="85%" stopColor="#9B6B1E" />
            <stop offset="100%" stopColor="#61410F" />
          </linearGradient>

          <linearGradient id="brassBell" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C89238" />
            <stop offset="45%" stopColor="#E8BA62" />
            <stop offset="82%" stopColor="#FBE5A4" />
            <stop offset="100%" stopColor="#B87E23" />
          </linearGradient>

          <linearGradient id="silverPlate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3F5F8" />
            <stop offset="40%" stopColor="#AEB6C4" />
            <stop offset="80%" stopColor="#6A7280" />
            <stop offset="100%" stopColor="#D4DBE6" />
          </linearGradient>

          <linearGradient id="pearlCap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E7E9EE" />
            <stop offset="100%" stopColor="#B7BEC9" />
          </linearGradient>

          <linearGradient id="activeLoopGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE699" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <radialGradient id="bellInterior" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B2406" />
            <stop offset="65%" stopColor="#7A5216" />
            <stop offset="100%" stopColor="#C99235" />
          </radialGradient>
        </defs>

        {/* Subtle Bench Shadow under Trumpet */}
        <ellipse cx="470" cy="264" rx="340" ry="12" fill="rgba(0,0,0,0.45)" />

        {/* Acoustic Sound Waves radiating from the Bell when blowing */}
        <g
          style={{
            opacity: bellWaveOpacity,
            transition: 'opacity 140ms ease-out',
          }}
        >
          <path
            d="M 835 104 Q 862 142 835 180"
            fill="none"
            stroke="#F5C45E"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 855 86 Q 890 142 855 198"
            fill="none"
            stroke="#F5C45E"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.25 + (airPressure / 100) * 0.55}
          />
          <path
            d="M 876 68 Q 918 142 876 216"
            fill="none"
            stroke="#F5C45E"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={airPressure > 45 ? (airPressure - 45) / 70 : 0}
          />
        </g>

        {/* Airflow Breath Stream into Mouthpiece */}
        {isBlowing && (
          <g opacity={0.45 + (airPressure / 100) * 0.5}>
            <line
              x1="12"
              y1="115"
              x2="46"
              y2="115"
              stroke="#F7D070"
              strokeWidth={1.5 + (airPressure / 100) * 2.5}
              strokeLinecap="round"
              strokeDasharray="6 5"
            />
            <line
              x1="18"
              y1="108"
              x2="44"
              y2="112"
              stroke="#F7D070"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.7"
            />
            <line
              x1="18"
              y1="122"
              x2="44"
              y2="118"
              stroke="#F7D070"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
        )}

        {/* MAIN TUNING SLIDE (Left U-loop, shifts subtly with tuning Hz) */}
        <g
          style={{
            transform: `translateX(${tuningOffsetPx}px)`,
            transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Upper & Lower tuning slide tubes */}
          <path
            d="M 218 115 L 154 115 A 22 22 0 0 0 154 159 L 270 159"
            fill="none"
            stroke="url(#brassTubeH)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Water Key (Amado / Lever) on bottom of tuning slide */}
          <rect x="148" y="164" width="22" height="4" rx="2" fill="url(#silverPlate)" />
          <circle cx="152" cy="167" r="2.5" fill="#D4A24C" />
        </g>

        {/* LEADPIPE & MOUTHPIECE (Silver Mouthpiece -> Brass Receiver -> Leadpipe) */}
        {/* Leadpipe */}
        <path
          d="M 96 115 L 348 115"
          fill="none"
          stroke={isBlowing ? 'url(#activeLoopGlow)' : 'url(#brassTubeH)'}
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Mouthpiece Receiver */}
        <rect x="86" y="107" width="22" height="16" rx="2" fill="url(#brassTubeH)" stroke="#5E400E" strokeWidth="0.8" />
        {/* Silver Mouthpiece */}
        <path
          d="M 48 103 L 58 103 L 64 110 L 86 111 L 86 119 L 64 120 L 58 127 L 48 127 C 44 127 44 103 48 103 Z"
          fill="url(#silverPlate)"
          stroke="#475569"
          strokeWidth="0.9"
        />

        {/* VALVE 3 SLIDE LOOP (Longest loop, extends left/lower, highlights when Valve 3 pressed) */}
        <g>
          <path
            d="M 426 170 L 318 170 A 16 16 0 0 0 318 202 L 426 202"
            fill="none"
            stroke={valves[2] ? 'url(#activeLoopGlow)' : 'url(#brassTubeH)'}
            strokeWidth="10.5"
            strokeLinecap="round"
          />
          {/* 3rd Valve Slide Finger Ring */}
          <circle
            cx="326"
            cy="218"
            r="14"
            fill="none"
            stroke="url(#brassTubeH)"
            strokeWidth="4.5"
          />
          <rect x="323" y="200" width="6" height="6" fill="url(#brassTubeV)" />
        </g>

        {/* VALVE 1 SLIDE LOOP (Medium loop, extends left/upper-mid, highlights when Valve 1 pressed) */}
        <g>
          <path
            d="M 358 145 L 284 145 A 13 13 0 0 1 284 171 L 358 171"
            fill="none"
            stroke={valves[0] ? 'url(#activeLoopGlow)' : 'url(#brassTubeH)'}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* 1st Valve Thumb Saddle */}
          <path
            d="M 304 142 C 296 125 316 120 322 136"
            fill="none"
            stroke="url(#brassTubeH)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* VALVE 2 SLIDE LOOP (Short compact loop on right/back of 2nd casing) */}
        <g>
          <path
            d="M 402 152 L 434 152 A 9 9 0 0 1 434 170 L 402 170"
            fill="none"
            stroke={valves[1] ? 'url(#activeLoopGlow)' : 'url(#brassTubeH)'}
            strokeWidth="9.5"
            strokeLinecap="round"
          />
        </g>

        {/* LOWER RETURN BOW & BELL STEM (Valve 3 -> Bell Bow -> Bell Flare) */}
        <path
          d="M 270 159 L 520 159 C 560 159 585 142 615 142 L 680 142"
          fill="none"
          stroke={isBlowing ? 'url(#activeLoopGlow)' : 'url(#brassTubeH)'}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Structural Braces between Leadpipe and Bell Stem */}
        <rect x="242" y="118" width="6" height="40" rx="2" fill="url(#brassTubeV)" />
        <rect x="498" y="142" width="6" height="17" rx="2" fill="url(#brassTubeV)" />
        <rect x="556" y="132" width="6" height="22" rx="2" fill="url(#brassTubeV)" />

        {/* BELL FLARE */}
        <path
          d="M 520 142 L 660 138 C 725 136 775 112 818 68 L 826 68 L 826 216 L 818 216 C 775 172 725 148 660 146 L 520 142 Z"
          fill="url(#brassBell)"
          stroke="#6A4710"
          strokeWidth="1"
        />
        {/* Bell Rim & Interior */}
        <ellipse cx="826" cy="142" rx="11" ry="74" fill="url(#bellInterior)" stroke="#F9DF96" strokeWidth="2.5" />

        {/* MUTE SILHOUETTES INSIDE THE BELL */}
        {mute === 'straight' && (
          <g>
            <path
              d="M 762 128 L 844 102 L 854 142 L 844 182 L 762 156 Z"
              fill="#CBD5E1"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <ellipse cx="850" cy="142" rx="7" ry="38" fill="#94A3B8" stroke="#334155" strokeWidth="1" />
            <text x="808" y="146" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="700">
              STR
            </text>
          </g>
        )}
        {mute === 'cup' && (
          <g>
            <path
              d="M 770 124 L 832 108 L 832 176 L 770 160 Z"
              fill="#991B1B"
              stroke="#450A0A"
              strokeWidth="1.2"
            />
            <path
              d="M 822 92 C 858 92 862 192 822 192 L 834 174 L 834 110 Z"
              fill="#B91C1C"
              stroke="#F87171"
              strokeWidth="1"
            />
          </g>
        )}
        {mute === 'harmon' && (
          <g>
            <path
              d="M 766 128 C 788 110 822 104 846 116 L 846 168 C 822 180 788 174 766 156 Z"
              fill="#D1D5DB"
              stroke="#4B5563"
              strokeWidth="1.2"
            />
            {/* Harmon stem protruding out */}
            <rect x="844" y="134" width="24" height="16" rx="2" fill="#9CA3AF" stroke="#374151" strokeWidth="1" />
            <ellipse cx="868" cy="142" rx="5" ry="14" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1" />
          </g>
        )}

        {/* PINKY HOOK (Right of 3rd Valve on Leadpipe/Bell Pipe) */}
        <path
          d="M 476 115 C 476 92 504 92 504 112"
          fill="none"
          stroke="url(#brassTubeH)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* THREE VALVE CASINGS & INTERACTIVE PISTONS */}
        {[
          { idx: 0 as const, x: 348, label: '1' },
          { idx: 1 as const, x: 388, label: '2' },
          { idx: 2 as const, x: 428, label: '3' },
        ].map(({ idx, x, label }) => {
          const isPressed = valves[idx];
          const pistonTravel = isPressed ? 16 : 0;

          return (
            <g
              key={label}
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                onValvePointerDown(idx);
              }}
              onPointerUp={() => onValvePointerUp(idx)}
              onPointerCancel={() => onValvePointerUp(idx)}
              role="button"
              tabIndex={-1}
              aria-label={`Valve ${label}`}
              aria-pressed={isPressed}
            >
              {/* Invisible generous hit target */}
              <rect x={x - 16} y={48} width={44} height={175} fill="transparent" />

              {/* Moving Piston Stem + Pearl Finger Button */}
              <g
                style={{
                  transform: `translateY(${pistonTravel}px)`,
                  transition: 'transform 90ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Piston Stem */}
                <rect
                  x={x + 8}
                  y={76}
                  width="8"
                  height="32"
                  fill="url(#silverPlate)"
                  stroke="#475569"
                  strokeWidth="0.7"
                />
                {/* Finger Button Rim */}
                <rect
                  x={x - 2}
                  y={68}
                  width="28"
                  height="9"
                  rx="3"
                  fill="url(#brassTubeH)"
                  stroke="#5B3D0C"
                  strokeWidth="0.8"
                />
                {/* Pearl Inlay */}
                <ellipse
                  cx={x + 12}
                  cy={68}
                  rx="11"
                  ry="4"
                  fill={isPressed ? '#FDE68A' : 'url(#pearlCap)'}
                  stroke={isPressed ? '#D97706' : '#94A3B8'}
                  strokeWidth="1"
                />
              </g>

              {/* Top Valve Cap */}
              <rect
                x={x - 1}
                y={102}
                width="26"
                height="9"
                rx="2"
                fill="url(#brassTubeV)"
                stroke="#5A3C0D"
                strokeWidth="0.8"
              />

              {/* Valve Casing Cylinder */}
              <rect
                x={x}
                y={111}
                width="24"
                height="98"
                rx="2"
                fill="url(#brassTubeV)"
                stroke={isPressed ? '#F5C45E' : '#5A3C0D'}
                strokeWidth={isPressed ? '1.6' : '0.9'}
              />

              {/* Bottom Valve Cap */}
              <rect
                x={x - 1}
                y={209}
                width="26"
                height="9"
                rx="2"
                fill="url(#brassTubeV)"
                stroke="#5A3C0D"
                strokeWidth="0.8"
              />

              {/* Subtle Engraved Valve Number on Casing */}
              <text
                x={x + 12}
                y={165}
                textAnchor="middle"
                fill={isPressed ? '#FFFBEB' : '#3E2806'}
                fontSize="12"
                fontWeight="700"
                fontFamily="IBM Plex Mono, monospace"
                className="pointer-events-none"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
