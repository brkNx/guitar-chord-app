import { useState } from 'react';
import type { ChordPosition, FretboardDisplayMode } from '../types/guitar';
import { getNoteAtFret } from '../data/chordLibrary';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, Sparkles, Box, Info } from 'lucide-react';

interface FretboardProps {
  chordName: string;
  position: ChordPosition;
  displayMode: FretboardDisplayMode;
  isLeftHanded: boolean;
  onOpenChordDetail?: (chordName: string) => void;
  onStrum?: () => void;
}

export const Fretboard = ({
  chordName,
  position,
  displayMode,
  isLeftHanded,
  onOpenChordDetail
}: FretboardProps) => {
  const [activeNote, setActiveNote] = useState<{ stringIdx: number; fret: number } | null>(null);
  const [vibratingStrings, setVibratingStrings] = useState<Set<number>>(new Set());
  const [isStrumming, setIsStrumming] = useState(false);
  const [isArpeggiating, setIsArpeggiating] = useState(false);
  const [is3DMode, setIs3DMode] = useState(true);

  const numFrets = 14;
  const fretWidth = 56;
  const stringSpacing = 28;
  const boardHeight = 5 * stringSpacing + 40;
  const nutWidth = 12;
  const boardWidth = numFrets * fretWidth + nutWidth + 50;

  // Dots markers on frets
  const singleDotFrets = [3, 5, 7, 9];
  const doubleDotFret = 12;

  // String thicknesses (string 0: Low E [thick] to string 5: High E [thin])
  const stringGauges = [3.8, 3.2, 2.6, 2.0, 1.5, 1.0];

  const triggerStringVibration = (stringIdx: number, durationMs = 550) => {
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
    setTimeout(() => setActiveNote(null), 400);
  };

  const handleStrumClick = async () => {
    if (isStrumming) return;
    setIsStrumming(true);
    await guitarAudio.strumChord(position, 'down', 28, false, (strIdx: number) => {
      triggerStringVibration(strIdx, 500);
    });
    setTimeout(() => setIsStrumming(false), 550);
  };

  const handleArpeggioClick = async () => {
    if (isArpeggiating) return;
    setIsArpeggiating(true);
    await guitarAudio.arpeggiateChord(position, 'pima', 130, (strIdx: number) => {
      triggerStringVibration(strIdx, 450);
    });
    setTimeout(() => setIsArpeggiating(false), 950);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background Studio Light Effects */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Chord Info, 3D Toggle & Quick Strum */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1 relative z-10">
        <div className="flex items-center gap-3">
          {/* Clickable Chord Badge -> Opens 3D Detail Modal */}
          <button
            onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
            className="group flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl rounded-2xl shadow-lg shadow-amber-500/25 tracking-wide transition-all active:scale-95"
            title="Akor detaylarını ve teorisini görüntüle"
          >
            <span>{chordName || 'Serbest Çalım'}</span>
            <Info className="w-4 h-4 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-300">
              {position.baseFret > 1 ? `${position.baseFret}. Perde Pozisyonu` : 'Açık Pozisyon'}
            </span>
            <span className="text-[10px] text-slate-400">
              {onOpenChordDetail && 'Detaylar için akora tıkla'}
            </span>
          </div>
        </div>

        {/* Action Controls: 3D Toggle, Strum, Arpeggio */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3D Perspective Toggle Button */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              is3DMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
            title="Gitar sapının 3D sahne perspektifini aç / kapa"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{is3DMode ? '3D Perspektif' : '2D Klasik'}</span>
          </button>

          {/* Arpeggio Button */}
          <button
            onClick={handleArpeggioClick}
            disabled={isArpeggiating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isArpeggiating
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-95'
                : 'bg-slate-800/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isArpeggiating ? 'Çalınıyor...' : 'Arpej'}</span>
          </button>

          {/* Strum Button */}
          <button
            onClick={handleStrumClick}
            disabled={isStrumming}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
              isStrumming
                ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/50 scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/25 active:scale-95'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isStrumming ? 'Tınlıyor...' : 'Akoru Tınlat'}</span>
          </button>
        </div>
      </div>

      {/* 3D Perspective Stage Container */}
      <div
        className="w-full overflow-x-auto pb-4 pt-2 scrollbar-thin transition-all"
        style={{
          perspective: is3DMode ? '1200px' : 'none'
        }}
      >
        <div
          className="mx-auto transition-all duration-500 ease-out"
          style={{
            minWidth: '820px',
            transform: is3DMode
              ? `rotateX(24deg) rotateY(${isLeftHanded ? '2deg' : '-2deg'}) rotateZ(-0.3deg) translateY(-2px)`
              : 'none',
            transformOrigin: '50% 60%',
            filter: is3DMode
              ? 'drop-shadow(0 25px 30px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 20px rgba(245, 158, 11, 0.08))'
              : 'none'
          }}
        >
          <svg
            viewBox={`0 0 ${boardWidth} ${boardHeight + 45}`}
            className={`h-52 md:h-60 mx-auto transition-transform ${isLeftHanded ? 'scale-x-[-1]' : ''}`}
          >
            <defs>
              {/* Premium Dark Brazilian Rosewood Fretboard Wood */}
              <linearGradient id="rosewood" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1814" />
                <stop offset="25%" stopColor="#2e241c" />
                <stop offset="50%" stopColor="#241c16" />
                <stop offset="75%" stopColor="#30261e" />
                <stop offset="100%" stopColor="#17120e" />
              </linearGradient>

              {/* 3D Neck Side Depth (Mahogany/Maple Binding) */}
              <linearGradient id="neckDepthWood" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="30%" stopColor="#92400e" />
                <stop offset="70%" stopColor="#5c2607" />
                <stop offset="100%" stopColor="#2e1303" />
              </linearGradient>

              {/* Fret Wire Metallic Nickel/Chrome Reflection */}
              <linearGradient id="metalFret" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="35%" stopColor="#f8fafc" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Bone Nut 3D Texture */}
              <linearGradient id="boneNut" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>

              {/* Pearloid Inlay Reflection */}
              <radialGradient id="pearlInlay" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#e2e8f0" />
                <stop offset="80%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </radialGradient>

              {/* Glowing Finger Dot (Amber/Gold Studio Neon) */}
              <radialGradient id="fingerGlow" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="65%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>

              {/* Active Vibrating String Glow */}
              <linearGradient id="vibratingStringGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>

              <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="stringVibeGlow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 3D Neck Depth Layer (Side Edge Binding) */}
            {is3DMode && (
              <g id="neck-depth-edge">
                {/* 3D bottom bevel */}
                <rect
                  x={nutWidth + 30}
                  y={20 + 5 * stringSpacing}
                  width={numFrets * fretWidth}
                  height="12"
                  fill="url(#neckDepthWood)"
                  rx="1"
                />
                {/* Maple binding accent line */}
                <line
                  x1={nutWidth + 30}
                  y1={20 + 5 * stringSpacing}
                  x2={nutWidth + 30 + numFrets * fretWidth}
                  y2={20 + 5 * stringSpacing}
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                  opacity="0.7"
                />
              </g>
            )}

            {/* Fretboard Wooden Body (Rosewood Face) */}
            <rect
              x={nutWidth + 30}
              y={20}
              width={numFrets * fretWidth}
              height={5 * stringSpacing}
              fill="url(#rosewood)"
              rx="2"
            />

            {/* Fretboard Top & Bottom Edge Binding Lines */}
            <line
              x1={nutWidth + 30}
              y1={20}
              x2={nutWidth + 30 + numFrets * fretWidth}
              y2={20}
              stroke="#f8fafc"
              strokeWidth="0.8"
              opacity="0.35"
            />
            <line
              x1={nutWidth + 30}
              y1={20 + 5 * stringSpacing}
              x2={nutWidth + 30 + numFrets * fretWidth}
              y2={20 + 5 * stringSpacing}
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Bone Nut (Fret 0 Boundary) */}
            <rect
              x={30}
              y={17}
              width={nutWidth}
              height={5 * stringSpacing + 6}
              fill="url(#boneNut)"
              rx="2.5"
              stroke="#94a3b8"
              strokeWidth="1"
              filter={is3DMode ? 'drop-shadow(-2px 4px 6px rgba(0,0,0,0.6))' : undefined}
            />
            {/* Nut Highlight specular line */}
            <line
              x1={30 + 2}
              y1={18}
              x2={30 + 2}
              y2={18 + 5 * stringSpacing + 4}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.8"
            />

            {/* Pearloid Fret Markers (Frets 3, 5, 7, 9) */}
            {singleDotFrets.map((fret) => {
              const cx = 30 + nutWidth + (fret - 0.5) * fretWidth;
              const cy = 20 + 2.5 * stringSpacing;
              return (
                <circle
                  key={`dot-${fret}`}
                  cx={cx}
                  cy={cy}
                  r="5.5"
                  fill="url(#pearlInlay)"
                  stroke="#475569"
                  strokeWidth="0.8"
                  opacity="0.75"
                />
              );
            })}

            {/* Double Pearloid Dots on Fret 12 (Octave) */}
            <circle
              cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
              cy={20 + 1.5 * stringSpacing}
              r="5"
              fill="url(#pearlInlay)"
              stroke="#475569"
              strokeWidth="0.8"
              opacity="0.75"
            />
            <circle
              cx={30 + nutWidth + (doubleDotFret - 0.5) * fretWidth}
              cy={20 + 3.5 * stringSpacing}
              r="5"
              fill="url(#pearlInlay)"
              stroke="#475569"
              strokeWidth="0.8"
              opacity="0.75"
            />

            {/* Metallic Frets (Perde Telleri with Chrome Reflection) */}
            {Array.from({ length: numFrets }).map((_, i) => {
              const fretX = 30 + nutWidth + (i + 1) * fretWidth;
              return (
                <g key={`fret-${i}`}>
                  {/* Fret wire shadow slot */}
                  <line
                    x1={fretX + 1.2}
                    y1={20}
                    x2={fretX + 1.2}
                    y2={20 + 5 * stringSpacing + (is3DMode ? 10 : 0)}
                    stroke="#090d16"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  {/* Main metal crown wire */}
                  <line
                    x1={fretX}
                    y1={20}
                    x2={fretX}
                    y2={20 + 5 * stringSpacing + (is3DMode ? 10 : 0)}
                    stroke="url(#metalFret)"
                    strokeWidth="2.8"
                  />
                  {/* Specular high-light sheen */}
                  <line
                    x1={fretX - 0.5}
                    y1={20}
                    x2={fretX - 0.5}
                    y2={20 + 5 * stringSpacing}
                    stroke="#ffffff"
                    strokeWidth="0.7"
                    opacity="0.65"
                  />
                  {/* Fret numbers below neck */}
                  <text
                    x={fretX - fretWidth / 2}
                    y={boardHeight + (is3DMode ? 32 : 22)}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Barre bar representation if chord has a barre */}
            {position.barres?.map((barre, bIdx) => {
              const x = 30 + nutWidth + (barre.fret - 0.5) * fretWidth;
              const fromY = 20 + (6 - barre.fromString) * stringSpacing;
              const toY = 20 + (6 - barre.toString) * stringSpacing;
              const topY = Math.min(fromY, toY);
              const height = Math.abs(toY - fromY);

              return (
                <g key={`barre-${bIdx}`}>
                  <rect
                    x={x - 12}
                    y={topY - 12}
                    width={24}
                    height={height + 24}
                    rx="12"
                    fill="#f59e0b"
                    opacity="0.85"
                    filter="url(#glowFilter)"
                  />
                  <rect
                    x={x - 10}
                    y={topY - 10}
                    width={20}
                    height={height + 20}
                    rx="10"
                    fill="url(#fingerGlow)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* 6 Guitar Strings with Vibration Wave Simulation */}
            {[0, 1, 2, 3, 4, 5].map((strIdx) => {
              const y = 20 + strIdx * stringSpacing;
              const gauge = stringGauges[strIdx];
              const isPlucked = activeNote?.stringIdx === strIdx;
              const isVibrating = vibratingStrings.has(strIdx) || isPlucked;
              const boardLen = numFrets * fretWidth;

              return (
                <g key={`string-${strIdx}`}>
                  {/* Invisible wide pluck hit target */}
                  <line
                    x1={30}
                    y1={y}
                    x2={30 + nutWidth + boardLen}
                    y2={y}
                    stroke="transparent"
                    strokeWidth="18"
                    className="cursor-pointer"
                    onClick={() =>
                      handleStringClick(
                        strIdx,
                        position.frets[strIdx] >= 0 ? position.frets[strIdx] : 0
                      )
                    }
                  />

                  {/* Vibrating Harmonic Sine Wave or Static String */}
                  {isVibrating ? (
                    <g filter="url(#stringVibeGlow)">
                      {/* Animated wave path */}
                      <path
                        d={`M 30 ${y} Q ${30 + boardLen * 0.25} ${y - 3} ${30 + boardLen * 0.5} ${y} Q ${30 + boardLen * 0.75} ${y + 3} ${30 + nutWidth + boardLen} ${y}`}
                        stroke="url(#vibratingStringGlow)"
                        strokeWidth={gauge + 2}
                        fill="none"
                        className="animate-pulse"
                      />
                      {/* Core string */}
                      <line
                        x1={28}
                        y1={y}
                        x2={30 + nutWidth + boardLen}
                        y2={y}
                        stroke="#fef08a"
                        strokeWidth={gauge}
                      />
                    </g>
                  ) : (
                    /* Resting metallic wound / plain string */
                    <g>
                      {/* String shadow */}
                      <line
                        x1={28}
                        y1={y + 1.2}
                        x2={30 + nutWidth + boardLen}
                        y2={y + 1.2}
                        stroke="#0a0e17"
                        strokeWidth={gauge}
                        opacity="0.6"
                      />
                      {/* String body */}
                      <line
                        x1={28}
                        y1={y}
                        x2={30 + nutWidth + boardLen}
                        y2={y}
                        stroke="#cbd5e1"
                        strokeWidth={gauge}
                        opacity="0.85"
                      />
                      {/* String sheen line */}
                      <line
                        x1={28}
                        y1={y - 0.4}
                        x2={30 + nutWidth + boardLen}
                        y2={y - 0.4}
                        stroke="#ffffff"
                        strokeWidth={Math.max(0.6, gauge * 0.3)}
                        opacity="0.5"
                      />
                    </g>
                  )}

                  {/* Open / Mute Indicator at Nut */}
                  {(() => {
                    const fret = position.frets[strIdx];
                    if (fret === -1) {
                      return (
                        <text
                          x="15"
                          y={y + 4.5}
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
                          stroke={isVibrating ? '#38bdf8' : '#10b981'}
                          strokeWidth="2.5"
                          className="cursor-pointer"
                          onClick={() => handleStringClick(strIdx, 0)}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Finger Placement Dots on Frets */}
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
                          className="cursor-pointer group"
                          onClick={() => handleStringClick(strIdx, fret)}
                        >
                          {/* Outer pulse wave when plucked */}
                          {isVibrating && (
                            <circle
                              cx={cx}
                              cy={y}
                              r="17"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                              opacity="0.8"
                              className="animate-ping"
                            />
                          )}

                          {/* Finger placement bulb */}
                          <circle
                            cx={cx}
                            cy={y}
                            r="12"
                            fill="url(#fingerGlow)"
                            stroke="#ffffff"
                            strokeWidth="2"
                            filter="url(#glowFilter)"
                          />
                          <text
                            x={cx}
                            y={y + 4.5}
                            textAnchor="middle"
                            fill="#0f172a"
                            fontSize="11"
                            fontWeight="900"
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
      </div>

      {/* Legend & Tuning Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2 pt-3 border-t border-slate-800/80 px-2 relative z-10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <b>O:</b> Boş Tel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold">✕:</span> Susturmalı (Mute)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-[10px] text-black font-extrabold flex items-center justify-center">
              1
            </span>
            Parmak No
          </span>
          {is3DMode && (
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <Box className="w-3 h-3" /> 3D Ahşap & Tel Rezonansı Aktif
            </span>
          )}
        </div>

        <div className="text-slate-400 font-medium mt-1 sm:mt-0">
          Standart Akort:{' '}
          <span className="text-amber-400 font-bold">E - A - D - G - B - e</span>
        </div>
      </div>
    </div>
  );
};
