import { useState } from 'react';
import type { ChordDefinition, ChordPosition } from '../types/guitar';
import { getOrGenerateChord } from '../data/chordLibrary';
import { getChordTheoryDetails, type ChordTone } from '../utils/chordTheory';
import { guitarAudio } from '../audio/guitarAudio';
import {
  X,
  Volume2,
  Sparkles,
  Layers,
  Music,
  ArrowDown,
  ArrowUp,
  Check
} from 'lucide-react';

interface ChordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  chordDef?: ChordDefinition;
  chordName?: string;
  onSelectPosition?: (posIdx: number) => void;
  onApplyChord?: (chord: string, positionIdx?: number) => void;
}

export const ChordDetailModal = ({
  isOpen,
  onClose,
  chordDef: propChordDef,
  chordName: propChordName,
  onSelectPosition,
  onApplyChord
}: ChordDetailModalProps) => {
  const [selectedPosIdx, setSelectedPosIdx] = useState(0);
  const [activePluckedString, setActivePluckedString] = useState<number | null>(null);
  const [isPlayingArpeggio, setIsPlayingArpeggio] = useState(false);
  const [isPlayingStrum, setIsPlayingStrum] = useState(false);

  if (!isOpen) return null;

  const targetChordName = propChordName || propChordDef?.name || 'Am';
  const effectiveChordDef = propChordDef || getOrGenerateChord(targetChordName);
  const currentPos: ChordPosition =
    effectiveChordDef.positions[selectedPosIdx] ||
    effectiveChordDef.positions[0] || {
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: [0, 0, 2, 3, 1, 0],
      baseFret: 1
    };

  const theory = getChordTheoryDetails(effectiveChordDef.name, currentPos);

  const handlePluckString = (stringIdx: number, fret: number) => {
    setActivePluckedString(stringIdx);
    guitarAudio.pluckNote(stringIdx, fret >= 0 ? fret : 0, 0.9, fret < 0);
    setTimeout(() => setActivePluckedString(null), 350);
  };

  const handleStrum = async (direction: 'down' | 'up' = 'down') => {
    setIsPlayingStrum(true);
    await guitarAudio.strumChord(currentPos, direction, 28, false, (strIdx) => {
      setActivePluckedString(strIdx);
      setTimeout(() => setActivePluckedString(null), 180);
    });
    setTimeout(() => setIsPlayingStrum(false), 400);
  };

  const handleArpeggio = async () => {
    if (isPlayingArpeggio) return;
    setIsPlayingArpeggio(true);
    await guitarAudio.arpeggiateChord(currentPos, 'pima', 130, (strIdx) => {
      setActivePluckedString(strIdx);
      setTimeout(() => setActivePluckedString(null), 200);
    });
    setTimeout(() => setIsPlayingArpeggio(false), 900);
  };

  const handleBassOnly = async () => {
    await guitarAudio.strumBass(currentPos, (strIdx) => {
      setActivePluckedString(strIdx);
      setTimeout(() => setActivePluckedString(null), 300);
    });
  };

  const handleSelectTone = (tone: ChordTone) => {
    const matchingStr = theory.stringsAnalysis.find((s) => s.note === tone.note && s.fret >= 0);
    if (matchingStr) {
      handlePluckString(matchingStr.stringIdx, matchingStr.fret);
    } else {
      guitarAudio.pluckFrequency(220 * Math.pow(2, tone.semitones / 12), 0.85);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.18)] overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={{
          transform: 'perspective(1200px) rotateX(1deg)'
        }}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30 tracking-tight p-2">
              {effectiveChordDef.name}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide">
                  {theory.fullName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  {theory.typeCategory}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kök Nota: <span className="text-amber-400 font-bold">{theory.root}</span> • Formül:{' '}
                <span className="text-slate-200 font-semibold">{theory.formula}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors relative z-10"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Audio Action Quick Deck */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-500" />
              Stüdyo Tınısı:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStrum('down')}
                disabled={isPlayingStrum}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isPlayingStrum
                    ? 'bg-amber-500 text-slate-950 scale-95 ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:shadow-amber-500/25 active:scale-95'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>{isPlayingStrum ? 'Tınlıyor...' : 'Aşağı Vuruş'}</span>
              </button>

              <button
                onClick={() => handleStrum('up')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 active:scale-95 transition-all"
              >
                <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Yukarı Vuruş</span>
              </button>

              <button
                onClick={handleArpeggio}
                disabled={isPlayingArpeggio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isPlayingArpeggio
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-95'
                    : 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 active:scale-95'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isPlayingArpeggio ? 'Arpej...' : 'Arpej (P-I-M-A)'}</span>
              </button>

              <button
                onClick={handleBassOnly}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors font-mono"
                title="Sadece en kalın bas notayı çalar"
              >
                BAS NOTA
              </button>
            </div>
          </div>

          {/* Section 1: Akor Sesleri ve Dereceleri (Chord Tones / Intervals) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-500" />
                Akor Sesleri ve Aralık Formülü
              </h4>
              <span className="text-[11px] text-slate-400 italic">{theory.mood}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {theory.tones.map((tone) => (
                <div
                  key={tone.degree}
                  onClick={() => handleSelectTone(tone)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 cursor-pointer transition-all group shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black px-1.5 py-0.5 rounded ${
                        tone.isRoot
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700 text-cyan-300'
                      }`}
                    >
                      {tone.degree}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-amber-400 font-mono">
                      [PLAY]
                    </span>
                  </div>
                  <div className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                    {tone.note}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {tone.intervalName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Tel Tel Parmak Pozisyonu (Fretboard Breakdown) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Tel Tel Parmak ve Nota Dizilimi (Gitardaki Yeri)
              </h4>
              <span className="text-[11px] text-slate-500">Tele tıklayarak notasını tınlat</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-md">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="p-2.5 pl-3">Tel</th>
                    <th className="p-2.5">Perde (Fret)</th>
                    <th className="p-2.5">Nota</th>
                    <th className="p-2.5">Derece / Rol</th>
                    <th className="p-2.5">Parmak</th>
                    <th className="p-2.5 pr-3 text-right">Ses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {theory.stringsAnalysis.map((str) => {
                    const isPlucked = activePluckedString === str.stringIdx;
                    return (
                      <tr
                        key={str.stringIdx}
                        onClick={() => handlePluckString(str.stringIdx, str.fret)}
                        className={`cursor-pointer transition-colors ${
                          isPlucked
                            ? 'bg-amber-500/20 text-white font-bold'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="p-2.5 pl-3 font-sans font-semibold text-white flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPlucked
                                ? 'bg-amber-400 animate-ping'
                                : str.status === 'muted'
                                ? 'bg-red-500/60'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {str.stringName}
                        </td>
                        <td className="p-2.5">
                          {str.status === 'muted' ? (
                            <span className="text-red-400 font-bold">✕ Mute</span>
                          ) : str.status === 'open' ? (
                            <span className="text-emerald-400 font-bold">0 (Boş)</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                              {str.fret}. Perde
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {str.status === 'muted' ? (
                            <span className="text-slate-600">-</span>
                          ) : (
                            <span className="font-sans font-bold text-white text-sm">
                              {str.note}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          {str.status === 'muted' ? (
                            <span className="text-slate-500 text-[11px]">Çalınmaz</span>
                          ) : (
                            <span className="text-cyan-300 text-[11px] font-semibold">
                              {str.degree}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          {str.status === 'muted' ? (
                            <span className="text-slate-600">-</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px]">
                              {str.fingerName}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 pr-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePluckString(str.stringIdx, str.fret);
                            }}
                            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Alternatif Çalım Pozisyonları (Voicings) */}
          {effectiveChordDef.positions.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Alternatif Çalım Pozisyonları ({effectiveChordDef.positions.length} Pozisyon)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {effectiveChordDef.positions.map((pos, pIdx) => {
                  const isSelected = selectedPosIdx === pIdx;
                  return (
                    <div
                      key={pIdx}
                      onClick={() => {
                        setSelectedPosIdx(pIdx);
                        if (onSelectPosition) onSelectPosition(pIdx);
                        guitarAudio.strumChord(pos, 'down', 28);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/15 ring-1 ring-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">
                          Pozisyon #{pIdx + 1}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        {pos.baseFret > 1
                          ? `${pos.baseFret}. Perde Bareli`
                          : 'Açık Gitar Pozisyonu'}
                      </p>
                      <div className="mt-1.5 font-mono text-[10px] text-slate-500">
                        Perdeler: [{pos.frets.join(' ')}]
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 px-6">
          <div className="text-xs text-slate-400">
            Seçili Pozisyon:{' '}
            <span className="text-white font-bold">#{selectedPosIdx + 1}</span>
            {currentPos.baseFret > 1 && ` (${currentPos.baseFret}. Perde)`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Kapat
            </button>

            {onApplyChord && (
              <button
                onClick={() => {
                  onApplyChord(effectiveChordDef.name, selectedPosIdx);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Gitara Aktar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
