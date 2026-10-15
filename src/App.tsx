import { useState, useEffect } from 'react';
import type { Song, FretboardDisplayMode } from './types/guitar';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { getOrGenerateChord } from './data/chordLibrary';
import { guitarAudio } from './audio/guitarAudio';
import { getCapoRecommendation } from './utils/transpose';
import { GUITAR_TUNINGS, getTuningById } from './data/tunings';
import { generateSongWithAI } from './services/aiChordGenerator';

import { Fretboard } from './components/Fretboard';
import { Guitar3D } from './components/Guitar3D';
import { SongRoster } from './components/SongRoster';
import { RackInspector } from './components/RackInspector';
import { ChordDetailModal } from './components/ChordDetailModal';
import { SongViewer } from './components/SongViewer';
import { SongSearchModal } from './components/SongSearchModal';
import { CustomSongModal } from './components/CustomSongModal';
import { ChordDictionaryModal } from './components/ChordDictionaryModal';
import { Metronome } from './components/Metronome';

import {
  Music,
  Play,
  PanelLeft,
  PanelRight,
  Sparkles,
  Info
} from 'lucide-react';

const STORAGE_CUSTOM_SONGS = 'guitar_app_custom_songs';

export function App() {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_SONGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...SAMPLE_SONGS];
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_SONGS;
  });

  const [currentSong, setCurrentSong] = useState<Song>(SAMPLE_SONGS[0]);
  const [activeChord, setActiveChord] = useState<string>('Am');
  const [positionIdx, setPositionIdx] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>('fingers');
  const [viewDimension, setViewDimension] = useState<'2d' | '3d' | 'dual'>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === '3d') return '3d';
      if (v === 'dual') return 'dual';
    } catch {
      // fallback
    }
    return '2d';
  });

  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [selectedTuningId, setSelectedTuningId] = useState<string>('standard');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('minor_pentatonic');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('pop_rock_classic');

  // Drawer collapses for responsive flexibility
  const [isLeftRosterOpen, setIsLeftRosterOpen] = useState(true);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals state
  const [searchParam] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('search') || '';
    } catch {
      return '';
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState(() => Boolean(searchParam));
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isChordDetailOpen, setIsChordDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active chord definition & position
  const chordDef = getOrGenerateChord(activeChord);
  const currentPosition = chordDef.positions[positionIdx] || chordDef.positions[0];

  // Capo recommendation
  const capoAdvice = getCapoRecommendation(currentSong.key);

  // Tuning adjustment in Web Audio engine
  useEffect(() => {
    const tuning = getTuningById(selectedTuningId);
    guitarAudio.setTuningFrequencies(tuning.frequencies);
  }, [selectedTuningId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle chord selection from song, fretboard, or dictionary
  const handleSelectChord = (chord: string) => {
    setActiveChord(chord);
    setPositionIdx(0);
    const def = getOrGenerateChord(chord);
    if (def.positions[0]) {
      guitarAudio.strumChord(def.positions[0], 'down', 24);
    }
  };

  // Add and persist new custom song
  const handleSaveCustomSong = (newSong: Song) => {
    const updated = [newSong, ...songs];
    setSongs(updated);
    setCurrentSong(newSong);
    setTransposeOffset(0);

    try {
      const customOnly = updated.filter((s) => s.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_SONGS, JSON.stringify(customOnly));
    } catch (e) {
      console.error(e);
    }
    showToast(`Track "${newSong.title}" added to local setlist.`);
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

  // Quick AI extraction from SongRoster bar
  const handleQuickAiImport = async (query: string) => {
    setIsAiLoading(true);
    try {
      const newSong = await generateSongWithAI(query);
      handleSaveCustomSong(newSong);
      showToast(`AI RIG: Loaded "${newSong.title}" by ${newSong.artist}`);
    } catch (err) {
      console.error(err);
      showToast('AI extraction failed. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Keyboard shortcut: '/' opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && !isCustomOpen && !isDictionaryOpen && !isChordDetailOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isCustomOpen, isDictionaryOpen, isChordDetailOpen]);

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* 1. TOP HARDWARE MASTER BAR (52px) */}
      <header className="h-[52px] bg-[#0c0d12] border-b border-white/10 px-3 flex items-center justify-between gap-2 z-40 select-none">
        {/* Left: Hardware Branding & Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLeftRosterOpen(!isLeftRosterOpen)}
              className={`p-1.5 rounded border transition-colors ${
                isLeftRosterOpen
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Setlist Archive Panel"
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-black tracking-wider text-white">
                  NERV // STUDIO RIG
                </span>
                <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  v3.2
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>48kHz WEBAUDIO ENGINE</span>
              </div>
            </div>
          </div>

          {/* Master Tuning Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#12141c] border border-white/10 px-2 py-1 rounded">
            <span className="text-[10px] font-mono text-slate-400 font-semibold">TUNING:</span>
            <select
              value={selectedTuningId}
              onChange={(e) => setSelectedTuningId(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {GUITAR_TUNINGS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#12141c] text-white">
                  {t.shortName} ({t.notes.join('')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Master Metronome Engine */}
        <div className="flex items-center gap-2">
          <Metronome />
        </div>

        {/* Right: Stage View Switchers & Racks */}
        <div className="flex items-center gap-2">
          {/* 2D / 3D / DUAL Switcher */}
          <div className="flex items-center bg-[#12141c] border border-white/10 rounded p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setViewDimension('2d')}
              className={`px-2 py-1 rounded transition-colors ${
                viewDimension === '2d'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              [2D FRET]
            </button>
            <button
              onClick={() => setViewDimension('3d')}
              className={`px-2 py-1 rounded transition-colors ${
                viewDimension === '3d'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              [3D RIG]
            </button>
            <button
              onClick={() => setViewDimension('dual')}
              className={`px-2 py-1 rounded transition-colors ${
                viewDimension === 'dual'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              [DUAL]
            </button>
          </div>

          {/* Quick Tools */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded font-mono text-[11px] transition-colors"
            title="Search songs and generate AI charts"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>AI EXTRACT</span>
          </button>

          <button
            onClick={() => setIsDictionaryOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded font-mono text-[11px] transition-colors"
          >
            <span>CHORD BOOK</span>
          </button>

          <button
            onClick={() => setIsRightInspectorOpen(!isRightInspectorOpen)}
            className={`p-1.5 rounded border transition-colors ${
              isRightInspectorOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Rack Inspector Panel"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN COCKPIT WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: SONG ROSTER (280px) */}
        {isLeftRosterOpen && (
          <div className="w-[280px] shrink-0 h-[calc(100vh-52px)]">
            <SongRoster
              songs={songs}
              currentSong={currentSong}
              onSelectSong={handleSelectSong}
              onOpenSearchModal={() => setIsSearchOpen(true)}
              onOpenCustomModal={() => setIsCustomOpen(true)}
              onQuickAiImport={handleQuickAiImport}
              isAiLoading={isAiLoading}
            />
          </div>
        )}

        {/* CENTER COLUMN: MAIN INSTRUMENT RIG & STAGE (1fr) */}
        <main className="flex-1 h-[calc(100vh-52px)] overflow-y-auto bg-[#07080b] p-3 flex flex-col gap-3 min-w-0">
          {/* Active Voicing Cockpit HUD */}
          <div className="bg-[#0e1017] border border-white/10 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Left: Big Chord Telemetry */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/40 rounded flex items-center gap-2">
                <span className="font-mono text-2xl font-black text-amber-400 leading-none">
                  {activeChord}
                </span>
                <div className="flex flex-col text-[10px] font-mono text-slate-400 leading-tight">
                  <span className="text-white font-bold">{chordDef.suffix ? `${chordDef.root} ${chordDef.suffix}` : `${chordDef.root} MAJ`}</span>
                  <span className="text-amber-300/80">POS #{positionIdx + 1}</span>
                </div>
              </div>

              {/* Voicing Positions Switcher */}
              {chordDef.positions.length > 1 && (
                <div className="flex items-center gap-1 bg-[#13151f] px-2 py-1 rounded border border-white/10 font-mono text-[11px]">
                  <span className="text-slate-400 mr-1">VOICING:</span>
                  {chordDef.positions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPositionIdx(idx);
                        guitarAudio.strumChord(chordDef.positions[idx], 'down', 24);
                      }}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        positionIdx === idx
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Fast Strum Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => guitarAudio.strumChord(currentPosition, 'down', 24)}
                  className="px-2 py-1 bg-[#171924] hover:bg-[#222536] border border-white/10 rounded text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1 transition-colors"
                  title="Strum Down"
                >
                  <Play className="w-3 h-3 rotate-90 fill-current" />
                  <span>STRUM</span>
                </button>
                <button
                  onClick={() => guitarAudio.arpeggiateChord(currentPosition, 'pima', 110)}
                  className="px-2 py-1 bg-[#171924] hover:bg-[#222536] border border-white/10 rounded text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 transition-colors"
                  title="Play Classical Arpeggio"
                >
                  <Music className="w-3 h-3" />
                  <span>ARPEG</span>
                </button>
              </div>
            </div>

            {/* Right: Display Mode & Handedness Controls */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <div className="flex items-center bg-[#13151f] border border-white/10 rounded p-0.5">
                <button
                  onClick={() => setDisplayMode('fingers')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    displayMode === 'fingers'
                      ? 'bg-white/10 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FINGERS
                </button>
                <button
                  onClick={() => setDisplayMode('notes')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    displayMode === 'notes'
                      ? 'bg-white/10 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  NOTES
                </button>
              </div>

              <button
                onClick={() => setIsLeftHanded(!isLeftHanded)}
                className={`px-2 py-1 rounded border transition-colors ${
                  isLeftHanded
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Toggle Left-Handed Fretboard Orientation"
              >
                {isLeftHanded ? 'LH (ACTIVE)' : 'RH'}
              </button>

              <button
                onClick={() => setIsChordDetailOpen(true)}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 flex items-center gap-1 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>INFO</span>
              </button>
            </div>
          </div>

          {/* Instrument Stage Rendering: 2D, 3D, or DUAL */}
          <section className="bg-[#0b0c10] border border-white/10 rounded-lg p-2 relative shadow-lg">
            {viewDimension === '2d' && (
              <Fretboard
                chordName={activeChord}
                position={currentPosition}
                displayMode={displayMode}
                isLeftHanded={isLeftHanded}
                onOpenChordDetail={() => setIsChordDetailOpen(true)}
              />
            )}

            {viewDimension === '3d' && (
              <Guitar3D
                chordName={activeChord}
                position={currentPosition}
                isLeftHanded={isLeftHanded}
                onOpenChordDetail={() => setIsChordDetailOpen(true)}
                onSwitchTo2D={() => setViewDimension('2d')}
              />
            )}

            {viewDimension === 'dual' && (
              <div className="flex flex-col gap-3">
                <Fretboard
                  chordName={activeChord}
                  position={currentPosition}
                  displayMode={displayMode}
                  isLeftHanded={isLeftHanded}
                  onOpenChordDetail={() => setIsChordDetailOpen(true)}
                />
                <div className="h-[380px]">
                  <Guitar3D
                    chordName={activeChord}
                    position={currentPosition}
                    isLeftHanded={isLeftHanded}
                    onOpenChordDetail={() => setIsChordDetailOpen(true)}
                    onSwitchTo2D={() => setViewDimension('2d')}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Capo Recommendation Ribbon */}
          {capoAdvice.recommendedCapo > 0 && currentSong.capo === 0 && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
              <span className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>CAPO ADVICE: {capoAdvice.reason}</span>
              </span>
              <span className="font-bold text-amber-400">
                RECOMMENDED: CAPO {capoAdvice.recommendedCapo}
              </span>
            </div>
          )}

          {/* Synchronized Song & Chords Sheet */}
          <section className="flex-1 min-h-[500px]">
            <SongViewer
              song={currentSong}
              activeChord={activeChord}
              onSelectChord={handleSelectChord}
              onOpenChordDetail={(chord) => {
                handleSelectChord(chord);
                setIsChordDetailOpen(true);
              }}
              transposeOffset={transposeOffset}
              onTransposeChange={setTransposeOffset}
            />
          </section>
        </main>

        {/* RIGHT COLUMN: RACK INSPECTOR (320px) */}
        {isRightInspectorOpen && (
          <div className="w-[320px] shrink-0 h-[calc(100vh-52px)]">
            <RackInspector
              chordName={activeChord}
              position={currentPosition}
              onOpenChordDetail={() => setIsChordDetailOpen(true)}
              selectedScaleId={selectedScaleId}
              onSelectScaleId={setSelectedScaleId}
              selectedPatternId={selectedPatternId}
              onSelectPatternId={setSelectedPatternId}
            />
          </div>
        )}
      </div>

      {/* MODALS */}
      <SongSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        songs={songs}
        onSelectSong={handleSelectSong}
        onOpenCustomEditor={() => setIsCustomOpen(true)}
        initialQuery={searchParam}
      />

      <CustomSongModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onSaveSong={handleSaveCustomSong}
      />

      <ChordDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onSelectChord={handleSelectChord}
      />

      <ChordDetailModal
        isOpen={isChordDetailOpen}
        onClose={() => setIsChordDetailOpen(false)}
        chordDef={chordDef}
        chordName={activeChord}
        onSelectPosition={setPositionIdx}
        onApplyChord={(chord, posIdx) => {
          handleSelectChord(chord);
          if (posIdx !== undefined) setPositionIdx(posIdx);
        }}
      />

      {/* STUDIO TELEMETRY TOAST */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 bg-[#12141c] border border-amber-500/40 rounded shadow-2xl font-mono text-xs text-amber-300 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-500 hover:text-white"
          >
            [X]
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
