import { useState, useEffect, useMemo } from 'react';
import type { Song, FretboardDisplayMode } from './types/guitar';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { getOrGenerateChord } from './data/chordLibrary';
import { guitarAudio } from './audio/guitarAudio';
import { getCapoRecommendation } from './utils/transpose';
import { extractUniqueChords } from './utils/chordPro';
import { GUITAR_TUNINGS, getTuningById } from './data/tunings';
import { getChordTheoryDetails, type ChordTone } from './utils/chordTheory';
import { GUITAR_SCALES, getScaleNotes, extractRootNote } from './data/scales';
import { STRUM_PATTERNS } from './data/strumPatterns';
import { generateSongWithAI } from './services/aiChordGenerator';

import { SongViewer } from './components/SongViewer';
import { SongSearchModal } from './components/SongSearchModal';
import { CustomSongModal } from './components/CustomSongModal';
import { ChordDictionaryModal } from './components/ChordDictionaryModal';
import { ChordDetailModal } from './components/ChordDetailModal';
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
  BookOpen
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
  const [selectedPatternId, setSelectedPatternId] = useState<string>('pop_rock_classic');
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);

  // Left column tab: 'theory' | 'setlist' | 'scales'
  const [leftTab, setLeftTab] = useState<'theory' | 'setlist' | 'scales'>('theory');

  // Mobile studio view tab: 'stage' | 'lyrics' | 'theory'
  const [mobileTab, setMobileTab] = useState<'stage' | 'lyrics' | 'theory'>('stage');

  // Search, custom & chord modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
  const rootNote = extractRootNote(activeChord);

  // Scale data
  const activeScale = GUITAR_SCALES.find((s) => s.id === selectedScaleId) || GUITAR_SCALES[0];
  const scaleNotes = getScaleNotes(rootNote, activeScale);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectChord = (chord: string, silent = false) => {
    setActiveChord(chord);
    setPositionIdx(0);
    if (!silent) {
      const def = getOrGenerateChord(chord);
      if (def.positions[0]) {
        guitarAudio.strumChord(def.positions[0], 'down', 22);
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

  // Keyboard shortcut: Cmd+K or '/' opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isSearchOpen && !isCustomOpen)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isCustomOpen]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#090a0f] text-slate-100 flex flex-col font-sans select-none studio-layout">
      {/* 1. 21st.dev / SOUNDSLICE 52px HARDWARE MASTER TRANSPORT BAR */}
      <header className="h-[52px] bg-[#08090d]/85 backdrop-blur-xl px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-40 select-none shrink-0 border-b border-white/[0.08]">
        {/* Left: Studio Branding & WebAudio Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="font-mono text-xs font-bold tracking-tight text-white">
              MOISES
            </span>
            <span className="hidden sm:inline font-mono text-xs font-bold tracking-tight text-white/90">
              // SOUNDSLICE
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PRO
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/[0.06]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>48kHz DSP</span>
          </div>
        </div>

        {/* Center: Hardware Controls (Play, Metronome, Transpose, Capo, Tuning, Handedness) */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs shrink-0">
          {/* Global Play / Autoscroll Button */}
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-bold active:scale-95 shadow-sm ${
              isAutoScrolling
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-white/[0.04] text-slate-200 hover:text-white border border-white/[0.08] hover:border-amber-500/40'
            }`}
            title="Auto-scroll ve canlı ritim oynat"
          >
            {isAutoScrolling ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            <span className="hidden xs:inline">{isAutoScrolling ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Soundslice Hardware Metronome Module */}
          <Metronome initialBpm={currentSong.tempo || 100} />

          {/* Transpose Steppers */}
          <div className="hidden sm:flex items-center bg-[#0e1017] border border-white/[0.08] rounded-full px-2 py-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-500 mr-1">TRP:</span>
            <button
              onClick={() => setTransposeOffset(transposeOffset - 1)}
              className="p-0.5 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="-1 Yarı Ses"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1.5 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
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
          <div className="hidden md:flex items-center gap-1 bg-[#0e1017] border border-white/[0.08] px-2.5 py-1 rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-500">TUNING:</span>
            <select
              value={selectedTuningId}
              onChange={(e) => setSelectedTuningId(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {GUITAR_TUNINGS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#11131a] text-white">
                  {t.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Capo Indicator */}
          <div className="hidden xl:flex items-center gap-1 bg-[#0e1017] border border-white/[0.08] px-2.5 py-1 rounded-full text-[11px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-slate-500">CAPO:</span>
            <span className="font-bold text-amber-400">
              {currentSong.capo > 0 ? `${currentSong.capo}` : '0'}
            </span>
            {capoAdvice.recommendedCapo > 0 && currentSong.capo === 0 && (
              <span className="text-[9px] text-amber-400/90 bg-amber-500/10 px-1 rounded-full" title={capoAdvice.reason}>
                (Öneri: {capoAdvice.recommendedCapo})
              </span>
            )}
          </div>

          {/* Left-Handed Toggle */}
          <button
            onClick={() => setIsLeftHanded(!isLeftHanded)}
            className={`hidden sm:block px-2.5 py-1 rounded-full border text-[10px] font-mono transition-all active:scale-95 cursor-pointer ${
              isLeftHanded
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-[#0e1017] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title="Solak gitarist klavye modu"
          >
            {isLeftHanded ? 'LH' : 'RH'}
          </button>
        </div>

        {/* Right: Cmd+K Quick Search, Chords Dictionary & Add Song */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/40 text-xs font-medium text-slate-200 transition-all cursor-pointer active:scale-95"
            title="Akor Kütüphanesi & Sözlük"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">AKORLAR</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/40 text-xs font-medium text-slate-200 transition-all cursor-pointer active:scale-95"
            title="Şarkı Ara (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">ŞARKI ARA</span>
            <kbd className="hidden lg:inline px-1.5 py-0.2 bg-black/40 border border-white/[0.08] rounded text-[9px] text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setIsCustomOpen(true)}
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            title="Yeni Şarkı Ekle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">EKLE</span>
          </button>
        </div>
      </header>

      {/* 2. MOISES 3-COLUMN STUDIO GRID WORKSPACE (Desktop) / TABBED VIEW (Mobile) */}
      <div className="flex-1 studio-grid h-[calc(100vh-52px)] overflow-hidden">
        {/* SOL SÜTUN (260px): KÜTÜPHANE & TEORİ PANELİ */}
        <aside className={`${mobileTab === 'theory' ? 'flex' : 'hidden'} lg:flex w-full h-full flex-col bg-[#0b0d13] border-r border-white/[0.08] overflow-hidden select-none`}>
          {/* Navigation Tabs */}
          <div className="p-2 border-b border-white/[0.08] bg-[#08090d]">
            <div className="p-1 bg-[#10121a] border border-white/[0.06] rounded-xl grid grid-cols-3 gap-1 font-mono text-[10px]">
              {(['theory', 'setlist', 'scales'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLeftTab(tab)}
                  className={`py-1.5 rounded-lg border text-center transition-all uppercase cursor-pointer ${
                    leftTab === tab
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
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
                className="p-3 rounded-lg bg-[#191c26] border border-white/10 hover:border-amber-500/40 space-y-1 transition-all cursor-pointer group shadow-sm"
                title="Detaylı akor analizini aç"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                      {activeChord}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono group-hover:text-amber-400/80 transition-colors">
                      [DETAY ↗]
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    {theory.typeCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {theory.fullName} • {theory.mood}
                </p>
              </div>

              {/* Quick Chord Dictionary Button */}
              <button
                onClick={() => setIsDictionaryOpen(true)}
                className="w-full py-1.5 px-2 bg-[#141722] hover:bg-[#1c2130] border border-white/10 hover:border-amber-500/40 rounded-lg text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>TÜM AKORLAR SÖZLÜĞÜ (KÜTÜPHANE)</span>
              </button>

              {/* Intervals Breakdown */}
              <div className="p-3 rounded-lg bg-[#191c26] border border-white/10 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>FORMÜL ARALIKLARI</span>
                  <span className="text-amber-400 font-bold">{theory.formula}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {theory.tones.map((t: ChordTone, idx: number) => {
                    const isRoot = t.isRoot || t.degree === '1';
                    return (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 rounded border text-[11px] font-mono flex items-center gap-1 ${
                          isRoot
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                            : t.degree.includes('3')
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : t.degree.includes('5')
                            ? 'bg-slate-700/40 border-slate-600 text-slate-300'
                            : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        }`}
                      >
                        <span className="font-bold">{t.degree}</span>
                        <span className="text-[10px] opacity-75">({t.note})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6-String Voicing Matrix */}
              <div className="p-3 rounded-lg bg-[#191c26] border border-white/10 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>6-STRING MATRİS</span>
                  <span className="text-slate-400">STR 6-1</span>
                </div>
                <div className="border border-white/10 rounded-md overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#090a0f] text-slate-500 text-[9px] border-b border-white/10">
                      <tr>
                        <th className="py-1 px-1.5">TEL</th>
                        <th className="py-1 px-1">PRD</th>
                        <th className="py-1 px-1">NOTA</th>
                        <th className="py-1 px-1">DERECE</th>
                        <th className="py-1 px-1 text-right">PARMAK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {theory.stringsAnalysis.map((str) => {
                        const isMuted = str.status === 'muted';
                        const isOpen = str.status === 'open';
                        return (
                          <tr
                            key={str.stringIdx}
                            onClick={() => {
                              if (str.fret >= 0) guitarAudio.pluckNote(str.stringIdx, str.fret, 0.9);
                            }}
                            className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                          >
                            <td className="py-1 px-1.5 font-bold text-slate-400">{str.stringNumber}</td>
                            <td className="py-1 px-1">
                              {isMuted ? (
                                <span className="text-rose-400 font-bold">X</span>
                              ) : isOpen ? (
                                <span className="text-emerald-400 font-bold">0</span>
                              ) : (
                                <span className="text-amber-400 font-bold">{str.fret}</span>
                              )}
                            </td>
                            <td className="py-1 px-1 font-semibold text-slate-200">{str.note}</td>
                            <td className="py-1 px-1 text-[10px] text-slate-400">{str.degree}</td>
                            <td className="py-1 px-1 text-right text-[10px] text-slate-400">
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
                <div className="p-3 rounded-lg bg-[#191c26] border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
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
                        className={`flex-1 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          positionIdx === idx
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-[#11131a] text-slate-400 border border-white/10 hover:text-white'
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
              <form onSubmit={handleQuickAiSubmit} className="p-2.5 border-b border-white/10 bg-[#0e1017]">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Video className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-red-400" />
                    <input
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="YouTube veya Şarkı..."
                      disabled={isAiLoading}
                      className="w-full bg-[#191c26] border border-white/10 rounded-md pl-8 pr-2 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAiLoading || !quickInput.trim()}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                  >
                    {isAiLoading ? '...' : 'ÇEK'}
                  </button>
                </div>
              </form>

              {/* Song List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {songs.map((song) => {
                  const isSelected = song.id === currentSong.id;
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-0.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-white/[0.03] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate">{song.title}</span>
                        {song.isAiGenerated && (
                          <span className="font-mono text-[8px] px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 mt-0.5">
                        <span>KEY: {song.key}</span>
                        {song.tempo && <span>• {song.tempo} BPM</span>}
                        {song.capo > 0 && <span className="text-amber-400/90">• CAPO {song.capo}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SCALES & IMPROVISATION */}
          {leftTab === 'scales' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  GAM SEÇİNİZ
                </label>
                <select
                  value={selectedScaleId}
                  onChange={(e) => setSelectedScaleId(e.target.value)}
                  className="w-full bg-[#191c26] border border-white/10 rounded-md p-2 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  {GUITAR_SCALES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#191c26]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#191c26] border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">
                    {rootNote} {activeScale.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {activeScale.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {activeScale.description}
                </p>
              </div>

              {/* Scale Notes Chips */}
              <div className="p-3 rounded-lg bg-[#191c26] border border-white/10 space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  GAMDAKİ NOTALAR ({rootNote} TONU)
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {scaleNotes.map((note, idx) => {
                    const degree = activeScale.degreeNames[idx] || `${idx + 1}`;
                    const isRoot = degree === 'R' || degree === '1';
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-md border text-center font-mono ${
                          isRoot
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                            : 'bg-[#11131a] border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{note}</div>
                        <div className="text-[8px] text-slate-500">{degree}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ORTA SÜTUN (1fr): 3D AKUSTİK GİTAR & KLAVYE STÜDYO SAHNESİ */}
        <main className={`${mobileTab === 'stage' ? 'flex' : 'hidden'} lg:flex h-full flex-col bg-[#090a0f] overflow-hidden min-w-0`}>
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
          />
        </main>

        {/* SAĞ SÜTUN: MOISES CHORD SHEET & LYRICS PLAY-ALONG */}
        <aside className={`${mobileTab === 'lyrics' ? 'flex' : 'hidden'} lg:flex w-full h-full flex-col bg-[#11131a] border-l border-white/10 overflow-hidden min-w-0 p-2 gap-2`}>
          <SongViewer
            song={currentSong}
            activeChord={activeChord}
            onSelectChord={handleSelectChord}
            transposeOffset={transposeOffset}
            onTransposeChange={setTransposeOffset}
            isAutoScrolling={isAutoScrolling}
            onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
          />
        </aside>
      </div>

      {/* 3. MOBILE STUDIO FLOATING DOCK (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-[58px] z-40 bg-[#08090d]/95 backdrop-blur-2xl border-t border-white/[0.08] px-3 flex items-center justify-around gap-2 shadow-[0_-8px_32px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setMobileTab('stage')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'stage'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.04]'
          }`}
        >
          <span className="text-sm">🎸</span>
          <span className="truncate">3D / KLAVYE</span>
        </button>

        <button
          onClick={() => setMobileTab('lyrics')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'lyrics'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.04]'
          }`}
        >
          <span className="text-sm">📝</span>
          <span className="truncate">SÖZLER</span>
        </button>

        <button
          onClick={() => setMobileTab('theory')}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${
            mobileTab === 'theory'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.04]'
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
