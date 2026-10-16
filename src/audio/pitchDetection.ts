// High-Precision Pitch Detection Engine using Autocorrelation with Parabolic Interpolation
// Designed for real-time acoustic & electric guitar tuning (60 Hz - 500 Hz)

export interface PitchDetectionResult {
  detectedHz: number;
  targetHz: number;
  stringIdx: number;
  stringNote: string;
  octave: number;
  diffCents: number;
  inTune: boolean;
  clarity: number;
  volume: number;
}

export interface TunerStringTarget {
  stringIdx: number; // 0 = 6th string (low), 5 = 1st string (high)
  note: string;
  octave: number;
  frequency: number;
}

/**
 * Autocorrelation algorithm with normalized square difference and parabolic interpolation.
 * Optimized for guitar fundamental frequencies.
 */
export function autoCorrelate(
  buffer: Float32Array,
  sampleRate: number,
  clarityThreshold = 0.82
): { freq: number; clarity: number; rms: number } {
  const SIZE = buffer.length;

  // 1. Compute RMS to detect signal presence
  let sumSquare = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumSquare += val * val;
  }
  const rms = Math.sqrt(sumSquare / SIZE);

  // Ignore ambient silence or noise floor
  if (rms < 0.008) {
    return { freq: -1, clarity: 0, rms };
  }

  // 2. Define search range for guitar frequencies: 50 Hz (Drop A / Drop C) to 700 Hz (High E / harmonics)
  const minFreq = 50;
  const maxFreq = 700;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.ceil(sampleRate / minFreq);

  // Guard against insufficient buffer size
  if (SIZE <= maxPeriod + 2) {
    return { freq: -1, clarity: 0, rms };
  }

  // 3. Compute normalized autocorrelation across period range
  // We scan from minPeriod - 1 to maxPeriod + 1 so peak detection and parabolic interpolation
  // at boundary periods have valid adjacent points.
  const scanMin = Math.max(1, minPeriod - 1);
  const scanMax = Math.min(SIZE - 2, maxPeriod + 1);
  const correlations = new Float32Array(scanMax + 2);
  let globalMax = -1;

  for (let period = scanMin; period <= scanMax; period++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < SIZE - period; i++) {
      const v1 = buffer[i];
      const v2 = buffer[i + period];
      correlation += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    const norm = Math.sqrt(norm1 * norm2);
    const normalizedCorr = norm > 0 ? correlation / norm : 0;
    correlations[period] = normalizedCorr;

    if (period >= minPeriod && period <= maxPeriod && normalizedCorr > globalMax) {
      globalMax = normalizedCorr;
    }
  }

  if (globalMax < clarityThreshold) {
    return { freq: -1, clarity: Math.max(0, globalMax), rms };
  }

  // 4. McLeod Pitch Method (MPM) Peak Picking:
  // Find local maxima and select the FIRST peak that reaches at least 90% of globalMax.
  // This fundamental peak picking rule reliably prevents octave halving (subharmonic lock)
  // on strings with strong 2nd/3rd harmonics (such as D3, B3, E4) while avoiding false
  // 2nd-harmonic locks on low strings.
  const peakThreshold = Math.max(clarityThreshold * 0.90, globalMax * 0.90);
  let chosenPeriod = -1;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    const val = correlations[period];
    if (val >= peakThreshold && val > correlations[period - 1] && val >= correlations[period + 1]) {
      chosenPeriod = period;
      break;
    }
  }

  // Fallback to highest correlation period if no distinct local peak exceeded the threshold
  if (chosenPeriod === -1) {
    let bestP = minPeriod;
    let bestV = -1;
    for (let period = minPeriod; period <= maxPeriod; period++) {
      if (correlations[period] > bestV) {
        bestV = correlations[period];
        bestP = period;
      }
    }
    chosenPeriod = bestP;
  }

  // 5. Parabolic interpolation around chosen peak to achieve sub-sample frequency accuracy
  let refinedPeriod = chosenPeriod;
  if (chosenPeriod > scanMin && chosenPeriod < scanMax) {
    const y1 = correlations[chosenPeriod - 1];
    const y2 = correlations[chosenPeriod];
    const y3 = correlations[chosenPeriod + 1];

    const denom = 2 * (2 * y2 - y1 - y3);
    if (denom !== 0) {
      const delta = (y3 - y1) / denom;
      if (Math.abs(delta) < 1) {
        refinedPeriod = chosenPeriod + delta;
      }
    }
  }

  const freq = sampleRate / refinedPeriod;
  const clarity = Math.min(1, Math.max(0, correlations[chosenPeriod]));
  return { freq, clarity, rms };
}

/**
 * Calculates deviation in cents: 1200 * log2(detected / target)
 */
export function calculateCents(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0;
  return 1200 * (Math.log(detectedHz / targetHz) / Math.LN2);
}

/**
 * Finds closest string in tuning or matches manual string target
 */
export function matchTuningTarget(
  detectedHz: number,
  targets: TunerStringTarget[],
  manualIdx?: number
): PitchDetectionResult | null {
  if (detectedHz <= 0 || targets.length === 0) return null;

  let target: TunerStringTarget;

  if (manualIdx !== undefined && manualIdx >= 0 && manualIdx < targets.length) {
    target = targets[manualIdx];
  } else {
    // Find closest string in tuning by minimum cents distance
    let bestDist = Infinity;
    let bestTarget = targets[0];

    for (const t of targets) {
      const cents = Math.abs(calculateCents(detectedHz, t.frequency));
      if (cents < bestDist) {
        bestDist = cents;
        bestTarget = t;
      }
    }
    target = bestTarget;
  }

  const diffCents = calculateCents(detectedHz, target.frequency);
  const clampedCents = Math.max(-50, Math.min(50, diffCents));
  const inTune = Math.abs(diffCents) <= 3.0;

  return {
    detectedHz: Math.round(detectedHz * 10) / 10,
    targetHz: Math.round(target.frequency * 10) / 10,
    stringIdx: target.stringIdx,
    stringNote: target.note,
    octave: target.octave,
    diffCents: Math.round(clampedCents),
    inTune,
    clarity: 1,
    volume: 1
  };
}
