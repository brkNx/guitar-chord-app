import { useState, useEffect } from 'react';
import type { Song, FretboardDisplayMode } from './types/guitar';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { getOrGenerateChord } from './data/chordLibrary';
import { guitarAudio } from './audio/guitarAudio';
import { getCapoRecommendation } from './utils/transpose';
import { Fretboard } from './components/Fretboard';
import { Guitar3D } from './components/Guitar3D';
import { ChordDetailModal } from './components/ChordDetailModal';
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
  Layers,
  Box,
  Sliders,
  Info,
  Sparkles
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
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>('3d'); // 3D default
  const [displayMode, setDisplayMode] = useState<FretboardDisplayMode>('fingers');
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);

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

  // Get active chord definition & position
  const chordDef = getOrGenerateChord(activeChord);
  const currentPosition = chordDef.positions[positionIdx] || chordDef.positions[0];

  // Capo recommendation
  const capoAdvice = getCapoRecommendation(currentSong.key);

  // Handle chord selection from song or dictionary
  const handleSelectChord = (chord: string) => {
    setActiveChord(chord);
    setPositionIdx(0);
    const def = getOrGenerateChord(chord);
    if (def.positions[0]) {
      guitarAudio.strumChord(def.positions[0], 'down', 24);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
    // Automatically persist if newly generated AI or custom song
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

    if (song.isAiGenerated) {
      showToast(`✨ "${song.title}" yapay zeka ile başarıyla çıkarıldı ve gitara yüklendi!`);
    }

    const firstChordMatch = song.content.match(/\[([A-G][^\]]*)\]/);
    if (firstChordMatch && firstChordMatch[1]) {
      handleSelectChord(firstChordMatch[1]);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 font-bold">
              <Guitar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white m-0 p-0 leading-tight">
                  Gitar Akor Pro
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/30">
                  3D + AI Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0 p-0">
                İnteraktif 3D Klavye & Şarkı Asistanı
              </p>
            </div>
          </div>

          {/* Center Search Trigger */}
          <div className="flex-1 max-w-md mx-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-900/90 hover:bg-slate-850 border border-slate-700/60 rounded-xl text-slate-400 text-xs md:text-sm transition-all shadow-inner group"
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
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              title="Yeni şarkı veya YouTube linki ile akor çıkar"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Akor Çıkar</span>
            </button>

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Top: Sticky Guitar Fretboard & Studio Controls */}
        <section className="sticky top-[61px] z-30 bg-slate-950/95 backdrop-blur-md pt-1 pb-2 shadow-xl border-b border-slate-900/60 flex flex-col gap-2">
          {/* Fretboard Studio Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            {/* Left: 2D vs 3D Mode Toggle & Voicings */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  onClick={() => setViewDimension('3d')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                    viewDimension === '3d'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Gitar</span>
                </button>
                <button
                  onClick={() => setViewDimension('2d')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
                    viewDimension === '2d'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>2D Klavye</span>
                </button>
              </div>

              {/* Voicing variations selector */}
              {chordDef.positions.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-500" />
                    Pozisyon:
                  </span>
                  {chordDef.positions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPositionIdx(idx);
                        guitarAudio.strumChord(chordDef.positions[idx], 'down', 24);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                        positionIdx === idx
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Chord details popup trigger button */}
              <button
                onClick={() => setIsChordDetailOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                title="Akor detaylarını ve seslerini incele"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Akor Bilgisi</span>
              </button>
            </div>

            {/* Right: Display Modes & Left-Handed Toggle */}
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
                className={`px-2.5 py-1 rounded-xl border text-xs font-semibold transition-colors ${
                  isLeftHanded
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Solak gitarist klavye simetrisi"
              >
                {isLeftHanded ? 'Solak (Aktif)' : 'Solak'}
              </button>
            </div>
          </div>

          {/* Render 3D vs 2D Guitar */}
          {viewDimension === '3d' ? (
            <Guitar3D
              chordName={activeChord}
              position={currentPosition}
              isLeftHanded={isLeftHanded}
              onOpenChordDetail={() => setIsChordDetailOpen(true)}
            />
          ) : (
            <Fretboard
              chordName={activeChord}
              position={currentPosition}
              displayMode={displayMode}
              isLeftHanded={isLeftHanded}
              onOpenChordDetail={() => setIsChordDetailOpen(true)}
            />
          )}

          {/* Capo Advice Ribbon */}
          {capoAdvice.recommendedCapo > 0 && currentSong.capo === 0 && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <b>Kapo İpucu:</b> {capoAdvice.reason}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400/90">
                Önerilen Kapo: {capoAdvice.recommendedCapo}. Perde
              </span>
            </div>
          )}
        </section>

        {/* Bottom: Synchronized Song & Chords Sheet */}
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

      {/* Modals */}
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

      {/* Studio Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 border border-amber-500/50 rounded-2xl shadow-2xl text-xs font-semibold text-amber-300 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
