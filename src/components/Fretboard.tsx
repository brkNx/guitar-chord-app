import { useState } from 'react';
import type { ChordPosition, FretboardDisplayMode } from '../types/guitar';
import { getNoteAtFret } from '../data/chordLibrary';
import { getChordTheoryDetails } from '../utils/chordTheory';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface FretboardProps {
  chordName: string;
  position: ChordPosition;
  displayMode: FretboardDisplayMode;
  isLeftHanded: boolean;
  onOpenChordDetail?: (chordName: string) => void;
  positionIdx?: number;
  totalPositions?: number;
  onPositionChange?: (idx: number) => void;
  onDisplayModeChange?: (mode: FretboardDisplayMode) => void;
  onStringPluck?: (stringIdx: number, fret: number) => void;
  onStrum?: (direction: 'down' | 'up') => void;
}

// Oolimo Color Coding for Chord Degrees
export function getOolimoStyle(degree: string, isRoot: boolean): { fill: string; text: string; stroke: string } {
  if (isRoot || degree === '1' || degree === 'R') {
    // Root: Deep Amber / Orange (#F59E0B)
    return { fill: '#f59e0b', text: '#090a0f', stroke: '#fbbf24' };
  }
  if (degree === '3' || degree === 'b3' || degree === '2' || degree === '4') {
    // 3rds & Mediant: Blue (#3B82F6)
    return { fill: '#3b82f6', text: '#ffffff', stroke: '#60a5fa' };
  }
  if (degree === '5' || degree === 'b5' || degree === '#5') {
    // 5ths: Dark Anthracite / Slate (#374151)
    return { fill: '#374151', text: '#f3f4f6', stroke: '#6b7280' };
  }
  // 7ths and Extensions (7, b7, 9, 11, 13): Emerald Green (#10B981)
  return { fill: '#10b981', text: '#ffffff', stroke: '#34d399' };
}

export const Fretboard = ({
  chordName,
  position,
  displayMode,
  isLeftHanded,
  onOpenChordDetail,
  positionIdx = 0,
  totalPositions = 1,
  onPositionChange,
  onDisplayModeChange,
  onStringPluck,
  onStrum
}: FretboardProps) => {
  const [activeNote, setActiveNote] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [vibratingStrings, setVibratingStrings] = useState<Set<number>>(new Set());
  const [isStrumming, setIsStrumming] = useState(false);

  // Analyze chord degrees & intervals
  const theory = getChordTheoryDetails(chordName, position);

  const numFrets = 14;
  const fretWidth = 54;
  const stringSpacing = 26;
  const boardHeight = 5 * stringSpacing + 36;
  const nutWidth = 10;
  const boardWidth = numFrets * fretWidth + nutWidth + 48;

  // Dots markers on frets
  const singleDotFrets = [3, 5, 7, 9];
  const doubleDotFret = 12;

  // String gauges from 6th (thick Low E) to 1st (thin High E)
  const stringGauges = [3.4, 2.8, 2.2, 1.7, 1.2, 0.85];

  const triggerStringVibration = (stringIdx: number, durationMs = 500) => {
    setVibratingStrings((prev) => {
      const next = new Set(prev);
      next.add(stringIdx);
      return next;
    });
    setTimeout(() => {
      setVibratingStrings((prev) => {
        const next = new Set(prev);
        next.delete(stringIdx);
        return next;
      });
    }, durationMs);
  };

  const handleStringClick = (stringIdx: number, fret: number) => {
    setActiveNote({ stringIdx, fret });
    triggerStringVibration(stringIdx, 450);
    guitarAudio.pluckNote(stringIdx, fret, 0.9);
    onStringPluck?.(stringIdx, fret);
    setTimeout(() => setActiveNote(null), 400);
  };

  const handleStrumClick = async () => {
    if (isStrumming) return;
    setIsStrumming(true);
    onStrum?.('down');
    await guitarAudio.strumChord(position, 'down', 24, false, (strIdx: number) => {
      triggerStringVibration(strIdx, 450);
    });
    setTimeout(() => setIsStrumming(false), 500);
  };

  return (
    <div className="w-full bg-[#11141c] border border-[#1e222d] rounded-lg p-3 text-slate-200 select-none shadow-md">
      {/* Oolimo Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#1e222d] text-xs">
        {/* Left: Chord Info & Position Stepper */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181c26] hover:bg-[#202534] border border-[#1e222d] rounded font-mono font-bold text-amber-400 text-sm transition-colors cursor-pointer"
            title="Akor detayını incele"
          >
            <span>{chordName}</span>
            <Info className="w-3 h-3 text-slate-400" />
          </button>

          <span className="font-mono text-[11px] text-slate-400">
            {theory.typeCategory} • {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık'}
          </span>

          {/* Oolimo Position Stepper < Pozisyon 1 / 4 > */}
          {totalPositions > 1 && onPositionChange && (
            <div className="flex items-center gap-1 bg-[#0b0d12] border border-[#1e222d] rounded px-1.5 py-0.5 font-mono text-[11px]">
              <button
                onClick={() => onPositionChange((positionIdx - 1 + totalPositions) % totalPositions)}
                className="text-slate-400 hover:text-amber-400 px-0.5 transition-colors cursor-pointer"
                title="Önceki Pozisyon"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-slate-300 font-semibold px-1">
                Pozisyon {positionIdx + 1}/{totalPositions}
              </span>
              <button
                onClick={() => onPositionChange((positionIdx + 1) % totalPositions)}
                className="text-slate-400 hover:text-amber-400 px-0.5 transition-colors cursor-pointer"
                title="Sonraki Pozisyon"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Display Mode Toggle (Fingers / Notes / Degrees) & Strum Button */}
        <div className="flex items-center gap-2">
          {onDisplayModeChange && (
            <div className="flex items-center bg-[#0b0d12] border border-[#1e222d] rounded p-0.5 font-mono text-[10px]">
              {(['degrees', 'notes', 'fingers'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onDisplayModeChange(mode)}
                  className={`px-2 py-0.5 rounded transition-colors uppercase cursor-pointer ${
                    displayMode === mode
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'degrees' ? 'Derece' : mode === 'notes' ? 'Nota' : 'Parmak'}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleStrumClick}
            disabled={isStrumming}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
          >
            <Volume2 className="w-3.5 h-3.5 fill-current" />
            <span>{isStrumming ? 'ÇALINIYOR...' : 'TINLAT'}</span>
          </button>
        </div>
      </div>

      {/* SVG Fretboard with Horizontal Scroll */}
      <div className="w-full overflow-x-auto scrollbar-thin pb-1">
        <svg
          viewBox={`0 0 ${boardWidth} ${boardHeight + 24}`}
          className="w-full min-w-[760px] h-auto block select-none"
          style={{ transform: isLeftHanded ? 'scaleX(-1)' : 'none' }}
        >
          {/* Fretboard Wood Background */}
          <rect
            x={30 + nutWidth}
            y={18}
            width={numFrets * fretWidth}
            height={5 * stringSpacing}
            fill="#181410"
            stroke="#261e16"
            strokeWidth="1"
          />

          {/* Bone Nut at Fret 0 */}
          <rect
            x={30}
            y={17}
            width={nutWidth}
            height={5 * stringSpacing + 2}
            fill="#e2e8f0"
            rx="2"
          />

          {/* Pearloid Inlay Dots on Frets 3, 5, 7, 9 */}
          {singleDotFrets.map((fret) => {
            const cx = 30 + nutWidth + (fret - 0.5) * fretWidth;
            const cy = 18 + 2.5 * stringSpacing;
            return (
              <circle
                key={`dot-${fret}`}
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#64748b"
                opacity="0.4"
              />
            );
          })}

          {/* Double Dots on Fret 12 (Octave) */}
          <circle
            cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={18 + 1.5 * stringSpacing}
            r="4"
            fill="#64748b"
            opacity="0.4"
          />
          <circle
            cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={18 + 3.5 * stringSpacing}
            r="4"
            fill="#64748b"
            opacity="0.4"
          />

          {/* Nickel Frets & Fret Numbers */}
          {Array.from({ length: numFrets }).map((_, i) => {
            const fretX = 30 + nutWidth + (i + 1) * fretWidth;
            return (
              <g key={`fret-${i}`}>
                <line
                  x1={fretX}
                  y1={18}
                  x2={fretX}
                  y2={18 + 5 * stringSpacing}
                  stroke="#475569"
                  strokeWidth="1.8"
                />
                <text
                  x={fretX - fretWidth / 2}
                  y={boardHeight + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Barre Bar representation if chord has a barre */}
          {position.barres?.map((barre, bIdx) => {
            const x = 30 + nutWidth + (barre.fret - 0.5) * fretWidth;
            const fromY = 18 + (6 - barre.fromString) * stringSpacing;
            const toY = 18 + (6 - barre.toString) * stringSpacing;
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
                opacity="0.75"
                stroke="#fbbf24"
                strokeWidth="1"
              />
            );
          })}

          {/* 6 Guitar Strings */}
          {[0, 1, 2, 3, 4, 5].map((strIdx) => {
            const y = 18 + strIdx * stringSpacing;
            const gauge = stringGauges[strIdx];
            const isVibrating = vibratingStrings.has(strIdx);
            const boardLen = numFrets * fretWidth;

            return (
              <g key={`string-${strIdx}`}>
                {/* Visible Guitar String */}
                <line
                  x1={28}
                  y1={y}
                  x2={30 + nutWidth + boardLen}
                  y2={y}
                  stroke={isVibrating ? '#fef08a' : '#94a3b8'}
                  strokeWidth={gauge}
                  opacity={isVibrating ? 1 : 0.8}
                />

                {/* Per-fret clickable hit cells (frets 1..numFrets) */}
                {Array.from({ length: numFrets }).map((_, fIdx) => {
                  const fNum = fIdx + 1;
                  const cellX = 30 + nutWidth + fIdx * fretWidth;
                  const cx = cellX + fretWidth / 2;
                  const isHovered = hoverCell?.stringIdx === strIdx && hoverCell?.fret === fNum;
                  const isPluckedCell = activeNote?.stringIdx === strIdx && activeNote?.fret === fNum;
                  const isChordFret = position.frets[strIdx] === fNum;
                  const cellNote = getNoteAtFret(strIdx, fNum);

                  return (
                    <g
                      key={`cell-${strIdx}-${fNum}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverCell({ stringIdx: strIdx, fret: fNum })}
                      onMouseLeave={() => setHoverCell(null)}
                      onClick={() => handleStringClick(strIdx, fNum)}
                    >
                      <rect
                        x={cellX}
                        y={y - stringSpacing / 2}
                        width={fretWidth}
                        height={stringSpacing}
                        fill="transparent"
                      />
                      {!isChordFret && (isHovered || isPluckedCell) && (
                        <>
                          <circle
                            cx={cx}
                            cy={y}
                            r={isPluckedCell ? '11' : '8.5'}
                            fill={isPluckedCell ? '#38bdf8' : '#181c26'}
                            stroke="#38bdf8"
                            strokeWidth={isPluckedCell ? '2.5' : '1.2'}
                            opacity={isPluckedCell ? 0.95 : 0.75}
                          />
                          <text
                            x={cx}
                            y={y + 3}
                            textAnchor="middle"
                            fill={isPluckedCell ? '#090a0f' : '#e2e8f0'}
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {cellNote}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Open (O) / Mute (X) Indicator at Nut */}
                {(() => {
                  const fret = position.frets[strIdx];
                  if (fret === -1) {
                    return (
                      <text
                        x="16"
                        y={y + 4}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="cursor-pointer"
                        onClick={() => handleStringClick(strIdx, 0)}
                      >
                        X
                      </text>
                    );
                  }
                  if (fret === 0) {
                    const strAnalysis = theory.stringsAnalysis[strIdx];
                    const isRoot = strAnalysis ? strAnalysis.degree === '1' : false;
                    const oolimo = getOolimoStyle(strAnalysis?.degree || '1', isRoot);

                    return (
                      <g
                        className="cursor-pointer"
                        onClick={() => handleStringClick(strIdx, 0)}
                      >
                        <circle
                          cx="16"
                          cy={y}
                          r="5.5"
                          fill="#11141c"
                          stroke={oolimo.fill}
                          strokeWidth="2"
                        />
                        <circle cx="16" cy={y} r="2" fill={oolimo.fill} />
                      </g>
                    );
                  }
                  return null;
                })()}

                {/* Fretted Finger Dots on Fretboard */}
                {(() => {
                  const fret = position.frets[strIdx];
                  if (fret > 0) {
                    const cx = 30 + nutWidth + (fret - 0.5) * fretWidth;
                    const finger = position.fingers[strIdx];
                    const note = getNoteAtFret(strIdx, fret);
                    const strAnalysis = theory.stringsAnalysis[strIdx];
                    const degree = strAnalysis ? strAnalysis.degree : '1';
                    const isRoot = degree === '1' || degree === 'R';
                    const oolimo = getOolimoStyle(degree, isRoot);

                    let label = `${finger > 0 ? finger : ''}`;
                    if (displayMode === 'notes') label = note;
                    else if (displayMode === 'degrees') label = degree;
                    const isPlucked = activeNote?.stringIdx === strIdx && activeNote?.fret === fret;

                    return (
                      <g
                        key={`finger-${strIdx}`}
                        className="cursor-pointer"
                        onClick={() => handleStringClick(strIdx, fret)}
                      >
                        {/* Oolimo Geometric Fret Dot */}
                        <circle
                          cx={cx}
                          cy={y}
                          r={isPlucked ? '12' : '10.5'}
                          fill={oolimo.fill}
                          stroke={oolimo.stroke}
                          strokeWidth={isPlucked ? '3' : '1.5'}
                        />
                        <text
                          x={cx}
                          y={y + 3.5}
                          textAnchor="middle"
                          fill={oolimo.text}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
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

      {/* Oolimo Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1.5 border-t border-[#1e222d] px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-[#fbbf24] inline-block" />
            <span className="text-slate-300">Kök (1)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-[#60a5fa] inline-block" />
            <span className="text-slate-300">3'lü (3 / b3)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#374151] border border-[#6b7280] inline-block" />
            <span className="text-slate-300">5'li (5)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-[#34d399] inline-block" />
            <span className="text-slate-300">7'li / Uzantı</span>
          </span>
        </div>

        <span className="text-slate-500">
          Standart: E-A-D-G-B-e • Tıklayarak tınlat
        </span>
      </div>
    </div>
  );
};
