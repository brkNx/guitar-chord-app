import { useState } from 'react';
import type { Song } from '../types/guitar';
import { Search, Plus, Radio, SlidersHorizontal, Sparkles, Video } from 'lucide-react';

interface SongRosterProps {
  songs: Song[];
  currentSong: Song;
  onSelectSong: (song: Song) => void;
  onOpenSearchModal: () => void;
  onOpenCustomModal: () => void;
  onQuickAiImport: (query: string) => void;
  isAiLoading: boolean;
}

export function SongRoster({
  songs,
  currentSong,
  onSelectSong,
  onOpenSearchModal,
  onOpenCustomModal,
  onQuickAiImport,
  isAiLoading
}: SongRosterProps) {
  const [filter, setFilter] = useState<'all' | 'builtin' | 'custom' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');

  const filteredSongs = songs.filter((s) => {
    if (filter === 'builtin' && (s.isCustom || s.isAiGenerated)) return false;
    if (filter === 'custom' && (!s.isCustom || s.isAiGenerated)) return false;
    if (filter === 'ai' && !s.isAiGenerated) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArtist = s.artist.toLowerCase().includes(q);
      return matchTitle || matchArtist;
    }
    return true;
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || isAiLoading) return;
    onQuickAiImport(quickInput.trim());
    setQuickInput('');
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b0c10] border-r border-white/10 select-none text-slate-200">
      {/* Header telemetry */}
      <div className="px-3.5 py-2.5 border-b border-white/10 bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            SETLIST ARCHIVE
          </span>
        </div>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          [{filteredSongs.length} TRACKS]
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-white/10 bg-[#090a0f]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks (/)..."
            className="w-full bg-[#12141c] border border-white/10 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
            >
              CLR
            </button>
          )}
        </div>

        {/* Quick Filter Segmented Control */}
        <div className="grid grid-cols-4 gap-1 mt-2 font-mono text-[10px]">
          {(['all', 'builtin', 'custom', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-1 text-center rounded border transition-colors uppercase ${
                filter === tab
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-semibold'
                  : 'bg-[#12141c] border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'ALL' : tab === 'builtin' ? 'STOCK' : tab === 'custom' ? 'USER' : 'AI'}
            </button>
          ))}
        </div>
      </div>

      {/* AI / YouTube Quick Importer Strip */}
      <form onSubmit={handleQuickSubmit} className="p-2 border-b border-white/10 bg-[#0d0f17]">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Video className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-red-400" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="YouTube or song query..."
              disabled={isAiLoading}
              className="w-full bg-[#151824] border border-white/10 rounded pl-7 pr-2 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isAiLoading || !quickInput.trim()}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 text-white font-mono text-[10px] font-bold rounded border border-indigo-400/30 flex items-center gap-1 transition-all"
            title="Import or generate chords"
          >
            {isAiLoading ? (
              <span className="animate-spin text-[10px]">◌</span>
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>EXTRACT</span>
          </button>
        </div>
      </form>

      {/* Song List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-1 space-y-0.5">
        {filteredSongs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs">
            NO TRACKS MATCH CRITERIA
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isSelected = song.id === currentSong.id;
            return (
              <button
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`w-full text-left p-2.5 rounded transition-all flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-semibold text-xs leading-snug truncate">
                    {song.title}
                  </div>
                  {song.isAiGenerated && (
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                      AI RIG
                    </span>
                  )}
                  {song.isCustom && !song.isAiGenerated && (
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      USER
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  {song.artist}
                </div>

                <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-slate-400">
                  <span className="px-1 py-0.5 rounded bg-white/5 border border-white/5">
                    KEY: {song.key}
                  </span>
                  {song.tempo && (
                    <span className="px-1 py-0.5 rounded bg-white/5 border border-white/5">
                      {song.tempo} BPM
                    </span>
                  )}
                  {song.capo !== undefined && song.capo > 0 && (
                    <span className="px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      CAPO {song.capo}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-2 border-t border-white/10 bg-[#0e1017] grid grid-cols-2 gap-1.5 font-mono text-[11px]">
        <button
          onClick={onOpenCustomModal}
          className="py-1.5 px-2 bg-[#171924] hover:bg-[#202333] border border-white/10 rounded flex items-center justify-center gap-1.5 text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>NEW TRACK</span>
        </button>

        <button
          onClick={onOpenSearchModal}
          className="py-1.5 px-2 bg-[#171924] hover:bg-[#202333] border border-white/10 rounded flex items-center justify-center gap-1.5 text-slate-300 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>BROWSER</span>
        </button>
      </div>
    </aside>
  );
}
