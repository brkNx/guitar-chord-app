// High-Precision Web Audio API Engine with Karplus-Strong Synthesis and Clock-Based Scheduler
import type { ChordPosition } from '../types/guitar';
import { STRUM_PATTERNS } from '../data/strumPatterns';

const STANDARD_OPEN_FREQS = [
  82.41,  // String 6: E2 (Low E)
  110.00, // String 5: A2
  146.83, // String 4: D3
  196.00, // String 3: G3
  246.94, // String 2: B3
  329.63  // String 1: E4 (High E)
];

export type GuitarNoteEventType = 'pluck' | 'strum' | 'bass' | 'mute';

export interface GuitarNoteEvent {
  type: GuitarNoteEventType;
  /** -1 = all active strings (strum/mute), 0..5 = specific string */
  stringIdx: number;
  velocity: number;
  time: number;
}

export type NoteListener = (event: GuitarNoteEvent) => void;

export type VirtualGuitaristMode = 'arpeggio' | 'strum';

export interface VirtualGuitaristConfig {
  mode: VirtualGuitaristMode;
  bpm: number;
  position: ChordPosition;
  patternId?: string;
  timeSignature?: '4/4' | '3/4' | '6/8';
}

class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private currentStringFreqs = [...STANDARD_OPEN_FREQS];

  // Note event listeners for real-time visual string vibrations
  private noteListeners: Set<NoteListener> = new Set();

  // Lookahead Metronome Scheduler state
  private metronomeTimerId: number | null = null;
  private nextBeatTime = 0.0;
  private currentBeat = 0;
  private bpm = 100;
  private isMetronomeRunning = false;
  private onBeatCallback: ((beat: number) => void) | null = null;

  // Virtual Guitarist Rhythmic Accompaniment Engine state
  private isVirtualGuitaristRunning = false;
  private virtualGuitaristTimerId: number | null = null;
  private virtualNextStepTime = 0.0;
  private virtualStepIndex = 0;
  private virtualConfig: VirtualGuitaristConfig = {
    mode: 'arpeggio',
    bpm: 96,
    position: {
      frets: [-1, 2, 4, 4, 3, 2],
      fingers: [0, 1, 3, 4, 2, 1],
      baseFret: 2
    },
    patternId: 'acoustic_fingerpicking_4_4',
    timeSignature: '4/4'
  };
  private onVirtualStepCallback: ((step: number, totalSteps: number, mode: VirtualGuitaristMode) => void) | null = null;

  private init() {
    if (this.isInitialized && this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  public async resume(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public setTuningFrequencies(freqs: number[]): void {
    if (freqs && freqs.length === 6) {
      this.currentStringFreqs = [...freqs];
    }
  }

  public getFrequency(stringIdx: number, fret: number): number {
    const baseFreq = this.currentStringFreqs[stringIdx] || STANDARD_OPEN_FREQS[stringIdx];
    return baseFreq * Math.pow(2, fret / 12);
  }

  /**
   * Subscribe to real-time note events (for 3D string vibration & UI synchronizers)
   */
  public addNoteListener(listener: NoteListener): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  private notifyNote(event: GuitarNoteEvent, delayMs = 0): void {
    if (this.noteListeners.size === 0) return;
    if (delayMs <= 2) {
      this.noteListeners.forEach((l) => {
        try {
          l(event);
        } catch (e) {
          console.error(e);
        }
      });
    } else {
      setTimeout(() => {
        this.noteListeners.forEach((l) => {
          try {
            l(event);
          } catch (e) {
            console.error(e);
          }
        });
      }, delayMs);
    }
  }

  /**
   * Synthesize single acoustic guitar string pluck using Karplus-Strong Algorithm
   */
  public async pluckNote(
    stringIdx: number,
    fret: number,
    velocity = 0.8,
    whenOrMuted?: number | boolean
  ): Promise<void> {
    if (fret < 0 || whenOrMuted === true) return; // Muted string - strictly silent
    await this.resume();
    if (!this.ctx || !this.masterGain) return;

    const startTime = typeof whenOrMuted === 'number' ? whenOrMuted : this.ctx.currentTime;
    const freq = this.getFrequency(stringIdx, fret);
    const sampleRate = this.ctx.sampleRate;
    const periodLength = Math.max(2, Math.round(sampleRate / freq));
    const duration = Math.min(3.5, Math.max(1.5, 260 / freq));

    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const channelData = buffer.getChannelData(0);

    // Initial pick excitation (filtered burst with variable hardness)
    const noiseBurst = new Float32Array(periodLength);
    for (let i = 0; i < periodLength; i++) {
      noiseBurst[i] = (Math.random() * 2 - 1) * velocity;
    }

    const damping = Math.max(0.97, 0.994 - freq / 9000);
    for (let i = 0; i < periodLength; i++) {
      channelData[i] = noiseBurst[i];
    }

    for (let i = periodLength; i < channelData.length; i++) {
      const prev = channelData[i - periodLength];
      const prevMinus1 = channelData[i - periodLength - 1] || 0;
      channelData[i] = 0.5 * (prev + prevMinus1) * damping;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Acoustic guitar body resonance (peaking eq around 180Hz)
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(180, startTime);
    bodyFilter.Q.setValueAtTime(1.2, startTime);
    bodyFilter.gain.setValueAtTime(3.5, startTime);

    const highDamp = this.ctx.createBiquadFilter();
    highDamp.type = 'lowpass';
    highDamp.frequency.setValueAtTime(4500, startTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(velocity, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(bodyFilter);
    bodyFilter.connect(highDamp);
    highDamp.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(startTime);

    const delayMs = Math.max(0, (startTime - this.ctx.currentTime) * 1000);
    this.notifyNote({ type: 'pluck', stringIdx, velocity, time: startTime }, delayMs);
  }

  /**
   * Synthesize acoustic percussive muted hit / chuck slap
   */
  public async playMutedHit(velocity = 0.75, when?: number): Promise<void> {
    await this.resume();
    if (!this.ctx || !this.masterGain) return;
    const startTime = typeof when === 'number' ? when : this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate;
    const duration = 0.045;
    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.008));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1100, startTime);
    bandpass.Q.setValueAtTime(1.8, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.85, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    source.start(startTime);

    const delayMs = Math.max(0, (startTime - this.ctx.currentTime) * 1000);
    this.notifyNote({ type: 'mute', stringIdx: -1, velocity, time: startTime }, delayMs);
  }

  /**
   * Strum a chord across active strings with precise Web Audio micro-delays (18-28ms)
   */
  public async strumChord(
    position: ChordPosition,
    direction: 'down' | 'up' = 'down',
    speedMs = 24,
    isMuted?: boolean,
    onStringPlay?: (strIdx: number) => void
  ): Promise<void> {
    await this.resume();
    if (!this.ctx) return;

    if (isMuted) {
      await this.playMutedHit(0.8);
      return;
    }

    const stringIndices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    const baseTime = this.ctx.currentTime;
    let playedCount = 0;

    for (const strIdx of stringIndices) {
      const fret = position.frets[strIdx];
      if (fret >= 0) {
        const delaySec = playedCount * (speedMs / 1000);
        const when = baseTime + delaySec;
        const vel = 0.75 + Math.random() * 0.15;
        this.pluckNote(strIdx, fret, vel, when);

        if (onStringPlay) {
          setTimeout(() => onStringPlay(strIdx), delaySec * 1000);
        }
        playedCount++;
      }
    }

    this.notifyNote({ type: 'strum', stringIdx: -1, velocity: 0.8, time: baseTime }, 0);
  }

  /**
   * Arpeggiate chord strings in sequence
   */
  public async arpeggiateChord(
    position: ChordPosition,
    _pattern = 'pima',
    tempoMs = 120,
    onStringPlay?: (strIdx: number) => void
  ): Promise<void> {
    await this.resume();
    if (!this.ctx) return;

    // Classical P-I-M-A arpeggio: bass note then strings 3, 2, 1, 2, 3
    const activeBassIdx = position.frets.findIndex((f) => f >= 0);
    const patternIndices = [
      activeBassIdx >= 0 ? activeBassIdx : 0,
      3,
      4,
      5,
      4,
      3
    ];

    patternIndices.forEach((strIdx, i) => {
      const fret = position.frets[strIdx];
      if (fret >= 0) {
        setTimeout(() => {
          this.pluckNote(strIdx, fret, 0.85);
          if (onStringPlay) onStringPlay(strIdx);
        }, i * tempoMs);
      }
    });
  }

  /**
   * Strum only the bass string of the chord
   */
  public async strumBass(
    position: ChordPosition,
    onStringPlay?: (strIdx: number) => void
  ): Promise<void> {
    const bassIdx = position.frets.findIndex((f) => f >= 0);
    if (bassIdx >= 0) {
      await this.pluckNote(bassIdx, position.frets[bassIdx], 0.95);
      if (onStringPlay) onStringPlay(bassIdx);
    }
  }

  /**
   * Synthesize an arbitrary frequency directly (for chord tone intervals)
   */
  public async pluckFrequency(freq: number, velocity = 0.8): Promise<void> {
    await this.resume();
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const periodLength = Math.max(2, Math.round(sampleRate / freq));
    const duration = 1.8;

    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const channelData = buffer.getChannelData(0);

    const noiseBurst = new Float32Array(periodLength);
    for (let i = 0; i < periodLength; i++) {
      noiseBurst[i] = (Math.random() * 2 - 1) * velocity;
    }

    const damping = 0.99;
    for (let i = 0; i < periodLength; i++) {
      channelData[i] = noiseBurst[i];
    }
    for (let i = periodLength; i < channelData.length; i++) {
      channelData[i] = 0.5 * (channelData[i - periodLength] + (channelData[i - periodLength - 1] || 0)) * damping;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(velocity, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();
  }

  /**
   * =========================================================================
   * VIRTUAL GUITARIST ACCOMPANIMENT ENGINE (Continuous Rhythmic Flow & Arpeggio)
   * Plays live authentic rhythm in tempo with smooth on-the-fly chord shifts
   * =========================================================================
   */

  public async startVirtualGuitarist(config: Partial<VirtualGuitaristConfig> = {}): Promise<void> {
    await this.resume();
    this.virtualConfig = {
      ...this.virtualConfig,
      ...config,
      bpm: config.bpm || this.virtualConfig.bpm || 96,
      mode: config.mode || this.virtualConfig.mode || 'arpeggio'
    };

    this.isVirtualGuitaristRunning = true;
    this.virtualStepIndex = 0;
    if (this.ctx) {
      this.virtualNextStepTime = this.ctx.currentTime + 0.04;
    }

    this.scheduleVirtualGuitaristLoop();
  }

  public stopVirtualGuitarist(): void {
    this.isVirtualGuitaristRunning = false;
    if (this.virtualGuitaristTimerId !== null) {
      clearTimeout(this.virtualGuitaristTimerId);
      this.virtualGuitaristTimerId = null;
    }
    if (this.onVirtualStepCallback) {
      this.onVirtualStepCallback(-1, 0, this.virtualConfig.mode);
    }
  }

  public isVirtualGuitaristActive(): boolean {
    return this.isVirtualGuitaristRunning;
  }

  public setVirtualGuitaristChord(position: ChordPosition): void {
    if (position && Array.isArray(position.frets)) {
      this.virtualConfig.position = position;
    }
  }

  public setVirtualGuitaristBpm(bpm: number): void {
    if (bpm > 30 && bpm < 260) {
      this.virtualConfig.bpm = bpm;
    }
  }

  public setVirtualGuitaristMode(mode: VirtualGuitaristMode): void {
    this.virtualConfig.mode = mode;
    this.virtualStepIndex = 0;
  }

  public setVirtualGuitaristPattern(patternId: string): void {
    this.virtualConfig.patternId = patternId;
  }

  public onVirtualStep(cb: (step: number, totalSteps: number, mode: VirtualGuitaristMode) => void): () => void {
    this.onVirtualStepCallback = cb;
    return () => {
      if (this.onVirtualStepCallback === cb) {
        this.onVirtualStepCallback = null;
      }
    };
  }

  private scheduleVirtualGuitaristLoop = (): void => {
    if (!this.isVirtualGuitaristRunning || !this.ctx) return;

    const scheduleAheadTime = 0.12; // Schedule notes 120ms ahead for zero-jitter
    const bpm = Math.max(40, Math.min(240, this.virtualConfig.bpm || 96));

    let stepDuration: number;
    let totalSteps: number;

    if (this.virtualConfig.mode === 'arpeggio') {
      const isTriadMeter = this.virtualConfig.timeSignature === '6/8' || this.virtualConfig.timeSignature === '3/4';
      totalSteps = isTriadMeter ? 6 : 8;
      // 8th notes in tempo: (60 / BPM) / 2
      stepDuration = (60.0 / bpm) / 2.0;
    } else {
      const pattern =
        STRUM_PATTERNS.find((p) => p.id === this.virtualConfig.patternId) ||
        STRUM_PATTERNS[0];
      totalSteps = pattern.strokes.length;
      if (pattern.timeSignature === '4/4') {
        stepDuration = totalSteps === 4 ? 60.0 / bpm : (60.0 / bpm) / 2.0;
      } else {
        stepDuration = (60.0 / bpm) / 2.0;
      }
    }

    while (this.virtualNextStepTime < this.ctx.currentTime + scheduleAheadTime) {
      const step = this.virtualStepIndex % totalSteps;
      const scheduledTime = this.virtualNextStepTime;

      if (this.virtualConfig.mode === 'arpeggio') {
        this.scheduleArpeggioStep(step, scheduledTime);
      } else {
        this.scheduleStrumStep(step, scheduledTime);
      }

      // Notify UI step callback aligned with actual audio time
      const delayMs = Math.max(0, (scheduledTime - this.ctx.currentTime) * 1000);
      const currentMode = this.virtualConfig.mode;
      setTimeout(() => {
        if (this.isVirtualGuitaristRunning && this.onVirtualStepCallback) {
          this.onVirtualStepCallback(step, totalSteps, currentMode);
        }
      }, delayMs);

      this.virtualNextStepTime += stepDuration;
      this.virtualStepIndex++;
    }

    this.virtualGuitaristTimerId = window.setTimeout(this.scheduleVirtualGuitaristLoop, 25);
  };

  /**
   * Authentic Acoustic Fingerpicking Engine (P-I-M-A) for Ballads (e.g. Sufle - Pus)
   */
  private scheduleArpeggioStep(step: number, scheduledTime: number): void {
    if (!this.ctx) return;
    const position = this.virtualConfig.position;
    if (!position) return;

    const targetString = this.getArpeggioStringForStep(
      position,
      step,
      this.virtualConfig.timeSignature || '4/4'
    );
    const fret = position.frets[targetString];

    if (fret >= 0) {
      const isBass = step === 0;
      const isAccent = step === 3 || step === 4;
      let velocity = isBass ? (0.88 + Math.random() * 0.08 - 0.04) : (0.65 + Math.random() * 0.08 - 0.04);
      if (isAccent) velocity += 0.08;

      // Micro-timing human groove (±2.5ms organic humanization)
      const jitter = (Math.random() * 0.005 - 0.0025);
      const actualTime = Math.max(this.ctx.currentTime, scheduledTime + jitter);

      this.pluckNote(targetString, fret, velocity, actualTime);
      const delayMs = Math.max(0, (actualTime - this.ctx.currentTime) * 1000);
      this.notifyNote(
        {
          type: isBass ? 'bass' : 'pluck',
          stringIdx: targetString,
          velocity,
          time: actualTime
        },
        delayMs
      );
    }
  }

  /**
   * Determine exact string for arpeggio step based on chord root bass & treble registers
   */
  private getArpeggioStringForStep(
    position: ChordPosition,
    step: number,
    timeSignature: '4/4' | '3/4' | '6/8'
  ): number {
    const bassIdx = position.frets.findIndex((f) => f >= 0);
    const rootString = bassIdx >= 0 ? bassIdx : 0;

    const availableTrebles = [2, 3, 4, 5].filter(
      (s) => s > rootString && position.frets[s] >= 0
    );

    if (availableTrebles.length === 0) {
      return rootString;
    }

    const s3 = position.frets[3] >= 0 ? 3 : availableTrebles[0];
    const s2 = position.frets[4] >= 0 ? 4 : availableTrebles[Math.min(1, availableTrebles.length - 1)];
    const s1 = position.frets[5] >= 0 ? 5 : availableTrebles[availableTrebles.length - 1];

    if (timeSignature === '6/8' || timeSignature === '3/4') {
      const pattern6 = [rootString, s3, s2, s1, s2, s3];
      return pattern6[step % 6];
    }

    // Standard 4/4 Ballad Fingerpicking: Bass -> 3rd -> 2nd -> 1st -> 2nd -> 3rd -> 2nd -> 1st
    const pattern8 = [rootString, s3, s2, s1, s2, s3, s2, s1];
    return pattern8[step % 8];
  }

  /**
   * Continuous Strumming Engine matching active Strum Pattern
   */
  private scheduleStrumStep(step: number, scheduledTime: number): void {
    if (!this.ctx) return;
    const position = this.virtualConfig.position;
    if (!position) return;

    const pattern =
      STRUM_PATTERNS.find((p) => p.id === this.virtualConfig.patternId) ||
      STRUM_PATTERNS[0];
    const stroke = pattern.strokes[step % pattern.strokes.length];
    if (!stroke || stroke.type === 'rest') return;

    if (stroke.type === 'down') {
      const speedMs = 18 + Math.random() * 4;
      let playedCount = 0;
      for (let strIdx = 0; strIdx < 6; strIdx++) {
        const fret = position.frets[strIdx];
        if (fret >= 0) {
          const delaySec = playedCount * (speedMs / 1000);
          const when = scheduledTime + delaySec;
          const vel = (stroke.accent ? 0.88 : 0.72) + (Math.random() * 0.06 - 0.03);
          this.pluckNote(strIdx, fret, vel, when);
          playedCount++;
        }
      }
      const delayMs = Math.max(0, (scheduledTime - this.ctx.currentTime) * 1000);
      this.notifyNote(
        {
          type: 'strum',
          stringIdx: -1,
          velocity: stroke.accent ? 0.9 : 0.75,
          time: scheduledTime
        },
        delayMs
      );
    } else if (stroke.type === 'up') {
      const speedMs = 15 + Math.random() * 3;
      let playedCount = 0;
      for (let strIdx = 5; strIdx >= 1; strIdx--) {
        const fret = position.frets[strIdx];
        if (fret >= 0) {
          const delaySec = playedCount * (speedMs / 1000);
          const when = scheduledTime + delaySec;
          const vel = (stroke.accent ? 0.80 : 0.62) + (Math.random() * 0.06 - 0.03);
          this.pluckNote(strIdx, fret, vel, when);
          playedCount++;
        }
      }
      const delayMs = Math.max(0, (scheduledTime - this.ctx.currentTime) * 1000);
      this.notifyNote(
        {
          type: 'strum',
          stringIdx: -1,
          velocity: stroke.accent ? 0.82 : 0.65,
          time: scheduledTime
        },
        delayMs
      );
    } else if (stroke.type === 'bass') {
      const bassIdx = position.frets.findIndex((f) => f >= 0);
      if (bassIdx >= 0) {
        const vel = (stroke.accent ? 0.95 : 0.85) + (Math.random() * 0.06 - 0.03);
        this.pluckNote(bassIdx, position.frets[bassIdx], vel, scheduledTime);
        const delayMs = Math.max(0, (scheduledTime - this.ctx.currentTime) * 1000);
        this.notifyNote(
          {
            type: 'bass',
            stringIdx: bassIdx,
            velocity: vel,
            time: scheduledTime
          },
          delayMs
        );
      }
    } else if (stroke.type === 'mute') {
      this.playMutedHit(stroke.accent ? 0.85 : 0.70, scheduledTime);
    }
  }

  /**
   * High-accuracy Lookahead Metronome Scheduler (eliminates setInterval jitter)
   */
  public startMetronome(bpm: number, onBeat: (beat: number) => void): void {
    this.resume().then(() => {
      this.bpm = bpm;
      this.onBeatCallback = onBeat;
      this.isMetronomeRunning = true;
      this.currentBeat = 0;
      if (this.ctx) {
        this.nextBeatTime = this.ctx.currentTime + 0.05;
      }
      this.scheduleLoop();
    });
  }

  public stopMetronome(): void {
    this.isMetronomeRunning = false;
    if (this.metronomeTimerId !== null) {
      clearTimeout(this.metronomeTimerId);
      this.metronomeTimerId = null;
    }
  }

  public setMetronomeBpm(bpm: number): void {
    this.bpm = bpm;
  }

  private scheduleLoop = () => {
    if (!this.isMetronomeRunning || !this.ctx) return;

    const scheduleAheadTime = 0.1; // Schedule notes 100ms in advance
    const secondsPerBeat = 60.0 / this.bpm;

    while (this.nextBeatTime < this.ctx.currentTime + scheduleAheadTime) {
      const beat = (this.currentBeat % 4) + 1;
      this.scheduleClick(this.nextBeatTime, beat === 1);

      // Trigger UI callback at calculated moment
      const delayMs = Math.max(0, (this.nextBeatTime - this.ctx.currentTime) * 1000);
      setTimeout(() => {
        if (this.isMetronomeRunning && this.onBeatCallback) {
          this.onBeatCallback(beat);
        }
      }, delayMs);

      this.nextBeatTime += secondsPerBeat;
      this.currentBeat++;
    }

    this.metronomeTimerId = window.setTimeout(this.scheduleLoop, 25);
  };

  private scheduleClick(time: number, isAccent: boolean): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1600 : 1000, time);

    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }
}

export const guitarAudio = new GuitarAudioEngine();
