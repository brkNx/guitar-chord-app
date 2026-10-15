import { useState, useEffect } from 'react';
import type { Song, FretboardDisplayMode } from './types/guitar';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { getOrGenerateChord } from './data/chordLibrary';
import { guitarAudio } from './audio/guitarAudio';
import { Fretboard } from './components/Fretboard';
import { SongViewer } from './components/SongViewer';
import { SongSearchModal } from './components/SongSearchModal';
import { CustomSongModal } from './components/CustomSongModal';
import { ChordDictionaryModal } from './components/ChordDictionaryModal';
import { Metronome } from './components/Metronome';
import {
  Search,
  BookOpen,
  Plus,
  Guitar,
  Layers
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
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  // Get active chord definition & position
  const chordDef = getOrGenerateChord(activeChord);
  const currentPosition = chordDef.positions[positionIdx] || chordDef.positions[0];

  // Handle chord selection from song or dictionary
  const handleSelectChord = (chord: string) => {
    setActiveChord(chord);
    setPositionIdx(0);
    const def = getOrGenerateChord(chord);
    if (def.positions[0]) {
      guitarAudio.strumChord(def.positions[0], 'down', 28);
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
  };

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setTransposeOffset(0);
    // Automatically select the first chord in the song if available
    const firstChordMatch = song.content.match(/\[([A-G][^\]]*)\]/);
    if (firstChordMatch && firstChordMatch[1]) {
      handleSelectChord(firstChordMatch[1]);
    }
  };

  // Keyboard shortcut: '/' opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && !isCustomOpen && !isDictionaryOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isCustomOpen, isDictionaryOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold">
              <Guitar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white m-0 p-0 leading-tight">
                  Gitar Akor Pro
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  AI + Fretboard
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0 p-0">
                İnteraktif Akor & Şarkı Asistanı
              </p>
            </div>
          </div>

          {/* Center Search Trigger */}
          <div className="flex-1 max-w-md mx-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl text-slate-400 text-xs md:text-sm transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300">
                  Şarkı ara veya <span className="text-indigo-400 font-semibold">AI ile yeni akor çıkar...</span>
                </span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded border border-slate-700">
                /
              </kbd>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <Metronome />

            <button
              onClick={() => setIsDictionaryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              title="Akor Kütüphanesini Aç"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Akorlar</span>
            </button>

            <button
              onClick={() => setIsCustomOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              title="Yeni Şarkı Ekle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Şarkı Ekle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-5">
        {/* Top: Sticky Interactive Guitar Fretboard & Controls */}
        <section className="sticky top-[61px] z-30 bg-slate-950/95 backdrop-blur-md pt-1 pb-2 shadow-xl border-b border-slate-900/60 flex flex-col gap-2">
          {/* Fretboard Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            {/* Voicing variations (if chord has multiple positions) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Pozisyon:
              </span>
              <div className="flex items-center gap-1">
                {chordDef.positions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPositionIdx(idx);
                      guitarAudio.strumChord(chordDef.positions[idx], 'down', 28);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      positionIdx === idx
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* View Modes (Fingers vs Note Names) & Left-handed Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setDisplayMode('fingers')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    displayMode === 'fingers'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Parmak No
                </button>
                <button
                  onClick={() => setDisplayMode('notes')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    displayMode === 'notes'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nota Adı
                </button>
              </div>

              <button
                onClick={() => setIsLeftHanded(!isLeftHanded)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isLeftHanded
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Solak gitarist görünümü"
              >
                {isLeftHanded ? 'Solak (Aktif)' : 'Solak'}
              </button>
            </div>
          </div>

          {/* Interactive Fretboard Visualizer */}
          <Fretboard
            chordName={activeChord}
            position={currentPosition}
            displayMode={displayMode}
            isLeftHanded={isLeftHanded}
          />
        </section>

        {/* Bottom: Synchronized Song & Chords Sheet */}
        <section className="flex-1 min-h-[500px]">
          <SongViewer
            song={currentSong}
            activeChord={activeChord}
            onSelectChord={handleSelectChord}
            transposeOffset={transposeOffset}
            onTransposeChange={setTransposeOffset}
          />
        </section>
      </main>

      {/* Modals */}
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

      <ChordDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onSelectChord={handleSelectChord}
      />
    </div>
  );
}

export default App;
