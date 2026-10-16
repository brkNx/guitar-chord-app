import { useState } from 'react';
import { NOTES, getOrGenerateChord } from '../data/chordLibrary';
import { guitarAudio } from '../audio/guitarAudio';
import { X, BookOpen, Volume2 } from 'lucide-react';

interface ChordDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChord: (chordName: string) => void;
}

const QUALITIES = [
  { label: 'Majör', suffix: '' },
  { label: 'Minör (m)', suffix: 'm' },
  { label: '7', suffix: '7' },
  { label: 'Minör 7 (m7)', suffix: 'm7' },
  { label: 'Majör 7 (maj7)', suffix: 'maj7' },
  { label: 'Sus4', suffix: 'sus4' },
  { label: 'Sus2', suffix: 'sus2' },
  { label: 'Add9', suffix: 'add9' }
];

export const ChordDictionaryModal = ({
  isOpen,
  onClose,
  onSelectChord
}: ChordDictionaryModalProps) => {
  const [selectedRoot, setSelectedRoot] = useState('Am'.replace(/[^A-G#b]/g, '') || 'A');
  const [selectedSuffix, setSelectedSuffix] = useState('m');

  if (!isOpen) return null;

  const currentChordName = `${selectedRoot}${selectedSuffix}`;
  const chordDef = getOrGenerateChord(currentChordName);

  const handleApply = () => {
    onSelectChord(currentChordName);
    guitarAudio.strumChord(chordDef.positions[0], 'down', 28);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#11131A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between bg-[#090A0F]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">Akor Kütüphanesi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Root Note Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Kök Nota (Root)
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {NOTES.map((root) => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedRoot === root
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#191C26] text-slate-300 hover:bg-[#202433] border border-white/[0.07]'
                  }`}
                >
                  {root}
                </button>
              ))}
            </div>
          </div>

          {/* Quality / Suffix Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Akor Tipi (Quality)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.suffix}
                  onClick={() => setSelectedSuffix(q.suffix)}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all text-left border ${
                    selectedSuffix === q.suffix
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                      : 'bg-[#191C26] text-slate-300 hover:bg-[#202433] border-white/[0.07]'
                  }`}
                >
                  <span className="font-mono">{selectedRoot}</span>
                  {q.suffix || ' (Majör)'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-4 bg-[#090A0F] border border-white/[0.07] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase">Seçili Akor</span>
              <h2 className="text-2xl font-black font-mono text-amber-400">{currentChordName}</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {chordDef.positions.length} farklı çalım pozisyonu
              </p>
            </div>

            <button
              onClick={() => guitarAudio.strumChord(chordDef.positions[0], 'down', 28)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#191C26] hover:bg-[#202433] text-slate-200 border border-white/10 rounded-lg text-xs font-semibold transition-colors"
            >
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Dinle</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.07] bg-[#090A0F] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all"
          >
            Gitara Yerleştir
          </button>
        </div>
      </div>
    </div>
  );
};
