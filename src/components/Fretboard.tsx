import { useState } from 'react';
import type { ChordPosition, FretboardDisplayMode } from '../types/guitar';
import { getNoteAtFret } from '../data/chordLibrary';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2 } from 'lucide-react';

interface FretboardProps {
  chordName: string;
  position: ChordPosition;
  displayMode: FretboardDisplayMode;
  isLeftHanded: boolean;
  onStrum?: () => void;
}

export const Fretboard = ({
  chordName,
  position,
  displayMode,
  isLeftHanded
}: FretboardProps) => {
  const [activeNote, setActiveNote] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [isStrumming, setIsStrumming] = useState(false);

  const numFrets = 14;
  const fretWidth = 56;
  const stringSpacing = 28;
  const boardHeight = 5 * stringSpacing + 40;
  const nutWidth = 10;
  const boardWidth = numFrets * fretWidth + nutWidth + 50;

  // Dots markers on frets
  const singleDotFrets = [3, 5, 7, 9];
  const doubleDotFret = 12;

  // String thicknesses (string 0: Low E [thick] to string 5: High E [thin])
  const stringGauges = [3.8, 3.2, 2.6, 2.0, 1.5, 1.0];

  const handleStringClick = (stringIdx: number, fret: number) => {
    setActiveNote({ stringIdx, fret });
    guitarAudio.pluckNote(stringIdx, fret, 0.9);
    setTimeout(() => setActiveNote(null), 400);
  };

  const handleStrumClick = async () => {
    setIsStrumming(true);
    await guitarAudio.strumChord(position, 'down', 28);
    setTimeout(() => setIsStrumming(false), 500);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Top Bar: Chord Info & Quick Strum */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xl rounded-xl shadow-lg shadow-amber-500/20 tracking-wide">
            {chordName || 'Serbest Çalım'}
          </div>
          <span className="text-xs text-slate-400">
            {position.baseFret > 1 ? `${position.baseFret}. Perde Pozisyonu` : 'Açık Pozisyon'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStrumClick}
            disabled={isStrumming}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
              isStrumming
                ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/50 scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/25 active:scale-95'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isStrumming ? 'Çalınıyor...' : 'Akoru Tınlat (Strum)'}</span>
          </button>
        </div>
      </div>

      {/* Responsive Fretboard Canvas / SVG */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <svg
          viewBox={`0 0 ${boardWidth} ${boardHeight + 35}`}
          className={`h-48 md:h-56 mx-auto transition-transform ${isLeftHanded ? 'scale-x-[-1]' : ''}`}
          style={{ minWidth: '780px' }}
        >
          <defs>
            {/* Dark Rosewood / Ebony wood gradient */}
            <linearGradient id="rosewood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1814" />
              <stop offset="50%" stopColor="#2b231c" />
              <stop offset="100%" stopColor="#1e1814" />
            </linearGradient>

            {/* Glowing finger dot */}
            <radialGradient id="fingerGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Fretboard Wooden Body */}
          <rect
            x={nutWidth + 30}
            y={20}
            width={numFrets * fretWidth}
            height={5 * stringSpacing}
            fill="url(#rosewood)"
            rx="2"
          />

          {/* Bone Nut (Fret 0 boundary) */}
          <rect
            x={30}
            y={18}
            width={nutWidth}
            height={5 * stringSpacing + 4}
            fill="#e2e8f0"
            rx="2"
            stroke="#94a3b8"
            strokeWidth="1"
          />

          {/* Fret Markers (Pearloid Dots on frets 3, 5, 7, 9) */}
          {singleDotFrets.map((fret) => {
            const cx = 30 + nutWidth + (fret - 0.5) * fretWidth;
            const cy = 20 + 2.5 * stringSpacing;
            return (
              <circle
                key={`dot-${fret}`}
                cx={cx}
                cy={cy}
                r="5"
                fill="#cbd5e1"
                opacity="0.35"
              />
            );
          })}

          {/* Double Dot on Fret 12 */}
          <circle
            cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={20 + 1.5 * stringSpacing}
            r="4.5"
            fill="#cbd5e1"
            opacity="0.35"
          />
          <circle
            cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={20 + 3.5 * stringSpacing}
            r="4.5"
            fill="#cbd5e1"
            opacity="0.35"
          />

          {/* Fret Wire Lines (Perdeler) */}
          {Array.from({ length: numFrets }).map((_, i) => {
            const fretX = 30 + nutWidth + (i + 1) * fretWidth;
            return (
              <g key={`fret-${i}`}>
                <line
                  x1={fretX}
                  y1={20}
                  x2={fretX}
                  y2={20 + 5 * stringSpacing}
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                />
                {/* Fret Numbers below neck */}
                <text
                  x={fretX - fretWidth / 2}
                  y={boardHeight + 22}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="600"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Barre Bar representation if present */}
          {position.barres?.map((barre, bIdx) => {
            const x = 30 + nutWidth + (barre.fret - 0.5) * fretWidth;
            const fromY = 20 + (6 - barre.fromString) * stringSpacing;
            const toY = 20 + (6 - barre.toString) * stringSpacing;
            const topY = Math.min(fromY, toY);
            const height = Math.abs(toY - fromY);

            return (
              <rect
                key={`barre-${bIdx}`}
                x={x - 11}
                y={topY - 11}
                width={22}
                height={height + 22}
                rx="11"
                fill="#f59e0b"
                opacity="0.85"
                filter="url(#glowFilter)"
              />
            );
          })}

          {/* 6 Guitar Strings */}
          {[0, 1, 2, 3, 4, 5].map((strIdx) => {
            const y = 20 + strIdx * stringSpacing;
            const gauge = stringGauges[strIdx];
            const isPlucked = activeNote?.stringIdx === strIdx;

            return (
              <g key={`string-${strIdx}`}>
                {/* Pluckable hit zone for string */}
                <line
                  x1={30}
                  y1={y}
                  x2={30 + nutWidth + numFrets * fretWidth}
                  y2={y}
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  onClick={() => handleStringClick(strIdx, position.frets[strIdx] >= 0 ? position.frets[strIdx] : 0)}
                />

                {/* Visible string with gauge thickness */}
                <line
                  x1={28}
                  y1={y}
                  x2={30 + nutWidth + numFrets * fretWidth}
                  y2={y}
                  stroke={isPlucked ? '#fbbf24' : '#cbd5e1'}
                  strokeWidth={isPlucked ? gauge + 1.5 : gauge}
                  opacity={isPlucked ? 1 : 0.75}
                  className="transition-colors pointer-events-none"
                />

                {/* Open / Mute Indicator at Nut */}
                {(() => {
                  const fret = position.frets[strIdx];
                  if (fret === -1) {
                    return (
                      <text
                        x="15"
                        y={y + 4}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        ✕
                      </text>
                    );
                  }
                  if (fret === 0) {
                    return (
                      <circle
                        cx="15"
                        cy={y}
                        r="5.5"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        className="cursor-pointer"
                        onClick={() => handleStringClick(strIdx, 0)}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Finger placement dots on fretted strings */}
                {(() => {
                  const fret = position.frets[strIdx];
                  if (fret > 0) {
                    const cx = 30 + nutWidth + (fret - 0.5) * fretWidth;
                    const finger = position.fingers[strIdx];
                    const note = getNoteAtFret(strIdx, fret);
                    let label = finger > 0 ? `${finger}` : '';
                    if (displayMode === 'notes') label = note;

                    return (
                      <g
                        key={`finger-${strIdx}`}
                        className="cursor-pointer"
                        onClick={() => handleStringClick(strIdx, fret)}
                      >
                        <circle
                          cx={cx}
                          cy={y}
                          r="11.5"
                          fill="url(#fingerGlow)"
                          stroke="#ffffff"
                          strokeWidth="2"
                          filter="url(#glowFilter)"
                        />
                        <text
                          x={cx}
                          y={y + 4}
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize="11"
                          fontWeight="800"
                          pointerEvents="none"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  }
                  return null;
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Tuning Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <b>O:</b> Boş Tel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold">✕:</span> Çalınmaz
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 text-[9px] text-black font-bold flex items-center justify-center">1</span>
            Parmak No
          </span>
        </div>
        <div className="text-slate-400 font-medium">
          Standart Akort: <span className="text-slate-200">E - A - D - G - B - e</span>
        </div>
      </div>
    </div>
  );
};
