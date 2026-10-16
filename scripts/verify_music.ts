import { SAMPLE_SONGS } from '../src/data/sampleSongs';
import { CHORD_LIBRARY, getOrGenerateChord } from '../src/data/chordLibrary';
import { extractUniqueChords, parseChordPro } from '../src/utils/chordPro';
import { getChordTheoryDetails } from '../src/utils/chordTheory';

console.log('Total songs:', SAMPLE_SONGS.length);

let totalErrors = 0;

for (const song of SAMPLE_SONGS) {
  const chords = extractUniqueChords(song.content, 0);
  console.log(`\nChecking: "${song.title}" (${song.artist}) - Key: ${song.key}`);
  console.log(`Chords: [${chords.join(', ')}]`);

  for (const c of chords) {
    if (!CHORD_LIBRARY[c]) {
      console.error(`  [ERROR] Missing in CHORD_LIBRARY: ${c}`);
      totalErrors++;
    } else {
      const def = CHORD_LIBRARY[c];
      def.positions.forEach((p, idx) => {
        if (!p.frets || p.frets.length !== 6) {
          console.error(`  [ERROR] ${c} pos #${idx} has invalid frets length: ${p.frets?.length}`);
          totalErrors++;
        }
        if (!p.fingers || p.fingers.length !== 6) {
          console.error(`  [ERROR] ${c} pos #${idx} has invalid fingers length: ${p.fingers?.length}`);
          totalErrors++;
        }
        try {
          const theory = getChordTheoryDetails(c, p);
          if (!theory || !theory.formula) {
            console.error(`  [ERROR] ${c} pos #${idx} theory generation failed`);
            totalErrors++;
          }
        } catch (err) {
          console.error(`  [ERROR] ${c} pos #${idx} threw theory error:`, err);
          totalErrors++;
        }
      });
    }
  }

  if (song.timings && song.timings.length > 0) {
    const parsed = parseChordPro(song.content, 0);
    const events: { chord: string }[] = [];
    parsed.forEach((line) => {
      if (line.type === 'chord-lyric' && line.segments) {
        line.segments.forEach((seg) => {
          if (seg.chord) events.push({ chord: seg.chord });
        });
      }
    });

    if (events.length !== song.timings.length) {
      console.error(`  [ERROR] Mismatch between chord events (${events.length}) and timings (${song.timings.length}) in "${song.title}"`);
      totalErrors++;
    }

    let lastTime = -1;
    for (let i = 0; i < song.timings.length; i++) {
      const t = song.timings[i];
      if (t.time < lastTime) {
        console.error(`  [ERROR] Non-monotonic timing at index ${i}: ${t.time} < ${lastTime}`);
        totalErrors++;
      }
      lastTime = t.time;
      if (events[i] && events[i].chord !== t.chord) {
        console.error(`  [ERROR] Timing #${i} chord mismatch: event="${events[i].chord}" vs timing="${t.chord}" at time ${t.time}s`);
        totalErrors++;
      }
    }
  }
}

console.log('\n======================================');
console.log(`Verification complete. Total errors found: ${totalErrors}`);
console.log('======================================');
if (totalErrors > 0) {
  process.exit(1);
}
