import { useEffect, useState, useMemo } from 'react';
import type { ChordPosition, FretboardDisplayMode, FretboardViewMode } from '../types/guitar';
import { getNoteAtFret } from '../data/chordLibrary';
import { getChordTheoryDetails, getOolimoStyle } from '../utils/chordTheory';
import { GUITAR_SCALES, getScaleNoteInfo, extractRootNote } from '../data/scales';
import { CAGED_BOXES, getCagedBoxFretRange, getFretShapesIntervalStyle } from '../data/caged';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, ChevronLeft, ChevronRight, Info, Play, Sparkles } from 'lucide-react';

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
  // fretShapes Scale Visualizer & CAGED System Props
  viewMode?: FretboardViewMode;
  onViewModeChange?: (mode: FretboardViewMode) => void;
  activeScaleId?: string;
  scaleRoot?: string;
  cagedBox?: number; // 0 = all, 1..5 = box 1..5
  onCagedBoxChange?: (box: number) => void;
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
  onStrum,
  viewMode: propViewMode,
  onViewModeChange,
  activeScaleId = 'minor_pentatonic',
  scaleRoot: propScaleRoot,
  cagedBox: propCagedBox = 0,
  onCagedBoxChange
}: FretboardProps) => {
  const [internalViewMode, setInternalViewMode] = useState<FretboardViewMode>('chord');
  const [internalCagedBox, setInternalCagedBox] = useState<number>(0);
  const [isPlayingScaleSeq, setIsPlayingScaleSeq] = useState(false);

  const viewMode = propViewMode !== undefined ? propViewMode : internalViewMode;
  const cagedBox = propCagedBox !== undefined ? propCagedBox : internalCagedBox;

  const setViewMode = (mode: FretboardViewMode) => {
    if (onViewModeChange) onViewModeChange(mode);
    else setInternalViewMode(mode);
  };

  const setCagedBox = (box: number) => {
    if (onCagedBoxChange) onCagedBoxChange(box);
    else setInternalCagedBox(box);
  };

  const scaleRoot = propScaleRoot || extractRootNote(chordName) || 'A';
  const currentScale = useMemo(
    () => GUITAR_SCALES.find((s) => s.id === activeScaleId) || GUITAR_SCALES[0],
    [activeScaleId]
  );

  const [activeNote, setActiveNote] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [vibratingStrings, setVibratingStrings] = useState<Set<number>>(new Set());
  const [isStrumming, setIsStrumming] = useState(false);
  const [chordPulse, setChordPulse] = useState(false);
  const [orientation, setOrientation] = useState<'player' | 'tab'>('player');

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

  // Active CAGED Box fret boundaries
  const boxRange = useMemo(() => {
    return getCagedBoxFretRange(scaleRoot, cagedBox);
  }, [scaleRoot, cagedBox]);

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

  // Animate finger press & string vibration whenever chord or voicing changes
  useEffect(() => {
    if (viewMode === 'chord') {
      setChordPulse(true);
      const timers: number[] = [];
      position.frets.forEach((f, idx) => {
        if (f >= 0) {
          const t = window.setTimeout(() => {
            triggerStringVibration(idx, 420);
          }, idx * 20);
          timers.push(t);
        }
      });
      const pulseTimer = window.setTimeout(() => setChordPulse(false), 450);
      timers.push(pulseTimer);
      return () => {
        timers.forEach((t) => window.clearTimeout(t));
      };
    }
  }, [chordName, position, viewMode]);

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

  // Play scale arpeggio sequence through active CAGED box or scale
  const handlePlayScaleSequence = async () => {
    if (isPlayingScaleSeq) return;
    setIsPlayingScaleSeq(true);

    const minF = cagedBox === 0 ? 0 : boxRange.minFret;
    const maxF = cagedBox === 0 ? 12 : boxRange.maxFret;

    // Collect scale notes from 6th (low) to 1st (high) string
    const sequence: Array<{ strIdx: number; fret: number }> = [];

    for (let str = 0; str <= 5; str++) {
      for (let f = minF; f <= maxF; f++) {
        const note = getNoteAtFret(str, f);
        const info = getScaleNoteInfo(note, scaleRoot, currentScale);
        if (info.inScale) {
          sequence.push({ strIdx: str, fret: f });
        }
      }
    }

    for (const step of sequence) {
      handleStringClick(step.strIdx, step.fret);
      await new Promise((r) => setTimeout(r, 140));
    }

    setIsPlayingScaleSeq(false);
  };

  return (
    <div className="w-full bg-[#11131a] border border-white/10 rounded-xl p-3 text-slate-200 select-none shadow-xl">
      {/* FretMap & fretShapes Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2.5 border-b border-white/10 text-xs">
        {/* Left: View Mode Toggle (Akor vs Gam) & Position / Scale Info */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main View Mode Selector */}
          <div className="flex items-center bg-[#090a0f] border border-white/10 rounded-lg p-0.5 font-mono text-[11px]">
            <button
              onClick={() => setViewMode('chord')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                viewMode === 'chord'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AKOR MODU
            </button>
            <button
              onClick={() => setViewMode('scale')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'scale'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>FRETSHAPES GAM & CAGED</span>
            </button>
          </div>

          {viewMode === 'chord' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#191c26] hover:bg-[#222634] border border-white/10 rounded-md font-mono font-bold text-amber-400 text-sm transition-all cursor-pointer shadow-sm"
                title="Akor teorisini incele"
              >
                <span>{chordName}</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <span className="font-mono text-[11px] text-slate-400">
                {theory.typeCategory} • {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık'}
              </span>

              {/* Position Stepper < Pozisyon 1 / 4 > */}
              {totalPositions > 1 && onPositionChange && (
                <div className="flex items-center gap-1 bg-[#090a0f] border border-white/10 rounded-md px-1.5 py-0.5 font-mono text-[11px]">
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
          ) : (
            /* fretShapes Scale Info Pill */
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-[#191c26] border border-sky-500/40 rounded-md font-mono text-xs flex items-center gap-1.5">
                <span className="font-black text-amber-400">{scaleRoot}</span>
                <span className="text-sky-300 font-bold">{currentScale.name}</span>
                <span className="text-[10px] text-slate-400">({boxRange.label})</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: CAGED Box Selector (when in scale mode) or Strum Button (when in chord mode) */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'scale' && (
            /* CAGED 5-Box Selector Pills */
            <div className="flex items-center bg-[#090a0f] border border-white/10 rounded-md p-0.5 font-mono text-[10px]">
              {CAGED_BOXES.map((box) => (
                <button
                  key={box.id}
                  onClick={() => setCagedBox(box.number)}
                  className={`px-2 py-0.5 rounded transition-all uppercase cursor-pointer ${
                    cagedBox === box.number
                      ? 'bg-sky-400 text-slate-950 font-bold border border-sky-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${box.name}: ${box.description}`}
                >
                  {box.number === 0 ? 'TÜM SAP' : `KUTU ${box.number}`}
                </button>
              ))}
            </div>
          )}

          {/* Display Mode Toggle (Fingers / Notes / Degrees) */}
          {onDisplayModeChange && (
            <div className="flex items-center bg-[#090a0f] border border-white/10 rounded-md p-0.5 font-mono text-[10px]">
              {(['degrees', 'notes', 'fingers'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onDisplayModeChange(mode)}
                  className={`px-2 py-0.5 rounded transition-all uppercase cursor-pointer ${
                    displayMode === mode
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'degrees' ? 'Derece' : mode === 'notes' ? 'Nota' : 'Parmak'}
                </button>
              ))}
            </div>
          )}

          {/* Perspective View Toggle */}
          <button
            onClick={() => setOrientation(orientation === 'player' ? 'tab' : 'player')}
            className="hidden sm:block px-2.5 py-1 bg-[#090a0f] hover:bg-[#191c26] border border-white/10 hover:border-amber-500/40 rounded-md font-mono text-[10px] text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            title="Klavye Yönü: Oyuncu Bakışı (Kalın E üstte) veya Tab (İnce e üstte)"
          >
            {orientation === 'player' ? 'Oyuncu (6. Tel Üstte)' : 'Tab (1. Tel Üstte)'}
          </button>

          {/* Action Button: Strum (Chord) or Play Scale (Scale) */}
          {viewMode === 'chord' ? (
            <button
              onClick={handleStrumClick}
              disabled={isStrumming}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-md transition-all cursor-pointer shadow-md shadow-amber-500/25 active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 fill-current" />
              <span>{isStrumming ? 'ÇALINIYOR...' : 'TINLAT'}</span>
            </button>
          ) : (
            <button
              onClick={handlePlayScaleSequence}
              disabled={isPlayingScaleSeq}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-400 to-indigo-400 hover:brightness-110 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-md transition-all cursor-pointer shadow-md shadow-sky-500/25 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlayingScaleSeq ? 'GAM ÇALINIYOR...' : 'GAMI ÇAL'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Fretboard with Smooth Horizontal Scroll */}
      <div className="w-full overflow-x-auto scrollbar-thin pb-1">
        <svg
          viewBox={`0 0 ${boardWidth} ${boardHeight + 24}`}
          className="w-full min-w-[760px] h-auto block select-none"
          style={{ transform: isLeftHanded ? 'scaleX(-1)' : 'none' }}
        >
          {/* Fretboard Flat Technical Wood Background */}
          <rect
            x={36 + nutWidth}
            y={18}
            width={numFrets * fretWidth}
            height={5 * stringSpacing}
            fill="#12151e"
            stroke="#1e2433"
            strokeWidth="1"
          />

          {/* fretShapes CAGED Box Boundary Heatmap Overlay */}
          {viewMode === 'scale' && cagedBox > 0 && (
            <g>
              <rect
                x={36 + nutWidth + (boxRange.minFret - 0.95) * fretWidth}
                y={15}
                width={(boxRange.maxFret - boxRange.minFret + 0.9) * fretWidth}
                height={5 * stringSpacing + 6}
                fill="#38bdf8"
                fillOpacity="0.08"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                rx="6"
              />
              <text
                x={36 + nutWidth + ((boxRange.minFret + boxRange.maxFret) / 2 - 0.5) * fretWidth}
                y={12}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="black"
                letterSpacing="1"
              >
                KUTU {cagedBox} // {boxRange.label}
              </text>
            </g>
          )}

          {/* Bone Nut at Fret 0 */}
          <rect
            x={36}
            y={17}
            width={nutWidth}
            height={5 * stringSpacing + 2}
            fill="#f1f5f9"
            rx="2"
          />

          {/* Pearloid Inlay Dots on Frets 3, 5, 7, 9 */}
          {singleDotFrets.map((fret) => {
            const cx = 36 + nutWidth + (fret - 0.5) * fretWidth;
            const cy = 18 + 2.5 * stringSpacing;
            return (
              <circle
                key={`dot-${fret}`}
                cx={cx}
                cy={cy}
                r="4.5"
                fill="#64748b"
                opacity="0.35"
              />
            );
          })}

          {/* Double Dots on Fret 12 (Octave) */}
          <circle
            cx={36 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={18 + 1.5 * stringSpacing}
            r="4"
            fill="#64748b"
            opacity="0.35"
          />
          <circle
            cx={36 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
            cy={18 + 3.5 * stringSpacing}
            r="4"
            fill="#64748b"
            opacity="0.35"
          />

          {/* Nickel Frets & Fret Numbers */}
          {Array.from({ length: numFrets }).map((_, i) => {
            const fretX = 36 + nutWidth + (i + 1) * fretWidth;
            return (
              <g key={`fret-${i}`}>
                <line
                  x1={fretX}
                  y1={18}
                  x2={fretX}
                  y2={18 + 5 * stringSpacing}
                  stroke="#334155"
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

          {/* Barre Bar representation if chord has a barre (in chord mode) */}
          {viewMode === 'chord' &&
            position.barres?.map((barre, bIdx) => {
              const x = 36 + nutWidth + (barre.fret - 0.5) * fretWidth;
              const fromRow = orientation === 'player' ? 6 - barre.fromString : barre.fromString - 1;
              const toRow = orientation === 'player' ? 6 - barre.toString : barre.toString - 1;
              const fromY = 18 + fromRow * stringSpacing;
              const toY = 18 + toRow * stringSpacing;
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

          {/* 6 Guitar Strings: strIdx 0=Low E .. 5=High e */}
          {[0, 1, 2, 3, 4, 5].map((strIdx) => {
            const row = orientation === 'player' ? strIdx : 5 - strIdx;
            const y = 18 + row * stringSpacing;
            const gauge = stringGauges[strIdx];
            const isVibrating = vibratingStrings.has(strIdx);
            const boardLen = numFrets * fretWidth;
            const stringNumber = 6 - strIdx;
            const noteName = ['E', 'A', 'D', 'G', 'B', 'e'][strIdx];

            return (
              <g key={`string-${strIdx}`}>
                {/* String Tuning Label on Left: e.g. 6:E (Kalın) to 1:e (İnce) */}
                <text
                  x="18"
                  y={y + 3.5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {stringNumber}:{noteName}
                </text>

                {/* Visible Guitar String */}
                <line
                  x1={34}
                  y1={y}
                  x2={36 + nutWidth + boardLen}
                  y2={y}
                  stroke={isVibrating ? '#fef08a' : '#94a3b8'}
                  strokeWidth={gauge}
                  opacity={isVibrating ? 1 : 0.8}
                />

                {/* MODE 1: CHORD MODE CELL LOGIC */}
                {viewMode === 'chord' && (
                  <>
                    {/* Per-fret clickable hit cells (frets 1..numFrets) */}
                    {Array.from({ length: numFrets }).map((_, fIdx) => {
                      const fNum = fIdx + 1;
                      const cellX = 36 + nutWidth + fIdx * fretWidth;
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
                            x="23"
                            y={y + 4}
                            textAnchor="middle"
                            fill="#ef4444"
                            fontSize="11"
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
                              cx="23"
                              cy={y}
                              r="5.5"
                              fill="#11131a"
                              stroke={oolimo.fill}
                              strokeWidth="2"
                            />
                            <circle cx="23" cy={y} r="2" fill={oolimo.fill} />
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Fretted Finger Dots on Fretboard */}
                    {(() => {
                      const fret = position.frets[strIdx];
                      if (fret > 0) {
                        const cx = 36 + nutWidth + (fret - 0.5) * fretWidth;
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
                        const isHighlighted = isPlucked || chordPulse;

                        return (
                          <g
                            key={`finger-${strIdx}`}
                            className="cursor-pointer"
                            onClick={() => handleStringClick(strIdx, fret)}
                          >
                            {/* Outer Glow Ring showing active target */}
                            <circle
                              cx={cx}
                              cy={y}
                              r={isHighlighted ? '15' : '12.5'}
                              fill="none"
                              stroke={oolimo.fill}
                              strokeWidth={isHighlighted ? '2' : '1'}
                              opacity={isHighlighted ? 0.9 : 0.35}
                            />
                            {/* High-Contrast Fret Dot */}
                            <circle
                              cx={cx}
                              cy={y}
                              r={isHighlighted ? '11.5' : '10.5'}
                              fill={oolimo.fill}
                              stroke={oolimo.stroke}
                              strokeWidth={isHighlighted ? '2.5' : '1.5'}
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
                            {/* Mini finger badge when viewing Degrees/Notes */}
                            {displayMode !== 'fingers' && finger > 0 && (
                              <g>
                                <circle
                                  cx={cx + 9.5}
                                  cy={y - 8.5}
                                  r="5.5"
                                  fill="#090a0f"
                                  stroke={oolimo.stroke}
                                  strokeWidth="1"
                                />
                                <text
                                  x={cx + 9.5}
                                  y={y - 5.5}
                                  textAnchor="middle"
                                  fill="#fbbf24"
                                  fontSize="7.5"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {finger}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                {/* MODE 2: FRETSHAPES SCALE & CAGED VISUALIZER LOGIC */}
                {viewMode === 'scale' && (
                  <>
                    {/* Open String Note at Nut */}
                    {(() => {
                      const openNote = getNoteAtFret(strIdx, 0);
                      const scaleInfo = getScaleNoteInfo(openNote, scaleRoot, currentScale);
                      if (scaleInfo.inScale) {
                        const style = getFretShapesIntervalStyle(scaleInfo.degreeName || '1');
                        const isPlucked = activeNote?.stringIdx === strIdx && activeNote?.fret === 0;
                        const isInBox = cagedBox === 0 || boxRange.minFret === 0;

                        return (
                          <g
                            className="cursor-pointer"
                            onClick={() => handleStringClick(strIdx, 0)}
                            opacity={isInBox ? 1 : 0.25}
                          >
                            <circle
                              cx="23"
                              cy={y}
                              r={isPlucked ? '7.5' : '6'}
                              fill={style.fill}
                              stroke={style.stroke}
                              strokeWidth="1.5"
                            />
                            {style.isRoot && (
                              <circle
                                cx="23"
                                cy={y}
                                r="8.5"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                            )}
                            <text
                              x="23"
                              y={y + 3}
                              textAnchor="middle"
                              fill={style.text}
                              fontSize="7.5"
                              fontFamily="monospace"
                              fontWeight="black"
                            >
                              {displayMode === 'notes' ? openNote : scaleInfo.degreeName}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Scale Dots Across All Frets / Filtered by CAGED Box */}
                    {Array.from({ length: numFrets }).map((_, fIdx) => {
                      const fNum = fIdx + 1;
                      const isInBox =
                        cagedBox === 0 ||
                        (fNum >= boxRange.minFret && fNum <= boxRange.maxFret);

                      const note = getNoteAtFret(strIdx, fNum);
                      const scaleInfo = getScaleNoteInfo(note, scaleRoot, currentScale);

                      if (!scaleInfo.inScale) {
                        return null;
                      }

                      const cellX = 36 + nutWidth + fIdx * fretWidth;
                      const cx = cellX + fretWidth / 2;
                      const style = getFretShapesIntervalStyle(scaleInfo.degreeName || '1');
                      const isPlucked = activeNote?.stringIdx === strIdx && activeNote?.fret === fNum;
                      const isRoot = style.isRoot;

                      return (
                        <g
                          key={`scale-dot-${strIdx}-${fNum}`}
                          className="cursor-pointer"
                          onClick={() => handleStringClick(strIdx, fNum)}
                          opacity={isInBox ? 1 : 0.25}
                        >
                          {/* fretShapes Signature Crown Ring for Root Notes */}
                          {isRoot && (
                            <circle
                              cx={cx}
                              cy={y}
                              r={isPlucked ? '16' : '14'}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth={isPlucked ? '2.5' : '1.8'}
                              className="animate-pulse"
                            />
                          )}

                          {/* Outer Glow Ring */}
                          <circle
                            cx={cx}
                            cy={y}
                            r={isPlucked ? '13' : '11'}
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth={isPlucked ? '2.5' : '1.5'}
                            className="filter drop-shadow-sm"
                          />

                          {/* Label: Degree ('R', 'b3', '5') or Note ('A', 'C', 'E') */}
                          <text
                            x={cx}
                            y={y + 3.5}
                            textAnchor="middle"
                            fill={style.text}
                            fontSize={displayMode === 'notes' ? '9' : '10'}
                            fontFamily="monospace"
                            fontWeight="black"
                          >
                            {displayMode === 'notes' ? note : scaleInfo.degreeName}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Interval Breakdown */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-2 border-t border-white/10 px-1 gap-2">
        {viewMode === 'chord' ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-[#fbbf24] inline-block shadow-sm" />
              <span className="text-slate-300 font-semibold">Kök (1)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-[#7dd3fc] inline-block shadow-sm" />
              <span className="text-slate-300 font-semibold">Akor Sesleri (3 / 5)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-[#34d399] inline-block shadow-sm" />
              <span className="text-slate-300 font-semibold">Uzantı / Gam</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-slate-500 font-bold mr-1">FRETSHAPES RENK KODLARI:</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-[#fbbf24] inline-block shadow-[0_0_6px_#f59e0b]" />
              <span className="text-amber-400 font-bold">R (Kök)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" />
              <span className="text-sky-300">3 / b3 (Üçlü)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] inline-block" />
              <span className="text-purple-300">b5 (Blue Note)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] inline-block" />
              <span className="text-teal-300">5 (Beşli)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
              <span className="text-emerald-300">7 / b7 (Yedili)</span>
            </span>
          </div>
        )}

        <span className="text-slate-500">
          {viewMode === 'chord' ? 'Standart E-A-D-G-B-e • Tıklayarak tınlat' : 'Kutu seçerek soloları pratik yap'}
        </span>
      </div>
    </div>
  );
};
