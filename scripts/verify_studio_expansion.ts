import { autoCorrelate, calculateCents, matchTuningTarget, type TunerStringTarget } from '../src/audio/pitchDetection';
import { GUITAR_TUNINGS, getTuningById } from '../src/data/tunings';
import { CAGED_BOXES, getCagedBoxFretRange, getFretShapesIntervalStyle } from '../src/data/caged';
import { GUITAR_SCALES, getScaleNotes, getScaleNoteInfo, extractRootNote } from '../src/data/scales';
import { ROCKSTAR_FINGERS } from '../src/data/rockstar';
import { NOTES, getOrGenerateChord } from '../src/data/chordLibrary';

console.log('=== VERIFYING GUITARTUNA, FRETSHAPES & ROCKSTAR EXPANSION ===\n');

let totalErrors = 0;

// 1. Verify Pitch Detection Engine with Synthetic Guitar Frequencies (Standard + Low Drop A)
console.log('1. Testing Autocorrelation Pitch Detection...');
const sampleRates = [44100, 48000];
const testFreqs = [55.00, 73.42, 82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

sampleRates.forEach((sampleRate) => {
  console.log(`  Checking sample rate: ${sampleRate} Hz...`);
  testFreqs.forEach((targetFreq) => {
    const numSamples = 4096;
    const buffer = new Float32Array(numSamples);
    // Generate synthetic guitar tone with fundamental and prominent harmonics
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      buffer[i] = 0.6 * Math.sin(2 * Math.PI * targetFreq * t) +
                  0.3 * Math.sin(4 * Math.PI * targetFreq * t) +
                  0.1 * Math.sin(6 * Math.PI * targetFreq * t);
    }

    const { freq, clarity } = autoCorrelate(buffer, sampleRate, 0.8);
    const errorPercent = Math.abs((freq - targetFreq) / targetFreq) * 100;

    if (errorPercent > 2.0 || clarity < 0.82) {
      console.error(`  [ERROR] Detection failed for ${targetFreq} Hz at ${sampleRate}Hz: got ${freq.toFixed(2)} Hz (clarity: ${clarity.toFixed(2)})`);
      totalErrors++;
    } else {
      console.log(`  ✓ Frequency ${targetFreq.toFixed(2)} Hz detected as ${freq.toFixed(2)} Hz (clarity: ${clarity.toFixed(2)}, error: ${errorPercent.toFixed(2)}%)`);
    }
  });
});

// 2. Verify Cents and Tuning Target Matching
console.log('\n2. Testing Cents Deviation & Target Matching...');
const standardTuning = getTuningById('standard');
const targets: TunerStringTarget[] = standardTuning.notes.map((note, idx) => ({
  stringIdx: idx,
  note,
  octave: standardTuning.octaves[idx],
  frequency: standardTuning.frequencies[idx]
}));

// Test perfect E2
const resultE2 = matchTuningTarget(82.41, targets);
if (!resultE2 || !resultE2.inTune || Math.abs(resultE2.diffCents) > 1) {
  console.error('  [ERROR] Exact E2 pitch did not match inTune');
  totalErrors++;
} else {
  console.log(`  ✓ Exact E2 matched: ${resultE2.stringNote}${resultE2.octave} (diff: ${resultE2.diffCents}¢, inTune: ${resultE2.inTune})`);
}

// Test slightly sharp A2 (+15 cents)
const sharpA2Freq = 110.0 * Math.pow(2, 15 / 1200);
const resultA2 = matchTuningTarget(sharpA2Freq, targets);
if (!resultA2 || resultA2.diffCents !== 15 || resultA2.inTune) {
  console.error(`  [ERROR] Sharp A2 (+15 cents) mismatch: got ${resultA2?.diffCents}¢`);
  totalErrors++;
} else {
  console.log(`  ✓ Sharp A2 matched: ${resultA2.stringNote}${resultA2.octave} (diff: +${resultA2.diffCents}¢, sharp detected)`);
}

// 3. Verify CAGED Box Calculations & Fret Ranges across all 12 Root Notes strictly <= 14 frets
console.log('\n3. Testing CAGED 5-Box Systems & Fret Ranges...');
const allRoots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

allRoots.forEach((root) => {
  for (let box = 1; box <= 5; box++) {
    const range = getCagedBoxFretRange(root, box);
    if (range.minFret < 0 || range.maxFret > 14 || range.minFret >= range.maxFret) {
      console.error(`  [ERROR] Invalid CAGED box range for root ${root} box ${box}: [${range.minFret}, ${range.maxFret}]`);
      totalErrors++;
    }
  }
});
console.log(`  ✓ Verified all 5 CAGED boxes across all ${allRoots.length} chromatic roots strictly within 0..14 frets.`);

// 4. Verify fretShapes Interval Colorings
console.log('\n4. Testing fretShapes Interval Badge Styles...');
const degrees = ['R', '1', 'b3', '3', '4', 'b5', '5', 'b7', '7'];
degrees.forEach((d) => {
  const style = getFretShapesIntervalStyle(d);
  if (!style.fill || !style.badge) {
    console.error(`  [ERROR] Missing fretShapes style for degree "${d}"`);
    totalErrors++;
  }
});
console.log(`  ✓ Verified ${degrees.length} scale interval degrees with fretShapes high-contrast color codes.`);

// 5. Verify RockStar Finger Badges and Chords
console.log('\n5. Testing RockStar Colored Finger Placement Badges...');
[1, 2, 3, 4, 5].forEach((fingerNum) => {
  const finger = ROCKSTAR_FINGERS[fingerNum];
  if (!finger || !finger.bg || !finger.nameTr) {
    console.error(`  [ERROR] Missing finger definition for #${fingerNum}`);
    totalErrors++;
  } else {
    console.log(`  ✓ Finger ${fingerNum} (${finger.nameTr}): color=${finger.bg}, label=${finger.label}`);
  }
});

// Verify RockStar rendering for sample chords
const rockStarChords = ['Bm', 'G', 'D', 'Em', 'F#', 'Am', 'C', 'Dsus4'];
rockStarChords.forEach((chordName) => {
  const def = getOrGenerateChord(chordName);
  if (!def || !def.positions[0]) {
    console.error(`  [ERROR] Failed to generate chord definition for ${chordName}`);
    totalErrors++;
  }
});
console.log(`  ✓ Verified ${rockStarChords.length} RockStar chords.`);

console.log('\n======================================');
console.log(`Studio Expansion Verification Complete: Total errors: ${totalErrors}`);
console.log('======================================');

if (totalErrors > 0) {
  process.exit(1);
}
