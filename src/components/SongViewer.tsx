import { useState, useEffect, useRef, useMemo } from 'react';
import type { Song } from '../types/guitar';
import { parseChordPro, extractUniqueChords } from '../utils/chordPro';
import { STRUM_PATTERNS } from '../data/strumPatterns';
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

  // RockStar Cards & Karaoke Stage View states
  const [showRockStarCards, setShowRockStarCards] = useState<boolean>(true);
  const [showKaraokeStage, setShowKaraokeStage] = useState<boolean>(true);

  // Virtual Guitarist local fallback states & live step telemetry
  const [internalVirtualGuitarist, setInternalVirtualGuitarist] = useState(false);
  const [internalVirtualMode, setInternalVirtualMode] = useState<VirtualGuitaristMode>('arpeggio');
  const [activeVirtualStep, setActiveVirtualStep] = useState<number>(-1);

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

  // Subscribe to virtual guitarist step updates for live visual rhythm pulse
  useEffect(() => {
    const unsubscribe = guitarAudio.onVirtualStep((step) => {
      setActiveVirtualStep(step);
    });
    return unsubscribe;
  }, []);

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

  // Active rhythm pattern
  const defaultPattern = STRUM_PATTERNS[0];

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
    <div className="flex flex-col h-full bg-[#070914]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden text-slate-200 select-none">
      {/* Song Header & Controls Bar */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#090d1c]/90 flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">{song.title}</h2>
            {song.isAiGenerated && (
              <span className="font-mono text-[9px] px-2 py-0.2 rounded-full bg-violet-500/25 text-violet-300 border border-violet-500/40 shrink-0 font-bold shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                AI RIG
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {song.artist} • KEY: <span className="text-amber-400 font-bold">{song.key}</span>
            {song.capo > 0 && ` • CAPO ${song.capo}`}
            {song.tempo && ` • ${song.tempo} BPM`}
          </p>
        </div>

        {/* Toolbar: Transpose + Auto-Play/Scroll + YouTube */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {/* Transpose Controls */}
          <div className="flex items-center bg-[#0d1020]/90 border border-white/[0.08] rounded-full px-2.5 py-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-slate-400 mr-1 text-[10px] font-bold">TRP:</span>
            <button
              onClick={() => onTransposeChange(transposeOffset - 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="-1 Yarı Ses"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1.5 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
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

          {/* Auto-Play & Chord Animation Toggle */}
          <div className="flex items-center bg-[#0d1020]/90 border border-white/[0.08] rounded-full p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <button
              onClick={toggleAutoScroll}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-black text-xs active:scale-95 ${
                isAutoScrolling
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.55)] border border-amber-200'
                  : 'text-slate-200 hover:text-white'
              }`}
              title="Şarkıyı başlat ve akorları otomatik bas"
            >
              {isAutoScrolling ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              <span>{isAutoScrolling ? 'DURDUR' : 'OTOMATİK ÇAL'}</span>
            </button>

            {isAutoScrolling && (
              <div className="flex items-center gap-1 px-2 border-l border-white/[0.08] ml-1">
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-14 h-1 accent-amber-500 bg-slate-800 rounded cursor-pointer"
                  title="Akor Geçiş Hızı"
                />
              </div>
            )}
          </div>

          {/* Virtual Guitarist Live Accompaniment Toggle */}
          <div className="flex items-center bg-[#0d1020]/90 border border-white/[0.08] rounded-full p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <button
              onClick={toggleVirtualGuitarist}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer font-black text-xs active:scale-95 ${
                isVirtualGuitarist
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.6)] border border-teal-200'
                  : 'text-emerald-300 hover:text-white'
              }`}
              title="YouTube şarkısının canlı akustik ritim/arpejini sanal gitaristle çal"
            >
              <Sparkles className="w-3 h-3 fill-current text-amber-300" />
              <span>{isVirtualGuitarist ? 'SANAL GİTARİST' : 'SANAL GİTARİST'}</span>
            </button>

            {/* Mode Pills: Arpej vs Ritim */}
            <div className="flex items-center bg-black/50 rounded-full p-0.5 ml-1">
              <button
                onClick={() => handleVirtualModeChange('arpeggio')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  virtualMode === 'arpeggio'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Akustik parmak stili arpej (Sufle - Pus tarzı)"
              >
                ARPEJ
              </button>
              <button
                onClick={() => handleVirtualModeChange('strum')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  virtualMode === 'strum'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 font-bold ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-[#0d1020]/90 text-slate-500 border-white/[0.08] hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Gitar Akor Sesi: Açık' : 'Gitar Akor Sesi: Sessiz'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <VolumeX className="w-3 h-3 text-slate-500" />
            )}
            <span>{soundEnabled ? 'GİTAR SESİ' : 'SESSİZ'}</span>
          </button>

          {/* RockStar Karaoke Stage View Toggle */}
          <button
            onClick={() => setShowKaraokeStage(!showKaraokeStage)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 font-bold ${
              showKaraokeStage
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-[#0d1020]/90 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title="RockStar Sahne & Canlı Şarkı Sözü Karaoke Modu"
          >
            <Mic className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">{showKaraokeStage ? 'SAHNE: AÇIK' : 'SAHNE'}</span>
            <span className="sm:hidden">SAHNE</span>
          </button>

          {/* RockStar Chord Cards Toggle */}
          <button
            onClick={() => setShowRockStarCards(!showRockStarCards)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 font-bold ${
              showRockStarCards
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-[#0d1020]/90 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title="RockStar Renkli Parmak Şemalı Akor Kartları"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">{showRockStarCards ? 'KARTLAR: AÇIK' : 'KARTLAR'}</span>
            <span className="sm:hidden">KARTLAR</span>
          </button>

          {/* YouTube Video Toggle */}
          {song.youtubeId && (
            <button
              onClick={() => setShowYouTube(!showYouTube)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 font-bold ${
                showYouTube
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-[#0d1020]/90 text-slate-400 border-white/[0.08] hover:text-white'
              }`}
            >
              <Video className="w-3 h-3 text-rose-400" />
              <span>{showYouTube ? 'VİDEO AÇIK' : 'YOUTUBE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded YouTube Play-Along Player */}
      {showYouTube && song.youtubeId && (
        <div className="bg-[#070a16] border-b border-white/[0.08] p-3 flex flex-col items-center justify-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <button
            onClick={() => setShowYouTube(false)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white cursor-pointer z-10 transition-colors"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.8)] relative">
            <div
              ref={ytContainerRef}
              id={`yt-player-${song.id}`}
              className="w-full h-full"
            />
          </div>
          <p className="text-[10px] text-cyan-300/90 mt-2 font-mono flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
            <span>YOUTUBE CANLI SENKRON // Şarkıyı dinlerken sözler ve akorlar milisaniyelik akar.</span>
          </p>
        </div>
      )}

      {/* RockStar High-Craft Chord Cards Shelf (or fallback pills) */}
      {showRockStarCards ? (
        <div className="px-3.5 py-2.5 bg-[#090c1a] border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ROCKSTAR KARTLARI:</span>
            <span className="sm:hidden">AKORLAR:</span>
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
      ) : (
        /* Minimal Pills Mode */
        <div className="px-3.5 py-2 bg-[#090c1a] border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 font-bold">
            AKORLAR:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {uniqueChords.map((chord) => {
              const isActive = activeChord === chord;
              return (
                <button
                  key={chord}
                  onClick={() => handleChordClick(chord)}
                  className={`px-3 py-1 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.6)] scale-105 border border-amber-200'
                      : 'bg-[#12162a] text-amber-300 border border-white/10 hover:border-amber-400/50 hover:bg-[#1a203a]'
                  }`}
                >
                  {chord}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RockStar Sing-Along Live Stage & Karaoke Cockpit */}
      {showKaraokeStage && (
        <div className="px-4 py-3 bg-gradient-to-r from-[#111738]/95 via-[#0d1124]/95 to-[#161230]/95 border-b border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.4)] flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 font-mono text-[10px] font-black text-amber-300 uppercase shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>ROCKSTAR CANLI SAHNE // KARAOKE</span>
              </span>
              <span className="font-mono text-[10px] text-cyan-300/80 hidden xs:inline font-semibold">
                {isAutoScrolling ? 'ŞARKI AKIYOR' : 'PLAY İLE CANLI AKIŞI BAŞLATIN'}
              </span>
            </div>

            {/* Upcoming Next Chord Preview */}
            {upcomingEvent && upcomingEvent.chord !== activeChord && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#121836] border border-cyan-400/40 px-3 py-0.5 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <span className="text-slate-400 font-bold">SIRADAKİ:</span>
                <span className="font-black text-amber-400">{upcomingEvent.chord}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </div>
            )}
          </div>

          {/* Large Hero Active Singing Phrase */}
          <div className="py-0.5 min-h-[42px] flex items-center">
            {activeLineObj && activeLineObj.type === 'chord-lyric' && activeLineObj.segments ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base sm:text-lg font-bold font-sans">
                {activeLineObj.segments.map((seg, sIdx) => {
                  const isSegmentActive = activeEvent?.segIdx === sIdx;
                  return (
                    <span
                      key={sIdx}
                      className={`transition-all duration-150 ${
                        isSegmentActive
                          ? 'text-amber-300 font-black scale-105 filter drop-shadow-[0_0_16px_rgba(245,158,11,0.95)]'
                          : 'text-slate-200'
                      }`}
                    >
                      {seg.chord && (
                        <span className="text-xs font-mono font-black text-amber-400 mr-1.5 px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-400/40 shadow-sm inline-block">
                          [{seg.chord}]
                        </span>
                      )}
                      {seg.lyric || ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm font-sans">
                Akor geçişleri ve sözler çalarken canlı vurgulanır.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 16-Step Strumming & Fingerpicking Visualizer Strip */}
      <div className="px-3.5 py-1.5 bg-[#070914] border-b border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-slate-400 uppercase shrink-0 font-bold">
            {isVirtualGuitarist
              ? virtualMode === 'arpeggio'
                ? 'ARPEJ:'
                : 'RİTİM:'
              : 'STRUM:'}
          </span>
          <div className="flex items-center gap-1">
            {isVirtualGuitarist && virtualMode === 'arpeggio'
              ? ['P (Bas)', 'i (3)', 'm (2)', 'a (1)', 'm (2)', 'i (3)', 'm (2)', 'a (1)'].map((lbl, i) => {
                  const isCurrent = activeVirtualStep === i;
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 border-emerald-200 font-black shadow-[0_0_14px_rgba(52,211,153,0.9)] scale-110'
                          : i === 0
                          ? 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {lbl}
                    </span>
                  );
                })
              : defaultPattern.strokes.map((stroke, i) => {
                  const isCurrent = isVirtualGuitarist && activeVirtualStep === i;
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-200 font-black shadow-[0_0_14px_rgba(245,158,11,0.9)] scale-110'
                          : stroke.accent
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                          : stroke.type === 'rest'
                          ? 'bg-black/50 border-white/5 text-slate-600'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      {stroke.label}
                    </span>
                  );
                })}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isVirtualGuitarist && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
            </span>
          )}
          <span className={`font-bold ${isVirtualGuitarist ? 'text-emerald-300' : 'text-slate-400'}`}>
            {isVirtualGuitarist
              ? `CANLI EŞLİK: ${song.tempo || 96} BPM // ${virtualMode === 'arpeggio' ? 'PARMAK ARPEJ' : 'RİTİM'}`
              : isAutoScrolling
              ? `CANLI AKIŞ: ${playheadIdx + 1}/${chordEvents.length}`
              : '4/4 RİTİM'}
          </span>
        </div>
      </div>

      {/* Scrollable Song Lyrics & Moises ChordPro Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed space-y-4 relative bg-[#060812]"
      >
        {parsedLines.map((line, lineIdx) => {
          if (line.type === 'empty') {
            return <div key={lineIdx} className="h-3.5" />;
          }

          if (line.type === 'section') {
            return (
              <div
                key={lineIdx}
                className="pt-4 pb-1.5 border-b border-white/[0.08] text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                <span>{line.sectionName}</span>
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
                className={`flex flex-wrap items-end py-2.5 px-3.5 rounded-2xl transition-all group border-l-4 ${
                  isLinePlaying
                    ? 'bg-gradient-to-r from-amber-500/20 via-violet-500/12 to-transparent border-amber-400 shadow-[inset_0_0_32px_rgba(245,158,11,0.12),0_4px_20px_rgba(0,0,0,0.3)] my-1'
                    : 'border-transparent hover:bg-white/[0.03]'
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
                    <div key={segIdx} className="flex flex-col items-start mr-3">
                      {seg.chord ? (
                        <button
                          onClick={() => handleChordClick(seg.chord, lineIdx, segIdx)}
                          className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg transition-all cursor-pointer select-none leading-tight mb-1 border ${
                            isExactStepPlaying
                              ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 border-white ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.95)] scale-110'
                              : isChordActive
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                              : 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400/60 hover:scale-105'
                          }`}
                          title={`Akoru çal: ${seg.chord}`}
                        >
                          {seg.chord}
                        </button>
                      ) : (
                        <div className="h-5" />
                      )}

                      <span
                        className={`text-sm whitespace-pre font-sans transition-colors ${
                          isExactStepPlaying
                            ? 'text-amber-200 font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : isLinePlaying
                            ? 'text-white font-semibold'
                            : 'text-slate-200'
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
            <div key={lineIdx} className="text-slate-400 text-xs italic">
              {line.rawText}
            </div>
          );
        })}
      </div>
    </div>
  );
};
