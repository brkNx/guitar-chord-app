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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.12)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/80 relative">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            placeholder="Şarkı adı, sanatçı veya YouTube linki yapıştır..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm md:text-base outline-none font-medium"
          />

          {parsedInput.isYouTube && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
              <span>▶ YouTube Linki</span>
            </span>
          )}

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 px-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>

        {/* Results and AI Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* YouTube Detected Spotlight Card */}
          {parsedInput.isYouTube && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-red-950/70 via-slate-900 to-amber-950/40 border-2 border-red-500/50 shadow-2xl shadow-red-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
                {/* Video Thumbnail */}
                <div className="relative w-full sm:w-44 aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-red-500/30 shrink-0 shadow-lg group">
                  {isYtLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900 text-slate-400">
                      <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                      <span className="text-[11px] font-medium">Video yükleniyor...</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={ytInfo?.thumbnailUrl || `https://i.ytimg.com/vi/${parsedInput.videoId}/hqdefault.jpg`}
                        alt={ytInfo?.title || 'YouTube Video'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wider">
                        YOUTUBE
                      </span>
                    </>
                  )}
                </div>

                {/* Video Info and Action */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wider flex items-center gap-1">
                      <span>▶ YouTube Entegrasyonu</span>
                    </span>
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Yapay Zeka Hazır
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white mt-1.5 line-clamp-2 leading-snug">
                    {isYtLoading
                      ? 'YouTube Video Bilgileri Alınıyor...'
                      : ytInfo?.title || `YouTube Video (${parsedInput.videoId})`}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center gap-2">
                    <span className="text-amber-300">
                      {ytInfo?.artist || 'YouTube Sanatçısı'}
                    </span>
                    {ytInfo?.authorName && ytInfo.authorName !== ytInfo.artist && (
                      <span className="text-slate-400 font-normal">
                        • {ytInfo.authorName}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    Parçanın ritmi ve armonisi analiz edilerek gerçek zamanlı 3D gitar klavyesine akor basışları aktarılacaktır.
                  </p>

                  <button
                    onClick={() => handleAiGenerate()}
                    disabled={isGenerating || isYtLoading}
                    className="mt-3.5 w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 hover:from-red-500 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{generationStep || 'Akorlar Çıkarılıyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-slate-950" />
                        <span>
                          {ytInfo?.title
                            ? `"${ytInfo.title.slice(0, 22)}..." Akorlarını Çıkar & Yükle`
                            : 'AI ile Akorları Çıkar & Gitara Yükle'}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unlisted Song: Glowing Spotlight AI Card (Non-YouTube query) */}
          {!parsedInput.isYouTube && query.trim().length > 0 && filteredSongs.length === 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-amber-950/30 border-2 border-indigo-500/50 shadow-xl shadow-indigo-950/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      Listede Bulunamadı
                    </span>
                    <span className="text-xs text-amber-400 font-bold">
                      Yapay Zeka Hazır
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    "{query}" Parçası Kütüphanede Yok
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Yapay zeka bu şarkının tonunu, ritim dizilimini ve akorlarını anında çıkarıp parmak pozisyonlarıyla birlikte doğrudan gitara döksün.
                  </p>

                  <button
                    onClick={() => handleAiGenerate()}
                    disabled={isGenerating}
                    className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{generationStep || 'Akorlar Çıkarılıyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>AI ile Anında Akorları Çıkar & Gitara Yükle</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kütüphanedeki Şarkılar ({filteredSongs.length})
                </p>
                {query && (
                  <button
                    onClick={() => handleAiGenerate()}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI ile Yeni Versiyon Üret</span>
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
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-amber-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {s.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {s.artist} • Ton: <span className="text-amber-400 font-bold">{s.key}</span>
                          {s.capo > 0 && ` • Kapo ${s.capo}`}
                          {s.tempo && ` • ${s.tempo} BPM`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-300 font-medium">
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
              {/* Popular Song Suggestions */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  Tek Tıkla Akor Çıkar (Popüler Şarkılar)
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleAiGenerate(preset)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all group flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube Link Paste Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs">
                    ▶
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">YouTube Linki ile Akor Çıkar</h5>
                    <p className="text-[11px] text-slate-400">
                      YouTube video linkini üstteki arama kutusuna yapıştırarak anında gitara aktarabilirsin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Custom Song Editor Action */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-5">
          <span>İnternetten kopyaladığın akorları direkt yapıştırmak için:</span>
          <button
            onClick={() => {
              onClose();
              onOpenCustomEditor();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Kendi Akor Metnini Yapıştır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
