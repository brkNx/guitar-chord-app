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
import { Metronome } from './components/Metronome';
import { GuitarStage } from './components/stage/GuitarStage';

import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Video
} from 'lucide-react';

const STORAGE_CUSTOM_SONGS = 'guitar_app_custom_songs';

export function App() {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_SONGS);
      if (saved) {
        const parsed: Song[] = JSON.parse(saved);
        const cleaned = parsed.filter(
          (s) =>
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

  // Search & custom modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    showToast(`"${newSong.title}" setliste eklendi.`);
  };

  const handleQuickAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const newSong = await generateSongWithAI(quickInput.trim());
      handleSaveCustomSong(newSong);
      setQuickInput('');
      showToast(`AI RIG: "${newSong.title}" başarıyla çıkarıldı.`);
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
    <div className="w-screen h-screen overflow-hidden bg-[#0b0d12] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. SONGSTERR & ABLETON MASTER TRANSPORT BAR (48px) */}
      <header className="h-[48px] bg-[#0e1017] border-b border-[#1e222d] px-3 flex items-center justify-between gap-2 z-40 select-none shrink-0">
        {/* Left: Branding & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black tracking-wider text-white">
              SONGSTERR // NERV-DSP
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              STUDIO v3.4
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-slate-400 pl-2 border-l border-[#1e222d]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>48kHz WEBAUDIO</span>
          </div>
        </div>

        {/* Center: Ableton Transport Center (Play, Metronome, Transpose, Capo, Tuning) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Global Play / Autoscroll */}
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer font-bold ${
              isAutoScrolling
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25'
                : 'bg-[#181c26] text-slate-300 hover:text-white border border-[#1e222d]'
            }`}
            title="Auto-scroll ve ritim oynat"
          >
            {isAutoScrolling ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isAutoScrolling ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Songsterr Hardware Metronome */}
          <Metronome initialBpm={currentSong.tempo || 100} />

          {/* Transpose Controls */}
          <div className="hidden md:flex items-center bg-[#11141c] border border-[#1e222d] rounded px-1.5 py-0.5">
            <span className="text-[10px] text-slate-500 mr-1">TRP:</span>
            <button
              onClick={() => setTransposeOffset(transposeOffset - 1)}
              className="p-1 hover:text-white text-slate-400 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className={`px-1 font-bold ${transposeOffset !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
            <button
              onClick={() => setTransposeOffset(transposeOffset + 1)}
              className="p-1 hover:text-white text-slate-400 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Master Tuning Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-[#11141c] border border-[#1e222d] px-2 py-0.5 rounded">
            <span className="text-[10px] text-slate-500">TUNING:</span>
            <select
              value={selectedTuningId}
              onChange={(e) => setSelectedTuningId(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {GUITAR_TUNINGS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#11141c] text-white">
                  {t.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Capo Indicator & Advice */}
          <div className="hidden xl:flex items-center gap-1 bg-[#11141c] border border-[#1e222d] px-2 py-0.5 rounded text-[11px]">
            <span className="text-[10px] text-slate-500">CAPO:</span>
            <span className="font-bold text-amber-400">
              {currentSong.capo > 0 ? `${currentSong.capo}` : '0'}
            </span>
            {capoAdvice.recommendedCapo > 0 && currentSong.capo === 0 && (
              <span className="text-[9px] text-amber-400/80 bg-amber-500/10 px-1 rounded" title={capoAdvice.reason}>
                (Öneri: {capoAdvice.recommendedCapo})
              </span>
            )}
          </div>

          {/* Left-Handed Toggle */}
          <button
            onClick={() => setIsLeftHanded(!isLeftHanded)}
            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
              isLeftHanded
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-[#11141c] text-slate-400 border-[#1e222d] hover:text-white'
            }`}
            title="Solak gitarist klavye modu"
          >
            {isLeftHanded ? 'LH' : 'RH'}
          </button>
        </div>

        {/* Right: Cmd+K Search & Quick Track Importer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181c26] hover:bg-[#202534] border border-[#1e222d] rounded font-mono text-xs text-slate-300 transition-colors cursor-pointer"
            title="Şarkı Ara (Cmd+K)"
          >
            <Search className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">ŞARKI ARA</span>
            <kbd className="hidden sm:inline px-1 py-0.2 bg-[#0b0d12] border border-[#1e222d] rounded text-[9px] text-slate-500">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setIsCustomOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded transition-colors cursor-pointer"
            title="Yeni Şarkı Ekle"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden md:inline">EKLE</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN FIXED STUDIO SPLIT PANE */}
      <div className="flex-1 grid grid-cols-[300px_1fr_430px] h-[calc(100vh-48px)] overflow-hidden">
        {/* SOL SÜTUN (300px): OOLIMO CHORD ANALYZER & THEORY PANEL */}
        <aside className="w-[300px] h-full flex flex-col bg-[#11141c] border-r border-[#1e222d] overflow-hidden select-none">
          {/* Header Tabs */}
          <div className="p-1.5 border-b border-[#1e222d] bg-[#0e1017] grid grid-cols-3 gap-1 font-mono text-[10px]">
            {(['theory', 'setlist', 'scales'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`py-1 rounded border text-center transition-colors uppercase cursor-pointer ${
                  leftTab === tab
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-[#181c26] border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'theory' ? 'TEORİ' : tab === 'setlist' ? 'LİSTE' : 'GAMLAR'}
              </button>
            ))}
          </div>

          {/* TAB 1: OOLIMO CHORD THEORY & 6-STRING MATRIX */}
          {leftTab === 'theory' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs scrollbar-thin">
              {/* Active Chord Banner */}
              <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-amber-400">{activeChord}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    {theory.typeCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {theory.fullName} • {theory.mood}
                </p>
              </div>

              {/* Oolimo Intervals Breakdown */}
              <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>FORMÜL ARALIKLARI</span>
                  <span className="text-amber-400 font-bold">{theory.formula}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
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

              {/* 6-String Voicing Matrix Table */}
              <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>6-STRING MATRİS</span>
                  <span className="text-slate-400">STR 6-1</span>
                </div>
                <div className="border border-[#1e222d] rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#0b0d12] text-slate-500 text-[9px] border-b border-[#1e222d]">
                      <tr>
                        <th className="py-1 px-1.5">TEL</th>
                        <th className="py-1 px-1">PRD</th>
                        <th className="py-1 px-1">NOTA</th>
                        <th className="py-1 px-1">DERECE</th>
                        <th className="py-1 px-1 text-right">PARMAK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e222d]">
                      {theory.stringsAnalysis.map((str) => {
                        const isMuted = str.status === 'muted';
                        const isOpen = str.status === 'open';
                        return (
                          <tr
                            key={str.stringIdx}
                            onClick={() => {
                              if (str.fret >= 0) guitarAudio.pluckNote(str.stringIdx, str.fret, 0.9);
                            }}
                            className="hover:bg-white/[0.03] cursor-pointer transition-colors"
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
                <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    ALTERNATİF POZİSYONLAR
                  </span>
                  <div className="flex items-center gap-1">
                    {chordDef.positions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPositionIdx(idx);
                          guitarAudio.strumChord(chordDef.positions[idx], 'down', 22);
                        }}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          positionIdx === idx
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-[#11141c] text-slate-400 border border-[#1e222d] hover:text-white'
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

          {/* TAB 2: SETLIST ARCHIVE & YOUTUBE EXTRACTOR */}
          {leftTab === 'setlist' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick AI Extractor Strip */}
              <form onSubmit={handleQuickAiSubmit} className="p-2 border-b border-[#1e222d] bg-[#0e1017]">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Video className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-red-400" />
                    <input
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="YouTube veya Şarkı..."
                      disabled={isAiLoading}
                      className="w-full bg-[#181c26] border border-[#1e222d] rounded pl-7 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAiLoading || !quickInput.trim()}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-[10px] font-bold rounded cursor-pointer"
                  >
                    {isAiLoading ? '...' : 'ÇIKAR'}
                  </button>
                </div>
              </form>

              {/* Song List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d] p-1">
                {songs.map((song) => {
                  const isSelected = song.id === currentSong.id;
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className={`w-full text-left p-2 rounded transition-all flex flex-col gap-0.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-white'
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
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  GAM SEÇİNİZ
                </label>
                <select
                  value={selectedScaleId}
                  onChange={(e) => setSelectedScaleId(e.target.value)}
                  className="w-full bg-[#181c26] border border-[#1e222d] rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  {GUITAR_SCALES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#181c26]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">
                    {rootNote} {activeScale.name}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {activeScale.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {activeScale.description}
                </p>
              </div>

              {/* Scale Notes Chips */}
              <div className="p-2.5 rounded bg-[#181c26] border border-[#1e222d] space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  GAMDAKİ NOTALAR ({rootNote} TONU)
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {scaleNotes.map((note, idx) => {
                    const degree = activeScale.degreeNames[idx] || `${idx + 1}`;
                    const isRoot = degree === 'R' || degree === '1';
                    return (
                      <div
                        key={idx}
                        className={`p-1.5 rounded border text-center font-mono ${
                          isRoot
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                            : 'bg-[#11141c] border-[#1e222d] text-slate-300'
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

        {/* ORTA SÜTUN (1fr): 3D AKUSTİK GİTAR SAHNESİ + SAP ZOOM & 2B AKOR KLAVYESİ + RİTİM DOCK */}
        <main className="h-full flex flex-col bg-[#0b0d12] overflow-hidden min-w-0">
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
            onOpenChordDetail={() => setLeftTab('theory')}
            onSelectPattern={setSelectedPatternId}
            onPlayStrumSequence={handlePlayStrumSequence}
          />
        </main>

        {/* SAĞ SÜTUN (430px): CHORDIFY + ULTIMATE GUITAR PRO CANLI AKOR & SÖZ AKIŞI */}
        <aside className="w-[430px] h-full flex flex-col bg-[#0b0d12] border-l border-[#1e222d] p-2 gap-2 overflow-hidden min-w-0">
          {/* Quick Song / YouTube Lyrics + Chords Extractor Bar */}
          <form
            onSubmit={handleQuickAiSubmit}
            className="shrink-0 flex items-center gap-1.5 bg-[#11141c] border border-[#1e222d] rounded-lg p-1.5"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400" />
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Şarkı adı veya YouTube linki yazın (Söz + Akor)..."
                disabled={isAiLoading}
                className="w-full bg-[#0b0d12] border border-[#1e222d] rounded pl-8 pr-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <button
              type="submit"
              disabled={isAiLoading || !quickInput.trim()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-[11px] font-bold rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAiLoading ? 'ÇEKİLİYOR...' : 'SÖZ + AKOR BUL'}
            </button>
          </form>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <SongViewer
              song={currentSong}
              activeChord={activeChord}
              onSelectChord={handleSelectChord}
              transposeOffset={transposeOffset}
              onTransposeChange={setTransposeOffset}
              isAutoScrolling={isAutoScrolling}
              onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
            />
          </div>
        </aside>
      </div>

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

      {/* TOAST TELEMETRY */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3 py-1.5 bg-[#181c26] border border-amber-500/50 rounded shadow-2xl font-mono text-xs text-amber-300">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-500 hover:text-white">
            [X]
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
