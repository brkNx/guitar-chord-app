import { useState } from 'react';
import type { Song } from '../types/guitar';
import { convertTwoLineToChordPro } from '../utils/chordPro';
import { X, Save, FileText } from 'lucide-react';

interface CustomSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSong: (newSong: Song) => void;
}

export const CustomSongModal = ({
  isOpen,
  onClose,
  onSaveSong
}: CustomSongModalProps) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('Am');
  const [capo, setCapo] = useState(0);
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !rawText.trim()) return;

    // Convert raw tab / text to ChordPro if needed
    const formattedContent = rawText.includes('[') ? rawText : convertTwoLineToChordPro(rawText);

    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Özel Şarkı',
      key: key.trim() || 'Am',
      capo: Number(capo) || 0,
      content: `{title: ${title.trim()}}\n{artist: ${artist.trim() || 'Özel'}}\n{key: ${key}}\n\n` + formattedContent,
      isCustom: true,
      tags: ['Özel Şarkı']
    };

    onSaveSong(newSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#11131A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between bg-[#090A0F]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">Özel Şarkı & Akor Ekle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-400 mb-1">Şarkı Başlığı *</label>
              <input
                type="text"
                placeholder="Örn: Akdeniz Akşamları"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#191C26] border border-white/10 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-400 mb-1">Sanatçı</label>
              <input
                type="text"
                placeholder="Örn: Haluk Levent"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 bg-[#191C26] border border-white/10 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-400 mb-1">Ton (Key)</label>
              <input
                type="text"
                placeholder="Örn: Am"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 bg-[#191C26] border border-white/10 rounded-lg text-white text-sm font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-400 mb-1">Kapo (0-12)</label>
              <input
                type="number"
                min="0"
                max="12"
                value={capo}
                onChange={(e) => setCapo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#191C26] border border-white/10 rounded-lg text-white text-sm font-mono focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-semibold text-slate-400">
                Akorlu Şarkı Metni *
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                İki satırlı tab veya [Am] formatı
              </span>
            </div>
            <textarea
              rows={9}
              placeholder={`Örnek İki Satırlı Tab:\nAm          C          G\nAkdeniz akşamları bir başka\n\nVeya ChordPro:\n[Am]Akdeniz akşamları [C]bir başka`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 bg-[#090A0F] font-mono text-xs text-slate-200 border border-white/10 rounded-lg focus:border-amber-500 outline-none leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.07] bg-[#090A0F] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !rawText.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Şarkıyı Kaydet & Aç</span>
          </button>
        </div>
      </div>
    </div>
  );
};
