// High-Precision Web Audio API Engine with Karplus-Strong Synthesis and Clock-Based Scheduler
import type { ChordPosition } from '../types/guitar';

const STANDARD_OPEN_FREQS = [
  82.41,  // String 6: E2 (Low E)
  110.00, // String 5: A2
  146.83, // String 4: D3
  196.00, // String 3: G3
  246.94, // String 2: B3
  329.63  // String 1: E4 (High E)
];

class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private currentStringFreqs = [...STANDARD_OPEN_FREQS];

  // Lookahead Metronome Scheduler state
  private metronomeTimerId: number | null = null;
  private nextBeatTime = 0.0;
  private currentBeat = 0;
  private bpm = 100;
  private isMetronomeRunning = false;
  private onBeatCallback: ((beat: number) => void) | null = null;

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
  }

  /**
   * Strum a chord across active strings with precise Web Audio micro-delays (18-28ms)
   */
  public async strumChord(
    position: ChordPosition,
    direction: 'down' | 'up' = 'down',
    speedMs = 24,
    _isMuted?: boolean,
    onStringPlay?: (strIdx: number) => void
  ): Promise<void> {
    await this.resume();
    if (!this.ctx) return;

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

    // Classical P-I-M-A arpeggio: bass note then strings 3, 2, 1
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
