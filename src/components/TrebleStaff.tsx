import React from 'react';

interface TrebleStaffProps {
  writtenMidi: number;
  isBlowing: boolean;
}

// Map pitch class (0..11) to diatonic step within octave (0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B) + sharp flag
const PC_TO_DIATONIC: Array<{ step: number; sharp: boolean }> = [
  { step: 0, sharp: false }, // C
  { step: 0, sharp: true },  // C#
  { step: 1, sharp: false }, // D
  { step: 1, sharp: true },  // D#
  { step: 2, sharp: false }, // E
  { step: 3, sharp: false }, // F
  { step: 3, sharp: true },  // F#
  { step: 4, sharp: false }, // G
  { step: 4, sharp: true },  // G#
  { step: 5, sharp: false }, // A
  { step: 5, sharp: true },  // A#
  { step: 6, sharp: false }, // B
];

export const TrebleStaff: React.FC<TrebleStaffProps> = ({ writtenMidi, isBlowing }) => {
  // Reference: E4 (MIDI 64) is bottom staff line.
  // In diatonic steps from C0: C4 = 4*7 + 0 = 28, E4 = 30.
  const octave = Math.floor(writtenMidi / 12) - 1;
  const pc = ((writtenMidi % 12) + 12) % 12;
  const { step, sharp } = PC_TO_DIATONIC[pc];
  const diatonicIndex = octave * 7 + step;

  // Staff lines are diatonic indices: 30 (E4), 32 (G4), 34 (B4), 36 (D5), 38 (F5)
  // Let's space each diatonic half-step vertically by 5.5px.
  // Place F5 (38) at y = 26, so E4 (30) is at y = 26 + 8 * 5.5 = 70.
  const stepToY = (d: number) => 26 + (38 - d) * 5.5;
  const noteY = stepToY(diatonicIndex);

  const staffLines = [38, 36, 34, 32, 30];

  // Calculate required ledger lines below E4 (30) or above F5 (38)
  const ledgerLines: number[] = [];
  if (diatonicIndex <= 28) {
    for (let d = 28; d >= diatonicIndex; d -= 2) {
      ledgerLines.push(d);
    }
  }
  if (diatonicIndex >= 40) {
    for (let d = 40; d <= diatonicIndex; d += 2) {
      ledgerLines.push(d);
    }
  }

  const noteColor = isBlowing ? '#F5C45E' : '#94A3B8';

  return (
    <svg
      viewBox="0 0 156 106"
      className="w-full h-[84px]"
      role="img"
      aria-label="Treble clef musical staff showing active written note"
    >
      {/* 5 Staff Lines */}
      {staffLines.map((d) => {
        const y = stepToY(d);
        return (
          <line
            key={d}
            x1="10"
            y1={y}
            x2="146"
            y2={y}
            stroke="#2E3545"
            strokeWidth="1.1"
          />
        );
      })}

      {/* Stylized Treble Clef Mark */}
      <text
        x="16"
        y="69"
        fill="#64748B"
        fontSize="50"
        fontFamily="serif"
        className="select-none"
      >
        𝄞
      </text>

      {/* Ledger Lines */}
      {ledgerLines.map((d) => {
        const y = stepToY(d);
        return (
          <line
            key={`ledger-${d}`}
            x1="84"
            y1={y}
            x2="118"
            y2={y}
            stroke="#525D73"
            strokeWidth="1.2"
          />
        );
      })}

      {/* Sharp Accidental if needed */}
      {sharp && (
        <text
          x="74"
          y={noteY + 5}
          fill={noteColor}
          fontSize="16"
          fontWeight="600"
          fontFamily="IBM Plex Mono, monospace"
        >
          ♯
        </text>
      )}

      {/* Notehead */}
      <ellipse
        cx="101"
        cy={noteY}
        rx="7.5"
        ry="5.2"
        transform={`rotate(-18 101 ${noteY})`}
        fill={noteColor}
        style={{ transition: 'all 110ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      {/* Stem (down if B4 or above, up otherwise) */}
      {diatonicIndex >= 34 ? (
        <line
          x1="94.5"
          y1={noteY + 1}
          x2="94.5"
          y2={noteY + 30}
          stroke={noteColor}
          strokeWidth="1.6"
        />
      ) : (
        <line
          x1="107.5"
          y1={noteY - 1}
          x2="107.5"
          y2={noteY - 30}
          stroke={noteColor}
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
};
