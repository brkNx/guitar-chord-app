import { SAMPLE_SONGS } from '../src/data/sampleSongs';
import { parseChordPro } from '../src/utils/chordPro';

const pus = SAMPLE_SONGS[0];
const parsed = parseChordPro(pus.content);
const events: any[] = [];
parsed.forEach((line, lineIdx) => {
  if (line.type === 'chord-lyric' && line.segments) {
    line.segments.forEach((seg, segIdx) => {
      if (seg.chord) events.push({ lineIdx, segIdx, chord: seg.chord, lyric: seg.lyric });
    });
  }
});

console.log('Total Chord Events in Content:', events.length);
console.log('Total Timings in song.timings:', pus.timings?.length);

events.forEach((ev, i) => {
  const t = pus.timings?.[i];
  console.log(
    `#${i.toString().padStart(2, ' ')} | Event: ${ev.chord.padEnd(5, ' ')} "${ev.lyric.trim()}" | Timing: ${t ? `${t.time.toFixed(1)}s ${t.chord}` : 'MISSING'}`
  );
});
