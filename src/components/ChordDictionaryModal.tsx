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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Akor Kütüphanesi</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Root Note Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Kök Nota (Root)
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {NOTES.map((root) => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedRoot === root
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {root}
                </button>
              ))}
            </div>
          </div>

          {/* Quality / Suffix Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Akor Tipi (Quality)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.suffix}
                  onClick={() => setSelectedSuffix(q.suffix)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    selectedSuffix === q.suffix
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedRoot}
                  {q.suffix || ' (Majör)'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Seçili Akor:</span>
              <h2 className="text-2xl font-black text-amber-400">{currentChordName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {chordDef.positions.length} farklı çalım pozisyonu mevcut
              </p>
            </div>

            <button
              onClick={() => guitarAudio.strumChord(chordDef.positions[0], 'down', 28)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Dinle</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Kapat
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
          >
            Gitara Yerleştir
          </button>
        </div>
      </div>
    </div>
  );
};
