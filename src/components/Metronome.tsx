import { useState, useEffect } from 'react';
import { guitarAudio } from '../audio/guitarAudio';
import { Play, Pause, Activity } from 'lucide-react';

export const Metronome = () => {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

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

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    if (isPlaying) {
      guitarAudio.setMetronomeBpm(newBpm);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-semibold text-slate-300">Metronom</span>
      </div>

      {/* Beat indicators (4/4 time) */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((b) => (
          <span
            key={b}
            className={`w-2 h-2 rounded-full transition-all duration-75 ${
              beat === b
                ? b === 1
                  ? 'bg-amber-400 scale-125 shadow-sm shadow-amber-400'
                  : 'bg-emerald-400 scale-110'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        <input
          type="range"
          min="40"
          max="220"
          value={bpm}
          onChange={(e) => handleBpmChange(Number(e.target.value))}
          className="w-16 h-1.5 accent-amber-500 bg-slate-700 rounded-lg cursor-pointer"
        />
        <span className="font-mono font-bold text-amber-400 min-w-[28px] text-right">
          {bpm}
        </span>
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`p-1.5 rounded-lg transition-colors ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }`}
        title={isPlaying ? 'Durdur' : 'Başlat'}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
    </div>
  );
};
