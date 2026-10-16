import { useState, useMemo, useEffect } from 'react';
import type { Song } from '../types/guitar';
import {
  generateSongWithAI,
  parseYouTubeOrSearchInput,
  fetchYouTubeMetadata,
  extractYouTubeVideoId,
  type YouTubeVideoInfo
} from '../services/aiChordGenerator';
import {
  Search,
  Sparkles,
  Music,
  Loader2,
  X,
  Plus,
  ArrowRight,
  TrendingUp,
  Play
} from 'lucide-react';

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenCustomEditor: () => void;
  initialQuery?: string;
}

const POPULAR_SUGGESTIONS = [
  'Manga - Cevapsız Sorular',
  'Şebnem Ferah - Sil Baştan',
  'Mor ve Ötesi - Cambaz',
  'Duman - Kırmış Kalbini',
  'Pinhani - Dön Bak Dünyaya',
  'Coldplay - The Scientist',
  'Nirvana - About a Girl'
];

export const SongSearchModal = ({
  isOpen,
  onClose,
  songs,
  onSelectSong,
  onOpenCustomEditor,
  initialQuery = ''
}: SongSearchModalProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [ytInfo, setYtInfo] = useState<YouTubeVideoInfo | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  const [isYtLoading, setIsYtLoading] = useState(false);

  const parsedInput = useMemo(() => parseYouTubeOrSearchInput(query), [query]);

  // Real-time YouTube metadata resolver
  useEffect(() => {
    const videoId = extractYouTubeVideoId(query);
    if (!videoId) {
      setYtInfo(null);
      setIsYtLoading(false);
      return;
    }

    let isMounted = true;
    setIsYtLoading(true);

    fetchYouTubeMetadata(query)
      .then((info) => {
        if (isMounted) {
          setYtInfo(info);
          setIsYtLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsYtLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (!isOpen) return null;

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase()) ||
      s.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const handleAiGenerate = async (searchTarget?: string) => {
    const targetQuery = (searchTarget || query).trim();
    if (!targetQuery) return;

    setIsGenerating(true);
    setGenerationStep('Parçanın armoni ve ton dizilimi taranıyor...');

    try {
      setTimeout(() => {
        setGenerationStep('Gitar akor pozisyonları ve sözler senkronize ediliyor...');
      }, 150);

      const generated = await generateSongWithAI(targetQuery, undefined, ytInfo || undefined);
      onSelectSong(generated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#11131A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="px-4 py-3.5 border-b border-white/[0.07] flex items-center gap-3 bg-[#090A0F]">
          <Search className="w-4 h-4 text-amber-500 shrink-0" />
          <input
            type="text"
            placeholder="Şarkı adı, sanatçı veya YouTube linki yapıştır..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none font-medium"
          />

          {parsedInput.isYouTube && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono">
              YouTube
            </span>
          )}

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>

        {/* Results and AI Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* YouTube Detected Spotlight Card */}
          {parsedInput.isYouTube && (
            <div className="p-4 rounded-xl bg-[#191C26] border border-white/[0.08] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Video Thumbnail */}
                <div className="relative w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 shrink-0 group">
                  {isYtLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#11131A] text-slate-400">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      <span className="text-[10px] font-mono">Yükleniyor...</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={ytInfo?.thumbnailUrl || `https://i.ytimg.com/vi/${parsedInput.videoId}/hqdefault.jpg`}
                        alt={ytInfo?.title || 'YouTube Video'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <Play className="w-4 h-4 ml-0.5 fill-white" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white uppercase">
                        YT
                      </span>
                    </>
                  )}
                </div>

                {/* Video Info and Action */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                      YouTube Kaynağı
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Hazır
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 line-clamp-2 leading-snug">
                    {isYtLoading
                      ? 'Video Bilgileri Alınıyor...'
                      : ytInfo?.title || `YouTube Video (${parsedInput.videoId})`}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    <span className="text-amber-400">
                      {ytInfo?.artist || 'YouTube'}
                    </span>
                    {ytInfo?.authorName && ytInfo.authorName !== ytInfo.artist && (
                      <span className="text-slate-500"> • {ytInfo.authorName}</span>
                    )}
                  </p>

                  <button
                    onClick={() => handleAiGenerate()}
                    disabled={isGenerating || isYtLoading}
                    className="mt-3.5 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{generationStep || 'Akorlar Çıkarılıyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Akorları Çıkar & Gitara Yükle</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unlisted Song: Sleek Studio Card */}
          {!parsedInput.isYouTube && query.trim().length > 0 && filteredSongs.length === 0 && (
            <div className="p-4 rounded-xl bg-[#191C26] border border-white/[0.08]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/10 uppercase">
                      Kütüphanede Yok
                    </span>
                    <span className="text-xs text-amber-400 font-mono">
                      AI Sentezleyici Aktif
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    "{query}" Parçasını Otomatik Çıkar
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Yapay zeka bu şarkının tonunu, ritim dizilimini ve akorlarını anında analiz edip gitara aktarır.
                  </p>

                  <button
                    onClick={() => handleAiGenerate()}
                    disabled={isGenerating}
                    className="mt-3.5 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{generationStep || 'Akorlar Çıkarılıyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Akorları Çıkar & Yükle</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* If there are matching songs in library */}
          {filteredSongs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Kütüphane Sonuçları ({filteredSongs.length})
                </p>
                {query && (
                  <button
                    onClick={() => handleAiGenerate()}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI ile Yeni Üret</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {filteredSongs.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSong(s);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#191C26] hover:bg-[#202433] border border-white/[0.07] hover:border-amber-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#11131A] text-slate-400 flex items-center justify-center group-hover:text-amber-400 border border-white/5 transition-colors">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {s.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {s.artist} • Ton: <span className="text-amber-400 font-bold">{s.key}</span>
                          {s.capo > 0 && ` • Kapo ${s.capo}`}
                          {s.tempo && ` • ${s.tempo} BPM`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/5">
                      {s.difficulty || 'Kolay'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick AI Extraction for Empty Query */}
          {!query && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  Hızlı Başlat (Popüler Şarkılar)
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleAiGenerate(preset)}
                      disabled={isGenerating}
                      className="px-2.5 py-1.5 rounded-lg bg-[#191C26] hover:bg-[#202433] border border-white/[0.07] hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 opacity-60" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube Link Paste helper */}
              <div className="p-3.5 rounded-xl bg-[#090A0F] border border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs font-mono">
                    YT
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">YouTube ile Şarkı Çıkar</h5>
                    <p className="text-[11px] text-slate-400">
                      Herhangi bir YouTube linkini üstteki arama çubuğuna yapıştırarak anında gitara aktar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Custom Song Editor Action */}
        <div className="px-4 py-3 bg-[#090A0F] border-t border-white/[0.07] flex items-center justify-between text-xs text-slate-400">
          <span>Özel akor metni girmek için:</span>
          <button
            onClick={() => {
              onClose();
              onOpenCustomEditor();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191C26] hover:bg-[#202433] text-slate-200 border border-white/10 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Kendi Akor Metnini Yapıştır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
