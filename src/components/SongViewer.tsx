import { useState, useEffect, useRef, useMemo } from 'react';
import type { Song } from '../types/guitar';
import { parseChordPro, extractUniqueChords } from '../utils/chordPro';
import { guitarAudio, type VirtualGuitaristMode } from '../audio/guitarAudio';
import { getOrGenerateChord } from '../data/chordLibrary';
import { RockStarChordCard } from './RockStarChordCard';
import {
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  X,
  Radio,
  Video,
  Volume2,
  VolumeX,
  Sparkles,
  Mic,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SongViewerProps {
  song: Song;
  activeChord: string;
  onSelectChord: (chord: string, silent?: boolean) => void;
  onOpenChordDetail?: (chord: string) => void;
  transposeOffset: number;
  onTransposeChange: (offset: number) => void;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
  isVirtualGuitarist?: boolean;
  virtualGuitaristMode?: VirtualGuitaristMode;
  onToggleVirtualGuitarist?: () => void;
  onVirtualGuitaristModeChange?: (mode: VirtualGuitaristMode) => void;
}

interface ChordStepEvent {
  lineIdx: number;
  segIdx: number;
  chord: string;
}

export const SongViewer = ({
  song,
  activeChord,
  onSelectChord,
  onOpenChordDetail,
  transposeOffset,
  onTransposeChange,
  isAutoScrolling: externalAutoScroll,
  onToggleAutoScroll,
  isVirtualGuitarist: externalVirtualGuitarist,
  virtualGuitaristMode: externalVirtualMode,
  onToggleVirtualGuitarist,
  onVirtualGuitaristModeChange
}: SongViewerProps) => {
  const [internalAutoScroll, setInternalAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(25); // Speed multiplier (10..80, 25 = 1x tempo)
  const [showYouTube, setShowYouTube] = useState<boolean>(() => Boolean(song.youtubeId));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playheadIdx, setPlayheadIdx] = useState<number>(0);

  // RockStar Cards & Karaoke Stage View states (User toggles)
  const [showRockStarCards, setShowRockStarCards] = useState<boolean>(false);
  const [showKaraokeStage, setShowKaraokeStage] = useState<boolean>(true);

  // Virtual Guitarist local fallback states
  const [internalVirtualGuitarist, setInternalVirtualGuitarist] = useState(false);
  const [internalVirtualMode, setInternalVirtualMode] = useState<VirtualGuitaristMode>('arpeggio');

  const isVirtualGuitarist =
    externalVirtualGuitarist !== undefined
      ? externalVirtualGuitarist
      : internalVirtualGuitarist;
  const virtualMode =
    externalVirtualMode !== undefined ? externalVirtualMode : internalVirtualMode;

  const toggleVirtualGuitarist = () => {
    if (onToggleVirtualGuitarist) {
      onToggleVirtualGuitarist();
    } else {
      const next = !internalVirtualGuitarist;
      setInternalVirtualGuitarist(next);
      if (next) {
        const def = getOrGenerateChord(activeChord);
        guitarAudio.startVirtualGuitarist({
          mode: virtualMode,
          bpm: song.tempo || 96,
          position: def.positions[0]
        });
      } else {
        guitarAudio.stopVirtualGuitarist();
      }
    }
  };

  const handleVirtualModeChange = (newMode: VirtualGuitaristMode) => {
    if (onVirtualGuitaristModeChange) {
      onVirtualGuitaristModeChange(newMode);
    } else {
      setInternalVirtualMode(newMode);
      guitarAudio.setVirtualGuitaristMode(newMode);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const onSelectChordRef = useRef(onSelectChord);
  onSelectChordRef.current = onSelectChord;

  const isAutoScrolling = externalAutoScroll !== undefined ? externalAutoScroll : internalAutoScroll;
  const isAutoScrollingRef = useRef(isAutoScrolling);
  isAutoScrollingRef.current = isAutoScrolling;

  const toggleAutoScroll = () => {
    if (onToggleAutoScroll) {
      onToggleAutoScroll();
    } else {
      setInternalAutoScroll(!internalAutoScroll);
    }
  };

  // Keep YouTube player visible if song has a youtubeId
  useEffect(() => {
    setShowYouTube(Boolean(song.youtubeId));
  }, [song.id, song.youtubeId]);

  const parsedLines = useMemo(
    () => parseChordPro(song.content, transposeOffset),
    [song.content, transposeOffset]
  );
  const uniqueChords = useMemo(
    () => extractUniqueChords(song.content, transposeOffset),
    [song.content, transposeOffset]
  );

  // Ordered sequence of all chord events in the song for automatic live playback
  const chordEvents = useMemo<ChordStepEvent[]>(() => {
    const events: ChordStepEvent[] = [];
    parsedLines.forEach((line, lineIdx) => {
      if (line.type === 'chord-lyric' && line.segments) {
        line.segments.forEach((seg, segIdx) => {
          if (seg.chord) {
            events.push({ lineIdx, segIdx, chord: seg.chord });
          }
        });
      }
    });
    return events;
  }, [parsedLines]);

  const playbackStartTimeRef = useRef<number>(0);
  const playheadIdxRef = useRef(playheadIdx);
  playheadIdxRef.current = playheadIdx;

  // Reset playhead when song changes
  useEffect(() => {
    setPlayheadIdx(0);
    playbackStartTimeRef.current = performance.now();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [song.id]);

  // Initialize and synchronize official YouTube IFrame API Player
  useEffect(() => {
    if (!showYouTube || !song.youtubeId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    const setupPlayer = () => {
      if (isCancelled || !ytContainerRef.current || !(window as any).YT || !(window as any).YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }

      try {
        ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
          width: '100%',
          height: '100%',
          videoId: song.youtubeId,
          playerVars: {
            autoplay: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              ytPlayerRef.current = event.target;
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // 1 = PLAYING
              if (event.data === 1) {
                if (!isAutoScrollingRef.current) {
                  if (onToggleAutoScroll) onToggleAutoScroll();
                  else setInternalAutoScroll(true);
                }
                const cur = event.target.getCurrentTime();
                if (typeof cur === 'number' && !isNaN(cur)) {
                  playbackStartTimeRef.current = performance.now() - cur * 1000;
                }
              } else if (event.data === 2 || event.data === 0) {
                // 2 = PAUSED, 0 = ENDED
                if (isAutoScrollingRef.current) {
                  if (onToggleAutoScroll) onToggleAutoScroll();
                  else setInternalAutoScroll(false);
                }
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to create YouTube player:', err);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupPlayer();
    } else {
      const prevReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        setupPlayer();
      };
    }

    return () => {
      isCancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [showYouTube, song.id, song.youtubeId, onToggleAutoScroll]);

  // Control YouTube player and anchor master clock when auto-play toggles
  useEffect(() => {
    if (isAutoScrolling) {
      // Anchor master clock to current playhead position
      const currentIdx = playheadIdxRef.current;
      if (song.timings && song.timings[currentIdx]) {
        playbackStartTimeRef.current =
          performance.now() - song.timings[currentIdx].time * 1000;
      } else {
        const bpm = song.tempo || 96;
        const stepMs = Math.max(
          480,
          Math.round(((60000 / bpm) * 2.2 * 25) / Math.max(10, scrollSpeed))
        );
        playbackStartTimeRef.current =
          performance.now() - currentIdx * stepMs;
      }

      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        const state = ytPlayerRef.current.getPlayerState?.();
        if (state !== 1) {
          ytPlayerRef.current.playVideo();
        }
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        const state = ytPlayerRef.current.getPlayerState?.();
        if (state === 1) {
          ytPlayerRef.current.pauseVideo();
        }
      }
    }
  }, [isAutoScrolling, song.timings, song.tempo, scrollSpeed]);

  // Continuous Master Clock Ticker: Advances playhead smoothly with 0ms drift
  useEffect(() => {
    if (!isAutoScrolling || chordEvents.length === 0) return;

    const ticker = setInterval(() => {
      let elapsedSec =
        (performance.now() - playbackStartTimeRef.current) / 1000;

      // When YouTube player is active and playing, poll its exact timestamp
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          const ytCur = ytPlayerRef.current.getCurrentTime();
          if (typeof ytCur === 'number' && !isNaN(ytCur)) {
            elapsedSec = ytCur;
            playbackStartTimeRef.current = performance.now() - ytCur * 1000;
          }
        } else if (state === 3) {
          // Buffering: hold position
          return;
        }
      }

      let nextIdx = 0;
      if (song.timings && song.timings.length > 0) {
        // Find matching chord according to millisecond timings
        for (let i = song.timings.length - 1; i >= 0; i--) {
          if (elapsedSec >= song.timings[i].time) {
            nextIdx = i;
            break;
          }
        }

        // Loop back to start if beyond song duration (fallback when no YouTube player)
        if (!ytPlayerRef.current) {
          const lastTime = song.timings[song.timings.length - 1].time;
          if (elapsedSec > lastTime + 4.5) {
            playbackStartTimeRef.current = performance.now();
            nextIdx = 0;
          }
        }
      } else {
        const bpm = song.tempo || 96;
        const stepSec = Math.max(
          0.48,
          ((60 / bpm) * 2.2 * 25) / Math.max(10, scrollSpeed)
        );
        nextIdx =
          Math.floor(elapsedSec / stepSec) % Math.max(1, chordEvents.length);
      }

      if (
        nextIdx !== playheadIdxRef.current &&
        nextIdx >= 0 &&
        nextIdx < chordEvents.length
      ) {
        setPlayheadIdx(nextIdx);
      }
    }, 40);

    return () => clearInterval(ticker);
  }, [isAutoScrolling, chordEvents, song.timings, song.tempo, scrollSpeed]);

  // Automatic Chord Trigger, Sound Strum & Synchronized Scroll on playhead update
  useEffect(() => {
    if (chordEvents.length === 0) return;

    const currentEv = chordEvents[playheadIdx] || chordEvents[0];
    if (currentEv) {
      // If Virtual Guitarist is running, pass silent=true so audio cleanly shifts in the continuous rhythm loop
      const isSilent = !soundEnabled || isVirtualGuitarist;
      onSelectChordRef.current(currentEv.chord, isSilent);

      if (isVirtualGuitarist) {
        const def = getOrGenerateChord(currentEv.chord);
        if (def.positions[0]) {
          guitarAudio.setVirtualGuitaristChord(def.positions[0]);
        }
      }

      const lineEl = lineRefs.current[currentEv.lineIdx];
      if (lineEl && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const targetTop =
          lineEl.offsetTop -
          container.clientHeight * 0.35 +
          lineEl.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth'
        });
      }
    }
  }, [playheadIdx, chordEvents, soundEnabled, isVirtualGuitarist]);

  const handleChordClick = (chord: string, lineIdx?: number, segIdx?: number) => {
    if (lineIdx !== undefined && segIdx !== undefined) {
      const foundIdx = chordEvents.findIndex(
        (ev) => ev.lineIdx === lineIdx && ev.segIdx === segIdx
      );
      if (foundIdx !== -1) {
        setPlayheadIdx(foundIdx);
        if (song.timings && song.timings[foundIdx]) {
          const targetTime = song.timings[foundIdx].time;
          playbackStartTimeRef.current = performance.now() - targetTime * 1000;
          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
            ytPlayerRef.current.seekTo(targetTime, true);
          }
        }
      }
    }
    onSelectChord(chord, isVirtualGuitarist);
    if (onOpenChordDetail) {
      onOpenChordDetail(chord);
    }
  };

  const activeEvent = chordEvents[playheadIdx] || null;
  const upcomingEvent =
    chordEvents.length > 1
      ? chordEvents[(playheadIdx + 1) % chordEvents.length]
      : null;
  const activeLineObj = activeEvent ? parsedLines[activeEvent.lineIdx] : null;

  return (
    <div className="flex flex-col h-full bg-[#0a0e24]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden text-slate-200 select-none">
      {/* 1. Song Header & Studio Action Bar */}
      <div className="p-3 sm:p-3.5 border-b border-white/[0.1] bg-[#0c112e]/90 flex flex-col gap-2.5 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        {/* Tier 1: Title, Metadata & Primary Play Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent tracking-tight truncate">
                {song.title}
              </h2>
              {song.isAiGenerated && (
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-500/50 shrink-0 font-bold shadow-[0_0_12px_rgba(139,92,246,0.35)]">
                  AI RIG
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5 truncate">
              <span className="text-slate-300 font-sans font-medium">{song.artist}</span>
              <span>•</span>
              <span>KEY: <strong className="text-amber-400 font-black">{song.key}</strong></span>
              {song.capo > 0 && <span>• CAPO {song.capo}</span>}
              {song.tempo && <span className="text-cyan-300">• {song.tempo} BPM</span>}
            </div>
          </div>

          {/* Master Play / Autoplay Toggle Button & Speed Slider */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleAutoScroll}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer font-black text-xs active:scale-95 shadow-lg ${
                isAutoScrolling
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 shadow-[0_0_22px_rgba(245,158,11,0.7)] border border-amber-200'
                  : 'bg-white/[0.08] hover:bg-white/[0.15] text-amber-300 hover:text-white border border-amber-400/40 hover:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
              }`}
              title="Şarkıyı başlat ve akorları canlı senkronize çal"
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              <span>{isAutoScrolling ? 'DURDUR' : 'OTOMATİK ÇAL'}</span>
            </button>

            {isAutoScrolling && (!song.timings || song.timings.length === 0) && (
              <div className="flex items-center gap-1 bg-[#10163a]/90 border border-white/[0.1] rounded-full px-2 py-0.5" title="Akor Geçiş Hızı">
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-12 h-1 accent-amber-500 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: Sleek Hardware Pill Rack */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-xs">
          {/* Transpose Controls */}
          <div className="flex items-center bg-[#10163a]/90 border border-white/[0.1] rounded-full px-2.5 py-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <span className="text-slate-400 mr-1 text-[10px] font-bold">TRP:</span>
            <button
              onClick={() => onTransposeChange(transposeOffset - 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="-1 Yarı Ses"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1.5 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
            <button
              onClick={() => onTransposeChange(transposeOffset + 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="+1 Yarı Ses"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            {transposeOffset !== 0 && (
              <button
                onClick={() => onTransposeChange(0)}
                className="ml-1 text-slate-500 hover:text-white p-0.5 cursor-pointer"
                title="Sıfırla"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Virtual Guitarist Live Accompaniment */}
          <div className="flex items-center bg-[#10163a]/90 border border-white/[0.1] rounded-full p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <button
              onClick={toggleVirtualGuitarist}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all cursor-pointer font-black text-[11px] active:scale-95 ${
                isVirtualGuitarist
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(20,184,166,0.65)] border border-teal-200'
                  : 'text-emerald-300 hover:text-white'
              }`}
              title="YouTube şarkısının canlı akustik ritim/arpejini sanal gitaristle çal"
            >
              <Sparkles className="w-3 h-3 fill-current text-amber-300" />
              <span>SANAL GİTAR</span>
            </button>

            {/* Mode Pills */}
            <div className="flex items-center bg-black/50 rounded-full p-0.5 ml-1">
              <button
                onClick={() => handleVirtualModeChange('arpeggio')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                  virtualMode === 'arpeggio'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Akustik parmak stili arpej"
              >
                ARPEJ
              </button>
              <button
                onClick={() => handleVirtualModeChange('strum')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                  virtualMode === 'strum'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Akor ritim vuruşları (Strumming)"
              >
                RİTİM
              </button>
            </div>
          </div>

          {/* Sound Toggle (Gitar Sesi) */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 font-bold text-[11px] ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-[#10163a]/90 text-slate-500 border-white/[0.08] hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Gitar Akor Sesi: Açık' : 'Gitar Akor Sesi: Sessiz'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <VolumeX className="w-3 h-3 text-slate-500" />
            )}
            <span>{soundEnabled ? 'SES AÇIK' : 'SESSİZ'}</span>
          </button>

          {/* Segmented View Mode Toggles (Video, Sahne, Kartlar) */}
          <div className="flex items-center gap-1">
            {song.youtubeId && (
              <button
                onClick={() => setShowYouTube(!showYouTube)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 font-bold text-[10px] ${
                  showYouTube
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-[0_0_14px_rgba(244,63,94,0.4)]'
                    : 'bg-[#10163a]/90 text-slate-400 border-white/[0.08] hover:text-white'
                }`}
                title="YouTube Video Monitörü Aç/Kapat"
              >
                <Video className="w-3 h-3 text-rose-400" />
                <span>VİDEO</span>
              </button>
            )}

            <button
              onClick={() => setShowKaraokeStage(!showKaraokeStage)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 font-bold text-[10px] ${
                showKaraokeStage
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                  : 'bg-[#10163a]/90 text-slate-400 border-white/[0.08] hover:text-white'
              }`}
              title="RockStar Canlı Karaoke Söz Göstergesini Aç/Kapat"
            >
              <Mic className="w-3 h-3 text-amber-400" />
              <span>SAHNE</span>
            </button>

            <button
              onClick={() => setShowRockStarCards(!showRockStarCards)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 font-bold text-[10px] ${
                showRockStarCards
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                  : 'bg-[#10163a]/90 text-slate-400 border-white/[0.08] hover:text-white'
              }`}
              title="RockStar Akor Kartlarını Aç/Kapat"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>KARTLAR</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact YouTube Studio Monitor Frame */}
      {showYouTube && song.youtubeId && (
        <div className="bg-[#080b1e] border-b border-white/[0.1] p-2.5 flex flex-col items-center justify-center relative shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <button
            onClick={() => setShowYouTube(false)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer z-10 transition-colors"
            title="Video Monitörünü Gizle"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-full max-w-sm aspect-video max-h-40 rounded-2xl overflow-hidden border border-white/20 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.85)] relative">
            <div
              ref={ytContainerRef}
              id={`yt-player-${song.id}`}
              className="w-full h-full"
            />
          </div>
          <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] text-cyan-300">
            <Radio className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
            <span className="font-semibold tracking-wider uppercase">YOUTUBE CANLI SENKRON // 0ms DRIFT MASTER CLOCK</span>
          </div>
        </div>
      )}

      {/* 3. RockStar Chord Cards Shelf (Collapsible) */}
      {showRockStarCards && (
        <div className="px-3 py-2 bg-[#0c102a] border-b border-white/[0.1] flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0 shadow-inner">
          <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>AKORLAR:</span>
          </span>
          <div className="flex items-center gap-2">
            {uniqueChords.map((chord) => {
              const isActive = activeChord === chord;
              return (
                <RockStarChordCard
                  key={chord}
                  chordName={chord}
                  isActive={isActive}
                  compact={true}
                  onSelectChord={(c) => handleChordClick(c)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 4. RockStar Sing-Along Live Stage & Karaoke Cockpit (Hero Card) */}
      {showKaraokeStage && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#171f4c]/95 via-[#0e1430]/95 to-[#1c1840]/95 border-b border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_24px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-amber-600/25 border border-amber-400/50 font-mono text-[9px] font-black text-amber-300 uppercase shadow-[0_0_14px_rgba(245,158,11,0.3)]">
                <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>CANLI SAHNE KARAOKE</span>
              </span>
              <span className="font-mono text-[9px] text-cyan-300/90 hidden xs:inline font-semibold">
                {isAutoScrolling ? '• CANLI AKIŞ DEVAM EDİYOR' : '• OYNAT İLE SÖZLER CANLANIR'}
              </span>
            </div>

            {/* Upcoming Next Chord Preview */}
            {upcomingEvent && upcomingEvent.chord !== activeChord && (
              <div className="flex items-center gap-1 font-mono text-[10px] bg-[#141b3e] border border-cyan-400/40 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <span className="text-slate-400 font-bold">SIRADAKİ:</span>
                <span className="font-black text-amber-400">{upcomingEvent.chord}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </div>
            )}
          </div>

          {/* Large Hero Active Singing Phrase */}
          <div className="min-h-[36px] flex items-center">
            {activeLineObj && activeLineObj.type === 'chord-lyric' && activeLineObj.segments ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-base sm:text-lg font-bold font-sans">
                {activeLineObj.segments.map((seg, sIdx) => {
                  const isSegmentActive = activeEvent?.segIdx === sIdx;
                  return (
                    <span
                      key={sIdx}
                      className={`transition-all duration-150 ${
                        isSegmentActive
                          ? 'text-amber-200 font-black scale-105 filter drop-shadow-[0_0_16px_rgba(245,158,11,0.95)]'
                          : 'text-slate-200'
                      }`}
                    >
                      {seg.chord && (
                        <span className="text-xs font-mono font-black text-amber-400 mr-1 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 shadow-sm inline-block">
                          [{seg.chord}]
                        </span>
                      )}
                      {seg.lyric || ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic text-xs font-sans">
                Akor geçişleri ve sözler çalarken canlı vurgulanır.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. EXPANSIVE SCROLLABLE SONG LYRICS & CHORD TELEPROMPTER */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 font-mono text-sm leading-relaxed space-y-3.5 relative bg-[#070918]/95 scroll-smooth"
      >
        {parsedLines.map((line, lineIdx) => {
          if (line.type === 'empty') {
            return <div key={lineIdx} className="h-3" />;
          }

          if (line.type === 'section') {
            return (
              <div
                key={lineIdx}
                className="pt-3 pb-1 border-b border-white/[0.1] text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
                  {line.sectionName}
                </span>
              </div>
            );
          }

          if (line.type === 'chord-lyric' && line.segments) {
            const isLinePlaying = isAutoScrolling && activeEvent?.lineIdx === lineIdx;
            return (
              <div
                key={lineIdx}
                ref={(el) => {
                  lineRefs.current[lineIdx] = el;
                }}
                className={`flex flex-wrap items-end py-2 px-3 rounded-2xl transition-all group border-l-4 ${
                  isLinePlaying
                    ? 'bg-gradient-to-r from-amber-500/25 via-violet-500/15 to-transparent border-amber-400 shadow-[0_4px_28px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] my-1 ring-1 ring-amber-400/30'
                    : 'border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {line.segments.map((seg, segIdx) => {
                  const isExactStepPlaying =
                    isAutoScrolling &&
                    activeEvent?.lineIdx === lineIdx &&
                    activeEvent?.segIdx === segIdx;
                  const isChordActive =
                    isExactStepPlaying ||
                    (!isAutoScrolling &&
                      ((activeEvent?.lineIdx === lineIdx &&
                        activeEvent?.segIdx === segIdx) ||
                        (seg.chord && activeChord === seg.chord)));

                  return (
                    <div key={segIdx} className="flex flex-col items-start mr-3.5 mb-1">
                      {seg.chord ? (
                        <button
                          onClick={() => handleChordClick(seg.chord, lineIdx, segIdx)}
                          className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg transition-all cursor-pointer select-none leading-tight mb-1 border ${
                            isExactStepPlaying
                              ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 border-white ring-2 ring-white shadow-[0_0_24px_rgba(245,158,11,0.95)] scale-110 z-10'
                              : isChordActive
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.65)] scale-105'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400/70 hover:scale-105 shadow-sm'
                          }`}
                          title={`Akoru çal & videoda git: ${seg.chord}`}
                        >
                          {seg.chord}
                        </button>
                      ) : (
                        <div className="h-5" />
                      )}

                      <span
                        className={`text-sm whitespace-pre font-sans transition-all duration-150 ${
                          isExactStepPlaying
                            ? 'text-amber-200 font-black drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] scale-[1.02]'
                            : isLinePlaying
                            ? 'text-white font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {seg.lyric || ' '}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={lineIdx} className="text-slate-400 text-xs italic py-1">
              {line.rawText}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SongViewer;
