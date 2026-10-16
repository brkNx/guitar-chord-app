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
    <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col gap-2 p-3 bg-[#0b0d12]/90 border border-[#1e222d] rounded-xl backdrop-blur-md shadow-2xl animate-fadeIn pointer-events-auto">
      {/* Top Control Strip: Back to 3D + Song Chord Palette + Strum Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#11141c] border border-[#1e222d] rounded-lg px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181c26] hover:bg-[#222836] border border-[#1e222d] rounded font-mono text-[11px] font-bold text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>3D SAHNEYE DÖN</span>
            <kbd className="ml-1 px-1 py-0.2 bg-[#0b0d12] border border-[#1e222d] rounded text-[9px] text-slate-400">
              ESC
            </kbd>
          </button>

          {/* Song Chords Quick Bar */}
          {songChords.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-[#1e222d] overflow-x-auto scrollbar-none">
              <span className="font-mono text-[10px] text-slate-500 uppercase mr-1">
                ŞARKI AKORLARI:
              </span>
              {songChords.map((c) => {
                const isActive = c === chordName;
                return (
                  <button
                    key={c}
                    onClick={() => onSelectChord(c)}
                    className={`px-2 py-0.5 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/40 scale-105'
                        : 'bg-[#181c26] text-slate-300 border border-[#1e222d] hover:border-amber-500/40 hover:text-white'
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
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors cursor-pointer"
            title="Yukarıdan aşağıya tara (Space)"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>AŞAĞI TARA</span>
            <kbd className="ml-1 px-1 bg-black/20 rounded text-[9px]">SPACE</kbd>
          </button>
          <button
            onClick={() => onStrum('up')}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#181c26] hover:bg-[#222836] text-slate-200 border border-[#1e222d] font-bold rounded transition-colors cursor-pointer"
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
