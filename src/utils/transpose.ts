// Advanced Music Theory, Key-Aware Enharmonic Transpose and Capo Engine

export const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Key signatures that conventionally prefer Flat (b) spellings
export const FLAT_KEYS = new Set([
  'F', 'Dm',
  'Bb', 'Gm',
  'Eb', 'Cm',
  'Ab', 'Fm',
  'Db', 'Bbm',
  'Gb', 'Ebm'
]);

// Map any note name to chromatic index (0 = C, 1 = C#/Db, ..., 11 = B)
export function noteToIndex(note: string): number {
  if (!note) return -1;
  const clean = note.trim();
  const sharpIdx = SHARP_NOTES.indexOf(clean);
  if (sharpIdx !== -1) return sharpIdx;
  const flatIdx = FLAT_NOTES.indexOf(clean);
  if (flatIdx !== -1) return flatIdx;
  return -1;
}

// Convert index (0..11) to note name, respecting key signature flat/sharp conventions
export function indexToNote(idx: number, preferFlats = false): string {
  const normalized = ((idx % 12) + 12) % 12;
  return preferFlats ? FLAT_NOTES[normalized] : SHARP_NOTES[normalized];
}

// Check if a musical key prefers flat notation
export function isFlatKey(key: string): boolean {
  if (!key) return false;
  return FLAT_KEYS.has(key.trim());
}

/**
 * Transpose a single root note by semitones delta (-11 to +11), respecting key context
 */
export function transposeNote(note: string, semitones: number, targetKey = ''): string {
  const idx = noteToIndex(note);
  if (idx === -1) return note;

  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  const preferFlats = targetKey ? isFlatKey(targetKey) : (note.includes('b') || note === 'F');
  return indexToNote(newIdx, preferFlats);
}

/**
 * Transpose any complex chord including Slash chords (e.g. C/G, D/F#, Am7/G, F#m7b5)
 */
export function transposeChord(chord: string, semitones: number, targetKey = ''): string {
  if (!chord || semitones === 0) return chord;
  const trimmed = chord.trim();

  // Handle Slash chords (e.g. C/G -> transpose C and transpose G)
  if (trimmed.includes('/')) {
    const [mainChord, bassNote] = trimmed.split('/');
    const transposedMain = transposeChord(mainChord, semitones, targetKey);
    const transposedBass = transposeNote(bassNote, semitones, targetKey);
    return `${transposedMain}/${transposedBass}`;
  }

  // Parse root note and chord quality suffix (e.g. "F#" and "m7b5", or "Bb" and "maj7")
  const match = trimmed.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, suffix] = match;
  const newRoot = transposeNote(root, semitones, targetKey);
  return `${newRoot}${suffix}`;
}

/**
 * Capo calculation helpers
 * 
 * Concert pitch (duyulan ses) = Chord Shape + Capo Fret
 * e.g. Shape "Am" + Capo 2 -> Sounds as "Bm"
 */
export function getConcertPitchChord(shapeChord: string, capoFret: number, targetKey = ''): string {
  if (capoFret <= 0) return shapeChord;
  return transposeChord(shapeChord, capoFret, targetKey);
}

/**
 * Given a sounding key, calculate the chord shape when Capo is applied
 * e.g. Concert "G" with Capo 2 -> Play "F" shape
 */
export function getShapeChord(concertChord: string, capoFret: number, targetKey = ''): string {
  if (capoFret <= 0) return concertChord;
  return transposeChord(concertChord, -capoFret, targetKey);
}

/**
 * Smart Capo Advisor:
 * Finds the optimal capo position (0-7) to convert difficult barre keys (F, Eb, Ab, Bbm)
 * into friendly beginner cowboy chord shapes (G, C, D, Em, Am).
 */
export interface CapoAdvice {
  recommendedCapo: number;
  shapeKey: string;
  reason: string;
}

const FRIENDLY_KEYS = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A'];

export function getCapoRecommendation(concertKey: string): CapoAdvice {
  if (!concertKey) return { recommendedCapo: 0, shapeKey: concertKey, reason: 'Standart akort' };

  const cleanKey = concertKey.trim();

  // If already beginner-friendly, no capo needed
  if (FRIENDLY_KEYS.includes(cleanKey)) {
    return { recommendedCapo: 0, shapeKey: cleanKey, reason: 'Açık akorlarla kolay çalınabilir' };
  }

  // Check capos 1 through 7
  for (let capo = 1; capo <= 7; capo++) {
    const shape = transposeChord(cleanKey, -capo);
    if (FRIENDLY_KEYS.includes(shape)) {
      return {
        recommendedCapo: capo,
        shapeKey: shape,
        reason: `${capo}. perdeye kapo takarak ${shape} pozisyonunda rahatça çalabilirsiniz.`
      };
    }
  }

  return { recommendedCapo: 0, shapeKey: concertKey, reason: 'Standart pozisyon' };
}
