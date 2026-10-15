// Web Audio API Karplus-Strong Acoustic Guitar Synthesis Engine
import type { ChordPosition } from '../types/guitar';

const OPEN_STRING_FREQS = [
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

  private init() {
    if (this.isInitialized && this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master gain with mild compression limiter
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    this.isInitialized = true;
  }

  // Ensure AudioContext is running after user interaction
  private async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Calculate pitch frequency for string (0-indexed: 0 = Low E, 5 = High E) and fret
  public getFrequency(stringIdx: number, fret: number): number {
    const baseFreq = OPEN_STRING_FREQS[stringIdx];
    return baseFreq * Math.pow(2, fret / 12);
  }

  // Synthesize single acoustic guitar string pluck using Karplus-Strong Algorithm
  public async pluckNote(stringIdx: number, fret: number, velocity = 0.8): Promise<void> {
    if (fret < 0) return; // Muted string
    await this.resume();
    if (!this.ctx || !this.masterGain) return;

    const freq = this.getFrequency(stringIdx, fret);
    const sampleRate = this.ctx.sampleRate;
    const periodLength = Math.round(sampleRate / freq);
    const duration = Math.min(3.5, Math.max(1.5, 250 / freq)); // Lower notes sustain longer

    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const channelData = buffer.getChannelData(0);

    // Initial pluck excitation (filtered burst of noise for warm pick attack)
    const noiseBurst = new Float32Array(periodLength);
    for (let i = 0; i < periodLength; i++) {
      noiseBurst[i] = (Math.random() * 2 - 1) * velocity;
    }

    // Karplus-Strong feedback loop with low-pass damping
    const damping = 0.992 - (freq / 10000); // Higher frequencies decay faster
    for (let i = 0; i < periodLength; i++) {
      channelData[i] = noiseBurst[i];
    }

    for (let i = periodLength; i < channelData.length; i++) {
      const prev = channelData[i - periodLength];
      const prevMinus1 = channelData[i - periodLength - 1] || 0;
      // Damped average
      channelData[i] = 0.5 * (prev + prevMinus1) * damping;
    }

    // Node playback
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Body resonance filter (acoustic guitar wood body simulation ~110Hz and ~220Hz resonance)
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.value = 180;
    bodyFilter.Q.value = 1.2;
    bodyFilter.gain.value = 4.0;

    const highDamp = this.ctx.createBiquadFilter();
    highDamp.type = 'lowpass';
    highDamp.frequency.value = 4500;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(velocity, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(bodyFilter);
    bodyFilter.connect(highDamp);
    highDamp.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
  }

  // Strum a chord across the 6 strings (direction: 'down' = 6th to 1st, 'up' = 1st to 6th)
  public async strumChord(position: ChordPosition, direction: 'down' | 'up' = 'down', speedMs = 30): Promise<void> {
    await this.resume();
    const stringIndices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];

    stringIndices.forEach((strIdx, i) => {
      const fret = position.frets[strIdx];
      if (fret >= 0) {
        setTimeout(() => {
          // Dynamic pluck variation (slightly louder bass, softer treble)
          const vel = 0.7 + (Math.random() * 0.15);
          this.pluckNote(strIdx, fret, vel);
        }, i * speedMs);
      }
    });
  }

  // Play metronome click
  public async playClick(isHigh = false): Promise<void> {
    await this.resume();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1600 : 1000, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const guitarAudio = new GuitarAudioEngine();
