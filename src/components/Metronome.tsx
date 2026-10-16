import { useState, useEffect, useRef } from 'react';
import { guitarAudio } from '../audio/guitarAudio';
import { Play, Square, Minus, Plus } from 'lucide-react';

interface MetronomeProps {
  onBpmChange?: (bpm: number) => void;
  initialBpm?: number;
}

export const Metronome = ({ onBpmChange, initialBpm = 100 }: MetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    if (initialBpm && initialBpm !== bpm) {
      setBpm(initialBpm);
    }
  }, [initialBpm]);

  useEffect(() => {
    if (isPlaying) {
      guitarAudio.startMetronome(bpm, (currentBeat) => {
        setBeat(currentBeat);
      });
    } else {
      guitarAudio.stopMetronome();
      setBeat(0);
    }

    return () => {
      guitarAudio.stopMetronome();
    };
  }, [isPlaying]);

  const updateBpm = (newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, newBpm));
    setBpm(clamped);
    if (onBpmChange) onBpmChange(clamped);
    if (isPlaying) {
      guitarAudio.setMetronomeBpm(clamped);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = [...tapTimesRef.current, now].slice(-4);
    tapTimesRef.current = taps;

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        updateBpm(calculatedBpm);
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-[#0e1017] border border-white/[0.08] rounded-full px-2 py-1 text-xs select-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
            : 'bg-[#181c28] text-slate-300 hover:text-white border border-white/[0.08] hover:border-amber-500/40'
        }`}
        title={isPlaying ? 'Metronomu Durdur' : 'Metronomu Başlat'}
      >
        {isPlaying ? (
          <Square className="w-2.5 h-2.5 fill-current" />
        ) : (
          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
        )}
      </button>

      {/* 4 Precision LED Beat Indicators */}
      <div className="hidden sm:flex items-center gap-1 px-1">
        {[1, 2, 3, 4].map((b) => {
          const isActive = beat === b;
          return (
            <span
              key={b}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
                isActive
                  ? b === 1
                    ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-emerald-400 scale-110 shadow-[0_0_6px_#10b981]'
                  : 'bg-white/10'
              }`}
            />
          );
        })}
      </div>

      {/* Digital BPM Readout with +/- Steppers */}
      <div className="flex items-center gap-1 bg-black/40 border border-white/[0.06] rounded-full px-2 py-0.5">
        <button
          onClick={() => updateBpm(bpm - 1)}
          className="text-slate-400 hover:text-white px-0.5 transition-colors cursor-pointer"
          title="-1 BPM"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        <span className="font-mono font-bold text-amber-400 text-[11px] min-w-[3ch] text-center tracking-wider">
          {bpm}
        </span>

        <span className="text-[9px] font-mono text-slate-500">BPM</span>

        <button
          onClick={() => updateBpm(bpm + 1)}
          className="text-slate-400 hover:text-white px-0.5 transition-colors cursor-pointer"
          title="+1 BPM"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Tap Tempo Button */}
      <button
        onClick={handleTapTempo}
        className="hidden sm:block px-2 py-0.5 bg-[#181c28] hover:bg-[#202536] border border-white/[0.08] hover:border-amber-500/40 rounded-full text-[10px] font-mono text-slate-300 hover:text-amber-400 transition-all cursor-pointer active:scale-95"
        title="Ritmik tıklayarak BPM yakala"
      >
        TAP
      </button>
    </div>
  );
};
