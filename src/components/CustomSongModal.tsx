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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Yeni Şarkı & Akor Ekle</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Şarkı Başlığı *</label>
              <input
                type="text"
                placeholder="Örn: Ay Yüzlüm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sanatçı</label>
              <input
                type="text"
                placeholder="Örn: Murat Göğebakan"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ton (Key)</label>
              <input
                type="text"
                placeholder="Örn: Am, Em, C"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Kapo (Perde No)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={capo}
                onChange={(e) => setCapo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400">
                Akorlu Sözler veya ChordPro Metni *
              </label>
              <span className="text-[11px] text-slate-500">
                İnternetten kopyaladığın akorları direkt yapıştırabilirsin.
              </span>
            </div>
            <textarea
              rows={10}
              placeholder={`Örnek İki Satırlı Tab:\nAm          C          G\nAkdeniz akşamları bir başka\n\nVeya ChordPro:\n[Am]Akdeniz akşamları [C]bir başka`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 bg-slate-950 font-mono text-xs md:text-sm text-slate-200 border border-slate-800 rounded-xl focus:border-amber-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !rawText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Şarkıyı Kaydet & Aç</span>
          </button>
        </div>
      </div>
    </div>
  );
};
