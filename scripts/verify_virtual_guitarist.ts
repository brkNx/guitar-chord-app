import { STRUM_PATTERNS } from '../src/data/strumPatterns';
import { getOrGenerateChord } from '../src/data/chordLibrary';
import { guitarAudio } from '../src/audio/guitarAudio';
import { SAMPLE_SONGS } from '../src/data/sampleSongs';

console.log('=== VERIFYING VIRTUAL GUITARIST & RHYTHMIC ENGINE ===\n');

let totalErrors = 0;

// 1. Verify Strum Patterns
console.log('1. Checking Strum Patterns...');
const fingerpickingPattern = STRUM_PATTERNS.find((p) => p.id === 'acoustic_fingerpicking_4_4');
if (!fingerpickingPattern) {
  console.error('[ERROR] acoustic_fingerpicking_4_4 pattern is missing!');
  totalErrors++;
} else {
  console.log(`  ✓ Found pattern: ${fingerpickingPattern.name} (${fingerpickingPattern.strokes.length} strokes)`);
  if (fingerpickingPattern.strokes.length !== 8) {
    console.error(`  [ERROR] Expected 8 strokes, found ${fingerpickingPattern.strokes.length}`);
    totalErrors++;
  }
}

// 2. Check Sufle - Pus Chords for Fingerpicking Arpeggio
console.log('\n2. Checking Sufle - Pus Chords Fingerpicking Mapping...');
const pusSong = SAMPLE_SONGS.find((s) => s.id === 'sufle-pus');
if (!pusSong) {
  console.error('[ERROR] Sufle - Pus song not found!');
  totalErrors++;
} else {
  console.log(`  ✓ Song: ${pusSong.title} (${pusSong.tempo} BPM, Key: ${pusSong.key})`);
  const chords = ['Bm', 'D', 'G', 'Em', 'F#'];
  chords.forEach((chordName) => {
    const chordDef = getOrGenerateChord(chordName);
    const pos = chordDef.positions[0];
    if (!pos) {
      console.error(`  [ERROR] No position for chord: ${chordName}`);
      totalErrors++;
      return;
    }

    const bassIdx = pos.frets.findIndex((f) => f >= 0);
    const expectedBass: Record<string, number> = {
      Bm: 1, // 5th string (A string)
      D: 2,  // 4th string (D string)
      G: 0,  // 6th string (Low E)
      Em: 0, // 6th string (Low E)
      'F#': 0 // 6th string (Low E)
    };

    if (expectedBass[chordName] !== undefined && bassIdx !== expectedBass[chordName]) {
      console.error(`  [ERROR] ${chordName} root bass string is ${bassIdx}, expected ${expectedBass[chordName]}`);
      totalErrors++;
    } else {
      console.log(`  ✓ ${chordName}: frets=[${pos.frets.join(', ')}] -> Root bass string ${bassIdx} (${pos.frets[bassIdx]} fret)`);
    }
  });
}

// 3. Check Virtual Guitarist Engine API & Listeners
console.log('\n3. Checking Virtual Guitarist Engine API & State...');
if (typeof guitarAudio.startVirtualGuitarist !== 'function') {
  console.error('[ERROR] guitarAudio.startVirtualGuitarist is not a function!');
  totalErrors++;
}
if (typeof guitarAudio.stopVirtualGuitarist !== 'function') {
  console.error('[ERROR] guitarAudio.stopVirtualGuitarist is not a function!');
  totalErrors++;
}
if (typeof guitarAudio.addNoteListener !== 'function') {
  console.error('[ERROR] guitarAudio.addNoteListener is not a function!');
  totalErrors++;
}
if (typeof guitarAudio.onVirtualStep !== 'function') {
  console.error('[ERROR] guitarAudio.onVirtualStep is not a function!');
  totalErrors++;
}

console.log('  ✓ API methods verified.');

console.log('\n======================================');
console.log(`Virtual Guitarist verification complete. Errors: ${totalErrors}`);
console.log('======================================');

if (totalErrors > 0) {
  process.exit(1);
}
