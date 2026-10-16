import { useState, useEffect, useRef, useMemo } from 'react';
import { GUITAR_TUNINGS, getTuningById } from '../data/tunings';
import { autoCorrelate, matchTuningTarget, type PitchDetectionResult, type TunerStringTarget } from '../audio/pitchDetection';
import { guitarAudio } from '../audio/guitarAudio';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Sliders
} from 'lucide-react';

interface GuitarTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTuningId?: string;
  onTuningChange?: (tuningId: string) => void;
}

export const GuitarTunerModal = ({
  isOpen,
  onClose,
  initialTuningId = 'standard',
  onTuningChange
}: GuitarTunerModalProps) => {
  const [selectedTuningId, setSelectedTuningId] = useState<string>(initialTuningId);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedStringIdx, setSelectedStringIdx] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Live pitch telemetry
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [inTuneHold, setInTuneHold] = useState<boolean>(false);

  const activeTuning = useMemo(() => getTuningById(selectedTuningId), [selectedTuningId]);

  // Construct targets for all 6 strings
  const stringTargets = useMemo<TunerStringTarget[]>(() => {
    return activeTuning.notes.map((note, idx) => ({
      stringIdx: idx,
      note,
      octave: activeTuning.octaves[idx],
      frequency: activeTuning.frequencies[idx]
    }));
  }, [activeTuning]);

  // Persistent refs to eliminate tearing down mic stream on state changes
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const selectedStringIdxRef = useRef(selectedStringIdx);
  selectedStringIdxRef.current = selectedStringIdx;

  const stringTargetsRef = useRef(stringTargets);
  stringTargetsRef.current = stringTargets;

  const onTuningChangeRef = useRef(onTuningChange);
  onTuningChangeRef.current = onTuningChange;

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const inTuneTimerRef = useRef<number | null>(null);
  const lastDetectTimeRef = useRef<number>(0);

  // Handle tuning change from dropdown
  const handleTuningSelect = (tuningId: string) => {
    setSelectedTuningId(tuningId);
    onTuningChangeRef.current?.(tuningId);
  };

  // Play string Karplus-Strong sample when clicked or selected
  const handlePluckString = (stringIdx: number) => {
    setSelectedStringIdx(stringIdx);
    const target = stringTargetsRef.current[stringIdx];
    if (target) {
      guitarAudio.pluckFrequency(target.frequency, 0.95);
    }
  };

  // Start microphone stream and pitch detection loop
  const startListening = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      });
      audioStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // High frequency resolution
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const detectLoop = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const now = performance.now();
        // Throttle pitch detection to ~28-30 Hz (every 35ms) to prevent UI thread starvation alongside 3D Three.js
        if (now - lastDetectTimeRef.current >= 35) {
          lastDetectTimeRef.current = now;

          analyserRef.current.getFloatTimeDomainData(buffer);

          const { freq, clarity, rms } = autoCorrelate(buffer, audioContextRef.current.sampleRate, 0.84);
          setAudioLevel(Math.min(1, rms * 15));

          if (freq > 0 && clarity > 0.8) {
            const currentTargets = stringTargetsRef.current;
            const currentMode = modeRef.current;
            const currentSelectedIdx = selectedStringIdxRef.current;

            const result = matchTuningTarget(
              freq,
              currentTargets,
              currentMode === 'manual' ? currentSelectedIdx : undefined
            );

            if (result) {
              setPitchData(result);
              if (currentMode === 'auto') {
                setSelectedStringIdx(result.stringIdx);
              }

              if (result.inTune) {
                setInTuneHold(true);
                if (inTuneTimerRef.current) window.clearTimeout(inTuneTimerRef.current);
                inTuneTimerRef.current = window.setTimeout(() => {
                  setInTuneHold(false);
                }, 1200);
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(detectLoop);
      };

      detectLoop();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError(err.message || 'Mikrofona erişilemedi. Lütfen tarayıcı izinlerini kontrol edin.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (inTuneTimerRef.current) {
      window.clearTimeout(inTuneTimerRef.current);
      inTuneTimerRef.current = null;
    }
    setIsListening(false);
    setPitchData(null);
    setAudioLevel(0);
    setInTuneHold(false);
  };

  // Only start listening when modal is open; never tear down on tuning or string selection changes!
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStringTarget = stringTargets[selectedStringIdx] || stringTargets[0];
  const deviation = pitchData ? pitchData.diffCents : 0;
  const isInTune = inTuneHold || (pitchData ? pitchData.inTune : false);

  // Calculate needle rotation: -50 cents -> -45deg, +50 cents -> +45deg
  const needleAngle = Math.max(-45, Math.min(45, (deviation / 50) * 45));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0a0c12] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col font-sans cursor-default"
      >
        {/* TOP COCKPIT HEADER */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#07080d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight text-white font-mono uppercase">
                  GUITARTUNA // PRO AKORT CİHAZI
                </h3>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  YIN DSP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Canlı Spektrum & Akustik Frekans Kalibrasyonu (±0.1 Hz)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tuning Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#121520] border border-white/10 rounded-xl px-2.5 py-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedTuningId}
                onChange={(e) => handleTuningSelect(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                {GUITAR_TUNINGS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#11131a] text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN TUNER INTERACTION WORKSPACE */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* LEFT/CENTER GAUGE DISPLAY (7 Cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-gradient-to-b from-[#10131d] to-[#0c0e15] border border-white/[0.08] rounded-2xl p-5 shadow-inner relative overflow-hidden">
            {/* Mode Selector Tabs (Auto / Manual) */}
            <div className="flex items-center bg-[#07090e] border border-white/[0.08] rounded-full p-1 font-mono text-xs mb-4">
              <button
                onClick={() => setMode('auto')}
                className={`px-4 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  mode === 'auto'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OTOMATİK DİNLE
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MANUEL TEL SEÇİMİ
              </button>
            </div>

            {/* In-Tune Status Halo / Notification */}
            <div
              className={`transition-all duration-300 mb-2 px-3 py-1 rounded-full font-mono text-xs font-black uppercase flex items-center gap-1.5 ${
                isInTune
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                  : pitchData
                  ? deviation < 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/5'
              }`}
            >
              {isInTune ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>TAM NOTA // AKORTLU (IN TUNE)</span>
                </>
              ) : pitchData ? (
                deviation < 0 ? (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>TELİ SIK // DAHA PES ({deviation} CENT)</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                    <span>TELİ GEVŞET // DAHA TİZ (+{deviation} CENT)</span>
                  </>
                )
              ) : (
                <span>BİR TELE VURUN VE SES ÇIKARIN...</span>
              )}
            </div>

            {/* CURVED NEEDLE ARC GAUGE (GuitarTuna / Dribbble Signature) */}
            <div className="relative w-64 h-36 flex items-end justify-center my-2">
              <svg viewBox="0 0 240 140" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path
                  d="M 20 120 A 100 100 0 0 1 220 120"
                  fill="none"
                  stroke="#1c2030"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Left Flat Zone (Amber) */}
                <path
                  d="M 20 120 A 100 100 0 0 1 95 34"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                />

                {/* Right Sharp Zone (Rose) */}
                <path
                  d="M 145 34 A 100 100 0 0 1 220 120"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="8"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                />

                {/* Central In-Tune Zone (Emerald) */}
                <path
                  d="M 105 24 A 100 100 0 0 1 135 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className={isInTune ? 'filter drop-shadow-[0_0_8px_#10b981]' : ''}
                />

                {/* Tick Marks */}
                {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((c) => {
                  const angle = (c / 50) * 45; // -45 to 45 deg
                  const rad = ((angle - 90) * Math.PI) / 180;
                  const x1 = 120 + 95 * Math.cos(rad);
                  const y1 = 120 + 95 * Math.sin(rad);
                  const x2 = 120 + (c === 0 ? 112 : 105) * Math.cos(rad);
                  const y2 = 120 + (c === 0 ? 112 : 105) * Math.sin(rad);

                  return (
                    <line
                      key={c}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={c === 0 ? '#10b981' : '#475569'}
                      strokeWidth={c === 0 ? 3 : 1.5}
                    />
                  );
                })}

                {/* Smooth Rotating Needle */}
                <g
                  style={{
                    transformOrigin: '120px 120px',
                    transform: `rotate(${needleAngle}deg)`,
                    transition: 'transform 80ms cubic-bezier(0.2, 0.9, 0.3, 1)'
                  }}
                >
                  <line
                    x1="120"
                    y1="120"
                    x2="120"
                    y2="20"
                    stroke={isInTune ? '#34d399' : deviation < 0 ? '#fbbf24' : '#fb7185'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="8"
                    fill={isInTune ? '#10b981' : '#0f172a'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                </g>
              </svg>

              {/* Note Display Badge at Center */}
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="font-mono text-4xl font-black tracking-tight text-white drop-shadow-md">
                  {currentStringTarget.note}
                  <span className="text-xl text-slate-400 font-bold ml-0.5">
                    {currentStringTarget.octave}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-amber-400 font-bold">
                  {6 - currentStringTarget.stringIdx}. Tel • {currentStringTarget.frequency.toFixed(1)} Hz
                </span>
              </div>
            </div>

            {/* FREQUENCY / CENTS DIGITAL TELEMETRY */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-white/[0.08] font-mono text-center">
              <div className="bg-[#090b10] p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Algılanan</span>
                <span className="text-xs font-bold text-slate-200">
                  {pitchData ? `${pitchData.detectedHz} Hz` : '---'}
                </span>
              </div>

              <div className="bg-[#090b10] p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Hedef Frekans</span>
                <span className="text-xs font-bold text-amber-400">
                  {currentStringTarget.frequency.toFixed(1)} Hz
                </span>
              </div>

              <div className="bg-[#090b10] p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Sapma (Cents)</span>
                <span
                  className={`text-xs font-black ${
                    isInTune
                      ? 'text-emerald-400'
                      : deviation < 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {pitchData ? `${deviation > 0 ? `+${deviation}` : deviation}¢` : '0¢'}
                </span>
              </div>
            </div>

            {/* Audio Signal Level Bar & Mic Toggle */}
            <div className="w-full flex items-center gap-2 mt-3 font-mono text-[10px] text-slate-400">
              <button
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening();
                }}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title={isListening ? 'Mikrofonu Durdur' : 'Mikrofonu Başlat'}
              >
                {isListening ? (
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{isListening ? 'DİNLİYOR' : 'DURAKLATILDI'}</span>
              </button>
              <div className="flex-1 h-2 bg-[#08090e] rounded-full overflow-hidden border border-white/5 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT 3D HEADSTOCK / 6-STRING INTERACTIVE PEG CARRIER (5 Cols) */}
          <div className="md:col-span-5 flex flex-col items-center bg-[#090b10] border border-white/[0.08] rounded-2xl p-4 relative">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
              <span className="text-[11px] font-mono font-bold text-slate-300">
                GİTAR KULAKLARI (HEADSTOCK)
              </span>
              <span className="text-[9px] font-mono text-slate-500">TIKLA = TINLAT</span>
            </div>

            {/* Visual Headstock Pegs (3 Left, 3 Right) */}
            <div className="w-full grid grid-cols-2 gap-2.5 my-auto">
              {/* Left Pegs: String 6 (E2), String 5 (A2), String 4 (D3) */}
              <div className="space-y-2">
                {[0, 1, 2].map((sIdx) => {
                  const target = stringTargets[sIdx];
                  const isSelected = selectedStringIdx === sIdx;
                  const isTargetInTune = isSelected && isInTune;

                  return (
                    <button
                      key={sIdx}
                      onClick={() => handlePluckString(sIdx)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group active:scale-95 ${
                        isTargetInTune
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#121520] border-white/10 hover:border-amber-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-black ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-white/5 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          {6 - sIdx}
                        </div>
                        <div className="text-left">
                          <div className="font-mono text-xs font-bold leading-none">
                            {target.note}
                            <span className="text-[10px] text-slate-400 ml-0.5 font-normal">
                              {target.octave}
                            </span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 leading-none mt-1">
                            {target.frequency.toFixed(1)} Hz
                          </div>
                        </div>
                      </div>

                      <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                    </button>
                  );
                })}
              </div>

              {/* Right Pegs: String 3 (G3), String 2 (B3), String 1 (E4) */}
              <div className="space-y-2">
                {[3, 4, 5].map((sIdx) => {
                  const target = stringTargets[sIdx];
                  const isSelected = selectedStringIdx === sIdx;
                  const isTargetInTune = isSelected && isInTune;

                  return (
                    <button
                      key={sIdx}
                      onClick={() => handlePluckString(sIdx)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group active:scale-95 ${
                        isTargetInTune
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#121520] border-white/10 hover:border-amber-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-black ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-white/5 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          {6 - sIdx}
                        </div>
                        <div className="text-left">
                          <div className="font-mono text-xs font-bold leading-none">
                            {target.note}
                            <span className="text-[10px] text-slate-400 ml-0.5 font-normal">
                              {target.octave}
                            </span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 leading-none mt-1">
                            {target.frequency.toFixed(1)} Hz
                          </div>
                        </div>
                      </div>

                      <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message if Mic not permitted */}
            {micError && (
              <div className="mt-3 p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-[10px] font-mono text-rose-300 text-center leading-snug flex flex-col items-center gap-1.5">
                <span>{micError}</span>
                <button
                  onClick={startListening}
                  className="px-3 py-1 bg-rose-500/30 hover:bg-rose-500/40 text-white rounded-lg font-bold transition-all cursor-pointer"
                >
                  YENİDEN DENE
                </button>
              </div>
            )}

            {/* Pluck All Strings Quick Action */}
            <button
              onClick={() => {
                stringTargets.forEach((t, i) => {
                  setTimeout(() => {
                    guitarAudio.pluckFrequency(t.frequency, 0.9);
                    setSelectedStringIdx(i);
                  }, i * 180);
                });
              }}
              className="w-full mt-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-[11px] font-mono font-bold text-slate-200 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>TÜM TELLERİ SIRAYLA ÇAL (AKUSTİK KONTROL)</span>
            </button>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#07080d] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Tavsiye: Sessiz bir ortamda tek tele temiz vuruş yapınız.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer"
          >
            TAMAMLA
          </button>
        </div>
      </div>
    </div>
  );
};
