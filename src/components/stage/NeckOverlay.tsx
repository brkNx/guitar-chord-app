import { useEffect } from 'react';
import type { ChordPosition, FretboardDisplayMode, FretboardViewMode } from '../../types/guitar';
import { Fretboard } from '../Fretboard';
import { ArrowLeft, ArrowDown, ArrowUp } from 'lucide-react';

interface NeckOverlayProps {
  visible: boolean;
  chordName: string;
  position: ChordPosition;
  positionIdx: number;
  totalPositions: number;
  displayMode: FretboardDisplayMode;
  isLeftHanded: boolean;
  songChords: string[];
  onBack: () => void;
  onSelectChord: (chord: string) => void;
  onPositionChange: (idx: number) => void;
  onDisplayModeChange: (mode: FretboardDisplayMode) => void;
  onOpenChordDetail: () => void;
  onStrum: (direction: 'down' | 'up') => void;
  onStringPluck: (stringIdx: number, fret: number) => void;
  viewMode?: FretboardViewMode;
  onViewModeChange?: (mode: FretboardViewMode) => void;
  activeScaleId?: string;
  scaleRoot?: string;
  cagedBox?: number;
  onCagedBoxChange?: (box: number) => void;
}

export function NeckOverlay({
  visible,
  chordName,
  position,
  positionIdx,
  totalPositions,
  displayMode,
  isLeftHanded,
  songChords,
  onBack,
  onSelectChord,
  onPositionChange,
  onDisplayModeChange,
  onOpenChordDetail,
  onStrum,
  onStringPluck,
  viewMode,
  onViewModeChange,
  activeScaleId,
  scaleRoot,
  cagedBox,
  onCagedBoxChange,
}: NeckOverlayProps) {
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onStrum(e.shiftKey ? 'up' : 'down');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, onBack, onStrum]);

  if (!visible) return null;

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col gap-2.5 p-3.5 bg-[#070914]/95 border border-white/[0.12] rounded-2xl backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] animate-fadeIn pointer-events-auto">
      {/* Top Control Strip: Back to 3D + Song Chord Palette + Strum Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0c1022]/90 border border-white/[0.08] rounded-xl px-3 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14182c] hover:bg-[#1b223e] border border-white/10 hover:border-amber-400/50 rounded-xl font-mono text-[11px] font-black text-slate-200 hover:text-amber-300 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>3D SAHNEYE DÖN</span>
            <kbd className="ml-1 px-1.5 py-0.2 bg-black/40 border border-white/10 rounded text-[9px] text-slate-400">
              ESC
            </kbd>
          </button>

          {/* Song Chords Quick Bar */}
          {songChords.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2.5 border-l border-white/10 overflow-x-auto scrollbar-none">
              <span className="font-mono text-[10px] text-slate-400 uppercase mr-1 font-bold">
                ŞARKI AKORLARI:
              </span>
              {songChords.map((c) => {
                const isActive = c === chordName;
                return (
                  <button
                    key={c}
                    onClick={() => onSelectChord(c)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-200 scale-105'
                        : 'bg-[#14182c] text-slate-300 border border-white/10 hover:border-amber-400/40 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstroke / Upstroke Hardware Triggers */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => onStrum('down')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl transition-all cursor-pointer shadow-[0_0_14px_rgba(245,158,11,0.4)] border border-amber-200 active:scale-95"
            title="Yukarıdan aşağıya tara (Space)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>AŞAĞI TARA</span>
            <kbd className="ml-1 px-1.5 bg-black/20 rounded text-[9px]">SPACE</kbd>
          </button>
          <button
            onClick={() => onStrum('up')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14182c] hover:bg-[#1b223e] text-slate-200 border border-white/10 hover:border-emerald-400/50 font-black rounded-xl transition-all cursor-pointer active:scale-95"
            title="Aşağıdan yukarıya tara (Shift+Space)"
          >
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>YUKARI TARA</span>
          </button>
        </div>
      </div>

      {/* Interactive 2D Playable Fretboard */}
      <div className="w-full">
        <Fretboard
          chordName={chordName}
          position={position}
          displayMode={displayMode}
          isLeftHanded={isLeftHanded}
          positionIdx={positionIdx}
          totalPositions={totalPositions}
          onPositionChange={onPositionChange}
          onDisplayModeChange={onDisplayModeChange}
          onOpenChordDetail={onOpenChordDetail}
          onStringPluck={onStringPluck}
          onStrum={onStrum}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          activeScaleId={activeScaleId}
          scaleRoot={scaleRoot}
          cagedBox={cagedBox}
          onCagedBoxChange={onCagedBoxChange}
        />
      </div>
    </div>
  );
}
