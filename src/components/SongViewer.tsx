import { useState, useEffect, useRef, useMemo } from 'react';
import type { Song } from '../types/guitar';
import { parseChordPro, extractUniqueChords } from '../utils/chordPro';
import { STRUM_PATTERNS } from '../data/strumPatterns';
import { guitarAudio } from '../audio/guitarAudio';
import { getOrGenerateChord } from '../data/chordLibrary';
import { Play, Pause, ChevronUp, ChevronDown, RotateCcw, X, Radio, Video, Volume2, VolumeX } from 'lucide-react';

interface SongViewerProps {
  song: Song;
  activeChord: string;
  onSelectChord: (chord: string, silent?: boolean) => void;
  onOpenChordDetail?: (chord: string) => void;
  transposeOffset: number;
  onTransposeChange: (offset: number) => void;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
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
  onToggleAutoScroll
}: SongViewerProps) => {
  const [internalAutoScroll, setInternalAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(25); // Speed multiplier (10..80, 25 = 1x tempo)
  const [showYouTube, setShowYouTube] = useState<boolean>(() => Boolean(song.youtubeId));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playheadIdx, setPlayheadIdx] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const onSelectChordRef = useRef(onSelectChord);
  onSelectChordRef.current = onSelectChord;

  const isAutoScrolling = externalAutoScroll !== undefined ? externalAutoScroll : internalAutoScroll;
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
  const isAutoScrollingRef = useRef(isAutoScrolling);
  isAutoScrollingRef.current = isAutoScrolling;

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

      // Send play command to YouTube iframe if embedded
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
    } else {
      // Send pause command to YouTube iframe if embedded
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
    }
  }, [isAutoScrolling, song.timings, song.tempo, scrollSpeed]);

  // Continuous Master Clock Ticker: Advances playhead smoothly without freezing
  useEffect(() => {
    if (!isAutoScrolling || chordEvents.length === 0) return;

    const ticker = setInterval(() => {
      const elapsedSec =
        (performance.now() - playbackStartTimeRef.current) / 1000;

      let nextIdx = 0;
      if (song.timings && song.timings.length > 0) {
        // Find matching chord according to millisecond timings
        for (let i = song.timings.length - 1; i >= 0; i--) {
          if (elapsedSec >= song.timings[i].time) {
            nextIdx = i;
            break;
          }
        }

        // Loop back to start if beyond song duration
        const lastTime = song.timings[song.timings.length - 1].time;
        if (elapsedSec > lastTime + 4.5) {
          playbackStartTimeRef.current = performance.now();
          nextIdx = 0;
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
    }, 60);

    return () => clearInterval(ticker);
  }, [isAutoScrolling, chordEvents, song.timings, song.tempo, scrollSpeed]);

  // Automatic Chord Trigger, Sound Strum & Synchronized Scroll on playhead update
  useEffect(() => {
    if (chordEvents.length === 0) return;

    const currentEv = chordEvents[playheadIdx] || chordEvents[0];
    if (currentEv) {
      // Pass !soundEnabled as silent flag so audio only strums ONCE cleanly via handleSelectChord
      onSelectChordRef.current(currentEv.chord, !soundEnabled);

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
  }, [playheadIdx, chordEvents, soundEnabled]);

  // Real-time synchronization and polling with YouTube IFrame
  useEffect(() => {
    if (!showYouTube || !song.youtubeId) return;

    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info) {
          const { currentTime, playerState } = data.info;

          // State synchronization (1 = playing, 2 = paused, 0 = ended)
          if (typeof playerState === 'number') {
            if (playerState === 1 && !isAutoScrollingRef.current) {
              if (onToggleAutoScroll) onToggleAutoScroll();
              else setInternalAutoScroll(true);
            } else if (
              (playerState === 2 || playerState === 0) &&
              isAutoScrollingRef.current
            ) {
              if (onToggleAutoScroll) onToggleAutoScroll();
              else setInternalAutoScroll(false);
            }
          }

          // Calibrate master clock to exact YouTube timestamp if drift occurs
          if (typeof currentTime === 'number' && !isNaN(currentTime)) {
            const localElapsed =
              (performance.now() - playbackStartTimeRef.current) / 1000;
            if (Math.abs(localElapsed - currentTime) > 0.35) {
              playbackStartTimeRef.current =
                performance.now() - currentTime * 1000;
            }
          }
        }
      } catch {
        // Ignore non-json postMessages
      }
    };

    window.addEventListener('message', handleMessage);

    // Active polling to keep YouTube iframe clock aligned
    const pollTimer = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        '*'
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'getCurrentTime',
          args: []
        }),
        '*'
      );
    }, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollTimer);
    };
  }, [showYouTube, song.youtubeId, onToggleAutoScroll]);

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
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [targetTime, true]
            }),
            '*'
          );
        }
      }
    }
    onSelectChord(chord);
    const def = getOrGenerateChord(chord);
    if (def.positions[0]) {
      guitarAudio.strumChord(def.positions[0], 'down', 22);
    }
    if (onOpenChordDetail) {
      onOpenChordDetail(chord);
    }
  };

  const activeEvent = chordEvents[playheadIdx] || null;

  return (
    <div className="flex flex-col h-full bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden text-slate-200 select-none">
      {/* Song Header & Controls Bar */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#090b10] flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">{song.title}</h2>
            {song.isAiGenerated && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
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
          <div className="flex items-center bg-[#131620] border border-white/[0.08] rounded-full px-2 py-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-slate-500 mr-1 text-[10px]">TRP:</span>
            <button
              onClick={() => onTransposeChange(transposeOffset - 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="-1 Yarı Ses"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
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
          <div className="flex items-center bg-[#131620] border border-white/[0.08] rounded-full p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <button
              onClick={toggleAutoScroll}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-bold active:scale-95 ${
                isAutoScrolling
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white'
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

          {/* Sound Toggle (Gitar Sesi) */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
              soundEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-[#131620] text-slate-500 border-white/[0.08] hover:text-slate-300'
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

          {/* YouTube Video Toggle */}
          {song.youtubeId && (
            <button
              onClick={() => setShowYouTube(!showYouTube)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
                showYouTube
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                  : 'bg-[#131620] text-slate-400 border-white/[0.08] hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>{showYouTube ? 'VİDEO AÇIK' : 'YOUTUBE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded YouTube Play-Along Player */}
      {showYouTube && song.youtubeId && (
        <div className="bg-[#090a0f] border-b border-white/10 p-3 flex flex-col items-center justify-center relative">
          <button
            onClick={() => setShowYouTube(false)}
            className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-full max-w-lg aspect-video rounded-lg overflow-hidden border border-white/10 bg-black shadow-xl">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
              title={song.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 text-red-400 animate-pulse" />
            <span>YOUTUBE PLAY-ALONG // Şarkıyı dinlerken aşağıdaki akorları takip edin.</span>
          </p>
        </div>
      )}

      {/* Moises Quick Chord Tray Bar */}
      <div className="px-3.5 py-2 bg-[#0e1017] border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
          AKORLAR:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {uniqueChords.map((chord) => {
            const isActive = activeChord === chord;
            return (
              <button
                key={chord}
                onClick={() => handleChordClick(chord)}
                className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/35 scale-105'
                    : 'bg-[#191c26] text-amber-400 border border-white/10 hover:border-amber-500/50 hover:bg-[#222634]'
                }`}
              >
                {chord}
              </button>
            );
          })}
        </div>
      </div>

      {/* 16-Step Strumming Visualizer Strip */}
      <div className="px-3.5 py-1.5 bg-[#090a0f] border-b border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">STRUM:</span>
          <div className="flex items-center gap-0.5">
            {defaultPattern.strokes.map((stroke, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.2 rounded border ${
                  stroke.accent
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                    : stroke.type === 'rest'
                    ? 'bg-black/40 border-white/5 text-slate-600'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {stroke.label}
              </span>
            ))}
          </div>
        </div>
        <span className="text-slate-400 font-bold">
          {isAutoScrolling
            ? `CANLI AKIŞ: ${playheadIdx + 1}/${chordEvents.length}`
            : '4/4 RİTİM'}
        </span>
      </div>

      {/* Scrollable Song Lyrics & Moises ChordPro Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed space-y-4 relative bg-[#090a0f]"
      >
        {parsedLines.map((line, lineIdx) => {
          if (line.type === 'empty') {
            return <div key={lineIdx} className="h-3.5" />;
          }

          if (line.type === 'section') {
            return (
              <div
                key={lineIdx}
                className="pt-4 pb-1.5 border-b border-white/10 text-amber-400/95 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
                className={`flex flex-wrap items-end py-2 px-3 rounded-lg transition-all group border-l-2 ${
                  isLinePlaying
                    ? 'bg-amber-500/10 border-amber-400 shadow-[inset_0_0_24px_rgba(245,158,11,0.08)]'
                    : 'border-transparent hover:bg-white/[0.02]'
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
                    <div key={segIdx} className="flex flex-col items-start mr-2.5">
                      {seg.chord ? (
                        <button
                          onClick={() => handleChordClick(seg.chord, lineIdx, segIdx)}
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer select-none leading-tight mb-1 border ${
                            isExactStepPlaying
                              ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.85)] scale-110'
                              : isChordActive
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105'
                              : 'bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.35)] text-amber-400 hover:bg-amber-500/25'
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
                            ? 'text-amber-300 font-semibold'
                            : isLinePlaying
                            ? 'text-white'
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
