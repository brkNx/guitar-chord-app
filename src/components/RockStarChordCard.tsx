import { useState } from 'react';
import type { ChordPosition } from '../types/guitar';
import { getOrGenerateChord } from '../data/chordLibrary';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2 } from 'lucide-react';

interface RockStarChordCardProps {
  chordName: string;
  position?: ChordPosition;
  isActive?: boolean;
  compact?: boolean;
  onSelectChord?: (chordName: string) => void;
  onPreviewSound?: () => void;
}

// RockStar Finger Color Coding Palette
export const ROCKSTAR_FINGERS: Record<number, { bg: string; text: string; label: string; nameTr: string }> = {
  1: { bg: '#0284c7', text: '#ffffff', label: '1', nameTr: 'İşaret' }, // Cyan / Sky Blue
  2: { bg: '#059669', text: '#ffffff', label: '2', nameTr: 'Orta' },   // Emerald Green
  3: { bg: '#d97706', text: '#ffffff', label: '3', nameTr: 'Yüzük' },  // Amber Orange
  4: { bg: '#e11d48', text: '#ffffff', label: '4', nameTr: 'Serçe' },  // Rose Pink
  5: { bg: '#475569', text: '#ffffff', label: 'T', nameTr: 'Başparmak' } // Slate
};

export const RockStarChordCard = ({
  chordName,
  position: propPosition,
  isActive = false,
  compact = false,
  onSelectChord,
  onPreviewSound
}: RockStarChordCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const chordDef = getOrGenerateChord(chordName);
  const position = propPosition || chordDef.positions[0] || {
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    baseFret: 1
  };

  const handleCardClick = () => {
    if (onSelectChord) {
      onSelectChord(chordName);
    }
    handlePlaySound();
  };

  const handlePlaySound = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    if (onPreviewSound) {
      onPreviewSound();
    } else {
      await guitarAudio.strumChord(position, 'down', 22);
    }
    setTimeout(() => setIsPlaying(false), 450);
  };

  // Dimensions for SVG Diagram
  const svgWidth = compact ? 96 : 140;
  const svgHeight = compact ? 110 : 155;
  const numFrets = 4;
  const startY = compact ? 22 : 30;
  const fretHeight = compact ? 18 : 25;
  const startX = compact ? 16 : 24;
  const stringSpacing = compact ? 13 : 19;
  const totalGridWidth = 5 * stringSpacing;

  const baseFret = position.baseFret || 1;
  const isNut = baseFret === 1;

  return (
    <div
      onClick={handleCardClick}
      className={`relative group rounded-2xl border transition-all select-none cursor-pointer flex flex-col items-center ${
        compact ? 'p-2 min-w-[110px]' : 'p-3.5 min-w-[155px]'
      } ${
        isActive
          ? 'bg-gradient-to-b from-[#181d2c] to-[#0f121c] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105 z-10'
          : 'bg-[#10131b] hover:bg-[#161a26] border-white/[0.08] hover:border-amber-500/40 shadow-md'
      }`}
    >
      {/* CARD HEADER */}
      <div className="w-full flex items-center justify-between gap-1 mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono font-black tracking-tight ${
              compact ? 'text-sm' : 'text-base'
            } ${isActive ? 'text-amber-400' : 'text-white group-hover:text-amber-300'}`}
          >
            {chordName}
          </span>
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
          )}
        </div>

        <button
          onClick={handlePlaySound}
          disabled={isPlaying}
          className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Akoru Tınlat"
        >
          <Volume2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isPlaying ? 'text-amber-400 animate-pulse' : ''}`} />
        </button>
      </div>

      {/* SVG CHORD DIAGRAM (RockStar Grid) */}
      <div className="relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
        >
          {/* Base Fret Indicator (e.g. 3fr) */}
          {!isNut && (
            <text
              x={startX - 6}
              y={startY + fretHeight * 0.7}
              fill="#94a3b8"
              fontSize={compact ? '9' : '11'}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="end"
            >
              {baseFret}fr
            </text>
          )}

          {/* Top Nut or Wire */}
          {isNut ? (
            <rect
              x={startX - 1}
              y={startY - 3}
              width={totalGridWidth + 2}
              height={4}
              fill="#e2e8f0"
              rx={1.5}
            />
          ) : (
            <line
              x1={startX}
              y1={startY}
              x2={startX + totalGridWidth}
              y2={startY}
              stroke="#64748b"
              strokeWidth="2"
            />
          )}

          {/* Fret Horizontal Lines */}
          {Array.from({ length: numFrets }).map((_, fIdx) => {
            const y = startY + (fIdx + 1) * fretHeight;
            return (
              <line
                key={`fret-${fIdx}`}
                x1={startX}
                y1={y}
                x2={startX + totalGridWidth}
                y2={y}
                stroke="#334155"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Vertical Strings (Strings 6 on Left, String 1 on Right) */}
          {Array.from({ length: 6 }).map((_, sIdx) => {
            const x = startX + sIdx * stringSpacing;
            const fretValue = position.frets[sIdx];
            const isMuted = fretValue === -1;
            const isOpen = fretValue === 0;

            return (
              <g key={`string-${sIdx}`}>
                {/* String Line */}
                <line
                  x1={x}
                  y1={startY}
                  x2={x}
                  y2={startY + numFrets * fretHeight}
                  stroke="#475569"
                  strokeWidth={2.4 - sIdx * 0.3}
                />

                {/* Top Mute (X) or Open (O) Indicator */}
                {isMuted && (
                  <text
                    x={x}
                    y={startY - 8}
                    fill="#ef4444"
                    fontSize={compact ? '9' : '11'}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ×
                  </text>
                )}
                {isOpen && (
                  <circle
                    cx={x}
                    cy={startY - 9}
                    r={compact ? 3.5 : 4.5}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.8"
                  />
                )}
              </g>
            );
          })}

          {/* Barre Capsule Representation */}
          {position.barres?.map((barre, bIdx) => {
            const relFret = barre.fret - baseFret + 1;
            if (relFret < 1 || relFret > numFrets) return null;

            const xFrom = startX + (6 - barre.fromString) * stringSpacing;
            const xTo = startX + (6 - barre.toString) * stringSpacing;
            const cy = startY + (relFret - 0.5) * fretHeight;
            const leftX = Math.min(xFrom, xTo) - (compact ? 5 : 7);
            const width = Math.abs(xTo - xFrom) + (compact ? 10 : 14);
            const pillHeight = compact ? 12 : 16;

            return (
              <g key={`barre-${bIdx}`}>
                <rect
                  x={leftX}
                  y={cy - pillHeight / 2}
                  width={width}
                  height={pillHeight}
                  rx={pillHeight / 2}
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
                <text
                  x={(xFrom + xTo) / 2}
                  y={cy + (compact ? 3 : 4)}
                  fill="#ffffff"
                  fontSize={compact ? '8' : '10'}
                  fontFamily="monospace"
                  fontWeight="black"
                  textAnchor="middle"
                >
                  {barre.finger || 1}
                </text>
              </g>
            );
          })}

          {/* Individual Finger Dot Badges */}
          {position.frets.map((fret, sIdx) => {
            if (fret <= 0) return null;
            const relFret = fret - baseFret + 1;
            if (relFret < 1 || relFret > numFrets) return null;

            // If string is part of a barre, don't duplicate single dot unless it has higher fret
            const isCoveredByBarre = position.barres?.some(
              (b) =>
                b.fret === fret &&
                6 - sIdx >= Math.min(b.fromString, b.toString) &&
                6 - sIdx <= Math.max(b.fromString, b.toString)
            );
            if (isCoveredByBarre) return null;

            const cx = startX + sIdx * stringSpacing;
            const cy = startY + (relFret - 0.5) * fretHeight;
            const fingerNum = position.fingers[sIdx] || 1;
            const fingerStyle = ROCKSTAR_FINGERS[fingerNum] || ROCKSTAR_FINGERS[1];
            const radius = compact ? 5.5 : 7.5;

            return (
              <g key={`dot-${sIdx}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={fingerStyle.bg}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  className="filter drop-shadow-sm"
                />
                <text
                  x={cx}
                  y={cy + (compact ? 3 : 3.5)}
                  fill={fingerStyle.text}
                  fontSize={compact ? '7.5' : '9.5'}
                  fontFamily="monospace"
                  fontWeight="black"
                  textAnchor="middle"
                >
                  {fingerStyle.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* FOOTER FINGER LEGEND (Full size only) */}
      {!compact && (
        <div className="w-full flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/[0.06] font-mono text-[9px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#0284c7]" title="1: İşaret" />
          <span className="w-2 h-2 rounded-full bg-[#059669]" title="2: Orta" />
          <span className="w-2 h-2 rounded-full bg-[#d97706]" title="3: Yüzük" />
          <span className="w-2 h-2 rounded-full bg-[#e11d48]" title="4: Serçe" />
          <span className="text-slate-500 text-[8px] ml-1">F1-F4</span>
        </div>
      )}
    </div>
  );
};
