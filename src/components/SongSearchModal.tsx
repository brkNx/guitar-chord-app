import { useState } from 'react';
import type { Song } from '../types/guitar';
import { generateSongWithAI } from '../services/aiChordGenerator';
import { Search, Sparkles, Music, Loader2, X, Plus } from 'lucide-react';

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenCustomEditor: () => void;
}

export const SongSearchModal = ({
  isOpen,
  onClose,
  songs,
  onSelectSong,
  onOpenCustomEditor
}: SongSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase()) ||
      s.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const handleAiGenerate = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateSongWithAI(query);
      onSelectSong(generated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/80">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            placeholder="Şarkı veya sanatçı adı ara (Örn: Duman, Gülpembe, veya yeni bir şarkı)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm md:text-base outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs"
          >
            Kapat
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSongs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                Kütüphanedeki Şarkılar ({filteredSongs.length})
              </p>
              {filteredSongs.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSong(s);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {s.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {s.artist} • Ton: <span className="text-amber-400 font-medium">{s.key}</span>
                        {s.capo > 0 && ` • Kapo ${s.capo}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-700/60 text-slate-300 font-medium">
                    {s.difficulty || 'Kolay'}
                  </span>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-6 px-4">
              <p className="text-slate-400 text-sm mb-4">
                "{query}" şarkısı kütüphanede henüz yok.
              </p>
            </div>
          ) : null}

          {/* AI Extraction Banner (Always Available for any query or new song!) */}
          {query.trim().length > 1 && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-indigo-200">
                    Yapay Zeka ile Akorları Çıkar
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-0.5">
                    Şarkı internette olmasa bile, yapay zeka tonu ve armoni dizilimini inceleyip gitara döksün.
                  </p>
                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Akorlar ve Armoni Çıkarılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>"{query}" İçin Akorları Üret</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Custom Song Editor Action */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-4">
          <span>İnternetten kopyaladığın akorları direkt yapıştırmak için:</span>
          <button
            onClick={() => {
              onClose();
              onOpenCustomEditor();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Kendi Şarkını / Akorunu Yapıştır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
