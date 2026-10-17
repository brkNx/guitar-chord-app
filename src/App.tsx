import { useState, useEffect, useMemo } from 'react';
import type { Song, FretboardDisplayMode, FretboardViewMode } from './types/guitar';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { getOrGenerateChord, NOTES, getNoteAtFret } from './data/chordLibrary';
import { guitarAudio, type VirtualGuitaristMode } from './audio/guitarAudio';
import { getCapoRecommendation } from './utils/transpose';
import { extractUniqueChords } from './utils/chordPro';
import { GUITAR_TUNINGS, getTuningById } from './data/tunings';
import { getChordTheoryDetails, type ChordTone } from './utils/chordTheory';
import { GUITAR_SCALES, getScaleNotes, getScaleNoteInfo, extractRootNote } from './data/scales';
import { CAGED_BOXES, getCagedBoxFretRange, getFretShapesIntervalStyle } from './data/caged';
import { STRUM_PATTERNS } from './data/strumPatterns';
import { generateSongWithAI } from './services/aiChordGenerator';

import { SongViewer } from './components/SongViewer';
import { SongSearchModal } from './components/SongSearchModal';
import { CustomSongModal } from './components/CustomSongModal';
import { ChordDictionaryModal } from './components/ChordDictionaryModal';
import { ChordDetailModal } from './components/ChordDetailModal';
import { GuitarTunerModal } from './components/GuitarTunerModal';
import { Metronome } from './components/Metronome';
import { GuitarStage } from './components/stage/GuitarStage';
import './App.css';

import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Video,
  BookOpen,
  Sparkles,
  Radio
} from 'lucide-react';

const STORAGE_CUSTOM_SONGS = 'guitar_app_custom_songs';

export function App() {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_SONGS);
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        const sampleIds = new Set(SAMPLE_SONGS.map((s) => s.id));
        const cleaned = parsed.filter(
          (s) =>
            s.isCustom &&
            !sampleIds.has(s.id) &&
            !s.content?.includes('Step in the room with the') &&
            !s.content?.includes('Rüzgar eser yine') &&
            !s.content?.includes('1. Ölçü (') &&
            !s.artist?.toLowerCase().includes('sagopa') &&
            !s.content?.toLowerCase().includes('keklik') &&
            s.youtubeId !== 'kNFw6pvfv7E'
        );
        localStorage.setItem(STORAGE_CUSTOM_SONGS, JSON.stringify(cleaned));
        return [...cleaned, ...SAMPLE_SONGS];
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_SONGS;
  });

  const [currentSong, setCurrentSong] = useState<Song>(SAMPLE_SONGS[0]);
  const [activeChord, setActiveChord] = useState<string>(SAMPLE_SONGS[0].key || 'Bm');
  const [positionIdx, setPositionIdx] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>('degrees');
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [selectedTuningId, setSelectedTuningId] = useState<string>('standard');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('minor_pentatonic');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('acoustic_fingerpicking_4_4');
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [isVirtualGuitarist, setIsVirtualGuitarist] = useState<boolean>(false);
  const [virtualGuitaristMode, setVirtualGuitaristMode] = useState<VirtualGuitaristMode>('arpeggio');

  // Left column tab: 'theory' | 'setlist' | 'scales'
  const [leftTab, setLeftTab] = useState<'theory' | 'setlist' | 'scales'>('theory');

  // Mobile studio view tab: 'stage' | 'lyrics' | 'theory'
  const [mobileTab, setMobileTab] = useState<'stage' | 'lyrics' | 'theory'>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'lyrics' || t === 'theory') return t;
    }
    return 'stage';
  });

  // Search, custom & chord modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [fretboardViewMode, setFretboardViewMode] = useState<FretboardViewMode>('chord');
  const [selectedCagedBox, setSelectedCagedBox] = useState<number>(1);
  const [scaleRootNote, setScaleRootNote] = useState<string>('A');
  const [detailChord, setDetailChord] = useState<string>('Am');
  const [quickInput, setQuickInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenChordDetail = (chordName?: string) => {
    setDetailChord(chordName || activeChord);
    setIsDetailOpen(true);
  };

  // Active chord definition & theory details
  const chordDef = getOrGenerateChord(activeChord);
  const currentPosition = chordDef.positions[positionIdx] || chordDef.positions[0];
  const theory = getChordTheoryDetails(activeChord, currentPosition);

  // Scale data
  const activeScale = GUITAR_SCALES.find((s) => s.id === selectedScaleId) || GUITAR_SCALES[0];

  // Strum pattern data
  const activePattern = STRUM_PATTERNS.find((p) => p.id === selectedPatternId) || STRUM_PATTERNS[0];
  const [isPlayingStrumSeq, setIsPlayingStrumSeq] = useState(false);

  // Capo recommendation & unique chords in current song
  const capoAdvice = getCapoRecommendation(currentSong.key);
  const songChords = useMemo(
    () => extractUniqueChords(currentSong.content, transposeOffset, currentSong.key),
    [currentSong.content, transposeOffset, currentSong.key]
  );

  // Update Web Audio tuning
  useEffect(() => {
    const tuning = getTuningById(selectedTuningId);
    guitarAudio.setTuningFrequencies(tuning.frequencies);
  }, [selectedTuningId]);

  // Synchronize Virtual Guitarist with active song tempo and pattern
  useEffect(() => {
    if (isVirtualGuitarist) {
      guitarAudio.setVirtualGuitaristBpm(currentSong.tempo || 96);
      const def = getOrGenerateChord(activeChord);
      if (def.positions[0]) {
        guitarAudio.setVirtualGuitaristChord(def.positions[0]);
      }
    }
  }, [currentSong.id, currentSong.tempo, isVirtualGuitarist, activeChord]);

  useEffect(() => {
    guitarAudio.setVirtualGuitaristPattern(selectedPatternId);
  }, [selectedPatternId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleVirtualGuitarist = async () => {
    const next = !isVirtualGuitarist;
    setIsVirtualGuitarist(next);
    if (next) {
      await guitarAudio.startVirtualGuitarist({
        mode: virtualGuitaristMode,
        bpm: currentSong.tempo || 96,
        position: currentPosition,
        patternId: selectedPatternId,
        timeSignature: (activePattern.timeSignature as any) || '4/4',
      });
      showToast(
        `🎸 SANAL GİTARİST: ${virtualGuitaristMode === 'arpeggio' ? 'Parmak Stili Arpej' : 'Canlı Ritim'} Başlatıldı (${currentSong.tempo || 96} BPM)`
      );
    } else {
      guitarAudio.stopVirtualGuitarist();
      showToast('Sanal gitarist durduruldu.');
    }
  };

  const handleVirtualGuitaristModeChange = (mode: VirtualGuitaristMode) => {
    setVirtualGuitaristMode(mode);
    guitarAudio.setVirtualGuitaristMode(mode);
    if (isVirtualGuitarist) {
      showToast(`Mod: ${mode === 'arpeggio' ? 'Akustik Parmak Arpeji' : 'Canlı Ritim Strum'}`);
    }
  };

  const handleSelectChord = (chord: string, silent = false) => {
    setActiveChord(chord);
    setPositionIdx(0);
    const r = extractRootNote(chord);
    if (r) setScaleRootNote(r);
    const def = getOrGenerateChord(chord);
    const pos = def.positions[0];
    if (pos) {
      if (isVirtualGuitarist) {
        guitarAudio.setVirtualGuitaristChord(pos);
      } else if (!silent) {
        guitarAudio.strumChord(pos, 'down', 22);
      }
    }
  };

  const handleSelectSong = (song: Song) => {
    setSongs((prev) => {
      if (!prev.some((s) => s.id === song.id)) {
        const next = [song, ...prev];
        try {
          const customOnly = next.filter((s) => s.isCustom);
          localStorage.setItem(STORAGE_CUSTOM_SONGS, JSON.stringify(customOnly));
        } catch (e) {
          console.error(e);
        }
        return next;
      }
      return prev;
    });

    setCurrentSong(song);
    setTransposeOffset(0);

    const firstChordMatch = song.content.match(/\[([A-G][^\]]*)\]/);
    if (firstChordMatch && firstChordMatch[1]) {
      handleSelectChord(firstChordMatch[1]);
    }
  };

  const handleSaveCustomSong = (newSong: Song) => {
    const updated = [newSong, ...songs.filter((s) => s.id !== newSong.id)];
    setSongs(updated);
    setCurrentSong(newSong);
    setTransposeOffset(0);

    const firstChordMatch = newSong.content.match(/\[([A-G][^\]]*)\]/);
    if (firstChordMatch && firstChordMatch[1]) {
      handleSelectChord(firstChordMatch[1]);
    }

    try {
      const customOnly = updated.filter((s) => s.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_SONGS, JSON.stringify(customOnly));
    } catch (e) {
      console.error(e);
    }
    showToast(`"${newSong.title}" kütüphaneye eklendi.`);
  };

  const handleQuickAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const newSong = await generateSongWithAI(quickInput.trim());
      handleSaveCustomSong(newSong);
      setQuickInput('');
      showToast(`AI RIG: "${newSong.title}" hazırlandı.`);
    } catch (err) {
      console.error(err);
      showToast('Akor çıkarma başarısız oldu.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePlayStrumSequence = async () => {
    if (!currentPosition || isPlayingStrumSeq) return;
    setIsPlayingStrumSeq(true);
    const msPerBeat = (60 / (activePattern.defaultBpm || 96)) * 480;

    for (let i = 0; i < activePattern.strokes.length; i++) {
      const stroke = activePattern.strokes[i];
      if (stroke.type === 'down') {
        guitarAudio.strumChord(currentPosition, 'down', 20);
      } else if (stroke.type === 'up') {
        guitarAudio.strumChord(currentPosition, 'up', 20);
      } else if (stroke.type === 'bass') {
        guitarAudio.strumBass(currentPosition);
      }
      await new Promise((r) => setTimeout(r, msPerBeat));
    }
    setIsPlayingStrumSeq(false);
  };

  // Keyboard shortcut: Cmd+K or '/' opens search, 'T' opens tuner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isSearchOpen && !isCustomOpen)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.key === 't' || e.key === 'T') && !isTunerOpen) {
        e.preventDefault();
        setIsTunerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isCustomOpen, isTunerOpen]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-studio-ambient text-slate-100 flex flex-col font-sans select-none studio-layout">
      {/* 1. 21st.dev / SOUNDSLICE 52px HARDWARE MASTER TRANSPORT BAR */}
      <header className="h-[52px] bg-[#0a0e26]/90 backdrop-blur-2xl px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-40 select-none shrink-0 border-b border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
        {/* Left: Studio Branding & WebAudio Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-amber-500/20 border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
            </span>
            <span className="font-mono text-xs font-black tracking-tight bg-gradient-to-r from-amber-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
              MOISES
            </span>
            <span className="hidden sm:inline font-mono text-xs font-bold tracking-tight text-slate-200">
              // SOUNDSLICE
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-violet-200 border border-violet-400/50 font-bold shadow-sm">
              PRO
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-200 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
            </span>
            <span className="text-emerald-400 font-bold">48kHz</span>
            <span className="text-emerald-300/80">DSP</span>
          </div>
        </div>

        {/* Center: Hardware Controls (Play, Metronome, Transpose, Capo, Tuning, Handedness) */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs shrink-0">
          {/* Global Play / Autoscroll Button */}
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-black text-xs active:scale-95 shadow-md ${
              isAutoScrolling
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 shadow-[0_0_22px_rgba(245,158,11,0.6)] border border-amber-200'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] hover:border-amber-400/50 hover:shadow-[0_0_14px_rgba(245,158,11,0.25)]'
            }`}
            title="Auto-scroll ve canlı ritim oynat"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            <span className="hidden xs:inline">{isAutoScrolling ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Virtual Guitarist Live Accompaniment Transport Button */}
          <button
            onClick={handleToggleVirtualGuitarist}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-black active:scale-95 text-xs shadow-md ${
              isVirtualGuitarist
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.65)] border border-teal-200'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-emerald-300 hover:text-emerald-200 border border-emerald-500/35 hover:border-emerald-400/60 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)]'
            }`}
            title="YouTube şarkısının akustik ritim/arpejini sanal gitaristle canlı çal"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span className="hidden sm:inline">
              {isVirtualGuitarist ? 'SANAL GİTAR: AÇIK' : 'SANAL GİTAR'}
            </span>
            <span className="sm:hidden">
              {isVirtualGuitarist ? 'SANAL' : 'SANAL'}
            </span>
          </button>

          {/* Soundslice Hardware Metronome Module */}
          <Metronome initialBpm={currentSong.tempo || 100} />

          {/* Transpose Steppers */}
          <div className="hidden sm:flex items-center bg-[#0d1020]/90 border border-white/[0.08] rounded-full px-2.5 py-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-400 mr-1 font-bold">TRP:</span>
            <button
              onClick={() => setTransposeOffset(transposeOffset - 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="-1 Yarı Ses"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1.5 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
            <button
              onClick={() => setTransposeOffset(transposeOffset + 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="+1 Yarı Ses"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Master Tuning Selector */}
          <div className="hidden md:flex items-center gap-1 bg-[#0d1020]/90 border border-white/[0.08] px-2.5 py-1 rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-400 font-bold">TUNING:</span>
            <select
              value={selectedTuningId}
              onChange={(e) => setSelectedTuningId(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {GUITAR_TUNINGS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0e1224] text-white">
                  {t.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Capo Indicator */}
          <div className="hidden xl:flex items-center gap-1 bg-[#0d1020]/90 border border-white/[0.08] px-2.5 py-1 rounded-full text-[11px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-400 font-bold">CAPO:</span>
            <span className="font-bold text-amber-400">
              {currentSong.capo > 0 ? `${currentSong.capo}` : '0'}
            </span>
            {capoAdvice.recommendedCapo > 0 && currentSong.capo === 0 && (
              <span className="text-[9px] text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded-full border border-amber-500/30" title={capoAdvice.reason}>
                Öneri: {capoAdvice.recommendedCapo}
              </span>
            )}
          </div>

          {/* Left-Handed Toggle */}
          <button
            onClick={() => setIsLeftHanded(!isLeftHanded)}
            className={`hidden sm:block px-2.5 py-1 rounded-full border text-[10px] font-mono transition-all active:scale-95 cursor-pointer font-bold ${
              isLeftHanded
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-[#0d1020]/90 text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title="Solak gitarist klavye modu"
          >
            {isLeftHanded ? 'LH' : 'RH'}
          </button>
        </div>

        {/* Right: Tuner, Cmd+K Quick Search, Chords Dictionary & Add Song */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsTunerOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 hover:border-emerald-400 text-xs font-black text-emerald-300 transition-all cursor-pointer active:scale-95 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
            title="Guitartuna Canlı Gitar Akort Cihazı (T)"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">AKORT</span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 bg-emerald-500/30 rounded text-emerald-200 border border-emerald-400/40 hidden lg:inline font-bold">
              TUNER
            </span>
          </button>

          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/40 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
            title="Akor Kütüphanesi & Sözlük"
          >
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline">AKORLAR</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-xs font-semibold text-slate-200 transition-all cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            title="Şarkı Ara (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ŞARKI ARA</span>
            <kbd className="hidden lg:inline px-1.5 py-0.2 bg-black/40 border border-white/[0.08] rounded text-[9px] text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setIsCustomOpen(true)}
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 hover:brightness-110 text-white text-xs font-black transition-all cursor-pointer shadow-[0_0_18px_rgba(168,85,247,0.4)] active:scale-95 border border-fuchsia-400/40"
            title="Yeni Şarkı Ekle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">EKLE</span>
          </button>
        </div>
      </header>

      {/* 2. MOISES 3-COLUMN STUDIO GRID WORKSPACE (Desktop) / TABBED VIEW (Mobile) */}
      <div className="flex-1 studio-grid h-[calc(100vh-52px)] overflow-hidden">
        {/* SOL SÜTUN (275px): KÜTÜPHANE & TEORİ PANELİ */}
        <aside className={`${mobileTab === 'theory' ? 'flex' : 'hidden'} lg:flex w-full h-full flex-col bg-[#0a0e26]/95 backdrop-blur-2xl border-r border-white/[0.12] overflow-hidden select-none`}>
          {/* Navigation Tabs */}
          <div className="p-2.5 border-b border-white/[0.1] bg-[#0c112e]/90 shadow-sm">
            <div className="p-1 bg-[#10163a] border border-white/[0.1] rounded-2xl grid grid-cols-3 gap-1 font-mono text-[10px]">
              {(['theory', 'setlist', 'scales'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeftTab(tab)}
                  className={`py-1.5 rounded-xl border text-center transition-all uppercase cursor-pointer font-bold ${
                    leftTab === tab
                      ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 border-cyan-400/60 text-white shadow-[0_0_18px_rgba(139,92,246,0.45)] font-black'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab === 'theory' ? 'TEORİ' : tab === 'setlist' ? 'LİSTE' : 'GAMLAR'}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: MOISES / OOLIMO CHORD THEORY & 6-STRING MATRIX */}
          {leftTab === 'theory' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              {/* Active Chord Summary Card */}
              <div
                onClick={() => handleOpenChordDetail(activeChord)}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-[#182046] via-[#121838] to-[#0e122a] border border-violet-500/30 hover:border-amber-400/70 space-y-1.5 transition-all cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]"
                title="Detaylı akor analizini aç"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent group-hover:scale-105 transition-transform drop-shadow-[0_0_14px_rgba(245,158,11,0.6)]">
                      {activeChord}
                    </span>
                    <span className="text-[9px] text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 font-bold shadow-sm">
                      [DETAY ↗]
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/25 border border-violet-400/50 text-violet-200 font-bold shadow-sm">
                    {theory.typeCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
                  {theory.fullName} • <span className="text-cyan-300 font-medium">{theory.mood}</span>
                </p>
              </div>

              {/* Quick Chord Dictionary Button */}
              <button
                onClick={() => setIsDictionaryOpen(true)}
                className="w-full py-2 px-2.5 bg-gradient-to-r from-[#141930] to-[#101426] hover:from-[#1b2242] hover:to-[#171b33] border border-amber-500/30 hover:border-amber-400/60 rounded-xl text-[10px] font-black text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>TÜM AKORLAR SÖZLÜĞÜ (KÜTÜPHANE)</span>
              </button>

              {/* Intervals Breakdown */}
              <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between font-bold">
                  <span>FORMÜL ARALIKLARI</span>
                  <span className="text-amber-400 font-mono font-black">{theory.formula}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {theory.tones.map((t: ChordTone, idx: number) => {
                    const isRoot = t.isRoot || t.degree === '1';
                    return (
                      <div
                        key={idx}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-transform hover:scale-105 ${
                          isRoot
                            ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/25 border-amber-400/60 text-amber-300 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : t.degree.includes('3')
                            ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-400/60 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : t.degree.includes('5')
                            ? 'bg-gradient-to-r from-violet-500/25 to-purple-600/25 border-violet-400/60 text-violet-300 font-bold shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                            : 'bg-gradient-to-r from-emerald-500/25 to-teal-600/25 border-emerald-400/60 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        }`}
                      >
                        <span className="font-black">{t.degree}</span>
                        <span className="text-[10px] opacity-80">({t.note})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6-String Voicing Matrix */}
              <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between font-bold">
                  <span>6-STRING MATRİS</span>
                  <span className="text-cyan-400 font-mono">STR 6-1</span>
                </div>
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#080a14] text-slate-400 text-[9px] border-b border-white/10 font-mono">
                      <tr>
                        <th className="py-1.5 px-2">TEL</th>
                        <th className="py-1.5 px-1.5">PRD</th>
                        <th className="py-1.5 px-1.5">NOTA</th>
                        <th className="py-1.5 px-1.5">DERECE</th>
                        <th className="py-1.5 px-2 text-right">PARMAK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {theory.stringsAnalysis.map((str) => {
                        const isMuted = str.status === 'muted';
                        const isOpen = str.status === 'open';
                        return (
                          <tr
                            key={str.stringIdx}
                            onClick={() => {
                              if (str.fret >= 0) guitarAudio.pluckNote(str.stringIdx, str.fret, 0.9);
                            }}
                            className="hover:bg-white/[0.06] cursor-pointer transition-colors"
                          >
                            <td className="py-1.5 px-2 font-bold text-slate-400">{str.stringNumber}</td>
                            <td className="py-1.5 px-1.5">
                              {isMuted ? (
                                <span className="text-rose-400 font-bold px-1 bg-rose-500/10 rounded">X</span>
                              ) : isOpen ? (
                                <span className="text-emerald-400 font-bold px-1 bg-emerald-500/10 rounded">0</span>
                              ) : (
                                <span className="text-amber-400 font-bold px-1 bg-amber-500/15 rounded">{str.fret}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-1.5 font-bold text-slate-200">{str.note}</td>
                            <td className="py-1.5 px-1.5 text-[10px] text-cyan-300 font-semibold">{str.degree}</td>
                            <td className="py-1.5 px-2 text-right text-[10px] text-slate-400">
                              {isMuted ? '-' : str.finger === 0 ? 'Boş' : `F${str.finger}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Voicing Positions Quick Switcher */}
              {chordDef.positions.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    ALTERNATİF POZİSYONLAR
                  </span>
                  <div className="flex items-center gap-1.5">
                    {chordDef.positions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPositionIdx(idx);
                          guitarAudio.strumChord(chordDef.positions[idx], 'down', 22);
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          positionIdx === idx
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.5)] border border-amber-200'
                            : 'bg-[#12162a] text-slate-300 border border-white/10 hover:text-white hover:border-amber-400/40'
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETLIST ARCHIVE & QUICK YOUTUBE EXTRACTOR */}
          {leftTab === 'setlist' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <form onSubmit={handleQuickAiSubmit} className="p-2.5 border-b border-white/10 bg-[#0a0d18]">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Video className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-400" />
                    <input
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="YouTube veya Şarkı..."
                      disabled={isAiLoading}
                      className="w-full bg-[#12162a] border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAiLoading || !quickInput.trim()}
                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-amber-500 hover:brightness-110 disabled:opacity-50 text-white font-mono text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-[0_0_14px_rgba(168,85,247,0.35)]"
                  >
                    {isAiLoading ? '...' : 'ÇEK'}
                  </button>
                </div>
              </form>

              {/* Song List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {songs.map((song) => {
                  const isSelected = song.id === currentSong.id;
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex flex-col gap-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 via-violet-500/15 to-[#12162a] border-amber-400/60 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : 'bg-[#0d1020]/60 border-white/[0.05] hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{song.title}</span>
                        {song.isAiGenerated && (
                          <span className="font-mono text-[8px] px-1.5 py-0.2 rounded-full bg-violet-500/25 text-violet-300 border border-violet-500/40">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-sans">{song.artist}</div>
                      <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-bold">KEY: {song.key}</span>
                        {song.tempo && <span>• {song.tempo} BPM</span>}
                        {song.capo > 0 && <span className="text-cyan-300">• CAPO {song.capo}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FRETSHAPES SCALES & CAGED SYSTEM */}
          {leftTab === 'scales' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              {/* Root Note Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  KÖK NOTA (ROOT)
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {NOTES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setScaleRootNote(n)}
                      className={`py-1.5 rounded-xl text-center font-black text-[11px] transition-all cursor-pointer ${
                        scaleRootNote === n
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.5)] border border-amber-200'
                          : 'bg-[#12162a] text-slate-300 hover:text-white border border-white/5 hover:border-amber-400/40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  GAM SEÇİNİZ
                </label>
                <select
                  value={selectedScaleId}
                  onChange={(e) => setSelectedScaleId(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400/60 cursor-pointer shadow-inner"
                >
                  {GUITAR_SCALES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0e1224]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Scale Info Card */}
              <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300 text-sm">
                    {scaleRootNote} {activeScale.name}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                    {activeScale.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {activeScale.description}
                </p>
              </div>

              {/* CAGED 5-Box Shapes Visualizer Selector */}
              <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    CAGED KUTU (SHAPE) SEÇİMİ
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold font-mono">
                    {getCagedBoxFretRange(scaleRootNote, selectedCagedBox).label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {CAGED_BOXES.map((box) => {
                    const isSelected = selectedCagedBox === box.number;
                    const range = getCagedBoxFretRange(scaleRootNote, box.number);
                    return (
                      <button
                        key={box.id}
                        onClick={() => {
                          setSelectedCagedBox(box.number);
                          setFretboardViewMode('scale');
                        }}
                        className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-200 font-black shadow-[0_0_16px_rgba(6,182,212,0.5)] scale-[1.02]'
                            : 'bg-[#12162a] text-slate-300 hover:text-white border-white/5 hover:border-cyan-400/40'
                        }`}
                        title={box.description}
                      >
                        <div className="text-[10px] font-bold leading-tight">
                          {box.number === 0 ? 'TÜM SAP' : `KUTU ${box.number}`}
                        </div>
                        <div className="text-[8px] opacity-80 truncate">
                          {box.number === 0 ? '0-14' : range.label.replace(' Perde', '')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Scale Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setFretboardViewMode('scale');
                    setMobileTab('stage');
                    showToast(`${scaleRootNote} ${activeScale.name} klavyede açıldı.`);
                  }}
                  className="py-2.5 px-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-slate-950 font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(6,182,212,0.35)] cursor-pointer active:scale-95 border border-cyan-200/50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SAPTA GÖSTER</span>
                </button>

                <button
                  onClick={async () => {
                    const range = getCagedBoxFretRange(scaleRootNote, selectedCagedBox);
                    const minF = selectedCagedBox === 0 ? 0 : range.minFret;
                    const maxF = selectedCagedBox === 0 ? 12 : range.maxFret;

                    for (let str = 0; str <= 5; str++) {
                      for (let f = minF; f <= maxF; f++) {
                        const note = getNoteAtFret(str, f);
                        const info = getScaleNoteInfo(note, scaleRootNote, activeScale);
                        if (info.inScale) {
                          guitarAudio.pluckNote(str, f, 0.9);
                          await new Promise((r) => setTimeout(r, 130));
                        }
                      }
                    }
                  }}
                  className="py-2.5 px-2 bg-[#12162a] hover:bg-[#1a2038] border border-white/10 hover:border-amber-400/50 text-amber-300 font-black text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>DİZİYİ ÇAL</span>
                </button>
              </div>

              {/* Scale Notes Chips with fretShapes Colors */}
              <div className="p-3.5 rounded-2xl bg-[#0d1020]/90 border border-white/[0.08] space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  GAMDAKİ NOTALAR ({scaleRootNote} TONU)
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {getScaleNotes(scaleRootNote, activeScale).map((note, idx) => {
                    const degree = activeScale.degreeNames[idx] || `${idx + 1}`;
                    const style = getFretShapesIntervalStyle(degree);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const strIdx = NOTES.indexOf(note) % 6;
                          guitarAudio.pluckNote(strIdx, 0, 0.9);
                        }}
                        className={`p-2 rounded-xl border text-center font-mono cursor-pointer transition-transform hover:scale-105 shadow-sm ${style.badge}`}
                      >
                        <div className="text-xs font-black">{note}</div>
                        <div className="text-[8px] opacity-80">{degree}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ORTA SÜTUN (1fr): 3D AKUSTİK GİTAR & KLAVYE STÜDYO SAHNESİ */}
        <main className={`${mobileTab === 'stage' ? 'flex' : 'hidden'} lg:flex h-full flex-col bg-stage-ambient relative overflow-hidden min-w-0`}>
          <GuitarStage
            chordName={activeChord}
            position={currentPosition}
            positionIdx={positionIdx}
            totalPositions={chordDef.positions.length}
            displayMode={displayMode}
            isLeftHanded={isLeftHanded}
            songChords={songChords}
            selectedPatternId={selectedPatternId}
            isPlayingStrumSeq={isPlayingStrumSeq}
            onSelectChord={handleSelectChord}
            onPositionChange={setPositionIdx}
            onDisplayModeChange={setDisplayMode}
            onOpenChordDetail={() => handleOpenChordDetail(activeChord)}
            onSelectPattern={setSelectedPatternId}
            onPlayStrumSequence={handlePlayStrumSequence}
            isVirtualGuitarist={isVirtualGuitarist}
            virtualGuitaristMode={virtualGuitaristMode}
            onToggleVirtualGuitarist={handleToggleVirtualGuitarist}
            onVirtualGuitaristModeChange={handleVirtualGuitaristModeChange}
            viewMode={fretboardViewMode}
            onViewModeChange={setFretboardViewMode}
            activeScaleId={selectedScaleId}
            scaleRoot={scaleRootNote}
            cagedBox={selectedCagedBox}
            onCagedBoxChange={setSelectedCagedBox}
          />
        </main>

        {/* SAĞ SÜTUN: MOISES CHORD SHEET & LYRICS PLAY-ALONG */}
        <aside className={`${mobileTab === 'lyrics' ? 'flex' : 'hidden'} lg:flex w-full h-full flex-col bg-[#0a0e26]/95 backdrop-blur-2xl border-l border-white/[0.12] overflow-hidden min-w-0 p-2 gap-2`}>
          <SongViewer
            song={currentSong}
            activeChord={activeChord}
            onSelectChord={handleSelectChord}
            transposeOffset={transposeOffset}
            onTransposeChange={setTransposeOffset}
            isAutoScrolling={isAutoScrolling}
            onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
            isVirtualGuitarist={isVirtualGuitarist}
            virtualGuitaristMode={virtualGuitaristMode}
            onToggleVirtualGuitarist={handleToggleVirtualGuitarist}
            onVirtualGuitaristModeChange={handleVirtualGuitaristModeChange}
          />
        </aside>
      </div>

      {/* 3. MOBILE STUDIO FLOATING DOCK (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-[58px] z-40 bg-[#0a0e26]/90 backdrop-blur-2xl border-t border-white/[0.12] px-3 flex items-center justify-around gap-2 shadow-[0_-8px_32px_rgba(0,0,0,0.85)]">
        <button
          onClick={() => setMobileTab('stage')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'stage'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.5)] font-black border border-amber-200'
              : 'text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]'
          }`}
        >
          <span className="text-sm">🎸</span>
          <span className="truncate">3D / KLAVYE</span>
        </button>

        <button
          onClick={() => setMobileTab('lyrics')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'lyrics'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.5)] font-black border border-amber-200'
              : 'text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]'
          }`}
        >
          <span className="text-sm">📝</span>
          <span className="truncate">SÖZLER</span>
        </button>

        <button
          onClick={() => setMobileTab('theory')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'theory'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.5)] font-black border border-amber-200'
              : 'text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]'
          }`}
        >
          <span className="text-sm">📚</span>
          <span className="truncate">TEORİ</span>
        </button>
      </nav>

      {/* QUICK SEARCH & CUSTOM SONG MODALS */}
      <SongSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        songs={songs}
        onSelectSong={handleSelectSong}
        onOpenCustomEditor={() => setIsCustomOpen(true)}
      />

      <CustomSongModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onSaveSong={handleSaveCustomSong}
      />

      {/* CHORD DICTIONARY & DETAIL MODALS */}
      <ChordDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onSelectChord={(chord) => {
          handleSelectChord(chord);
          showToast(`${chord} akoru seçildi.`);
        }}
      />

      <ChordDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        chordName={detailChord}
        onApplyChord={(chord, pos) => {
          handleSelectChord(chord);
          if (typeof pos === 'number') setPositionIdx(pos);
          showToast(`${chord} akoru uygulandı.`);
        }}
      />

      {/* GUITARTUNA DSP LIVE GUITAR TUNER MODAL */}
      <GuitarTunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
        initialTuningId={selectedTuningId}
        onTuningChange={(tuningId) => setSelectedTuningId(tuningId)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3 py-2 bg-[#191c26] border border-amber-500/50 rounded-lg shadow-2xl font-mono text-xs text-amber-300">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-500 hover:text-white cursor-pointer">
            [X]
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
