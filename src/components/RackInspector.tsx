import { useState } from 'react';
import type { ChordPosition } from '../types/guitar';
import { getChordTheoryDetails } from '../utils/chordTheory';
import type { ChordTone } from '../utils/chordTheory';
import { GUITAR_SCALES, getScaleNotes, extractRootNote, GUITAR_SCALES as SCALES } from '../data/scales';
import { STRUM_PATTERNS } from '../data/strumPatterns';
import { guitarAudio } from '../audio/guitarAudio';
import {
  Activity,
  Music,
  Play,
  Info
} from 'lucide-react';

interface RackInspectorProps {
  chordName: string;
  position?: ChordPosition;
  onOpenChordDetail?: () => void;
  selectedScaleId: string;
  onSelectScaleId: (scaleId: string) => void;
  selectedPatternId: string;
  onSelectPatternId: (patternId: string) => void;
}

export function RackInspector({
  chordName,
  position,
  onOpenChordDetail,
  selectedScaleId,
  onSelectScaleId,
  selectedPatternId,
  onSelectPatternId
}: RackInspectorProps) {
  const [activeTab, setActiveTab] = useState<'theory' | 'scales' | 'strum'>('theory');
  const [isPlayingStrum, setIsPlayingStrum] = useState(false);

  // Analyze chord theory
  const theory = getChordTheoryDetails(chordName, position);
  const rootNote = extractRootNote(chordName);

  // Selected scale
  const activeScale = SCALES.find((s) => s.id === selectedScaleId) || SCALES[0];
  const scaleNotes = getScaleNotes(rootNote, activeScale);

  // Selected strum pattern
  const activePattern =
    STRUM_PATTERNS.find((p) => p.id === selectedPatternId) || STRUM_PATTERNS[0];

  const handlePlayDown = () => {
    if (position) {
      guitarAudio.strumChord(position, 'down', 24);
    }
  };

  const handlePlayUp = () => {
    if (position) {
      guitarAudio.strumChord(position, 'up', 24);
    }
  };

  const handlePlayArpeggio = () => {
    if (position) {
      guitarAudio.arpeggiateChord(position, 'pima', 110);
    }
  };

  const handlePlaySingleNote = (strIdx: number, fret: number) => {
    if (fret >= 0) {
      guitarAudio.pluckNote(strIdx, fret, 0.9);
    }
  };

  const handleTriggerStrumPattern = async () => {
    if (!position || isPlayingStrum) return;
    setIsPlayingStrum(true);
    const msPerBeat = (60 / (activePattern.defaultBpm || 96)) * 500;

    for (let i = 0; i < activePattern.strokes.length; i++) {
      const stroke = activePattern.strokes[i];
      if (stroke.type === 'down') {
        guitarAudio.strumChord(position, 'down', 20);
      } else if (stroke.type === 'up') {
        guitarAudio.strumChord(position, 'up', 20);
      } else if (stroke.type === 'bass') {
        guitarAudio.strumBass(position);
      }
      await new Promise((r) => setTimeout(r, msPerBeat));
    }
    setIsPlayingStrum(false);
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b0c10] border-l border-white/10 select-none text-slate-200">
      {/* Top Header telemetry */}
      <div className="px-3.5 py-2.5 border-b border-white/10 bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            RACK INSPECTOR
          </span>
        </div>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-amber-400 font-bold">
          {chordName}
        </span>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-3 p-1.5 border-b border-white/10 bg-[#090a0f] gap-1 font-mono text-[10px]">
        {(['theory', 'scales', 'strum'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 rounded border text-center transition-all uppercase ${
              activeTab === tab
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                : 'bg-[#12141c] border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'theory' ? '[THEORY]' : tab === 'scales' ? '[SCALES]' : '[STRUM]'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {/* TAB 1: THEORY */}
        {activeTab === 'theory' && (
          <div className="space-y-3">
            {/* Chord Banner */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white tracking-tight">
                  {theory.fullName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {theory.typeCategory}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {theory.mood}
              </p>
            </div>

            {/* Formula / Intervals Breakdown */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>INTERVALS FORMULA</span>
                <span className="text-amber-400 font-bold">{theory.formula}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {theory.tones.map((t: ChordTone, idx: number) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1.5 ${
                      t.isRoot
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="font-bold">{t.degree}</span>
                    <span className="text-[10px] text-slate-400">({t.note})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6-String Matrix Table */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>6-STRING VOICING MATRIX</span>
                <span className="text-slate-500 text-[9px]">STR 6 to 1</span>
              </div>
              <div className="border border-white/5 rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#171a26] text-slate-400 text-[10px] border-b border-white/10 font-bold">
                    <tr>
                      <th className="py-1 px-2">STR</th>
                      <th className="py-1 px-1.5">FRET</th>
                      <th className="py-1 px-2">NOTE</th>
                      <th className="py-1 px-2">DEGREE</th>
                      <th className="py-1 px-1.5 text-right">FINGER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {theory.stringsAnalysis.map((str) => {
                      const isMuted = str.status === 'muted';
                      const isOpen = str.status === 'open';
                      return (
                        <tr
                          key={str.stringIdx}
                          onClick={() => handlePlaySingleNote(str.stringIdx, str.fret)}
                          className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                            isMuted ? 'text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <td className="py-1 px-2 font-bold text-slate-400">
                            {str.stringNumber} ({str.stringName})
                          </td>
                          <td className="py-1 px-1.5">
                            {isMuted ? (
                              <span className="text-rose-400 font-bold">X</span>
                            ) : isOpen ? (
                              <span className="text-emerald-400 font-bold">0</span>
                            ) : (
                              <span className="text-amber-400 font-bold">{str.fret}</span>
                            )}
                          </td>
                          <td className="py-1 px-2 font-semibold">
                            {str.note}
                          </td>
                          <td className="py-1 px-2 text-[10px] text-slate-400">
                            {str.degree}
                          </td>
                          <td className="py-1 px-1.5 text-right text-[10px] text-slate-400">
                            {isMuted ? '-' : str.finger === 0 ? 'Open' : `F${str.finger}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Strum Controls */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                VOICING SYNTH ENGINE
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={handlePlayDown}
                  className="py-1.5 px-2 bg-[#171924] hover:bg-[#202333] border border-white/10 rounded flex items-center justify-center gap-1 text-[10px] font-bold text-amber-400 transition-colors"
                >
                  <Play className="w-3 h-3 rotate-90" />
                  <span>DOWN</span>
                </button>
                <button
                  onClick={handlePlayUp}
                  className="py-1.5 px-2 bg-[#171924] hover:bg-[#202333] border border-white/10 rounded flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-400 transition-colors"
                >
                  <Play className="w-3 h-3 -rotate-90" />
                  <span>UP</span>
                </button>
                <button
                  onClick={handlePlayArpeggio}
                  className="py-1.5 px-2 bg-[#171924] hover:bg-[#202333] border border-white/10 rounded flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-400 transition-colors"
                >
                  <Music className="w-3 h-3" />
                  <span>ARPEG</span>
                </button>
              </div>

              {onOpenChordDetail && (
                <button
                  onClick={onOpenChordDetail}
                  className="w-full py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>OPEN FULL CHORD MODAL</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SCALES & IMPROVISATION */}
        {activeTab === 'scales' && (
          <div className="space-y-3">
            {/* Scale Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                SELECT SCALE RIG
              </label>
              <select
                value={selectedScaleId}
                onChange={(e) => onSelectScaleId(e.target.value)}
                className="w-full bg-[#12141d] border border-white/10 rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
              >
                {GUITAR_SCALES.map((scale) => (
                  <option key={scale.id} value={scale.id} className="bg-[#12141d]">
                    {scale.name} ({scale.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Scale Details Box */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  {rootNote} {activeScale.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {activeScale.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {activeScale.description}
              </p>
            </div>

            {/* Scale Notes Chips */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                SCALE NOTES IN KEY ({rootNote})
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {scaleNotes.map((note, idx) => {
                  const degree = activeScale.degreeNames[idx] || `${idx + 1}`;
                  const isRoot = degree === 'R' || degree === '1';
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-center font-mono ${
                        isRoot
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{note}</div>
                      <div className="text-[9px] text-slate-400">{degree}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-[11px] font-sans leading-relaxed">
              <b>Doğaçlama İpucu:</b> Şarkı çalarken bu gamdaki notaları gitarda basarak kusursuz sololar ve arpej melodileri üretebilirsiniz.
            </div>
          </div>
        )}

        {/* TAB 3: STRUM PATTERNS */}
        {activeTab === 'strum' && (
          <div className="space-y-3">
            {/* Pattern Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                SELECT STRUM PATTERN
              </label>
              <select
                value={selectedPatternId}
                onChange={(e) => onSelectPatternId(e.target.value)}
                className="w-full bg-[#12141d] border border-white/10 rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
              >
                {STRUM_PATTERNS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#12141d]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pattern Telemetry */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{activePattern.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activePattern.timeSignature}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {activePattern.description}
              </p>
            </div>

            {/* Visual Step Sequencer / Stroke Bar */}
            <div className="p-2.5 rounded bg-[#12141d] border border-white/10 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>RHYTHMIC SEQUENCE</span>
                <span className="text-slate-500">{activePattern.strokes.length} STEPS</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                {activePattern.strokes.map((stroke, idx) => (
                  <div
                    key={idx}
                    className={`py-2 px-1 rounded border text-center font-mono flex flex-col items-center justify-center gap-0.5 ${
                      stroke.accent
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 font-bold'
                        : stroke.type === 'rest'
                        ? 'bg-black/30 border-white/5 text-slate-600'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">{stroke.label}</span>
                    <span className="text-[8px] text-slate-400 uppercase leading-none">
                      {stroke.type === 'rest' ? 'ES' : stroke.accent ? 'ACC' : 'BEAT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Play Rhythm Pattern Action */}
            <button
              onClick={handleTriggerStrumPattern}
              disabled={isPlayingStrum || !position}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
            >
              {isPlayingStrum ? (
                <>
                  <span className="animate-spin text-xs">◌</span>
                  <span>PLAYING SEQUENCE...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PREVIEW STRUM PATTERN</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
