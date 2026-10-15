import { useState, useEffect, useRef } from 'react';
import type { Song } from '../types/guitar';
import { parseChordPro, extractUniqueChords } from '../utils/chordPro';
import { Play, Pause, ChevronUp, ChevronDown, RotateCcw, Sparkles } from 'lucide-react';

interface SongViewerProps {
  song: Song;
  activeChord: string;
  onSelectChord: (chord: string) => void;
  transposeOffset: number;
  onTransposeChange: (offset: number) => void;
}

export const SongViewer = ({
  song,
  activeChord,
  onSelectChord,
  transposeOffset,
  onTransposeChange
}: SongViewerProps) => {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(25); // Pixels per second
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const parsedLines = parseChordPro(song.content, transposeOffset);
  const uniqueChords = extractUniqueChords(song.content, transposeOffset);

  // Auto-scroll logic using requestAnimationFrame for butter-smooth scrolling
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;

    const scrollStep = (currentTime: number) => {
      if (!isAutoScrolling || !scrollContainerRef.current) return;

      if (lastTime !== null) {
        const delta = (currentTime - lastTime) / 1000;
        scrollContainerRef.current.scrollTop += scrollSpeed * delta;
      }
      lastTime = currentTime;
      animId = requestAnimationFrame(scrollStep);
    };

    if (isAutoScrolling) {
      animId = requestAnimationFrame(scrollStep);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Song Header & Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{song.title}</h2>
            {song.isAiGenerated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3" /> AI Üretimi
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium">
            {song.artist} • Ton: <span className="text-amber-400 font-semibold">{song.key}</span>
            {song.capo > 0 && ` • Kapo: ${song.capo}. Perde`}
            {song.tempo && ` • ${song.tempo} BPM`}
          </p>
        </div>

        {/* Toolbar: Transpose + Auto-Scroll */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Transpose Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 text-xs">
            <span className="px-2 font-medium text-slate-400">Transpoze:</span>
            <button
              onClick={() => onTransposeChange(transposeOffset - 1)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
              title="Yarım ses pesleştir (-1)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <span className={`px-2 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
            <button
              onClick={() => onTransposeChange(transposeOffset + 1)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
              title="Yarım ses tizleştir (+1)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            {transposeOffset !== 0 && (
              <button
                onClick={() => onTransposeChange(0)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white ml-1 transition-colors"
                title="Orijinal Tona Sıfırla"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Auto-Scroll Button & Slider */}
          <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl p-1.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                isAutoScrolling
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoScrolling ? 'Durdur' : 'Kaydır'}</span>
            </button>

            {isAutoScrolling && (
              <div className="flex items-center gap-1 px-1">
                <span className="text-[11px] text-slate-400">Hız:</span>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-16 h-1.5 accent-amber-500 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song Chords Quick Tray */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0">
          Akorlar:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {uniqueChords.map((chord) => {
            const isActive = activeChord === chord;
            return (
              <button
                key={chord}
                onClick={() => onSelectChord(chord)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {chord}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Lyrics & Synchronized Chords Sheet */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-base leading-relaxed select-text"
        style={{ scrollBehavior: 'smooth' }}
      >
        {parsedLines.map((line, idx) => {
          if (line.type === 'empty') {
            return <div key={`empty-${idx}`} className="h-4" />;
          }

          if (line.type === 'section') {
            return (
              <div
                key={`sec-${idx}`}
                className="pt-3 pb-1 text-xs font-sans font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-2"
              >
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                  {line.sectionName}
                </span>
                <span className="flex-1 h-[1px] bg-slate-800" />
              </div>
            );
          }

          // Chord & Lyric Line
          return (
            <div key={`line-${idx}`} className="flex flex-wrap items-end gap-x-1 gap-y-1">
              {line.segments?.map((seg, sIdx) => {
                const isActive = seg.chord && activeChord === seg.chord;

                return (
                  <div key={`seg-${sIdx}`} className="inline-flex flex-col items-start min-w-[12px]">
                    {/* Floating Clickable Chord Badge */}
                    {seg.chord ? (
                      <button
                        onClick={() => onSelectChord(seg.chord)}
                        className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all transform mb-0.5 ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-extrabold shadow-sm'
                            : 'bg-slate-800/80 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300'
                        }`}
                      >
                        {seg.chord}
                      </button>
                    ) : (
                      <span className="h-5" />
                    )}

                    {/* Lyric text */}
                    <span className="text-slate-200 text-sm md:text-base font-sans whitespace-pre">
                      {seg.lyric}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
